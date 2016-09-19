(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.init = init;

var _Stops = require('./orm/Stops.js');

var Stops = _interopRequireWildcard(_Stops);

var _Trips = require('./orm/Trips.js');

var Trips = _interopRequireWildcard(_Trips);

var _http = require('./http.js');

var Http = _interopRequireWildcard(_http);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Interactive elements in the page
var departures, arrivals, submitButton;

/* 
  Add the options to the datalist elements in the form.
*/
function addStops(stops) {

  stops.forEach(function (stop) {

    var option = '<option value="' + stop.stop_name + ' - ' + stop.stop_id + '"></option>';
    departures.innerHTML += option;
    arrivals.innerHTML += option;
  });
}

/*
  Template to create the rows in the route results table
*/
function createOptionHTML(_ref) {
  var _ref2 = _slicedToArray(_ref, 2);

  var departureTime = _ref2[0];
  var arrivalTime = _ref2[1];


  var durationInSeconds = timeToSeconds(arrivalTime[0].arrival_time) - timeToSeconds(departureTime[0].arrival_time);
  var duration = secondsToTime(durationInSeconds);

  return '<div class="row">\n            <div class="col-33 cell">\n              ' + departureTime[0].stop_id + ' - ' + departureTime[0].arrival_time + '\n            </div>\n            <div class="col-33 cell">\n              ' + arrivalTime[0].stop_id + ' - ' + arrivalTime[0].arrival_time + '\n            </div>\n            <div class="col-33 cell">\n              ' + duration + '\n            </div>\n          </div>';
}

/*
  Template for each route/service in the results 
*/
function createServiceHTML(route, options) {

  return '<div class="">\n            Route: ' + route.route_id + '\n          </div>\n          <div class="">\n            Service: ' + route.service_id + '\n          </div>\n          <div class="table"> \n              <div class="row"> \n                <div class="col-33 cell">Depart. - Time</div>\n                <div class="col-33 cell">Arriv. - Time</div>\n                <div class="col-33 cell">Duration</div>\n              </div>\n              ' + options[route.service_id] + '\n              <hr>\n          </div>';
}

/*
  Show the results from the routes found: route, service_id and available times with trip duration for the
  selected stops.
*/
function showTripTimes(departure_id, arrival_id, stop_times, routes) {

  var container = document.getElementById('route-result');
  var results = document.getElementById('timetable');
  results.innerHTML = '';
  container.style.opacity = 1;

  var uniqueRoutes = [];
  var options = [];
  var tripsPromises = [];

  // Get the times for each trip
  routes.forEach(function (route) {

    options[route.service_id] = '';

    // get only the trips of this service
    var routeTrips = stop_times.filter(function (stop) {
      return stop.trip.service_id == route.service_id;
    });

    // create a row for each trip
    routeTrips.forEach(function (trip) {

      var departurePromise = Trips.getStopInTripTime(departure_id, trip.trip_id);
      var arrivalPromise = Trips.getStopInTripTime(arrival_id, trip.trip_id);

      tripsPromises.push(Promise.all([departurePromise, arrivalPromise]).then(createOptionHTML).then(function (html) {
        options[route.service_id] += html;
      }));
    });
  });

  // when all trips are finished create html for each route, adding the times calculated for each trip
  Promise.all(tripsPromises).then(function () {

    routes.forEach(function (route, index) {

      if (uniqueRoutes.indexOf(route.service_id) == -1) {

        uniqueRoutes.push(route.service_id);
        results.innerHTML += createServiceHTML(route, options);
      }
    });
  });
}

/*
  Shows a message in the message-box element.
*/
function showInfoMessage(message, type) {

  var messageBox = document.getElementById('message-box');
  messageBox.innerHTML = message;

  messageBox.className = 'alert';

  switch (type) {
    case 'error':
      messageBox.className += ' error';
      break;
    default:
      messageBox.className += ' info';
      break;
  }
}

/*
  Makes the message-box element disappear through css class
*/
function clearInfoMessage() {
  var messageBox = document.getElementById('message-box');
  messageBox.className = 'alert';
}

function clearResults() {

  var container = document.getElementById('route-result');
  var results = document.getElementById('timetable');
  results.innerHTML = '';
  container.style.opacity = 0;
}

/*
  Request the stops from server and add them to an array
  to be able to check that the user input is valid.
*/
function loadStops() {

  Stops.getAll().then(addStops);
};

/*
  Get the station code from a string
*/
function getStationCode(station) {

  var parts = station.split('-');

  if (parts.length > 1) {
    // This could be a string from the datalist, extract the code
    return parts[1].trim();
  }

  // This could be a code written by the user
  return station;
}

/*
  Check that a code is either a pair station name - station code 
  from the form datalist or a code of a stop written by the user.
*/
function checkStation(station) {

  var code = getStationCode(station);

  // Check that the code is in the list of stops
  return Stops.getAll().then(function (stops) {
    return stops.some(function check(stop) {
      return stop.stop_id == code;
    });
  });
}

/*
  Takes a time in 00:00:00 format and returns the number of seconds
  from 00:00:00 to the provided time.
*/
function timeToSeconds(time) {

  var timeParts = time.split(':').map(function (num) {
    return parseInt(num);
  });
  return timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
}

function secondsToTime(seconds) {

  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds - hours * 3600) / 60);
  return twoDigits(hours) + ':' + twoDigits(minutes) + ':' + twoDigits(seconds % 60);
}

function twoDigits(number) {

  return number > 9 ? '' + number : '0' + number;
}

/*
  Auxiliary function to find trips that meet the requirements 
   - A valid trip must go to both the departure stop and the arrival stop
   - A valid trip must go first to the departure stop, ie the departure stop time must 
   be before the arrival stop time.
*/
function findMatchingTrips(departureTimes, arrivalTimes) {

  // gets all trips that goes to the departure stop and the arrival stop
  var validTrips = departureTimes.filter(function (departureTrip) {
    return arrivalTimes.some(function (arrivalTrip) {
      return arrivalTrip.trip_id == departureTrip.trip_id && timeToSeconds(departureTrip.arrival_time) < timeToSeconds(arrivalTrip.arrival_time);
    });
  });

  return validTrips;
}

/*
  Finds trips between two stations, returns the trips ids
*/
function findTrips(departureId, arrivalId) {

  return Promise.all([Trips.getTripStopTimes(departureId), Trips.getTripStopTimes(arrivalId)]).then(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2);

    var departureTimes = _ref4[0];
    var arrivalTimes = _ref4[1];


    var stop_times = findMatchingTrips(departureTimes, arrivalTimes);
    return { trips: Trips.appendTripInfo(stop_times), routes: Trips.getRoutesForTrips(stop_times) };
  });
}

/*
  Submit the user selection and show the route if available or an
  error message if no route is available.
*/
function submitStations(evt) {

  evt.preventDefault();
  clearInfoMessage();
  clearResults();

  // get the inputs values
  var departure_id = getStationCode(document.getElementById('departure').value);
  var arrival_id = getStationCode(document.getElementById('arrival').value);

  Promise.all([checkStation(departure_id), checkStation(arrival_id)]).then(function (result) {

    if (!result[0] || !result[1]) {
      showInfoMessage('You have to select a valid departure and arrival stations from the lists or write a valid stop code.', 'error');
      return false;
    }

    // If the departure and arrival stations are correct
    // search for a trip between them and show the times and route
    findTrips(departure_id, arrival_id).then(function (data) {

      Promise.all([data.trips, data.routes]).then(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2);

        var trips = _ref6[0];
        var routes = _ref6[1];


        if (routes.length > 0) {
          showTripTimes(departure_id, arrival_id, trips, routes);
        } else {
          showInfoMessage('We couldn\'t find a trip between these two stations', 'error');
        }
      });
    });

    return false;
  });
}

/*
  Initialize the application 
*/
function init() {

  // get the interactive elements of the interface
  departures = document.getElementById('departure-stops');
  arrivals = document.getElementById('arrival-stops');
  submitButton = document.getElementById('search');

  // Populate datalists and add listeners
  loadStops();
  submitButton.addEventListener('click', submitStations);
};

},{"./http.js":2,"./orm/Stops.js":4,"./orm/Trips.js":5}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.routes = routes;
exports.trips = trips;
exports.stops = stops;
exports.stopTimes = stopTimes;
exports.shapes = shapes;
var baseUrl = '/dist/data/';
var routesFile = 'routes.txt';
var tripsFile = 'trips.txt';
var stopsFile = 'stops.txt';
var stopTimesFile = 'stop_times.txt';
var shapesFile = 'shapes.txt';

var csvToArray = function csvToArray(text) {

  var rows = text.trim().split('\n');
  return rows.map(function (row) {
    return row.split(',');
  });
};

var csvToObjects = function csvToObjects(text) {

  var table = csvToArray(text);
  var keys = table[0];
  table = table.slice(1);

  return table.map(function (row) {
    var obj = {};
    keys.forEach(function (key, index) {
      obj[key] = row[index];
    });
    return obj;
  });
};

function getCsvAsObjects(url) {

  return fetch(url, {
    method: 'GET'
  }).then(function (response) {

    return response.text();
  }).then(function (textContent) {

    return csvToObjects(textContent);
  }).catch(function (error) {

    console.error(error);
  });
}

