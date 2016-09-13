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

function showTripTimes(trips, routes) {

  var container = document.getElementById('route-result');
  var results = document.getElementById('timetable');
  results.innerHTML = '';
  container.style.opacity = 1;

  var uniqueRoutes = [];
  var options = [];

  // Get the times for each route
  routes.forEach(function (route) {
    var routeOptions = trips.filter(function (trip) {
      return trip.trip_id == route.trip_id;
    }).map(function (trip) {
      return '<option value="' + trip.trip_id + '">' + trip.arrival_time + '</option>';
    });

    options[route.route_id] += routeOptions.join();
  });

  // create html for each route, addind the times in a select element
  routes.forEach(function (route, index) {

    if (uniqueRoutes.indexOf(route.route_id) == -1) {
      // new route!!
      uniqueRoutes.push(route.route_id);
      var row = '<div class="row table"> \n                  <div class="col-33 cell">\n                    ' + route.route_id + '\n                  </div>\n                  <div class="col-33 cell">\n                    ' + route.service_id + '\n                  </div> \n                  <div class="col-33 cell">\n                    <select>' + options[route.route_id] + '</select>\n                  </div>\n                </div>';

      results.innerHTML += row;
    }
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

function findMatchingTrips(departureTimes, arrivalTimes) {

  // gets all trips that goes to the departure stop and the arrival stop
  var validTrips = departureTimes.filter(function (departureTrip) {
    return arrivalTimes.some(function (arrivalTrip) {
      return arrivalTrip.trip_id == departureTrip.trip_id;
    });
  });

  return validTrips;
}

/*
  Finds trips between two stations, returns the trips ids
*/
function findTrips(departureId, arrivalId) {

  return Promise.all([Trips.getTripStopTimes(departureId), Trips.getTripStopTimes(arrivalId)]).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var departureTimes = _ref2[0];
    var arrivalTimes = _ref2[1];


    console.log('Found routes!', departureTimes, arrivalTimes);
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
  var departure = document.getElementById('departure').value;
  var arrival = document.getElementById('arrival').value;

  Promise.all([checkStation(departure), checkStation(arrival)]).then(function (result) {

    if (!result[0] || !result[1]) {
      showInfoMessage('You have to select a valid departure and arrival stations from the lists or write a valid stop code.', 'error');
      return false;
    }

    // If the departure and arrival stations are correct
    // search for a trip between them and show the times and route
    findTrips(getStationCode(departure), getStationCode(arrival)).then(function (data) {

      data.routes.then(function (routes) {
        if (routes.length > 0) {
          showTripTimes(data.trips, routes);
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
      console.log('Registration worked!', reg);

      if (!navigator.serviceWorker.controller) {
        return;
      }
    }).catch(function (error) {

      console.log('Registration failed!', error);
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
exports.getTripsForRoute = getTripsForRoute;
exports.getStopsForRoute = getStopsForRoute;

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
      console.log(result);
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
  Get all the trips for a route
*/
function getTripsForRoute(route_id) {};

/*
  Get all the stops for a route
*/
function getStopsForRoute(route_id) {};

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiLCJhcHAvb3JtL1RyaXBzLmpzIiwiYXBwL29ybS9kYi5qcyIsIm5vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O1FDbU9nQixJLEdBQUEsSTs7QUFuT2hCOztJQUFZLEs7O0FBQ1o7O0lBQVksSzs7QUFDWjs7SUFBWSxJOzs7O0FBRVo7QUFDQSxJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsRUFBOEIsTUFBOUIsRUFBc0M7O0FBRXBDLE1BQUksWUFBWSxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBaEI7QUFDQSxNQUFJLFVBQVUsU0FBUyxjQUFULENBQXdCLFdBQXhCLENBQWQ7QUFDQSxVQUFRLFNBQVIsR0FBb0IsRUFBcEI7QUFDQSxZQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsQ0FBMUI7O0FBRUEsTUFBSSxlQUFlLEVBQW5CO0FBQ0EsTUFBSSxVQUFVLEVBQWQ7O0FBRUE7QUFDQSxTQUFPLE9BQVAsQ0FBZ0IsVUFBQyxLQUFELEVBQVc7QUFDekIsUUFBSSxlQUFlLE1BQ2hCLE1BRGdCLENBQ1QsVUFBQyxJQUFEO0FBQUEsYUFBVSxLQUFLLE9B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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgKiBhcyBTdG9wcyBmcm9tICcuL29ybS9TdG9wcy5qcyc7XG5pbXBvcnQgKiBhcyBUcmlwcyBmcm9tICcuL29ybS9Ucmlwcy5qcyc7XG5pbXBvcnQgKiBhcyBIdHRwIGZyb20gJy4vaHR0cC5qcyc7XG5cbi8vIEludGVyYWN0aXZlIGVsZW1lbnRzIGluIHRoZSBwYWdlXG52YXIgZGVwYXJ0dXJlcywgYXJyaXZhbHMsIHN1Ym1pdEJ1dHRvbjtcblxuLyogXG4gIEFkZCB0aGUgb3B0aW9ucyB0byB0aGUgZGF0YWxpc3QgZWxlbWVudHMgaW4gdGhlIGZvcm0uXG4qL1xuZnVuY3Rpb24gYWRkU3RvcHMoc3RvcHMpIHtcblxuICBzdG9wcy5mb3JFYWNoKCAoc3RvcCkgPT4ge1xuICAgIFxuICAgIHZhciBvcHRpb24gPSBgPG9wdGlvbiB2YWx1ZT1cIiR7c3RvcC5zdG9wX25hbWV9IC0gJHtzdG9wLnN0b3BfaWR9XCI+PC9vcHRpb24+YDtcbiAgICBkZXBhcnR1cmVzLmlubmVySFRNTCArPSBvcHRpb247XG4gICAgYXJyaXZhbHMuaW5uZXJIVE1MICs9IG9wdGlvbjtcblxuICB9KTtcblxufVxuXG5mdW5jdGlvbiBzaG93VHJpcFRpbWVzKHRyaXBzLCByb3V0ZXMpIHtcblxuICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvdXRlLXJlc3VsdCcpO1xuICB2YXIgcmVzdWx0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aW1ldGFibGUnKTtcbiAgcmVzdWx0cy5pbm5lckhUTUwgPSAnJztcbiAgY29udGFpbmVyLnN0eWxlLm9wYWNpdHkgPSAxO1xuXG4gIHZhciB1bmlxdWVSb3V0ZXMgPSBbXTtcbiAgdmFyIG9wdGlvbnMgPSBbXTtcblxuICAvLyBHZXQgdGhlIHRpbWVzIGZvciBlYWNoIHJvdXRlXG4gIHJvdXRlcy5mb3JFYWNoKCAocm91dGUpID0+IHtcbiAgICB2YXIgcm91dGVPcHRpb25zID0gdHJpcHNcbiAgICAgIC5maWx0ZXIoKHRyaXApID0+IHRyaXAudHJpcF9pZCA9PSByb3V0ZS50cmlwX2lkIClcbiAgICAgIC5tYXAoKHRyaXApID0+IGA8b3B0aW9uIHZhbHVlPVwiJHt0cmlwLnRyaXBfaWR9XCI+JHt0cmlwLmFycml2YWxfdGltZX08L29wdGlvbj5gKTtcblxuICAgIG9wdGlvbnNbcm91dGUucm91dGVfaWRdICs9IHJvdXRlT3B0aW9ucy5qb2luKCk7XG4gIH0pO1xuXG4gIC8vIGNyZWF0ZSBodG1sIGZvciBlYWNoIHJvdXRlLCBhZGRpbmQgdGhlIHRpbWVzIGluIGEgc2VsZWN0IGVsZW1lbnRcbiAgcm91dGVzLmZvckVhY2goIChyb3V0ZSwgaW5kZXgpID0+IHtcbiAgICBcbiAgICBpZih1bmlxdWVSb3V0ZXMuaW5kZXhPZihyb3V0ZS5yb3V0ZV9pZCkgPT0gLTEpIHtcbiAgICAgIC8vIG5ldyByb3V0ZSEhXG4gICAgICB1bmlxdWVSb3V0ZXMucHVzaChyb3V0ZS5yb3V0ZV9pZCk7XG4gICAgICB2YXIgcm93ID0gYDxkaXYgY2xhc3M9XCJyb3cgdGFibGVcIj4gXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTMzIGNlbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgJHtyb3V0ZS5yb3V0ZV9pZH1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICR7cm91dGUuc2VydmljZV9pZH1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PiBcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICA8c2VsZWN0PiR7b3B0aW9uc1tyb3V0ZS5yb3V0ZV9pZF19PC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5gO1xuICBcbiAgICAgIHJlc3VsdHMuaW5uZXJIVE1MICs9IHJvdztcbiAgICB9XG5cbiAgfSk7XG5cbn1cblxuLypcbiAgU2hvd3MgYSBtZXNzYWdlIGluIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50LlxuKi9cbmZ1bmN0aW9uIHNob3dJbmZvTWVzc2FnZShtZXNzYWdlLCB0eXBlKSB7XG5cbiAgdmFyIG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZS1ib3gnKTtcbiAgbWVzc2FnZUJveC5pbm5lckhUTUwgPSBtZXNzYWdlO1xuXG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0JztcbiAgXG4gIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAnZXJyb3InOlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBlcnJvcic7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBpbmZvJztcbiAgICAgIGJyZWFrOyAgICBcbiAgfVxuXG59XG5cbi8qXG4gIE1ha2VzIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50IGRpc2FwcGVhciB0aHJvdWdoIGNzcyBjbGFzc1xuKi9cbmZ1bmN0aW9uIGNsZWFySW5mb01lc3NhZ2UoKSB7XG4gIHZhciBtZXNzYWdlQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lc3NhZ2UtYm94Jyk7XG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0Jztcbn1cblxuZnVuY3Rpb24gY2xlYXJSZXN1bHRzKCkge1xuXG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm91dGUtcmVzdWx0Jyk7XG4gIHZhciByZXN1bHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWV0YWJsZScpO1xuICByZXN1bHRzLmlubmVySFRNTCA9ICcnO1xuICBjb250YWluZXIuc3R5bGUub3BhY2l0eSA9IDA7XG5cbn1cblxuXG4vKlxuICBSZXF1ZXN0IHRoZSBzdG9wcyBmcm9tIHNlcnZlciBhbmQgYWRkIHRoZW0gdG8gYW4gYXJyYXlcbiAgdG8gYmUgYWJsZSB0byBjaGVjayB0aGF0IHRoZSB1c2VyIGlucHV0IGlzIHZhbGlkLlxuKi9cbmZ1bmN0aW9uIGxvYWRTdG9wcygpIHtcblxuICBTdG9wcy5nZXRBbGwoKS50aGVuKGFkZFN0b3BzKTtcblxufTtcblxuLypcbiAgR2V0IHRoZSBzdGF0aW9uIGNvZGUgZnJvbSBhIHN0cmluZ1xuKi9cbmZ1bmN0aW9uIGdldFN0YXRpb25Db2RlKHN0YXRpb24pIHtcblxuICB2YXIgcGFydHMgPSBzdGF0aW9uLnNwbGl0KCctJyk7XG4gIFxuICBpZihwYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgLy8gVGhpcyBjb3VsZCBiZSBhIHN0cmluZyBmcm9tIHRoZSBkYXRhbGlzdCwgZXh0cmFjdCB0aGUgY29kZVxuICAgIHJldHVybiBwYXJ0c1sxXS50cmltKCk7XG4gIH0gXG5cbiAgLy8gVGhpcyBjb3VsZCBiZSBhIGNvZGUgd3JpdHRlbiBieSB0aGUgdXNlclxuICByZXR1cm4gc3RhdGlvbjtcbiAgXG59XG5cbi8qXG4gIENoZWNrIHRoYXQgYSBjb2RlIGlzIGVpdGhlciBhIHBhaXIgc3RhdGlvbiBuYW1lIC0gc3RhdGlvbiBjb2RlIFxuICBmcm9tIHRoZSBmb3JtIGRhdGFsaXN0IG9yIGEgY29kZSBvZiBhIHN0b3Agd3JpdHRlbiBieSB0aGUgdXNlci5cbiovXG5mdW5jdGlvbiBjaGVja1N0YXRpb24oc3RhdGlvbikge1xuXG4gIHZhciBjb2RlID0gZ2V0U3RhdGlvbkNvZGUoc3RhdGlvbik7XG5cbiAgLy8gQ2hlY2sgdGhhdCB0aGUgY29kZSBpcyBpbiB0aGUgbGlzdCBvZiBzdG9wc1xuICByZXR1cm4gU3RvcHMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihzdG9wcyl7XG4gICAgcmV0dXJuIHN0b3BzLnNvbWUoZnVuY3Rpb24gY2hlY2soc3RvcCkge1xuICAgICAgcmV0dXJuIHN0b3Auc3RvcF9pZCA9PSBjb2RlO1xuICAgIH0pO1xuICB9KTtcblxufVxuXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdUcmlwcyhkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzKSB7XG5cbiAgLy8gZ2V0cyBhbGwgdHJpcHMgdGhhdCBnb2VzIHRvIHRoZSBkZXBhcnR1cmUgc3RvcCBhbmQgdGhlIGFycml2YWwgc3RvcFxuICB2YXIgdmFsaWRUcmlwcyA9IGRlcGFydHVyZVRpbWVzLmZpbHRlcihmdW5jdGlvbihkZXBhcnR1cmVUcmlwKXtcbiAgICByZXR1cm4gYXJyaXZhbFRpbWVzLnNvbWUoZnVuY3Rpb24oYXJyaXZhbFRyaXApe1xuICAgICAgcmV0dXJuIGFycml2YWxUcmlwLnRyaXBfaWQgPT0gZGVwYXJ0dXJlVHJpcC50cmlwX2lkO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gdmFsaWRUcmlwcztcbn1cblxuLypcbiAgRmluZHMgdHJpcHMgYmV0d2VlbiB0d28gc3RhdGlvbnMsIHJldHVybnMgdGhlIHRyaXBzIGlkc1xuKi9cbmZ1bmN0aW9uIGZpbmRUcmlwcyhkZXBhcnR1cmVJZCwgYXJyaXZhbElkKSB7XG5cbiAgcmV0dXJuIFByb21pc2UuYWxsKFtUcmlwcy5nZXRUcmlwU3RvcFRpbWVzKGRlcGFydHVyZUlkKSwgVHJpcHMuZ2V0VHJpcFN0b3BUaW1lcyhhcnJpdmFsSWQpXSkudGhlbihcbiAgICAgIGZ1bmN0aW9uKFtkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzXSkge1xuICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKCdGb3VuZCByb3V0ZXMhJywgZGVwYXJ0dXJlVGltZXMsIGFycml2YWxUaW1lcyk7XG4gICAgICAgIHZhciB0cmlwcyA9IGZpbmRNYXRjaGluZ1RyaXBzKGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpO1xuXG4gICAgICAgIHJldHVybiB7dHJpcHM6IHRyaXBzLCByb3V0ZXM6IFRyaXBzLmdldFJvdXRlc0ZvclRyaXBzKHRyaXBzKX07XG5cbiAgICAgIH0pO1xuXG59XG5cbi8qXG4gIFN1Ym1pdCB0aGUgdXNlciBzZWxlY3Rpb24gYW5kIHNob3cgdGhlIHJvdXRlIGlmIGF2YWlsYWJsZSBvciBhblxuICBlcnJvciBtZXNzYWdlIGlmIG5vIHJvdXRlIGlzIGF2YWlsYWJsZS5cbiovXG5mdW5jdGlvbiBzdWJtaXRTdGF0aW9ucyhldnQpIHtcblxuICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgY2xlYXJJbmZvTWVzc2FnZSgpO1xuICBjbGVhclJlc3VsdHMoKTtcbiAgXG4gIC8vIGdldCB0aGUgaW5wdXRzIHZhbHVlc1xuICB2YXIgZGVwYXJ0dXJlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGFydHVyZScpLnZhbHVlO1xuICB2YXIgYXJyaXZhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcnJpdmFsJykudmFsdWU7XG5cbiAgUHJvbWlzZS5hbGwoW2NoZWNrU3RhdGlvbihkZXBhcnR1cmUpLCBjaGVja1N0YXRpb24oYXJyaXZhbCldKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgXG4gICAgaWYoIXJlc3VsdFswXSB8fCAhcmVzdWx0WzFdKSB7XG4gICAgICBzaG93SW5mb01lc3NhZ2UoXG4gICAgICAgICdZb3UgaGF2ZSB0byBzZWxlY3QgYSB2YWxpZCBkZXBhcnR1cmUgYW5kIGFycml2YWwgc3RhdGlvbnMgZnJvbSB0aGUgbGlzdHMgb3Igd3JpdGUgYSB2YWxpZCBzdG9wIGNvZGUuJyxcbiAgICAgICAgJ2Vycm9yJ1xuICAgICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvLyBJZiB0aGUgZGVwYXJ0dXJlIGFuZCBhcnJpdmFsIHN0YXRpb25zIGFyZSBjb3JyZWN0XG4gICAgLy8gc2VhcmNoIGZvciBhIHRyaXAgYmV0d2VlbiB0aGVtIGFuZCBzaG93IHRoZSB0aW1lcyBhbmQgcm91dGVcbiAgICBmaW5kVHJpcHMoZ2V0U3RhdGlvbkNvZGUoZGVwYXJ0dXJlKSwgZ2V0U3RhdGlvbkNvZGUoYXJyaXZhbCkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgICBkYXRhLnJvdXRlcy50aGVuKGZ1bmN0aW9uKHJvdXRlcyl7XG4gICAgICAgICAgaWYocm91dGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNob3dUcmlwVGltZXMoZGF0YS50cmlwcywgcm91dGVzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdXZSBjb3VsZG5cXCd0IGZpbmQgYSB0cmlwIGJldHdlZW4gdGhlc2UgdHdvIHN0YXRpb25zJywgJ2Vycm9yJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgfSk7XG5cblxufVxuXG4vKlxuICBJbml0aWFsaXplIHRoZSBhcHBsaWNhdGlvbiBcbiovXG5leHBvcnQgZnVuY3Rpb24gaW5pdCgpIHtcblxuICAvLyBnZXQgdGhlIGludGVyYWN0aXZlIGVsZW1lbnRzIG9mIHRoZSBpbnRlcmZhY2VcbiAgZGVwYXJ0dXJlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBhcnR1cmUtc3RvcHMnKTtcbiAgYXJyaXZhbHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXJyaXZhbC1zdG9wcycpO1xuICBzdWJtaXRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VhcmNoJyk7XG5cbiAgLy8gUG9wdWxhdGUgZGF0YWxpc3RzIGFuZCBhZGQgbGlzdGVuZXJzXG4gIGxvYWRTdG9wcygpO1xuICBzdWJtaXRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdWJtaXRTdGF0aW9ucyk7XG5cbn07XG4iLCJjb25zdCBiYXNlVXJsICAgICAgID0gJy9kaXN0L2RhdGEvJztcbmNvbnN0IHJvdXRlc0ZpbGUgICAgPSAncm91dGVzLnR4dCc7XG5jb25zdCB0cmlwc0ZpbGUgICAgID0gJ3RyaXBzLnR4dCc7XG5jb25zdCBzdG9wc0ZpbGUgICAgID0gJ3N0b3BzLnR4dCc7XG5jb25zdCBzdG9wVGltZXNGaWxlID0gJ3N0b3BfdGltZXMudHh0JztcblxuY29uc3QgY3N2VG9BcnJheSA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgXG4gIHZhciByb3dzID0gdGV4dC50cmltKCkuc3BsaXQoJ1xcbicpO1xuICByZXR1cm4gcm93cy5tYXAoKHJvdykgPT4gcm93LnNwbGl0KCcsJykpO1xuXG59O1xuXG5jb25zdCBjc3ZUb09iamVjdHMgPSBmdW5jdGlvbih0ZXh0KSB7XG5cbiAgdmFyIHRhYmxlID0gY3N2VG9BcnJheSh0ZXh0KTtcbiAgdmFyIGtleXMgPSB0YWJsZVswXTtcbiAgdGFibGUgPSB0YWJsZS5zbGljZSgxKTtcblxuICByZXR1cm4gdGFibGUubWFwKGZ1bmN0aW9uKHJvdykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuICAgICAgb2JqW2tleV0gPSByb3dbaW5kZXhdO1xuICAgIH0pO1xuICAgIHJldHVybiAgb2JqO1xuICB9KTtcblxufVxuXG5mdW5jdGlvbiBnZXRDc3ZBc09iamVjdHModXJsKSB7XG5cbiAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKTtcblxuICAgIH0pLnRoZW4oZnVuY3Rpb24odGV4dENvbnRlbnQpIHtcblxuICAgICAgcmV0dXJuIGNzdlRvT2JqZWN0cyh0ZXh0Q29udGVudCk7XG5cbiAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgfSk7XG59XG5cbi8vIEFQSVxuXG4vKlxuICBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIGFycmF5IHdpdGggdGhlIG5hbWVzIG9mIHRoZSBcbiAgYXZhaWxhYmxlIGxpbmVzLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZXMoKSB7XG5cbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgcm91dGVzRmlsZSk7XG5cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmlwcygpIHtcbiAgLy8gZ2V0IHRoZSByb3V0ZS9saW5lIGFuZCByZXR1cm4gdGhlIHRpbWVzIGZvciB0aGlzIGxpbmVcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgdHJpcHNGaWxlKTtcblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BzKCkge1xuICAvLyByZXR1cm5zIHRoZSBzdG9wcyBvZiB0aGlzIGxpbmVcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc3RvcHNGaWxlKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wVGltZXMoKSB7XG4gIHJldHVybiBnZXRDc3ZBc09iamVjdHMoYmFzZVVybCArIHN0b3BUaW1lc0ZpbGUpOyBcbn07XG4iLCJpbXBvcnQgKiBhcyBBcHAgZnJvbSAnLi9hcHAuanMnO1xuXG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xuXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xuXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy4vc2VydmljZV93b3JrZXIuanMnLCB7c2NvcGU6ICcvJ30pLnRoZW4oZnVuY3Rpb24ocmVnKSB7XG4gICAgICBjb25zb2xlLmxvZygnUmVnaXN0cmF0aW9uIHdvcmtlZCEnLCByZWcpO1xuXG4gICAgICBpZiAoIW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmNvbnRyb2xsZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcblxuICAgICAgY29uc29sZS5sb2coJ1JlZ2lzdHJhdGlvbiBmYWlsZWQhJywgZXJyb3IpO1xuICAgIFxuICAgIH0pO1xuXG4gIH1cblxuICBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgLy8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB3aGVuIHRoZSBkb2N1bWVudCBpcyByZWFkeVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZihkb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnbG9hZGluZycpIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgfTtcblxuICByZWFkeSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgQXBwLmluaXQoKTtcbiAgICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTtcbiAgfSk7XG5cbn0pKCk7IiwiaW1wb3J0ICogYXMgSHR0cCBmcm9tICcuLi9odHRwLmpzJztcbmltcG9ydCBpZGIgZnJvbSAnLi9kYi5qcyc7XG5cbi8vIElmIGluZGV4ZWREQiBpcyBwb3B1bGF0ZWQsIGdldCB0aGUgZGF0YSBhbmQgdHJ5IHRvIHVwZGF0ZSBmcm9tIG5ldHdvcmtcbi8vIGVsc2UgdHJ5IHRvIGdldCB0aGUgZGF0YSBmcm9tIG5ldHdvcmsgYW5kIHNhdmUgaXRcbi8vIGVsc2Ugd2Ugc2hvdWxkIHNob3cgYSBjdXN0b20gZXJyb3IgbWVzc2FnZSB0byB0aGUgdXNlciwgdGhlIGFwcCBpcyBub3RhIGF2YWlsYWJsZS5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGwoKSB7XG5cbiAgcmV0dXJuIEh0dHAuc3RvcHMoKS50aGVuKGZ1bmN0aW9uIGdldFN0b3BzRnJvbU5ldHdvcmsocmVzdWx0cyl7XG5cbiAgICBpZighcmVzdWx0cykge1xuXG4gICAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBnZXRTdG9wc0Zyb21JREIoZGIpe1xuXG4gICAgICAgIGlmKCFkYikgdGhyb3cgJ1N0b3BzIGRhdGEgaXMgbm90IGF2YWlsYWJsZS4nO1xuXG4gICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wcycpO1xuICAgICAgICByZXR1cm4gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BzJykuZ2V0QWxsKCk7XG4gICAgICBcbiAgICAgIH0pO1xuICAgICAgXG4gICAgfVxuXG4gICAgLy8gSWYgSSBnZXQgcmVzdWx0cyBzdG9yZSB0aGUgcmVzdWx0IGluIGluZGV4ZWREQlxuICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIHN0b3JlU3RvcHNJbklEQihkYil7XG5cbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wcycsICdyZWFkd3JpdGUnKTtcbiAgICAgIHZhciBzdG9wc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BzJyk7XG5cbiAgICAgIHJlc3VsdHMuZm9yRWFjaCggZnVuY3Rpb24oc3RvcCkge1xuICAgICAgICBzdG9wc1N0b3JlLnB1dChzdG9wKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJhbnNhY3Rpb24uY29tcGxldGU7XG5cbiAgICB9KS50aGVuKGZ1bmN0aW9uIHRyYW5zYWN0aW9uQ29tcGxldGVkKCl7XG5cbiAgICAgIHJldHVybiByZXN1bHRzO1xuXG4gICAgfSk7XG5cbiAgfSk7XG5cbn1cblxuXG4iLCJpbXBvcnQgKiBhcyBIdHRwIGZyb20gJy4uL2h0dHAuanMnO1xuaW1wb3J0IGlkYiBmcm9tICcuL2RiLmpzJztcblxuICAvKlxuICAgIFRoaXMgZnVuY3Rpb24gY2hlY2tzIHRoYXQgdGhlIGRhdGEgaXMgaW4gSW5kZXhlZERCLCBpZiBub3QsIGl0IGdldHMgaXQgZnJvbSBuZXR3b3JrL2NhY2hlXG4gICAgYW5kIHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgZGF0YSBpcyBzdG9yZWQgaW4gSURCLlxuICAgIFRoaXMgd2F5IHdlIGRvbid0IG5lZWQgYW55IGluaXRpYWxpemF0aW9uIGZ1bmN0aW9uLCBqdXN0IGNhbGwgdGhpcyBmdW5jdGlvbiBpbiBlYWNoIHJldHJpZXZpbmdcbiAgICBtZXRob2QgYW5kIGl0IHdpbGwgZ2V0IHN1cmUgdGhhdCBldmVyeXRoaW5nIGlzIHNldCB1cCBiZWZvcmUgdHJ5aW5nIHRvIGdldCB0aGUgY29udGVudC5cbiAgKi9cbiAgZnVuY3Rpb24gc2V0VHJpcHMoKSB7XG5cbiAgICByZXR1cm4gaWRiKCkudGhlbihkYiA9PiB7XG5cbiAgICAgIGlmKCFkYikgdGhyb3cgJ1dlIGNvdWxkblxcJ3QgYWNjZXNzIEluZGV4ZWREQic7XG5cbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCd0cmlwcycpO1xuICAgICAgdmFyIHRyaXBzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgndHJpcHMnKTtcblxuICAgICAgcmV0dXJuIHRyaXBzU3RvcmUuY291bnQoKTtcblxuICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcblxuICAgICAgLy8gaWYgdGhlcmUgaXMgc29tZXRoaW5nIGluIHRoZSBkYiwgZG9uJ3QgYm90aGVyIGluIGdldHRpbmcgdGhlIGRhdGEgYWdhaW4gZnJvbSBuZXR3b3JrXG4gICAgICBpZihyZXN1bHQgPiAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgLy8gaWYgdGhlcmUgaXMgbm90aGluZyBpbiB0aGUgdHJpcHMgYW5kIHRpbWVzIHRhYmxlLCBmaWxsIHRoZW0hXG4gICAgICByZXR1cm4gSHR0cC5zdG9wVGltZXMoKVxuICAgICAgICAudGhlbihzdG9yZVN0b3BUaW1lcylcbiAgICAgICAgLnRoZW4oSHR0cC50cmlwcylcbiAgICAgICAgLnRoZW4oc3RvcmVUcmlwcyk7XG5cbiAgICB9KTtcblxuXG4gIH1cblxuXG4gIGZ1bmN0aW9uIHN0b3JlU3RvcFRpbWVzKHJlc3VsdHMpIHtcblxuICAgIGlmKHJlc3VsdHMpIHsgXG5cbiAgICAgICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gc3RvcmVUcmlwc0luSURCKGRiKXtcblxuICAgICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wX3RpbWVzJywgJ3JlYWR3cml0ZScpO1xuICAgICAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BfdGltZXMnKTtcblxuICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaCggZnVuY3Rpb24odHJpcCkge1xuICAgICAgICAgICAgdHJpcHNTdG9yZS5wdXQodHJpcCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gdHJhbnNhY3Rpb24uY29tcGxldGU7XG5cbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcblxuICAgICAgICAgIC8vIHRoZSB0cmFuc2FjdGlvbiBkaWRuJ3QgY29tcGxldGUsIHNvIHRoZSB0YWJsZSBzaG91bGQgYmUgZW1wdHlcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICB9XG5cbiAgZnVuY3Rpb24gc3RvcmVUcmlwcyhyZXN1bHRzKSB7XG5cbiAgICBpZihyZXN1bHRzKSB7IFxuXG4gICAgICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIHN0b3JlVHJpcHNJbklEQihkYil7XG5cbiAgICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbigndHJpcHMnLCAncmVhZHdyaXRlJyk7XG4gICAgICAgICAgdmFyIHRyaXBzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgndHJpcHMnKTtcblxuICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaCggZnVuY3Rpb24odHJpcCkge1xuICAgICAgICAgICAgdHJpcHNTdG9yZS5wdXQodHJpcCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gdHJhbnNhY3Rpb24uY29tcGxldGU7XG5cbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcblxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gIH1cblxuICAvLyBJZiBpbmRleGVkREIgaXMgcG9wdWxhdGVkLCBnZXQgdGhlIGRhdGEgYW5kIHRyeSB0byB1cGRhdGUgZnJvbSBuZXR3b3JrXG4gIC8vIGVsc2UgdHJ5IHRvIGdldCB0aGUgZGF0YSBmcm9tIG5ldHdvcmsgYW5kIHNhdmUgaXRcbiAgLy8gZWxzZSB3ZSBzaG91bGQgc2hvdyBhIGN1c3RvbSBlcnJvciBtZXNzYWdlIHRvIHRoZSB1c2VyLCB0aGUgYXBwIGlzIG5vdGEgYXZhaWxhYmxlLlxuXG4gIC8qXG4gICAgR2V0IHRoZSB0cmlwcyB0aGF0IHN0b3AgYXQgc3RvcF9pZCwgb25lIHBlciByb3V0ZSwgaW5kZXBlbmRlbnRseSBvZiBzdG9wIHRpbWVzXG4gICovXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXRSb3V0ZXNGb3JTdG9wKHN0b3BfaWQpIHtcblxuICAgIHJldHVybiB0aGlzLmdldFRyaXBzU3RvcFRpbWVzKHN0b3BfaWQpXG4gICAgICAudGhlbigpO1xuXG4gIH07XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldFJvdXRlc0ZvclRyaXBzKHRyaXBzKSB7XG5cbiAgICB2YXIgdHJpcF9pZHMgPSBbXTtcbiAgICB0cmlwcy5mb3JFYWNoKGZ1bmN0aW9uIGdldFVuaXF1ZVRyaXBJZHModHJpcCkge1xuICAgICAgaWYodHJpcF9pZHMuaW5kZXhPZih0cmlwLnRyaXBfaWQpID09IC0xKSB7XG4gICAgICAgIHRyaXBfaWRzLnB1c2godHJpcC50cmlwX2lkKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGdldCB0aGUgcm91dGVzIGZvciB0aGlzIHRyaXBzXG4gICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gZ2V0QWxsUm91dGVzKGRiKSB7XG4gICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbigndHJpcHMnKTtcbiAgICAgIHZhciB0cmlwU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgndHJpcHMnKTtcblxuICAgICAgdmFyIHJvdXRlcyA9IFtdO1xuICAgICAgdHJpcHMuZm9yRWFjaChmdW5jdGlvbiBhcHBlbmRUcmlwUHJvbWlzZSh0cmlwKSB7XG5cbiAgICAgICAgcm91dGVzLnB1c2godHJpcFN0b3JlLmdldCh0cmlwLnRyaXBfaWQpKTtcblxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChyb3V0ZXMpO1xuICAgICAgXG4gICAgfSk7XG5cbiAgfTtcblxuICAvKlxuICAgIEdldCBhbGwgdGhlIHRpbWVzIGZvciBhIHN0b3BcbiAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldFRyaXBTdG9wVGltZXMoc3RvcF9pZCkge1xuXG4gICAgcmV0dXJuIHNldFRyaXBzKClcbiAgICAgIC50aGVuKCgpID0+IGlkYigpKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gZ2V0VHJpcHNGb3JTdG9wKGRiKXtcblxuICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcF90aW1lcycpO1xuICAgICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJyk7XG4gICAgICAgIHZhciBzdG9wSW5kZXggPSB0cmlwc1N0b3JlLmluZGV4KCdzdG9wJyk7XG5cbiAgICAgICAgcmV0dXJuIHN0b3BJbmRleC5nZXRBbGwoc3RvcF9pZCk7XG4gICAgICB9KTtcblxuICB9O1xuXG4gIC8qXG4gICAgR2V0IGFsbCB0aGUgdHJpcHMgZm9yIGEgcm91dGVcbiAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldFRyaXBzRm9yUm91dGUocm91dGVfaWQpIHtcblxuICB9O1xuXG4gIC8qXG4gICAgR2V0IGFsbCB0aGUgc3RvcHMgZm9yIGEgcm91dGVcbiAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldFN0b3BzRm9yUm91dGUocm91dGVfaWQpIHtcblxuICB9O1xuIiwiaW1wb3J0IGlkYiBmcm9tICcuLi8uLi9ub2RlX21vZHVsZXMvaWRiL2xpYi9pZGIuanMnO1xuXG52YXIgX2RiO1xuXG4vLyBUaGlzIGNsYXNzIHdvcmtzIGFzIGEgT1JNIHRoYXQgZ2V0cyB0aGUgZGF0YSBmcm9tIGluZGV4ZWREQlxuZnVuY3Rpb24gb3BlbkRhdGFiYXNlKCkge1xuICBcbiAgcmV0dXJuIGlkYi5vcGVuKCd0cmFpbnMnLCAxLCBmdW5jdGlvbih1cGdyYWRlRGIpIHtcbiAgICBcbiAgICBzd2l0Y2godXBncmFkZURiLm9sZFZlcnNpb24pIHtcbiAgICBcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdzdG9wcycsIHtcbiAgICAgICAgICBrZXlQYXRoOiAnc3RvcF9pZCdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCd0cmlwcycsIHtrZXlQYXRoOiAndHJpcF9pZCd9KTtcblxuICAgICAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3N0b3BfdGltZXMnLCB7YXV0b0luY3JlbWVudDogdHJ1ZX0pO1xuXG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncm91dGVzJywge1xuICAgICAgICAgIGtleVBhdGg6ICdyb3V0ZV9pZCdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHRyaXBTdG9yZSA9IHVwZ3JhZGVEYi50cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcF90aW1lcycpO1xuICAgICAgICB0cmlwU3RvcmUuY3JlYXRlSW5kZXgoJ3N0b3AnLCAnc3RvcF9pZCcpO1xuICAgICAgICB0cmlwU3RvcmUuY3JlYXRlSW5kZXgoJ3RyaXAnLCAndHJpcF9pZCcpO1xuXG4gICAgfVxuICB9KTtcblxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkYigpIHtcbiAgXG4gIGlmKF9kYiA9PSBudWxsKSB7XG4gICAgX2RiID0gb3BlbkRhdGFiYXNlKCk7XG4gIH0gXG5cbiAgcmV0dXJuIF9kYjtcblxufTsiLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gdG9BcnJheShhcnIpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVxdWVzdC5yZXN1bHQpO1xuICAgICAgfTtcblxuICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciByZXF1ZXN0O1xuICAgIHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0ID0gb2JqW21ldGhvZF0uYXBwbHkob2JqLCBhcmdzKTtcbiAgICAgIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0pO1xuXG4gICAgcC5yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICByZXR1cm4gcDtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKTtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgcC5yZXF1ZXN0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UHJvcGVydGllcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm94eUNsYXNzLnByb3RvdHlwZSwgcHJvcCwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXS5hcHBseSh0aGlzW3RhcmdldFByb3BdLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoSW5kZXgsICdfaW5kZXgnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnbXVsdGlFbnRyeScsXG4gICAgJ3VuaXF1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ2dldCcsXG4gICAgJ2dldEtleScsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XG4gICAgdGhpcy5fY3Vyc29yID0gY3Vyc29yO1xuICAgIHRoaXMuX3JlcXVlc3QgPSByZXF1ZXN0O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEN1cnNvciwgJ19jdXJzb3InLCBbXG4gICAgJ2RpcmVjdGlvbicsXG4gICAgJ2tleScsXG4gICAgJ3ByaW1hcnlLZXknLFxuICAgICd2YWx1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXG4gICAgJ3VwZGF0ZScsXG4gICAgJ2RlbGV0ZSdcbiAgXSk7XG5cbiAgLy8gcHJveHkgJ25leHQnIG1ldGhvZHNcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIGlmICghKG1ldGhvZE5hbWUgaW4gSURCQ3Vyc29yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICBDdXJzb3IucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3QoY3Vyc29yLl9yZXF1ZXN0KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcbiAgfVxuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5jcmVhdGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuY3JlYXRlSW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5pbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdpbmRleE5hbWVzJyxcbiAgICAnYXV0b0luY3JlbWVudCdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ3B1dCcsXG4gICAgJ2FkZCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2NsZWFyJyxcbiAgICAnZ2V0JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ2RlbGV0ZUluZGV4J1xuICBdKTtcblxuICBmdW5jdGlvbiBUcmFuc2FjdGlvbihpZGJUcmFuc2FjdGlvbikge1xuICAgIHRoaXMuX3R4ID0gaWRiVHJhbnNhY3Rpb247XG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QoaWRiVHJhbnNhY3Rpb24uZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIFRyYW5zYWN0aW9uLnByb3RvdHlwZS5vYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fdHgub2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fdHgsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhUcmFuc2FjdGlvbiwgJ190eCcsIFtcbiAgICAnb2JqZWN0U3RvcmVOYW1lcycsXG4gICAgJ21vZGUnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhUcmFuc2FjdGlvbiwgJ190eCcsIElEQlRyYW5zYWN0aW9uLCBbXG4gICAgJ2Fib3J0J1xuICBdKTtcblxuICBmdW5jdGlvbiBVcGdyYWRlREIoZGIsIG9sZFZlcnNpb24sIHRyYW5zYWN0aW9uKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgICB0aGlzLm9sZFZlcnNpb24gPSBvbGRWZXJzaW9uO1xuICAgIHRoaXMudHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24pO1xuICB9XG5cbiAgVXBncmFkZURCLnByb3RvdHlwZS5jcmVhdGVPYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fZGIuY3JlYXRlT2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhVcGdyYWRlREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKFVwZ3JhZGVEQiwgJ19kYicsIElEQkRhdGFiYXNlLCBbXG4gICAgJ2RlbGV0ZU9iamVjdFN0b3JlJyxcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIERCKGRiKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgfVxuXG4gIERCLnByb3RvdHlwZS50cmFuc2FjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24odGhpcy5fZGIudHJhbnNhY3Rpb24uYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhEQiwgJ19kYicsIFtcbiAgICAnbmFtZScsXG4gICAgJ3ZlcnNpb24nLFxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdjbG9zZSdcbiAgXSk7XG5cbiAgLy8gQWRkIGN1cnNvciBpdGVyYXRvcnNcbiAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgb25jZSBicm93c2VycyBkbyB0aGUgcmlnaHQgdGhpbmcgd2l0aCBwcm9taXNlc1xuICBbJ29wZW5DdXJzb3InLCAnb3BlbktleUN1cnNvciddLmZvckVhY2goZnVuY3Rpb24oZnVuY05hbWUpIHtcbiAgICBbT2JqZWN0U3RvcmUsIEluZGV4XS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGVbZnVuY05hbWUucmVwbGFjZSgnb3BlbicsICdpdGVyYXRlJyldID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciByZXF1ZXN0ID0gKHRoaXMuX3N0b3JlIHx8IHRoaXMuX2luZGV4KVtmdW5jTmFtZV0uYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3Muc2xpY2UoMCwgLTEpKTtcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBwb2x5ZmlsbCBnZXRBbGxcbiAgW0luZGV4LCBPYmplY3RTdG9yZV0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgIGlmIChDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsKSByZXR1cm47XG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb3VudCkge1xuICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgIHZhciBpdGVtcyA9IFtdO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICBpbnN0YW5jZS5pdGVyYXRlQ3Vyc29yKHF1ZXJ5LCBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0ZW1zLnB1c2goY3Vyc29yLnZhbHVlKTtcblxuICAgICAgICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zLmxlbmd0aCA9PSBjb3VudCkge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIHZhciBleHAgPSB7XG4gICAgb3BlbjogZnVuY3Rpb24obmFtZSwgdmVyc2lvbiwgdXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ29wZW4nLCBbbmFtZSwgdmVyc2lvbl0pO1xuICAgICAgdmFyIHJlcXVlc3QgPSBwLnJlcXVlc3Q7XG5cbiAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgICAgIHVwZ3JhZGVDYWxsYmFjayhuZXcgVXBncmFkZURCKHJlcXVlc3QucmVzdWx0LCBldmVudC5vbGRWZXJzaW9uLCByZXF1ZXN0LnRyYW5zYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEQihkYik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ2RlbGV0ZURhdGFiYXNlJywgW25hbWVdKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBleHA7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2VsZi5pZGIgPSBleHA7XG4gIH1cbn0oKSk7Il19
