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

function showTripTimes(departure_id, arrival_id, trips, routes) {

  var container = document.getElementById('route-result');
  var results = document.getElementById('timetable');
  results.innerHTML = '';
  container.style.opacity = 1;

  var uniqueRoutes = [];
  var options = [];
  var tripsPromises = [];

  // Get the times for each trip
  routes.forEach(function (route) {
    var routeTrips = trips.filter(function (trip) {
      return trip.trip_id == route.trip_id;
    });

    var routeOptions = '';
    routeTrips.forEach(function (trip) {

      var departurePromise = Trips.getStopInTripTime(departure_id, trip.trip_id);
      var arrivalPromise = Trips.getStopInTripTime(arrival_id, trip.trip_id);

      tripsPromises.push(Promise.all([departurePromise, arrivalPromise]).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var departureTime = _ref2[0];
        var arrivalTime = _ref2[1];


        var duration = 0;

        routeOptions += '<div>\n                          <div class="col-33 cell">\n                            ' + departureTime[0].arrival_time + '\n                          </div>\n                          <div class="col-33 cell">\n                            ' + duration + '\n                          </div>\n                          <div class="col-33 cell">\n                            ' + arrivalTime[0].arrival_time + '\n                          </div>\n                        </div>';

        options[route.route_id] += routeOptions;
      }));
    });
  });

  // create html for each route, adding the times calculated for each trip
  Promise.all(tripsPromises).then(function () {

    routes.forEach(function (route, index) {

      if (uniqueRoutes.indexOf(route.route_id) == -1) {
        // new route!!
        uniqueRoutes.push(route.route_id);
        var row = '<div class="">\n                    Route: ' + route.route_id + '\n                  </div>\n                  <div class="">\n                    Service: ' + route.service_id + '\n                  </div>\n                  <div class="row table"> \n                    ' + options[route.route_id] + '\n                  </div>';

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

  var timeParts = time.split(':');
  return timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
}

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


    var trips = findMatchingTrips(departureTimes, arrivalTimes);
    return { trips: trips, routes: Trips.getRoutesForTrips(trips) };
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

      data.routes.then(function (routes) {
        if (routes.length > 0) {
          showTripTimes(departure_id, arrival_id, data.trips, routes);
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
exports.getAll = getAll;

var _http = require('../http.js');

var Http = _interopRequireWildcard(_http);

var _db = require('./db.js');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// If indexedDB is populated, get the data and try to update from network
// else try to get the data from network and save it
// else we should show a custom error message to the user, the app is nota available.
function getAll() {

  return Http.stops().then(function getStopsFromNetwork(results) {

    if (!results) {

      return (0, _db2.default)().then(function getStopsFromIDB(db) {

        if (!db) throw 'Stops data is not available.';

        var transaction = db.transaction('stops');
        return transaction.objectStore('stops').getAll();
      });
    }

    // If I get results store the result in indexedDB
    return (0, _db2.default)().then(function storeStopsInIDB(db) {

      var transaction = db.transaction('stops', 'readwrite');
      var stopsStore = transaction.objectStore('stops');

      results.forEach(function (stop) {
        stopsStore.put(stop);
      });

      return transaction.complete;
    }).then(function transactionCompleted() {

      return results;
    });
  });
}

},{"../http.js":2,"./db.js":6}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRoutesForStop = getRoutesForStop;
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
function setTrips() {

  return (0, _db2.default)().then(function (db) {

    if (!db) throw 'We couldn\'t access IndexedDB';

    var transaction = db.transaction('trips');
    var tripsStore = transaction.objectStore('trips');

    return tripsStore.count();
  }).then(function (result) {

    // if there is something in the db, don't bother in getting the data again from network
    if (result > 0) {
      return Promise.resolve();
    }

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

function getRoutesForTrips(trips) {

  var trip_ids = [];
  trips.forEach(function getUniqueTripIds(trip) {
    if (trip_ids.indexOf(trip.trip_id) == -1) {
      trip_ids.push(trip.trip_id);
    }
  });

  // get the routes for this trips
  return (0, _db2.default)().then(function getAllRoutes(db) {
    var transaction = db.transaction('trips');
    var tripStore = transaction.objectStore('trips');

    var routes = [];
    trips.forEach(function appendTripPromise(trip) {

      routes.push(tripStore.get(trip.trip_id));
    });

    return Promise.all(routes);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiLCJhcHAvb3JtL1RyaXBzLmpzIiwiYXBwL29ybS9kYi5qcyIsIm5vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O1FDMlFnQixJLEdBQUEsSTs7QUEzUWhCOztJQUFZLEs7O0FBQ1o7O0lBQVksSzs7QUFDWjs7SUFBWSxJOzs7O0FBRVo7QUFDQSxJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsWUFBdkIsRUFBcUMsVUFBckMsRUFBaUQsS0FBakQsRUFBd0QsTUFBeEQsRUFBZ0U7O0FBRTlELE1BQUksWUFBWSxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBaEI7QUFDQSxNQUFJLFVBQVUsU0FBUyxjQUFULENBQXdCLFdBQXhCLENBQWQ7QUFDQSxVQUFRLFNBQVIsR0FBb0IsRUFBcEI7QUFDQSxZQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsQ0FBMUI7O0FBRUEsTUFBSSxlQUFlLEVBQW5CO0FBQ0EsTUFBSSxVQUFVLEVBQWQ7QUFDQSxNQUFJLGdCQUFnQixFQUFwQjs7QUFFQTtBQUNBLFNBQU8sT0FBUCxDQUFnQixVQUFDLEtBQUQsRUFBVztBQUN6QixRQUFJLGFB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCAqIGFzIFN0b3BzIGZyb20gJy4vb3JtL1N0b3BzLmpzJztcbmltcG9ydCAqIGFzIFRyaXBzIGZyb20gJy4vb3JtL1RyaXBzLmpzJztcbmltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi9odHRwLmpzJztcblxuLy8gSW50ZXJhY3RpdmUgZWxlbWVudHMgaW4gdGhlIHBhZ2VcbnZhciBkZXBhcnR1cmVzLCBhcnJpdmFscywgc3VibWl0QnV0dG9uO1xuXG4vKiBcbiAgQWRkIHRoZSBvcHRpb25zIHRvIHRoZSBkYXRhbGlzdCBlbGVtZW50cyBpbiB0aGUgZm9ybS5cbiovXG5mdW5jdGlvbiBhZGRTdG9wcyhzdG9wcykge1xuXG4gIHN0b3BzLmZvckVhY2goIChzdG9wKSA9PiB7XG4gICAgXG4gICAgdmFyIG9wdGlvbiA9IGA8b3B0aW9uIHZhbHVlPVwiJHtzdG9wLnN0b3BfbmFtZX0gLSAke3N0b3Auc3RvcF9pZH1cIj48L29wdGlvbj5gO1xuICAgIGRlcGFydHVyZXMuaW5uZXJIVE1MICs9IG9wdGlvbjtcbiAgICBhcnJpdmFscy5pbm5lckhUTUwgKz0gb3B0aW9uO1xuXG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIHNob3dUcmlwVGltZXMoZGVwYXJ0dXJlX2lkLCBhcnJpdmFsX2lkLCB0cmlwcywgcm91dGVzKSB7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb3V0ZS1yZXN1bHQnKTtcbiAgdmFyIHJlc3VsdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGltZXRhYmxlJyk7XG4gIHJlc3VsdHMuaW5uZXJIVE1MID0gJyc7XG4gIGNvbnRhaW5lci5zdHlsZS5vcGFjaXR5ID0gMTtcblxuICB2YXIgdW5pcXVlUm91dGVzID0gW107XG4gIHZhciBvcHRpb25zID0gW107XG4gIHZhciB0cmlwc1Byb21pc2VzID0gW107XG5cbiAgLy8gR2V0IHRoZSB0aW1lcyBmb3IgZWFjaCB0cmlwXG4gIHJvdXRlcy5mb3JFYWNoKCAocm91dGUpID0+IHtcbiAgICB2YXIgcm91dGVUcmlwcyA9IHRyaXBzXG4gICAgICAuZmlsdGVyKCh0cmlwKSA9PiB0cmlwLnRyaXBfaWQgPT0gcm91dGUudHJpcF9pZCApOyBcblxuICAgIHZhciByb3V0ZU9wdGlvbnMgPSAnJztcbiAgICByb3V0ZVRyaXBzLmZvckVhY2goZnVuY3Rpb24gKHRyaXApIHtcblxuICAgICAgdmFyIGRlcGFydHVyZVByb21pc2UgPSBUcmlwcy5nZXRTdG9wSW5UcmlwVGltZShkZXBhcnR1cmVfaWQsIHRyaXAudHJpcF9pZCk7XG4gICAgICB2YXIgYXJyaXZhbFByb21pc2UgPSBUcmlwcy5nZXRTdG9wSW5UcmlwVGltZShhcnJpdmFsX2lkLCB0cmlwLnRyaXBfaWQpO1xuICAgICAgXG4gICAgICB0cmlwc1Byb21pc2VzLnB1c2goUHJvbWlzZS5hbGwoW2RlcGFydHVyZVByb21pc2UsIGFycml2YWxQcm9taXNlXSkudGhlbihmdW5jdGlvbihbZGVwYXJ0dXJlVGltZSwgYXJyaXZhbFRpbWVdKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgZHVyYXRpb24gPSAwO1xuXG4gICAgICAgIHJvdXRlT3B0aW9ucyArPSBgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtkZXBhcnR1cmVUaW1lWzBdLmFycml2YWxfdGltZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7ZHVyYXRpb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTMzIGNlbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAke2Fycml2YWxUaW1lWzBdLmFycml2YWxfdGltZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5gO1xuXG4gICAgICAgIG9wdGlvbnNbcm91dGUucm91dGVfaWRdICs9IHJvdXRlT3B0aW9ucztcblxuICAgICAgfSkpO1xuXG4gICAgfSk7XG5cbiAgfSk7XG5cbiAgLy8gY3JlYXRlIGh0bWwgZm9yIGVhY2ggcm91dGUsIGFkZGluZyB0aGUgdGltZXMgY2FsY3VsYXRlZCBmb3IgZWFjaCB0cmlwXG4gIFByb21pc2UuYWxsKHRyaXBzUHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICByb3V0ZXMuZm9yRWFjaCggKHJvdXRlLCBpbmRleCkgPT4ge1xuICAgIFxuICAgICAgaWYodW5pcXVlUm91dGVzLmluZGV4T2Yocm91dGUucm91dGVfaWQpID09IC0xKSB7XG4gICAgICAgIC8vIG5ldyByb3V0ZSEhXG4gICAgICAgIHVuaXF1ZVJvdXRlcy5wdXNoKHJvdXRlLnJvdXRlX2lkKTtcbiAgICAgICAgdmFyIHJvdyA9IGA8ZGl2IGNsYXNzPVwiXCI+XG4gICAgICAgICAgICAgICAgICAgIFJvdXRlOiAke3JvdXRlLnJvdXRlX2lkfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiXCI+XG4gICAgICAgICAgICAgICAgICAgIFNlcnZpY2U6ICR7cm91dGUuc2VydmljZV9pZH1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJvdyB0YWJsZVwiPiBcbiAgICAgICAgICAgICAgICAgICAgJHtvcHRpb25zW3JvdXRlLnJvdXRlX2lkXX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PmA7XG4gICAgXG4gICAgICAgIHJlc3VsdHMuaW5uZXJIVE1MICs9IHJvdztcbiAgICAgIH1cblxuICAgIH0pO1xuXG4gIH0pO1xuICBcblxufVxuXG4vKlxuICBTaG93cyBhIG1lc3NhZ2UgaW4gdGhlIG1lc3NhZ2UtYm94IGVsZW1lbnQuXG4qL1xuZnVuY3Rpb24gc2hvd0luZm9NZXNzYWdlKG1lc3NhZ2UsIHR5cGUpIHtcblxuICB2YXIgbWVzc2FnZUJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZXNzYWdlLWJveCcpO1xuICBtZXNzYWdlQm94LmlubmVySFRNTCA9IG1lc3NhZ2U7XG5cbiAgbWVzc2FnZUJveC5jbGFzc05hbWUgPSAnYWxlcnQnO1xuICBcbiAgc3dpdGNoKHR5cGUpIHtcbiAgICBjYXNlICdlcnJvcic6XG4gICAgICBtZXNzYWdlQm94LmNsYXNzTmFtZSArPSAnIGVycm9yJztcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBtZXNzYWdlQm94LmNsYXNzTmFtZSArPSAnIGluZm8nO1xuICAgICAgYnJlYWs7ICAgIFxuICB9XG5cbn1cblxuLypcbiAgTWFrZXMgdGhlIG1lc3NhZ2UtYm94IGVsZW1lbnQgZGlzYXBwZWFyIHRocm91Z2ggY3NzIGNsYXNzXG4qL1xuZnVuY3Rpb24gY2xlYXJJbmZvTWVzc2FnZSgpIHtcbiAgdmFyIG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZS1ib3gnKTtcbiAgbWVzc2FnZUJveC5jbGFzc05hbWUgPSAnYWxlcnQnO1xufVxuXG5mdW5jdGlvbiBjbGVhclJlc3VsdHMoKSB7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb3V0ZS1yZXN1bHQnKTtcbiAgdmFyIHJlc3VsdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGltZXRhYmxlJyk7XG4gIHJlc3VsdHMuaW5uZXJIVE1MID0gJyc7XG4gIGNvbnRhaW5lci5zdHlsZS5vcGFjaXR5ID0gMDtcblxufVxuXG5cbi8qXG4gIFJlcXVlc3QgdGhlIHN0b3BzIGZyb20gc2VydmVyIGFuZCBhZGQgdGhlbSB0byBhbiBhcnJheVxuICB0byBiZSBhYmxlIHRvIGNoZWNrIHRoYXQgdGhlIHVzZXIgaW5wdXQgaXMgdmFsaWQuXG4qL1xuZnVuY3Rpb24gbG9hZFN0b3BzKCkge1xuXG4gIFN0b3BzLmdldEFsbCgpLnRoZW4oYWRkU3RvcHMpO1xuXG59O1xuXG4vKlxuICBHZXQgdGhlIHN0YXRpb24gY29kZSBmcm9tIGEgc3RyaW5nXG4qL1xuZnVuY3Rpb24gZ2V0U3RhdGlvbkNvZGUoc3RhdGlvbikge1xuXG4gIHZhciBwYXJ0cyA9IHN0YXRpb24uc3BsaXQoJy0nKTtcbiAgXG4gIGlmKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAvLyBUaGlzIGNvdWxkIGJlIGEgc3RyaW5nIGZyb20gdGhlIGRhdGFsaXN0LCBleHRyYWN0IHRoZSBjb2RlXG4gICAgcmV0dXJuIHBhcnRzWzFdLnRyaW0oKTtcbiAgfSBcblxuICAvLyBUaGlzIGNvdWxkIGJlIGEgY29kZSB3cml0dGVuIGJ5IHRoZSB1c2VyXG4gIHJldHVybiBzdGF0aW9uO1xuICBcbn1cblxuLypcbiAgQ2hlY2sgdGhhdCBhIGNvZGUgaXMgZWl0aGVyIGEgcGFpciBzdGF0aW9uIG5hbWUgLSBzdGF0aW9uIGNvZGUgXG4gIGZyb20gdGhlIGZvcm0gZGF0YWxpc3Qgb3IgYSBjb2RlIG9mIGEgc3RvcCB3cml0dGVuIGJ5IHRoZSB1c2VyLlxuKi9cbmZ1bmN0aW9uIGNoZWNrU3RhdGlvbihzdGF0aW9uKSB7XG5cbiAgdmFyIGNvZGUgPSBnZXRTdGF0aW9uQ29kZShzdGF0aW9uKTtcblxuICAvLyBDaGVjayB0aGF0IHRoZSBjb2RlIGlzIGluIHRoZSBsaXN0IG9mIHN0b3BzXG4gIHJldHVybiBTdG9wcy5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKHN0b3BzKXtcbiAgICByZXR1cm4gc3RvcHMuc29tZShmdW5jdGlvbiBjaGVjayhzdG9wKSB7XG4gICAgICByZXR1cm4gc3RvcC5zdG9wX2lkID09IGNvZGU7XG4gICAgfSk7XG4gIH0pO1xuXG59XG5cbi8qXG4gIFRha2VzIGEgdGltZSBpbiAwMDowMDowMCBmb3JtYXQgYW5kIHJldHVybnMgdGhlIG51bWJlciBvZiBzZWNvbmRzXG4gIGZyb20gMDA6MDA6MDAgdG8gdGhlIHByb3ZpZGVkIHRpbWUuXG4qL1xuZnVuY3Rpb24gdGltZVRvU2Vjb25kcyh0aW1lKSB7XG5cbiAgdmFyIHRpbWVQYXJ0cyA9IHRpbWUuc3BsaXQoJzonKTtcbiAgcmV0dXJuIHRpbWVQYXJ0c1swXSozNjAwICsgdGltZVBhcnRzWzFdKjYwICsgdGltZVBhcnRzWzJdO1xuXG59XG5cbmZ1bmN0aW9uIGZpbmRNYXRjaGluZ1RyaXBzKGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpIHtcblxuICAvLyBnZXRzIGFsbCB0cmlwcyB0aGF0IGdvZXMgdG8gdGhlIGRlcGFydHVyZSBzdG9wIGFuZCB0aGUgYXJyaXZhbCBzdG9wXG4gIHZhciB2YWxpZFRyaXBzID0gZGVwYXJ0dXJlVGltZXMuZmlsdGVyKGZ1bmN0aW9uKGRlcGFydHVyZVRyaXApe1xuICAgIHJldHVybiBhcnJpdmFsVGltZXMuc29tZShmdW5jdGlvbihhcnJpdmFsVHJpcCl7XG4gICAgICByZXR1cm4gYXJyaXZhbFRyaXAudHJpcF9pZCA9PSBkZXBhcnR1cmVUcmlwLnRyaXBfaWQgJiYgXG4gICAgICAgIHRpbWVUb1NlY29uZHMoZGVwYXJ0dXJlVHJpcC5hcnJpdmFsX3RpbWUpIDwgdGltZVRvU2Vjb25kcyhhcnJpdmFsVHJpcC5hcnJpdmFsX3RpbWUpO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gdmFsaWRUcmlwcztcbn1cblxuLypcbiAgRmluZHMgdHJpcHMgYmV0d2VlbiB0d28gc3RhdGlvbnMsIHJldHVybnMgdGhlIHRyaXBzIGlkc1xuKi9cbmZ1bmN0aW9uIGZpbmRUcmlwcyhkZXBhcnR1cmVJZCwgYXJyaXZhbElkKSB7XG5cbiAgcmV0dXJuIFByb21pc2UuYWxsKFtUcmlwcy5nZXRUcmlwU3RvcFRpbWVzKGRlcGFydHVyZUlkKSwgVHJpcHMuZ2V0VHJpcFN0b3BUaW1lcyhhcnJpdmFsSWQpXSkudGhlbihcbiAgICAgIGZ1bmN0aW9uKFtkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzXSkge1xuICAgICAgXG4gICAgICAgIHZhciB0cmlwcyA9IGZpbmRNYXRjaGluZ1RyaXBzKGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpO1xuICAgICAgICByZXR1cm4ge3RyaXBzOiB0cmlwcywgcm91dGVzOiBUcmlwcy5nZXRSb3V0ZXNGb3JUcmlwcyh0cmlwcyl9O1xuXG4gICAgICB9KTtcblxufVxuXG4vKlxuICBTdWJtaXQgdGhlIHVzZXIgc2VsZWN0aW9uIGFuZCBzaG93IHRoZSByb3V0ZSBpZiBhdmFpbGFibGUgb3IgYW5cbiAgZXJyb3IgbWVzc2FnZSBpZiBubyByb3V0ZSBpcyBhdmFpbGFibGUuXG4qL1xuZnVuY3Rpb24gc3VibWl0U3RhdGlvbnMoZXZ0KSB7XG5cbiAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gIGNsZWFySW5mb01lc3NhZ2UoKTtcbiAgY2xlYXJSZXN1bHRzKCk7XG4gIFxuICAvLyBnZXQgdGhlIGlucHV0cyB2YWx1ZXNcbiAgdmFyIGRlcGFydHVyZV9pZCA9IGdldFN0YXRpb25Db2RlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBhcnR1cmUnKS52YWx1ZSk7XG4gIHZhciBhcnJpdmFsX2lkID0gZ2V0U3RhdGlvbkNvZGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fycml2YWwnKS52YWx1ZSk7XG5cbiAgUHJvbWlzZS5hbGwoW2NoZWNrU3RhdGlvbihkZXBhcnR1cmVfaWQpLCBjaGVja1N0YXRpb24oYXJyaXZhbF9pZCldKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgXG4gICAgaWYoIXJlc3VsdFswXSB8fCAhcmVzdWx0WzFdKSB7XG4gICAgICBzaG93SW5mb01lc3NhZ2UoXG4gICAgICAgICdZb3UgaGF2ZSB0byBzZWxlY3QgYSB2YWxpZCBkZXBhcnR1cmUgYW5kIGFycml2YWwgc3RhdGlvbnMgZnJvbSB0aGUgbGlzdHMgb3Igd3JpdGUgYSB2YWxpZCBzdG9wIGNvZGUuJyxcbiAgICAgICAgJ2Vycm9yJ1xuICAgICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvLyBJZiB0aGUgZGVwYXJ0dXJlIGFuZCBhcnJpdmFsIHN0YXRpb25zIGFyZSBjb3JyZWN0XG4gICAgLy8gc2VhcmNoIGZvciBhIHRyaXAgYmV0d2VlbiB0aGVtIGFuZCBzaG93IHRoZSB0aW1lcyBhbmQgcm91dGVcbiAgICBmaW5kVHJpcHMoZGVwYXJ0dXJlX2lkLCBhcnJpdmFsX2lkKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgICAgZGF0YS5yb3V0ZXMudGhlbihmdW5jdGlvbihyb3V0ZXMpe1xuICAgICAgICAgIGlmKHJvdXRlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzaG93VHJpcFRpbWVzKGRlcGFydHVyZV9pZCwgYXJyaXZhbF9pZCwgZGF0YS50cmlwcywgcm91dGVzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdXZSBjb3VsZG5cXCd0IGZpbmQgYSB0cmlwIGJldHdlZW4gdGhlc2UgdHdvIHN0YXRpb25zJywgJ2Vycm9yJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgfSk7XG5cblxufVxuXG4vKlxuICBJbml0aWFsaXplIHRoZSBhcHBsaWNhdGlvbiBcbiovXG5leHBvcnQgZnVuY3Rpb24gaW5pdCgpIHtcblxuICAvLyBnZXQgdGhlIGludGVyYWN0aXZlIGVsZW1lbnRzIG9mIHRoZSBpbnRlcmZhY2VcbiAgZGVwYXJ0dXJlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBhcnR1cmUtc3RvcHMnKTtcbiAgYXJyaXZhbHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXJyaXZhbC1zdG9wcycpO1xuICBzdWJtaXRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VhcmNoJyk7XG5cbiAgLy8gUG9wdWxhdGUgZGF0YWxpc3RzIGFuZCBhZGQgbGlzdGVuZXJzXG4gIGxvYWRTdG9wcygpO1xuICBzdWJtaXRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdWJtaXRTdGF0aW9ucyk7XG5cbn07XG4iLCJjb25zdCBiYXNlVXJsICAgICAgID0gJy9kaXN0L2RhdGEvJztcbmNvbnN0IHJvdXRlc0ZpbGUgICAgPSAncm91dGVzLnR4dCc7XG5jb25zdCB0cmlwc0ZpbGUgICAgID0gJ3RyaXBzLnR4dCc7XG5jb25zdCBzdG9wc0ZpbGUgICAgID0gJ3N0b3BzLnR4dCc7XG5jb25zdCBzdG9wVGltZXNGaWxlID0gJ3N0b3BfdGltZXMudHh0JztcblxuY29uc3QgY3N2VG9BcnJheSA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgXG4gIHZhciByb3dzID0gdGV4dC50cmltKCkuc3BsaXQoJ1xcbicpO1xuICByZXR1cm4gcm93cy5tYXAoKHJvdykgPT4gcm93LnNwbGl0KCcsJykpO1xuXG59O1xuXG5jb25zdCBjc3ZUb09iamVjdHMgPSBmdW5jdGlvbih0ZXh0KSB7XG5cbiAgdmFyIHRhYmxlID0gY3N2VG9BcnJheSh0ZXh0KTtcbiAgdmFyIGtleXMgPSB0YWJsZVswXTtcbiAgdGFibGUgPSB0YWJsZS5zbGljZSgxKTtcblxuICByZXR1cm4gdGFibGUubWFwKGZ1bmN0aW9uKHJvdykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuICAgICAgb2JqW2tleV0gPSByb3dbaW5kZXhdO1xuICAgIH0pO1xuICAgIHJldHVybiAgb2JqO1xuICB9KTtcblxufVxuXG5mdW5jdGlvbiBnZXRDc3ZBc09iamVjdHModXJsKSB7XG5cbiAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKTtcblxuICAgIH0pLnRoZW4oZnVuY3Rpb24odGV4dENvbnRlbnQpIHtcblxuICAgICAgcmV0dXJuIGNzdlRvT2JqZWN0cyh0ZXh0Q29udGVudCk7XG5cbiAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgfSk7XG59XG5cbi8vIEFQSVxuXG4vKlxuICBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIGFycmF5IHdpdGggdGhlIG5hbWVzIG9mIHRoZSBcbiAgYXZhaWxhYmxlIGxpbmVzLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZXMoKSB7XG5cbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgcm91dGVzRmlsZSk7XG5cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmlwcygpIHtcbiAgLy8gZ2V0IHRoZSByb3V0ZS9saW5lIGFuZCByZXR1cm4gdGhlIHRpbWVzIGZvciB0aGlzIGxpbmVcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgdHJpcHNGaWxlKTtcblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BzKCkge1xuICAvLyByZXR1cm5zIHRoZSBzdG9wcyBvZiB0aGlzIGxpbmVcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc3RvcHNGaWxlKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wVGltZXMoKSB7XG4gIHJldHVybiBnZXRDc3ZBc09iamVjdHMoYmFzZVVybCArIHN0b3BUaW1lc0ZpbGUpOyBcbn07XG4iLCJpbXBvcnQgKiBhcyBBcHAgZnJvbSAnLi9hcHAuanMnO1xuXG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xuXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xuXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy4vc2VydmljZV93b3JrZXIuanMnLCB7c2NvcGU6ICcvJ30pLnRoZW4oZnVuY3Rpb24ocmVnKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdSZWdpc3RyYXRpb24gd29ya2VkIScsIHJlZyk7XG5cbiAgICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuY29udHJvbGxlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuXG4gICAgICBjb25zb2xlLmVycm9yKCdSZWdpc3RyYXRpb24gZmFpbGVkIScsIGVycm9yKTtcbiAgICBcbiAgICB9KTtcblxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgICBcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBcbiAgICAgIC8vIHJlc29sdmUgdGhlIHByb21pc2Ugd2hlbiB0aGUgZG9jdW1lbnQgaXMgcmVhZHlcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0pO1xuXG4gIH07XG5cbiAgcmVhZHkoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIEFwcC5pbml0KCk7XG4gICAgcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCk7XG4gIH0pO1xuXG59KSgpOyIsImltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi4vaHR0cC5qcyc7XG5pbXBvcnQgaWRiIGZyb20gJy4vZGIuanMnO1xuXG4vLyBJZiBpbmRleGVkREIgaXMgcG9wdWxhdGVkLCBnZXQgdGhlIGRhdGEgYW5kIHRyeSB0byB1cGRhdGUgZnJvbSBuZXR3b3JrXG4vLyBlbHNlIHRyeSB0byBnZXQgdGhlIGRhdGEgZnJvbSBuZXR3b3JrIGFuZCBzYXZlIGl0XG4vLyBlbHNlIHdlIHNob3VsZCBzaG93IGEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgdG8gdGhlIHVzZXIsIHRoZSBhcHAgaXMgbm90YSBhdmFpbGFibGUuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsKCkge1xuXG4gIHJldHVybiBIdHRwLnN0b3BzKCkudGhlbihmdW5jdGlvbiBnZXRTdG9wc0Zyb21OZXR3b3JrKHJlc3VsdHMpe1xuXG4gICAgaWYoIXJlc3VsdHMpIHtcblxuICAgICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gZ2V0U3RvcHNGcm9tSURCKGRiKXtcblxuICAgICAgICBpZighZGIpIHRocm93ICdTdG9wcyBkYXRhIGlzIG5vdCBhdmFpbGFibGUuJztcblxuICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcHMnKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wcycpLmdldEFsbCgpO1xuICAgICAgXG4gICAgICB9KTtcbiAgICAgIFxuICAgIH1cblxuICAgIC8vIElmIEkgZ2V0IHJlc3VsdHMgc3RvcmUgdGhlIHJlc3VsdCBpbiBpbmRleGVkREJcbiAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBzdG9yZVN0b3BzSW5JREIoZGIpe1xuXG4gICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcHMnLCAncmVhZHdyaXRlJyk7XG4gICAgICB2YXIgc3RvcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wcycpO1xuXG4gICAgICByZXN1bHRzLmZvckVhY2goIGZ1bmN0aW9uKHN0b3ApIHtcbiAgICAgICAgc3RvcHNTdG9yZS5wdXQoc3RvcCk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLmNvbXBsZXRlO1xuXG4gICAgfSkudGhlbihmdW5jdGlvbiB0cmFuc2FjdGlvbkNvbXBsZXRlZCgpe1xuXG4gICAgICByZXR1cm4gcmVzdWx0cztcblxuICAgIH0pO1xuXG4gIH0pO1xuXG59XG5cblxuIiwiaW1wb3J0ICogYXMgSHR0cCBmcm9tICcuLi9odHRwLmpzJztcbmltcG9ydCBpZGIgZnJvbSAnLi9kYi5qcyc7XG5cbiAgLypcbiAgICBUaGlzIGZ1bmN0aW9uIGNoZWNrcyB0aGF0IHRoZSBkYXRhIGlzIGluIEluZGV4ZWREQiwgaWYgbm90LCBpdCBnZXRzIGl0IGZyb20gbmV0d29yay9jYWNoZVxuICAgIGFuZCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGRhdGEgaXMgc3RvcmVkIGluIElEQi5cbiAgICBUaGlzIHdheSB3ZSBkb24ndCBuZWVkIGFueSBpbml0aWFsaXphdGlvbiBmdW5jdGlvbiwganVzdCBjYWxsIHRoaXMgZnVuY3Rpb24gaW4gZWFjaCByZXRyaWV2aW5nXG4gICAgbWV0aG9kIGFuZCBpdCB3aWxsIGdldCBzdXJlIHRoYXQgZXZlcnl0aGluZyBpcyBzZXQgdXAgYmVmb3JlIHRyeWluZyB0byBnZXQgdGhlIGNvbnRlbnQuXG4gICovXG4gIGZ1bmN0aW9uIHNldFRyaXBzKCkge1xuXG4gICAgcmV0dXJuIGlkYigpLnRoZW4oZGIgPT4ge1xuXG4gICAgICBpZighZGIpIHRocm93ICdXZSBjb3VsZG5cXCd0IGFjY2VzcyBJbmRleGVkREInO1xuXG4gICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbigndHJpcHMnKTtcbiAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgIHJldHVybiB0cmlwc1N0b3JlLmNvdW50KCk7XG5cbiAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzIHNvbWV0aGluZyBpbiB0aGUgZGIsIGRvbid0IGJvdGhlciBpbiBnZXR0aW5nIHRoZSBkYXRhIGFnYWluIGZyb20gbmV0d29ya1xuICAgICAgaWYocmVzdWx0ID4gMCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzIG5vdGhpbmcgaW4gdGhlIHRyaXBzIGFuZCB0aW1lcyB0YWJsZSwgZmlsbCB0aGVtIVxuICAgICAgcmV0dXJuIEh0dHAuc3RvcFRpbWVzKClcbiAgICAgICAgLnRoZW4oc3RvcmVTdG9wVGltZXMpXG4gICAgICAgIC50aGVuKEh0dHAudHJpcHMpXG4gICAgICAgIC50aGVuKHN0b3JlVHJpcHMpO1xuXG4gICAgfSk7XG5cblxuICB9XG5cblxuICBmdW5jdGlvbiBzdG9yZVN0b3BUaW1lcyhyZXN1bHRzKSB7XG5cbiAgICBpZihyZXN1bHRzKSB7IFxuXG4gICAgICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIHN0b3JlVHJpcHNJbklEQihkYil7XG5cbiAgICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcF90aW1lcycsICdyZWFkd3JpdGUnKTtcbiAgICAgICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJyk7XG5cbiAgICAgICAgICByZXN1bHRzLmZvckVhY2goIGZ1bmN0aW9uKHRyaXApIHtcbiAgICAgICAgICAgIHRyaXBzU3RvcmUucHV0KHRyaXApO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLmNvbXBsZXRlO1xuXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG5cbiAgICAgICAgICAvLyB0aGUgdHJhbnNhY3Rpb24gZGlkbid0IGNvbXBsZXRlLCBzbyB0aGUgdGFibGUgc2hvdWxkIGJlIGVtcHR5XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0b3JlVHJpcHMocmVzdWx0cykge1xuXG4gICAgaWYocmVzdWx0cykgeyBcblxuICAgICAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBzdG9yZVRyaXBzSW5JREIoZGIpe1xuXG4gICAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJywgJ3JlYWR3cml0ZScpO1xuICAgICAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgICAgICByZXN1bHRzLmZvckVhY2goIGZ1bmN0aW9uKHRyaXApIHtcbiAgICAgICAgICAgIHRyaXBzU3RvcmUucHV0KHRyaXApO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLmNvbXBsZXRlO1xuXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG5cbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICB9XG5cbiAgLy8gSWYgaW5kZXhlZERCIGlzIHBvcHVsYXRlZCwgZ2V0IHRoZSBkYXRhIGFuZCB0cnkgdG8gdXBkYXRlIGZyb20gbmV0d29ya1xuICAvLyBlbHNlIHRyeSB0byBnZXQgdGhlIGRhdGEgZnJvbSBuZXR3b3JrIGFuZCBzYXZlIGl0XG4gIC8vIGVsc2Ugd2Ugc2hvdWxkIHNob3cgYSBjdXN0b20gZXJyb3IgbWVzc2FnZSB0byB0aGUgdXNlciwgdGhlIGFwcCBpcyBub3RhIGF2YWlsYWJsZS5cblxuICAvKlxuICAgIEdldCB0aGUgdHJpcHMgdGhhdCBzdG9wIGF0IHN0b3BfaWQsIG9uZSBwZXIgcm91dGUsIGluZGVwZW5kZW50bHkgb2Ygc3RvcCB0aW1lc1xuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0Um91dGVzRm9yU3RvcChzdG9wX2lkKSB7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRUcmlwc1N0b3BUaW1lcyhzdG9wX2lkKVxuICAgICAgLnRoZW4oKTtcblxuICB9O1xuXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXRSb3V0ZXNGb3JUcmlwcyh0cmlwcykge1xuXG4gICAgdmFyIHRyaXBfaWRzID0gW107XG4gICAgdHJpcHMuZm9yRWFjaChmdW5jdGlvbiBnZXRVbmlxdWVUcmlwSWRzKHRyaXApIHtcbiAgICAgIGlmKHRyaXBfaWRzLmluZGV4T2YodHJpcC50cmlwX2lkKSA9PSAtMSkge1xuICAgICAgICB0cmlwX2lkcy5wdXNoKHRyaXAudHJpcF9pZCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBnZXQgdGhlIHJvdXRlcyBmb3IgdGhpcyB0cmlwc1xuICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIGdldEFsbFJvdXRlcyhkYikge1xuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJyk7XG4gICAgICB2YXIgdHJpcFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgIHZhciByb3V0ZXMgPSBbXTtcbiAgICAgIHRyaXBzLmZvckVhY2goZnVuY3Rpb24gYXBwZW5kVHJpcFByb21pc2UodHJpcCkge1xuXG4gICAgICAgIHJvdXRlcy5wdXNoKHRyaXBTdG9yZS5nZXQodHJpcC50cmlwX2lkKSk7XG5cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocm91dGVzKTtcbiAgICAgIFxuICAgIH0pO1xuXG4gIH07XG5cbiAgLypcbiAgICBHZXQgYWxsIHRoZSB0aW1lcyBmb3IgYSBzdG9wXG4gICovXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXRUcmlwU3RvcFRpbWVzKHN0b3BfaWQpIHtcblxuICAgIHJldHVybiBzZXRUcmlwcygpXG4gICAgICAudGhlbigoKSA9PiBpZGIoKSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uIGdldFRyaXBzRm9yU3RvcChkYil7XG5cbiAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3N0b3BfdGltZXMnKTtcbiAgICAgICAgdmFyIHRyaXBzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcF90aW1lcycpO1xuICAgICAgICB2YXIgc3RvcEluZGV4ID0gdHJpcHNTdG9yZS5pbmRleCgnc3RvcCcpO1xuXG4gICAgICAgIHJldHVybiBzdG9wSW5kZXguZ2V0QWxsKHN0b3BfaWQpO1xuICAgICAgfSk7XG5cbiAgfTtcblxuICAvKlxuICAgIEdldCB0aGUgdGltZSBmb3IgYSBzdG9wIGFuZCBhIHRyaXBcbiAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldFN0b3BJblRyaXBUaW1lKHN0b3BfaWQsIHRyaXBfaWQpIHtcblxuICAgIHJldHVybiB0aGlzLmdldFRyaXBTdG9wVGltZXMoc3RvcF9pZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uIGdldFRpbWVGb3JBVHJpcCh0cmlwcyl7XG4gICAgICAgIHJldHVybiB0cmlwcy5maWx0ZXIoKHRyaXApID0+IHRyaXAudHJpcF9pZCA9PSB0cmlwX2lkKTtcbiAgICAgIH0pO1xuXG4gIH0iLCJpbXBvcnQgaWRiIGZyb20gJy4uLy4uL25vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyc7XG5cbnZhciBfZGI7XG5cbi8vIFRoaXMgY2xhc3Mgd29ya3MgYXMgYSBPUk0gdGhhdCBnZXRzIHRoZSBkYXRhIGZyb20gaW5kZXhlZERCXG5mdW5jdGlvbiBvcGVuRGF0YWJhc2UoKSB7XG4gIFxuICByZXR1cm4gaWRiLm9wZW4oJ3RyYWlucycsIDEsIGZ1bmN0aW9uKHVwZ3JhZGVEYikge1xuICAgIFxuICAgIHN3aXRjaCh1cGdyYWRlRGIub2xkVmVyc2lvbikge1xuICAgIFxuICAgICAgY2FzZSAwOlxuICAgICAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3N0b3BzJywge1xuICAgICAgICAgIGtleVBhdGg6ICdzdG9wX2lkJ1xuICAgICAgICB9KTtcblxuICAgICAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3RyaXBzJywge2tleVBhdGg6ICd0cmlwX2lkJ30pO1xuXG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgnc3RvcF90aW1lcycsIHthdXRvSW5jcmVtZW50OiB0cnVlfSk7XG5cbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdyb3V0ZXMnLCB7XG4gICAgICAgICAga2V5UGF0aDogJ3JvdXRlX2lkJ1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdHJpcFN0b3JlID0gdXBncmFkZURiLnRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJyk7XG4gICAgICAgIHRyaXBTdG9yZS5jcmVhdGVJbmRleCgnc3RvcCcsICdzdG9wX2lkJyk7XG4gICAgICAgIHRyaXBTdG9yZS5jcmVhdGVJbmRleCgndHJpcCcsICd0cmlwX2lkJyk7XG5cbiAgICB9XG4gIH0pO1xuXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRiKCkge1xuICBcbiAgaWYoX2RiID09IG51bGwpIHtcbiAgICBfZGIgPSBvcGVuRGF0YWJhc2UoKTtcbiAgfSBcblxuICByZXR1cm4gX2RiO1xuXG59OyIsIid1c2Ugc3RyaWN0JztcblxuKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiB0b0FycmF5KGFycikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICB9O1xuXG4gICAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHJlcXVlc3Q7XG4gICAgdmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3QgPSBvYmpbbWV0aG9kXS5hcHBseShvYmosIGFyZ3MpO1xuICAgICAgcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgfSk7XG5cbiAgICBwLnJlcXVlc3QgPSByZXF1ZXN0O1xuICAgIHJldHVybiBwO1xuICB9XG4gIFxuICBmdW5jdGlvbiBwcm9taXNpZnlDdXJzb3JSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciBwID0gcHJvbWlzaWZ5UmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpO1xuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmICghdmFsdWUpIHJldHVybjtcbiAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBwLnJlcXVlc3QpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlQcm9wZXJ0aWVzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb3h5Q2xhc3MucHJvdG90eXBlLCBwcm9wLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbdGFyZ2V0UHJvcF1bcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlSZXF1ZXN0TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdLmFwcGx5KHRoaXNbdGFyZ2V0UHJvcF0sIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlDdXJzb3JSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIEluZGV4KGluZGV4KSB7XG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcbiAgfVxuXG4gIHByb3h5UHJvcGVydGllcyhJbmRleCwgJ19pbmRleCcsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdtdWx0aUVudHJ5JyxcbiAgICAndW5pcXVlJ1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKEluZGV4LCAnX2luZGV4JywgSURCSW5kZXgsIFtcbiAgICAnZ2V0JyxcbiAgICAnZ2V0S2V5JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKEluZGV4LCAnX2luZGV4JywgSURCSW5kZXgsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIEN1cnNvcihjdXJzb3IsIHJlcXVlc3QpIHtcbiAgICB0aGlzLl9jdXJzb3IgPSBjdXJzb3I7XG4gICAgdGhpcy5fcmVxdWVzdCA9IHJlcXVlc3Q7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoQ3Vyc29yLCAnX2N1cnNvcicsIFtcbiAgICAnZGlyZWN0aW9uJyxcbiAgICAna2V5JyxcbiAgICAncHJpbWFyeUtleScsXG4gICAgJ3ZhbHVlJ1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKEN1cnNvciwgJ19jdXJzb3InLCBJREJDdXJzb3IsIFtcbiAgICAndXBkYXRlJyxcbiAgICAnZGVsZXRlJ1xuICBdKTtcblxuICAvLyBwcm94eSAnbmV4dCcgbWV0aG9kc1xuICBbJ2FkdmFuY2UnLCAnY29udGludWUnLCAnY29udGludWVQcmltYXJ5S2V5J10uZm9yRWFjaChmdW5jdGlvbihtZXRob2ROYW1lKSB7XG4gICAgaWYgKCEobWV0aG9kTmFtZSBpbiBJREJDdXJzb3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgIEN1cnNvci5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjdXJzb3IgPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgY3Vyc29yLl9jdXJzb3JbbWV0aG9kTmFtZV0uYXBwbHkoY3Vyc29yLl9jdXJzb3IsIGFyZ3MpO1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdChjdXJzb3IuX3JlcXVlc3QpLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICAgICAgcmV0dXJuIG5ldyBDdXJzb3IodmFsdWUsIGN1cnNvci5fcmVxdWVzdCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gT2JqZWN0U3RvcmUoc3RvcmUpIHtcbiAgICB0aGlzLl9zdG9yZSA9IHN0b3JlO1xuICB9XG5cbiAgT2JqZWN0U3RvcmUucHJvdG90eXBlLmNyZWF0ZUluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmRleCh0aGlzLl9zdG9yZS5jcmVhdGVJbmRleC5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgT2JqZWN0U3RvcmUucHJvdG90eXBlLmluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmRleCh0aGlzLl9zdG9yZS5pbmRleC5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgW1xuICAgICduYW1lJyxcbiAgICAna2V5UGF0aCcsXG4gICAgJ2luZGV4TmFtZXMnLFxuICAgICdhdXRvSW5jcmVtZW50J1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAncHV0JyxcbiAgICAnYWRkJyxcbiAgICAnZGVsZXRlJyxcbiAgICAnY2xlYXInLFxuICAgICdnZXQnLFxuICAgICdnZXRBbGwnLFxuICAgICdnZXRBbGxLZXlzJyxcbiAgICAnY291bnQnXG4gIF0pO1xuXG4gIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xuICAgICdvcGVuQ3Vyc29yJyxcbiAgICAnb3BlbktleUN1cnNvcidcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnZGVsZXRlSW5kZXgnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIFRyYW5zYWN0aW9uKGlkYlRyYW5zYWN0aW9uKSB7XG4gICAgdGhpcy5fdHggPSBpZGJUcmFuc2FjdGlvbjtcbiAgICB0aGlzLmNvbXBsZXRlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChpZGJUcmFuc2FjdGlvbi5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgVHJhbnNhY3Rpb24ucHJvdG90eXBlLm9iamVjdFN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTdG9yZSh0aGlzLl90eC5vYmplY3RTdG9yZS5hcHBseSh0aGlzLl90eCwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKFRyYW5zYWN0aW9uLCAnX3R4JywgW1xuICAgICdvYmplY3RTdG9yZU5hbWVzJyxcbiAgICAnbW9kZSdcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKFRyYW5zYWN0aW9uLCAnX3R4JywgSURCVHJhbnNhY3Rpb24sIFtcbiAgICAnYWJvcnQnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIFVwZ3JhZGVEQihkYiwgb2xkVmVyc2lvbiwgdHJhbnNhY3Rpb24pIHtcbiAgICB0aGlzLl9kYiA9IGRiO1xuICAgIHRoaXMub2xkVmVyc2lvbiA9IG9sZFZlcnNpb247XG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbih0cmFuc2FjdGlvbik7XG4gIH1cblxuICBVcGdyYWRlREIucHJvdG90eXBlLmNyZWF0ZU9iamVjdFN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTdG9yZSh0aGlzLl9kYi5jcmVhdGVPYmplY3RTdG9yZS5hcHBseSh0aGlzLl9kYiwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKFVwZ3JhZGVEQiwgJ19kYicsIFtcbiAgICAnbmFtZScsXG4gICAgJ3ZlcnNpb24nLFxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoVXBncmFkZURCLCAnX2RiJywgSURCRGF0YWJhc2UsIFtcbiAgICAnZGVsZXRlT2JqZWN0U3RvcmUnLFxuICAgICdjbG9zZSdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gREIoZGIpIHtcbiAgICB0aGlzLl9kYiA9IGRiO1xuICB9XG5cbiAgREIucHJvdG90eXBlLnRyYW5zYWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbih0aGlzLl9kYi50cmFuc2FjdGlvbi5hcHBseSh0aGlzLl9kYiwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKERCLCAnX2RiJywgW1xuICAgICduYW1lJyxcbiAgICAndmVyc2lvbicsXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhEQiwgJ19kYicsIElEQkRhdGFiYXNlLCBbXG4gICAgJ2Nsb3NlJ1xuICBdKTtcblxuICAvLyBBZGQgY3Vyc29yIGl0ZXJhdG9yc1xuICAvLyBUT0RPOiByZW1vdmUgdGhpcyBvbmNlIGJyb3dzZXJzIGRvIHRoZSByaWdodCB0aGluZyB3aXRoIHByb21pc2VzXG4gIFsnb3BlbkN1cnNvcicsICdvcGVuS2V5Q3Vyc29yJ10uZm9yRWFjaChmdW5jdGlvbihmdW5jTmFtZSkge1xuICAgIFtPYmplY3RTdG9yZSwgSW5kZXhdLmZvckVhY2goZnVuY3Rpb24oQ29uc3RydWN0b3IpIHtcbiAgICAgIENvbnN0cnVjdG9yLnByb3RvdHlwZVtmdW5jTmFtZS5yZXBsYWNlKCdvcGVuJywgJ2l0ZXJhdGUnKV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIHJlcXVlc3QgPSAodGhpcy5fc3RvcmUgfHwgdGhpcy5faW5kZXgpW2Z1bmNOYW1lXS5hcHBseSh0aGlzLl9zdG9yZSwgYXJncy5zbGljZSgwLCAtMSkpO1xuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNhbGxiYWNrKHJlcXVlc3QucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIHBvbHlmaWxsIGdldEFsbFxuICBbSW5kZXgsIE9iamVjdFN0b3JlXS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgaWYgKENvbnN0cnVjdG9yLnByb3RvdHlwZS5nZXRBbGwpIHJldHVybjtcbiAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsID0gZnVuY3Rpb24ocXVlcnksIGNvdW50KSB7XG4gICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgdmFyIGl0ZW1zID0gW107XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICAgIGluc3RhbmNlLml0ZXJhdGVDdXJzb3IocXVlcnksIGZ1bmN0aW9uKGN1cnNvcikge1xuICAgICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaXRlbXMucHVzaChjdXJzb3IudmFsdWUpO1xuXG4gICAgICAgICAgaWYgKGNvdW50ICE9PSB1bmRlZmluZWQgJiYgaXRlbXMubGVuZ3RoID09IGNvdW50KSB7XG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgdmFyIGV4cCA9IHtcbiAgICBvcGVuOiBmdW5jdGlvbihuYW1lLCB2ZXJzaW9uLCB1cGdyYWRlQ2FsbGJhY2spIHtcbiAgICAgIHZhciBwID0gcHJvbWlzaWZ5UmVxdWVzdENhbGwoaW5kZXhlZERCLCAnb3BlbicsIFtuYW1lLCB2ZXJzaW9uXSk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHAucmVxdWVzdDtcblxuICAgICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAodXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICAgICAgdXBncmFkZUNhbGxiYWNrKG5ldyBVcGdyYWRlREIocmVxdWVzdC5yZXN1bHQsIGV2ZW50Lm9sZFZlcnNpb24sIHJlcXVlc3QudHJhbnNhY3Rpb24pKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbihkYikge1xuICAgICAgICByZXR1cm4gbmV3IERCKGRiKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwoaW5kZXhlZERCLCAnZGVsZXRlRGF0YWJhc2UnLCBbbmFtZV0pO1xuICAgIH1cbiAgfTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cDtcbiAgfVxuICBlbHNlIHtcbiAgICBzZWxmLmlkYiA9IGV4cDtcbiAgfVxufSgpKTsiXX0=
