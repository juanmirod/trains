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

function showTripTimes(trips) {

  var results = document.getElementById('timetable');
  results.innerHTML = '';

  trips.forEach(function (trip, index) {

    var row = '<div> ' + trip.arrival_time + ' - ' + trip.trip_id + ' </div>';
    results.innerHTML += row;
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
    return findMatchingTrips(departureTimes, arrivalTimes);
  });
}

/*
  Submit the user selection and show the route if available or an
  error message if no route is available.
*/
function submitStations(evt) {

  evt.preventDefault();
  clearInfoMessage();

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
    findTrips(getStationCode(departure), getStationCode(arrival)).then(function (trips) {
      if (trips.length > 0) {
        showTripTimes(trips);
      } else {
        showInfoMessage('We couldn\'t find a trip between these two stations', 'error');
      }
    });
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
  /*function registerServiceWorker() {
  
      if (!navigator.serviceWorker) return;
  
      var indexController = this;
  
      navigator.serviceWorker.register('/sw.js').then(function(reg) {
        if (!navigator.serviceWorker.controller) {
          return;
        }
  
        if (reg.waiting) {
          indexController._updateReady(reg.waiting);
          return;
        }
  
        if (reg.installing) {
          indexController._trackInstalling(reg.installing);
          return;
        }
  
        reg.addEventListener('updatefound', function() {
          indexController._trackInstalling(reg.installing);
        });
      });
  
      // Ensure refresh is only called once.
      // This works around a bug in "force update on reload".
      var refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });
    };*/

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

    // if there is nothing in the trips table, fill it!
    return Http.stopTimes().then(function getStopTimesFromNetwork(results) {

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
    });
  });
}

// If indexedDB is populated, get the data and try to update from network
// else try to get the data from network and save it
// else we should show a custom error message to the user, the app is nota available.

/*
  Get the trips that stop at stop_id, one per route, independently of stop times
*/
function getRoutesForStop(stop_id) {

  return this.getTripsStopTimes(stop_id).then(function getRoutesForTrips(trips) {

    var routes = [];
    trips.forEach(function getUniqueRoutes(trip) {
      if (routes.indexOf(trip.route_id) == -1) {
        routes.push(trip.route_id);
      }
    });

    return routes;
  });
};

