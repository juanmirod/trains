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

  var container = document.getElementById('route-result'),
      results = document.getElementById('timetable'),
      uniqueRoutes = [],
      options = [];
  results.innerHTML = '';
  container.style.opacity = 1;

  // Get the times for each trip
  routes.forEach(function (route) {

    var tripsPromises = [];
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

    // when all trips are finished create html for each route, adding the times calculated for each trip
    Promise.all(tripsPromises).then(function () {

      results.innerHTML += createServiceHTML(route, options);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiLCJhcHAvb3JtL1RyaXBzLmpzIiwiYXBwL29ybS9kYi5qcyIsIm5vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O1FDa1RnQixJLEdBQUEsSTs7QUFsVGhCOztJQUFZLEs7O0FBQ1o7O0lBQVksSzs7QUFDWjs7SUFBWSxJOzs7O0FBRVo7QUFDQSxJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRDs7O0FBR0EsU0FBUyxnQkFBVCxPQUF3RDtBQUFBOztBQUFBLE1BQTdCLGFBQTZCO0FBQUEsTUFBZCxXQUFjOzs7QUFFdEQsTUFBSSxvQkFBb0IsY0FBYyxZQUFZLENBQVosRUFBZSxZQUE3QixJQUE2QyxjQUFjLGNBQWMsQ0FBZCxFQUFpQixZQUEvQixDQUFyRTtBQUNBLE1BQUksV0FBVyxjQUFjLGlCQUFkLENBQWY7O0FBRUEsc0ZBRWMsY0FBYyxDQUFkLEVBQWlCLE9BRi9CLFdBRTRDLGNBQWMsQ0FBZCxFQUFpQixZQUY3RCxtRkFLYyxZQUFZLENBQVosRUFBZSxPQUw3QixXQUswQyxZQUFZLENBQVosRUFBZSxZQUx6RCxtRkFRYyxRQVJkO0FBWUQ7O0FBRUQ7OztBQUdBLFNBQVMsaUJBQVQsQ0FBMkIsS0FBM0IsRUFBa0MsT0FBbEMsRUFBMkM7O0FBRXpDLGlEQUNtQixNQUFNLFFBRHpCLDJFQUlxQixNQUFNLFVBSjNCLHdUQVljLFFBQVEsTUFBTSxVQUFkLENBWmQ7QUFnQkQ7O0FBRUQ7Ozs7QUFJQSxTQUFTLGFBQVQsQ0FBdUIsWUFBdkIsRUFBcUMsVUFBckMsRUFBaUQsVUFBakQsRUFBNkQsTUFBN0QsRUFBcUU7O0FBRW5FLE1BQUksWUFBWSxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBaEI7QUFBQSxNQUNBLFVBQVUsU0FBUyxjQUFULENBQXdCLFdBQXhCLENBRFY7QUFBQSxNQUVBLGVBQWUsRUFGZjtBQUFBLE1BR0EsVUFBVSxFQUhWO0FBSUEsVUFBUSxTQUFSLEdBQW9CLEVBQXBCO0FBQ0EsWUFBVSxLQUFWLENBQWdCLE9BQWhCLEdBQTBCLENBQTFCOztBQUdBO0FBQ0EsU0FBTyxPQUFQLENBQWdCLFVBQVMsS0FBVCxFQUFnQjs7QUFFOUIsUUFBSSxnQkFBZ0IsRUFBcEI7QUFDQSxZQUFRLE1BQU0sVUFBZCxJQUE0QixFQUE1Qjs7QUFFQTtBQUNBLFFBQUksYUFBYSxXQUNkLE1BRGMsQ0FDUCxVQUFDLElBQUQ7QUFBQSxhQUFVLEtBQUssSUFBTCxDQUFVLFVBQVYsSUFBd0IsTUFBTSxVQUF4QztBQUFBLEtBRE8sQ0FBakI7O0FBR0E7QUFDQSxlQUFXLE9BQVgsQ0FBbUIsVUFBVSxJQUFWLEVBQWdCOztBQUVqQyxVQUFJLG1CQUFtQixNQUFNLGlCQUFOLENBQXdCLFlBQXhCLEVBQXNDLEtBQUssT0FBM0MsQ0FBdkI7QUFDQSxVQUFJLGlCQUFpQixNQUFNLGlCQUFOLENBQXdCLFVBQXhCLEVBQW9DLEtBQUssT0FBekMsQ0FBckI7O0FBRUEsb0JBQWMsSUFBZCxDQUFtQixRQUFRLEdBQVIsQ0FBWSxDQUFDLGdCQUFELEVBQW1CLGNBQW5CLENBQVosRUFBZ0QsSUFBaEQsQ0FBcUQsZ0JBQXJELEVBQXVFLElBQXZFLENBQTRFLFVBQUMsSUFBRCxFQUFVO0FBQ3ZHLGdCQUFRLE1BQU0sVUFBZCxLQUE2QixJQUE3QjtBQUNELE9BRmtCLENBQW5CO0FBSUQsS0FURDs7QUFXQTtBQUNBLFlBQVEsR0FBUixDQUFZLGFBQVosRUFBMkIsSUFBM0IsQ0FBZ0MsWUFBVzs7QUFFekMsY0FBUSxTQUFSLElBQXFCLGtCQUFrQixLQUFsQixFQUF5QixPQUF6QixDQUFyQjtBQUVELEtBSkQ7QUFNRCxHQTVCRDtBQThCRDs7QUFFRDs7O0FBR0EsU0FBUyxlQUFULENBQXlCLE9BQXpCLEVBQWtDLElBQWxDLEVBQXdDOztBQUV0QyxNQUFJLGFBQWEsU0FBUyxjQUFULENBQXdCLGFBQXhCLENBQWpCO0FBQ0EsYUFBVyxTQUFYLEdBQXVCLE9BQXZCOztBQUVBLGFBQVcsU0FBWCxHQUF1QixPQUF2Qjs7QUFFQSxVQUFPLElBQVA7QUFDRSxTQUFLLE9BQUw7QUFDRSxpQkFBVyxTQUFYLElBQXdCLFFBQXhCO0FBQ0E7QUFDRjtBQUNFLGlCQUFXLFNBQVgsSUFBd0IsT0FBeEI7QUFDQTtBQU5KO0FBU0Q7O0FBRUQ7OztBQUdBLFNBQVMsZ0JBQVQsR0FBNEI7QUFDMUIsTUFBSSxhQUFhLFNBQVMsY0FBVCxDQUF3QixhQUF4QixDQUFqQjtBQUNBLGFBQVcsU0FBWCxHQUF1QixPQUF2QjtBQUNEOztBQUVELFNBQVMsWUFBVCxHQUF3Qjs7QUFFdEIsTUFBSSxZQUFZLFNBQVMsY0FBVCxDQUF3QixjQUF4QixDQUFoQjtBQUNBLE1BQUksVUFBVSxTQUFTLGNBQVQsQ0FBd0IsV0FBeEIsQ0FBZDtBQUNBLFVBQVEsU0FBUixHQUFvQixFQUFwQjtBQUNBLFlBQVUsS0FBVixDQUFnQixPQUFoQixHQUEwQixDQUExQjtBQUVEOztBQUdEOzs7O0FBSUEsU0FBUyxTQUFULEdBQXFCOztBQUVuQixRQUFNLE1BQU4sR0FBZSxJQUFmLENBQW9CLFFBQXBCO0FBRUQ7O0FBRUQ7OztBQUdBLFNBQVMsY0FBVCxDQUF3QixPQUF4QixFQUFpQzs7QUFFL0IsTUFBSSxRQUFRLFFBQVEsS0FBUixDQUFjLEdBQWQsQ0FBWjs7QUFFQSxNQUFHLE1BQU0sTUFBTixHQUFlLENBQWxCLEVBQXFCO0FBQ25CO0FBQ0EsV0FBTyxNQUFNLENBQU4sRUFBUyxJQUFULEVBQVA7QUFDRDs7QUFFRDtBQUNBLFNBQU8sT0FBUDtBQUVEOztBQUVEOzs7O0FBSUEsU0FBUyxZQUFULENBQXNCLE9BQXRCLEVBQStCOztBQUU3QixNQUFJLE9BQU8sZUFBZSxPQUFmLENBQVg7O0FBRUE7QUFDQSxTQUFPLE1BQU0sTUFBTixHQUFlLElBQWYsQ0FBb0IsVUFBUyxLQUFULEVBQWU7QUFDeEMsV0FBTyxNQUFNLElBQU4sQ0FBVyxTQUFTLEtBQVQsQ0FBZSxJQUFmLEVBQXFCO0FBQ3JDLGFBQU8sS0FBSyxPQUFMLElBQWdCLElBQXZCO0FBQ0QsS0FGTSxDQUFQO0FBR0QsR0FKTSxDQUFQO0FBTUQ7O0FBRUQ7Ozs7QUFJQSxTQUFTLGFBQVQsQ0FBdUIsSUFBdkIsRUFBNkI7O0FBRTNCLE1BQUksWUFBWSxLQUFLLEtBQUwsQ0FBVyxHQUFYLEVBQWdCLEdBQWhCLENBQW9CO0FBQUEsV0FBTyxTQUFTLEdBQVQsQ0FBUDtBQUFBLEdBQXBCLENBQWhCO0FBQ0EsU0FBTyxVQUFVLENBQVYsSUFBYSxJQUFiLEdBQW9CLFVBQVUsQ0FBVixJQUFhLEVBQWpDLEdBQXNDLFVBQVUsQ0FBVixDQUE3QztBQUVEOztBQUVELFNBQVMsYUFBVCxDQUF1QixPQUF2QixFQUFnQzs7QUFFOUIsTUFBSSxRQUFRLEtBQUssS0FBTCxDQUFXLFVBQVEsSUFBbkIsQ0FBWjtBQUNBLE1BQUksVUFBVSxLQUFLLEtBQUwsQ0FBVyxDQUFDLFVBQVUsUUFBTSxJQUFqQixJQUF1QixFQUFsQyxDQUFkO0FBQ0EsU0FBVSxVQUFVLEtBQVYsQ0FBVixTQUE4QixVQUFVLE9BQVYsQ0FBOUIsU0FBb0QsVUFBVSxVQUFRLEVBQWxCLENBQXBEO0FBRUQ7O0FBRUQsU0FBUyxTQUFULENBQW1CLE1BQW5CLEVBQTJCOztBQUV6QixTQUFPLFNBQVMsQ0FBVCxRQUFnQixNQUFoQixTQUErQixNQUF0QztBQUVEOztBQUVEOzs7Ozs7QUFNQSxTQUFTLGlCQUFULENBQTJCLGNBQTNCLEVBQTJDLFlBQTNDLEVBQXlEOztBQUV2RDtBQUNBLE1BQUksYUFBYSxlQUFlLE1BQWYsQ0FBc0IsVUFBUyxhQUFULEVBQXVCO0FBQzVELFdBQU8sYUFBYSxJQUFiLENBQWtCLFVBQVMsV0FBVCxFQUFxQjtBQUM1QyxhQUFPLFlBQVksT0FBWixJQUF1QixjQUFjLE9BQXJDLElBQ0wsY0FBYyxjQUFjLFlBQTVCLElBQTRDLGNBQWMsWUFBWSxZQUExQixDQUQ5QztBQUVELEtBSE0sQ0FBUDtBQUlELEdBTGdCLENBQWpCOztBQU9BLFNBQU8sVUFBUDtBQUNEOztBQUVEOzs7QUFHQSxTQUFTLFNBQVQsQ0FBbUIsV0FBbkIsRUFBZ0MsU0FBaEMsRUFBMkM7O0FBRXpDLFNBQU8sUUFBUSxHQUFSLENBQVksQ0FBQyxNQUFNLGdCQUFOLENBQXVCLFdBQXZCLENBQUQsRUFBc0MsTUFBTSxnQkFBTixDQUF1QixTQUF2QixDQUF0QyxDQUFaLEVBQXNGLElBQXRGLENBQ0gsaUJBQXlDO0FBQUE7O0FBQUEsUUFBL0IsY0FBK0I7QUFBQSxRQUFmLFlBQWU7OztBQUV2QyxRQUFJLGFBQWEsa0JBQWtCLGNBQWxCLEVBQWtDLFlBQWxDLENBQWpCO0FBQ0EsV0FBTyxFQUFDLE9BQU8sTUFBTSxjQUFOLENBQXFCLFVBQXJCLENBQVIsRUFBMEMsUUFBUSxNQUFNLGlCQUFOLENBQXdCLFVBQXhCLENBQWxELEVBQVA7QUFFRCxHQU5FLENBQVA7QUFRRDs7QUFFRDs7OztBQUlBLFNBQVMsY0FBVCxDQUF3QixHQUF4QixFQUE2Qjs7QUFFM0IsTUFBSSxjQUFKO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLE1BQUksZUFBZSxlQUFlLFNBQVMsY0FBVCxDQUF3QixXQUF4QixFQUFxQyxLQUFwRCxDQUFuQjtBQUNBLE1BQUksYUFBYSxlQUFlLFNBQVMsY0FBVCxDQUF3QixTQUF4QixFQUFtQyxLQUFsRCxDQUFqQjs7QUFFQSxVQUFRLEdBQVIsQ0FBWSxDQUFDLGFBQWEsWUFBYixDQUFELEVBQTZCLGFBQWEsVUFBYixDQUE3QixDQUFaLEVBQW9FLElBQXBFLENBQXlFLFVBQVMsTUFBVCxFQUFnQjs7QUFFdkYsUUFBRyxDQUFDLE9BQU8sQ0FBUCxDQUFELElBQWMsQ0FBQyxPQUFPLENBQVAsQ0FBbEIsRUFBNkI7QUFDM0Isc0JBQ0Usc0dBREYsRUFFRSxPQUZGO0FBSUEsYUFBTyxLQUFQO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBLGNBQVUsWUFBVixFQUF3QixVQUF4QixFQUFvQyxJQUFwQyxDQUF5QyxVQUFTLElBQVQsRUFBZTs7QUFFdEQsY0FBUSxHQUFSLENBQVksQ0FBQyxLQUFLLEtBQU4sRUFBYSxLQUFLLE1BQWxCLENBQVosRUFBdUMsSUFBdkMsQ0FBNEMsaUJBQXlCO0FBQUE7O0FBQUEsWUFBZixLQUFlO0FBQUEsWUFBUixNQUFROzs7QUFFbkUsWUFBRyxPQUFPLE1BQVAsR0FBZ0IsQ0FBbkIsRUFBc0I7QUFDcEIsd0JBQWMsWUFBZCxFQUE0QixVQUE1QixFQUF3QyxLQUF4QyxFQUErQyxNQUEvQztBQUNELFNBRkQsTUFFTztBQUNMLDBCQUFnQixxREFBaEIsRUFBdUUsT0FBdkU7QUFDRDtBQUVGLE9BUkQ7QUFVRCxLQVpEOztBQWNBLFdBQU8sS0FBUDtBQUVELEdBNUJEO0FBK0JEOztBQUVEOzs7QUFHTyxTQUFTLElBQVQsR0FBZ0I7O0FBRXJCO0FBQ0EsZUFBYSxTQUFTLGNBQVQsQ0FBd0IsaUJBQXhCLENBQWI7QUFDQSxhQUFXLFNBQVMsY0FBVCxDQUF3QixlQUF4QixDQUFYO0FBQ0EsaUJBQWUsU0FBUyxjQUFULENBQXdCLFFBQXhCLENBQWY7O0FBRUE7QUFDQTtBQUNBLGVBQWEsZ0JBQWIsQ0FBOEIsT0FBOUIsRUFBdUMsY0FBdkM7QUFFRDs7Ozs7Ozs7UUN0UWUsTSxHQUFBLE07UUFNQSxLLEdBQUEsSztRQU1BLEssR0FBQSxLO1FBS0EsUyxHQUFBLFM7UUFJQSxNLEdBQUEsTTtBQTVFaEIsSUFBTSxVQUFnQixhQUF0QjtBQUNBLElBQU0sYUFBZ0IsWUFBdEI7QUFDQSxJQUFNLFlBQWdCLFdBQXRCO0FBQ0EsSUFBTSxZQUFnQixXQUF0QjtBQUNBLElBQU0sZ0JBQWdCLGdCQUF0QjtBQUNBLElBQU0sYUFBZ0IsWUFBdEI7O0FBRUEsSUFBTSxhQUFhLFNBQWIsVUFBYSxDQUFTLElBQVQsRUFBZTs7QUFFaEMsTUFBSSxPQUFPLEtBQUssSUFBTCxHQUFZLEtBQVosQ0FBa0IsSUFBbEIsQ0FBWDtBQUNBLFNBQU8sS0FBSyxHQUFMLENBQVMsVUFBQyxHQUFEO0FBQUEsV0FBUyxJQUFJLEtBQUosQ0FBVSxHQUFWLENBQVQ7QUFBQSxHQUFULENBQVA7QUFFRCxDQUxEOztBQU9BLElBQU0sZUFBZSxTQUFmLFlBQWUsQ0FBUyxJQUFULEVBQWU7O0FBRWxDLE1BQUksUUFBUSxXQUFXLElBQVgsQ0FBWjtBQUNBLE1BQUksT0FBTyxNQUFNLENBQU4sQ0FBWDtBQUNBLFVBQVEsTUFBTSxLQUFOLENBQVksQ0FBWixDQUFSOztBQUVBLFNBQU8sTUFBTSxHQUFOLENBQVUsVUFBUyxHQUFULEVBQWM7QUFDN0IsUUFBSSxNQUFNLEVBQVY7QUFDQSxTQUFLLE9BQUwsQ0FBYSxVQUFTLEdBQVQsRUFBYyxLQUFkLEVBQXFCO0FBQ2hDLFVBQUksR0FBSixJQUFXLElBQUksS0FBSixDQUFYO0FBQ0QsS0FGRDtBQUdBLFdBQVEsR0FBUjtBQUNELEdBTk0sQ0FBUDtBQVFELENBZEQ7O0FBZ0JBLFNBQVMsZUFBVCxDQUF5QixHQUF6QixFQUE4Qjs7QUFFNUIsU0FBTyxNQUFNLEdBQU4sRUFBVztBQUNkLFlBQVE7QUFETSxHQUFYLEVBRUYsSUFGRSxDQUVHLFVBQVMsUUFBVCxFQUFrQjs7QUFFeEIsV0FBTyxTQUFTLElBQVQsRUFBUDtBQUVELEdBTkksRUFNRixJQU5FLENBTUcsVUFBUyxXQUFULEVBQXNCOztBQUU1QixXQUFPLGFBQWEsV0FBYixDQUFQO0FBRUQsR0FWSSxFQVVGLEtBVkUsQ0FVSSxVQUFTLEtBQVQsRUFBZTs7QUFFdEIsWUFBUSxLQUFSLENBQWMsS0FBZDtBQUVELEdBZEksQ0FBUDtBQWVEOztBQUVEOztBQUVBOzs7O0FBSU8sU0FBUyxNQUFULEdBQWtCOztBQUV2QixTQUFPLGdCQUFnQixVQUFVLFVBQTFCLENBQVA7QUFFRDs7QUFFTSxTQUFTLEtBQVQsR0FBaUI7QUFDdEI7QUFDQSxTQUFPLGdCQUFnQixVQUFVLFNBQTFCLENBQVA7QUFFRDs7QUFFTSxTQUFTLEtBQVQsR0FBaUI7QUFDdEI7QUFDQSxTQUFPLGdCQUFnQixVQUFVLFNBQTFCLENBQVA7QUFDRDs7QUFFTSxTQUFTLFNBQVQsR0FBcUI7QUFDMUIsU0FBTyxnQkFBZ0IsVUFBVSxhQUExQixDQUFQO0FBQ0Q7O0FBRU0sU0FBUyxNQUFULEdBQWtCO0FBQ3ZCLFNBQU8sZ0JBQWdCLFVBQVUsVUFBMUIsQ0FBUDtBQUNEOzs7OztBQzlFRDs7SUFBWSxHOzs7O0FBRVosQ0FBQyxZQUFXO0FBQ1o7O0FBRUUsV0FBUyxxQkFBVCxHQUFpQzs7QUFFL0IsUUFBSSxDQUFDLFVBQVUsYUFBZixFQUE4Qjs7QUFFOUIsY0FBVSxhQUFWLENBQXdCLFFBQXhCLENBQWlDLHFCQUFqQyxFQUF3RCxFQUFDLE9BQU8sR0FBUixFQUF4RCxFQUFzRSxJQUF0RSxDQUEyRSxVQUFTLEdBQVQsRUFBYztBQUN2Rjs7QUFFQSxVQUFJLENBQUMsVUFBVSxhQUFWLENBQXdCLFVBQTdCLEVBQXlDO0FBQ3ZDO0FBQ0Q7QUFFRixLQVBELEVBT0csS0FQSCxDQU9TLFVBQVMsS0FBVCxFQUFnQjs7QUFFdkIsY0FBUSxLQUFSLENBQWMsc0JBQWQsRUFBc0MsS0FBdEM7QUFFRCxLQVhEO0FBYUQ7O0FBRUQsV0FBUyxLQUFULEdBQWlCOztBQUVmLFdBQU8sSUFBSSxPQUFKLENBQVksVUFBUyxPQUFULEVBQWtCLE1BQWxCLEVBQTBCOztBQUUzQztBQUNBLGVBQVMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFlBQVc7QUFDdkQsWUFBRyxTQUFTLFVBQVQsS0FBd0IsU0FBM0IsRUFBc0M7QUFDcEM7QUFDRDtBQUNGLE9BSkQ7QUFNRCxLQVRNLENBQVA7QUFXRDs7QUFHRCxVQUFRLElBQVIsQ0FBYSxZQUFXO0FBQ3RCLFFBQUksSUFBSjtBQUNBO0FBQ0QsR0FIRDtBQUtELENBM0NEOzs7Ozs7OztRQ0tnQixRLEdBQUEsUTtRQXlEQSxNLEdBQUEsTTs7QUFoRWhCOztJQUFZLEk7O0FBQ1o7Ozs7Ozs7O0FBRUEsSUFBSSxvQkFBb0IsS0FBeEI7QUFDQTtBQUNBO0FBQ0E7QUFDTyxTQUFTLFFBQVQsR0FBb0I7O0FBRXpCLFNBQU8sb0JBQU0sSUFBTixDQUFXLGNBQU07O0FBRXBCLFFBQUcsQ0FBQyxFQUFKLEVBQVEsTUFBTSwrQkFBTjs7QUFFUixRQUFJLGNBQWMsR0FBRyxXQUFILENBQWUsT0FBZixDQUFsQjtBQUNBLFFBQUksYUFBYSxZQUFZLFdBQVosQ0FBd0IsT0FBeEIsQ0FBakI7O0FBRUEsV0FBTyxXQUFXLEtBQVgsRUFBUDtBQUVELEdBVEksRUFTRixJQVRFLENBU0csa0JBQVU7O0FBRWhCO0FBQ0EsUUFBRyxTQUFTLENBQVQsSUFBYyxpQkFBakIsRUFBb0M7QUFDbEMsYUFBTyxRQUFRLE9BQVIsRUFBUDtBQUNEOztBQUVELHdCQUFvQixJQUFwQjs7QUFFQTtBQUNBLFdBQU8sS0FBSyxLQUFMLEdBQ0osSUFESSxDQUNDLFVBREQsQ0FBUDtBQUdELEdBdEJJLENBQVA7QUF3QkQ7O0FBR0QsU0FBUyxVQUFULENBQW9CLE9BQXBCLEVBQTZCOztBQUUzQixNQUFHLE9BQUgsRUFBWTs7QUFFUixXQUFPLG9CQUFNLElBQU4sQ0FBVyxTQUFTLGVBQVQsQ0FBeUIsRUFBekIsRUFBNEI7O0FBRTVDLFVBQUksY0FBYyxHQUFHLFdBQUgsQ0FBZSxPQUFmLEVBQXdCLFdBQXhCLENBQWxCO0FBQ0EsVUFBSSxhQUFhLFlBQVksV0FBWixDQUF3QixPQUF4QixDQUFqQjs7QUFFQSxjQUFRLE9BQVIsQ0FBaUIsVUFBUyxJQUFULEVBQWU7QUFDOUIsbUJBQVcsR0FBWCxDQUFlLElBQWY7QUFDRCxPQUZEOztBQUlBLGFBQU8sWUFBWSxRQUFuQjtBQUVELEtBWE0sRUFXSixLQVhJLENBV0UsVUFBUyxLQUFULEVBQWdCOztBQUV2QixjQUFRLEtBQVIsQ0FBYyxLQUFkO0FBRUQsS0FmTSxDQUFQO0FBaUJIO0FBRUY7O0FBRUQ7OztBQUdPLFNBQVMsTUFBVCxDQUFnQixPQUFoQixFQUF5Qjs7QUFFOUIsU0FBTyxXQUNKLElBREksQ0FDQztBQUFBLFdBQU0sbUJBQU47QUFBQSxHQURELEVBRUosSUFGSSxDQUVDLFNBQVMsUUFBVCxDQUFrQixFQUFsQixFQUFxQjs7QUFFekIsUUFBSSxjQUFjLEdBQUcsV0FBSCxDQUFlLE9BQWYsQ0FBbEI7QUFDQSxRQUFJLGFBQWEsWUFBWSxXQUFaLENBQXdCLE9BQXhCLENBQWpCOztBQUVBLFdBQU8sV0FBVyxNQUFYLEVBQVA7QUFDRCxHQVJJLENBQVA7QUFVRDs7Ozs7Ozs7UUN5QmlCLGdCLEdBQUEsZ0I7UUFPQSxjLEdBQUEsYztRQXlCQSxpQixHQUFBLGlCO1FBb0NBLGdCLEdBQUEsZ0I7UUFrQkEsaUIsR0FBQSxpQjs7QUEzTGxCOztJQUFZLEk7O0FBQ1o7Ozs7Ozs7O0FBRUU7Ozs7OztBQU1BLElBQUksb0JBQW9CLEtBQXhCOztBQUVBLFNBQVMsUUFBVCxHQUFvQjs7QUFFbEIsU0FBTyxvQkFBTSxJQUFOLENBQVcsY0FBTTs7QUFFdEIsUUFBRyxDQUFDLEVBQUosRUFBUSxNQUFNLCtCQUFOOztBQUVSLFFBQUksY0FBYyxHQUFHLFdBQUgsQ0FBZSxPQUFmLENBQWxCO0FBQ0EsUUFBSSxhQUFhLFlBQVksV0FBWixDQUF3QixPQUF4QixDQUFqQjs7QUFFQSxXQUFPLFdBQVcsS0FBWCxFQUFQO0FBRUQsR0FUTSxFQVNKLElBVEksQ0FTQyxrQkFBVTs7QUFFaEI7QUFDQSxRQUFHLFNBQVMsQ0FBVCxJQUFjLGlCQUFqQixFQUFvQztBQUNsQyxhQUFPLFFBQVEsT0FBUixFQUFQO0FBQ0Q7O0FBRUQsd0JBQW9CLElBQXBCOztBQUVBO0FBQ0EsV0FBTyxLQUFLLFNBQUwsR0FDSixJQURJLENBQ0MsY0FERCxFQUVKLElBRkksQ0FFQyxLQUFLLEtBRk4sRUFHSixJQUhJLENBR0MsVUFIRCxDQUFQO0FBS0QsR0F4Qk0sQ0FBUDtBQTJCRDs7QUFHRCxTQUFTLGNBQVQsQ0FBd0IsT0FBeEIsRUFBaUM7O0FBRS9CLE1BQUcsT0FBSCxFQUFZOztBQUVSLFdBQU8sb0JBQU0sSUFBTixDQUFXLFNBQVMsZUFBVCxDQUF5QixFQUF6QixFQUE0Qjs7QUFFNUMsVUFBSSxjQUFjLEdBQUcsV0FBSCxDQUFlLFlBQWYsRUFBNkIsV0FBN0IsQ0FBbEI7QUFDQSxVQUFJLGFBQWEsWUFBWSxXQUFaLENBQXdCLFlBQXhCLENBQWpCOztBQUVBLGNBQVEsT0FBUixDQUFpQixVQUFTLElBQVQsRUFBZTtBQUM5QixtQkFBVyxHQUFYLENBQWUsSUFBZjtBQUNELE9BRkQ7O0FBSUEsYUFBTyxZQUFZLFFBQW5CO0FBRUQsS0FYTSxFQVdKLEtBWEksQ0FXRSxVQUFTLEtBQVQsRUFBZ0I7O0FBRXZCO0FBQ0EsY0FBUSxLQUFSLENBQWMsS0FBZDtBQUVELEtBaEJNLENBQVA7QUFrQkg7QUFFRjs7QUFFRCxTQUFTLFVBQVQsQ0FBb0IsT0FBcEIsRUFBNkI7O0FBRTNCLE1BQUcsT0FBSCxFQUFZOztBQUVSLFdBQU8sb0JBQU0sSUFBTixDQUFXLFNBQVMsZUFBVCxDQUF5QixFQUF6QixFQUE0Qjs7QUFFNUMsVUFBSSxjQUFjLEdBQUcsV0FBSCxDQUFlLE9BQWYsRUFBd0IsV0FBeEIsQ0FBbEI7QUFDQSxVQUFJLGFBQWEsWUFBWSxXQUFaLENBQXdCLE9BQXhCLENBQWpCOztBQUVBLGNBQVEsT0FBUixDQUFpQixVQUFTLElBQVQsRUFBZTtBQUM5QixtQkFBVyxHQUFYLENBQWUsSUFBZjtBQUNELE9BRkQ7O0FBSUEsYUFBTyxZQUFZLFFBQW5CO0FBRUQsS0FYTSxFQVdKLEtBWEksQ0FXRSxVQUFTLEtBQVQsRUFBZ0I7O0FBRXZCLGNBQVEsS0FBUixDQUFjLEtBQWQ7QUFFRCxLQWZNLENBQVA7QUFpQkg7QUFFRjs7QUFFRDtBQUNBO0FBQ0E7O0FBRUE7OztBQUdPLFNBQVMsZ0JBQVQsQ0FBMEIsT0FBMUIsRUFBbUM7O0FBRXhDLFNBQU8sS0FBSyxpQkFBTCxDQUF1QixPQUF2QixFQUNKLElBREksRUFBUDtBQUdEOztBQUVNLFNBQVMsY0FBVCxDQUF3QixVQUF4QixFQUFvQzs7QUFFekMsU0FBTyxvQkFBTSxJQUFOLENBQVcsU0FBUyxZQUFULENBQXNCLEVBQXRCLEVBQTBCO0FBQzFDLFFBQUksY0FBYyxHQUFHLFdBQUgsQ0FBZSxPQUFmLENBQWxCO0FBQ0EsUUFBSSxZQUFZLFlBQVksV0FBWixDQUF3QixPQUF4QixDQUFoQjs7QUFFQSxRQUFJLFFBQVEsRUFBWjtBQUNBLGVBQVcsT0FBWCxDQUFtQixTQUFTLGlCQUFULENBQTJCLElBQTNCLEVBQWlDOztBQUVsRCxZQUFNLElBQU4sQ0FBVyxVQUFVLEdBQVYsQ0FBYyxLQUFLLE9BQW5CLENBQVg7QUFFRCxLQUpEOztBQU1BLFdBQU8sUUFBUSxHQUFSLENBQVksS0FBWixDQUFQO0FBRUQsR0FiTSxFQWFKLElBYkksQ0FhQyxVQUFTLEtBQVQsRUFBZ0I7O0FBRXRCLFdBQU8sV0FBVyxHQUFYLENBQWUsVUFBUyxJQUFULEVBQWUsS0FBZixFQUFzQjtBQUMxQyxXQUFLLElBQUwsR0FBWSxNQUFNLEtBQU4sQ0FBWjtBQUNBLGFBQU8sSUFBUDtBQUNELEtBSE0sQ0FBUDtBQUtELEdBcEJNLENBQVA7QUFxQkQ7O0FBRU0sU0FBUyxpQkFBVCxDQUEyQixLQUEzQixFQUFrQzs7QUFFdkM7QUFDQSxTQUFPLG9CQUFNLElBQU4sQ0FBVyxTQUFTLFlBQVQsQ0FBc0IsRUFBdEIsRUFBMEI7QUFDMUMsUUFBSSxjQUFjLEdBQUcsV0FBSCxDQUFlLE9BQWYsQ0FBbEI7QUFDQSxRQUFJLFlBQVksWUFBWSxXQUFaLENBQXdCLE9BQXhCLENBQWhCOztBQUVBLFFBQUksU0FBUyxFQUFiO0FBQ0EsVUFBTSxPQUFOLENBQWMsU0FBUyxpQkFBVCxDQUEyQixJQUEzQixFQUFpQzs7QUFFN0MsYUFBTyxJQUFQLENBQVksVUFBVSxHQUFWLENBQWMsS0FBSyxPQUFuQixDQUFaO0FBRUQsS0FKRDs7QUFNQSxXQUFPLFFBQVEsR0FBUixDQUFZLE1BQVosQ0FBUDtBQUVELEdBYk0sRUFhSixJQWJJLENBYUMsVUFBUyxNQUFULEVBQWlCOztBQUV2QixRQUFJLGNBQWMsRUFBbEI7QUFDQSxRQUFJLGVBQWUsRUFBbkI7QUFDQSxXQUFPLE9BQVAsQ0FBZSxTQUFTLG1CQUFULENBQTZCLElBQTdCLEVBQW1DO0FBQ2hELFVBQUcsWUFBWSxPQUFaLENBQW9CLEtBQUssVUFBekIsS0FBd0MsQ0FBQyxDQUE1QyxFQUErQztBQUM3QyxvQkFBWSxJQUFaLENBQWlCLEtBQUssVUFBdEI7QUFDQSxxQkFBYSxJQUFiLENBQWtCLElBQWxCO0FBQ0Q7QUFDRixLQUxEOztBQU9BLFdBQU8sWUFBUDtBQUVELEdBMUJNLENBQVA7QUE0QkQ7O0FBRUQ7OztBQUdPLFNBQVMsZ0JBQVQsQ0FBMEIsT0FBMUIsRUFBbUM7O0FBRXhDLFNBQU8sV0FDSixJQURJLENBQ0M7QUFBQSxXQUFNLG1CQUFOO0FBQUEsR0FERCxFQUVKLElBRkksQ0FFQyxTQUFTLGVBQVQsQ0FBeUIsRUFBekIsRUFBNEI7O0FBRWhDLFFBQUksY0FBYyxHQUFHLFdBQUgsQ0FBZSxZQUFmLENBQWxCO0FBQ0EsUUFBSSxhQUFhLFlBQVksV0FBWixDQUF3QixZQUF4QixDQUFqQjtBQUNBLFFBQUksWUFBWSxXQUFXLEtBQVgsQ0FBaUIsTUFBakIsQ0FBaEI7O0FBRUEsV0FBTyxVQUFVLE1BQVYsQ0FBaUIsT0FBakIsQ0FBUDtBQUNELEdBVEksQ0FBUDtBQVdEOztBQUVEOzs7QUFHTyxTQUFTLGlCQUFULENBQTJCLE9BQTNCLEVBQW9DLE9BQXBDLEVBQTZDOztBQUVsRCxTQUFPLEtBQUssZ0JBQUwsQ0FBc0IsT0FBdEIsRUFDSixJQURJLENBQ0MsU0FBUyxlQUFULENBQXlCLEtBQXpCLEVBQStCO0FBQ25DLFdBQU8sTUFBTSxNQUFOLENBQWEsVUFBQyxJQUFEO0FBQUEsYUFBVSxLQUFLLE9BQUwsSUFBZ0IsT0FBMUI7QUFBQSxLQUFiLENBQVA7QUFDRCxHQUhJLENBQVA7QUFLRDs7Ozs7Ozs7a0JDaktxQixFOztBQWpDeEI7Ozs7OztBQUVBLElBQUksR0FBSjs7QUFFQTtBQUNBLFNBQVMsWUFBVCxHQUF3Qjs7QUFFdEIsU0FBTyxjQUFJLElBQUosQ0FBUyxRQUFULEVBQW1CLENBQW5CLEVBQXNCLFVBQVMsU0FBVCxFQUFvQjs7QUFFL0MsWUFBTyxVQUFVLFVBQWpCOztBQUVFLFdBQUssQ0FBTDtBQUNFLGtCQUFVLGlCQUFWLENBQTRCLE9BQTVCLEVBQXFDO0FBQ25DLG1CQUFTO0FBRDBCLFNBQXJDOztBQUlBLGtCQUFVLGlCQUFWLENBQTRCLE9BQTVCLEVBQXFDLEVBQUMsU0FBUyxTQUFWLEVBQXJDOztBQUVBLGtCQUFVLGlCQUFWLENBQTRCLFlBQTVCLEVBQTBDLEVBQUMsZUFBZSxJQUFoQixFQUExQzs7QUFFQSxrQkFBVSxpQkFBVixDQUE0QixRQUE1QixFQUFzQztBQUNwQyxtQkFBUztBQUQyQixTQUF0Qzs7QUFJQSxZQUFJLFlBQVksVUFBVSxXQUFWLENBQXNCLFdBQXRCLENBQWtDLFlBQWxDLENBQWhCO0FBQ0Esa0JBQVUsV0FBVixDQUFzQixNQUF0QixFQUE4QixTQUE5QjtBQUNBLGtCQUFVLFdBQVYsQ0FBc0IsTUFBdEIsRUFBOEIsU0FBOUI7O0FBakJKO0FBb0JELEdBdEJNLENBQVA7QUF3QkQ7O0FBRWMsU0FBUyxFQUFULEdBQWM7O0FBRTNCLE1BQUcsT0FBTyxJQUFWLEVBQWdCO0FBQ2QsVUFBTSxjQUFOO0FBQ0Q7O0FBRUQsU0FBTyxHQUFQO0FBRUQ7OztBQ3pDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCAqIGFzIFN0b3BzIGZyb20gJy4vb3JtL1N0b3BzLmpzJztcbmltcG9ydCAqIGFzIFRyaXBzIGZyb20gJy4vb3JtL1RyaXBzLmpzJztcbmltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi9odHRwLmpzJztcblxuLy8gSW50ZXJhY3RpdmUgZWxlbWVudHMgaW4gdGhlIHBhZ2VcbnZhciBkZXBhcnR1cmVzLCBhcnJpdmFscywgc3VibWl0QnV0dG9uO1xuXG4vKiBcbiAgQWRkIHRoZSBvcHRpb25zIHRvIHRoZSBkYXRhbGlzdCBlbGVtZW50cyBpbiB0aGUgZm9ybS5cbiovXG5mdW5jdGlvbiBhZGRTdG9wcyhzdG9wcykge1xuXG4gIHN0b3BzLmZvckVhY2goIChzdG9wKSA9PiB7XG4gICAgXG4gICAgdmFyIG9wdGlvbiA9IGA8b3B0aW9uIHZhbHVlPVwiJHtzdG9wLnN0b3BfbmFtZX0gLSAke3N0b3Auc3RvcF9pZH1cIj48L29wdGlvbj5gO1xuICAgIGRlcGFydHVyZXMuaW5uZXJIVE1MICs9IG9wdGlvbjtcbiAgICBhcnJpdmFscy5pbm5lckhUTUwgKz0gb3B0aW9uO1xuXG4gIH0pO1xuXG59XG5cbi8qXG4gIFRlbXBsYXRlIHRvIGNyZWF0ZSB0aGUgcm93cyBpbiB0aGUgcm91dGUgcmVzdWx0cyB0YWJsZVxuKi9cbmZ1bmN0aW9uIGNyZWF0ZU9wdGlvbkhUTUwoW2RlcGFydHVyZVRpbWUsIGFycml2YWxUaW1lXSkge1xuICAgICAgICBcbiAgdmFyIGR1cmF0aW9uSW5TZWNvbmRzID0gdGltZVRvU2Vjb25kcyhhcnJpdmFsVGltZVswXS5hcnJpdmFsX3RpbWUpIC0gdGltZVRvU2Vjb25kcyhkZXBhcnR1cmVUaW1lWzBdLmFycml2YWxfdGltZSk7XG4gIHZhciBkdXJhdGlvbiA9IHNlY29uZHNUb1RpbWUoZHVyYXRpb25JblNlY29uZHMpO1xuXG4gIHJldHVybiBgPGRpdiBjbGFzcz1cInJvd1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+XG4gICAgICAgICAgICAgICR7ZGVwYXJ0dXJlVGltZVswXS5zdG9wX2lkfSAtICR7ZGVwYXJ0dXJlVGltZVswXS5hcnJpdmFsX3RpbWV9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPlxuICAgICAgICAgICAgICAke2Fycml2YWxUaW1lWzBdLnN0b3BfaWR9IC0gJHthcnJpdmFsVGltZVswXS5hcnJpdmFsX3RpbWV9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPlxuICAgICAgICAgICAgICAke2R1cmF0aW9ufVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+YDtcbiAgXG59XG5cbi8qXG4gIFRlbXBsYXRlIGZvciBlYWNoIHJvdXRlL3NlcnZpY2UgaW4gdGhlIHJlc3VsdHMgXG4qL1xuZnVuY3Rpb24gY3JlYXRlU2VydmljZUhUTUwocm91dGUsIG9wdGlvbnMpIHtcblxuICByZXR1cm4gYDxkaXYgY2xhc3M9XCJcIj5cbiAgICAgICAgICAgIFJvdXRlOiAke3JvdXRlLnJvdXRlX2lkfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJcIj5cbiAgICAgICAgICAgIFNlcnZpY2U6ICR7cm91dGUuc2VydmljZV9pZH1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFibGVcIj4gXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3dcIj4gXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+RGVwYXJ0LiAtIFRpbWU8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTMzIGNlbGxcIj5BcnJpdi4gLSBUaW1lPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+RHVyYXRpb248L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICR7b3B0aW9uc1tyb3V0ZS5zZXJ2aWNlX2lkXX1cbiAgICAgICAgICAgICAgPGhyPlxuICAgICAgICAgIDwvZGl2PmA7XG5cbn1cblxuLypcbiAgU2hvdyB0aGUgcmVzdWx0cyBmcm9tIHRoZSByb3V0ZXMgZm91bmQ6IHJvdXRlLCBzZXJ2aWNlX2lkIGFuZCBhdmFpbGFibGUgdGltZXMgd2l0aCB0cmlwIGR1cmF0aW9uIGZvciB0aGVcbiAgc2VsZWN0ZWQgc3RvcHMuXG4qL1xuZnVuY3Rpb24gc2hvd1RyaXBUaW1lcyhkZXBhcnR1cmVfaWQsIGFycml2YWxfaWQsIHN0b3BfdGltZXMsIHJvdXRlcykge1xuXG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm91dGUtcmVzdWx0JyksXG4gIHJlc3VsdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGltZXRhYmxlJyksXG4gIHVuaXF1ZVJvdXRlcyA9IFtdLFxuICBvcHRpb25zID0gW107XG4gIHJlc3VsdHMuaW5uZXJIVE1MID0gJyc7XG4gIGNvbnRhaW5lci5zdHlsZS5vcGFjaXR5ID0gMTtcblxuXG4gIC8vIEdldCB0aGUgdGltZXMgZm9yIGVhY2ggdHJpcFxuICByb3V0ZXMuZm9yRWFjaCggZnVuY3Rpb24ocm91dGUpIHtcblxuICAgIHZhciB0cmlwc1Byb21pc2VzID0gW107XG4gICAgb3B0aW9uc1tyb3V0ZS5zZXJ2aWNlX2lkXSA9ICcnO1xuXG4gICAgLy8gZ2V0IG9ubHkgdGhlIHRyaXBzIG9mIHRoaXMgc2VydmljZVxuICAgIHZhciByb3V0ZVRyaXBzID0gc3RvcF90aW1lc1xuICAgICAgLmZpbHRlcigoc3RvcCkgPT4gc3RvcC50cmlwLnNlcnZpY2VfaWQgPT0gcm91dGUuc2VydmljZV9pZCApO1xuXG4gICAgLy8gY3JlYXRlIGEgcm93IGZvciBlYWNoIHRyaXBcbiAgICByb3V0ZVRyaXBzLmZvckVhY2goZnVuY3Rpb24gKHRyaXApIHtcblxuICAgICAgdmFyIGRlcGFydHVyZVByb21pc2UgPSBUcmlwcy5nZXRTdG9wSW5UcmlwVGltZShkZXBhcnR1cmVfaWQsIHRyaXAudHJpcF9pZCk7XG4gICAgICB2YXIgYXJyaXZhbFByb21pc2UgPSBUcmlwcy5nZXRTdG9wSW5UcmlwVGltZShhcnJpdmFsX2lkLCB0cmlwLnRyaXBfaWQpO1xuICAgICAgXG4gICAgICB0cmlwc1Byb21pc2VzLnB1c2goUHJvbWlzZS5hbGwoW2RlcGFydHVyZVByb21pc2UsIGFycml2YWxQcm9taXNlXSkudGhlbihjcmVhdGVPcHRpb25IVE1MKS50aGVuKChodG1sKSA9PiB7XG4gICAgICAgIG9wdGlvbnNbcm91dGUuc2VydmljZV9pZF0gKz0gaHRtbDtcbiAgICAgIH0pKTtcblxuICAgIH0pO1xuXG4gICAgLy8gd2hlbiBhbGwgdHJpcHMgYXJlIGZpbmlzaGVkIGNyZWF0ZSBodG1sIGZvciBlYWNoIHJvdXRlLCBhZGRpbmcgdGhlIHRpbWVzIGNhbGN1bGF0ZWQgZm9yIGVhY2ggdHJpcFxuICAgIFByb21pc2UuYWxsKHRyaXBzUHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICAgIHJlc3VsdHMuaW5uZXJIVE1MICs9IGNyZWF0ZVNlcnZpY2VIVE1MKHJvdXRlLCBvcHRpb25zKTtcbiAgICBcbiAgICB9KTtcblxuICB9KTtcblxufVxuXG4vKlxuICBTaG93cyBhIG1lc3NhZ2UgaW4gdGhlIG1lc3NhZ2UtYm94IGVsZW1lbnQuXG4qL1xuZnVuY3Rpb24gc2hvd0luZm9NZXNzYWdlKG1lc3NhZ2UsIHR5cGUpIHtcblxuICB2YXIgbWVzc2FnZUJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZXNzYWdlLWJveCcpO1xuICBtZXNzYWdlQm94LmlubmVySFRNTCA9IG1lc3NhZ2U7XG5cbiAgbWVzc2FnZUJveC5jbGFzc05hbWUgPSAnYWxlcnQnO1xuICBcbiAgc3dpdGNoKHR5cGUpIHtcbiAgICBjYXNlICdlcnJvcic6XG4gICAgICBtZXNzYWdlQm94LmNsYXNzTmFtZSArPSAnIGVycm9yJztcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBtZXNzYWdlQm94LmNsYXNzTmFtZSArPSAnIGluZm8nO1xuICAgICAgYnJlYWs7ICAgIFxuICB9XG5cbn1cblxuLypcbiAgTWFrZXMgdGhlIG1lc3NhZ2UtYm94IGVsZW1lbnQgZGlzYXBwZWFyIHRocm91Z2ggY3NzIGNsYXNzXG4qL1xuZnVuY3Rpb24gY2xlYXJJbmZvTWVzc2FnZSgpIHtcbiAgdmFyIG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZS1ib3gnKTtcbiAgbWVzc2FnZUJveC5jbGFzc05hbWUgPSAnYWxlcnQnO1xufVxuXG5mdW5jdGlvbiBjbGVhclJlc3VsdHMoKSB7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb3V0ZS1yZXN1bHQnKTtcbiAgdmFyIHJlc3VsdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGltZXRhYmxlJyk7XG4gIHJlc3VsdHMuaW5uZXJIVE1MID0gJyc7XG4gIGNvbnRhaW5lci5zdHlsZS5vcGFjaXR5ID0gMDtcblxufVxuXG5cbi8qXG4gIFJlcXVlc3QgdGhlIHN0b3BzIGZyb20gc2VydmVyIGFuZCBhZGQgdGhlbSB0byBhbiBhcnJheVxuICB0byBiZSBhYmxlIHRvIGNoZWNrIHRoYXQgdGhlIHVzZXIgaW5wdXQgaXMgdmFsaWQuXG4qL1xuZnVuY3Rpb24gbG9hZFN0b3BzKCkge1xuXG4gIFN0b3BzLmdldEFsbCgpLnRoZW4oYWRkU3RvcHMpO1xuXG59O1xuXG4vKlxuICBHZXQgdGhlIHN0YXRpb24gY29kZSBmcm9tIGEgc3RyaW5nXG4qL1xuZnVuY3Rpb24gZ2V0U3RhdGlvbkNvZGUoc3RhdGlvbikge1xuXG4gIHZhciBwYXJ0cyA9IHN0YXRpb24uc3BsaXQoJy0nKTtcbiAgXG4gIGlmKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAvLyBUaGlzIGNvdWxkIGJlIGEgc3RyaW5nIGZyb20gdGhlIGRhdGFsaXN0LCBleHRyYWN0IHRoZSBjb2RlXG4gICAgcmV0dXJuIHBhcnRzWzFdLnRyaW0oKTtcbiAgfSBcblxuICAvLyBUaGlzIGNvdWxkIGJlIGEgY29kZSB3cml0dGVuIGJ5IHRoZSB1c2VyXG4gIHJldHVybiBzdGF0aW9uO1xuICBcbn1cblxuLypcbiAgQ2hlY2sgdGhhdCBhIGNvZGUgaXMgZWl0aGVyIGEgcGFpciBzdGF0aW9uIG5hbWUgLSBzdGF0aW9uIGNvZGUgXG4gIGZyb20gdGhlIGZvcm0gZGF0YWxpc3Qgb3IgYSBjb2RlIG9mIGEgc3RvcCB3cml0dGVuIGJ5IHRoZSB1c2VyLlxuKi9cbmZ1bmN0aW9uIGNoZWNrU3RhdGlvbihzdGF0aW9uKSB7XG5cbiAgdmFyIGNvZGUgPSBnZXRTdGF0aW9uQ29kZShzdGF0aW9uKTtcblxuICAvLyBDaGVjayB0aGF0IHRoZSBjb2RlIGlzIGluIHRoZSBsaXN0IG9mIHN0b3BzXG4gIHJldHVybiBTdG9wcy5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKHN0b3BzKXtcbiAgICByZXR1cm4gc3RvcHMuc29tZShmdW5jdGlvbiBjaGVjayhzdG9wKSB7XG4gICAgICByZXR1cm4gc3RvcC5zdG9wX2lkID09IGNvZGU7XG4gICAgfSk7XG4gIH0pO1xuXG59XG5cbi8qXG4gIFRha2VzIGEgdGltZSBpbiAwMDowMDowMCBmb3JtYXQgYW5kIHJldHVybnMgdGhlIG51bWJlciBvZiBzZWNvbmRzXG4gIGZyb20gMDA6MDA6MDAgdG8gdGhlIHByb3ZpZGVkIHRpbWUuXG4qL1xuZnVuY3Rpb24gdGltZVRvU2Vjb25kcyh0aW1lKSB7XG5cbiAgdmFyIHRpbWVQYXJ0cyA9IHRpbWUuc3BsaXQoJzonKS5tYXAobnVtID0+IHBhcnNlSW50KG51bSkpO1xuICByZXR1cm4gdGltZVBhcnRzWzBdKjM2MDAgKyB0aW1lUGFydHNbMV0qNjAgKyB0aW1lUGFydHNbMl07XG5cbn1cblxuZnVuY3Rpb24gc2Vjb25kc1RvVGltZShzZWNvbmRzKSB7XG5cbiAgdmFyIGhvdXJzID0gTWF0aC5mbG9vcihzZWNvbmRzLzM2MDApO1xuICB2YXIgbWludXRlcyA9IE1hdGguZmxvb3IoKHNlY29uZHMgLSBob3VycyozNjAwKS82MCk7XG4gIHJldHVybiBgJHt0d29EaWdpdHMoaG91cnMpfToke3R3b0RpZ2l0cyhtaW51dGVzKX06JHt0d29EaWdpdHMoc2Vjb25kcyU2MCl9YDtcblxufVxuXG5mdW5jdGlvbiB0d29EaWdpdHMobnVtYmVyKSB7XG4gIFxuICByZXR1cm4gbnVtYmVyID4gOSA/IGAke251bWJlcn1gIDogYDAke251bWJlcn1gOyBcblxufVxuXG4vKlxuICBBdXhpbGlhcnkgZnVuY3Rpb24gdG8gZmluZCB0cmlwcyB0aGF0IG1lZXQgdGhlIHJlcXVpcmVtZW50cyBcbiAgIC0gQSB2YWxpZCB0cmlwIG11c3QgZ28gdG8gYm90aCB0aGUgZGVwYXJ0dXJlIHN0b3AgYW5kIHRoZSBhcnJpdmFsIHN0b3BcbiAgIC0gQSB2YWxpZCB0cmlwIG11c3QgZ28gZmlyc3QgdG8gdGhlIGRlcGFydHVyZSBzdG9wLCBpZSB0aGUgZGVwYXJ0dXJlIHN0b3AgdGltZSBtdXN0IFxuICAgYmUgYmVmb3JlIHRoZSBhcnJpdmFsIHN0b3AgdGltZS5cbiovXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdUcmlwcyhkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzKSB7XG5cbiAgLy8gZ2V0cyBhbGwgdHJpcHMgdGhhdCBnb2VzIHRvIHRoZSBkZXBhcnR1cmUgc3RvcCBhbmQgdGhlIGFycml2YWwgc3RvcFxuICB2YXIgdmFsaWRUcmlwcyA9IGRlcGFydHVyZVRpbWVzLmZpbHRlcihmdW5jdGlvbihkZXBhcnR1cmVUcmlwKXtcbiAgICByZXR1cm4gYXJyaXZhbFRpbWVzLnNvbWUoZnVuY3Rpb24oYXJyaXZhbFRyaXApe1xuICAgICAgcmV0dXJuIGFycml2YWxUcmlwLnRyaXBfaWQgPT0gZGVwYXJ0dXJlVHJpcC50cmlwX2lkICYmIFxuICAgICAgICB0aW1lVG9TZWNvbmRzKGRlcGFydHVyZVRyaXAuYXJyaXZhbF90aW1lKSA8IHRpbWVUb1NlY29uZHMoYXJyaXZhbFRyaXAuYXJyaXZhbF90aW1lKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHZhbGlkVHJpcHM7XG59XG5cbi8qXG4gIEZpbmRzIHRyaXBzIGJldHdlZW4gdHdvIHN0YXRpb25zLCByZXR1cm5zIHRoZSB0cmlwcyBpZHNcbiovXG5mdW5jdGlvbiBmaW5kVHJpcHMoZGVwYXJ0dXJlSWQsIGFycml2YWxJZCkge1xuXG4gIHJldHVybiBQcm9taXNlLmFsbChbVHJpcHMuZ2V0VHJpcFN0b3BUaW1lcyhkZXBhcnR1cmVJZCksIFRyaXBzLmdldFRyaXBTdG9wVGltZXMoYXJyaXZhbElkKV0pLnRoZW4oXG4gICAgICBmdW5jdGlvbihbZGVwYXJ0dXJlVGltZXMsIGFycml2YWxUaW1lc10pIHtcbiAgICAgIFxuICAgICAgICB2YXIgc3RvcF90aW1lcyA9IGZpbmRNYXRjaGluZ1RyaXBzKGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpO1xuICAgICAgICByZXR1cm4ge3RyaXBzOiBUcmlwcy5hcHBlbmRUcmlwSW5mbyhzdG9wX3RpbWVzKSwgcm91dGVzOiBUcmlwcy5nZXRSb3V0ZXNGb3JUcmlwcyhzdG9wX3RpbWVzKX07XG5cbiAgICAgIH0pO1xuXG59XG5cbi8qXG4gIFN1Ym1pdCB0aGUgdXNlciBzZWxlY3Rpb24gYW5kIHNob3cgdGhlIHJvdXRlIGlmIGF2YWlsYWJsZSBvciBhblxuICBlcnJvciBtZXNzYWdlIGlmIG5vIHJvdXRlIGlzIGF2YWlsYWJsZS5cbiovXG5mdW5jdGlvbiBzdWJtaXRTdGF0aW9ucyhldnQpIHtcblxuICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgY2xlYXJJbmZvTWVzc2FnZSgpO1xuICBjbGVhclJlc3VsdHMoKTtcbiAgXG4gIC8vIGdldCB0aGUgaW5wdXRzIHZhbHVlc1xuICB2YXIgZGVwYXJ0dXJlX2lkID0gZ2V0U3RhdGlvbkNvZGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGFydHVyZScpLnZhbHVlKTtcbiAgdmFyIGFycml2YWxfaWQgPSBnZXRTdGF0aW9uQ29kZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXJyaXZhbCcpLnZhbHVlKTtcblxuICBQcm9taXNlLmFsbChbY2hlY2tTdGF0aW9uKGRlcGFydHVyZV9pZCksIGNoZWNrU3RhdGlvbihhcnJpdmFsX2lkKV0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICBcbiAgICBpZighcmVzdWx0WzBdIHx8ICFyZXN1bHRbMV0pIHtcbiAgICAgIHNob3dJbmZvTWVzc2FnZShcbiAgICAgICAgJ1lvdSBoYXZlIHRvIHNlbGVjdCBhIHZhbGlkIGRlcGFydHVyZSBhbmQgYXJyaXZhbCBzdGF0aW9ucyBmcm9tIHRoZSBsaXN0cyBvciB3cml0ZSBhIHZhbGlkIHN0b3AgY29kZS4nLFxuICAgICAgICAnZXJyb3InXG4gICAgICAgICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8vIElmIHRoZSBkZXBhcnR1cmUgYW5kIGFycml2YWwgc3RhdGlvbnMgYXJlIGNvcnJlY3RcbiAgICAvLyBzZWFyY2ggZm9yIGEgdHJpcCBiZXR3ZWVuIHRoZW0gYW5kIHNob3cgdGhlIHRpbWVzIGFuZCByb3V0ZVxuICAgIGZpbmRUcmlwcyhkZXBhcnR1cmVfaWQsIGFycml2YWxfaWQpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgICBQcm9taXNlLmFsbChbZGF0YS50cmlwcywgZGF0YS5yb3V0ZXNdKS50aGVuKGZ1bmN0aW9uKFt0cmlwcywgcm91dGVzXSl7XG4gICAgICAgIFxuICAgICAgICBpZihyb3V0ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHNob3dUcmlwVGltZXMoZGVwYXJ0dXJlX2lkLCBhcnJpdmFsX2lkLCB0cmlwcywgcm91dGVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzaG93SW5mb01lc3NhZ2UoJ1dlIGNvdWxkblxcJ3QgZmluZCBhIHRyaXAgYmV0d2VlbiB0aGVzZSB0d28gc3RhdGlvbnMnLCAnZXJyb3InKTtcbiAgICAgICAgfVxuXG4gICAgICB9KTtcblxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIH0pO1xuXG5cbn1cblxuLypcbiAgSW5pdGlhbGl6ZSB0aGUgYXBwbGljYXRpb24gXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXQoKSB7XG5cbiAgLy8gZ2V0IHRoZSBpbnRlcmFjdGl2ZSBlbGVtZW50cyBvZiB0aGUgaW50ZXJmYWNlXG4gIGRlcGFydHVyZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVwYXJ0dXJlLXN0b3BzJyk7XG4gIGFycml2YWxzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fycml2YWwtc3RvcHMnKTtcbiAgc3VibWl0QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlYXJjaCcpO1xuXG4gIC8vIFBvcHVsYXRlIGRhdGFsaXN0cyBhbmQgYWRkIGxpc3RlbmVyc1xuICBsb2FkU3RvcHMoKTtcbiAgc3VibWl0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc3VibWl0U3RhdGlvbnMpO1xuXG59O1xuIiwiY29uc3QgYmFzZVVybCAgICAgICA9ICcvZGlzdC9kYXRhLyc7XG5jb25zdCByb3V0ZXNGaWxlICAgID0gJ3JvdXRlcy50eHQnO1xuY29uc3QgdHJpcHNGaWxlICAgICA9ICd0cmlwcy50eHQnO1xuY29uc3Qgc3RvcHNGaWxlICAgICA9ICdzdG9wcy50eHQnO1xuY29uc3Qgc3RvcFRpbWVzRmlsZSA9ICdzdG9wX3RpbWVzLnR4dCc7XG5jb25zdCBzaGFwZXNGaWxlICAgID0gJ3NoYXBlcy50eHQnO1xuXG5jb25zdCBjc3ZUb0FycmF5ID0gZnVuY3Rpb24odGV4dCkge1xuICBcbiAgdmFyIHJvd3MgPSB0ZXh0LnRyaW0oKS5zcGxpdCgnXFxuJyk7XG4gIHJldHVybiByb3dzLm1hcCgocm93KSA9PiByb3cuc3BsaXQoJywnKSk7XG5cbn07XG5cbmNvbnN0IGNzdlRvT2JqZWN0cyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICB2YXIgdGFibGUgPSBjc3ZUb0FycmF5KHRleHQpO1xuICB2YXIga2V5cyA9IHRhYmxlWzBdO1xuICB0YWJsZSA9IHRhYmxlLnNsaWNlKDEpO1xuXG4gIHJldHVybiB0YWJsZS5tYXAoZnVuY3Rpb24ocm93KSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXksIGluZGV4KSB7XG4gICAgICBvYmpba2V5XSA9IHJvd1tpbmRleF07XG4gICAgfSk7XG4gICAgcmV0dXJuICBvYmo7XG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGdldENzdkFzT2JqZWN0cyh1cmwpIHtcblxuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXG4gICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuXG4gICAgfSkudGhlbihmdW5jdGlvbih0ZXh0Q29udGVudCkge1xuXG4gICAgICByZXR1cm4gY3N2VG9PYmplY3RzKHRleHRDb250ZW50KTtcblxuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICB9KTtcbn1cblxuLy8gQVBJXG5cbi8qXG4gIFJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgd2l0aCB0aGUgbmFtZXMgb2YgdGhlIFxuICBhdmFpbGFibGUgbGluZXMuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIHJvdXRlcygpIHtcblxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyByb3V0ZXNGaWxlKTtcblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRyaXBzKCkge1xuICAvLyBnZXQgdGhlIHJvdXRlL2xpbmUgYW5kIHJldHVybiB0aGUgdGltZXMgZm9yIHRoaXMgbGluZVxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyB0cmlwc0ZpbGUpO1xuXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gc3RvcHMoKSB7XG4gIC8vIHJldHVybnMgdGhlIHN0b3BzIG9mIHRoaXMgbGluZVxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyBzdG9wc0ZpbGUpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BUaW1lcygpIHtcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc3RvcFRpbWVzRmlsZSk7IFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNoYXBlcygpIHtcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc2hhcGVzRmlsZSk7IFxufTtcbiIsImltcG9ydCAqIGFzIEFwcCBmcm9tICcuL2FwcC5qcyc7XG5cbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0JztcblxuICBmdW5jdGlvbiByZWdpc3RlclNlcnZpY2VXb3JrZXIoKSB7XG5cbiAgICBpZiAoIW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyKSByZXR1cm47XG5cbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignLi9zZXJ2aWNlX3dvcmtlci5qcycsIHtzY29wZTogJy8nfSkudGhlbihmdW5jdGlvbihyZWcpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ1JlZ2lzdHJhdGlvbiB3b3JrZWQhJywgcmVnKTtcblxuICAgICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5jb250cm9sbGVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1JlZ2lzdHJhdGlvbiBmYWlsZWQhJywgZXJyb3IpO1xuICAgIFxuICAgIH0pO1xuXG4gIH1cblxuICBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgLy8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB3aGVuIHRoZSBkb2N1bWVudCBpcyByZWFkeVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZihkb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnbG9hZGluZycpIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgfTtcblxuXG4gIHJlYWR5KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICBBcHAuaW5pdCgpO1xuICAgIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpO1xuICB9KTtcblxufSkoKTsiLCJpbXBvcnQgKiBhcyBIdHRwIGZyb20gJy4uL2h0dHAuanMnO1xuaW1wb3J0IGlkYiBmcm9tICcuL2RiLmpzJztcblxudmFyIHdhaXRpbmdGb3JOZXR3b3JrID0gZmFsc2U7XG4vLyBJZiBpbmRleGVkREIgaXMgcG9wdWxhdGVkLCBnZXQgdGhlIGRhdGEgYW5kIHRyeSB0byB1cGRhdGUgZnJvbSBuZXR3b3JrXG4vLyBlbHNlIHRyeSB0byBnZXQgdGhlIGRhdGEgZnJvbSBuZXR3b3JrIGFuZCBzYXZlIGl0XG4vLyBlbHNlIHdlIHNob3VsZCBzaG93IGEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgdG8gdGhlIHVzZXIsIHRoZSBhcHAgaXMgbm90YSBhdmFpbGFibGUuXG5leHBvcnQgZnVuY3Rpb24gc2V0U3RvcHMoKSB7XG5cbiAgcmV0dXJuIGlkYigpLnRoZW4oZGIgPT4ge1xuXG4gICAgICBpZighZGIpIHRocm93ICdXZSBjb3VsZG5cXCd0IGFjY2VzcyBJbmRleGVkREInO1xuXG4gICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbigndHJpcHMnKTtcbiAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgIHJldHVybiB0cmlwc1N0b3JlLmNvdW50KCk7XG5cbiAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzIHNvbWV0aGluZyBpbiB0aGUgZGIsIGRvbid0IGJvdGhlciBpbiBnZXR0aW5nIHRoZSBkYXRhIGFnYWluIGZyb20gbmV0d29ya1xuICAgICAgaWYocmVzdWx0ID4gMCB8fCB3YWl0aW5nRm9yTmV0d29yaykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIHdhaXRpbmdGb3JOZXR3b3JrID0gdHJ1ZTtcblxuICAgICAgLy8gaWYgdGhlcmUgaXMgbm90aGluZyBpbiB0aGUgdHJpcHMgYW5kIHRpbWVzIHRhYmxlLCBmaWxsIHRoZW0hXG4gICAgICByZXR1cm4gSHR0cC5zdG9wcygpXG4gICAgICAgIC50aGVuKHN0b3JlU3RvcHMpO1xuXG4gICAgfSk7XG5cbn1cblxuXG5mdW5jdGlvbiBzdG9yZVN0b3BzKHJlc3VsdHMpIHtcblxuICBpZihyZXN1bHRzKSB7IFxuXG4gICAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBzdG9yZVN0b3BzSW5JREIoZGIpe1xuXG4gICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wcycsICdyZWFkd3JpdGUnKTtcbiAgICAgICAgdmFyIHN0b3BzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcHMnKTtcblxuICAgICAgICByZXN1bHRzLmZvckVhY2goIGZ1bmN0aW9uKHN0b3ApIHtcbiAgICAgICAgICBzdG9wc1N0b3JlLnB1dChzdG9wKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLmNvbXBsZXRlO1xuXG4gICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgICB9KTtcblxuICB9XG5cbn1cblxuLypcbiAgR2V0IGFsbCB0aGUgc3RvcHNcbiovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsKHN0b3BfaWQpIHtcblxuICByZXR1cm4gc2V0U3RvcHMoKVxuICAgIC50aGVuKCgpID0+IGlkYigpKVxuICAgIC50aGVuKGZ1bmN0aW9uIGdldFN0b3BzKGRiKXtcblxuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3N0b3BzJyk7XG4gICAgICB2YXIgc3RvcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wcycpO1xuXG4gICAgICByZXR1cm4gc3RvcHNTdG9yZS5nZXRBbGwoKTtcbiAgICB9KTtcblxufTtcblxuIiwiaW1wb3J0ICogYXMgSHR0cCBmcm9tICcuLi9odHRwLmpzJztcbmltcG9ydCBpZGIgZnJvbSAnLi9kYi5qcyc7XG5cbiAgLypcbiAgICBUaGlzIGZ1bmN0aW9uIGNoZWNrcyB0aGF0IHRoZSBkYXRhIGlzIGluIEluZGV4ZWREQiwgaWYgbm90LCBpdCBnZXRzIGl0IGZyb20gbmV0d29yay9jYWNoZVxuICAgIGFuZCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGRhdGEgaXMgc3RvcmVkIGluIElEQi5cbiAgICBUaGlzIHdheSB3ZSBkb24ndCBuZWVkIGFueSBpbml0aWFsaXphdGlvbiBmdW5jdGlvbiwganVzdCBjYWxsIHRoaXMgZnVuY3Rpb24gaW4gZWFjaCByZXRyaWV2aW5nXG4gICAgbWV0aG9kIGFuZCBpdCB3aWxsIGdldCBzdXJlIHRoYXQgZXZlcnl0aGluZyBpcyBzZXQgdXAgYmVmb3JlIHRyeWluZyB0byBnZXQgdGhlIGNvbnRlbnQuXG4gICovXG4gIHZhciB3YWl0aW5nRm9yTmV0d29yayA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIHNldFRyaXBzKCkge1xuXG4gICAgcmV0dXJuIGlkYigpLnRoZW4oZGIgPT4ge1xuXG4gICAgICBpZighZGIpIHRocm93ICdXZSBjb3VsZG5cXCd0IGFjY2VzcyBJbmRleGVkREInO1xuXG4gICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbigndHJpcHMnKTtcbiAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgIHJldHVybiB0cmlwc1N0b3JlLmNvdW50KCk7XG5cbiAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzIHNvbWV0aGluZyBpbiB0aGUgZGIsIGRvbid0IGJvdGhlciBpbiBnZXR0aW5nIHRoZSBkYXRhIGFnYWluIGZyb20gbmV0d29ya1xuICAgICAgaWYocmVzdWx0ID4gMCB8fCB3YWl0aW5nRm9yTmV0d29yaykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIHdhaXRpbmdGb3JOZXR3b3JrID0gdHJ1ZTtcblxuICAgICAgLy8gaWYgdGhlcmUgaXMgbm90aGluZyBpbiB0aGUgdHJpcHMgYW5kIHRpbWVzIHRhYmxlLCBmaWxsIHRoZW0hXG4gICAgICByZXR1cm4gSHR0cC5zdG9wVGltZXMoKVxuICAgICAgICAudGhlbihzdG9yZVN0b3BUaW1lcylcbiAgICAgICAgLnRoZW4oSHR0cC50cmlwcylcbiAgICAgICAgLnRoZW4oc3RvcmVUcmlwcyk7XG5cbiAgICB9KTtcblxuXG4gIH1cblxuXG4gIGZ1bmN0aW9uIHN0b3JlU3RvcFRpbWVzKHJlc3VsdHMpIHtcblxuICAgIGlmKHJlc3VsdHMpIHsgXG5cbiAgICAgICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gc3RvcmVUcmlwc0luSURCKGRiKXtcblxuICAgICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wX3RpbWVzJywgJ3JlYWR3cml0ZScpO1xuICAgICAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BfdGltZXMnKTtcblxuICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaCggZnVuY3Rpb24odHJpcCkge1xuICAgICAgICAgICAgdHJpcHNTdG9yZS5wdXQodHJpcCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gdHJhbnNhY3Rpb24uY29tcGxldGU7XG5cbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcblxuICAgICAgICAgIC8vIHRoZSB0cmFuc2FjdGlvbiBkaWRuJ3QgY29tcGxldGUsIHNvIHRoZSB0YWJsZSBzaG91bGQgYmUgZW1wdHlcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICB9XG5cbiAgZnVuY3Rpb24gc3RvcmVUcmlwcyhyZXN1bHRzKSB7XG5cbiAgICBpZihyZXN1bHRzKSB7IFxuXG4gICAgICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIHN0b3JlVHJpcHNJbklEQihkYil7XG5cbiAgICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbigndHJpcHMnLCAncmVhZHdyaXRlJyk7XG4gICAgICAgICAgdmFyIHRyaXBzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgndHJpcHMnKTtcblxuICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaCggZnVuY3Rpb24odHJpcCkge1xuICAgICAgICAgICAgdHJpcHNTdG9yZS5wdXQodHJpcCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gdHJhbnNhY3Rpb24uY29tcGxldGU7XG5cbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcblxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gIH1cblxuICAvLyBJZiBpbmRleGVkREIgaXMgcG9wdWxhdGVkLCBnZXQgdGhlIGRhdGEgYW5kIHRyeSB0byB1cGRhdGUgZnJvbSBuZXR3b3JrXG4gIC8vIGVsc2UgdHJ5IHRvIGdldCB0aGUgZGF0YSBmcm9tIG5ldHdvcmsgYW5kIHNhdmUgaXRcbiAgLy8gZWxzZSB3ZSBzaG91bGQgc2hvdyBhIGN1c3RvbSBlcnJvciBtZXNzYWdlIHRvIHRoZSB1c2VyLCB0aGUgYXBwIGlzIG5vdGEgYXZhaWxhYmxlLlxuXG4gIC8qXG4gICAgR2V0IHRoZSB0cmlwcyB0aGF0IHN0b3AgYXQgc3RvcF9pZCwgb25lIHBlciByb3V0ZSwgaW5kZXBlbmRlbnRseSBvZiBzdG9wIHRpbWVzXG4gICovXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXRSb3V0ZXNGb3JTdG9wKHN0b3BfaWQpIHtcblxuICAgIHJldHVybiB0aGlzLmdldFRyaXBzU3RvcFRpbWVzKHN0b3BfaWQpXG4gICAgICAudGhlbigpO1xuXG4gIH07XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFRyaXBJbmZvKHN0b3BfdGltZXMpIHtcblxuICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIGdldEFsbFJvdXRlcyhkYikge1xuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJyk7XG4gICAgICB2YXIgdHJpcFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgIHZhciB0cmlwcyA9IFtdO1xuICAgICAgc3RvcF90aW1lcy5mb3JFYWNoKGZ1bmN0aW9uIGFwcGVuZFRyaXBQcm9taXNlKHRyaXApIHtcblxuICAgICAgICB0cmlwcy5wdXNoKHRyaXBTdG9yZS5nZXQodHJpcC50cmlwX2lkKSk7XG5cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwodHJpcHMpO1xuICAgICAgXG4gICAgfSkudGhlbihmdW5jdGlvbih0cmlwcykgeyBcblxuICAgICAgcmV0dXJuIHN0b3BfdGltZXMubWFwKGZ1bmN0aW9uKHN0b3AsIGluZGV4KSB7XG4gICAgICAgIHN0b3AudHJpcCA9IHRyaXBzW2luZGV4XTtcbiAgICAgICAgcmV0dXJuIHN0b3A7XG4gICAgICB9KTtcblxuICAgIH0pO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldFJvdXRlc0ZvclRyaXBzKHRyaXBzKSB7XG5cbiAgICAvLyBnZXQgdGhlIHJvdXRlcyBmb3IgdGhpcyB0cmlwc1xuICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIGdldEFsbFJvdXRlcyhkYikge1xuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJyk7XG4gICAgICB2YXIgdHJpcFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgIHZhciByb3V0ZXMgPSBbXTtcbiAgICAgIHRyaXBzLmZvckVhY2goZnVuY3Rpb24gYXBwZW5kVHJpcFByb21pc2UodHJpcCkge1xuXG4gICAgICAgIHJvdXRlcy5wdXNoKHRyaXBTdG9yZS5nZXQodHJpcC50cmlwX2lkKSk7XG5cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocm91dGVzKTtcbiAgICAgIFxuICAgIH0pLnRoZW4oZnVuY3Rpb24ocm91dGVzKSB7XG5cbiAgICAgIHZhciBzZXJ2aWNlX2lkcyA9IFtdO1xuICAgICAgdmFyIHVuaXF1ZVJvdXRlcyA9IFtdO1xuICAgICAgcm91dGVzLmZvckVhY2goZnVuY3Rpb24gZ2V0VW5pcXVlU2VydmljZUlkcyh0cmlwKSB7XG4gICAgICAgIGlmKHNlcnZpY2VfaWRzLmluZGV4T2YodHJpcC5zZXJ2aWNlX2lkKSA9PSAtMSkge1xuICAgICAgICAgIHNlcnZpY2VfaWRzLnB1c2godHJpcC5zZXJ2aWNlX2lkKTtcbiAgICAgICAgICB1bmlxdWVSb3V0ZXMucHVzaCh0cmlwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB1bmlxdWVSb3V0ZXM7XG5cbiAgICB9KTtcblxuICB9O1xuXG4gIC8qXG4gICAgR2V0IGFsbCB0aGUgdGltZXMgZm9yIGEgc3RvcFxuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0VHJpcFN0b3BUaW1lcyhzdG9wX2lkKSB7XG5cbiAgICByZXR1cm4gc2V0VHJpcHMoKVxuICAgICAgLnRoZW4oKCkgPT4gaWRiKCkpXG4gICAgICAudGhlbihmdW5jdGlvbiBnZXRUcmlwc0ZvclN0b3AoZGIpe1xuXG4gICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wX3RpbWVzJyk7XG4gICAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BfdGltZXMnKTtcbiAgICAgICAgdmFyIHN0b3BJbmRleCA9IHRyaXBzU3RvcmUuaW5kZXgoJ3N0b3AnKTtcblxuICAgICAgICByZXR1cm4gc3RvcEluZGV4LmdldEFsbChzdG9wX2lkKTtcbiAgICAgIH0pO1xuXG4gIH07XG5cbiAgLypcbiAgICBHZXQgdGhlIHRpbWUgZm9yIGEgc3RvcCBhbmQgYSB0cmlwXG4gICovXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXRTdG9wSW5UcmlwVGltZShzdG9wX2lkLCB0cmlwX2lkKSB7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRUcmlwU3RvcFRpbWVzKHN0b3BfaWQpXG4gICAgICAudGhlbihmdW5jdGlvbiBnZXRUaW1lRm9yQVRyaXAodHJpcHMpe1xuICAgICAgICByZXR1cm4gdHJpcHMuZmlsdGVyKCh0cmlwKSA9PiB0cmlwLnRyaXBfaWQgPT0gdHJpcF9pZCk7XG4gICAgICB9KTtcblxuICB9IiwiaW1wb3J0IGlkYiBmcm9tICcuLi8uLi9ub2RlX21vZHVsZXMvaWRiL2xpYi9pZGIuanMnO1xuXG52YXIgX2RiO1xuXG4vLyBUaGlzIGNsYXNzIHdvcmtzIGFzIGEgT1JNIHRoYXQgZ2V0cyB0aGUgZGF0YSBmcm9tIGluZGV4ZWREQlxuZnVuY3Rpb24gb3BlbkRhdGFiYXNlKCkge1xuICBcbiAgcmV0dXJuIGlkYi5vcGVuKCd0cmFpbnMnLCAxLCBmdW5jdGlvbih1cGdyYWRlRGIpIHtcbiAgICBcbiAgICBzd2l0Y2godXBncmFkZURiLm9sZFZlcnNpb24pIHtcbiAgICBcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdzdG9wcycsIHtcbiAgICAgICAgICBrZXlQYXRoOiAnc3RvcF9pZCdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCd0cmlwcycsIHtrZXlQYXRoOiAndHJpcF9pZCd9KTtcblxuICAgICAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3N0b3BfdGltZXMnLCB7YXV0b0luY3JlbWVudDogdHJ1ZX0pO1xuXG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncm91dGVzJywge1xuICAgICAgICAgIGtleVBhdGg6ICdyb3V0ZV9pZCdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHRyaXBTdG9yZSA9IHVwZ3JhZGVEYi50cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcF90aW1lcycpO1xuICAgICAgICB0cmlwU3RvcmUuY3JlYXRlSW5kZXgoJ3N0b3AnLCAnc3RvcF9pZCcpO1xuICAgICAgICB0cmlwU3RvcmUuY3JlYXRlSW5kZXgoJ3RyaXAnLCAndHJpcF9pZCcpO1xuXG4gICAgfVxuICB9KTtcblxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkYigpIHtcbiAgXG4gIGlmKF9kYiA9PSBudWxsKSB7XG4gICAgX2RiID0gb3BlbkRhdGFiYXNlKCk7XG4gIH0gXG5cbiAgcmV0dXJuIF9kYjtcblxufTsiLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gdG9BcnJheShhcnIpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVxdWVzdC5yZXN1bHQpO1xuICAgICAgfTtcblxuICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciByZXF1ZXN0O1xuICAgIHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0ID0gb2JqW21ldGhvZF0uYXBwbHkob2JqLCBhcmdzKTtcbiAgICAgIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0pO1xuXG4gICAgcC5yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICByZXR1cm4gcDtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKTtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgcC5yZXF1ZXN0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UHJvcGVydGllcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm94eUNsYXNzLnByb3RvdHlwZSwgcHJvcCwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXS5hcHBseSh0aGlzW3RhcmdldFByb3BdLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoSW5kZXgsICdfaW5kZXgnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnbXVsdGlFbnRyeScsXG4gICAgJ3VuaXF1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ2dldCcsXG4gICAgJ2dldEtleScsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XG4gICAgdGhpcy5fY3Vyc29yID0gY3Vyc29yO1xuICAgIHRoaXMuX3JlcXVlc3QgPSByZXF1ZXN0O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEN1cnNvciwgJ19jdXJzb3InLCBbXG4gICAgJ2RpcmVjdGlvbicsXG4gICAgJ2tleScsXG4gICAgJ3ByaW1hcnlLZXknLFxuICAgICd2YWx1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXG4gICAgJ3VwZGF0ZScsXG4gICAgJ2RlbGV0ZSdcbiAgXSk7XG5cbiAgLy8gcHJveHkgJ25leHQnIG1ldGhvZHNcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIGlmICghKG1ldGhvZE5hbWUgaW4gSURCQ3Vyc29yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICBDdXJzb3IucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3QoY3Vyc29yLl9yZXF1ZXN0KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcbiAgfVxuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5jcmVhdGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuY3JlYXRlSW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5pbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdpbmRleE5hbWVzJyxcbiAgICAnYXV0b0luY3JlbWVudCdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ3B1dCcsXG4gICAgJ2FkZCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2NsZWFyJyxcbiAgICAnZ2V0JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ2RlbGV0ZUluZGV4J1xuICBdKTtcblxuICBmdW5jdGlvbiBUcmFuc2FjdGlvbihpZGJUcmFuc2FjdGlvbikge1xuICAgIHRoaXMuX3R4ID0gaWRiVHJhbnNhY3Rpb247XG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QoaWRiVHJhbnNhY3Rpb24uZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIFRyYW5zYWN0aW9uLnByb3RvdHlwZS5vYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fdHgub2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fdHgsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhUcmFuc2FjdGlvbiwgJ190eCcsIFtcbiAgICAnb2JqZWN0U3RvcmVOYW1lcycsXG4gICAgJ21vZGUnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhUcmFuc2FjdGlvbiwgJ190eCcsIElEQlRyYW5zYWN0aW9uLCBbXG4gICAgJ2Fib3J0J1xuICBdKTtcblxuICBmdW5jdGlvbiBVcGdyYWRlREIoZGIsIG9sZFZlcnNpb24sIHRyYW5zYWN0aW9uKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgICB0aGlzLm9sZFZlcnNpb24gPSBvbGRWZXJzaW9uO1xuICAgIHRoaXMudHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24pO1xuICB9XG5cbiAgVXBncmFkZURCLnByb3RvdHlwZS5jcmVhdGVPYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fZGIuY3JlYXRlT2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhVcGdyYWRlREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKFVwZ3JhZGVEQiwgJ19kYicsIElEQkRhdGFiYXNlLCBbXG4gICAgJ2RlbGV0ZU9iamVjdFN0b3JlJyxcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIERCKGRiKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgfVxuXG4gIERCLnByb3RvdHlwZS50cmFuc2FjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24odGhpcy5fZGIudHJhbnNhY3Rpb24uYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhEQiwgJ19kYicsIFtcbiAgICAnbmFtZScsXG4gICAgJ3ZlcnNpb24nLFxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdjbG9zZSdcbiAgXSk7XG5cbiAgLy8gQWRkIGN1cnNvciBpdGVyYXRvcnNcbiAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgb25jZSBicm93c2VycyBkbyB0aGUgcmlnaHQgdGhpbmcgd2l0aCBwcm9taXNlc1xuICBbJ29wZW5DdXJzb3InLCAnb3BlbktleUN1cnNvciddLmZvckVhY2goZnVuY3Rpb24oZnVuY05hbWUpIHtcbiAgICBbT2JqZWN0U3RvcmUsIEluZGV4XS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGVbZnVuY05hbWUucmVwbGFjZSgnb3BlbicsICdpdGVyYXRlJyldID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciByZXF1ZXN0ID0gKHRoaXMuX3N0b3JlIHx8IHRoaXMuX2luZGV4KVtmdW5jTmFtZV0uYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3Muc2xpY2UoMCwgLTEpKTtcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBwb2x5ZmlsbCBnZXRBbGxcbiAgW0luZGV4LCBPYmplY3RTdG9yZV0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgIGlmIChDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsKSByZXR1cm47XG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb3VudCkge1xuICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgIHZhciBpdGVtcyA9IFtdO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICBpbnN0YW5jZS5pdGVyYXRlQ3Vyc29yKHF1ZXJ5LCBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0ZW1zLnB1c2goY3Vyc29yLnZhbHVlKTtcblxuICAgICAgICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zLmxlbmd0aCA9PSBjb3VudCkge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIHZhciBleHAgPSB7XG4gICAgb3BlbjogZnVuY3Rpb24obmFtZSwgdmVyc2lvbiwgdXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ29wZW4nLCBbbmFtZSwgdmVyc2lvbl0pO1xuICAgICAgdmFyIHJlcXVlc3QgPSBwLnJlcXVlc3Q7XG5cbiAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgICAgIHVwZ3JhZGVDYWxsYmFjayhuZXcgVXBncmFkZURCKHJlcXVlc3QucmVzdWx0LCBldmVudC5vbGRWZXJzaW9uLCByZXF1ZXN0LnRyYW5zYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEQihkYik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ2RlbGV0ZURhdGFiYXNlJywgW25hbWVdKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBleHA7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2VsZi5pZGIgPSBleHA7XG4gIH1cbn0oKSk7Il19
