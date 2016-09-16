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

    var routeTrips = stop_times.filter(function (stop) {
      return stop.trip.service_id == route.service_id;
    });

    routeTrips.forEach(function (trip) {

      var departurePromise = Trips.getStopInTripTime(departure_id, trip.trip_id);
      var arrivalPromise = Trips.getStopInTripTime(arrival_id, trip.trip_id);

      tripsPromises.push(Promise.all([departurePromise, arrivalPromise]).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var departureTime = _ref2[0];
        var arrivalTime = _ref2[1];


        var durationInSeconds = timeToSeconds(arrivalTime[0].arrival_time) - timeToSeconds(departureTime[0].arrival_time);
        var duration = secondsToTime(durationInSeconds);

        options[route.service_id] += '<div class="row">\n                                      <div class="col-33 cell">\n                                        ' + departureTime[0].stop_id + ' - ' + departureTime[0].arrival_time + '\n                                      </div>\n                                      <div class="col-33 cell">\n                                        ' + arrivalTime[0].stop_id + ' - ' + arrivalTime[0].arrival_time + '\n                                      </div>\n                                      <div class="col-33 cell">\n                                        ' + duration + '\n                                      </div>\n                                    </div>';
      }));
    });
  });

  // create html for each route, adding the times calculated for each trip
  Promise.all(tripsPromises).then(function () {

    routes.forEach(function (route, index) {

      if (uniqueRoutes.indexOf(route.service_id) == -1) {
        // new route!!
        uniqueRoutes.push(route.service_id);
        var row = '<div class="">\n                    Route: ' + route.route_id + '\n                  </div>\n                  <div class="">\n                    Service: ' + route.service_id + '\n                  </div>\n                  <div class="table"> \n                      <div class="row"> \n                        <div class="col-33 cell">Depart. - Time</div>\n                        <div class="col-33 cell">Arriv. - Time</div>\n                        <div class="col-33 cell">Duration</div>\n                      </div>\n                      ' + options[route.service_id] + '\n                      <hr>\n                  </div>';

        results.innerHTML += row;
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
var baseUrl = '/dist/data/';
var routesFile = 'routes.txt';
var tripsFile = 'trips.txt';
var stopsFile = 'stops.txt';
var stopTimesFile = 'stop_times.txt';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiLCJhcHAvb3JtL1RyaXBzLmpzIiwiYXBwL29ybS9kYi5qcyIsIm5vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O1FDd1NnQixJLEdBQUEsSTs7QUF4U2hCOztJQUFZLEs7O0FBQ1o7O0lBQVksSzs7QUFDWjs7SUFBWSxJOzs7O0FBRVo7QUFDQSxJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsWUFBdkIsRUFBcUMsVUFBckMsRUFBaUQsVUFBakQsRUFBNkQsTUFBN0QsRUFBcUU7O0FBRW5FLE1BQUksWUFBWSxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBaEI7QUFDQSxNQUFJLFVBQVUsU0FBUyxjQUFULENBQXdCLFdBQXhCLENBQWQ7QUFDQSxVQUFRLFNBQVIsR0FBb0IsRUFBcEI7QUFDQSxZQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsQ0FBMUI7O0FBRUEsTUFBSSxlQUFlLEVBQW5CO0FBQ0EsTUFBSSxVQUFVLEVBQWQ7QUFDQSxNQUFJLGdCQUFnQixFQUFwQjs7QUFHQTtBQUNBLFNBQU8sT0FBUCxDQUFnQixVQUFDLEtBQUQsRUFBVzs7QUFFekIsWUFBUSxN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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgKiBhcyBTdG9wcyBmcm9tICcuL29ybS9TdG9wcy5qcyc7XG5pbXBvcnQgKiBhcyBUcmlwcyBmcm9tICcuL29ybS9Ucmlwcy5qcyc7XG5pbXBvcnQgKiBhcyBIdHRwIGZyb20gJy4vaHR0cC5qcyc7XG5cbi8vIEludGVyYWN0aXZlIGVsZW1lbnRzIGluIHRoZSBwYWdlXG52YXIgZGVwYXJ0dXJlcywgYXJyaXZhbHMsIHN1Ym1pdEJ1dHRvbjtcblxuLyogXG4gIEFkZCB0aGUgb3B0aW9ucyB0byB0aGUgZGF0YWxpc3QgZWxlbWVudHMgaW4gdGhlIGZvcm0uXG4qL1xuZnVuY3Rpb24gYWRkU3RvcHMoc3RvcHMpIHtcblxuICBzdG9wcy5mb3JFYWNoKCAoc3RvcCkgPT4ge1xuICAgIFxuICAgIHZhciBvcHRpb24gPSBgPG9wdGlvbiB2YWx1ZT1cIiR7c3RvcC5zdG9wX25hbWV9IC0gJHtzdG9wLnN0b3BfaWR9XCI+PC9vcHRpb24+YDtcbiAgICBkZXBhcnR1cmVzLmlubmVySFRNTCArPSBvcHRpb247XG4gICAgYXJyaXZhbHMuaW5uZXJIVE1MICs9IG9wdGlvbjtcblxuICB9KTtcblxufVxuXG5mdW5jdGlvbiBzaG93VHJpcFRpbWVzKGRlcGFydHVyZV9pZCwgYXJyaXZhbF9pZCwgc3RvcF90aW1lcywgcm91dGVzKSB7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb3V0ZS1yZXN1bHQnKTtcbiAgdmFyIHJlc3VsdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGltZXRhYmxlJyk7XG4gIHJlc3VsdHMuaW5uZXJIVE1MID0gJyc7XG4gIGNvbnRhaW5lci5zdHlsZS5vcGFjaXR5ID0gMTtcblxuICB2YXIgdW5pcXVlUm91dGVzID0gW107XG4gIHZhciBvcHRpb25zID0gW107XG4gIHZhciB0cmlwc1Byb21pc2VzID0gW107XG5cblxuICAvLyBHZXQgdGhlIHRpbWVzIGZvciBlYWNoIHRyaXBcbiAgcm91dGVzLmZvckVhY2goIChyb3V0ZSkgPT4ge1xuXG4gICAgb3B0aW9uc1tyb3V0ZS5zZXJ2aWNlX2lkXSA9ICcnO1xuICAgIFxuICAgIHZhciByb3V0ZVRyaXBzID0gc3RvcF90aW1lc1xuICAgICAgLmZpbHRlcigoc3RvcCkgPT4gc3RvcC50cmlwLnNlcnZpY2VfaWQgPT0gcm91dGUuc2VydmljZV9pZCApO1xuXG4gICAgcm91dGVUcmlwcy5mb3JFYWNoKGZ1bmN0aW9uICh0cmlwKSB7XG5cbiAgICAgIHZhciBkZXBhcnR1cmVQcm9taXNlID0gVHJpcHMuZ2V0U3RvcEluVHJpcFRpbWUoZGVwYXJ0dXJlX2lkLCB0cmlwLnRyaXBfaWQpO1xuICAgICAgdmFyIGFycml2YWxQcm9taXNlID0gVHJpcHMuZ2V0U3RvcEluVHJpcFRpbWUoYXJyaXZhbF9pZCwgdHJpcC50cmlwX2lkKTtcbiAgICAgIFxuICAgICAgdHJpcHNQcm9taXNlcy5wdXNoKFByb21pc2UuYWxsKFtkZXBhcnR1cmVQcm9taXNlLCBhcnJpdmFsUHJvbWlzZV0pLnRoZW4oZnVuY3Rpb24oW2RlcGFydHVyZVRpbWUsIGFycml2YWxUaW1lXSkge1xuICAgICAgICBcbiAgICAgICAgdmFyIGR1cmF0aW9uSW5TZWNvbmRzID0gdGltZVRvU2Vjb25kcyhhcnJpdmFsVGltZVswXS5hcnJpdmFsX3RpbWUpIC0gdGltZVRvU2Vjb25kcyhkZXBhcnR1cmVUaW1lWzBdLmFycml2YWxfdGltZSk7XG4gICAgICAgIHZhciBkdXJhdGlvbiA9IHNlY29uZHNUb1RpbWUoZHVyYXRpb25JblNlY29uZHMpO1xuXG4gICAgICAgIG9wdGlvbnNbcm91dGUuc2VydmljZV9pZF0gKz0gYDxkaXYgY2xhc3M9XCJyb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtkZXBhcnR1cmVUaW1lWzBdLnN0b3BfaWR9IC0gJHtkZXBhcnR1cmVUaW1lWzBdLmFycml2YWxfdGltZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7YXJyaXZhbFRpbWVbMF0uc3RvcF9pZH0gLSAke2Fycml2YWxUaW1lWzBdLmFycml2YWxfdGltZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7ZHVyYXRpb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+YDtcbiAgICAgICAgXG4gICAgICB9KSk7XG5cbiAgICB9KTtcblxuICB9KTtcblxuICAvLyBjcmVhdGUgaHRtbCBmb3IgZWFjaCByb3V0ZSwgYWRkaW5nIHRoZSB0aW1lcyBjYWxjdWxhdGVkIGZvciBlYWNoIHRyaXBcbiAgUHJvbWlzZS5hbGwodHJpcHNQcm9taXNlcykudGhlbihmdW5jdGlvbigpIHtcblxuICAgIHJvdXRlcy5mb3JFYWNoKCAocm91dGUsIGluZGV4KSA9PiB7XG4gICAgXG4gICAgICBpZih1bmlxdWVSb3V0ZXMuaW5kZXhPZihyb3V0ZS5zZXJ2aWNlX2lkKSA9PSAtMSkge1xuICAgICAgICAvLyBuZXcgcm91dGUhIVxuICAgICAgICB1bmlxdWVSb3V0ZXMucHVzaChyb3V0ZS5zZXJ2aWNlX2lkKTtcbiAgICAgICAgdmFyIHJvdyA9YDxkaXYgY2xhc3M9XCJcIj5cbiAgICAgICAgICAgICAgICAgICAgUm91dGU6ICR7cm91dGUucm91dGVfaWR9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJcIj5cbiAgICAgICAgICAgICAgICAgICAgU2VydmljZTogJHtyb3V0ZS5zZXJ2aWNlX2lkfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFibGVcIj4gXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJvd1wiPiBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPkRlcGFydC4gLSBUaW1lPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTMzIGNlbGxcIj5BcnJpdi4gLSBUaW1lPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTMzIGNlbGxcIj5EdXJhdGlvbjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICR7b3B0aW9uc1tyb3V0ZS5zZXJ2aWNlX2lkXX1cbiAgICAgICAgICAgICAgICAgICAgICA8aHI+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5gO1xuICAgIFxuICAgICAgICByZXN1bHRzLmlubmVySFRNTCArPSByb3c7XG4gICAgICB9XG5cbiAgICB9KTtcblxuICB9KTtcbiAgXG5cbn1cblxuLypcbiAgU2hvd3MgYSBtZXNzYWdlIGluIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50LlxuKi9cbmZ1bmN0aW9uIHNob3dJbmZvTWVzc2FnZShtZXNzYWdlLCB0eXBlKSB7XG5cbiAgdmFyIG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZS1ib3gnKTtcbiAgbWVzc2FnZUJveC5pbm5lckhUTUwgPSBtZXNzYWdlO1xuXG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0JztcbiAgXG4gIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAnZXJyb3InOlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBlcnJvcic7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBpbmZvJztcbiAgICAgIGJyZWFrOyAgICBcbiAgfVxuXG59XG5cbi8qXG4gIE1ha2VzIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50IGRpc2FwcGVhciB0aHJvdWdoIGNzcyBjbGFzc1xuKi9cbmZ1bmN0aW9uIGNsZWFySW5mb01lc3NhZ2UoKSB7XG4gIHZhciBtZXNzYWdlQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lc3NhZ2UtYm94Jyk7XG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0Jztcbn1cblxuZnVuY3Rpb24gY2xlYXJSZXN1bHRzKCkge1xuXG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm91dGUtcmVzdWx0Jyk7XG4gIHZhciByZXN1bHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWV0YWJsZScpO1xuICByZXN1bHRzLmlubmVySFRNTCA9ICcnO1xuICBjb250YWluZXIuc3R5bGUub3BhY2l0eSA9IDA7XG5cbn1cblxuXG4vKlxuICBSZXF1ZXN0IHRoZSBzdG9wcyBmcm9tIHNlcnZlciBhbmQgYWRkIHRoZW0gdG8gYW4gYXJyYXlcbiAgdG8gYmUgYWJsZSB0byBjaGVjayB0aGF0IHRoZSB1c2VyIGlucHV0IGlzIHZhbGlkLlxuKi9cbmZ1bmN0aW9uIGxvYWRTdG9wcygpIHtcblxuICBTdG9wcy5nZXRBbGwoKS50aGVuKGFkZFN0b3BzKTtcblxufTtcblxuLypcbiAgR2V0IHRoZSBzdGF0aW9uIGNvZGUgZnJvbSBhIHN0cmluZ1xuKi9cbmZ1bmN0aW9uIGdldFN0YXRpb25Db2RlKHN0YXRpb24pIHtcblxuICB2YXIgcGFydHMgPSBzdGF0aW9uLnNwbGl0KCctJyk7XG4gIFxuICBpZihwYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgLy8gVGhpcyBjb3VsZCBiZSBhIHN0cmluZyBmcm9tIHRoZSBkYXRhbGlzdCwgZXh0cmFjdCB0aGUgY29kZVxuICAgIHJldHVybiBwYXJ0c1sxXS50cmltKCk7XG4gIH0gXG5cbiAgLy8gVGhpcyBjb3VsZCBiZSBhIGNvZGUgd3JpdHRlbiBieSB0aGUgdXNlclxuICByZXR1cm4gc3RhdGlvbjtcbiAgXG59XG5cbi8qXG4gIENoZWNrIHRoYXQgYSBjb2RlIGlzIGVpdGhlciBhIHBhaXIgc3RhdGlvbiBuYW1lIC0gc3RhdGlvbiBjb2RlIFxuICBmcm9tIHRoZSBmb3JtIGRhdGFsaXN0IG9yIGEgY29kZSBvZiBhIHN0b3Agd3JpdHRlbiBieSB0aGUgdXNlci5cbiovXG5mdW5jdGlvbiBjaGVja1N0YXRpb24oc3RhdGlvbikge1xuXG4gIHZhciBjb2RlID0gZ2V0U3RhdGlvbkNvZGUoc3RhdGlvbik7XG5cbiAgLy8gQ2hlY2sgdGhhdCB0aGUgY29kZSBpcyBpbiB0aGUgbGlzdCBvZiBzdG9wc1xuICByZXR1cm4gU3RvcHMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihzdG9wcyl7XG4gICAgcmV0dXJuIHN0b3BzLnNvbWUoZnVuY3Rpb24gY2hlY2soc3RvcCkge1xuICAgICAgcmV0dXJuIHN0b3Auc3RvcF9pZCA9PSBjb2RlO1xuICAgIH0pO1xuICB9KTtcblxufVxuXG4vKlxuICBUYWtlcyBhIHRpbWUgaW4gMDA6MDA6MDAgZm9ybWF0IGFuZCByZXR1cm5zIHRoZSBudW1iZXIgb2Ygc2Vjb25kc1xuICBmcm9tIDAwOjAwOjAwIHRvIHRoZSBwcm92aWRlZCB0aW1lLlxuKi9cbmZ1bmN0aW9uIHRpbWVUb1NlY29uZHModGltZSkge1xuXG4gIHZhciB0aW1lUGFydHMgPSB0aW1lLnNwbGl0KCc6JykubWFwKG51bSA9PiBwYXJzZUludChudW0pKTtcbiAgcmV0dXJuIHRpbWVQYXJ0c1swXSozNjAwICsgdGltZVBhcnRzWzFdKjYwICsgdGltZVBhcnRzWzJdO1xuXG59XG5cbmZ1bmN0aW9uIHNlY29uZHNUb1RpbWUoc2Vjb25kcykge1xuXG4gIHZhciBob3VycyA9IE1hdGguZmxvb3Ioc2Vjb25kcy8zNjAwKTtcbiAgdmFyIG1pbnV0ZXMgPSBNYXRoLmZsb29yKChzZWNvbmRzIC0gaG91cnMqMzYwMCkvNjApO1xuICByZXR1cm4gYCR7dHdvRGlnaXRzKGhvdXJzKX06JHt0d29EaWdpdHMobWludXRlcyl9OiR7dHdvRGlnaXRzKHNlY29uZHMlNjApfWA7XG5cbn1cblxuZnVuY3Rpb24gdHdvRGlnaXRzKG51bWJlcikge1xuICBcbiAgcmV0dXJuIG51bWJlciA+IDkgPyBgJHtudW1iZXJ9YCA6IGAwJHtudW1iZXJ9YDsgXG5cbn1cblxuLypcbiAgQXV4aWxpYXJ5IGZ1bmN0aW9uIHRvIGZpbmQgdHJpcHMgdGhhdCBtZWV0IHRoZSByZXF1aXJlbWVudHMgXG4gICAtIEEgdmFsaWQgdHJpcCBtdXN0IGdvIHRvIGJvdGggdGhlIGRlcGFydHVyZSBzdG9wIGFuZCB0aGUgYXJyaXZhbCBzdG9wXG4gICAtIEEgdmFsaWQgdHJpcCBtdXN0IGdvIGZpcnN0IHRvIHRoZSBkZXBhcnR1cmUgc3RvcCwgaWUgdGhlIGRlcGFydHVyZSBzdG9wIHRpbWUgbXVzdCBcbiAgIGJlIGJlZm9yZSB0aGUgYXJyaXZhbCBzdG9wIHRpbWUuXG4qL1xuZnVuY3Rpb24gZmluZE1hdGNoaW5nVHJpcHMoZGVwYXJ0dXJlVGltZXMsIGFycml2YWxUaW1lcykge1xuXG4gIC8vIGdldHMgYWxsIHRyaXBzIHRoYXQgZ29lcyB0byB0aGUgZGVwYXJ0dXJlIHN0b3AgYW5kIHRoZSBhcnJpdmFsIHN0b3BcbiAgdmFyIHZhbGlkVHJpcHMgPSBkZXBhcnR1cmVUaW1lcy5maWx0ZXIoZnVuY3Rpb24oZGVwYXJ0dXJlVHJpcCl7XG4gICAgcmV0dXJuIGFycml2YWxUaW1lcy5zb21lKGZ1bmN0aW9uKGFycml2YWxUcmlwKXtcbiAgICAgIHJldHVybiBhcnJpdmFsVHJpcC50cmlwX2lkID09IGRlcGFydHVyZVRyaXAudHJpcF9pZCAmJiBcbiAgICAgICAgdGltZVRvU2Vjb25kcyhkZXBhcnR1cmVUcmlwLmFycml2YWxfdGltZSkgPCB0aW1lVG9TZWNvbmRzKGFycml2YWxUcmlwLmFycml2YWxfdGltZSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiB2YWxpZFRyaXBzO1xufVxuXG4vKlxuICBGaW5kcyB0cmlwcyBiZXR3ZWVuIHR3byBzdGF0aW9ucywgcmV0dXJucyB0aGUgdHJpcHMgaWRzXG4qL1xuZnVuY3Rpb24gZmluZFRyaXBzKGRlcGFydHVyZUlkLCBhcnJpdmFsSWQpIHtcblxuICByZXR1cm4gUHJvbWlzZS5hbGwoW1RyaXBzLmdldFRyaXBTdG9wVGltZXMoZGVwYXJ0dXJlSWQpLCBUcmlwcy5nZXRUcmlwU3RvcFRpbWVzKGFycml2YWxJZCldKS50aGVuKFxuICAgICAgZnVuY3Rpb24oW2RlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXNdKSB7XG4gICAgICBcbiAgICAgICAgdmFyIHN0b3BfdGltZXMgPSBmaW5kTWF0Y2hpbmdUcmlwcyhkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzKTtcbiAgICAgICAgcmV0dXJuIHt0cmlwczogVHJpcHMuYXBwZW5kVHJpcEluZm8oc3RvcF90aW1lcyksIHJvdXRlczogVHJpcHMuZ2V0Um91dGVzRm9yVHJpcHMoc3RvcF90aW1lcyl9O1xuXG4gICAgICB9KTtcblxufVxuXG4vKlxuICBTdWJtaXQgdGhlIHVzZXIgc2VsZWN0aW9uIGFuZCBzaG93IHRoZSByb3V0ZSBpZiBhdmFpbGFibGUgb3IgYW5cbiAgZXJyb3IgbWVzc2FnZSBpZiBubyByb3V0ZSBpcyBhdmFpbGFibGUuXG4qL1xuZnVuY3Rpb24gc3VibWl0U3RhdGlvbnMoZXZ0KSB7XG5cbiAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gIGNsZWFySW5mb01lc3NhZ2UoKTtcbiAgY2xlYXJSZXN1bHRzKCk7XG4gIFxuICAvLyBnZXQgdGhlIGlucHV0cyB2YWx1ZXNcbiAgdmFyIGRlcGFydHVyZV9pZCA9IGdldFN0YXRpb25Db2RlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBhcnR1cmUnKS52YWx1ZSk7XG4gIHZhciBhcnJpdmFsX2lkID0gZ2V0U3RhdGlvbkNvZGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fycml2YWwnKS52YWx1ZSk7XG5cbiAgUHJvbWlzZS5hbGwoW2NoZWNrU3RhdGlvbihkZXBhcnR1cmVfaWQpLCBjaGVja1N0YXRpb24oYXJyaXZhbF9pZCldKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgXG4gICAgaWYoIXJlc3VsdFswXSB8fCAhcmVzdWx0WzFdKSB7XG4gICAgICBzaG93SW5mb01lc3NhZ2UoXG4gICAgICAgICdZb3UgaGF2ZSB0byBzZWxlY3QgYSB2YWxpZCBkZXBhcnR1cmUgYW5kIGFycml2YWwgc3RhdGlvbnMgZnJvbSB0aGUgbGlzdHMgb3Igd3JpdGUgYSB2YWxpZCBzdG9wIGNvZGUuJyxcbiAgICAgICAgJ2Vycm9yJ1xuICAgICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvLyBJZiB0aGUgZGVwYXJ0dXJlIGFuZCBhcnJpdmFsIHN0YXRpb25zIGFyZSBjb3JyZWN0XG4gICAgLy8gc2VhcmNoIGZvciBhIHRyaXAgYmV0d2VlbiB0aGVtIGFuZCBzaG93IHRoZSB0aW1lcyBhbmQgcm91dGVcbiAgICBmaW5kVHJpcHMoZGVwYXJ0dXJlX2lkLCBhcnJpdmFsX2lkKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgICAgUHJvbWlzZS5hbGwoW2RhdGEudHJpcHMsIGRhdGEucm91dGVzXSkudGhlbihmdW5jdGlvbihbdHJpcHMsIHJvdXRlc10pe1xuICAgICAgICBcbiAgICAgICAgaWYocm91dGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzaG93VHJpcFRpbWVzKGRlcGFydHVyZV9pZCwgYXJyaXZhbF9pZCwgdHJpcHMsIHJvdXRlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdXZSBjb3VsZG5cXCd0IGZpbmQgYSB0cmlwIGJldHdlZW4gdGhlc2UgdHdvIHN0YXRpb25zJywgJ2Vycm9yJyk7XG4gICAgICAgIH1cblxuICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIHJldHVybiBmYWxzZTtcblxuICB9KTtcblxuXG59XG5cbi8qXG4gIEluaXRpYWxpemUgdGhlIGFwcGxpY2F0aW9uIFxuKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xuXG4gIC8vIGdldCB0aGUgaW50ZXJhY3RpdmUgZWxlbWVudHMgb2YgdGhlIGludGVyZmFjZVxuICBkZXBhcnR1cmVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGFydHVyZS1zdG9wcycpO1xuICBhcnJpdmFscyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcnJpdmFsLXN0b3BzJyk7XG4gIHN1Ym1pdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2gnKTtcblxuICAvLyBQb3B1bGF0ZSBkYXRhbGlzdHMgYW5kIGFkZCBsaXN0ZW5lcnNcbiAgbG9hZFN0b3BzKCk7XG4gIHN1Ym1pdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHN1Ym1pdFN0YXRpb25zKTtcblxufTtcbiIsImNvbnN0IGJhc2VVcmwgICAgICAgPSAnL2Rpc3QvZGF0YS8nO1xuY29uc3Qgcm91dGVzRmlsZSAgICA9ICdyb3V0ZXMudHh0JztcbmNvbnN0IHRyaXBzRmlsZSAgICAgPSAndHJpcHMudHh0JztcbmNvbnN0IHN0b3BzRmlsZSAgICAgPSAnc3RvcHMudHh0JztcbmNvbnN0IHN0b3BUaW1lc0ZpbGUgPSAnc3RvcF90aW1lcy50eHQnO1xuXG5jb25zdCBjc3ZUb0FycmF5ID0gZnVuY3Rpb24odGV4dCkge1xuICBcbiAgdmFyIHJvd3MgPSB0ZXh0LnRyaW0oKS5zcGxpdCgnXFxuJyk7XG4gIHJldHVybiByb3dzLm1hcCgocm93KSA9PiByb3cuc3BsaXQoJywnKSk7XG5cbn07XG5cbmNvbnN0IGNzdlRvT2JqZWN0cyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICB2YXIgdGFibGUgPSBjc3ZUb0FycmF5KHRleHQpO1xuICB2YXIga2V5cyA9IHRhYmxlWzBdO1xuICB0YWJsZSA9IHRhYmxlLnNsaWNlKDEpO1xuXG4gIHJldHVybiB0YWJsZS5tYXAoZnVuY3Rpb24ocm93KSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXksIGluZGV4KSB7XG4gICAgICBvYmpba2V5XSA9IHJvd1tpbmRleF07XG4gICAgfSk7XG4gICAgcmV0dXJuICBvYmo7XG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGdldENzdkFzT2JqZWN0cyh1cmwpIHtcblxuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXG4gICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuXG4gICAgfSkudGhlbihmdW5jdGlvbih0ZXh0Q29udGVudCkge1xuXG4gICAgICByZXR1cm4gY3N2VG9PYmplY3RzKHRleHRDb250ZW50KTtcblxuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICB9KTtcbn1cblxuLy8gQVBJXG5cbi8qXG4gIFJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgd2l0aCB0aGUgbmFtZXMgb2YgdGhlIFxuICBhdmFpbGFibGUgbGluZXMuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIHJvdXRlcygpIHtcblxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyByb3V0ZXNGaWxlKTtcblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRyaXBzKCkge1xuICAvLyBnZXQgdGhlIHJvdXRlL2xpbmUgYW5kIHJldHVybiB0aGUgdGltZXMgZm9yIHRoaXMgbGluZVxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyB0cmlwc0ZpbGUpO1xuXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gc3RvcHMoKSB7XG4gIC8vIHJldHVybnMgdGhlIHN0b3BzIG9mIHRoaXMgbGluZVxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyBzdG9wc0ZpbGUpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BUaW1lcygpIHtcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc3RvcFRpbWVzRmlsZSk7IFxufTtcbiIsImltcG9ydCAqIGFzIEFwcCBmcm9tICcuL2FwcC5qcyc7XG5cbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0JztcblxuICBmdW5jdGlvbiByZWdpc3RlclNlcnZpY2VXb3JrZXIoKSB7XG5cbiAgICBpZiAoIW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyKSByZXR1cm47XG5cbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignLi9zZXJ2aWNlX3dvcmtlci5qcycsIHtzY29wZTogJy8nfSkudGhlbihmdW5jdGlvbihyZWcpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ1JlZ2lzdHJhdGlvbiB3b3JrZWQhJywgcmVnKTtcblxuICAgICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5jb250cm9sbGVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1JlZ2lzdHJhdGlvbiBmYWlsZWQhJywgZXJyb3IpO1xuICAgIFxuICAgIH0pO1xuXG4gIH1cblxuICBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgLy8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB3aGVuIHRoZSBkb2N1bWVudCBpcyByZWFkeVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZihkb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnbG9hZGluZycpIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgfTtcblxuICByZWFkeSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgQXBwLmluaXQoKTtcbiAgICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTtcbiAgfSk7XG5cbn0pKCk7IiwiaW1wb3J0ICogYXMgSHR0cCBmcm9tICcuLi9odHRwLmpzJztcbmltcG9ydCBpZGIgZnJvbSAnLi9kYi5qcyc7XG5cbnZhciB3YWl0aW5nRm9yTmV0d29yayA9IGZhbHNlO1xuLy8gSWYgaW5kZXhlZERCIGlzIHBvcHVsYXRlZCwgZ2V0IHRoZSBkYXRhIGFuZCB0cnkgdG8gdXBkYXRlIGZyb20gbmV0d29ya1xuLy8gZWxzZSB0cnkgdG8gZ2V0IHRoZSBkYXRhIGZyb20gbmV0d29yayBhbmQgc2F2ZSBpdFxuLy8gZWxzZSB3ZSBzaG91bGQgc2hvdyBhIGN1c3RvbSBlcnJvciBtZXNzYWdlIHRvIHRoZSB1c2VyLCB0aGUgYXBwIGlzIG5vdGEgYXZhaWxhYmxlLlxuZXhwb3J0IGZ1bmN0aW9uIHNldFN0b3BzKCkge1xuXG4gIHJldHVybiBpZGIoKS50aGVuKGRiID0+IHtcblxuICAgICAgaWYoIWRiKSB0aHJvdyAnV2UgY291bGRuXFwndCBhY2Nlc3MgSW5kZXhlZERCJztcblxuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJyk7XG4gICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICByZXR1cm4gdHJpcHNTdG9yZS5jb3VudCgpO1xuXG4gICAgfSkudGhlbihyZXN1bHQgPT4ge1xuXG4gICAgICAvLyBpZiB0aGVyZSBpcyBzb21ldGhpbmcgaW4gdGhlIGRiLCBkb24ndCBib3RoZXIgaW4gZ2V0dGluZyB0aGUgZGF0YSBhZ2FpbiBmcm9tIG5ldHdvcmtcbiAgICAgIGlmKHJlc3VsdCA+IDAgfHwgd2FpdGluZ0Zvck5ldHdvcmspIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICB3YWl0aW5nRm9yTmV0d29yayA9IHRydWU7XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzIG5vdGhpbmcgaW4gdGhlIHRyaXBzIGFuZCB0aW1lcyB0YWJsZSwgZmlsbCB0aGVtIVxuICAgICAgcmV0dXJuIEh0dHAuc3RvcHMoKVxuICAgICAgICAudGhlbihzdG9yZVN0b3BzKTtcblxuICAgIH0pO1xuXG59XG5cblxuZnVuY3Rpb24gc3RvcmVTdG9wcyhyZXN1bHRzKSB7XG5cbiAgaWYocmVzdWx0cykgeyBcblxuICAgICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gc3RvcmVTdG9wc0luSURCKGRiKXtcblxuICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcHMnLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIHZhciBzdG9wc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BzJyk7XG5cbiAgICAgICAgcmVzdWx0cy5mb3JFYWNoKCBmdW5jdGlvbihzdG9wKSB7XG4gICAgICAgICAgc3RvcHNTdG9yZS5wdXQoc3RvcCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21wbGV0ZTtcblxuICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcblxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgICAgfSk7XG5cbiAgfVxuXG59XG5cbi8qXG4gIEdldCBhbGwgdGhlIHN0b3BzXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbChzdG9wX2lkKSB7XG5cbiAgcmV0dXJuIHNldFN0b3BzKClcbiAgICAudGhlbigoKSA9PiBpZGIoKSlcbiAgICAudGhlbihmdW5jdGlvbiBnZXRTdG9wcyhkYil7XG5cbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wcycpO1xuICAgICAgdmFyIHN0b3BzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcHMnKTtcblxuICAgICAgcmV0dXJuIHN0b3BzU3RvcmUuZ2V0QWxsKCk7XG4gICAgfSk7XG5cbn07XG5cbiIsImltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi4vaHR0cC5qcyc7XG5pbXBvcnQgaWRiIGZyb20gJy4vZGIuanMnO1xuXG4gIC8qXG4gICAgVGhpcyBmdW5jdGlvbiBjaGVja3MgdGhhdCB0aGUgZGF0YSBpcyBpbiBJbmRleGVkREIsIGlmIG5vdCwgaXQgZ2V0cyBpdCBmcm9tIG5ldHdvcmsvY2FjaGVcbiAgICBhbmQgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBkYXRhIGlzIHN0b3JlZCBpbiBJREIuXG4gICAgVGhpcyB3YXkgd2UgZG9uJ3QgbmVlZCBhbnkgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb24sIGp1c3QgY2FsbCB0aGlzIGZ1bmN0aW9uIGluIGVhY2ggcmV0cmlldmluZ1xuICAgIG1ldGhvZCBhbmQgaXQgd2lsbCBnZXQgc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgc2V0IHVwIGJlZm9yZSB0cnlpbmcgdG8gZ2V0IHRoZSBjb250ZW50LlxuICAqL1xuICB2YXIgd2FpdGluZ0Zvck5ldHdvcmsgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBzZXRUcmlwcygpIHtcblxuICAgIHJldHVybiBpZGIoKS50aGVuKGRiID0+IHtcblxuICAgICAgaWYoIWRiKSB0aHJvdyAnV2UgY291bGRuXFwndCBhY2Nlc3MgSW5kZXhlZERCJztcblxuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJyk7XG4gICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICByZXR1cm4gdHJpcHNTdG9yZS5jb3VudCgpO1xuXG4gICAgfSkudGhlbihyZXN1bHQgPT4ge1xuXG4gICAgICAvLyBpZiB0aGVyZSBpcyBzb21ldGhpbmcgaW4gdGhlIGRiLCBkb24ndCBib3RoZXIgaW4gZ2V0dGluZyB0aGUgZGF0YSBhZ2FpbiBmcm9tIG5ldHdvcmtcbiAgICAgIGlmKHJlc3VsdCA+IDAgfHwgd2FpdGluZ0Zvck5ldHdvcmspIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICB3YWl0aW5nRm9yTmV0d29yayA9IHRydWU7XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzIG5vdGhpbmcgaW4gdGhlIHRyaXBzIGFuZCB0aW1lcyB0YWJsZSwgZmlsbCB0aGVtIVxuICAgICAgcmV0dXJuIEh0dHAuc3RvcFRpbWVzKClcbiAgICAgICAgLnRoZW4oc3RvcmVTdG9wVGltZXMpXG4gICAgICAgIC50aGVuKEh0dHAudHJpcHMpXG4gICAgICAgIC50aGVuKHN0b3JlVHJpcHMpO1xuXG4gICAgfSk7XG5cblxuICB9XG5cblxuICBmdW5jdGlvbiBzdG9yZVN0b3BUaW1lcyhyZXN1bHRzKSB7XG5cbiAgICBpZihyZXN1bHRzKSB7IFxuXG4gICAgICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIHN0b3JlVHJpcHNJbklEQihkYil7XG5cbiAgICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcF90aW1lcycsICdyZWFkd3JpdGUnKTtcbiAgICAgICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJyk7XG5cbiAgICAgICAgICByZXN1bHRzLmZvckVhY2goIGZ1bmN0aW9uKHRyaXApIHtcbiAgICAgICAgICAgIHRyaXBzU3RvcmUucHV0KHRyaXApO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLmNvbXBsZXRlO1xuXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG5cbiAgICAgICAgICAvLyB0aGUgdHJhbnNhY3Rpb24gZGlkbid0IGNvbXBsZXRlLCBzbyB0aGUgdGFibGUgc2hvdWxkIGJlIGVtcHR5XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0b3JlVHJpcHMocmVzdWx0cykge1xuXG4gICAgaWYocmVzdWx0cykgeyBcblxuICAgICAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBzdG9yZVRyaXBzSW5JREIoZGIpe1xuXG4gICAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJywgJ3JlYWR3cml0ZScpO1xuICAgICAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgICAgICByZXN1bHRzLmZvckVhY2goIGZ1bmN0aW9uKHRyaXApIHtcbiAgICAgICAgICAgIHRyaXBzU3RvcmUucHV0KHRyaXApO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLmNvbXBsZXRlO1xuXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG5cbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICB9XG5cbiAgLy8gSWYgaW5kZXhlZERCIGlzIHBvcHVsYXRlZCwgZ2V0IHRoZSBkYXRhIGFuZCB0cnkgdG8gdXBkYXRlIGZyb20gbmV0d29ya1xuICAvLyBlbHNlIHRyeSB0byBnZXQgdGhlIGRhdGEgZnJvbSBuZXR3b3JrIGFuZCBzYXZlIGl0XG4gIC8vIGVsc2Ugd2Ugc2hvdWxkIHNob3cgYSBjdXN0b20gZXJyb3IgbWVzc2FnZSB0byB0aGUgdXNlciwgdGhlIGFwcCBpcyBub3RhIGF2YWlsYWJsZS5cblxuICAvKlxuICAgIEdldCB0aGUgdHJpcHMgdGhhdCBzdG9wIGF0IHN0b3BfaWQsIG9uZSBwZXIgcm91dGUsIGluZGVwZW5kZW50bHkgb2Ygc3RvcCB0aW1lc1xuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0Um91dGVzRm9yU3RvcChzdG9wX2lkKSB7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRUcmlwc1N0b3BUaW1lcyhzdG9wX2lkKVxuICAgICAgLnRoZW4oKTtcblxuICB9O1xuXG4gIGV4cG9ydCBmdW5jdGlvbiBhcHBlbmRUcmlwSW5mbyhzdG9wX3RpbWVzKSB7XG5cbiAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBnZXRBbGxSb3V0ZXMoZGIpIHtcbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCd0cmlwcycpO1xuICAgICAgdmFyIHRyaXBTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICB2YXIgdHJpcHMgPSBbXTtcbiAgICAgIHN0b3BfdGltZXMuZm9yRWFjaChmdW5jdGlvbiBhcHBlbmRUcmlwUHJvbWlzZSh0cmlwKSB7XG5cbiAgICAgICAgdHJpcHMucHVzaCh0cmlwU3RvcmUuZ2V0KHRyaXAudHJpcF9pZCkpO1xuXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRyaXBzKTtcbiAgICAgIFxuICAgIH0pLnRoZW4oZnVuY3Rpb24odHJpcHMpIHsgXG5cbiAgICAgIHJldHVybiBzdG9wX3RpbWVzLm1hcChmdW5jdGlvbihzdG9wLCBpbmRleCkge1xuICAgICAgICBzdG9wLnRyaXAgPSB0cmlwc1tpbmRleF07XG4gICAgICAgIHJldHVybiBzdG9wO1xuICAgICAgfSk7XG5cbiAgICB9KTtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXRSb3V0ZXNGb3JUcmlwcyh0cmlwcykge1xuXG4gICAgLy8gZ2V0IHRoZSByb3V0ZXMgZm9yIHRoaXMgdHJpcHNcbiAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBnZXRBbGxSb3V0ZXMoZGIpIHtcbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCd0cmlwcycpO1xuICAgICAgdmFyIHRyaXBTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICB2YXIgcm91dGVzID0gW107XG4gICAgICB0cmlwcy5mb3JFYWNoKGZ1bmN0aW9uIGFwcGVuZFRyaXBQcm9taXNlKHRyaXApIHtcblxuICAgICAgICByb3V0ZXMucHVzaCh0cmlwU3RvcmUuZ2V0KHRyaXAudHJpcF9pZCkpO1xuXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJvdXRlcyk7XG4gICAgICBcbiAgICB9KS50aGVuKGZ1bmN0aW9uKHJvdXRlcykge1xuXG4gICAgICB2YXIgc2VydmljZV9pZHMgPSBbXTtcbiAgICAgIHZhciB1bmlxdWVSb3V0ZXMgPSBbXTtcbiAgICAgIHJvdXRlcy5mb3JFYWNoKGZ1bmN0aW9uIGdldFVuaXF1ZVNlcnZpY2VJZHModHJpcCkge1xuICAgICAgICBpZihzZXJ2aWNlX2lkcy5pbmRleE9mKHRyaXAuc2VydmljZV9pZCkgPT0gLTEpIHtcbiAgICAgICAgICBzZXJ2aWNlX2lkcy5wdXNoKHRyaXAuc2VydmljZV9pZCk7XG4gICAgICAgICAgdW5pcXVlUm91dGVzLnB1c2godHJpcCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdW5pcXVlUm91dGVzO1xuXG4gICAgfSk7XG5cbiAgfTtcblxuICAvKlxuICAgIEdldCBhbGwgdGhlIHRpbWVzIGZvciBhIHN0b3BcbiAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldFRyaXBTdG9wVGltZXMoc3RvcF9pZCkge1xuXG4gICAgcmV0dXJuIHNldFRyaXBzKClcbiAgICAgIC50aGVuKCgpID0+IGlkYigpKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gZ2V0VHJpcHNGb3JTdG9wKGRiKXtcblxuICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcF90aW1lcycpO1xuICAgICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJyk7XG4gICAgICAgIHZhciBzdG9wSW5kZXggPSB0cmlwc1N0b3JlLmluZGV4KCdzdG9wJyk7XG5cbiAgICAgICAgcmV0dXJuIHN0b3BJbmRleC5nZXRBbGwoc3RvcF9pZCk7XG4gICAgICB9KTtcblxuICB9O1xuXG4gIC8qXG4gICAgR2V0IHRoZSB0aW1lIGZvciBhIHN0b3AgYW5kIGEgdHJpcFxuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0U3RvcEluVHJpcFRpbWUoc3RvcF9pZCwgdHJpcF9pZCkge1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJpcFN0b3BUaW1lcyhzdG9wX2lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gZ2V0VGltZUZvckFUcmlwKHRyaXBzKXtcbiAgICAgICAgcmV0dXJuIHRyaXBzLmZpbHRlcigodHJpcCkgPT4gdHJpcC50cmlwX2lkID09IHRyaXBfaWQpO1xuICAgICAgfSk7XG5cbiAgfSIsImltcG9ydCBpZGIgZnJvbSAnLi4vLi4vbm9kZV9tb2R1bGVzL2lkYi9saWIvaWRiLmpzJztcblxudmFyIF9kYjtcblxuLy8gVGhpcyBjbGFzcyB3b3JrcyBhcyBhIE9STSB0aGF0IGdldHMgdGhlIGRhdGEgZnJvbSBpbmRleGVkREJcbmZ1bmN0aW9uIG9wZW5EYXRhYmFzZSgpIHtcbiAgXG4gIHJldHVybiBpZGIub3BlbigndHJhaW5zJywgMSwgZnVuY3Rpb24odXBncmFkZURiKSB7XG4gICAgXG4gICAgc3dpdGNoKHVwZ3JhZGVEYi5vbGRWZXJzaW9uKSB7XG4gICAgXG4gICAgICBjYXNlIDA6XG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgnc3RvcHMnLCB7XG4gICAgICAgICAga2V5UGF0aDogJ3N0b3BfaWQnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgndHJpcHMnLCB7a2V5UGF0aDogJ3RyaXBfaWQnfSk7XG5cbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJywge2F1dG9JbmNyZW1lbnQ6IHRydWV9KTtcblxuICAgICAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3JvdXRlcycsIHtcbiAgICAgICAgICBrZXlQYXRoOiAncm91dGVfaWQnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciB0cmlwU3RvcmUgPSB1cGdyYWRlRGIudHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BfdGltZXMnKTtcbiAgICAgICAgdHJpcFN0b3JlLmNyZWF0ZUluZGV4KCdzdG9wJywgJ3N0b3BfaWQnKTtcbiAgICAgICAgdHJpcFN0b3JlLmNyZWF0ZUluZGV4KCd0cmlwJywgJ3RyaXBfaWQnKTtcblxuICAgIH1cbiAgfSk7XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZGIoKSB7XG4gIFxuICBpZihfZGIgPT0gbnVsbCkge1xuICAgIF9kYiA9IG9wZW5EYXRhYmFzZSgpO1xuICB9IFxuXG4gIHJldHVybiBfZGI7XG5cbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG4oZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIHRvQXJyYXkoYXJyKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFycik7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0KHJlcXVlc3QpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKHJlcXVlc3QucmVzdWx0KTtcbiAgICAgIH07XG5cbiAgICAgIHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5UmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcmVxdWVzdDtcbiAgICB2YXIgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVxdWVzdCA9IG9ialttZXRob2RdLmFwcGx5KG9iaiwgYXJncyk7XG4gICAgICBwcm9taXNpZnlSZXF1ZXN0KHJlcXVlc3QpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KTtcblxuICAgIHAucmVxdWVzdCA9IHJlcXVlc3Q7XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHAgPSBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncyk7XG4gICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgcmV0dXJuIG5ldyBDdXJzb3IodmFsdWUsIHAucmVxdWVzdCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eVByb3BlcnRpZXMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJveHlDbGFzcy5wcm90b3R5cGUsIHByb3AsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eVJlcXVlc3RNZXRob2RzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIENvbnN0cnVjdG9yLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgICAgUHJveHlDbGFzcy5wcm90b3R5cGVbcHJvcF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKHRoaXNbdGFyZ2V0UHJvcF0sIHByb3AsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlNZXRob2RzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIENvbnN0cnVjdG9yLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgICAgUHJveHlDbGFzcy5wcm90b3R5cGVbcHJvcF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbdGFyZ2V0UHJvcF1bcHJvcF0uYXBwbHkodGhpc1t0YXJnZXRQcm9wXSwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIENvbnN0cnVjdG9yLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgICAgUHJveHlDbGFzcy5wcm90b3R5cGVbcHJvcF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKHRoaXNbdGFyZ2V0UHJvcF0sIHByb3AsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gSW5kZXgoaW5kZXgpIHtcbiAgICB0aGlzLl9pbmRleCA9IGluZGV4O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEluZGV4LCAnX2luZGV4JywgW1xuICAgICduYW1lJyxcbiAgICAna2V5UGF0aCcsXG4gICAgJ211bHRpRW50cnknLFxuICAgICd1bmlxdWUnXG4gIF0pO1xuXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoSW5kZXgsICdfaW5kZXgnLCBJREJJbmRleCwgW1xuICAgICdnZXQnLFxuICAgICdnZXRLZXknLFxuICAgICdnZXRBbGwnLFxuICAgICdnZXRBbGxLZXlzJyxcbiAgICAnY291bnQnXG4gIF0pO1xuXG4gIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoSW5kZXgsICdfaW5kZXgnLCBJREJJbmRleCwgW1xuICAgICdvcGVuQ3Vyc29yJyxcbiAgICAnb3BlbktleUN1cnNvcidcbiAgXSk7XG5cbiAgZnVuY3Rpb24gQ3Vyc29yKGN1cnNvciwgcmVxdWVzdCkge1xuICAgIHRoaXMuX2N1cnNvciA9IGN1cnNvcjtcbiAgICB0aGlzLl9yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgfVxuXG4gIHByb3h5UHJvcGVydGllcyhDdXJzb3IsICdfY3Vyc29yJywgW1xuICAgICdkaXJlY3Rpb24nLFxuICAgICdrZXknLFxuICAgICdwcmltYXJ5S2V5JyxcbiAgICAndmFsdWUnXG4gIF0pO1xuXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoQ3Vyc29yLCAnX2N1cnNvcicsIElEQkN1cnNvciwgW1xuICAgICd1cGRhdGUnLFxuICAgICdkZWxldGUnXG4gIF0pO1xuXG4gIC8vIHByb3h5ICduZXh0JyBtZXRob2RzXG4gIFsnYWR2YW5jZScsICdjb250aW51ZScsICdjb250aW51ZVByaW1hcnlLZXknXS5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcbiAgICBpZiAoIShtZXRob2ROYW1lIGluIElEQkN1cnNvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgQ3Vyc29yLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGN1cnNvciA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBjdXJzb3IuX2N1cnNvclttZXRob2ROYW1lXS5hcHBseShjdXJzb3IuX2N1cnNvciwgYXJncyk7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0KGN1cnNvci5fcmVxdWVzdCkudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcbiAgICAgICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgY3Vyc29yLl9yZXF1ZXN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICBmdW5jdGlvbiBPYmplY3RTdG9yZShzdG9yZSkge1xuICAgIHRoaXMuX3N0b3JlID0gc3RvcmU7XG4gIH1cblxuICBPYmplY3RTdG9yZS5wcm90b3R5cGUuY3JlYXRlSW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZGV4KHRoaXMuX3N0b3JlLmNyZWF0ZUluZGV4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBPYmplY3RTdG9yZS5wcm90b3R5cGUuaW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZGV4KHRoaXMuX3N0b3JlLmluZGV4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnaW5kZXhOYW1lcycsXG4gICAgJ2F1dG9JbmNyZW1lbnQnXG4gIF0pO1xuXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xuICAgICdwdXQnLFxuICAgICdhZGQnLFxuICAgICdkZWxldGUnLFxuICAgICdjbGVhcicsXG4gICAgJ2dldCcsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xuICAgICdkZWxldGVJbmRleCdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gVHJhbnNhY3Rpb24oaWRiVHJhbnNhY3Rpb24pIHtcbiAgICB0aGlzLl90eCA9IGlkYlRyYW5zYWN0aW9uO1xuICAgIHRoaXMuY29tcGxldGUgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGlkYlRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcbiAgICAgIGlkYlRyYW5zYWN0aW9uLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KGlkYlRyYW5zYWN0aW9uLmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBUcmFuc2FjdGlvbi5wcm90b3R5cGUub2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX3R4Lm9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX3R4LCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVHJhbnNhY3Rpb24sICdfdHgnLCBbXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnLFxuICAgICdtb2RlJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoVHJhbnNhY3Rpb24sICdfdHgnLCBJREJUcmFuc2FjdGlvbiwgW1xuICAgICdhYm9ydCdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gVXBncmFkZURCKGRiLCBvbGRWZXJzaW9uLCB0cmFuc2FjdGlvbikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gICAgdGhpcy5vbGRWZXJzaW9uID0gb2xkVmVyc2lvbjtcbiAgICB0aGlzLnRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uKTtcbiAgfVxuXG4gIFVwZ3JhZGVEQi5wcm90b3R5cGUuY3JlYXRlT2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX2RiLmNyZWF0ZU9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVXBncmFkZURCLCAnX2RiJywgW1xuICAgICduYW1lJyxcbiAgICAndmVyc2lvbicsXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhVcGdyYWRlREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdkZWxldGVPYmplY3RTdG9yZScsXG4gICAgJ2Nsb3NlJ1xuICBdKTtcblxuICBmdW5jdGlvbiBEQihkYikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gIH1cblxuICBEQi5wcm90b3R5cGUudHJhbnNhY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKHRoaXMuX2RiLnRyYW5zYWN0aW9uLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKERCLCAnX2RiJywgSURCRGF0YWJhc2UsIFtcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIC8vIEFkZCBjdXJzb3IgaXRlcmF0b3JzXG4gIC8vIFRPRE86IHJlbW92ZSB0aGlzIG9uY2UgYnJvd3NlcnMgZG8gdGhlIHJpZ2h0IHRoaW5nIHdpdGggcHJvbWlzZXNcbiAgWydvcGVuQ3Vyc29yJywgJ29wZW5LZXlDdXJzb3InXS5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmNOYW1lKSB7XG4gICAgW09iamVjdFN0b3JlLCBJbmRleF0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgICAgQ29uc3RydWN0b3IucHJvdG90eXBlW2Z1bmNOYW1lLnJlcGxhY2UoJ29wZW4nLCAnaXRlcmF0ZScpXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IHRvQXJyYXkoYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgcmVxdWVzdCA9ICh0aGlzLl9zdG9yZSB8fCB0aGlzLl9pbmRleClbZnVuY05hbWVdLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmdzLnNsaWNlKDAsIC0xKSk7XG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY2FsbGJhY2socmVxdWVzdC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gcG9seWZpbGwgZ2V0QWxsXG4gIFtJbmRleCwgT2JqZWN0U3RvcmVdLmZvckVhY2goZnVuY3Rpb24oQ29uc3RydWN0b3IpIHtcbiAgICBpZiAoQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCkgcmV0dXJuO1xuICAgIENvbnN0cnVjdG9yLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbihxdWVyeSwgY291bnQpIHtcbiAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXM7XG4gICAgICB2YXIgaXRlbXMgPSBbXTtcblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgICAgaW5zdGFuY2UuaXRlcmF0ZUN1cnNvcihxdWVyeSwgZnVuY3Rpb24oY3Vyc29yKSB7XG4gICAgICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgICAgIHJlc29sdmUoaXRlbXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpdGVtcy5wdXNoKGN1cnNvci52YWx1ZSk7XG5cbiAgICAgICAgICBpZiAoY291bnQgIT09IHVuZGVmaW5lZCAmJiBpdGVtcy5sZW5ndGggPT0gY291bnQpIHtcbiAgICAgICAgICAgIHJlc29sdmUoaXRlbXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICB2YXIgZXhwID0ge1xuICAgIG9wZW46IGZ1bmN0aW9uKG5hbWUsIHZlcnNpb24sIHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgdmFyIHAgPSBwcm9taXNpZnlSZXF1ZXN0Q2FsbChpbmRleGVkREIsICdvcGVuJywgW25hbWUsIHZlcnNpb25dKTtcbiAgICAgIHZhciByZXF1ZXN0ID0gcC5yZXF1ZXN0O1xuXG4gICAgICByZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICh1cGdyYWRlQ2FsbGJhY2spIHtcbiAgICAgICAgICB1cGdyYWRlQ2FsbGJhY2sobmV3IFVwZ3JhZGVEQihyZXF1ZXN0LnJlc3VsdCwgZXZlbnQub2xkVmVyc2lvbiwgcmVxdWVzdC50cmFuc2FjdGlvbikpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKGRiKSB7XG4gICAgICAgIHJldHVybiBuZXcgREIoZGIpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChpbmRleGVkREIsICdkZWxldGVEYXRhYmFzZScsIFtuYW1lXSk7XG4gICAgfVxuICB9O1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZXhwO1xuICB9XG4gIGVsc2Uge1xuICAgIHNlbGYuaWRiID0gZXhwO1xuICB9XG59KCkpOyJdfQ==
