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

    navigator.serviceWorker.register('./dist/js/service_worker.js').then(function (reg) {
      console.log('Registration worked!', reg);
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

  dbPromise = _idb2.default.open('test-db', 4, function (upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        var keyValStore = upgradeDb.createObjectStore('keyval');
        keyValStore.put("world", "hello");
      case 1:
        upgradeDb.createObjectStore('people', { keyPath: 'name' });
      case 2:
        var peopleStore = upgradeDb.transaction.objectStore('people');
        peopleStore.createIndex('animal', 'favoriteAnimal');
      case 3:
        peopleStore = upgradeDb.transaction.objectStore('people');
        peopleStore.createIndex('age', 'age');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiLCJhcHAvb3JtL1RyaXBzLmpzIiwiYXBwL29ybS9kYi5qcyIsIm5vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O1FDbU9nQixJLEdBQUEsSTs7QUFuT2hCOztJQUFZLEs7O0FBQ1o7O0lBQVksSzs7QUFDWjs7SUFBWSxJOzs7O0FBRVo7QUFDQSxJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsRUFBOEIsTUFBOUIsRUFBc0M7O0FBRXBDLE1BQUksWUFBWSxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBaEI7QUFDQSxNQUFJLFVBQVUsU0FBUyxjQUFULENBQXdCLFdBQXhCLENBQWQ7QUFDQSxVQUFRLFNBQVIsR0FBb0IsRUFBcEI7QUFDQSxZQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsQ0FBMUI7O0FBRUEsTUFBSSxlQUFlLEVBQW5CO0FBQ0EsTUFBSSxVQUFVLEVBQWQ7O0FBRUE7QUFDQSxTQUFPLE9BQVAsQ0FBZ0IsVUFBQyxLQUFELEVBQVc7QUFDekIsUUFBSSxlQUFlLE1BQ2hCLE1BRGdCLENBQ1QsVUFBQyxJQUFEO0FBQUEsYUFBVSxLQUFLLE9B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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgKiBhcyBTdG9wcyBmcm9tICcuL29ybS9TdG9wcy5qcyc7XG5pbXBvcnQgKiBhcyBUcmlwcyBmcm9tICcuL29ybS9Ucmlwcy5qcyc7XG5pbXBvcnQgKiBhcyBIdHRwIGZyb20gJy4vaHR0cC5qcyc7XG5cbi8vIEludGVyYWN0aXZlIGVsZW1lbnRzIGluIHRoZSBwYWdlXG52YXIgZGVwYXJ0dXJlcywgYXJyaXZhbHMsIHN1Ym1pdEJ1dHRvbjtcblxuLyogXG4gIEFkZCB0aGUgb3B0aW9ucyB0byB0aGUgZGF0YWxpc3QgZWxlbWVudHMgaW4gdGhlIGZvcm0uXG4qL1xuZnVuY3Rpb24gYWRkU3RvcHMoc3RvcHMpIHtcblxuICBzdG9wcy5mb3JFYWNoKCAoc3RvcCkgPT4ge1xuICAgIFxuICAgIHZhciBvcHRpb24gPSBgPG9wdGlvbiB2YWx1ZT1cIiR7c3RvcC5zdG9wX25hbWV9IC0gJHtzdG9wLnN0b3BfaWR9XCI+PC9vcHRpb24+YDtcbiAgICBkZXBhcnR1cmVzLmlubmVySFRNTCArPSBvcHRpb247XG4gICAgYXJyaXZhbHMuaW5uZXJIVE1MICs9IG9wdGlvbjtcblxuICB9KTtcblxufVxuXG5mdW5jdGlvbiBzaG93VHJpcFRpbWVzKHRyaXBzLCByb3V0ZXMpIHtcblxuICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvdXRlLXJlc3VsdCcpO1xuICB2YXIgcmVzdWx0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aW1ldGFibGUnKTtcbiAgcmVzdWx0cy5pbm5lckhUTUwgPSAnJztcbiAgY29udGFpbmVyLnN0eWxlLm9wYWNpdHkgPSAxO1xuXG4gIHZhciB1bmlxdWVSb3V0ZXMgPSBbXTtcbiAgdmFyIG9wdGlvbnMgPSBbXTtcblxuICAvLyBHZXQgdGhlIHRpbWVzIGZvciBlYWNoIHJvdXRlXG4gIHJvdXRlcy5mb3JFYWNoKCAocm91dGUpID0+IHtcbiAgICB2YXIgcm91dGVPcHRpb25zID0gdHJpcHNcbiAgICAgIC5maWx0ZXIoKHRyaXApID0+IHRyaXAudHJpcF9pZCA9PSByb3V0ZS50cmlwX2lkIClcbiAgICAgIC5tYXAoKHRyaXApID0+IGA8b3B0aW9uIHZhbHVlPVwiJHt0cmlwLnRyaXBfaWR9XCI+JHt0cmlwLmFycml2YWxfdGltZX08L29wdGlvbj5gKTtcblxuICAgIG9wdGlvbnNbcm91dGUucm91dGVfaWRdICs9IHJvdXRlT3B0aW9ucy5qb2luKCk7XG4gIH0pO1xuXG4gIC8vIGNyZWF0ZSBodG1sIGZvciBlYWNoIHJvdXRlLCBhZGRpbmQgdGhlIHRpbWVzIGluIGEgc2VsZWN0IGVsZW1lbnRcbiAgcm91dGVzLmZvckVhY2goIChyb3V0ZSwgaW5kZXgpID0+IHtcbiAgICBcbiAgICBpZih1bmlxdWVSb3V0ZXMuaW5kZXhPZihyb3V0ZS5yb3V0ZV9pZCkgPT0gLTEpIHtcbiAgICAgIC8vIG5ldyByb3V0ZSEhXG4gICAgICB1bmlxdWVSb3V0ZXMucHVzaChyb3V0ZS5yb3V0ZV9pZCk7XG4gICAgICB2YXIgcm93ID0gYDxkaXYgY2xhc3M9XCJyb3cgdGFibGVcIj4gXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTMzIGNlbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgJHtyb3V0ZS5yb3V0ZV9pZH1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICR7cm91dGUuc2VydmljZV9pZH1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PiBcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICA8c2VsZWN0PiR7b3B0aW9uc1tyb3V0ZS5yb3V0ZV9pZF19PC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5gO1xuICBcbiAgICAgIHJlc3VsdHMuaW5uZXJIVE1MICs9IHJvdztcbiAgICB9XG5cbiAgfSk7XG5cbn1cblxuLypcbiAgU2hvd3MgYSBtZXNzYWdlIGluIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50LlxuKi9cbmZ1bmN0aW9uIHNob3dJbmZvTWVzc2FnZShtZXNzYWdlLCB0eXBlKSB7XG5cbiAgdmFyIG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZS1ib3gnKTtcbiAgbWVzc2FnZUJveC5pbm5lckhUTUwgPSBtZXNzYWdlO1xuXG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0JztcbiAgXG4gIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAnZXJyb3InOlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBlcnJvcic7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBpbmZvJztcbiAgICAgIGJyZWFrOyAgICBcbiAgfVxuXG59XG5cbi8qXG4gIE1ha2VzIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50IGRpc2FwcGVhciB0aHJvdWdoIGNzcyBjbGFzc1xuKi9cbmZ1bmN0aW9uIGNsZWFySW5mb01lc3NhZ2UoKSB7XG4gIHZhciBtZXNzYWdlQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lc3NhZ2UtYm94Jyk7XG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0Jztcbn1cblxuZnVuY3Rpb24gY2xlYXJSZXN1bHRzKCkge1xuXG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm91dGUtcmVzdWx0Jyk7XG4gIHZhciByZXN1bHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWV0YWJsZScpO1xuICByZXN1bHRzLmlubmVySFRNTCA9ICcnO1xuICBjb250YWluZXIuc3R5bGUub3BhY2l0eSA9IDA7XG5cbn1cblxuXG4vKlxuICBSZXF1ZXN0IHRoZSBzdG9wcyBmcm9tIHNlcnZlciBhbmQgYWRkIHRoZW0gdG8gYW4gYXJyYXlcbiAgdG8gYmUgYWJsZSB0byBjaGVjayB0aGF0IHRoZSB1c2VyIGlucHV0IGlzIHZhbGlkLlxuKi9cbmZ1bmN0aW9uIGxvYWRTdG9wcygpIHtcblxuICBTdG9wcy5nZXRBbGwoKS50aGVuKGFkZFN0b3BzKTtcblxufTtcblxuLypcbiAgR2V0IHRoZSBzdGF0aW9uIGNvZGUgZnJvbSBhIHN0cmluZ1xuKi9cbmZ1bmN0aW9uIGdldFN0YXRpb25Db2RlKHN0YXRpb24pIHtcblxuICB2YXIgcGFydHMgPSBzdGF0aW9uLnNwbGl0KCctJyk7XG4gIFxuICBpZihwYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgLy8gVGhpcyBjb3VsZCBiZSBhIHN0cmluZyBmcm9tIHRoZSBkYXRhbGlzdCwgZXh0cmFjdCB0aGUgY29kZVxuICAgIHJldHVybiBwYXJ0c1sxXS50cmltKCk7XG4gIH0gXG5cbiAgLy8gVGhpcyBjb3VsZCBiZSBhIGNvZGUgd3JpdHRlbiBieSB0aGUgdXNlclxuICByZXR1cm4gc3RhdGlvbjtcbiAgXG59XG5cbi8qXG4gIENoZWNrIHRoYXQgYSBjb2RlIGlzIGVpdGhlciBhIHBhaXIgc3RhdGlvbiBuYW1lIC0gc3RhdGlvbiBjb2RlIFxuICBmcm9tIHRoZSBmb3JtIGRhdGFsaXN0IG9yIGEgY29kZSBvZiBhIHN0b3Agd3JpdHRlbiBieSB0aGUgdXNlci5cbiovXG5mdW5jdGlvbiBjaGVja1N0YXRpb24oc3RhdGlvbikge1xuXG4gIHZhciBjb2RlID0gZ2V0U3RhdGlvbkNvZGUoc3RhdGlvbik7XG5cbiAgLy8gQ2hlY2sgdGhhdCB0aGUgY29kZSBpcyBpbiB0aGUgbGlzdCBvZiBzdG9wc1xuICByZXR1cm4gU3RvcHMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihzdG9wcyl7XG4gICAgcmV0dXJuIHN0b3BzLnNvbWUoZnVuY3Rpb24gY2hlY2soc3RvcCkge1xuICAgICAgcmV0dXJuIHN0b3Auc3RvcF9pZCA9PSBjb2RlO1xuICAgIH0pO1xuICB9KTtcblxufVxuXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdUcmlwcyhkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzKSB7XG5cbiAgLy8gZ2V0cyBhbGwgdHJpcHMgdGhhdCBnb2VzIHRvIHRoZSBkZXBhcnR1cmUgc3RvcCBhbmQgdGhlIGFycml2YWwgc3RvcFxuICB2YXIgdmFsaWRUcmlwcyA9IGRlcGFydHVyZVRpbWVzLmZpbHRlcihmdW5jdGlvbihkZXBhcnR1cmVUcmlwKXtcbiAgICByZXR1cm4gYXJyaXZhbFRpbWVzLnNvbWUoZnVuY3Rpb24oYXJyaXZhbFRyaXApe1xuICAgICAgcmV0dXJuIGFycml2YWxUcmlwLnRyaXBfaWQgPT0gZGVwYXJ0dXJlVHJpcC50cmlwX2lkO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gdmFsaWRUcmlwcztcbn1cblxuLypcbiAgRmluZHMgdHJpcHMgYmV0d2VlbiB0d28gc3RhdGlvbnMsIHJldHVybnMgdGhlIHRyaXBzIGlkc1xuKi9cbmZ1bmN0aW9uIGZpbmRUcmlwcyhkZXBhcnR1cmVJZCwgYXJyaXZhbElkKSB7XG5cbiAgcmV0dXJuIFByb21pc2UuYWxsKFtUcmlwcy5nZXRUcmlwU3RvcFRpbWVzKGRlcGFydHVyZUlkKSwgVHJpcHMuZ2V0VHJpcFN0b3BUaW1lcyhhcnJpdmFsSWQpXSkudGhlbihcbiAgICAgIGZ1bmN0aW9uKFtkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzXSkge1xuICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKCdGb3VuZCByb3V0ZXMhJywgZGVwYXJ0dXJlVGltZXMsIGFycml2YWxUaW1lcyk7XG4gICAgICAgIHZhciB0cmlwcyA9IGZpbmRNYXRjaGluZ1RyaXBzKGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpO1xuXG4gICAgICAgIHJldHVybiB7dHJpcHM6IHRyaXBzLCByb3V0ZXM6IFRyaXBzLmdldFJvdXRlc0ZvclRyaXBzKHRyaXBzKX07XG5cbiAgICAgIH0pO1xuXG59XG5cbi8qXG4gIFN1Ym1pdCB0aGUgdXNlciBzZWxlY3Rpb24gYW5kIHNob3cgdGhlIHJvdXRlIGlmIGF2YWlsYWJsZSBvciBhblxuICBlcnJvciBtZXNzYWdlIGlmIG5vIHJvdXRlIGlzIGF2YWlsYWJsZS5cbiovXG5mdW5jdGlvbiBzdWJtaXRTdGF0aW9ucyhldnQpIHtcblxuICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgY2xlYXJJbmZvTWVzc2FnZSgpO1xuICBjbGVhclJlc3VsdHMoKTtcbiAgXG4gIC8vIGdldCB0aGUgaW5wdXRzIHZhbHVlc1xuICB2YXIgZGVwYXJ0dXJlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGFydHVyZScpLnZhbHVlO1xuICB2YXIgYXJyaXZhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcnJpdmFsJykudmFsdWU7XG5cbiAgUHJvbWlzZS5hbGwoW2NoZWNrU3RhdGlvbihkZXBhcnR1cmUpLCBjaGVja1N0YXRpb24oYXJyaXZhbCldKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgXG4gICAgaWYoIXJlc3VsdFswXSB8fCAhcmVzdWx0WzFdKSB7XG4gICAgICBzaG93SW5mb01lc3NhZ2UoXG4gICAgICAgICdZb3UgaGF2ZSB0byBzZWxlY3QgYSB2YWxpZCBkZXBhcnR1cmUgYW5kIGFycml2YWwgc3RhdGlvbnMgZnJvbSB0aGUgbGlzdHMgb3Igd3JpdGUgYSB2YWxpZCBzdG9wIGNvZGUuJyxcbiAgICAgICAgJ2Vycm9yJ1xuICAgICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvLyBJZiB0aGUgZGVwYXJ0dXJlIGFuZCBhcnJpdmFsIHN0YXRpb25zIGFyZSBjb3JyZWN0XG4gICAgLy8gc2VhcmNoIGZvciBhIHRyaXAgYmV0d2VlbiB0aGVtIGFuZCBzaG93IHRoZSB0aW1lcyBhbmQgcm91dGVcbiAgICBmaW5kVHJpcHMoZ2V0U3RhdGlvbkNvZGUoZGVwYXJ0dXJlKSwgZ2V0U3RhdGlvbkNvZGUoYXJyaXZhbCkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgICBkYXRhLnJvdXRlcy50aGVuKGZ1bmN0aW9uKHJvdXRlcyl7XG4gICAgICAgICAgaWYocm91dGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNob3dUcmlwVGltZXMoZGF0YS50cmlwcywgcm91dGVzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdXZSBjb3VsZG5cXCd0IGZpbmQgYSB0cmlwIGJldHdlZW4gdGhlc2UgdHdvIHN0YXRpb25zJywgJ2Vycm9yJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgfSk7XG5cblxufVxuXG4vKlxuICBJbml0aWFsaXplIHRoZSBhcHBsaWNhdGlvbiBcbiovXG5leHBvcnQgZnVuY3Rpb24gaW5pdCgpIHtcblxuICAvLyBnZXQgdGhlIGludGVyYWN0aXZlIGVsZW1lbnRzIG9mIHRoZSBpbnRlcmZhY2VcbiAgZGVwYXJ0dXJlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBhcnR1cmUtc3RvcHMnKTtcbiAgYXJyaXZhbHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXJyaXZhbC1zdG9wcycpO1xuICBzdWJtaXRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VhcmNoJyk7XG5cbiAgLy8gUG9wdWxhdGUgZGF0YWxpc3RzIGFuZCBhZGQgbGlzdGVuZXJzXG4gIGxvYWRTdG9wcygpO1xuICBzdWJtaXRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdWJtaXRTdGF0aW9ucyk7XG5cbn07XG4iLCJjb25zdCBiYXNlVXJsICAgICAgID0gJy9kaXN0L2RhdGEvJztcbmNvbnN0IHJvdXRlc0ZpbGUgICAgPSAncm91dGVzLnR4dCc7XG5jb25zdCB0cmlwc0ZpbGUgICAgID0gJ3RyaXBzLnR4dCc7XG5jb25zdCBzdG9wc0ZpbGUgICAgID0gJ3N0b3BzLnR4dCc7XG5jb25zdCBzdG9wVGltZXNGaWxlID0gJ3N0b3BfdGltZXMudHh0JztcblxuY29uc3QgY3N2VG9BcnJheSA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgXG4gIHZhciByb3dzID0gdGV4dC50cmltKCkuc3BsaXQoJ1xcbicpO1xuICByZXR1cm4gcm93cy5tYXAoKHJvdykgPT4gcm93LnNwbGl0KCcsJykpO1xuXG59O1xuXG5jb25zdCBjc3ZUb09iamVjdHMgPSBmdW5jdGlvbih0ZXh0KSB7XG5cbiAgdmFyIHRhYmxlID0gY3N2VG9BcnJheSh0ZXh0KTtcbiAgdmFyIGtleXMgPSB0YWJsZVswXTtcbiAgdGFibGUgPSB0YWJsZS5zbGljZSgxKTtcblxuICByZXR1cm4gdGFibGUubWFwKGZ1bmN0aW9uKHJvdykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuICAgICAgb2JqW2tleV0gPSByb3dbaW5kZXhdO1xuICAgIH0pO1xuICAgIHJldHVybiAgb2JqO1xuICB9KTtcblxufVxuXG5mdW5jdGlvbiBnZXRDc3ZBc09iamVjdHModXJsKSB7XG5cbiAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKTtcblxuICAgIH0pLnRoZW4oZnVuY3Rpb24odGV4dENvbnRlbnQpIHtcblxuICAgICAgcmV0dXJuIGNzdlRvT2JqZWN0cyh0ZXh0Q29udGVudCk7XG5cbiAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgfSk7XG59XG5cbi8vIEFQSVxuXG4vKlxuICBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIGFycmF5IHdpdGggdGhlIG5hbWVzIG9mIHRoZSBcbiAgYXZhaWxhYmxlIGxpbmVzLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZXMoKSB7XG5cbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgcm91dGVzRmlsZSk7XG5cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmlwcygpIHtcbiAgLy8gZ2V0IHRoZSByb3V0ZS9saW5lIGFuZCByZXR1cm4gdGhlIHRpbWVzIGZvciB0aGlzIGxpbmVcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgdHJpcHNGaWxlKTtcblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BzKCkge1xuICAvLyByZXR1cm5zIHRoZSBzdG9wcyBvZiB0aGlzIGxpbmVcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc3RvcHNGaWxlKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wVGltZXMoKSB7XG4gIHJldHVybiBnZXRDc3ZBc09iamVjdHMoYmFzZVVybCArIHN0b3BUaW1lc0ZpbGUpOyBcbn07XG4iLCJpbXBvcnQgKiBhcyBBcHAgZnJvbSAnLi9hcHAuanMnO1xuXG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xuXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xuXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy4vZGlzdC9qcy9zZXJ2aWNlX3dvcmtlci5qcycpLnRoZW4oZnVuY3Rpb24ocmVnKSB7XG4gICAgICBjb25zb2xlLmxvZygnUmVnaXN0cmF0aW9uIHdvcmtlZCEnLCByZWcpO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZygnUmVnaXN0cmF0aW9uIGZhaWxlZCEnLCBlcnJvcik7XG4gICAgfSk7XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWR5KCkge1xuICAgICAgXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAvLyByZXNvbHZlIHRoZSBwcm9taXNlIHdoZW4gdGhlIGRvY3VtZW50IGlzIHJlYWR5XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdyZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKGRvY3VtZW50LnJlYWR5U3RhdGUgIT09ICdsb2FkaW5nJykge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9KTtcblxuICB9O1xuXG4gIHJlYWR5KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICBBcHAuaW5pdCgpO1xuICAgIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpO1xuICB9KTtcblxufSkoKTsiLCJpbXBvcnQgKiBhcyBIdHRwIGZyb20gJy4uL2h0dHAuanMnO1xuaW1wb3J0IGlkYiBmcm9tICcuL2RiLmpzJztcblxuLy8gSWYgaW5kZXhlZERCIGlzIHBvcHVsYXRlZCwgZ2V0IHRoZSBkYXRhIGFuZCB0cnkgdG8gdXBkYXRlIGZyb20gbmV0d29ya1xuLy8gZWxzZSB0cnkgdG8gZ2V0IHRoZSBkYXRhIGZyb20gbmV0d29yayBhbmQgc2F2ZSBpdFxuLy8gZWxzZSB3ZSBzaG91bGQgc2hvdyBhIGN1c3RvbSBlcnJvciBtZXNzYWdlIHRvIHRoZSB1c2VyLCB0aGUgYXBwIGlzIG5vdGEgYXZhaWxhYmxlLlxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbCgpIHtcblxuICByZXR1cm4gSHR0cC5zdG9wcygpLnRoZW4oZnVuY3Rpb24gZ2V0U3RvcHNGcm9tTmV0d29yayhyZXN1bHRzKXtcblxuICAgIGlmKCFyZXN1bHRzKSB7XG5cbiAgICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIGdldFN0b3BzRnJvbUlEQihkYil7XG5cbiAgICAgICAgaWYoIWRiKSB0aHJvdyAnU3RvcHMgZGF0YSBpcyBub3QgYXZhaWxhYmxlLic7XG5cbiAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3N0b3BzJyk7XG4gICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcHMnKS5nZXRBbGwoKTtcbiAgICAgIFxuICAgICAgfSk7XG4gICAgICBcbiAgICB9XG5cbiAgICAvLyBJZiBJIGdldCByZXN1bHRzIHN0b3JlIHRoZSByZXN1bHQgaW4gaW5kZXhlZERCXG4gICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gc3RvcmVTdG9wc0luSURCKGRiKXtcblxuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3N0b3BzJywgJ3JlYWR3cml0ZScpO1xuICAgICAgdmFyIHN0b3BzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcHMnKTtcblxuICAgICAgcmVzdWx0cy5mb3JFYWNoKCBmdW5jdGlvbihzdG9wKSB7XG4gICAgICAgIHN0b3BzU3RvcmUucHV0KHN0b3ApO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21wbGV0ZTtcblxuICAgIH0pLnRoZW4oZnVuY3Rpb24gdHJhbnNhY3Rpb25Db21wbGV0ZWQoKXtcblxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG5cbiAgICB9KTtcblxuICB9KTtcblxufVxuXG5cbiIsImltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi4vaHR0cC5qcyc7XG5pbXBvcnQgaWRiIGZyb20gJy4vZGIuanMnO1xuXG4gIC8qXG4gICAgVGhpcyBmdW5jdGlvbiBjaGVja3MgdGhhdCB0aGUgZGF0YSBpcyBpbiBJbmRleGVkREIsIGlmIG5vdCwgaXQgZ2V0cyBpdCBmcm9tIG5ldHdvcmsvY2FjaGVcbiAgICBhbmQgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBkYXRhIGlzIHN0b3JlZCBpbiBJREIuXG4gICAgVGhpcyB3YXkgd2UgZG9uJ3QgbmVlZCBhbnkgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb24sIGp1c3QgY2FsbCB0aGlzIGZ1bmN0aW9uIGluIGVhY2ggcmV0cmlldmluZ1xuICAgIG1ldGhvZCBhbmQgaXQgd2lsbCBnZXQgc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgc2V0IHVwIGJlZm9yZSB0cnlpbmcgdG8gZ2V0IHRoZSBjb250ZW50LlxuICAqL1xuICBmdW5jdGlvbiBzZXRUcmlwcygpIHtcblxuICAgIHJldHVybiBpZGIoKS50aGVuKGRiID0+IHtcblxuICAgICAgaWYoIWRiKSB0aHJvdyAnV2UgY291bGRuXFwndCBhY2Nlc3MgSW5kZXhlZERCJztcblxuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJyk7XG4gICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICByZXR1cm4gdHJpcHNTdG9yZS5jb3VudCgpO1xuXG4gICAgfSkudGhlbihyZXN1bHQgPT4ge1xuXG4gICAgICAvLyBpZiB0aGVyZSBpcyBzb21ldGhpbmcgaW4gdGhlIGRiLCBkb24ndCBib3RoZXIgaW4gZ2V0dGluZyB0aGUgZGF0YSBhZ2FpbiBmcm9tIG5ldHdvcmtcbiAgICAgIGlmKHJlc3VsdCA+IDApIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGVyZSBpcyBub3RoaW5nIGluIHRoZSB0cmlwcyBhbmQgdGltZXMgdGFibGUsIGZpbGwgdGhlbSFcbiAgICAgIHJldHVybiBIdHRwLnN0b3BUaW1lcygpXG4gICAgICAgIC50aGVuKHN0b3JlU3RvcFRpbWVzKVxuICAgICAgICAudGhlbihIdHRwLnRyaXBzKVxuICAgICAgICAudGhlbihzdG9yZVRyaXBzKTtcblxuICAgIH0pO1xuXG5cbiAgfVxuXG5cbiAgZnVuY3Rpb24gc3RvcmVTdG9wVGltZXMocmVzdWx0cykge1xuXG4gICAgaWYocmVzdWx0cykgeyBcblxuICAgICAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBzdG9yZVRyaXBzSW5JREIoZGIpe1xuXG4gICAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3N0b3BfdGltZXMnLCAncmVhZHdyaXRlJyk7XG4gICAgICAgICAgdmFyIHRyaXBzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcF90aW1lcycpO1xuXG4gICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKCBmdW5jdGlvbih0cmlwKSB7XG4gICAgICAgICAgICB0cmlwc1N0b3JlLnB1dCh0cmlwKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21wbGV0ZTtcblxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuXG4gICAgICAgICAgLy8gdGhlIHRyYW5zYWN0aW9uIGRpZG4ndCBjb21wbGV0ZSwgc28gdGhlIHRhYmxlIHNob3VsZCBiZSBlbXB0eVxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gIH1cblxuICBmdW5jdGlvbiBzdG9yZVRyaXBzKHJlc3VsdHMpIHtcblxuICAgIGlmKHJlc3VsdHMpIHsgXG5cbiAgICAgICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gc3RvcmVUcmlwc0luSURCKGRiKXtcblxuICAgICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCd0cmlwcycsICdyZWFkd3JpdGUnKTtcbiAgICAgICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKCBmdW5jdGlvbih0cmlwKSB7XG4gICAgICAgICAgICB0cmlwc1N0b3JlLnB1dCh0cmlwKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21wbGV0ZTtcblxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuXG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgfVxuXG4gIC8vIElmIGluZGV4ZWREQiBpcyBwb3B1bGF0ZWQsIGdldCB0aGUgZGF0YSBhbmQgdHJ5IHRvIHVwZGF0ZSBmcm9tIG5ldHdvcmtcbiAgLy8gZWxzZSB0cnkgdG8gZ2V0IHRoZSBkYXRhIGZyb20gbmV0d29yayBhbmQgc2F2ZSBpdFxuICAvLyBlbHNlIHdlIHNob3VsZCBzaG93IGEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgdG8gdGhlIHVzZXIsIHRoZSBhcHAgaXMgbm90YSBhdmFpbGFibGUuXG5cbiAgLypcbiAgICBHZXQgdGhlIHRyaXBzIHRoYXQgc3RvcCBhdCBzdG9wX2lkLCBvbmUgcGVyIHJvdXRlLCBpbmRlcGVuZGVudGx5IG9mIHN0b3AgdGltZXNcbiAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldFJvdXRlc0ZvclN0b3Aoc3RvcF9pZCkge1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJpcHNTdG9wVGltZXMoc3RvcF9pZClcbiAgICAgIC50aGVuKCk7XG5cbiAgfTtcblxuICBleHBvcnQgZnVuY3Rpb24gZ2V0Um91dGVzRm9yVHJpcHModHJpcHMpIHtcblxuICAgIHZhciB0cmlwX2lkcyA9IFtdO1xuICAgIHRyaXBzLmZvckVhY2goZnVuY3Rpb24gZ2V0VW5pcXVlVHJpcElkcyh0cmlwKSB7XG4gICAgICBpZih0cmlwX2lkcy5pbmRleE9mKHRyaXAudHJpcF9pZCkgPT0gLTEpIHtcbiAgICAgICAgdHJpcF9pZHMucHVzaCh0cmlwLnRyaXBfaWQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gZ2V0IHRoZSByb3V0ZXMgZm9yIHRoaXMgdHJpcHNcbiAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBnZXRBbGxSb3V0ZXMoZGIpIHtcbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCd0cmlwcycpO1xuICAgICAgdmFyIHRyaXBTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICB2YXIgcm91dGVzID0gW107XG4gICAgICB0cmlwcy5mb3JFYWNoKGZ1bmN0aW9uIGFwcGVuZFRyaXBQcm9taXNlKHRyaXApIHtcblxuICAgICAgICByb3V0ZXMucHVzaCh0cmlwU3RvcmUuZ2V0KHRyaXAudHJpcF9pZCkpO1xuXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJvdXRlcyk7XG4gICAgICBcbiAgICB9KTtcblxuICB9O1xuXG4gIC8qXG4gICAgR2V0IGFsbCB0aGUgdGltZXMgZm9yIGEgc3RvcFxuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0VHJpcFN0b3BUaW1lcyhzdG9wX2lkKSB7XG5cbiAgICByZXR1cm4gc2V0VHJpcHMoKVxuICAgICAgLnRoZW4oKCkgPT4gaWRiKCkpXG4gICAgICAudGhlbihmdW5jdGlvbiBnZXRUcmlwc0ZvclN0b3AoZGIpe1xuXG4gICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wX3RpbWVzJyk7XG4gICAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BfdGltZXMnKTtcbiAgICAgICAgdmFyIHN0b3BJbmRleCA9IHRyaXBzU3RvcmUuaW5kZXgoJ3N0b3AnKTtcblxuICAgICAgICByZXR1cm4gc3RvcEluZGV4LmdldEFsbChzdG9wX2lkKTtcbiAgICAgIH0pO1xuXG4gIH07XG5cbiAgLypcbiAgICBHZXQgYWxsIHRoZSB0cmlwcyBmb3IgYSByb3V0ZVxuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0VHJpcHNGb3JSb3V0ZShyb3V0ZV9pZCkge1xuXG4gIH07XG5cbiAgLypcbiAgICBHZXQgYWxsIHRoZSBzdG9wcyBmb3IgYSByb3V0ZVxuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0U3RvcHNGb3JSb3V0ZShyb3V0ZV9pZCkge1xuXG4gIH07XG4iLCJpbXBvcnQgaWRiIGZyb20gJy4uLy4uL25vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyc7XG5cbnZhciBfZGI7XG5cbi8vIFRoaXMgY2xhc3Mgd29ya3MgYXMgYSBPUk0gdGhhdCBnZXRzIHRoZSBkYXRhIGZyb20gaW5kZXhlZERCXG5mdW5jdGlvbiBvcGVuRGF0YWJhc2UoKSB7XG4gIFxuICByZXR1cm4gaWRiLm9wZW4oJ3RyYWlucycsIDEsIGZ1bmN0aW9uKHVwZ3JhZGVEYikge1xuICAgIFxuICAgIHN3aXRjaCh1cGdyYWRlRGIub2xkVmVyc2lvbikge1xuICAgIFxuICAgICAgY2FzZSAwOlxuICAgICAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3N0b3BzJywge1xuICAgICAgICAgIGtleVBhdGg6ICdzdG9wX2lkJ1xuICAgICAgICB9KTtcblxuICAgICAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3RyaXBzJywge2tleVBhdGg6ICd0cmlwX2lkJ30pO1xuXG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgnc3RvcF90aW1lcycsIHthdXRvSW5jcmVtZW50OiB0cnVlfSk7XG5cbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdyb3V0ZXMnLCB7XG4gICAgICAgICAga2V5UGF0aDogJ3JvdXRlX2lkJ1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdHJpcFN0b3JlID0gdXBncmFkZURiLnRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJyk7XG4gICAgICAgIHRyaXBTdG9yZS5jcmVhdGVJbmRleCgnc3RvcCcsICdzdG9wX2lkJyk7XG4gICAgICAgIHRyaXBTdG9yZS5jcmVhdGVJbmRleCgndHJpcCcsICd0cmlwX2lkJyk7XG5cbiAgICB9XG4gIH0pO1xuXG4gIGRiUHJvbWlzZSA9IGlkYi5vcGVuKCd0ZXN0LWRiJywgNCwgZnVuY3Rpb24odXBncmFkZURiKSB7XG4gIHN3aXRjaCh1cGdyYWRlRGIub2xkVmVyc2lvbikge1xuICAgIGNhc2UgMDpcbiAgICAgIHZhciBrZXlWYWxTdG9yZSA9IHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgna2V5dmFsJyk7XG4gICAgICBrZXlWYWxTdG9yZS5wdXQoXCJ3b3JsZFwiLCBcImhlbGxvXCIpO1xuICAgIGNhc2UgMTpcbiAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncGVvcGxlJywgeyBrZXlQYXRoOiAnbmFtZScgfSk7XG4gICAgY2FzZSAyOlxuICAgICAgdmFyIHBlb3BsZVN0b3JlID0gdXBncmFkZURiLnRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdwZW9wbGUnKTtcbiAgICAgIHBlb3BsZVN0b3JlLmNyZWF0ZUluZGV4KCdhbmltYWwnLCAnZmF2b3JpdGVBbmltYWwnKTtcbiAgICBjYXNlIDM6XG4gICAgICBwZW9wbGVTdG9yZSA9IHVwZ3JhZGVEYi50cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgncGVvcGxlJyk7XG4gICAgICBwZW9wbGVTdG9yZS5jcmVhdGVJbmRleCgnYWdlJywgJ2FnZScpO1xuICB9XG59KTtcblxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkYigpIHtcbiAgXG4gIGlmKF9kYiA9PSBudWxsKSB7XG4gICAgX2RiID0gb3BlbkRhdGFiYXNlKCk7XG4gIH0gXG5cbiAgcmV0dXJuIF9kYjtcblxufTsiLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gdG9BcnJheShhcnIpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVxdWVzdC5yZXN1bHQpO1xuICAgICAgfTtcblxuICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciByZXF1ZXN0O1xuICAgIHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0ID0gb2JqW21ldGhvZF0uYXBwbHkob2JqLCBhcmdzKTtcbiAgICAgIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0pO1xuXG4gICAgcC5yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICByZXR1cm4gcDtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKTtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgcC5yZXF1ZXN0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UHJvcGVydGllcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm94eUNsYXNzLnByb3RvdHlwZSwgcHJvcCwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXS5hcHBseSh0aGlzW3RhcmdldFByb3BdLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoSW5kZXgsICdfaW5kZXgnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnbXVsdGlFbnRyeScsXG4gICAgJ3VuaXF1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ2dldCcsXG4gICAgJ2dldEtleScsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XG4gICAgdGhpcy5fY3Vyc29yID0gY3Vyc29yO1xuICAgIHRoaXMuX3JlcXVlc3QgPSByZXF1ZXN0O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEN1cnNvciwgJ19jdXJzb3InLCBbXG4gICAgJ2RpcmVjdGlvbicsXG4gICAgJ2tleScsXG4gICAgJ3ByaW1hcnlLZXknLFxuICAgICd2YWx1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXG4gICAgJ3VwZGF0ZScsXG4gICAgJ2RlbGV0ZSdcbiAgXSk7XG5cbiAgLy8gcHJveHkgJ25leHQnIG1ldGhvZHNcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIGlmICghKG1ldGhvZE5hbWUgaW4gSURCQ3Vyc29yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICBDdXJzb3IucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3QoY3Vyc29yLl9yZXF1ZXN0KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcbiAgfVxuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5jcmVhdGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuY3JlYXRlSW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5pbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdpbmRleE5hbWVzJyxcbiAgICAnYXV0b0luY3JlbWVudCdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ3B1dCcsXG4gICAgJ2FkZCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2NsZWFyJyxcbiAgICAnZ2V0JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ2RlbGV0ZUluZGV4J1xuICBdKTtcblxuICBmdW5jdGlvbiBUcmFuc2FjdGlvbihpZGJUcmFuc2FjdGlvbikge1xuICAgIHRoaXMuX3R4ID0gaWRiVHJhbnNhY3Rpb247XG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QoaWRiVHJhbnNhY3Rpb24uZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIFRyYW5zYWN0aW9uLnByb3RvdHlwZS5vYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fdHgub2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fdHgsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhUcmFuc2FjdGlvbiwgJ190eCcsIFtcbiAgICAnb2JqZWN0U3RvcmVOYW1lcycsXG4gICAgJ21vZGUnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhUcmFuc2FjdGlvbiwgJ190eCcsIElEQlRyYW5zYWN0aW9uLCBbXG4gICAgJ2Fib3J0J1xuICBdKTtcblxuICBmdW5jdGlvbiBVcGdyYWRlREIoZGIsIG9sZFZlcnNpb24sIHRyYW5zYWN0aW9uKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgICB0aGlzLm9sZFZlcnNpb24gPSBvbGRWZXJzaW9uO1xuICAgIHRoaXMudHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24pO1xuICB9XG5cbiAgVXBncmFkZURCLnByb3RvdHlwZS5jcmVhdGVPYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fZGIuY3JlYXRlT2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhVcGdyYWRlREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKFVwZ3JhZGVEQiwgJ19kYicsIElEQkRhdGFiYXNlLCBbXG4gICAgJ2RlbGV0ZU9iamVjdFN0b3JlJyxcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIERCKGRiKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgfVxuXG4gIERCLnByb3RvdHlwZS50cmFuc2FjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24odGhpcy5fZGIudHJhbnNhY3Rpb24uYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhEQiwgJ19kYicsIFtcbiAgICAnbmFtZScsXG4gICAgJ3ZlcnNpb24nLFxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdjbG9zZSdcbiAgXSk7XG5cbiAgLy8gQWRkIGN1cnNvciBpdGVyYXRvcnNcbiAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgb25jZSBicm93c2VycyBkbyB0aGUgcmlnaHQgdGhpbmcgd2l0aCBwcm9taXNlc1xuICBbJ29wZW5DdXJzb3InLCAnb3BlbktleUN1cnNvciddLmZvckVhY2goZnVuY3Rpb24oZnVuY05hbWUpIHtcbiAgICBbT2JqZWN0U3RvcmUsIEluZGV4XS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGVbZnVuY05hbWUucmVwbGFjZSgnb3BlbicsICdpdGVyYXRlJyldID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciByZXF1ZXN0ID0gKHRoaXMuX3N0b3JlIHx8IHRoaXMuX2luZGV4KVtmdW5jTmFtZV0uYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3Muc2xpY2UoMCwgLTEpKTtcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBwb2x5ZmlsbCBnZXRBbGxcbiAgW0luZGV4LCBPYmplY3RTdG9yZV0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgIGlmIChDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsKSByZXR1cm47XG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb3VudCkge1xuICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgIHZhciBpdGVtcyA9IFtdO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICBpbnN0YW5jZS5pdGVyYXRlQ3Vyc29yKHF1ZXJ5LCBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0ZW1zLnB1c2goY3Vyc29yLnZhbHVlKTtcblxuICAgICAgICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zLmxlbmd0aCA9PSBjb3VudCkge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIHZhciBleHAgPSB7XG4gICAgb3BlbjogZnVuY3Rpb24obmFtZSwgdmVyc2lvbiwgdXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ29wZW4nLCBbbmFtZSwgdmVyc2lvbl0pO1xuICAgICAgdmFyIHJlcXVlc3QgPSBwLnJlcXVlc3Q7XG5cbiAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgICAgIHVwZ3JhZGVDYWxsYmFjayhuZXcgVXBncmFkZURCKHJlcXVlc3QucmVzdWx0LCBldmVudC5vbGRWZXJzaW9uLCByZXF1ZXN0LnRyYW5zYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEQihkYik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ2RlbGV0ZURhdGFiYXNlJywgW25hbWVdKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBleHA7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2VsZi5pZGIgPSBleHA7XG4gIH1cbn0oKSk7Il19