// API

/*
  Returns a Promise that resolves to an array with the names of the 
  available lines.
*/
function routes() {

  return getCsvAsObjects(baseUrl + routesFile);
};

function trips() {
  // get the route/line and return the times for this line
  return getCsvAsObjects(baseUrl + tripsFile);
};

function stops() {
  // returns the stops of this line
  return getCsvAsObjects(baseUrl + stopsFile);
};

function stopTimes() {
  return getCsvAsObjects(baseUrl + stopTimesFile);
};

function shapes() {
  return getCsvAsObjects(baseUrl + shapesFile);
};

},{}],3:[function(require,module,exports){
'use strict';

var _app = require('./app.js');

var App = _interopRequireWildcard(_app);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

(function () {
  'use strict';

  function registerServiceWorker() {

    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register('./service_worker.js', { scope: '/' }).then(function (reg) {
      //console.log('Registration worked!', reg);

      if (!navigator.serviceWorker.controller) {
        return;
      }
    }).catch(function (error) {

      console.error('Registration failed!', error);
    });
  }

  function ready() {

    return new Promise(function (resolve, reject) {

      // resolve the promise when the document is ready
      document.addEventListener('readystatechange', function () {
        if (document.readyState !== 'loading') {
          resolve();
        }
      });
    });
  };

  ready().then(function () {
    App.init();
    registerServiceWorker();
  });
})();

},{"./app.js":1}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setStops = setStops;
exports.getAll = getAll;

var _http = require('../http.js');

var Http = _interopRequireWildcard(_http);

var _db = require('./db.js');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var waitingForNetwork = false;
// If indexedDB is populated, get the data and try to update from network
// else try to get the data from network and save it
// else we should show a custom error message to the user, the app is nota available.
function setStops() {

  return (0, _db2.default)().then(function (db) {

    if (!db) throw 'We couldn\'t access IndexedDB';

    var transaction = db.transaction('trips');
    var tripsStore = transaction.objectStore('trips');

    return tripsStore.count();
  }).then(function (result) {

    // if there is something in the db, don't bother in getting the data again from network
    if (result > 0 || waitingForNetwork) {
      return Promise.resolve();
    }

    waitingForNetwork = true;

    // if there is nothing in the trips and times table, fill them!
    return Http.stops().then(storeStops);
  });
}

function storeStops(results) {

  if (results) {

    return (0, _db2.default)().then(function storeStopsInIDB(db) {

      var transaction = db.transaction('stops', 'readwrite');
      var stopsStore = transaction.objectStore('stops');

      results.forEach(function (stop) {
        stopsStore.put(stop);
      });

      return transaction.complete;
    }).catch(function (error) {

      console.error(error);
    });
  }
}

/*
  Get all the stops
*/
function getAll(stop_id) {

  return setStops().then(function () {
    return (0, _db2.default)();
  }).then(function getStops(db) {

    var transaction = db.transaction('stops');
    var stopsStore = transaction.objectStore('stops');

    return stopsStore.getAll();
  });
};

},{"../http.js":2,"./db.js":6}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRoutesForStop = getRoutesForStop;
exports.appendTripInfo = appendTripInfo;
exports.getRoutesForTrips = getRoutesForTrips;
exports.getTripStopTimes = getTripStopTimes;
exports.getStopInTripTime = getStopInTripTime;

var _http = require('../http.js');

var Http = _interopRequireWildcard(_http);

var _db = require('./db.js');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/*
  This function checks that the data is in IndexedDB, if not, it gets it from network/cache
  and returns a promise that resolves when the data is stored in IDB.
  This way we don't need any initialization function, just call this function in each retrieving
  method and it will get sure that everything is set up before trying to get the content.
*/
var waitingForNetwork = false;

function setTrips() {

  return (0, _db2.default)().then(function (db) {

    if (!db) throw 'We couldn\'t access IndexedDB';

    var transaction = db.transaction('trips');
    var tripsStore = transaction.objectStore('trips');

    return tripsStore.count();
  }).then(function (result) {

    // if there is something in the db, don't bother in getting the data again from network
    if (result > 0 || waitingForNetwork) {
      return Promise.resolve();
    }

    waitingForNetwork = true;

    // if there is nothing in the trips and times table, fill them!
    return Http.stopTimes().then(storeStopTimes).then(Http.trips).then(storeTrips);
  });
}

function storeStopTimes(results) {

  if (results) {

    return (0, _db2.default)().then(function storeTripsInIDB(db) {

      var transaction = db.transaction('stop_times', 'readwrite');
      var tripsStore = transaction.objectStore('stop_times');

      results.forEach(function (trip) {
        tripsStore.put(trip);
      });

      return transaction.complete;
    }).catch(function (error) {

      // the transaction didn't complete, so the table should be empty
      console.error(error);
    });
  }
}

function storeTrips(results) {

  if (results) {

    return (0, _db2.default)().then(function storeTripsInIDB(db) {

      var transaction = db.transaction('trips', 'readwrite');
      var tripsStore = transaction.objectStore('trips');

      results.forEach(function (trip) {
        tripsStore.put(trip);
      });

      return transaction.complete;
    }).catch(function (error) {

      console.error(error);
    });
  }
}

// If indexedDB is populated, get the data and try to update from network
// else try to get the data from network and save it
// else we should show a custom error message to the user, the app is nota available.

/*
  Get the trips that stop at stop_id, one per route, independently of stop times
*/
function getRoutesForStop(stop_id) {

  return this.getTripsStopTimes(stop_id).then();
};

function appendTripInfo(stop_times) {

  return (0, _db2.default)().then(function getAllRoutes(db) {
    var transaction = db.transaction('trips');
    var tripStore = transaction.objectStore('trips');

    var trips = [];
    stop_times.forEach(function appendTripPromise(trip) {

      trips.push(tripStore.get(trip.trip_id));
    });

    return Promise.all(trips);
  }).then(function (trips) {

    return stop_times.map(function (stop, index) {
      stop.trip = trips[index];
      return stop;
    });
  });
}

function getRoutesForTrips(trips) {

  // get the routes for this trips
  return (0, _db2.default)().then(function getAllRoutes(db) {
    var transaction = db.transaction('trips');
    var tripStore = transaction.objectStore('trips');

    var routes = [];
    trips.forEach(function appendTripPromise(trip) {

      routes.push(tripStore.get(trip.trip_id));
    });

    return Promise.all(routes);
  }).then(function (routes) {

    var service_ids = [];
    var uniqueRoutes = [];
    routes.forEach(function getUniqueServiceIds(trip) {
      if (service_ids.indexOf(trip.service_id) == -1) {
        service_ids.push(trip.service_id);
        uniqueRoutes.push(trip);
      }
    });

    return uniqueRoutes;
  });
};

/*
  Get all the times for a stop
*/
function getTripStopTimes(stop_id) {

  return setTrips().then(function () {
    return (0, _db2.default)();
  }).then(function getTripsForStop(db) {

    var transaction = db.transaction('stop_times');
    var tripsStore = transaction.objectStore('stop_times');
    var stopIndex = tripsStore.index('stop');

    return stopIndex.getAll(stop_id);
  });
};

/*
  Get the time for a stop and a trip
*/
function getStopInTripTime(stop_id, trip_id) {

  return this.getTripStopTimes(stop_id).then(function getTimeForATrip(trips) {
    return trips.filter(function (trip) {
      return trip.trip_id == trip_id;
    });
  });
}

},{"../http.js":2,"./db.js":6}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = db;

var _idb = require('../../node_modules/idb/lib/idb.js');

