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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiLCJhcHAvb3JtL1RyaXBzLmpzIiwiYXBwL29ybS9kYi5qcyIsIm5vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O1FDdU5nQixJLEdBQUEsSTs7QUF2TmhCOztJQUFZLEs7O0FBQ1o7O0lBQVksSzs7QUFDWjs7SUFBWSxJOzs7O0FBRVo7QUFDQSxJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsRUFBOEIsTUFBOUIsRUFBc0M7O0FBRXBDLE1BQUksWUFBWSxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBaEI7QUFDQSxNQUFJLFVBQVUsU0FBUyxjQUFULENBQXdCLFdBQXhCLENBQWQ7QUFDQSxVQUFRLFNBQVIsR0FBb0IsRUFBcEI7QUFDQSxZQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsQ0FBMUI7O0FBRUEsTUFBSSxlQUFlLEVBQW5CO0FBQ0EsTUFBSSxVQUFVLEVBQWQ7O0FBRUE7QUFDQSxTQUFPLE9BQVAsQ0FBZ0IsVUFBQyxLQUFELEVBQVc7QUFDekIsUUFBSSxlQUFlLE1BQ2hCLE1BRGdCLENBQ1QsVUFBQyxJQUFEO0FBQUEsYUFBVSxLQUFLLE9B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QWdCRDs7QUFFYyxTQUFTLEVBQVQsR0FBYzs7QUFFM0IsTUFBRyxPQUFPLElBQVYsRUFBZ0I7QUFDZCxVQUFNLGNBQU47QUFDRDs7QUFFRCxTQUFPLEdBQVA7QUFFRDs7O0FDekREO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0ICogYXMgU3RvcHMgZnJvbSAnLi9vcm0vU3RvcHMuanMnO1xuaW1wb3J0ICogYXMgVHJpcHMgZnJvbSAnLi9vcm0vVHJpcHMuanMnO1xuaW1wb3J0ICogYXMgSHR0cCBmcm9tICcuL2h0dHAuanMnO1xuXG4vLyBJbnRlcmFjdGl2ZSBlbGVtZW50cyBpbiB0aGUgcGFnZVxudmFyIGRlcGFydHVyZXMsIGFycml2YWxzLCBzdWJtaXRCdXR0b247XG5cbi8qIFxuICBBZGQgdGhlIG9wdGlvbnMgdG8gdGhlIGRhdGFsaXN0IGVsZW1lbnRzIGluIHRoZSBmb3JtLlxuKi9cbmZ1bmN0aW9uIGFkZFN0b3BzKHN0b3BzKSB7XG5cbiAgc3RvcHMuZm9yRWFjaCggKHN0b3ApID0+IHtcbiAgICBcbiAgICB2YXIgb3B0aW9uID0gYDxvcHRpb24gdmFsdWU9XCIke3N0b3Auc3RvcF9uYW1lfSAtICR7c3RvcC5zdG9wX2lkfVwiPjwvb3B0aW9uPmA7XG4gICAgZGVwYXJ0dXJlcy5pbm5lckhUTUwgKz0gb3B0aW9uO1xuICAgIGFycml2YWxzLmlubmVySFRNTCArPSBvcHRpb247XG5cbiAgfSk7XG5cbn1cblxuZnVuY3Rpb24gc2hvd1RyaXBUaW1lcyh0cmlwcywgcm91dGVzKSB7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb3V0ZS1yZXN1bHQnKTtcbiAgdmFyIHJlc3VsdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGltZXRhYmxlJyk7XG4gIHJlc3VsdHMuaW5uZXJIVE1MID0gJyc7XG4gIGNvbnRhaW5lci5zdHlsZS5vcGFjaXR5ID0gMTtcblxuICB2YXIgdW5pcXVlUm91dGVzID0gW107XG4gIHZhciBvcHRpb25zID0gW107XG5cbiAgLy8gR2V0IHRoZSB0aW1lcyBmb3IgZWFjaCByb3V0ZVxuICByb3V0ZXMuZm9yRWFjaCggKHJvdXRlKSA9PiB7XG4gICAgdmFyIHJvdXRlT3B0aW9ucyA9IHRyaXBzXG4gICAgICAuZmlsdGVyKCh0cmlwKSA9PiB0cmlwLnRyaXBfaWQgPT0gcm91dGUudHJpcF9pZCApXG4gICAgICAubWFwKCh0cmlwKSA9PiBgPG9wdGlvbiB2YWx1ZT1cIiR7dHJpcC50cmlwX2lkfVwiPiR7dHJpcC5hcnJpdmFsX3RpbWV9PC9vcHRpb24+YCk7XG5cbiAgICBvcHRpb25zW3JvdXRlLnJvdXRlX2lkXSArPSByb3V0ZU9wdGlvbnMuam9pbigpO1xuICB9KTtcblxuICAvLyBjcmVhdGUgaHRtbCBmb3IgZWFjaCByb3V0ZSwgYWRkaW5kIHRoZSB0aW1lcyBpbiBhIHNlbGVjdCBlbGVtZW50XG4gIHJvdXRlcy5mb3JFYWNoKCAocm91dGUsIGluZGV4KSA9PiB7XG4gICAgXG4gICAgaWYodW5pcXVlUm91dGVzLmluZGV4T2Yocm91dGUucm91dGVfaWQpID09IC0xKSB7XG4gICAgICAvLyBuZXcgcm91dGUhIVxuICAgICAgdW5pcXVlUm91dGVzLnB1c2gocm91dGUucm91dGVfaWQpO1xuICAgICAgdmFyIHJvdyA9IGA8ZGl2IGNsYXNzPVwicm93IHRhYmxlXCI+IFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zMyBjZWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICR7cm91dGUucm91dGVfaWR9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMzMgY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICAke3JvdXRlLnNlcnZpY2VfaWR9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj4gXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTMzIGNlbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdD4ke29wdGlvbnNbcm91dGUucm91dGVfaWRdfTwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+YDtcbiAgXG4gICAgICByZXN1bHRzLmlubmVySFRNTCArPSByb3c7XG4gICAgfVxuXG4gIH0pO1xuXG59XG5cbi8qXG4gIFNob3dzIGEgbWVzc2FnZSBpbiB0aGUgbWVzc2FnZS1ib3ggZWxlbWVudC5cbiovXG5mdW5jdGlvbiBzaG93SW5mb01lc3NhZ2UobWVzc2FnZSwgdHlwZSkge1xuXG4gIHZhciBtZXNzYWdlQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lc3NhZ2UtYm94Jyk7XG4gIG1lc3NhZ2VCb3guaW5uZXJIVE1MID0gbWVzc2FnZTtcblxuICBtZXNzYWdlQm94LmNsYXNzTmFtZSA9ICdhbGVydCc7XG4gIFxuICBzd2l0Y2godHlwZSkge1xuICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgIG1lc3NhZ2VCb3guY2xhc3NOYW1lICs9ICcgZXJyb3InO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIG1lc3NhZ2VCb3guY2xhc3NOYW1lICs9ICcgaW5mbyc7XG4gICAgICBicmVhazsgICAgXG4gIH1cblxufVxuXG4vKlxuICBNYWtlcyB0aGUgbWVzc2FnZS1ib3ggZWxlbWVudCBkaXNhcHBlYXIgdGhyb3VnaCBjc3MgY2xhc3NcbiovXG5mdW5jdGlvbiBjbGVhckluZm9NZXNzYWdlKCkge1xuICB2YXIgbWVzc2FnZUJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZXNzYWdlLWJveCcpO1xuICBtZXNzYWdlQm94LmNsYXNzTmFtZSA9ICdhbGVydCc7XG59XG5cblxuLypcbiAgUmVxdWVzdCB0aGUgc3RvcHMgZnJvbSBzZXJ2ZXIgYW5kIGFkZCB0aGVtIHRvIGFuIGFycmF5XG4gIHRvIGJlIGFibGUgdG8gY2hlY2sgdGhhdCB0aGUgdXNlciBpbnB1dCBpcyB2YWxpZC5cbiovXG5mdW5jdGlvbiBsb2FkU3RvcHMoKSB7XG5cbiAgU3RvcHMuZ2V0QWxsKCkudGhlbihhZGRTdG9wcyk7XG5cbn07XG5cbi8qXG4gIEdldCB0aGUgc3RhdGlvbiBjb2RlIGZyb20gYSBzdHJpbmdcbiovXG5mdW5jdGlvbiBnZXRTdGF0aW9uQ29kZShzdGF0aW9uKSB7XG5cbiAgdmFyIHBhcnRzID0gc3RhdGlvbi5zcGxpdCgnLScpO1xuICBcbiAgaWYocGFydHMubGVuZ3RoID4gMSkge1xuICAgIC8vIFRoaXMgY291bGQgYmUgYSBzdHJpbmcgZnJvbSB0aGUgZGF0YWxpc3QsIGV4dHJhY3QgdGhlIGNvZGVcbiAgICByZXR1cm4gcGFydHNbMV0udHJpbSgpO1xuICB9IFxuXG4gIC8vIFRoaXMgY291bGQgYmUgYSBjb2RlIHdyaXR0ZW4gYnkgdGhlIHVzZXJcbiAgcmV0dXJuIHN0YXRpb247XG4gIFxufVxuXG4vKlxuICBDaGVjayB0aGF0IGEgY29kZSBpcyBlaXRoZXIgYSBwYWlyIHN0YXRpb24gbmFtZSAtIHN0YXRpb24gY29kZSBcbiAgZnJvbSB0aGUgZm9ybSBkYXRhbGlzdCBvciBhIGNvZGUgb2YgYSBzdG9wIHdyaXR0ZW4gYnkgdGhlIHVzZXIuXG4qL1xuZnVuY3Rpb24gY2hlY2tTdGF0aW9uKHN0YXRpb24pIHtcblxuICB2YXIgY29kZSA9IGdldFN0YXRpb25Db2RlKHN0YXRpb24pO1xuXG4gIC8vIENoZWNrIHRoYXQgdGhlIGNvZGUgaXMgaW4gdGhlIGxpc3Qgb2Ygc3RvcHNcbiAgcmV0dXJuIFN0b3BzLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oc3RvcHMpe1xuICAgIHJldHVybiBzdG9wcy5zb21lKGZ1bmN0aW9uIGNoZWNrKHN0b3ApIHtcbiAgICAgIHJldHVybiBzdG9wLnN0b3BfaWQgPT0gY29kZTtcbiAgICB9KTtcbiAgfSk7XG5cbn1cblxuZnVuY3Rpb24gZmluZE1hdGNoaW5nVHJpcHMoZGVwYXJ0dXJlVGltZXMsIGFycml2YWxUaW1lcykge1xuXG4gIC8vIGdldHMgYWxsIHRyaXBzIHRoYXQgZ29lcyB0byB0aGUgZGVwYXJ0dXJlIHN0b3AgYW5kIHRoZSBhcnJpdmFsIHN0b3BcbiAgdmFyIHZhbGlkVHJpcHMgPSBkZXBhcnR1cmVUaW1lcy5maWx0ZXIoZnVuY3Rpb24oZGVwYXJ0dXJlVHJpcCl7XG4gICAgcmV0dXJuIGFycml2YWxUaW1lcy5zb21lKGZ1bmN0aW9uKGFycml2YWxUcmlwKXtcbiAgICAgIHJldHVybiBhcnJpdmFsVHJpcC50cmlwX2lkID09IGRlcGFydHVyZVRyaXAudHJpcF9pZDtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHZhbGlkVHJpcHM7XG59XG5cbi8qXG4gIEZpbmRzIHRyaXBzIGJldHdlZW4gdHdvIHN0YXRpb25zLCByZXR1cm5zIHRoZSB0cmlwcyBpZHNcbiovXG5mdW5jdGlvbiBmaW5kVHJpcHMoZGVwYXJ0dXJlSWQsIGFycml2YWxJZCkge1xuXG4gIHJldHVybiBQcm9taXNlLmFsbChbVHJpcHMuZ2V0VHJpcFN0b3BUaW1lcyhkZXBhcnR1cmVJZCksIFRyaXBzLmdldFRyaXBTdG9wVGltZXMoYXJyaXZhbElkKV0pLnRoZW4oXG4gICAgICBmdW5jdGlvbihbZGVwYXJ0dXJlVGltZXMsIGFycml2YWxUaW1lc10pIHtcbiAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZygnRm91bmQgcm91dGVzIScsIGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpO1xuICAgICAgICB2YXIgdHJpcHMgPSBmaW5kTWF0Y2hpbmdUcmlwcyhkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzKTtcblxuICAgICAgICByZXR1cm4ge3RyaXBzOiB0cmlwcywgcm91dGVzOiBUcmlwcy5nZXRSb3V0ZXNGb3JUcmlwcyh0cmlwcyl9O1xuXG4gICAgICB9KTtcblxufVxuXG4vKlxuICBTdWJtaXQgdGhlIHVzZXIgc2VsZWN0aW9uIGFuZCBzaG93IHRoZSByb3V0ZSBpZiBhdmFpbGFibGUgb3IgYW5cbiAgZXJyb3IgbWVzc2FnZSBpZiBubyByb3V0ZSBpcyBhdmFpbGFibGUuXG4qL1xuZnVuY3Rpb24gc3VibWl0U3RhdGlvbnMoZXZ0KSB7XG5cbiAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gIGNsZWFySW5mb01lc3NhZ2UoKTtcbiAgXG4gIC8vIGdldCB0aGUgaW5wdXRzIHZhbHVlc1xuICB2YXIgZGVwYXJ0dXJlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGFydHVyZScpLnZhbHVlO1xuICB2YXIgYXJyaXZhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcnJpdmFsJykudmFsdWU7XG5cbiAgUHJvbWlzZS5hbGwoW2NoZWNrU3RhdGlvbihkZXBhcnR1cmUpLCBjaGVja1N0YXRpb24oYXJyaXZhbCldKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgXG4gICAgaWYoIXJlc3VsdFswXSB8fCAhcmVzdWx0WzFdKSB7XG4gICAgICBzaG93SW5mb01lc3NhZ2UoXG4gICAgICAgICdZb3UgaGF2ZSB0byBzZWxlY3QgYSB2YWxpZCBkZXBhcnR1cmUgYW5kIGFycml2YWwgc3RhdGlvbnMgZnJvbSB0aGUgbGlzdHMgb3Igd3JpdGUgYSB2YWxpZCBzdG9wIGNvZGUuJyxcbiAgICAgICAgJ2Vycm9yJ1xuICAgICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvLyBJZiB0aGUgZGVwYXJ0dXJlIGFuZCBhcnJpdmFsIHN0YXRpb25zIGFyZSBjb3JyZWN0XG4gICAgLy8gc2VhcmNoIGZvciBhIHRyaXAgYmV0d2VlbiB0aGVtIGFuZCBzaG93IHRoZSB0aW1lcyBhbmQgcm91dGVcbiAgICBmaW5kVHJpcHMoZ2V0U3RhdGlvbkNvZGUoZGVwYXJ0dXJlKSwgZ2V0U3RhdGlvbkNvZGUoYXJyaXZhbCkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgICBkYXRhLnJvdXRlcy50aGVuKGZ1bmN0aW9uKHJvdXRlcyl7XG4gICAgICAgICAgaWYocm91dGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNob3dUcmlwVGltZXMoZGF0YS50cmlwcywgcm91dGVzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdXZSBjb3VsZG5cXCd0IGZpbmQgYSB0cmlwIGJldHdlZW4gdGhlc2UgdHdvIHN0YXRpb25zJywgJ2Vycm9yJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgfSlcblxuXG59XG5cbi8qXG4gIEluaXRpYWxpemUgdGhlIGFwcGxpY2F0aW9uIFxuKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xuXG4gIC8vIGdldCB0aGUgaW50ZXJhY3RpdmUgZWxlbWVudHMgb2YgdGhlIGludGVyZmFjZVxuICBkZXBhcnR1cmVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGFydHVyZS1zdG9wcycpO1xuICBhcnJpdmFscyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcnJpdmFsLXN0b3BzJyk7XG4gIHN1Ym1pdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2gnKTtcblxuICAvLyBQb3B1bGF0ZSBkYXRhbGlzdHMgYW5kIGFkZCBsaXN0ZW5lcnNcbiAgbG9hZFN0b3BzKCk7XG4gIHN1Ym1pdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHN1Ym1pdFN0YXRpb25zKTtcblxufTtcbiIsImNvbnN0IGJhc2VVcmwgICAgICAgPSAnL2Rpc3QvZGF0YS8nO1xuY29uc3Qgcm91dGVzRmlsZSAgICA9ICdyb3V0ZXMudHh0JztcbmNvbnN0IHRyaXBzRmlsZSAgICAgPSAndHJpcHMudHh0JztcbmNvbnN0IHN0b3BzRmlsZSAgICAgPSAnc3RvcHMudHh0JztcbmNvbnN0IHN0b3BUaW1lc0ZpbGUgPSAnc3RvcF90aW1lcy50eHQnO1xuXG5jb25zdCBjc3ZUb0FycmF5ID0gZnVuY3Rpb24odGV4dCkge1xuICBcbiAgdmFyIHJvd3MgPSB0ZXh0LnRyaW0oKS5zcGxpdCgnXFxuJyk7XG4gIHJldHVybiByb3dzLm1hcCgocm93KSA9PiByb3cuc3BsaXQoJywnKSk7XG5cbn07XG5cbmNvbnN0IGNzdlRvT2JqZWN0cyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICB2YXIgdGFibGUgPSBjc3ZUb0FycmF5KHRleHQpO1xuICB2YXIga2V5cyA9IHRhYmxlWzBdO1xuICB0YWJsZSA9IHRhYmxlLnNsaWNlKDEpO1xuXG4gIHJldHVybiB0YWJsZS5tYXAoZnVuY3Rpb24ocm93KSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXksIGluZGV4KSB7XG4gICAgICBvYmpba2V5XSA9IHJvd1tpbmRleF07XG4gICAgfSk7XG4gICAgcmV0dXJuICBvYmo7XG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGdldENzdkFzT2JqZWN0cyh1cmwpIHtcblxuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXG4gICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuXG4gICAgfSkudGhlbihmdW5jdGlvbih0ZXh0Q29udGVudCkge1xuXG4gICAgICByZXR1cm4gY3N2VG9PYmplY3RzKHRleHRDb250ZW50KTtcblxuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICB9KTtcbn1cblxuLy8gQVBJXG5cbi8qXG4gIFJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgd2l0aCB0aGUgbmFtZXMgb2YgdGhlIFxuICBhdmFpbGFibGUgbGluZXMuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIHJvdXRlcygpIHtcblxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyByb3V0ZXNGaWxlKTtcblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRyaXBzKCkge1xuICAvLyBnZXQgdGhlIHJvdXRlL2xpbmUgYW5kIHJldHVybiB0aGUgdGltZXMgZm9yIHRoaXMgbGluZVxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyB0cmlwc0ZpbGUpO1xuXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gc3RvcHMoKSB7XG4gIC8vIHJldHVybnMgdGhlIHN0b3BzIG9mIHRoaXMgbGluZVxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyBzdG9wc0ZpbGUpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BUaW1lcygpIHtcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc3RvcFRpbWVzRmlsZSk7IFxufTtcbiIsImltcG9ydCAqIGFzIEFwcCBmcm9tICcuL2FwcC5qcyc7XG5cbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0Jztcbi8qZnVuY3Rpb24gcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xuXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xuXG4gICAgdmFyIGluZGV4Q29udHJvbGxlciA9IHRoaXM7XG5cbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignL3N3LmpzJykudGhlbihmdW5jdGlvbihyZWcpIHtcbiAgICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuY29udHJvbGxlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChyZWcud2FpdGluZykge1xuICAgICAgICBpbmRleENvbnRyb2xsZXIuX3VwZGF0ZVJlYWR5KHJlZy53YWl0aW5nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVnLmluc3RhbGxpbmcpIHtcbiAgICAgICAgaW5kZXhDb250cm9sbGVyLl90cmFja0luc3RhbGxpbmcocmVnLmluc3RhbGxpbmcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlZy5hZGRFdmVudExpc3RlbmVyKCd1cGRhdGVmb3VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpbmRleENvbnRyb2xsZXIuX3RyYWNrSW5zdGFsbGluZyhyZWcuaW5zdGFsbGluZyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIEVuc3VyZSByZWZyZXNoIGlzIG9ubHkgY2FsbGVkIG9uY2UuXG4gICAgLy8gVGhpcyB3b3JrcyBhcm91bmQgYSBidWcgaW4gXCJmb3JjZSB1cGRhdGUgb24gcmVsb2FkXCIuXG4gICAgdmFyIHJlZnJlc2hpbmc7XG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignY29udHJvbGxlcmNoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJlZnJlc2hpbmcpIHJldHVybjtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgIHJlZnJlc2hpbmcgPSB0cnVlO1xuICAgIH0pO1xuICB9OyovXG5cbiAgZnVuY3Rpb24gcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xuXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xuXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy4vZGlzdC9qcy9zZXJ2aWNlX3dvcmtlci5qcycpLnRoZW4oZnVuY3Rpb24ocmVnKSB7XG4gICAgICBjb25zb2xlLmxvZygnUmVnaXN0cmF0aW9uIHdvcmtlZCEnLCByZWcpO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZygnUmVnaXN0cmF0aW9uIGZhaWxlZCEnLCBlcnJvcik7XG4gICAgfSk7XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWR5KCkge1xuICAgICAgXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAvLyByZXNvbHZlIHRoZSBwcm9taXNlIHdoZW4gdGhlIGRvY3VtZW50IGlzIHJlYWR5XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdyZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKGRvY3VtZW50LnJlYWR5U3RhdGUgIT09ICdsb2FkaW5nJykge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9KTtcblxuICB9O1xuXG4gIHJlYWR5KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICBBcHAuaW5pdCgpO1xuICAgIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpO1xuICB9KTtcblxufSkoKTsiLCJpbXBvcnQgKiBhcyBIdHRwIGZyb20gJy4uL2h0dHAuanMnO1xuaW1wb3J0IGlkYiBmcm9tICcuL2RiLmpzJztcblxuLy8gSWYgaW5kZXhlZERCIGlzIHBvcHVsYXRlZCwgZ2V0IHRoZSBkYXRhIGFuZCB0cnkgdG8gdXBkYXRlIGZyb20gbmV0d29ya1xuLy8gZWxzZSB0cnkgdG8gZ2V0IHRoZSBkYXRhIGZyb20gbmV0d29yayBhbmQgc2F2ZSBpdFxuLy8gZWxzZSB3ZSBzaG91bGQgc2hvdyBhIGN1c3RvbSBlcnJvciBtZXNzYWdlIHRvIHRoZSB1c2VyLCB0aGUgYXBwIGlzIG5vdGEgYXZhaWxhYmxlLlxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbCgpIHtcblxuICByZXR1cm4gSHR0cC5zdG9wcygpLnRoZW4oZnVuY3Rpb24gZ2V0U3RvcHNGcm9tTmV0d29yayhyZXN1bHRzKXtcblxuICAgIGlmKCFyZXN1bHRzKSB7XG5cbiAgICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uIGdldFN0b3BzRnJvbUlEQihkYil7XG5cbiAgICAgICAgaWYoIWRiKSB0aHJvdyAnU3RvcHMgZGF0YSBpcyBub3QgYXZhaWxhYmxlLic7XG5cbiAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3N0b3BzJyk7XG4gICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcHMnKS5nZXRBbGwoKTtcbiAgICAgIFxuICAgICAgfSk7XG4gICAgICBcbiAgICB9XG5cbiAgICAvLyBJZiBJIGdldCByZXN1bHRzIHN0b3JlIHRoZSByZXN1bHQgaW4gaW5kZXhlZERCXG4gICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gc3RvcmVTdG9wc0luSURCKGRiKXtcblxuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3N0b3BzJywgJ3JlYWR3cml0ZScpO1xuICAgICAgdmFyIHN0b3BzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcHMnKTtcblxuICAgICAgcmVzdWx0cy5mb3JFYWNoKCBmdW5jdGlvbihzdG9wKSB7XG4gICAgICAgIHN0b3BzU3RvcmUucHV0KHN0b3ApO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21wbGV0ZTtcblxuICAgIH0pLnRoZW4oZnVuY3Rpb24gdHJhbnNhY3Rpb25Db21wbGV0ZWQoKXtcblxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG5cbiAgICB9KTtcblxuICB9KTtcblxufVxuXG5cbiIsImltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi4vaHR0cC5qcyc7XG5pbXBvcnQgaWRiIGZyb20gJy4vZGIuanMnO1xuXG4gIC8qXG4gICAgVGhpcyBmdW5jdGlvbiBjaGVja3MgdGhhdCB0aGUgZGF0YSBpcyBpbiBJbmRleGVkREIsIGlmIG5vdCwgaXQgZ2V0cyBpdCBmcm9tIG5ldHdvcmsvY2FjaGVcbiAgICBhbmQgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBkYXRhIGlzIHN0b3JlZCBpbiBJREIuXG4gICAgVGhpcyB3YXkgd2UgZG9uJ3QgbmVlZCBhbnkgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb24sIGp1c3QgY2FsbCB0aGlzIGZ1bmN0aW9uIGluIGVhY2ggcmV0cmlldmluZ1xuICAgIG1ldGhvZCBhbmQgaXQgd2lsbCBnZXQgc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgc2V0IHVwIGJlZm9yZSB0cnlpbmcgdG8gZ2V0IHRoZSBjb250ZW50LlxuICAqL1xuICBmdW5jdGlvbiBzZXRUcmlwcygpIHtcblxuICAgIHJldHVybiBpZGIoKS50aGVuKGRiID0+IHtcblxuICAgICAgaWYoIWRiKSB0aHJvdyAnV2UgY291bGRuXFwndCBhY2Nlc3MgSW5kZXhlZERCJztcblxuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3RyaXBzJyk7XG4gICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICByZXR1cm4gdHJpcHNTdG9yZS5jb3VudCgpO1xuXG4gICAgfSkudGhlbihyZXN1bHQgPT4ge1xuXG4gICAgICAvLyBpZiB0aGVyZSBpcyBzb21ldGhpbmcgaW4gdGhlIGRiLCBkb24ndCBib3RoZXIgaW4gZ2V0dGluZyB0aGUgZGF0YSBhZ2FpbiBmcm9tIG5ldHdvcmtcbiAgICAgIGlmKHJlc3VsdCA+IDApIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGVyZSBpcyBub3RoaW5nIGluIHRoZSB0cmlwcyBhbmQgdGltZXMgdGFibGUsIGZpbGwgdGhlbSFcbiAgICAgIHJldHVybiBIdHRwLnN0b3BUaW1lcygpXG4gICAgICAgIC50aGVuKHN0b3JlU3RvcFRpbWVzKVxuICAgICAgICAudGhlbihIdHRwLnRyaXBzKVxuICAgICAgICAudGhlbihzdG9yZVRyaXBzKTtcblxuICAgIH0pO1xuXG5cbiAgfVxuXG5cbiAgZnVuY3Rpb24gc3RvcmVTdG9wVGltZXMocmVzdWx0cykge1xuXG4gICAgaWYocmVzdWx0cykgeyBcblxuICAgICAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBzdG9yZVRyaXBzSW5JREIoZGIpe1xuXG4gICAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3N0b3BfdGltZXMnLCAncmVhZHdyaXRlJyk7XG4gICAgICAgICAgdmFyIHRyaXBzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcF90aW1lcycpO1xuXG4gICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKCBmdW5jdGlvbih0cmlwKSB7XG4gICAgICAgICAgICB0cmlwc1N0b3JlLnB1dCh0cmlwKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21wbGV0ZTtcblxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuXG4gICAgICAgICAgLy8gdGhlIHRyYW5zYWN0aW9uIGRpZG4ndCBjb21wbGV0ZSwgc28gdGhlIHRhYmxlIHNob3VsZCBiZSBlbXB0eVxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gIH1cblxuICBmdW5jdGlvbiBzdG9yZVRyaXBzKHJlc3VsdHMpIHtcblxuICAgIGlmKHJlc3VsdHMpIHsgXG5cbiAgICAgICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24gc3RvcmVUcmlwc0luSURCKGRiKXtcblxuICAgICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCd0cmlwcycsICdyZWFkd3JpdGUnKTtcbiAgICAgICAgICB2YXIgdHJpcHNTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKCBmdW5jdGlvbih0cmlwKSB7XG4gICAgICAgICAgICB0cmlwc1N0b3JlLnB1dCh0cmlwKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21wbGV0ZTtcblxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuXG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgfVxuXG4gIC8vIElmIGluZGV4ZWREQiBpcyBwb3B1bGF0ZWQsIGdldCB0aGUgZGF0YSBhbmQgdHJ5IHRvIHVwZGF0ZSBmcm9tIG5ldHdvcmtcbiAgLy8gZWxzZSB0cnkgdG8gZ2V0IHRoZSBkYXRhIGZyb20gbmV0d29yayBhbmQgc2F2ZSBpdFxuICAvLyBlbHNlIHdlIHNob3VsZCBzaG93IGEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgdG8gdGhlIHVzZXIsIHRoZSBhcHAgaXMgbm90YSBhdmFpbGFibGUuXG5cbiAgLypcbiAgICBHZXQgdGhlIHRyaXBzIHRoYXQgc3RvcCBhdCBzdG9wX2lkLCBvbmUgcGVyIHJvdXRlLCBpbmRlcGVuZGVudGx5IG9mIHN0b3AgdGltZXNcbiAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldFJvdXRlc0ZvclN0b3Aoc3RvcF9pZCkge1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJpcHNTdG9wVGltZXMoc3RvcF9pZClcbiAgICAgIC50aGVuKCk7XG5cbiAgfTtcblxuICBleHBvcnQgZnVuY3Rpb24gZ2V0Um91dGVzRm9yVHJpcHModHJpcHMpIHtcblxuICAgIHZhciB0cmlwX2lkcyA9IFtdO1xuICAgIHRyaXBzLmZvckVhY2goZnVuY3Rpb24gZ2V0VW5pcXVlVHJpcElkcyh0cmlwKSB7XG4gICAgICBpZih0cmlwX2lkcy5pbmRleE9mKHRyaXAudHJpcF9pZCkgPT0gLTEpIHtcbiAgICAgICAgdHJpcF9pZHMucHVzaCh0cmlwLnRyaXBfaWQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gZ2V0IHRoZSByb3V0ZXMgZm9yIHRoaXMgdHJpcHNcbiAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbiBnZXRBbGxSb3V0ZXMoZGIpIHtcbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCd0cmlwcycpO1xuICAgICAgdmFyIHRyaXBTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCd0cmlwcycpO1xuXG4gICAgICB2YXIgcm91dGVzID0gW107XG4gICAgICB0cmlwcy5mb3JFYWNoKGZ1bmN0aW9uIGFwcGVuZFRyaXBQcm9taXNlKHRyaXApIHtcblxuICAgICAgICByb3V0ZXMucHVzaCh0cmlwU3RvcmUuZ2V0KHRyaXAudHJpcF9pZCkpO1xuXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJvdXRlcyk7XG4gICAgICBcbiAgICB9KTtcblxuICB9O1xuXG4gIC8qXG4gICAgR2V0IGFsbCB0aGUgdGltZXMgZm9yIGEgc3RvcFxuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0VHJpcFN0b3BUaW1lcyhzdG9wX2lkKSB7XG5cbiAgICByZXR1cm4gc2V0VHJpcHMoKVxuICAgICAgLnRoZW4oKCkgPT4gaWRiKCkpXG4gICAgICAudGhlbihmdW5jdGlvbiBnZXRUcmlwc0ZvclN0b3AoZGIpe1xuXG4gICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wX3RpbWVzJyk7XG4gICAgICAgIHZhciB0cmlwc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BfdGltZXMnKTtcbiAgICAgICAgdmFyIHN0b3BJbmRleCA9IHRyaXBzU3RvcmUuaW5kZXgoJ3N0b3AnKTtcblxuICAgICAgICByZXR1cm4gc3RvcEluZGV4LmdldEFsbChzdG9wX2lkKTtcbiAgICAgIH0pO1xuXG4gIH07XG5cbiAgLypcbiAgICBHZXQgYWxsIHRoZSB0cmlwcyBmb3IgYSByb3V0ZVxuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0VHJpcHNGb3JSb3V0ZShyb3V0ZV9pZCkge1xuXG4gIH07XG5cbiAgLypcbiAgICBHZXQgYWxsIHRoZSBzdG9wcyBmb3IgYSByb3V0ZVxuICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZ2V0U3RvcHNGb3JSb3V0ZShyb3V0ZV9pZCkge1xuXG4gIH07XG4iLCJpbXBvcnQgaWRiIGZyb20gJy4uLy4uL25vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyc7XG5cbnZhciBfZGI7XG5cbi8vIFRoaXMgY2xhc3Mgd29ya3MgYXMgYSBPUk0gdGhhdCBnZXRzIHRoZSBkYXRhIGZyb20gaW5kZXhlZERCXG5mdW5jdGlvbiBvcGVuRGF0YWJhc2UoKSB7XG4gIFxuICByZXR1cm4gaWRiLm9wZW4oJ3RyYWlucycsIDEsIGZ1bmN0aW9uKHVwZ3JhZGVEYikge1xuICAgIFxuICAgIHN3aXRjaCh1cGdyYWRlRGIub2xkVmVyc2lvbikge1xuICAgIFxuICAgICAgY2FzZSAwOlxuICAgICAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3N0b3BzJywge1xuICAgICAgICAgIGtleVBhdGg6ICdzdG9wX2lkJ1xuICAgICAgICB9KTtcblxuICAgICAgICB1cGdyYWRlRGIuY3JlYXRlT2JqZWN0U3RvcmUoJ3RyaXBzJywge2tleVBhdGg6ICd0cmlwX2lkJ30pO1xuXG4gICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgnc3RvcF90aW1lcycsIHthdXRvSW5jcmVtZW50OiB0cnVlfSk7XG5cbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdyb3V0ZXMnLCB7XG4gICAgICAgICAga2V5UGF0aDogJ3JvdXRlX2lkJ1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdHJpcFN0b3JlID0gdXBncmFkZURiLnRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdzdG9wX3RpbWVzJyk7XG4gICAgICAgIHRyaXBTdG9yZS5jcmVhdGVJbmRleCgnc3RvcCcsICdzdG9wX2lkJyk7XG4gICAgICAgIHRyaXBTdG9yZS5jcmVhdGVJbmRleCgndHJpcCcsICd0cmlwX2lkJyk7XG5cbiAgICB9XG4gIH0pO1xuXG4gIGRiUHJvbWlzZSA9IGlkYi5vcGVuKCd0ZXN0LWRiJywgNCwgZnVuY3Rpb24odXBncmFkZURiKSB7XG4gIHN3aXRjaCh1cGdyYWRlRGIub2xkVmVyc2lvbikge1xuICAgIGNhc2UgMDpcbiAgICAgIHZhciBrZXlWYWxTdG9yZSA9IHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgna2V5dmFsJyk7XG4gICAgICBrZXlWYWxTdG9yZS5wdXQoXCJ3b3JsZFwiLCBcImhlbGxvXCIpO1xuICAgIGNhc2UgMTpcbiAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncGVvcGxlJywgeyBrZXlQYXRoOiAnbmFtZScgfSk7XG4gICAgY2FzZSAyOlxuICAgICAgdmFyIHBlb3BsZVN0b3JlID0gdXBncmFkZURiLnRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKCdwZW9wbGUnKTtcbiAgICAgIHBlb3BsZVN0b3JlLmNyZWF0ZUluZGV4KCdhbmltYWwnLCAnZmF2b3JpdGVBbmltYWwnKTtcbiAgICBjYXNlIDM6XG4gICAgICBwZW9wbGVTdG9yZSA9IHVwZ3JhZGVEYi50cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgncGVvcGxlJyk7XG4gICAgICBwZW9wbGVTdG9yZS5jcmVhdGVJbmRleCgnYWdlJywgJ2FnZScpO1xuICB9XG59KTtcblxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkYigpIHtcbiAgXG4gIGlmKF9kYiA9PSBudWxsKSB7XG4gICAgX2RiID0gb3BlbkRhdGFiYXNlKCk7XG4gIH0gXG5cbiAgcmV0dXJuIF9kYjtcblxufTsiLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gdG9BcnJheShhcnIpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVxdWVzdC5yZXN1bHQpO1xuICAgICAgfTtcblxuICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciByZXF1ZXN0O1xuICAgIHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0ID0gb2JqW21ldGhvZF0uYXBwbHkob2JqLCBhcmdzKTtcbiAgICAgIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0pO1xuXG4gICAgcC5yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICByZXR1cm4gcDtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKTtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgcC5yZXF1ZXN0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UHJvcGVydGllcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm94eUNsYXNzLnByb3RvdHlwZSwgcHJvcCwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXS5hcHBseSh0aGlzW3RhcmdldFByb3BdLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoSW5kZXgsICdfaW5kZXgnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnbXVsdGlFbnRyeScsXG4gICAgJ3VuaXF1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ2dldCcsXG4gICAgJ2dldEtleScsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XG4gICAgdGhpcy5fY3Vyc29yID0gY3Vyc29yO1xuICAgIHRoaXMuX3JlcXVlc3QgPSByZXF1ZXN0O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEN1cnNvciwgJ19jdXJzb3InLCBbXG4gICAgJ2RpcmVjdGlvbicsXG4gICAgJ2tleScsXG4gICAgJ3ByaW1hcnlLZXknLFxuICAgICd2YWx1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXG4gICAgJ3VwZGF0ZScsXG4gICAgJ2RlbGV0ZSdcbiAgXSk7XG5cbiAgLy8gcHJveHkgJ25leHQnIG1ldGhvZHNcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIGlmICghKG1ldGhvZE5hbWUgaW4gSURCQ3Vyc29yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICBDdXJzb3IucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3QoY3Vyc29yLl9yZXF1ZXN0KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcbiAgfVxuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5jcmVhdGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuY3JlYXRlSW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5pbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdpbmRleE5hbWVzJyxcbiAgICAnYXV0b0luY3JlbWVudCdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ3B1dCcsXG4gICAgJ2FkZCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2NsZWFyJyxcbiAgICAnZ2V0JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ2RlbGV0ZUluZGV4J1xuICBdKTtcblxuICBmdW5jdGlvbiBUcmFuc2FjdGlvbihpZGJUcmFuc2FjdGlvbikge1xuICAgIHRoaXMuX3R4ID0gaWRiVHJhbnNhY3Rpb247XG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QoaWRiVHJhbnNhY3Rpb24uZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIFRyYW5zYWN0aW9uLnByb3RvdHlwZS5vYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fdHgub2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fdHgsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhUcmFuc2FjdGlvbiwgJ190eCcsIFtcbiAgICAnb2JqZWN0U3RvcmVOYW1lcycsXG4gICAgJ21vZGUnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhUcmFuc2FjdGlvbiwgJ190eCcsIElEQlRyYW5zYWN0aW9uLCBbXG4gICAgJ2Fib3J0J1xuICBdKTtcblxuICBmdW5jdGlvbiBVcGdyYWRlREIoZGIsIG9sZFZlcnNpb24sIHRyYW5zYWN0aW9uKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgICB0aGlzLm9sZFZlcnNpb24gPSBvbGRWZXJzaW9uO1xuICAgIHRoaXMudHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24pO1xuICB9XG5cbiAgVXBncmFkZURCLnByb3RvdHlwZS5jcmVhdGVPYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fZGIuY3JlYXRlT2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhVcGdyYWRlREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKFVwZ3JhZGVEQiwgJ19kYicsIElEQkRhdGFiYXNlLCBbXG4gICAgJ2RlbGV0ZU9iamVjdFN0b3JlJyxcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIERCKGRiKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgfVxuXG4gIERCLnByb3RvdHlwZS50cmFuc2FjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24odGhpcy5fZGIudHJhbnNhY3Rpb24uYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhEQiwgJ19kYicsIFtcbiAgICAnbmFtZScsXG4gICAgJ3ZlcnNpb24nLFxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdjbG9zZSdcbiAgXSk7XG5cbiAgLy8gQWRkIGN1cnNvciBpdGVyYXRvcnNcbiAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgb25jZSBicm93c2VycyBkbyB0aGUgcmlnaHQgdGhpbmcgd2l0aCBwcm9taXNlc1xuICBbJ29wZW5DdXJzb3InLCAnb3BlbktleUN1cnNvciddLmZvckVhY2goZnVuY3Rpb24oZnVuY05hbWUpIHtcbiAgICBbT2JqZWN0U3RvcmUsIEluZGV4XS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGVbZnVuY05hbWUucmVwbGFjZSgnb3BlbicsICdpdGVyYXRlJyldID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciByZXF1ZXN0ID0gKHRoaXMuX3N0b3JlIHx8IHRoaXMuX2luZGV4KVtmdW5jTmFtZV0uYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3Muc2xpY2UoMCwgLTEpKTtcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBwb2x5ZmlsbCBnZXRBbGxcbiAgW0luZGV4LCBPYmplY3RTdG9yZV0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgIGlmIChDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsKSByZXR1cm47XG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb3VudCkge1xuICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgIHZhciBpdGVtcyA9IFtdO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICBpbnN0YW5jZS5pdGVyYXRlQ3Vyc29yKHF1ZXJ5LCBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0ZW1zLnB1c2goY3Vyc29yLnZhbHVlKTtcblxuICAgICAgICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zLmxlbmd0aCA9PSBjb3VudCkge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIHZhciBleHAgPSB7XG4gICAgb3BlbjogZnVuY3Rpb24obmFtZSwgdmVyc2lvbiwgdXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ29wZW4nLCBbbmFtZSwgdmVyc2lvbl0pO1xuICAgICAgdmFyIHJlcXVlc3QgPSBwLnJlcXVlc3Q7XG5cbiAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgICAgIHVwZ3JhZGVDYWxsYmFjayhuZXcgVXBncmFkZURCKHJlcXVlc3QucmVzdWx0LCBldmVudC5vbGRWZXJzaW9uLCByZXF1ZXN0LnRyYW5zYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEQihkYik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ2RlbGV0ZURhdGFiYXNlJywgW25hbWVdKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBleHA7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2VsZi5pZGIgPSBleHA7XG4gIH1cbn0oKSk7Il19