/*
  Get all the times for a stop
*/
function getTripStopTimes(stop_id) {

  return setTrips().then(function () {
    return (0, _db2.default)();
  }).then(function getTripsForStop(db) {

    var transaction = db.transaction('trips');
    var tripsStore = transaction.objectStore('trips');
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

        upgradeDb.createObjectStore('trips', { autoIncrement: true });

        upgradeDb.createObjectStore('routes', {
          keyPath: 'route_id'
        });

        var tripStore = upgradeDb.transaction.objectStore('trips');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiLCJhcHAvb3JtL1RyaXBzLmpzIiwiYXBwL29ybS9kYi5qcyIsIm5vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O1FDa0xnQixJLEdBQUEsSTs7QUFsTGhCOztJQUFZLEs7O0FBQ1o7O0lBQVksSzs7QUFDWjs7SUFBWSxJOzs7O0FBRVo7QUFDQSxJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsRUFBOEI7O0FBRTVCLE1BQUksVUFBVSxTQUFTLGNBQVQsQ0FBd0IsV0FBeEIsQ0FBZDtBQUNBLFVBQVEsU0FBUixHQUFvQixFQUFwQjs7QUFFQSxRQUFNLE9BQU4sQ0FBZSxVQUFDLElBQUQsRUFBTyxLQUFQLEVBQWlCOztBQUU5QixRQUFJLGlCQUFlLEtBQUssWUFBcEIsV0FBc0MsS0FBSyxPQUEzQyxZQUFKO0FBQ0EsWUFBUSxTQUFSLElBQXFCLEdBQXJCO0FBRUQsR0FMRDtBQU9EOztBQUVEOzs7QUFHQSxTQUFTLGVBQVQsQ0FBeUIsT0FBekIsRUFBa0MsSUFBbEMsRUFBd0M7O0FBRXRDLE1BQUksYUFBYSxTQUFTLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBakI7QUFDQSxhQUFXLFNBQVgsR0FBdUIsT0FBdkI7O0FBRUEsYUFBVyxTQUFYLEdBQXVCLE9BQXZCOztBQUVBLFVBQU8sSUFBUDtBQUNFLFNBQUssT0FBTDtBQUNFLGlCQUFXLFNBQVgsSUFBd0IsUUFBeEI7QUFDQTtBQUNGO0FBQ0UsaUJBQVcsU0FBWCxJQUF3QixPQUF4QjtBQUNBO0FBTko7QUFTRDs7QUFFRDs7O0FBR0EsU0FBUyxnQkFBVCxHQUE0QjtBQUMxQixNQUFJLGFBQWEsU0FBUyxjQUFULENBQXdCLGFBQXhCLENBQWpCO0FBQ0EsYUFBVyxTQUFYLEdBQXVCLE9BQXZCO0FBQ0Q7O0FBR0Q7Ozs7QUFJQSxTQUFTLFNBQVQsR0FBcUI7O0FBRW5CLFFBQU0sTUFBTixHQUFlLElBQWYsQ0FBb0IsUUFBcEI7QUFFRDs7QUFFRDs7O0FBR0EsU0FBUyxjQUFULENBQXdCLE9BQXhCLEVBQWlDOztBQUUvQixNQUFJLFFBQVEsUUFBUSxLQUFSLENBQWMsR0FBZCxDQUFaOztBQUVBLE1BQUcsTUFBTSxNQUFOLEdBQWUsQ0FBbEIsRUFBcUI7QUFDbkI7QUFDQSxXQUFPLE1BQU0sQ0FBTixFQUFTLElBQVQsRUFBUDtBQUNEOztBQUVEO0FBQ0EsU0FBTyxPQUFQO0FBRUQ7O0FBRUQ7Ozs7QUFJQSxTQUFTLFlBQVQsQ0FBc0IsT0FBdEIsRUFBK0I7O0FBRTdCLE1BQUksT0FBTyxlQUFlLE9BQWYsQ0FBWDs7QUFFQTtBQUNBLFNBQU8sTUFBTSxNQUFOLEdBQWUsSUFBZixDQUFvQixVQUFTLEtBQVQsRUFBZTtBQUN4QyxXQUFPLE1BQU0sSUFBTixDQUFXLFNBQVMsS0FBVCxDQUFlLElBQWYsRUFBcUI7QUFDckMsYUFBTyxLQUFLLE9BQUwsSUFBZ0IsSUFBdkI7QUFDRCxLQUZNLENBQVA7QUFHRCxHQUpNLENBQVA7QUFNRDs7QUFFRCxTQUFTLGlCQUFULENBQTJCLGNBQTNCLEVBQTJDLFlBQTNDLEVBQXlEOztBQUV2RDtBQUNBLE1BQUksYUFBYSxlQUFlLE1BQWYsQ0FBc0IsVUFBUyxhQUFULEVBQXVCO0FBQzVELFdBQU8sYUFBYSxJQUFiLENBQWtCLFVBQVMsV0FBVCxFQUFxQjtBQUM1QyxhQUFPLFlBQVksT0FBWixJQUF1QixjQUFjLE9BQTVDO0FBQ0QsS0FGTSxDQUFQO0FBR0QsR0FKZ0IsQ0FBakI7O0FBTUEsU0FBTyxVQUFQO0FBQ0Q7O0FBRUQ7OztBQUdBLFNBQVMsU0FBVCxDQUFtQixXQUFuQixFQUFnQyxTQUFoQyxFQUEyQzs7QUFFekMsU0FBTyxRQUFRLEdBQVIsQ0FBWSxDQUFDLE1BQU0sZ0JBQU4sQ0FBdUIsV0FBdkIsQ0FBRCxFQUFzQyxNQUFNLGdCQUFOLENBQXVCLFNBQXZCLENBQXRDLENBQVosRUFDSixJQURJLENBQ0MsZ0JBQXlDO0FBQUE7O0FBQUEsUUFBL0IsY0FBK0I7QUFBQSxRQUFmLFlBQWU7OztBQUU3QyxZQUFRLEdBQVIsQ0FBWSxlQUFaLEVBQTZCLGNBQTdCLEVBQTZDLFlBQTdDO0FBQ0EsV0FBTyxrQkFBa0IsY0FBbEIsRUFBa0MsWUFBbEMsQ0FBUDtBQUVELEdBTkksQ0FBUDtBQVFEOztBQUVEOzs7O0FBSUEsU0FBUyxjQUFULENBQXdCLEdBQXhCLEVBQTZCOztBQUUzQixNQUFJLGNBQUo7QUFDQTs7QUFFQTtBQUNBLE1BQUksWUFBWSxTQUFTLGNBQVQsQ0FBd0IsV0FBeEIsRUFBcUMsS0FBckQ7QUFDQSxNQUFJLFVBQVUsU0FBUyxjQUFULENBQXdCLFNBQXhCLEVBQW1DLEtBQWpEOztBQUVBLFVBQVEsR0FBUixDQUFZLENBQUMsYUFBYSxTQUFiLENBQUQsRUFBMEIsYUFBYSxPQUFiLENBQTFCLENBQVosRUFBOEQsSUFBOUQsQ0FBbUUsVUFBUyxNQUFULEVBQWdCOztBQUVqRixRQUFHLENBQUMsT0FBTyxDQUFQLENBQUQsSUFBYyxDQUFDLE9BQU8sQ0FBUCxDQUFsQixFQUE2QjtBQUMzQixzQkFDRSxzR0FERixFQUVFLE9BRkY7QUFJQSxhQUFPLEtBQVA7QUFDRDs7QUFFRDtBQUNBO0FBQ0EsY0FBVSxlQUFlLFNBQWYsQ0FBVixFQUFxQyxlQUFlLE9BQWYsQ0FBckMsRUFBOEQsSUFBOUQsQ0FBbUUsVUFBUyxLQUFULEVBQWU7QUFDaEYsVUFBRyxNQUFNLE1BQU4sR0FBZSxDQUFsQixFQUFxQjtBQUNuQixzQkFBYyxLQUFkO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsd0JBQWdCLHFEQUFoQixFQUF1RSxPQUF2RTtBQUNEO0FBRUYsS0FQRDtBQVFELEdBcEJEO0FBdUJEOztBQUVEOzs7QUFHTyxTQUFTLElBQVQsR0FBZ0I7O0FBRXJCO0FBQ0EsZUFBYSxTQUFTLGNBQVQsQ0FBd0IsaUJBQXhCLENBQWI7QUFDQSxhQUFXLFNBQVMsY0FBVCxDQUF3QixlQUF4QixDQUFYO0FBQ0EsaUJBQWUsU0FBUyxjQUFULENBQXdCLFFBQXhCLENBQWY7O0FBRUE7QUFDQTtBQUNBLGVBQWEsZ0JBQWIsQ0FBOEIsT0FBOUIsRUFBdUMsY0FBdkM7QUFFRDs7Ozs7Ozs7UUN2SWUsTSxHQUFBLE07UUFNQSxLLEdBQUEsSztRQU1BLEssR0FBQSxLO1FBS0EsUyxHQUFBLFM7QUF2RWhCLElBQU0sVUFBZ0IsYUFBdEI7QUFDQSxJQUFNLGFBQWdCLFlBQXRCO0FBQ0EsSUFBTSxZQUFnQixXQUF0QjtBQUNBLElBQU0sWUFBZ0IsV0FBdEI7QUFDQSxJQUFNLGdCQUFnQixnQkFBdEI7O0FBRUEsSUFBTSxhQUFhLFNBQWIsVUFBYSxDQUFTLElBQVQsRUFBZTs7QUFFaEMsTUFBSSxPQUFPLEtBQUssSUFBTCxHQUFZLEtBQVosQ0FBa0IsSUFBbEIsQ0FBWDtBQUNBLFNBQU8sS0FBSyxHQUFMLENBQVMsVUFBQyxHQUFEO0FBQUEsV0FBUyxJQUFJLEtBQUosQ0FBVSxHQUFWLENBQVQ7QUFBQSxHQUFULENBQVA7QUFFRCxDQUxEOztBQU9BLElBQU0sZUFBZSxTQUFmLFlBQWUsQ0FBUyxJQUFULEVBQWU7O0FBRWxDLE1BQUksUUFBUSxXQUFXLElBQVgsQ0FBWjtBQUNBLE1BQUksT0FBTyxNQUFNLENBQU4sQ0FBWDtBQUNBLFVBQVEsTUFBTSxLQUFOLENBQVksQ0FBWixDQUFSOztBQUVBLFNBQU8sTUFBTSxHQUFOLENBQVUsVUFBUyxHQUFULEVBQWM7QUFDN0IsUUFBSSxNQUFNLEVBQVY7QUFDQSxTQUFLLE9BQUwsQ0FBYSxVQUFTLEdBQVQsRUFBYyxLQUFkLEVBQXFCO0FBQ2hDLFVBQUksR0FBSixJQUFXLElBQUksS0FBSixDQUFYO0FBQ0QsS0FGRDtBQUdBLFdBQVEsR0FBUjtBQUNELEdBTk0sQ0FBUDtBQVFELENBZEQ7O0FBZ0JBLFNBQVMsZUFBVCxDQUF5QixHQUF6QixFQUE4Qjs7QUFFNUIsU0FBTyxNQUFNLEdBQU4sRUFBVztBQUNkLFlBQVE7QUFETSxHQUFYLEVBRUYsSUFGRSxDQUVHLFVBQVMsUUFBVCxFQUFrQjs7QUFFeEIsV0FBTyxTQUFTLElBQVQsRUFBUDtBQUVELEdBTkksRUFNRixJQU5FLENBTUcsVUFBUyxXQUFULEVBQXNCOztBQUU1QixXQUFPLGFBQWEsV0FBYixDQUFQO0FBRUQsR0FWSSxFQVVGLEtBVkUsQ0FVSSxVQUFTLEtBQVQsRUFBZTs7QUFFdEIsWUFBUSxLQUFSLENBQWMsS0FBZDtBQUVELEdBZEksQ0FBUDtBQWVEOztBQUVEOztBQUVBOzs7O0FBSU8sU0FBUyxNQUFULEdBQWtCOztBQUV2QixTQUFPLGdCQUFnQixVQUFVLFVBQTFCLENBQVA7QUFFRDs7QUFFTSxTQUFTLEtBQVQsR0FBaUI7QUFDdEI7QUFDQSxTQUFPLGdCQUFnQixVQUFVLFNBQTFCLENBQVA7QUFFRDs7QUFFTSxTQUFTLEtBQVQsR0FBaUI7QUFDdEI7QUFDQSxTQUFPLGdCQUFnQixVQUFVLFNBQTFCLENBQVA7QUFDRDs7QUFFTSxTQUFTLFNBQVQsR0FBcUI7QUFDMUIsU0FBTyxnQkFBZ0IsVUFBVSxhQUExQixDQUFQO0FBQ0Q7Ozs7O0FDekVEOztJQUFZLEc7Ozs7QUFFWixDQUFDLFlBQVc7QUFDWjtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQ0UsV0FBUyxxQkFBVCxHQUFpQzs7QUFFL0IsUUFBSSxDQUFDLFVBQVUsYUFBZixFQUE4Qjs7QUFFOUIsY0FBVSxhQUFWLENBQXdCLFFBQXhCLENBQWlDLDZCQUFqQyxFQUFnRSxJQUFoRSxDQUFxRSxVQUFTLEdBQVQsRUFBYztBQUNqRixjQUFRLEdBQVIsQ0FBWSxzQkFBWixFQUFvQyxHQUFwQztBQUNELEtBRkQsRUFFRyxLQUZILENBRVMsVUFBUyxLQUFULEVBQWdCO0FBQ3ZCLGNBQVEsR0FBUixDQUFZLHNCQUFaLEVBQW9DLEtBQXBDO0FBQ0QsS0FKRDtBQU1EOztBQUVELFdBQVMsS0FBVCxHQUFpQjs7QUFFZixXQUFPLElBQUksT0FBSixDQUFZLFVBQVMsT0FBVCxFQUFrQixNQUFsQixFQUEwQjs7QUFFM0M7QUFDQSxlQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxZQUFXO0FBQ3ZELFlBQUcsU0FBUyxVQUFULEtBQXdCLFNBQTNCLEVBQXNDO0FBQ3BDO0FBQ0Q7QUFDRixPQUpEO0FBTUQsS0FUTSxDQUFQO0FBV0Q7O0FBRUQsVUFBUSxJQUFSLENBQWEsWUFBVztBQUN0QixRQUFJLElBQUo7QUFDQTtBQUNELEdBSEQ7QUFLRCxDQXRFRDs7Ozs7Ozs7UUNJZ0IsTSxHQUFBLE07O0FBTmhCOztJQUFZLEk7O0FBQ1o7Ozs7Ozs7O0FBRUE7QUFDQTtBQUNBO0FBQ08sU0FBUyxNQUFULEdBQWtCOztBQUV2QixTQUFPLEtBQUssS0FBTCxHQUFhLElBQWIsQ0FBa0IsU0FBUyxtQkFBVCxDQUE2QixPQUE3QixFQUFxQzs7QUFFNUQsUUFBRyxDQUFDLE9BQUosRUFBYTs7QUFFWCxhQUFPLG9CQUFNLElBQU4sQ0FBVyxTQUFTLGVBQVQsQ0FBeUIsRUFBekIsRUFBNEI7O0FBRTVDLFlBQUcsQ0FBQyxFQUFKLEVBQVEsTUFBTSw4QkFBTjs7QUFFUixZQUFJLGNBQWMsR0FBRyxXQUFILENBQWUsT0FBZixDQUFsQjtBQUNBLGVBQU8sWUFBWSxXQUFaLENBQXdCLE9BQXhCLEVBQWlDLE1BQWpDLEVBQVA7QUFFRCxPQVBNLENBQVA7QUFTRDs7QUFFRDtBQUNBLFdBQU8sb0JBQU0sSUFBTixDQUFXLFNBQVMsZUFBVCxDQUF5QixFQUF6QixFQUE0Qjs7QUFFNUMsVUFBSSxjQUFjLEdBQUcsV0FBSCxDQUFlLE9BQWYsRUFBd0IsV0FBeEIsQ0FBbEI7QUFDQSxVQUFJLGFBQWEsWUFBWSxXQUFaLENBQXdCLE9BQXhCLENBQWpCOztBQUVBLGNBQVEsT0FBUixDQUFpQixVQUFTLElBQVQsRUFBZTtBQUM5QixtQkFBVyxHQUFYLENBQWUsSUFBZjtBQUNELE9BRkQ7O0FBSUEsYUFBTyxZQUFZLFFBQW5CO0FBRUQsS0FYTSxFQVdKLElBWEksQ0FXQyxTQUFTLG9CQUFULEdBQStCOztBQUVyQyxhQUFPLE9BQVA7QUFFRCxLQWZNLENBQVA7QUFpQkQsR0FqQ00sQ0FBUDtBQW1DRDs7Ozs7Ozs7UUN3QmlCLGdCLEdBQUEsZ0I7UUFxQkEsZ0IsR0FBQSxnQjtRQWtCQSxnQixHQUFBLGdCO1FBT0EsZ0IsR0FBQSxnQjs7QUFqSGxCOztJQUFZLEk7O0FBQ1o7Ozs7Ozs7O0FBRUU7Ozs7OztBQU1BLFNBQVMsUUFBVCxHQUFvQjs7QUFFbEIsU0FBTyxvQkFBTSxJQUFOLENBQVcsY0FBTTs7QUFFdEIsUUFBRyxDQUFDLEVBQUosRUFBUSxNQUFNLCtCQUFOOztBQUVSLFFBQUksY0FBYyxHQUFHLFdBQUgsQ0FBZSxPQUFmLENBQWxCO0FBQ0EsUUFBSSxhQUFhLFlBQVksV0FBWixDQUF3QixPQUF4QixDQUFqQjs7QUFFQSxXQUFPLFdBQVcsS0FBWCxFQUFQO0FBRUQsR0FUTSxFQVNKLElBVEksQ0FTQyxrQkFBVTs7QUFFaEI7QUFDQSxRQUFHLFNBQVMsQ0FBWixFQUFlO0FBQ2IsY0FBUSxHQUFSLENBQVksTUFBWjtBQUNBLGFBQU8sUUFBUSxPQUFSLEVBQVA7QUFDRDs7QUFFRDtBQUNBLFdBQU8sS0FBSyxTQUFMLEdBQWlCLElBQWpCLENBQXNCLFNBQVMsdUJBQVQsQ0FBaUMsT0FBakMsRUFBMEM7O0FBRXJFLFVBQUcsT0FBSCxFQUFZOztBQUVSLGVBQU8sb0JBQU0sSUFBTixDQUFXLFNBQVMsZUFBVCxDQUF5QixFQUF6QixFQUE0Qjs7QUFFNUMsY0FBSSxjQUFjLEdBQUcsV0FBSCxDQUFlLE9BQWYsRUFBd0IsV0FBeEIsQ0FBbEI7QUFDQSxjQUFJLGFBQWEsWUFBWSxXQUFaLENBQXdCLE9BQXhCLENBQWpCOztBQUVBLGtCQUFRLE9BQVIsQ0FBaUIsVUFBUyxJQUFULEVBQWU7QUFDOUIsdUJBQVcsR0FBWCxDQUFlLElBQWY7QUFDRCxXQUZEOztBQUlBLGlCQUFPLFlBQVksUUFBbkI7QUFFRCxTQVhNLEVBV0osS0FYSSxDQVdFLFVBQVMsS0FBVCxFQUFnQjs7QUFFdkIsa0JBQVEsS0FBUixDQUFjLEtBQWQ7QUFFRCxTQWZNLENBQVA7QUFpQkg7QUFFRixLQXZCTSxDQUFQO0FBeUJELEdBM0NNLENBQVA7QUE4Q0Q7O0FBR0Q7QUFDQTtBQUNBOztBQUVBOzs7QUFHTyxTQUFTLGdCQUFULENBQTBCLE9BQTFCLEVBQW1DOztBQUV4QyxTQUFPLEtBQUssaUJBQUwsQ0FBdUIsT0FBdkIsRUFDSixJQURJLENBQ0MsU0FBUyxpQkFBVCxDQUEyQixLQUEzQixFQUFrQzs7QUFFdEMsUUFBSSxTQUFTLEVBQWI7QUFDQSxVQUFNLE9BQU4sQ0FBYyxTQUFTLGVBQVQsQ0FBeUIsSUFBekIsRUFBK0I7QUFDM0MsVUFBRyxPQUFPLE9BQVAsQ0FBZSxLQUFLLFFBQXBCLEtBQWlDLENBQUMsQ0FBckMsRUFBd0M7QUFDdEMsZUFBTyxJQUFQLENBQVksS0FBSyxRQUFqQjtBQUNEO0FBQ0YsS0FKRDs7QUFNQSxXQUFPLE1BQVA7QUFFRCxHQVpJLENBQVA7QUFjRDs7QUFFRDs7O0FBR08sU0FBUyxnQkFBVCxDQUEwQixPQUExQixFQUFtQzs7QUFFeEMsU0FBTyxXQUNKLElBREksQ0FDQztBQUFBLFdBQU0sbUJBQU47QUFBQSxHQURELEVBRUosSUFGSSxDQUVDLFNBQVMsZUFBVCxDQUF5QixFQUF6QixFQUE0Qjs7QUFFaEMsUUFBSSxjQUFjLEdBQUcsV0FBSCxDQUFlLE9BQWYsQ0FBbEI7QUFDQSxRQUFJLGFBQWEsWUFBWSxXQUFaLENBQXdCLE9BQXhCLENBQWpCO0FBQ0EsUUFBSSxZQUFZLFdBQVcsS0FBWCxDQUFpQixNQUFqQixDQUFoQjs7QUFFQSxXQUFPLFVBQVUsTUFBVixDQUFpQixPQUFqQixDQUFQO0FBQ0QsR0FUSSxDQUFQO0FBV0Q7O0FBRUQ7OztBQUdPLFNBQVMsZ0JBQVQsQ0FBMEIsUUFBMUIsRUFBb0MsQ0FFMUM7O0FBRUQ7OztBQUdPLFNBQVMsZ0JBQVQsQ0FBMEIsUUFBMUIsRUFBb0MsQ0FFMUM7Ozs7Ozs7O2tCQ3BFcUIsRTs7QUEvQ3hCOzs7Ozs7QUFFQSxJQUFJLEdBQUo7O0FBRUE7QUFDQSxTQUFTLFlBQVQsR0FBd0I7O0FBRXRCLFNBQU8sY0FBSSxJQUFKLENBQVMsUUFBVCxFQUFtQixDQUFuQixFQUFzQixVQUFTLFNBQVQsRUFBb0I7O0FBRS9DLFlBQU8sVUFBVSxVQUFqQjs7QUFFRSxXQUFLLENBQUw7QUFDRSxrQkFBVSxpQkFBVixDQUE0QixPQUE1QixFQUFxQztBQUNuQyxtQkFBUztBQUQwQixTQUFyQzs7QUFJQSxrQkFBVSxpQkFBVixDQUE0QixPQUE1QixFQUFxQyxFQUFDLGVBQWUsSUFBaEIsRUFBckM7O0FBRUEsa0JBQVUsaUJBQVYsQ0FBNEIsUUFBNUIsRUFBc0M7QUFDcEMsbUJBQVM7QUFEMkIsU0FBdEM7O0FBSUEsWUFBSSxZQUFZLFVBQVUsV0FBVixDQUFzQixXQUF0QixDQUFrQyxPQUFsQyxDQUFoQjtBQUNBLGtCQUFVLFdBQVYsQ0FBc0IsTUFBdEIsRUFBOEIsU0FBOUI7QUFDQSxrQkFBVSxXQUFWLENBQXNCLE1BQXRCLEVBQThCLFNBQTlCOztBQWZKO0FBa0JELEdBcEJNLENBQVA7O0FBc0JBLGNBQVksY0FBSSxJQUFKLENBQVMsU0FBVCxFQUFvQixDQUFwQixFQUF1QixVQUFTLFNBQVQsRUFBb0I7QUFDdkQsWUFBTyxVQUFVLFVBQWpCO0FBQ0UsV0FBSyxDQUFMO0FBQ0UsWUFBSSxjQUFjLFVBQVUsaUJBQVYsQ0FBNEIsUUFBNUIsQ0FBbEI7QUFDQSxvQkFBWSxHQUFaLENBQWdCLE9BQWhCLEVBQXlCLE9BQXpCO0FBQ0YsV0FBSyxDQUFMO0FBQ0Usa0JBQVUsaUJBQVYsQ0FBNEIsUUFBNUIsRUFBc0MsRUFBRSxTQUFTLE1BQVgsRUFBdEM7QUFDRixXQUFLLENBQUw7QUFDRSxZQUFJLGNBQWMsVUFBVSxXQUFWLENBQXNCLFdBQXRCLENBQWtDLFFBQWxDLENBQWxCO0FBQ0Esb0JBQVksV0FBWixDQUF3QixRQUF4QixFQUFrQyxnQkFBbEM7QUFDRixXQUFLLENBQUw7QUFDRSxzQkFBYyxVQUFVLFdBQVYsQ0FBc0IsV0FBdEIsQ0FBa0MsUUFBbEMsQ0FBZDtBQUNBLG9CQUFZLFdBQVosQ0FBd0IsS0FBeEIsRUFBK0IsS0FBL0I7QUFYSjtBQWFELEdBZGEsQ0FBWjtBQWdCRDs7QUFFYyxTQUFTLEVBQVQsR0FBYzs7QUFFM0IsTUFBRyxPQUFPLElBQVYsRUFBZ0I7QUFDZCxVQUFNLGNBQU47QUFDRDs7QUFFRCxTQUFPLEdBQVA7QUFFRDs7O0FDdkREO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0ICogYXMgU3RvcHMgZnJvbSAnLi9vcm0vU3RvcHMuanMnO1xuaW1wb3J0ICogYXMgVHJpcHMgZnJvbSAnLi9vcm0vVHJpcHMuanMnO1xuaW1wb3J0ICogYXMgSHR0cCBmcm9tICcuL2h0dHAuanMnO1xuXG4vLyBJbnRlcmFjdGl2ZSBlbGVtZW50cyBpbiB0aGUgcGFnZVxudmFyIGRlcGFydHVyZXMsIGFycml2YWxzLCBzdWJtaXRCdXR0b247XG5cbi8qIFxuICBBZGQgdGhlIG9wdGlvbnMgdG8gdGhlIGRhdGFsaXN0IGVsZW1lbnRzIGluIHRoZSBmb3JtLlxuKi9cbmZ1bmN0aW9uIGFkZFN0b3BzKHN0b3BzKSB7XG5cbiAgc3RvcHMuZm9yRWFjaCggKHN0b3ApID0+IHtcbiAgICBcbiAgICB2YXIgb3B0aW9uID0gYDxvcHRpb24gdmFsdWU9XCIke3N0b3Auc3RvcF9uYW1lfSAtICR7c3RvcC5zdG9wX2lkfVwiPjwvb3B0aW9uPmA7XG4gICAgZGVwYXJ0dXJlcy5pbm5lckhUTUwgKz0gb3B0aW9uO1xuICAgIGFycml2YWxzLmlubmVySFRNTCArPSBvcHRpb247XG5cbiAgfSk7XG5cbn1cblxuZnVuY3Rpb24gc2hvd1RyaXBUaW1lcyh0cmlwcykge1xuXG4gIHZhciByZXN1bHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWV0YWJsZScpO1xuICByZXN1bHRzLmlubmVySFRNTCA9ICcnO1xuICBcbiAgdHJpcHMuZm9yRWFjaCggKHRyaXAsIGluZGV4KSA9PiB7XG4gICAgXG4gICAgdmFyIHJvdyA9IGA8ZGl2PiAke3RyaXAuYXJyaXZhbF90aW1lfSAtICR7dHJpcC50cmlwX2lkfSA8L2Rpdj5gO1xuICAgIHJlc3VsdHMuaW5uZXJIVE1MICs9IHJvdztcblxuICB9KTtcblxufVxuXG4vKlxuICBTaG93cyBhIG1lc3NhZ2UgaW4gdGhlIG1lc3NhZ2UtYm94IGVsZW1lbnQuXG4qL1xuZnVuY3Rpb24gc2hvd0luZm9NZXNzYWdlKG1lc3NhZ2UsIHR5cGUpIHtcblxuICB2YXIgbWVzc2FnZUJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZXNzYWdlLWJveCcpO1xuICBtZXNzYWdlQm94LmlubmVySFRNTCA9IG1lc3NhZ2U7XG5cbiAgbWVzc2FnZUJveC5jbGFzc05hbWUgPSAnYWxlcnQnO1xuICBcbiAgc3dpdGNoKHR5cGUpIHtcbiAgICBjYXNlICdlcnJvcic6XG4gICAgICBtZXNzYWdlQm94LmNsYXNzTmFtZSArPSAnIGVycm9yJztcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBtZXNzYWdlQm94LmNsYXNzTmFtZSArPSAnIGluZm8nO1xuICAgICAgYnJlYWs7ICAgIFxuICB9XG5cbn1cblxuLypcbiAgTWFrZXMgdGhlIG1lc3NhZ2UtYm94IGVsZW1lbnQgZGlzYXBwZWFyIHRocm91Z2ggY3NzIGNsYXNzXG4qL1xuZnVuY3Rpb24gY2xlYXJJbmZvTWVzc2FnZSgpIHtcbiAgdmFyIG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZS1ib3gnKTtcbiAgbWVzc2FnZUJveC5jbGFzc05hbWUgPSAnYWxlcnQnO1xufVxuXG5cbi8qXG4gIFJlcXVlc3QgdGhlIHN0b3BzIGZyb20gc2VydmVyIGFuZCBhZGQgdGhlbSB0byBhbiBhcnJheVxuICB0byBiZSBhYmxlIHRvIGNoZWNrIHRoYXQgdGhlIHVzZXIgaW5wdXQgaXMgdmFsaWQuXG4qL1xuZnVuY3Rpb24gbG9hZFN0b3BzKCkge1xuXG4gIFN0b3BzLmdldEFsbCgpLnRoZW4oYWRkU3RvcHMpO1xuXG59O1xuXG4vKlxuICBHZXQgdGhlIHN0YXRpb24gY29kZSBmcm9tIGEgc3RyaW5nXG4qL1xuZnVuY3Rpb24gZ2V0U3RhdGlvbkNvZGUoc3RhdGlvbikge1xuXG4gIHZhciBwYXJ0cyA9IHN0YXRpb24uc3BsaXQoJy0nKTtcbiAgXG4gIGlmKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAvLyBUaGlzIGNvdWxkIGJlIGEgc3RyaW5nIGZyb20gdGhlIGRhdGFsaXN0LCBleHRyYWN0IHRoZSBjb2RlXG4gICAgcmV0dXJuIHBhcnRzWzFdLnRyaW0oKTtcbiAgfSBcblxuICAvLyBUaGlzIGNvdWxkIGJlIGEgY29kZSB3cml0dGVuIGJ5IHRoZSB1c2VyXG4gIHJldHVybiBzdGF0aW9uO1xuICBcbn1cblxuLypcbiAgQ2hlY2sgdGhhdCBhIGNvZGUgaXMgZWl0aGVyIGEgcGFpciBzdGF0aW9uIG5hbWUgLSBzdGF0aW9uIGNvZGUgXG4gIGZyb20gdGhlIGZvcm0gZGF0YWxpc3Qgb3IgYSBjb2RlIG9mIGEgc3RvcCB3cml0dGVuIGJ5IHRoZSB1c2VyLlxuKi9cbmZ1bmN0aW9uIGNoZWNrU3RhdGlvbihzdGF0aW9uKSB7XG5cbiAgdmFyIGNvZGUgPSBnZXRTdGF0aW9uQ29kZShzdGF0aW9uKTtcblxuICAvLyBDaGVjayB0aGF0IHRoZSBjb2RlIGlzIGluIHRoZSBsaXN0IG9mIHN0b3BzXG4gIHJldHVybiBTdG9wcy5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKHN0b3BzKXtcbiAgICByZXR1cm4gc3RvcHMuc29tZShmdW5jdGlvbiBjaGVjayhzdG9wKSB7XG4gICAgICByZXR1cm4gc3RvcC5zdG9wX2lkID09IGNvZGU7XG4gICAgfSk7XG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGZpbmRNYXRjaGluZ1RyaXBzKGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpIHtcblxuICAvLyBnZXRzIGFsbCB0cmlwcyB0aGF0IGdvZXMgdG8gdGhlIGRlcGFydHVyZSBzdG9wIGFuZCB0aGUgYXJyaXZhbCBzdG9wXG4gIHZhciB2YWxpZFRyaXBzID0gZGVwYXJ0dXJlVGltZXMuZmlsdGVyKGZ1bmN0aW9uKGRlcGFydHVyZVRyaXApe1xuICAgIHJldHVybiBhcnJpdmFsVGltZXMuc29tZShmdW5jdGlvbihhcnJpdmFsVHJpcCl7XG4gICAgICByZXR1cm4gYXJyaXZhbFRyaXAudHJpcF9pZCA9PSBkZXBhcnR1cmVUcmlwLnRyaXBfaWQ7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiB2YWxpZFRyaXBzO1xufVxuXG4vKlxuICBGaW5kcyB0cmlwcyBiZXR3ZWVuIHR3byBzdGF0aW9ucywgcmV0dXJucyB0aGUgdHJpcHMgaWRzXG4qL1xuZnVuY3Rpb24gZmluZFRyaXBzKGRlcGFydHVyZUlkLCBhcnJpdmFsSWQpIHtcblxuICByZXR1cm4gUHJvbWlzZS5hbGwoW1RyaXBzLmdldFRyaXBTdG9wVGltZXMoZGVwYXJ0dXJlSWQpLCBUcmlwcy5nZXRUcmlwU3RvcFRpbWVzKGFycml2YWxJZCldKVxuICAgIC50aGVuKGZ1bmN0aW9uKFtkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzXSkge1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZygnRm91bmQgcm91dGVzIScsIGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpO1xuICAgICAgcmV0dXJuIGZpbmRNYXRjaGluZ1RyaXBzKGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpO1xuXG4gICAgfSk7XG5cbn1cblxuLypcbiAgU3VibWl0IHRoZSB1c2VyIHNlbGVjdGlvbiBhbmQgc2hvdyB0aGUgcm91dGUgaWYgYXZhaWxhYmxlIG9yIGFuXG4gIGVycm9yIG1lc3NhZ2UgaWYgbm8gcm91dGUgaXMgYXZhaWxhYmxlLlxuKi9cbmZ1bmN0aW9uIHN1Ym1pdFN0YXRpb25zKGV2dCkge1xuXG4gIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICBjbGVhckluZm9NZXNzYWdlKCk7XG4gIFxuICAvLyBnZXQgdGhlIGlucHV0cyB2YWx1ZXNcbiAgdmFyIGRlcGFydHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBhcnR1cmUnKS52YWx1ZTtcbiAgdmFyIGFycml2YWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXJyaXZhbCcpLnZhbHVlO1xuXG4gIFByb21pc2UuYWxsKFtjaGVja1N0YXRpb24oZGVwYXJ0dXJlKSwgY2hlY2tTdGF0aW9uKGFycml2YWwpXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIFxuICAgIGlmKCFyZXN1bHRbMF0gfHwgIXJlc3VsdFsxXSkge1xuICAgICAgc2hvd0luZm9NZXNzYWdlKFxuICAgICAgICAnWW91IGhhdmUgdG8gc2VsZWN0IGEgdmFsaWQgZGVwYXJ0dXJlIGFuZCBhcnJpdmFsIHN0YXRpb25zIGZyb20gdGhlIGxpc3RzIG9yIHdyaXRlIGEgdmFsaWQgc3RvcCBjb2RlLicsXG4gICAgICAgICdlcnJvcidcbiAgICAgICAgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgLy8gSWYgdGhlIGRlcGFydHVyZSBhbmQgYXJyaXZhbCBzdGF0aW9ucyBhcmUgY29ycmVjdFxuICAgIC8vIHNlYXJjaCBmb3IgYSB0cmlwIGJldHdlZW4gdGhlbSBhbmQgc2hvdyB0aGUgdGltZXMgYW5kIHJvdXRlXG4gICAgZmluZFRyaXBzKGdldFN0YXRpb25Db2RlKGRlcGFydHVyZSksIGdldFN0YXRpb25Db2RlKGFycml2YWwpKS50aGVuKGZ1bmN0aW9uKHRyaXBzKXtcbiAgICAgIGlmKHRyaXBzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2hvd1RyaXBUaW1lcyh0cmlwcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaG93SW5mb01lc3NhZ2UoJ1dlIGNvdWxkblxcJ3QgZmluZCBhIHRyaXAgYmV0d2VlbiB0aGVzZSB0d28gc3RhdGlvbnMnLCAnZXJyb3InKTtcbiAgICAgIH1cblxuICAgIH0pO1xuICB9KVxuXG5cbn1cblxuLypcbiAgSW5pdGlhbGl6ZSB0aGUgYXBwbGljYXRpb24gXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXQoKSB7XG5cbiAgLy8gZ2V0IHRoZSBpbnRlcmFjdGl2ZSBlbGVtZW50cyBvZiB0aGUgaW50ZXJmYWNlXG4gIGRlcGFydHVyZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVwYXJ0dXJlLXN0b3BzJyk7XG4gIGFycml2YWxzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fycml2YWwtc3RvcHMnKTtcbiAgc3VibWl0QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlYXJjaCcpO1xuXG4gIC8vIFBvcHVsYXRlIGRhdGFsaXN0cyBhbmQgYWRkIGxpc3RlbmVyc1xuICBsb2FkU3RvcHMoKTtcbiAgc3VibWl0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc3VibWl0U3RhdGlvbnMpO1xuXG59O1xuIiwiY29uc3QgYmFzZVVybCAgICAgICA9ICcvZGlzdC9kYXRhLyc7XG5jb25zdCByb3V0ZXNGaWxlICAgID0gJ3JvdXRlcy50eHQnO1xuY29uc3QgdHJpcHNGaWxlICAgICA9ICd0cmlwcy50eHQnO1xuY29uc3Qgc3RvcHNGaWxlICAgICA9ICdzdG9wcy50eHQnO1xuY29uc3Qgc3RvcFRpbWVzRmlsZSA9ICdzdG9wX3RpbWVzLnR4dCc7XG5cbmNvbnN0IGNzdlRvQXJyYXkgPSBmdW5jdGlvbih0ZXh0KSB7XG4gIFxuICB2YXIgcm93cyA9IHRleHQudHJpbSgpLnNwbGl0KCdcXG4nKTtcbiAgcmV0dXJuIHJvd3MubWFwKChyb3cpID0+IHJvdy5zcGxpdCgnLCcpKTtcblxufTtcblxuY29uc3QgY3N2VG9PYmplY3RzID0gZnVuY3Rpb24odGV4dCkge1xuXG4gIHZhciB0YWJsZSA9IGNzdlRvQXJyYXkodGV4dCk7XG4gIHZhciBrZXlzID0gdGFibGVbMF07XG4gIHRhYmxlID0gdGFibGUuc2xpY2UoMSk7XG5cbiAgcmV0dXJuIHRhYmxlLm1hcChmdW5jdGlvbihyb3cpIHtcbiAgICB2YXIgb2JqID0ge307XG4gICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgaW5kZXgpIHtcbiAgICAgIG9ialtrZXldID0gcm93W2luZGV4XTtcbiAgICB9KTtcbiAgICByZXR1cm4gIG9iajtcbiAgfSk7XG5cbn1cblxuZnVuY3Rpb24gZ2V0Q3N2QXNPYmplY3RzKHVybCkge1xuXG4gIHJldHVybiBmZXRjaCh1cmwsIHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cbiAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XG5cbiAgICB9KS50aGVuKGZ1bmN0aW9uKHRleHRDb250ZW50KSB7XG5cbiAgICAgIHJldHVybiBjc3ZUb09iamVjdHModGV4dENvbnRlbnQpO1xuXG4gICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgIH0pO1xufVxuXG4vLyBBUElcblxuLypcbiAgUmV0dXJucyBhIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhbiBhcnJheSB3aXRoIHRoZSBuYW1lcyBvZiB0aGUgXG4gIGF2YWlsYWJsZSBsaW5lcy5cbiovXG5leHBvcnQgZnVuY3Rpb24gcm91dGVzKCkge1xuXG4gIHJldHVybiBnZXRDc3ZBc09iamVjdHMoYmFzZVVybCArIHJvdXRlc0ZpbGUpO1xuXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdHJpcHMoKSB7XG4gIC8vIGdldCB0aGUgcm91dGUvbGluZSBhbmQgcmV0dXJuIHRoZSB0aW1lcyBmb3IgdGhpcyBsaW5lXG4gIHJldHVybiBnZXRDc3ZBc09iamVjdHMoYmFzZVVybCArIHRyaXBzRmlsZSk7XG5cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wcygpIHtcbiAgLy8gcmV0dXJucyB0aGUgc3RvcHMgb2YgdGhpcyBsaW5lXG4gIHJldHVybiBnZXRDc3ZBc09iamVjdHMoYmFzZVVybCArIHN0b3BzRmlsZSk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gc3RvcFRpbWVzKCkge1xuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyBzdG9wVGltZXNGaWxlKTsgXG59O1xuIiwiaW1wb3J0ICogYXMgQXBwIGZyb20gJy4vYXBwLmpzJztcblxuKGZ1bmN0aW9uKCkge1xuJ3VzZSBzdHJpY3QnO1xuLypmdW5jdGlvbiByZWdpc3RlclNlcnZpY2VXb3JrZXIoKSB7XG5cbiAgICBpZiAoIW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyKSByZXR1cm47XG5cbiAgICB2YXIgaW5kZXhDb250cm9sbGVyID0gdGhpcztcblxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcvc3cuanMnKS50aGVuKGZ1bmN0aW9uKHJlZykge1xuICAgICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5jb250cm9sbGVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlZy53YWl0aW5nKSB7XG4gICAgICAgIGluZGV4Q29udHJvbGxlci5fdXBkYXRlUmVhZHkocmVnLndhaXRpbmcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChyZWcuaW5zdGFsbGluZykge1xuICAgICAgICBpbmRleENvbnRyb2xsZXIuX3RyYWNrSW5zdGFsbGluZyhyZWcuaW5zdGFsbGluZyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVnLmFkZEV2ZW50TGlzdGVuZXIoJ3VwZGF0ZWZvdW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGluZGV4Q29udHJvbGxlci5fdHJhY2tJbnN0YWxsaW5nKHJlZy5pbnN0YWxsaW5nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gRW5zdXJlIHJlZnJlc2ggaXMgb25seSBjYWxsZWQgb25jZS5cbiAgICAvLyBUaGlzIHdvcmtzIGFyb3VuZCBhIGJ1ZyBpbiBcImZvcmNlIHVwZGF0ZSBvbiByZWxvYWRcIi5cbiAgICB2YXIgcmVmcmVzaGluZztcbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdjb250cm9sbGVyY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocmVmcmVzaGluZykgcmV0dXJuO1xuICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgcmVmcmVzaGluZyA9IHRydWU7XG4gICAgfSk7XG4gIH07Ki9cblxuICBmdW5jdGlvbiByZWdpc3RlclNlcnZpY2VXb3JrZXIoKSB7XG5cbiAgICBpZiAoIW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyKSByZXR1cm47XG5cbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignLi9kaXN0L2pzL3NlcnZpY2Vfd29ya2VyLmpzJykudGhlbihmdW5jdGlvbihyZWcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdSZWdpc3RyYXRpb24gd29ya2VkIScsIHJlZyk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdSZWdpc3RyYXRpb24gZmFpbGVkIScsIGVycm9yKTtcbiAgICB9KTtcblxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgICBcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBcbiAgICAgIC8vIHJlc29sdmUgdGhlIHByb21pc2Ugd2hlbiB0aGUgZG9jdW1lbnQgaXMgcmVhZHlcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0pO1xuXG4gIH07XG5cbiAgcmVhZHkoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIEFwcC5pbml0KCk7XG4gICAgcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCk7XG4gIH0pO1xuXG59KSgpOyIsImltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi4vaHR0cC5qcyc7XG5pbXBvcnQgaWRiIGZyb20gJy4vZGIuanMnO1xuXG4vLyBJZiBpbmRleGVkREIgaXMgcG9wdWxhdGVkLCBnZXQgdGhlIGRhdGEgYW5kIHRyeSB0byB1cGRhdGUgZnJvbSBuZXR3b3JrXG4vLyBlbHNlIHRyeSB0byBnZXQgdGhlIGRhdGEgZnJvbSBuZXR3b3JrIGFuZCBzYXZlIGl0XG4vLyBlbHNlIHdlIHNob3VsZCBzaG93IGEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgdG8gdGhlIHVzZXIsIHRoZSBhcHAgaXMgbm90YSBhdmFpbGFibGUuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsKCkge1xuXG4gIHJldHVybiBIdHRwLnN0b3BzKCkudGhlbihmdW5jdGlvbiBnZXRTdG9wc0Zyb21OZXR3b3JrKHJlc3VsdHMpe1xuXG4gICAgaWYoIXJlc3VsdHMpIHtcblxuICAgICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gZ2V0U3RvcHNGcm9tSURCKGRiKXtcblxuICAgICAgICBpZighZGIpIHRocm93ICdTdG9wcyBkYXRhIGlzIG5vdCBhdmFpbGFibGUuJztcblxuICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcHMnKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wcycpLmdldEFsbCgpO1xuICAgICAgXG4gICAgICB9KTtcbiAgICAgIFxuICAgIH1cblxuICAgIC8vIElmIEkgZ2V0IHJlc3VsdHMgc3RvcmUgdGhlIHJlc3VsdCBpbiBpbmRleGVkREJcbiAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBzdG9yZVN0b3BzSW5JREIoZGIpe1xuXG4gICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcHMnLCAncmVhZHdyaXRlJyk7XG4gICAgICB2YXIgc3RvcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wcycpO1xuXG4gICAgICByZXN1bHRzLmZvckVhY2goIGZ1bmN0aW9uKHN0b3ApIHtcbiAgICAgICAgc3RvcHNTdG9yZS5wdXQoc3RvcCk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLmNvbXBsZXRlO1xuXG4gICAgfSkudGhlbihmdW5jdGlvbiB0cmFuc2FjdGlvbkNvbXBsZXRlZCgpe1xuXG4gICAgICByZXR1cm4gcmVzdWx0cztcblxuICAgIH0pO1xuXG4gIH0pO1xuXG59XG5cblxuIiwiaW1wb3J0ICogYXMgSHR0cCBmcm9tICcuLi9odHRwLmpzJztcbmltcG9ydCBpZGIgZnJvbSAnLi9kYi5qcyc7XG5cbiAgLypcbiAgICBUaGlzIGZ1bmN0aW9uIGNoZWNrcyB0aGF0IHRoZSBkYXRhIGlzIGluIEluZGV4ZWREQiwgaWYgbm90LCBpdCBnZXRzIGl0IGZyb20gbmV0d29yay9jYWNoZVxuICAgIGFuZCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGRhdGEgaXMgc3RvcmVkIGluIElEQi5cbiAgICBUaGlzIHdheSB3ZSBkb24ndCBuZWVkIGFueSBpbml0aWFsaXphdGlvbiBmdW5jdGlvbiwganVzdCBjYWxsIHRoaXMgZnVuY3Rpb24gaW4gZWFjaCByZXRyaWV2aW5nXG4gICAgbWV0aG9kIGFuZCBpdCB3aWxsIGdldCBzdXJlIHRoYXQgZXZlcnl0aGluZyBpcyBzZXQgdXAgYmVmb3JlIHRyeWluZyB0byBnZXQgdGhlIGNvbnRlbnQuXG4gICovXG4gIGZ1bmN0aW9uIHNldFRyaXBzKCkge1xuXG4gICAgcmV0dXJuIGlkYigpLnRoZW4oZGIgPT4ge1xuXG4gICAgICBpZighZGIpIHRocm93ICdXZSBjb3VsZG5cXCd0IGFjY2VzcyBJbmRleGVkREInO1xuXG4gICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbigndHJpcHMnKTtcbiAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgIHJldHVybiB0cmlwc1N0b3JlLmNvdW50KCk7XG5cbiAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzIHNvbWV0aGluZyBpbiB0aGUgZGIsIGRvbid0IGJvdGhlciBpbiBnZXR0aW5nIHRoZSBkYXRhIGFnYWluIGZyb20gbmV0d29ya1xuICAgICAgaWYocmVzdWx0ID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoZXJlIGlzIG5vdGhpbmcgaW4gdGhlIHRyaXBzIHRhYmxlLCBmaWxsIGl0IVxuICAgICAgcmV0dXJuIEh0dHAuc3RvcFRpbWVzKCkudGhlbihmdW5jdGlvbiBnZXRTdG9wVGltZXNGcm9tTmV0d29yayhyZXN1bHRzKSB7XG5cbiAgICAgICAgaWYocmVzdWx0cykgeyBcblxuICAgICAgICAgICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gc3RvcmVUcmlwc0luSURCKGRiKXtcblxuICAgICAgICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbigndHJpcHMnLCAncmVhZHdyaXRlJyk7XG4gICAgICAgICAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3RyaXBzJyk7XG5cbiAgICAgICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKCBmdW5jdGlvbih0cmlwKSB7XG4gICAgICAgICAgICAgICAgdHJpcHNTdG9yZS5wdXQodHJpcCk7XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21wbGV0ZTtcblxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcblxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuXG4gICAgICB9KTtcblxuICAgIH0pO1xuXG5cbiAgfVxuXG5cbiAgLy8gSWYgaW5kZXhlZERCIGlzIHBvcHVsYXRlZCwgZ2V0IHRoZSBkYXRhIGFuZCB0cnkgdG8gdXBkYXRlIGZyb20gbmV0d29ya1xuICAvLyBlbHNlIHRyeSB0byBnZXQgdGhlIGRhdGEgZnJvbSBuZXR3b3JrIGFuZCBzYXZlIGl0XG4gIC8vIGVsc2Ugd2Ugc2hvdWxkIHNob3cgYSBjdXN0b20gZXJyb3IgbWVzc2FnZSB0byB0aGUgdXNlciwgdGhlIGFwcCBpcyBub3RhIGF2YWlsYWJsZS5cblxuICAvKlxuICAgIEdldCB0aGUgdHJpcHMgdGhhdCBzdG9wIGF0IHN0b3BfaWQsIG9uZSBwZXIgcm91dGUsIGluZGVwZW5kZW50bHkgb2Ygc3RvcCB0aW1lc1xuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0Um91dGVzRm9yU3RvcChzdG9wX2lkKSB7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRUcmlwc1N0b3BUaW1lcyhzdG9wX2lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gZ2V0Um91dGVzRm9yVHJpcHModHJpcHMpIHtcblxuICAgICAgICB2YXIgcm91dGVzID0gW107XG4gICAgICAgIHRyaXBzLmZvckVhY2goZnVuY3Rpb24gZ2V0VW5pcXVlUm91dGVzKHRyaXApIHtcbiAgICAgICAgICBpZihyb3V0ZXMuaW5kZXhPZih0cmlwLnJvdXRlX2lkKSA9PSAtMSkge1xuICAgICAgICAgICAgcm91dGVzLnB1c2godHJpcC5yb3V0ZV9pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcm91dGVzO1xuXG4gICAgICB9KTtcblxuICB9O1xuXG4gIC8qXG4gICAgR2V0IGFsbCB0aGUgdGltZXMgZm9yIGEgc3RvcFxuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0VHJpcFN0b3BUaW1lcyhzdG9wX2lkKSB7XG5cbiAgICByZXR1cm4gc2V0VHJpcHMoKVxuICAgICAgLnRoZW4oKCkgPT4gaWRiKCkpXG4gICAgICAudGhlbihmdW5jdGlvbiBnZXRUcmlwc0ZvclN0b3AoZGIpe1xuXG4gICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCd0cmlwcycpO1xuICAgICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuICAgICAgICB2YXIgc3RvcEluZGV4ID0gdHJpcHNTdG9yZS5pbmRleCgnc3RvcCcpO1xuXG4gICAgICAgIHJldHVybiBzdG9wSW5kZXguZ2V0QWxsKHN0b3BfaWQpO1xuICAgICAgfSk7XG5cbiAgfTtcblxuICAvKlxuICAgIEdldCBhbGwgdGhlIHRyaXBzIGZvciBhIHJvdXRlXG4gICovXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXRUcmlwc0ZvclJvdXRlKHJvdXRlX2lkKSB7XG5cbiAgfTtcblxuICAvKlxuICAgIEdldCBhbGwgdGhlIHN0b3BzIGZvciBhIHJvdXRlXG4gICovXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXRTdG9wc0ZvclJvdXRlKHJvdXRlX2lkKSB7XG5cbiAgfTtcbiIsImltcG9ydCBpZGIgZnJvbSAnLi4vLi4vbm9kZV9tb2R1bGVzL2lkYi9saWIvaWRiLmpzJztcblxudmFyIF9kYjtcblxuLy8gVGhpcyBjbGFzcyB3b3JrcyBhcyBhIE9STSB0aGF0IGdldHMgdGhlIGRhdGEgZnJvbSBpbmRleGVkREJcbmZ1bmN0aW9uIG9wZW5EYXRhYmFzZSgpIHtcbiAgXG4gIHJldHVybiBpZGIub3BlbigndHJhaW5zJywgMSwgZnVuY3Rpb24odXBncmFkZURiKSB7XG4gICAgXG4gICAgc3dpdGNoKHVwZ3JhZGVEYi5vbGRWZXJzaW9uKSB7XG4gICAgXG4gICAgICBjYXNlIDA6XG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgnc3RvcHMnLCB7XG4gICAgICAgICAga2V5UGF0aDogJ3N0b3BfaWQnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgndHJpcHMnLCB7YXV0b0luY3JlbWVudDogdHJ1ZX0pO1xuXG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncm91dGVzJywge1xuICAgICAgICAgIGtleVBhdGg6ICdyb3V0ZV9pZCdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHRyaXBTdG9yZSA9IHVwZ3JhZGVEYi50cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgndHJpcHMnKTtcbiAgICAgICAgdHJpcFN0b3JlLmNyZWF0ZUluZGV4KCdzdG9wJywgJ3N0b3BfaWQnKTtcbiAgICAgICAgdHJpcFN0b3JlLmNyZWF0ZUluZGV4KCd0cmlwJywgJ3RyaXBfaWQnKTtcblxuICAgIH1cbiAgfSk7XG5cbiAgZGJQcm9taXNlID0gaWRiLm9wZW4oJ3Rlc3QtZGInLCA0LCBmdW5jdGlvbih1cGdyYWRlRGIpIHtcbiAgc3dpdGNoKHVwZ3JhZGVEYi5vbGRWZXJzaW9uKSB7XG4gICAgY2FzZSAwOlxuICAgICAgdmFyIGtleVZhbFN0b3JlID0gdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdrZXl2YWwnKTtcbiAgICAgIGtleVZhbFN0b3JlLnB1dChcIndvcmxkXCIsIFwiaGVsbG9cIik7XG4gICAgY2FzZSAxOlxuICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdwZW9wbGUnLCB7IGtleVBhdGg6ICduYW1lJyB9KTtcbiAgICBjYXNlIDI6XG4gICAgICB2YXIgcGVvcGxlU3RvcmUgPSB1cGdyYWRlRGIudHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3Blb3BsZScpO1xuICAgICAgcGVvcGxlU3RvcmUuY3JlYXRlSW5kZXgoJ2FuaW1hbCcsICdmYXZvcml0ZUFuaW1hbCcpO1xuICAgIGNhc2UgMzpcbiAgICAgIHBlb3BsZVN0b3JlID0gdXBncmFkZURiLnRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdwZW9wbGUnKTtcbiAgICAgIHBlb3BsZVN0b3JlLmNyZWF0ZUluZGV4KCdhZ2UnLCAnYWdlJyk7XG4gIH1cbn0pO1xuXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRiKCkge1xuICBcbiAgaWYoX2RiID09IG51bGwpIHtcbiAgICBfZGIgPSBvcGVuRGF0YWJhc2UoKTtcbiAgfSBcblxuICByZXR1cm4gX2RiO1xuXG59OyIsIid1c2Ugc3RyaWN0JztcblxuKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiB0b0FycmF5KGFycikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICB9O1xuXG4gICAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHJlcXVlc3Q7XG4gICAgdmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3QgPSBvYmpbbWV0aG9kXS5hcHBseShvYmosIGFyZ3MpO1xuICAgICAgcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgfSk7XG5cbiAgICBwLnJlcXVlc3QgPSByZXF1ZXN0O1xuICAgIHJldHVybiBwO1xuICB9XG4gIFxuICBmdW5jdGlvbiBwcm9taXNpZnlDdXJzb3JSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciBwID0gcHJvbWlzaWZ5UmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpO1xuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmICghdmFsdWUpIHJldHVybjtcbiAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBwLnJlcXVlc3QpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlQcm9wZXJ0aWVzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb3h5Q2xhc3MucHJvdG90eXBlLCBwcm9wLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbdGFyZ2V0UHJvcF1bcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlSZXF1ZXN0TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdLmFwcGx5KHRoaXNbdGFyZ2V0UHJvcF0sIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlDdXJzb3JSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIEluZGV4KGluZGV4KSB7XG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcbiAgfVxuXG4gIHByb3h5UHJvcGVydGllcyhJbmRleCwgJ19pbmRleCcsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdtdWx0aUVudHJ5JyxcbiAgICAndW5pcXVlJ1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKEluZGV4LCAnX2luZGV4JywgSURCSW5kZXgsIFtcbiAgICAnZ2V0JyxcbiAgICAnZ2V0S2V5JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKEluZGV4LCAnX2luZGV4JywgSURCSW5kZXgsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIEN1cnNvcihjdXJzb3IsIHJlcXVlc3QpIHtcbiAgICB0aGlzLl9jdXJzb3IgPSBjdXJzb3I7XG4gICAgdGhpcy5fcmVxdWVzdCA9IHJlcXVlc3Q7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoQ3Vyc29yLCAnX2N1cnNvcicsIFtcbiAgICAnZGlyZWN0aW9uJyxcbiAgICAna2V5JyxcbiAgICAncHJpbWFyeUtleScsXG4gICAgJ3ZhbHVlJ1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKEN1cnNvciwgJ19jdXJzb3InLCBJREJDdXJzb3IsIFtcbiAgICAndXBkYXRlJyxcbiAgICAnZGVsZXRlJ1xuICBdKTtcblxuICAvLyBwcm94eSAnbmV4dCcgbWV0aG9kc1xuICBbJ2FkdmFuY2UnLCAnY29udGludWUnLCAnY29udGludWVQcmltYXJ5S2V5J10uZm9yRWFjaChmdW5jdGlvbihtZXRob2ROYW1lKSB7XG4gICAgaWYgKCEobWV0aG9kTmFtZSBpbiBJREJDdXJzb3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgIEN1cnNvci5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjdXJzb3IgPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgY3Vyc29yLl9jdXJzb3JbbWV0aG9kTmFtZV0uYXBwbHkoY3Vyc29yLl9jdXJzb3IsIGFyZ3MpO1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdChjdXJzb3IuX3JlcXVlc3QpLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICAgICAgcmV0dXJuIG5ldyBDdXJzb3IodmFsdWUsIGN1cnNvci5fcmVxdWVzdCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gT2JqZWN0U3RvcmUoc3RvcmUpIHtcbiAgICB0aGlzLl9zdG9yZSA9IHN0b3JlO1xuICB9XG5cbiAgT2JqZWN0U3RvcmUucHJvdG90eXBlLmNyZWF0ZUluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmRleCh0aGlzLl9zdG9yZS5jcmVhdGVJbmRleC5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgT2JqZWN0U3RvcmUucHJvdG90eXBlLmluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmRleCh0aGlzLl9zdG9yZS5pbmRleC5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgW1xuICAgICduYW1lJyxcbiAgICAna2V5UGF0aCcsXG4gICAgJ2luZGV4TmFtZXMnLFxuICAgICdhdXRvSW5jcmVtZW50J1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAncHV0JyxcbiAgICAnYWRkJyxcbiAgICAnZGVsZXRlJyxcbiAgICAnY2xlYXInLFxuICAgICdnZXQnLFxuICAgICdnZXRBbGwnLFxuICAgICdnZXRBbGxLZXlzJyxcbiAgICAnY291bnQnXG4gIF0pO1xuXG4gIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xuICAgICdvcGVuQ3Vyc29yJyxcbiAgICAnb3BlbktleUN1cnNvcidcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnZGVsZXRlSW5kZXgnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIFRyYW5zYWN0aW9uKGlkYlRyYW5zYWN0aW9uKSB7XG4gICAgdGhpcy5fdHggPSBpZGJUcmFuc2FjdGlvbjtcbiAgICB0aGlzLmNvbXBsZXRlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChpZGJUcmFuc2FjdGlvbi5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgVHJhbnNhY3Rpb24ucHJvdG90eXBlLm9iamVjdFN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTdG9yZSh0aGlzLl90eC5vYmplY3RTdG9yZS5hcHBseSh0aGlzLl90eCwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKFRyYW5zYWN0aW9uLCAnX3R4JywgW1xuICAgICdvYmplY3RTdG9yZU5hbWVzJyxcbiAgICAnbW9kZSdcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKFRyYW5zYWN0aW9uLCAnX3R4JywgSURCVHJhbnNhY3Rpb24sIFtcbiAgICAnYWJvcnQnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIFVwZ3JhZGVEQihkYiwgb2xkVmVyc2lvbiwgdHJhbnNhY3Rpb24pIHtcbiAgICB0aGlzLl9kYiA9IGRiO1xuICAgIHRoaXMub2xkVmVyc2lvbiA9IG9sZFZlcnNpb247XG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbih0cmFuc2FjdGlvbik7XG4gIH1cblxuICBVcGdyYWRlREIucHJvdG90eXBlLmNyZWF0ZU9iamVjdFN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTdG9yZSh0aGlzLl9kYi5jcmVhdGVPYmplY3RTdG9yZS5hcHBseSh0aGlzLl9kYiwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKFVwZ3JhZGVEQiwgJ19kYicsIFtcbiAgICAnbmFtZScsXG4gICAgJ3ZlcnNpb24nLFxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoVXBncmFkZURCLCAnX2RiJywgSURCRGF0YWJhc2UsIFtcbiAgICAnZGVsZXRlT2JqZWN0U3RvcmUnLFxuICAgICdjbG9zZSdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gREIoZGIpIHtcbiAgICB0aGlzLl9kYiA9IGRiO1xuICB9XG5cbiAgREIucHJvdG90eXBlLnRyYW5zYWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbih0aGlzLl9kYi50cmFuc2FjdGlvbi5hcHBseSh0aGlzLl9kYiwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKERCLCAnX2RiJywgW1xuICAgICduYW1lJyxcbiAgICAndmVyc2lvbicsXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhEQiwgJ19kYicsIElEQkRhdGFiYXNlLCBbXG4gICAgJ2Nsb3NlJ1xuICBdKTtcblxuICAvLyBBZGQgY3Vyc29yIGl0ZXJhdG9yc1xuICAvLyBUT0RPOiByZW1vdmUgdGhpcyBvbmNlIGJyb3dzZXJzIGRvIHRoZSByaWdodCB0aGluZyB3aXRoIHByb21pc2VzXG4gIFsnb3BlbkN1cnNvcicsICdvcGVuS2V5Q3Vyc29yJ10uZm9yRWFjaChmdW5jdGlvbihmdW5jTmFtZSkge1xuICAgIFtPYmplY3RTdG9yZSwgSW5kZXhdLmZvckVhY2goZnVuY3Rpb24oQ29uc3RydWN0b3IpIHtcbiAgICAgIENvbnN0cnVjdG9yLnByb3RvdHlwZVtmdW5jTmFtZS5yZXBsYWNlKCdvcGVuJywgJ2l0ZXJhdGUnKV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIHJlcXVlc3QgPSAodGhpcy5fc3RvcmUgfHwgdGhpcy5faW5kZXgpW2Z1bmNOYW1lXS5hcHBseSh0aGlzLl9zdG9yZSwgYXJncy5zbGljZSgwLCAtMSkpO1xuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNhbGxiYWNrKHJlcXVlc3QucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIHBvbHlmaWxsIGdldEFsbFxuICBbSW5kZXgsIE9iamVjdFN0b3JlXS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgaWYgKENvbnN0cnVjdG9yLnByb3RvdHlwZS5nZXRBbGwpIHJldHVybjtcbiAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsID0gZnVuY3Rpb24ocXVlcnksIGNvdW50KSB7XG4gICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgdmFyIGl0ZW1zID0gW107XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICAgIGluc3RhbmNlLml0ZXJhdGVDdXJzb3IocXVlcnksIGZ1bmN0aW9uKGN1cnNvcikge1xuICAgICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaXRlbXMucHVzaChjdXJzb3IudmFsdWUpO1xuXG4gICAgICAgICAgaWYgKGNvdW50ICE9PSB1bmRlZmluZWQgJiYgaXRlbXMubGVuZ3RoID09IGNvdW50KSB7XG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgdmFyIGV4cCA9IHtcbiAgICBvcGVuOiBmdW5jdGlvbihuYW1lLCB2ZXJzaW9uLCB1cGdyYWRlQ2FsbGJhY2spIHtcbiAgICAgIHZhciBwID0gcHJvbWlzaWZ5UmVxdWVzdENhbGwoaW5kZXhlZERCLCAnb3BlbicsIFtuYW1lLCB2ZXJzaW9uXSk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHAucmVxdWVzdDtcblxuICAgICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAodXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICAgICAgdXBncmFkZUNhbGxiYWNrKG5ldyBVcGdyYWRlREIocmVxdWVzdC5yZXN1bHQsIGV2ZW50Lm9sZFZlcnNpb24sIHJlcXVlc3QudHJhbnNhY3Rpb24pKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbihkYikge1xuICAgICAgICByZXR1cm4gbmV3IERCKGRiKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwoaW5kZXhlZERCLCAnZGVsZXRlRGF0YWJhc2UnLCBbbmFtZV0pO1xuICAgIH1cbiAgfTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cDtcbiAgfVxuICBlbHNlIHtcbiAgICBzZWxmLmlkYiA9IGV4cDtcbiAgfVxufSgpKTsiXX0=