var _idb2 = _interopRequireDefault(_idb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _db;

// This class works as a ORM that gets the data from indexedDB
function openDatabase() {

  return _idb2.default.open('trains', 1, function (upgradeDb) {

    switch (upgradeDb.oldVersion) {

      case 0:
        upgradeDb.createObjectStore('stops', {
          keyPath: 'stop_id'
        });

        upgradeDb.createObjectStore('trips', { keyPath: 'trip_id' });

        upgradeDb.createObjectStore('stop_times', { autoIncrement: true });

        upgradeDb.createObjectStore('routes', {
          keyPath: 'route_id'
        });

        var tripStore = upgradeDb.transaction.objectStore('stop_times');
        tripStore.createIndex('stop', 'stop_id');
        tripStore.createIndex('trip', 'trip_id');

    }
  });
}

function db() {

  if (_db == null) {
    _db = openDatabase();
  }

  return _db;
};

},{"../../node_modules/idb/lib/idb.js":7}],7:[function(require,module,exports){
'use strict';

(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }
  
  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var request = (this._store || this._index)[funcName].apply(this._store, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      request.onupgradeneeded = function(event) {
        if (upgradeCallback) {
          upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
        }
      };

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
  }
  else {
    self.idb = exp;
  }
}());
},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiLCJhcHAvb3JtL1RyaXBzLmpzIiwiYXBwL29ybS9kYi5qcyIsIm5vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O1FDMlRnQixJLEdBQUEsSTs7QUEzVGhCOztJQUFZLEs7O0FBQ1o7O0lBQVksSzs7QUFDWjs7SUFBWSxJOzs7O0FBRVo7QUFDQSxJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRDs7O0FBR0EsU0FBUyxnQkFBVCxPQUF3RDtBQUFBOztBQUFBLE1BQTdCLGFBQTZCO0FBQUEsTUFBZCxXQUFjOzs7QUFFdEQsTUFBSSxvQkFBb0IsY0FBYyxZQUFZLENBQVosRUFBZSxZQUE3QixJQUE2QyxjQUFjLGNBQWMsQ0FBZCxFQUFpQixZQUEvQixDQUFyRTtBQUNBLE1BQUksV0FBVyxjQUFjLGlCQUFkLENBQWY7O0FBRUEsc0ZBRWMsY0FBYyxDQUFkLEVBQWlCLE9BRi9CLFdBRTRDLGNBQWMsQ0FBZCxFQUFpQixZQUY3RCxtRkFLYyxZQUFZLENBQVosRUFBZSxPQUw3QixXQUswQyxZQUFZLENBQVosRUFBZSxZQUx6RCxtRkFRYyxRQVJkO0FBWUQ7O0FBRUQ7OztBQUdBLFNBQVMsaUJBQVQsQ0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCAqIGFzIFN0b3BzIGZyb20gJy4vb3JtL1N0b3BzLmpzJztcbmltcG9ydCAqIGFzIFRyaXBzIGZyb20gJy4vb3JtL1RyaXBzLmpzJztcbmltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi9odHRwLmpzJztcblxuLy8gSW50ZXJhY3RpdmUgZWxlbWVudHMgaW4gdGhlIHBhZ2VcbnZhciBkZXBhcnR1cmVzLCBhcnJpdmFscywgc3VibWl0QnV0dG9uO1xuXG4vKiBcbiAgQWRkIHRoZSBvcHRpb25zIHRvIHRoZSBkYXRhbGlzdCBlbGVtZW50cyBpbiB0aGUgZm9ybS5cbiovXG5mdW5jdGlvbiBhZGRTdG9wcyhzdG9wcykge1xuXG4gIHN0b3BzLmZvckVhY2goIChzdG9wKSA9PiB7XG4gICAgXG4gICAgdmFyIG9wdGlvbiA9IGA8b3B0aW9uIHZhbHVlPVwiJHtzdG9wLnN0b3BfbmFtZX0gLSAke3N0b3Auc3RvcF9pZH1cIj48L29wdGlvbj5gO1xuICAgIGRlcGFydHVyZXMuaW5uZXJIVE1MICs9IG9wdGlvbjtcbiAgICBhcnJpdmFscy5pbm5lckhUTUwgKz0gb3B0aW9uO1xuXG4gIH0pO1xuXG59XG5cbi8qXG4gIFRlbXBsYXRlIHRvIGNyZWF0ZSB0aGUgcm93cyBpbiB0aGUgcm91dGUgcmVzdWx0cyB0YWJsZVxuKi9cbmZ1bmN0aW9uIGNyZWF0ZU9wdGlvbkhUTUwoW2RlcGFydHVyZVRpbWUsIGFycml2YWxUaW1lXSkge1xuICAgICAgICBcbiAgdmFyIGR1cmF0aW9uSW5TZWNvbmRzID0gdGltZVRvU2Vjb25kcyhhcnJpdmFsVGltZVswXS5hcnJpdmFsX3RpbWUpIC0gdGltZVRvU2Vjb25kcyhkZXBhcnR1cmVUaW1lWzBdLmFycml2YWxfdGltZSk7XG4gIHZhciBkdXJhdGlvbiA9IHNlY29uZHNUb1RpbWUoZHVyYXRpb25JblNlY29uZHMpO1xuXG4gIHJldHVybiBgPGRpdiBjbGFzcz1cInJvd1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+XG4gICAgICAgICAgICAgICR7ZGVwYXJ0dXJlVGltZVswXS5zdG9wX2lkfSAtICR7ZGVwYXJ0dXJlVGltZVswXS5hcnJpdmFsX3RpbWV9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPlxuICAgICAgICAgICAgICAke2Fycml2YWxUaW1lWzBdLnN0b3BfaWR9IC0gJHthcnJpdmFsVGltZVswXS5hcnJpdmFsX3RpbWV9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPlxuICAgICAgICAgICAgICAke2R1cmF0aW9ufVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+YDtcbiAgXG59XG5cbi8qXG4gIFRlbXBsYXRlIGZvciBlYWNoIHJvdXRlL3NlcnZpY2UgaW4gdGhlIHJlc3VsdHMgXG4qL1xuZnVuY3Rpb24gY3JlYXRlU2VydmljZUhUTUwocm91dGUsIG9wdGlvbnMpIHtcblxuICByZXR1cm4gYDxkaXYgY2xhc3M9XCJcIj5cbiAgICAgICAgICAgIFJvdXRlOiAke3JvdXRlLnJvdXRlX2lkfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJcIj5cbiAgICAgICAgICAgIFNlcnZpY2U6ICR7cm91dGUuc2VydmljZV9pZH1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFibGVcIj4gXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3dcIj4gXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+RGVwYXJ0LiAtIFRpbWU8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTMzIGNlbGxcIj5BcnJpdi4gLSBUaW1lPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+RHVyYXRpb248L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICR7b3B0aW9uc1tyb3V0ZS5zZXJ2aWNlX2lkXX1cbiAgICAgICAgICAgICAgPGhyPlxuICAgICAgICAgIDwvZGl2PmA7XG5cbn1cblxuLypcbiAgU2hvdyB0aGUgcmVzdWx0cyBmcm9tIHRoZSByb3V0ZXMgZm91bmQ6IHJvdXRlLCBzZXJ2aWNlX2lkIGFuZCBhdmFpbGFibGUgdGltZXMgd2l0aCB0cmlwIGR1cmF0aW9uIGZvciB0aGVcbiAgc2VsZWN0ZWQgc3RvcHMuXG4qL1xuZnVuY3Rpb24gc2hvd1RyaXBUaW1lcyhkZXBhcnR1cmVfaWQsIGFycml2YWxfaWQsIHN0b3BfdGltZXMsIHJvdXRlcykge1xuXG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm91dGUtcmVzdWx0Jyk7XG4gIHZhciByZXN1bHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWV0YWJsZScpO1xuICByZXN1bHRzLmlubmVySFRNTCA9ICcnO1xuICBjb250YWluZXIuc3R5bGUub3BhY2l0eSA9IDE7XG5cbiAgdmFyIHVuaXF1ZVJvdXRlcyA9IFtdO1xuICB2YXIgb3B0aW9ucyA9IFtdO1xuICB2YXIgdHJpcHNQcm9taXNlcyA9IFtdO1xuXG4gIC8vIEdldCB0aGUgdGltZXMgZm9yIGVhY2ggdHJpcFxuICByb3V0ZXMuZm9yRWFjaCggZnVuY3Rpb24ocm91dGUpIHtcblxuICAgIG9wdGlvbnNbcm91dGUuc2VydmljZV9pZF0gPSAnJztcblxuICAgIC8vIGdldCBvbmx5IHRoZSB0cmlwcyBvZiB0aGlzIHNlcnZpY2VcbiAgICB2YXIgcm91dGVUcmlwcyA9IHN0b3BfdGltZXNcbiAgICAgIC5maWx0ZXIoKHN0b3ApID0+IHN0b3AudHJpcC5zZXJ2aWNlX2lkID09IHJvdXRlLnNlcnZpY2VfaWQgKTtcblxuICAgIC8vIGNyZWF0ZSBhIHJvdyBmb3IgZWFjaCB0cmlwXG4gICAgcm91dGVUcmlwcy5mb3JFYWNoKGZ1bmN0aW9uICh0cmlwKSB7XG5cbiAgICAgIHZhciBkZXBhcnR1cmVQcm9taXNlID0gVHJpcHMuZ2V0U3RvcEluVHJpcFRpbWUoZGVwYXJ0dXJlX2lkLCB0cmlwLnRyaXBfaWQpO1xuICAgICAgdmFyIGFycml2YWxQcm9taXNlID0gVHJpcHMuZ2V0U3RvcEluVHJpcFRpbWUoYXJyaXZhbF9pZCwgdHJpcC50cmlwX2lkKTtcbiAgICAgIFxuICAgICAgdHJpcHNQcm9taXNlcy5wdXNoKFByb21pc2UuYWxsKFtkZXBhcnR1cmVQcm9taXNlLCBhcnJpdmFsUHJvbWlzZV0pLnRoZW4oY3JlYXRlT3B0aW9uSFRNTCkudGhlbigoaHRtbCkgPT4ge1xuICAgICAgICBvcHRpb25zW3JvdXRlLnNlcnZpY2VfaWRdICs9IGh0bWw7XG4gICAgICB9KSk7XG5cbiAgICB9KTtcblxuICB9KTtcblxuICAvLyB3aGVuIGFsbCB0cmlwcyBhcmUgZmluaXNoZWQgY3JlYXRlIGh0bWwgZm9yIGVhY2ggcm91dGUsIGFkZGluZyB0aGUgdGltZXMgY2FsY3VsYXRlZCBmb3IgZWFjaCB0cmlwXG4gIFByb21pc2UuYWxsKHRyaXBzUHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICByb3V0ZXMuZm9yRWFjaCggKHJvdXRlLCBpbmRleCkgPT4ge1xuICAgIFxuICAgICAgaWYodW5pcXVlUm91dGVzLmluZGV4T2Yocm91dGUuc2VydmljZV9pZCkgPT0gLTEpIHtcbiAgICAgICAgXG4gICAgICAgIHVuaXF1ZVJvdXRlcy5wdXNoKHJvdXRlLnNlcnZpY2VfaWQpO1xuICAgICAgICByZXN1bHRzLmlubmVySFRNTCArPSBjcmVhdGVTZXJ2aWNlSFRNTChyb3V0ZSwgb3B0aW9ucyk7XG4gICAgICAgIFxuICAgICAgfVxuXG4gICAgfSk7XG5cbiAgfSk7XG5cbn1cblxuLypcbiAgU2hvd3MgYSBtZXNzYWdlIGluIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50LlxuKi9cbmZ1bmN0aW9uIHNob3dJbmZvTWVzc2FnZShtZXNzYWdlLCB0eXBlKSB7XG5cbiAgdmFyIG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZS1ib3gnKTtcbiAgbWVzc2FnZUJveC5pbm5lckhUTUwgPSBtZXNzYWdlO1xuXG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0JztcbiAgXG4gIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAnZXJyb3InOlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBlcnJvcic7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBpbmZvJztcbiAgICAgIGJyZWFrOyAgICBcbiAgfVxuXG59XG5cbi8qXG4gIE1ha2VzIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50IGRpc2FwcGVhciB0aHJvdWdoIGNzcyBjbGFzc1xuKi9cbmZ1bmN0aW9uIGNsZWFySW5mb01lc3NhZ2UoKSB7XG4gIHZhciBtZXNzYWdlQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lc3NhZ2UtYm94Jyk7XG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0Jztcbn1cblxuZnVuY3Rpb24gY2xlYXJSZXN1bHRzKCkge1xuXG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm91dGUtcmVzdWx0Jyk7XG4gIHZhciByZXN1bHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWV0YWJsZScpO1xuICByZXN1bHRzLmlubmVySFRNTCA9ICcnO1xuICBjb250YWluZXIuc3R5bGUub3BhY2l0eSA9IDA7XG5cbn1cblxuXG4vKlxuICBSZXF1ZXN0IHRoZSBzdG9wcyBmcm9tIHNlcnZlciBhbmQgYWRkIHRoZW0gdG8gYW4gYXJyYXlcbiAgdG8gYmUgYWJsZSB0byBjaGVjayB0aGF0IHRoZSB1c2VyIGlucHV0IGlzIHZhbGlkLlxuKi9cbmZ1bmN0aW9uIGxvYWRTdG9wcygpIHtcblxuICBTdG9wcy5nZXRBbGwoKS50aGVuKGFkZFN0b3BzKTtcblxufTtcblxuLypcbiAgR2V0IHRoZSBzdGF0aW9uIGNvZGUgZnJvbSBhIHN0cmluZ1xuKi9cbmZ1bmN0aW9uIGdldFN0YXRpb25Db2RlKHN0YXRpb24pIHtcblxuICB2YXIgcGFydHMgPSBzdGF0aW9uLnNwbGl0KCctJyk7XG4gIFxuICBpZihwYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgLy8gVGhpcyBjb3VsZCBiZSBhIHN0cmluZyBmcm9tIHRoZSBkYXRhbGlzdCwgZXh0cmFjdCB0aGUgY29kZVxuICAgIHJldHVybiBwYXJ0c1sxXS50cmltKCk7XG4gIH0gXG5cbiAgLy8gVGhpcyBjb3VsZCBiZSBhIGNvZGUgd3JpdHRlbiBieSB0aGUgdXNlclxuICByZXR1cm4gc3RhdGlvbjtcbiAgXG59XG5cbi8qXG4gIENoZWNrIHRoYXQgYSBjb2RlIGlzIGVpdGhlciBhIHBhaXIgc3RhdGlvbiBuYW1lIC0gc3RhdGlvbiBjb2RlIFxuICBmcm9tIHRoZSBmb3JtIGRhdGFsaXN0IG9yIGEgY29kZSBvZiBhIHN0b3Agd3JpdHRlbiBieSB0aGUgdXNlci5cbiovXG5mdW5jdGlvbiBjaGVja1N0YXRpb24oc3RhdGlvbikge1xuXG4gIHZhciBjb2RlID0gZ2V0U3RhdGlvbkNvZGUoc3RhdGlvbik7XG5cbiAgLy8gQ2hlY2sgdGhhdCB0aGUgY29kZSBpcyBpbiB0aGUgbGlzdCBvZiBzdG9wc1xuICByZXR1cm4gU3RvcHMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihzdG9wcyl7XG4gICAgcmV0dXJuIHN0b3BzLnNvbWUoZnVuY3Rpb24gY2hlY2soc3RvcCkge1xuICAgICAgcmV0dXJuIHN0b3Auc3RvcF9pZCA9PSBjb2RlO1xuICAgIH0pO1xuICB9KTtcblxufVxuXG4vKlxuICBUYWtlcyBhIHRpbWUgaW4gMDA6MDA6MDAgZm9ybWF0IGFuZCByZXR1cm5zIHRoZSBudW1iZXIgb2Ygc2Vjb25kc1xuICBmcm9tIDAwOjAwOjAwIHRvIHRoZSBwcm92aWRlZCB0aW1lLlxuKi9cbmZ1bmN0aW9uIHRpbWVUb1NlY29uZHModGltZSkge1xuXG4gIHZhciB0aW1lUGFydHMgPSB0aW1lLnNwbGl0KCc6JykubWFwKG51bSA9PiBwYXJzZUludChudW0pKTtcbiAgcmV0dXJuIHRpbWVQYXJ0c1swXSozNjAwICsgdGltZVBhcnRzWzFdKjYwICsgdGltZVBhcnRzWzJdO1xuXG59XG5cbmZ1bmN0aW9uIHNlY29uZHNUb1RpbWUoc2Vjb25kcykge1xuXG4gIHZhciBob3VycyA9IE1hdGguZmxvb3Ioc2Vjb25kcy8zNjAwKTtcbiAgdmFyIG1pbnV0ZXMgPSBNYXRoLmZsb29yKChzZWNvbmRzIC0gaG91cnMqMzYwMCkvNjApO1xuICByZXR1cm4gYCR7dHdvRGlnaXRzKGhvdXJzKX06JHt0d29EaWdpdHMobWludXRlcyl9OiR7dHdvRGlnaXRzKHNlY29uZHMlNjApfWA7XG5cbn1cblxuZnVuY3Rpb24gdHdvRGlnaXRzKG51bWJlcikge1xuICBcbiAgcmV0dXJuIG51bWJlciA+IDkgPyBgJHtudW1iZXJ9YCA6IGAwJHtudW1iZXJ9YDsgXG5cbn1cblxuLypcbiAgQXV4aWxpYXJ5IGZ1bmN0aW9uIHRvIGZpbmQgdHJpcHMgdGhhdCBtZWV0IHRoZSByZXF1aXJlbWVudHMgXG4gICAtIEEgdmFsaWQgdHJpcCBtdXN0IGdvIHRvIGJvdGggdGhlIGRlcGFydHVyZSBzdG9wIGFuZCB0aGUgYXJyaXZhbCBzdG9wXG4gICAtIEEgdmFsaWQgdHJpcCBtdXN0IGdvIGZpcnN0IHRvIHRoZSBkZXBhcnR1cmUgc3RvcCwgaWUgdGhlIGRlcGFydHVyZSBzdG9wIHRpbWUgbXVzdCBcbiAgIGJlIGJlZm9yZSB0aGUgYXJyaXZhbCBzdG9wIHRpbWUuXG4qL1xuZnVuY3Rpb24gZmluZE1hdGNoaW5nVHJpcHMoZGVwYXJ0dXJlVGltZXMsIGFycml2YWxUaW1lcykge1xuXG4gIC8vIGdldHMgYWxsIHRyaXBzIHRoYXQgZ29lcyB0byB0aGUgZGVwYXJ0dXJlIHN0b3AgYW5kIHRoZSBhcnJpdmFsIHN0b3BcbiAgdmFyIHZhbGlkVHJpcHMgPSBkZXBhcnR1cmVUaW1lcy5maWx0ZXIoZnVuY3Rpb24oZGVwYXJ0dXJlVHJpcCl7XG4gICAgcmV0dXJuIGFycml2YWxUaW1lcy5zb21lKGZ1bmN0aW9uKGFycml2YWxUcmlwKXtcbiAgICAgIHJldHVybiBhcnJpdmFsVHJpcC50cmlwX2lkID09IGRlcGFydHVyZVRyaXAudHJpcF9pZCAmJiBcbiAgICAgICAgdGltZVRvU2Vjb25kcyhkZXBhcnR1cmVUcmlwLmFycml2YWxfdGltZSkgPCB0aW1lVG9TZWNvbmRzKGFycml2YWxUcmlwLmFycml2YWxfdGltZSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiB2YWxpZFRyaXBzO1xufVxuXG4vKlxuICBGaW5kcyB0cmlwcyBiZXR3ZWVuIHR3byBzdGF0aW9ucywgcmV0dXJucyB0aGUgdHJpcHMgaWRzXG4qL1xuZnVuY3Rpb24gZmluZFRyaXBzKGRlcGFydHVyZUlkLCBhcnJpdmFsSWQpIHtcblxuICByZXR1cm4gUHJvbWlzZS5hbGwoW1RyaXBzLmdldFRyaXBTdG9wVGltZXMoZGVwYXJ0dXJlSWQpLCBUcmlwcy5nZXRUcmlwU3RvcFRpbWVzKGFycml2YWxJZCldKS50aGVuKFxuICAgICAgZnVuY3Rpb24oW2RlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXNdKSB7XG4gICAgICBcbiAgICAgICAgdmFyIHN0b3BfdGltZXMgPSBmaW5kTWF0Y2hpbmdUcmlwcyhkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzKTtcbiAgICAgICAgcmV0dXJuIHt0cmlwczogVHJpcHMuYXBwZW5kVHJpcEluZm8oc3RvcF90aW1lcyksIHJvdXRlczogVHJpcHMuZ2V0Um91dGVzRm9yVHJpcHMoc3RvcF90aW1lcyl9O1xuXG4gICAgICB9KTtcblxufVxuXG4vKlxuICBTdWJtaXQgdGhlIHVzZXIgc2VsZWN0aW9uIGFuZCBzaG93IHRoZSByb3V0ZSBpZiBhdmFpbGFibGUgb3IgYW5cbiAgZXJyb3IgbWVzc2FnZSBpZiBubyByb3V0ZSBpcyBhdmFpbGFibGUuXG4qL1xuZnVuY3Rpb24gc3VibWl0U3RhdGlvbnMoZXZ0KSB7XG5cbiAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gIGNsZWFySW5mb01lc3NhZ2UoKTtcbiAgY2xlYXJSZXN1bHRzKCk7XG4gIFxuICAvLyBnZXQgdGhlIGlucHV0cyB2YWx1ZXNcbiAgdmFyIGRlcGFydHVyZV9pZCA9IGdldFN0YXRpb25Db2RlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBhcnR1cmUnKS52YWx1ZSk7XG4gIHZhciBhcnJpdmFsX2lkID0gZ2V0U3RhdGlvbkNvZGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fycml2YWwnKS52YWx1ZSk7XG5cbiAgUHJvbWlzZS5hbGwoW2NoZWNrU3RhdGlvbihkZXBhcnR1cmVfaWQpLCBjaGVja1N0YXRpb24oYXJyaXZhbF9pZCldKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgXG4gICAgaWYoIXJlc3VsdFswXSB8fCAhcmVzdWx0WzFdKSB7XG4gICAgICBzaG93SW5mb01lc3NhZ2UoXG4gICAgICAgICdZb3UgaGF2ZSB0byBzZWxlY3QgYSB2YWxpZCBkZXBhcnR1cmUgYW5kIGFycml2YWwgc3RhdGlvbnMgZnJvbSB0aGUgbGlzdHMgb3Igd3JpdGUgYSB2YWxpZCBzdG9wIGNvZGUuJyxcbiAgICAgICAgJ2Vycm9yJ1xuICAgICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvLyBJZiB0aGUgZGVwYXJ0dXJlIGFuZCBhcnJpdmFsIHN0YXRpb25zIGFyZSBjb3JyZWN0XG4gICAgLy8gc2VhcmNoIGZvciBhIHRyaXAgYmV0d2VlbiB0aGVtIGFuZCBzaG93IHRoZSB0aW1lcyBhbmQgcm91dGVcbiAgICBmaW5kVHJpcHMoZGVwYXJ0dXJlX2lkLCBhcnJpdmFsX2lkKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgICAgUHJvbWlzZS5hbGwoW2RhdGEudHJpcHMsIGRhdGEucm91dGVzXSkudGhlbihmdW5jdGlvbihbdHJpcHMsIHJvdXRlc10pe1xuICAgICAgICBcbiAgICAgICAgaWYocm91dGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzaG93VHJpcFRpbWVzKGRlcGFydHVyZV9pZCwgYXJyaXZhbF9pZCwgdHJpcHMsIHJvdXRlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdXZSBjb3VsZG5cXCd0IGZpbmQgYSB0cmlwIGJldHdlZW4gdGhlc2UgdHdvIHN0YXRpb25zJywgJ2Vycm9yJyk7XG4gICAgICAgIH1cblxuICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIHJldHVybiBmYWxzZTtcblxuICB9KTtcblxuXG59XG5cbi8qXG4gIEluaXRpYWxpemUgdGhlIGFwcGxpY2F0aW9uIFxuKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xuXG4gIC8vIGdldCB0aGUgaW50ZXJhY3RpdmUgZWxlbWVudHMgb2YgdGhlIGludGVyZmFjZVxuICBkZXBhcnR1cmVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGFydHVyZS1zdG9wcycpO1xuICBhcnJpdmFscyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcnJpdmFsLXN0b3BzJyk7XG4gIHN1Ym1pdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2gnKTtcblxuICAvLyBQb3B1bGF0ZSBkYXRhbGlzdHMgYW5kIGFkZCBsaXN0ZW5lcnNcbiAgbG9hZFN0b3BzKCk7XG4gIHN1Ym1pdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHN1Ym1pdFN0YXRpb25zKTtcblxufTtcbiIsImNvbnN0IGJhc2VVcmwgICAgICAgPSAnL2Rpc3QvZGF0YS8nO1xuY29uc3Qgcm91dGVzRmlsZSAgICA9ICdyb3V0ZXMudHh0JztcbmNvbnN0IHRyaXBzRmlsZSAgICAgPSAndHJpcHMudHh0JztcbmNvbnN0IHN0b3BzRmlsZSAgICAgPSAnc3RvcHMudHh0JztcbmNvbnN0IHN0b3BUaW1lc0ZpbGUgPSAnc3RvcF90aW1lcy50eHQnO1xuY29uc3Qgc2hhcGVzRmlsZSAgICA9ICdzaGFwZXMudHh0JztcblxuY29uc3QgY3N2VG9BcnJheSA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgXG4gIHZhciByb3dzID0gdGV4dC50cmltKCkuc3BsaXQoJ1xcbicpO1xuICByZXR1cm4gcm93cy5tYXAoKHJvdykgPT4gcm93LnNwbGl0KCcsJykpO1xuXG59O1xuXG5jb25zdCBjc3ZUb09iamVjdHMgPSBmdW5jdGlvbih0ZXh0KSB7XG5cbiAgdmFyIHRhYmxlID0gY3N2VG9BcnJheSh0ZXh0KTtcbiAgdmFyIGtleXMgPSB0YWJsZVswXTtcbiAgdGFibGUgPSB0YWJsZS5zbGljZSgxKTtcblxuICByZXR1cm4gdGFibGUubWFwKGZ1bmN0aW9uKHJvdykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuICAgICAgb2JqW2tleV0gPSByb3dbaW5kZXhdO1xuICAgIH0pO1xuICAgIHJldHVybiAgb2JqO1xuICB9KTtcblxufVxuXG5mdW5jdGlvbiBnZXRDc3ZBc09iamVjdHModXJsKSB7XG5cbiAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKTtcblxuICAgIH0pLnRoZW4oZnVuY3Rpb24odGV4dENvbnRlbnQpIHtcblxuICAgICAgcmV0dXJuIGNzdlRvT2JqZWN0cyh0ZXh0Q29udGVudCk7XG5cbiAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgfSk7XG59XG5cbi8vIEFQSVxuXG4vKlxuICBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIGFycmF5IHdpdGggdGhlIG5hbWVzIG9mIHRoZSBcbiAgYXZhaWxhYmxlIGxpbmVzLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZXMoKSB7XG5cbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgcm91dGVzRmlsZSk7XG5cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmlwcygpIHtcbiAgLy8gZ2V0IHRoZSByb3V0ZS9saW5lIGFuZCByZXR1cm4gdGhlIHRpbWVzIGZvciB0aGlzIGxpbmVcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgdHJpcHNGaWxlKTtcblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BzKCkge1xuICAvLyByZXR1cm5zIHRoZSBzdG9wcyBvZiB0aGlzIGxpbmVcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc3RvcHNGaWxlKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wVGltZXMoKSB7XG4gIHJldHVybiBnZXRDc3ZBc09iamVjdHMoYmFzZVVybCArIHN0b3BUaW1lc0ZpbGUpOyBcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzaGFwZXMoKSB7XG4gIHJldHVybiBnZXRDc3ZBc09iamVjdHMoYmFzZVVybCArIHNoYXBlc0ZpbGUpOyBcbn07XG4iLCJpbXBvcnQgKiBhcyBBcHAgZnJvbSAnLi9hcHAuanMnO1xuXG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xuXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xuXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy4vc2VydmljZV93b3JrZXIuanMnLCB7c2NvcGU6ICcvJ30pLnRoZW4oZnVuY3Rpb24ocmVnKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdSZWdpc3RyYXRpb24gd29ya2VkIScsIHJlZyk7XG5cbiAgICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuY29udHJvbGxlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuXG4gICAgICBjb25zb2xlLmVycm9yKCdSZWdpc3RyYXRpb24gZmFpbGVkIScsIGVycm9yKTtcbiAgICBcbiAgICB9KTtcblxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgICBcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBcbiAgICAgIC8vIHJlc29sdmUgdGhlIHByb21pc2Ugd2hlbiB0aGUgZG9jdW1lbnQgaXMgcmVhZHlcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0pO1xuXG4gIH07XG5cblxuICByZWFkeSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgQXBwLmluaXQoKTtcbiAgICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTtcbiAgfSk7XG5cbn0pKCk7IiwiaW1wb3J0ICogYXMgSHR0cCBmcm9tICcuLi9odHRwLmpzJztcbmltcG9ydCBpZGIgZnJvbSAnLi9kYi5qcyc7XG5cbnZhciB3YWl0aW5nRm9yTmV0d29yayA9IGZhbHNlO1xuLy8gSWYgaW5kZXhlZERCIGlzIHBvcHVsYXRlZCwgZ2V0IHRoZSBkYXRhIGFuZCB0cnkgdG8gdXBkYXRlIGZyb20gbmV0d29ya1xuLy8gZWxzZSB0cnkgdG8gZ2V0IHRoZSBkYXRhIGZyb20gbmV0d29yayBhbmQgc2F2ZSBpdFxuLy8gZWxzZSB3ZSBzaG91bGQgc2hvdyBhIGN1c3RvbSBlcnJvciBtZXNzYWdlIHRvIHRoZSB1c2VyLCB0aGUgYXBwIGlzIG5vdGEgYXZhaWxhYmxlLlxuZXhwb3J0IGZ1bmN0aW9uIHNldFN0b3BzKCkge1xuXG4gIHJldHVybiBpZGIoKS50aGVuKGRiID0+IHtcblxuICAgICAgaWYoIWRiKSB0aHJvdyAnV2UgY291bGRuXFwndCBhY2Nlc3MgSW5kZXhlZERCJztcblxuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJyk7XG4gICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICByZXR1cm4gdHJpcHNTdG9yZS5jb3VudCgpO1xuXG4gICAgfSkudGhlbihyZXN1bHQgPT4ge1xuXG4gICAgICAvLyBpZiB0aGVyZSBpcyBzb21ldGhpbmcgaW4gdGhlIGRiLCBkb24ndCBib3RoZXIgaW4gZ2V0dGluZyB0aGUgZGF0YSBhZ2FpbiBmcm9tIG5ldHdvcmtcbiAgICAgIGlmKHJlc3VsdCA+IDAgfHwgd2FpdGluZ0Zvck5ldHdvcmspIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICB3YWl0aW5nRm9yTmV0d29yayA9IHRydWU7XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzIG5vdGhpbmcgaW4gdGhlIHRyaXBzIGFuZCB0aW1lcyB0YWJsZSwgZmlsbCB0aGVtIVxuICAgICAgcmV0dXJuIEh0dHAuc3RvcHMoKVxuICAgICAgICAudGhlbihzdG9yZVN0b3BzKTtcblxuICAgIH0pO1xuXG59XG5cblxuZnVuY3Rpb24gc3RvcmVTdG9wcyhyZXN1bHRzKSB7XG5cbiAgaWYocmVzdWx0cykgeyBcblxuICAgICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gc3RvcmVTdG9wc0luSURCKGRiKXtcblxuICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcHMnLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIHZhciBzdG9wc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BzJyk7XG5cbiAgICAgICAgcmVzdWx0cy5mb3JFYWNoKCBmdW5jdGlvbihzdG9wKSB7XG4gICAgICAgICAgc3RvcHNTdG9yZS5wdXQoc3RvcCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21wbGV0ZTtcblxuICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcblxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgICAgfSk7XG5cbiAgfVxuXG59XG5cbi8qXG4gIEdldCBhbGwgdGhlIHN0b3BzXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbChzdG9wX2lkKSB7XG5cbiAgcmV0dXJuIHNldFN0b3BzKClcbiAgICAudGhlbigoKSA9PiBpZGIoKSlcbiAgICAudGhlbihmdW5jdGlvbiBnZXRTdG9wcyhkYil7XG5cbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wcycpO1xuICAgICAgdmFyIHN0b3BzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcHMnKTtcblxuICAgICAgcmV0dXJuIHN0b3BzU3RvcmUuZ2V0QWxsKCk7XG4gICAgfSk7XG5cbn07XG5cbiIsImltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi4vaHR0cC5qcyc7XG5pbXBvcnQgaWRiIGZyb20gJy4vZGIuanMnO1xuXG4gIC8qXG4gICAgVGhpcyBmdW5jdGlvbiBjaGVja3MgdGhhdCB0aGUgZGF0YSBpcyBpbiBJbmRleGVkREIsIGlmIG5vdCwgaXQgZ2V0cyBpdCBmcm9tIG5ldHdvcmsvY2FjaGVcbiAgICBhbmQgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBkYXRhIGlzIHN0b3JlZCBpbiBJREIuXG4gICAgVGhpcyB3YXkgd2UgZG9uJ3QgbmVlZCBhbnkgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb24sIGp1c3QgY2FsbCB0aGlzIGZ1bmN0aW9uIGluIGVhY2ggcmV0cmlldmluZ1xuICAgIG1ldGhvZCBhbmQgaXQgd2lsbCBnZXQgc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgc2V0IHVwIGJlZm9yZSB0cnlpbmcgdG8gZ2V0IHRoZSBjb250ZW50LlxuICAqL1xuICB2YXIgd2FpdGluZ0Zvck5ldHdvcmsgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBzZXRUcmlwcygpIHtcblxuICAgIHJldHVybiBpZGIoKS50aGVuKGRiID0+IHtcblxuICAgICAgaWYoIWRiKSB0aHJvdyAnV2UgY291bGRuXFwndCBhY2Nlc3MgSW5kZXhlZERCJztcblxuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJyk7XG4gICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICByZXR1cm4gdHJpcHNTdG9yZS5jb3VudCgpO1xuXG4gICAgfSkudGhlbihyZXN1bHQgPT4ge1xuXG4gICAgICAvLyBpZiB0aGVyZSBpcyBzb21ldGhpbmcgaW4gdGhlIGRiLCBkb24ndCBib3RoZXIgaW4gZ2V0dGluZyB0aGUgZGF0YSBhZ2FpbiBmcm9tIG5ldHdvcmtcbiAgICAgIGlmKHJlc3VsdCA+IDAgfHwgd2FpdGluZ0Zvck5ldHdvcmspIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICB3YWl0aW5nRm9yTmV0d29yayA9IHRydWU7XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzIG5vdGhpbmcgaW4gdGhlIHRyaXBzIGFuZCB0aW1lcyB0YWJsZSwgZmlsbCB0aGVtIVxuICAgICAgcmV0dXJuIEh0dHAuc3RvcFRpbWVzKClcbiAgICAgICAgLnRoZW4oc3RvcmVTdG9wVGltZXMpXG4gICAgICAgIC50aGVuKEh0dHAudHJpcHMpXG4gICAgICAgIC50aGVuKHN0b3JlVHJpcHMpO1xuXG4gICAgfSk7XG5cblxuICB9XG5cblxuICBmdW5jdGlvbiBzdG9yZVN0b3BUaW1lcyhyZXN1bHRzKSB7XG5cbiAgICBpZihyZXN1bHRzKSB7IFxuXG4gICAgICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIHN0b3JlVHJpcHNJbklEQihkYil7XG5cbiAgICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcF90aW1lcycsICdyZWFkd3JpdGUnKTtcbiAgICAgICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJyk7XG5cbiAgICAgICAgICByZXN1bHRzLmZvckVhY2goIGZ1bmN0aW9uKHRyaXApIHtcbiAgICAgICAgICAgIHRyaXBzU3RvcmUucHV0KHRyaXApO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLmNvbXBsZXRlO1xuXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG5cbiAgICAgICAgICAvLyB0aGUgdHJhbnNhY3Rpb24gZGlkbid0IGNvbXBsZXRlLCBzbyB0aGUgdGFibGUgc2hvdWxkIGJlIGVtcHR5XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0b3JlVHJpcHMocmVzdWx0cykge1xuXG4gICAgaWYocmVzdWx0cykgeyBcblxuICAgICAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBzdG9yZVRyaXBzSW5JREIoZGIpe1xuXG4gICAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJywgJ3JlYWR3cml0ZScpO1xuICAgICAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgICAgICByZXN1bHRzLmZvckVhY2goIGZ1bmN0aW9uKHRyaXApIHtcbiAgICAgICAgICAgIHRyaXBzU3RvcmUucHV0KHRyaXApO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLmNvbXBsZXRlO1xuXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG5cbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICB9XG5cbiAgLy8gSWYgaW5kZXhlZERCIGlzIHBvcHVsYXRlZCwgZ2V0IHRoZSBkYXRhIGFuZCB0cnkgdG8gdXBkYXRlIGZyb20gbmV0d29ya1xuICAvLyBlbHNlIHRyeSB0byBnZXQgdGhlIGRhdGEgZnJvbSBuZXR3b3JrIGFuZCBzYXZlIGl0XG4gIC8vIGVsc2Ugd2Ugc2hvdWxkIHNob3cgYSBjdXN0b20gZXJyb3IgbWVzc2FnZSB0byB0aGUgdXNlciwgdGhlIGFwcCBpcyBub3RhIGF2YWlsYWJsZS5cblxuICAvKlxuICAgIEdldCB0aGUgdHJpcHMgdGhhdCBzdG9wIGF0IHN0b3BfaWQsIG9uZSBwZXIgcm91dGUsIGluZGVwZW5kZW50bHkgb2Ygc3RvcCB0aW1lc1xuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0Um91dGVzRm9yU3RvcChzdG9wX2lkKSB7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRUcmlwc1N0b3BUaW1lcyhzdG9wX2lkKVxuICAgICAgLnRoZW4oKTtcblxuICB9O1xuXG4gIGV4cG9ydCBmdW5jdGlvbiBhcHBlbmRUcmlwSW5mbyhzdG9wX3RpbWVzKSB7XG5cbiAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBnZXRBbGxSb3V0ZXMoZGIpIHtcbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCd0cmlwcycpO1xuICAgICAgdmFyIHRyaXBTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICB2YXIgdHJpcHMgPSBbXTtcbiAgICAgIHN0b3BfdGltZXMuZm9yRWFjaChmdW5jdGlvbiBhcHBlbmRUcmlwUHJvbWlzZSh0cmlwKSB7XG5cbiAgICAgICAgdHJpcHMucHVzaCh0cmlwU3RvcmUuZ2V0KHRyaXAudHJpcF9pZCkpO1xuXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRyaXBzKTtcbiAgICAgIFxuICAgIH0pLnRoZW4oZnVuY3Rpb24odHJpcHMpIHsgXG5cbiAgICAgIHJldHVybiBzdG9wX3RpbWVzLm1hcChmdW5jdGlvbihzdG9wLCBpbmRleCkge1xuICAgICAgICBzdG9wLnRyaXAgPSB0cmlwc1tpbmRleF07XG4gICAgICAgIHJldHVybiBzdG9wO1xuICAgICAgfSk7XG5cbiAgICB9KTtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXRSb3V0ZXNGb3JUcmlwcyh0cmlwcykge1xuXG4gICAgLy8gZ2V0IHRoZSByb3V0ZXMgZm9yIHRoaXMgdHJpcHNcbiAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBnZXRBbGxSb3V0ZXMoZGIpIHtcbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCd0cmlwcycpO1xuICAgICAgdmFyIHRyaXBTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICB2YXIgcm91dGVzID0gW107XG4gICAgICB0cmlwcy5mb3JFYWNoKGZ1bmN0aW9uIGFwcGVuZFRyaXBQcm9taXNlKHRyaXApIHtcblxuICAgICAgICByb3V0ZXMucHVzaCh0cmlwU3RvcmUuZ2V0KHRyaXAudHJpcF9pZCkpO1xuXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJvdXRlcyk7XG4gICAgICBcbiAgICB9KS50aGVuKGZ1bmN0aW9uKHJvdXRlcykge1xuXG4gICAgICB2YXIgc2VydmljZV9pZHMgPSBbXTtcbiAgICAgIHZhciB1bmlxdWVSb3V0ZXMgPSBbXTtcbiAgICAgIHJvdXRlcy5mb3JFYWNoKGZ1bmN0aW9uIGdldFVuaXF1ZVNlcnZpY2VJZHModHJpcCkge1xuICAgICAgICBpZihzZXJ2aWNlX2lkcy5pbmRleE9mKHRyaXAuc2VydmljZV9pZCkgPT0gLTEpIHtcbiAgICAgICAgICBzZXJ2aWNlX2lkcy5wdXNoKHRyaXAuc2VydmljZV9pZCk7XG4gICAgICAgICAgdW5pcXVlUm91dGVzLnB1c2godHJpcCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdW5pcXVlUm91dGVzO1xuXG4gICAgfSk7XG5cbiAgfTtcblxuICAvKlxuICAgIEdldCBhbGwgdGhlIHRpbWVzIGZvciBhIHN0b3BcbiAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldFRyaXBTdG9wVGltZXMoc3RvcF9pZCkge1xuXG4gICAgcmV0dXJuIHNldFRyaXBzKClcbiAgICAgIC50aGVuKCgpID0+IGlkYigpKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gZ2V0VHJpcHNGb3JTdG9wKGRiKXtcblxuICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcF90aW1lcycpO1xuICAgICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJyk7XG4gICAgICAgIHZhciBzdG9wSW5kZXggPSB0cmlwc1N0b3JlLmluZGV4KCdzdG9wJyk7XG5cbiAgICAgICAgcmV0dXJuIHN0b3BJbmRleC5nZXRBbGwoc3RvcF9pZCk7XG4gICAgICB9KTtcblxuICB9O1xuXG4gIC8qXG4gICAgR2V0IHRoZSB0aW1lIGZvciBhIHN0b3AgYW5kIGEgdHJpcFxuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0U3RvcEluVHJpcFRpbWUoc3RvcF9pZCwgdHJpcF9pZCkge1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJpcFN0b3BUaW1lcyhzdG9wX2lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gZ2V0VGltZUZvckFUcmlwKHRyaXBzKXtcbiAgICAgICAgcmV0dXJuIHRyaXBzLmZpbHRlcigodHJpcCkgPT4gdHJpcC50cmlwX2lkID09IHRyaXBfaWQpO1xuICAgICAgfSk7XG5cbiAgfSIsImltcG9ydCBpZGIgZnJvbSAnLi4vLi4vbm9kZV9tb2R1bGVzL2lkYi9saWIvaWRiLmpzJztcblxudmFyIF9kYjtcblxuLy8gVGhpcyBjbGFzcyB3b3JrcyBhcyBhIE9STSB0aGF0IGdldHMgdGhlIGRhdGEgZnJvbSBpbmRleGVkREJcbmZ1bmN0aW9uIG9wZW5EYXRhYmFzZSgpIHtcbiAgXG4gIHJldHVybiBpZGIub3BlbigndHJhaW5zJywgMSwgZnVuY3Rpb24odXBncmFkZURiKSB7XG4gICAgXG4gICAgc3dpdGNoKHVwZ3JhZGVEYi5vbGRWZXJzaW9uKSB7XG4gICAgXG4gICAgICBjYXNlIDA6XG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgnc3RvcHMnLCB7XG4gICAgICAgICAga2V5UGF0aDogJ3N0b3BfaWQnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgndHJpcHMnLCB7a2V5UGF0aDogJ3RyaXBfaWQnfSk7XG5cbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJywge2F1dG9JbmNyZW1lbnQ6IHRydWV9KTtcblxuICAgICAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3JvdXRlcycsIHtcbiAgICAgICAgICBrZXlQYXRoOiAncm91dGVfaWQnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciB0cmlwU3RvcmUgPSB1cGdyYWRlRGIudHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BfdGltZXMnKTtcbiAgICAgICAgdHJpcFN0b3JlLmNyZWF0ZUluZGV4KCdzdG9wJywgJ3N0b3BfaWQnKTtcbiAgICAgICAgdHJpcFN0b3JlLmNyZWF0ZUluZGV4KCd0cmlwJywgJ3RyaXBfaWQnKTtcblxuICAgIH1cbiAgfSk7XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZGIoKSB7XG4gIFxuICBpZihfZGIgPT0gbnVsbCkge1xuICAgIF9kYiA9IG9wZW5EYXRhYmFzZSgpO1xuICB9IFxuXG4gIHJldHVybiBfZGI7XG5cbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG4oZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIHRvQXJyYXkoYXJyKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFycik7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0KHJlcXVlc3QpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKHJlcXVlc3QucmVzdWx0KTtcbiAgICAgIH07XG5cbiAgICAgIHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5UmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcmVxdWVzdDtcbiAgICB2YXIgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVxdWVzdCA9IG9ialttZXRob2RdLmFwcGx5KG9iaiwgYXJncyk7XG4gICAgICBwcm9taXNpZnlSZXF1ZXN0KHJlcXVlc3QpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KTtcblxuICAgIHAucmVxdWVzdCA9IHJlcXVlc3Q7XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHAgPSBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncyk7XG4gICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgcmV0dXJuIG5ldyBDdXJzb3IodmFsdWUsIHAucmVxdWVzdCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eVByb3BlcnRpZXMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJveHlDbGFzcy5wcm90b3R5cGUsIHByb3AsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eVJlcXVlc3RNZXRob2RzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIENvbnN0cnVjdG9yLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgICAgUHJveHlDbGFzcy5wcm90b3R5cGVbcHJvcF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKHRoaXNbdGFyZ2V0UHJvcF0sIHByb3AsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlNZXRob2RzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIENvbnN0cnVjdG9yLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgICAgUHJveHlDbGFzcy5wcm90b3R5cGVbcHJvcF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbdGFyZ2V0UHJvcF1bcHJvcF0uYXBwbHkodGhpc1t0YXJnZXRQcm9wXSwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIENvbnN0cnVjdG9yLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgICAgUHJveHlDbGFzcy5wcm90b3R5cGVbcHJvcF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKHRoaXNbdGFyZ2V0UHJvcF0sIHByb3AsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gSW5kZXgoaW5kZXgpIHtcbiAgICB0aGlzLl9pbmRleCA9IGluZGV4O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEluZGV4LCAnX2luZGV4JywgW1xuICAgICduYW1lJyxcbiAgICAna2V5UGF0aCcsXG4gICAgJ211bHRpRW50cnknLFxuICAgICd1bmlxdWUnXG4gIF0pO1xuXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoSW5kZXgsICdfaW5kZXgnLCBJREJJbmRleCwgW1xuICAgICdnZXQnLFxuICAgICdnZXRLZXknLFxuICAgICdnZXRBbGwnLFxuICAgICdnZXRBbGxLZXlzJyxcbiAgICAnY291bnQnXG4gIF0pO1xuXG4gIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoSW5kZXgsICdfaW5kZXgnLCBJREJJbmRleCwgW1xuICAgICdvcGVuQ3Vyc29yJyxcbiAgICAnb3BlbktleUN1cnNvcidcbiAgXSk7XG5cbiAgZnVuY3Rpb24gQ3Vyc29yKGN1cnNvciwgcmVxdWVzdCkge1xuICAgIHRoaXMuX2N1cnNvciA9IGN1cnNvcjtcbiAgICB0aGlzLl9yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgfVxuXG4gIHByb3h5UHJvcGVydGllcyhDdXJzb3IsICdfY3Vyc29yJywgW1xuICAgICdkaXJlY3Rpb24nLFxuICAgICdrZXknLFxuICAgICdwcmltYXJ5S2V5JyxcbiAgICAndmFsdWUnXG4gIF0pO1xuXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoQ3Vyc29yLCAnX2N1cnNvcicsIElEQkN1cnNvciwgW1xuICAgICd1cGRhdGUnLFxuICAgICdkZWxldGUnXG4gIF0pO1xuXG4gIC8vIHByb3h5ICduZXh0JyBtZXRob2RzXG4gIFsnYWR2YW5jZScsICdjb250aW51ZScsICdjb250aW51ZVByaW1hcnlLZXknXS5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcbiAgICBpZiAoIShtZXRob2ROYW1lIGluIElEQkN1cnNvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgQ3Vyc29yLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGN1cnNvciA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBjdXJzb3IuX2N1cnNvclttZXRob2ROYW1lXS5hcHBseShjdXJzb3IuX2N1cnNvciwgYXJncyk7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0KGN1cnNvci5fcmVxdWVzdCkudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcbiAgICAgICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgY3Vyc29yLl9yZXF1ZXN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICBmdW5jdGlvbiBPYmplY3RTdG9yZShzdG9yZSkge1xuICAgIHRoaXMuX3N0b3JlID0gc3RvcmU7XG4gIH1cblxuICBPYmplY3RTdG9yZS5wcm90b3R5cGUuY3JlYXRlSW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZGV4KHRoaXMuX3N0b3JlLmNyZWF0ZUluZGV4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBPYmplY3RTdG9yZS5wcm90b3R5cGUuaW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZGV4KHRoaXMuX3N0b3JlLmluZGV4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnaW5kZXhOYW1lcycsXG4gICAgJ2F1dG9JbmNyZW1lbnQnXG4gIF0pO1xuXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xuICAgICdwdXQnLFxuICAgICdhZGQnLFxuICAgICdkZWxldGUnLFxuICAgICdjbGVhcicsXG4gICAgJ2dldCcsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xuICAgICdkZWxldGVJbmRleCdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gVHJhbnNhY3Rpb24oaWRiVHJhbnNhY3Rpb24pIHtcbiAgICB0aGlzLl90eCA9IGlkYlRyYW5zYWN0aW9uO1xuICAgIHRoaXMuY29tcGxldGUgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGlkYlRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcbiAgICAgIGlkYlRyYW5zYWN0aW9uLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KGlkYlRyYW5zYWN0aW9uLmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBUcmFuc2FjdGlvbi5wcm90b3R5cGUub2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX3R4Lm9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX3R4LCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVHJhbnNhY3Rpb24sICdfdHgnLCBbXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnLFxuICAgICdtb2RlJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoVHJhbnNhY3Rpb24sICdfdHgnLCBJREJUcmFuc2FjdGlvbiwgW1xuICAgICdhYm9ydCdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gVXBncmFkZURCKGRiLCBvbGRWZXJzaW9uLCB0cmFuc2FjdGlvbikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gICAgdGhpcy5vbGRWZXJzaW9uID0gb2xkVmVyc2lvbjtcbiAgICB0aGlzLnRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uKTtcbiAgfVxuXG4gIFVwZ3JhZGVEQi5wcm90b3R5cGUuY3JlYXRlT2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX2RiLmNyZWF0ZU9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVXBncmFkZURCLCAnX2RiJywgW1xuICAgICduYW1lJyxcbiAgICAndmVyc2lvbicsXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhVcGdyYWRlREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdkZWxldGVPYmplY3RTdG9yZScsXG4gICAgJ2Nsb3NlJ1xuICBdKTtcblxuICBmdW5jdGlvbiBEQihkYikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gIH1cblxuICBEQi5wcm90b3R5cGUudHJhbnNhY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKHRoaXMuX2RiLnRyYW5zYWN0aW9uLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKERCLCAnX2RiJywgSURCRGF0YWJhc2UsIFtcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIC8vIEFkZCBjdXJzb3IgaXRlcmF0b3JzXG4gIC8vIFRPRE86IHJlbW92ZSB0aGlzIG9uY2UgYnJvd3NlcnMgZG8gdGhlIHJpZ2h0IHRoaW5nIHdpdGggcHJvbWlzZXNcbiAgWydvcGVuQ3Vyc29yJywgJ29wZW5LZXlDdXJzb3InXS5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmNOYW1lKSB7XG4gICAgW09iamVjdFN0b3JlLCBJbmRleF0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgICAgQ29uc3RydWN0b3IucHJvdG90eXBlW2Z1bmNOYW1lLnJlcGxhY2UoJ29wZW4nLCAnaXRlcmF0ZScpXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IHRvQXJyYXkoYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgcmVxdWVzdCA9ICh0aGlzLl9zdG9yZSB8fCB0aGlzLl9pbmRleClbZnVuY05hbWVdLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmdzLnNsaWNlKDAsIC0xKSk7XG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY2FsbGJhY2socmVxdWVzdC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gcG9seWZpbGwgZ2V0QWxsXG4gIFtJbmRleCwgT2JqZWN0U3RvcmVdLmZvckVhY2goZnVuY3Rpb24oQ29uc3RydWN0b3IpIHtcbiAgICBpZiAoQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCkgcmV0dXJuO1xuICAgIENvbnN0cnVjdG9yLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbihxdWVyeSwgY291bnQpIHtcbiAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXM7XG4gICAgICB2YXIgaXRlbXMgPSBbXTtcblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgICAgaW5zdGFuY2UuaXRlcmF0ZUN1cnNvcihxdWVyeSwgZnVuY3Rpb24oY3Vyc29yKSB7XG4gICAgICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgICAgIHJlc29sdmUoaXRlbXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpdGVtcy5wdXNoKGN1cnNvci52YWx1ZSk7XG5cbiAgICAgICAgICBpZiAoY291bnQgIT09IHVuZGVmaW5lZCAmJiBpdGVtcy5sZW5ndGggPT0gY291bnQpIHtcbiAgICAgICAgICAgIHJlc29sdmUoaXRlbXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICB2YXIgZXhwID0ge1xuICAgIG9wZW46IGZ1bmN0aW9uKG5hbWUsIHZlcnNpb24sIHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgdmFyIHAgPSBwcm9taXNpZnlSZXF1ZXN0Q2FsbChpbmRleGVkREIsICdvcGVuJywgW25hbWUsIHZlcnNpb25dKTtcbiAgICAgIHZhciByZXF1ZXN0ID0gcC5yZXF1ZXN0O1xuXG4gICAgICByZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICh1cGdyYWRlQ2FsbGJhY2spIHtcbiAgICAgICAgICB1cGdyYWRlQ2FsbGJhY2sobmV3IFVwZ3JhZGVEQihyZXF1ZXN0LnJlc3VsdCwgZXZlbnQub2xkVmVyc2lvbiwgcmVxdWVzdC50cmFuc2FjdGlvbikpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKGRiKSB7XG4gICAgICAgIHJldHVybiBuZXcgREIoZGIpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChpbmRleGVkREIsICdkZWxldGVEYXRhYmFzZScsIFtuYW1lXSk7XG4gICAgfVxuICB9O1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZXhwO1xuICB9XG4gIGVsc2Uge1xuICAgIHNlbGYuaWRiID0gZXhwO1xuICB9XG59KCkpOyJdfQ==
