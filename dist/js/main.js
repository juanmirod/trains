(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;

var _Stops = require('./orm/Stops.js');

var Stops = _interopRequireWildcard(_Stops);

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

  return Http.stopTimes().then(function (result) {

    var departureTimes = result.filter(function (time) {
      return time.stop_id == departureId;
    });

    var arrivalTimes = result.filter(function (time) {
      return time.stop_id == arrivalId;
    });

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

},{"./http.js":2,"./orm/Stops.js":4}],2:[function(require,module,exports){
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

    navigator.serviceWorker.register('/dist/js/service_worker.js').then(function () {
      console.log('Registration worked!');
    }).catch(function () {
      console.log('Registration failed!');
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

  return Http.stops().then(function (results) {

    if (!results) {

      return (0, _db2.default)().then(function (db) {
        var transaction = db.transaction('stops');
        return transaction.objectStore('stops').getAll();
      });
    }

    // If I get results store the result in indexedDB
    return (0, _db2.default)().then(function (db) {

      var transaction = db.transaction('stops', 'readwrite');
      var stopsStore = transaction.objectStore('stops');

      results.forEach(function (stop) {
        stopsStore.put(stop);
      });

      return transaction.complete;
    }).then(function () {

      return results;
    });
  });
}

},{"../http.js":2,"./db.js":5}],5:[function(require,module,exports){
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
    var store = upgradeDb.createObjectStore('stops', {
      keyPath: 'stop_id'
    });

    var store = upgradeDb.createObjectStore('trips', {
      keyPath: 'trip_id'
    });

    var store = upgradeDb.createObjectStore('routes', {
      keyPath: 'route_id'
    });
  });
}

function db() {

  if (_db == null) {
    _db = openDatabase();
  }

  return _db;
};

},{"../../node_modules/idb/lib/idb.js":6}],6:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiLCJhcHAvb3JtL2RiLmpzIiwibm9kZV9tb2R1bGVzL2lkYi9saWIvaWRiLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7UUN1TGdCLEksR0FBQSxJOztBQXZMaEI7O0lBQVksSzs7QUFDWjs7SUFBWSxJOzs7O0FBRVo7QUFDQSxJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsRUFBOEI7O0FBRTVCLE1BQUksVUFBVSxTQUFTLGNBQVQsQ0FBd0IsV0FBeEIsQ0FBZDtBQUNBLFVBQVEsU0FBUixHQUFvQixFQUFwQjs7QUFFQSxRQUFNLE9BQU4sQ0FBZSxVQUFDLElBQUQsRUFBTyxLQUFQLEVBQWlCOztBQUU5QixRQUFJLGlCQUFlLEtBQUssWUFBcEIsV0FBc0MsS0FBSyxPQUEzQyxZQUFKO0FBQ0EsWUFBUSxTQUFSLElBQXFCLEdBQXJCO0FBRUQsR0FMRDtBQU9EOztBQUVEOzs7QUFHQSxTQUFTLGVBQVQsQ0FBeUIsT0FBekIsRUFBa0MsSUFBbEMsRUFBd0M7O0FBRXRDLE1BQUksYUFBYSxTQUFTLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBakI7QUFDQSxhQUFXLFNBQVgsR0FBdUIsT0FBdkI7O0FBRUEsYUFB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCAqIGFzIFN0b3BzIGZyb20gJy4vb3JtL1N0b3BzLmpzJztcbmltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi9odHRwLmpzJztcblxuLy8gSW50ZXJhY3RpdmUgZWxlbWVudHMgaW4gdGhlIHBhZ2VcbnZhciBkZXBhcnR1cmVzLCBhcnJpdmFscywgc3VibWl0QnV0dG9uO1xuXG4vKiBcbiAgQWRkIHRoZSBvcHRpb25zIHRvIHRoZSBkYXRhbGlzdCBlbGVtZW50cyBpbiB0aGUgZm9ybS5cbiovXG5mdW5jdGlvbiBhZGRTdG9wcyhzdG9wcykge1xuXG4gIHN0b3BzLmZvckVhY2goIChzdG9wKSA9PiB7XG4gICAgXG4gICAgdmFyIG9wdGlvbiA9IGA8b3B0aW9uIHZhbHVlPVwiJHtzdG9wLnN0b3BfbmFtZX0gLSAke3N0b3Auc3RvcF9pZH1cIj48L29wdGlvbj5gO1xuICAgIGRlcGFydHVyZXMuaW5uZXJIVE1MICs9IG9wdGlvbjtcbiAgICBhcnJpdmFscy5pbm5lckhUTUwgKz0gb3B0aW9uO1xuXG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIHNob3dUcmlwVGltZXModHJpcHMpIHtcblxuICB2YXIgcmVzdWx0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aW1ldGFibGUnKTtcbiAgcmVzdWx0cy5pbm5lckhUTUwgPSAnJztcbiAgXG4gIHRyaXBzLmZvckVhY2goICh0cmlwLCBpbmRleCkgPT4ge1xuICAgIFxuICAgIHZhciByb3cgPSBgPGRpdj4gJHt0cmlwLmFycml2YWxfdGltZX0gLSAke3RyaXAudHJpcF9pZH0gPC9kaXY+YDtcbiAgICByZXN1bHRzLmlubmVySFRNTCArPSByb3c7XG5cbiAgfSk7XG5cbn1cblxuLypcbiAgU2hvd3MgYSBtZXNzYWdlIGluIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50LlxuKi9cbmZ1bmN0aW9uIHNob3dJbmZvTWVzc2FnZShtZXNzYWdlLCB0eXBlKSB7XG5cbiAgdmFyIG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZS1ib3gnKTtcbiAgbWVzc2FnZUJveC5pbm5lckhUTUwgPSBtZXNzYWdlO1xuXG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0JztcbiAgXG4gIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAnZXJyb3InOlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBlcnJvcic7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBpbmZvJztcbiAgICAgIGJyZWFrOyAgICBcbiAgfVxuXG59XG5cbi8qXG4gIE1ha2VzIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50IGRpc2FwcGVhciB0aHJvdWdoIGNzcyBjbGFzc1xuKi9cbmZ1bmN0aW9uIGNsZWFySW5mb01lc3NhZ2UoKSB7XG4gIHZhciBtZXNzYWdlQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lc3NhZ2UtYm94Jyk7XG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0Jztcbn1cblxuXG4vKlxuICBSZXF1ZXN0IHRoZSBzdG9wcyBmcm9tIHNlcnZlciBhbmQgYWRkIHRoZW0gdG8gYW4gYXJyYXlcbiAgdG8gYmUgYWJsZSB0byBjaGVjayB0aGF0IHRoZSB1c2VyIGlucHV0IGlzIHZhbGlkLlxuKi9cbmZ1bmN0aW9uIGxvYWRTdG9wcygpIHtcblxuICBTdG9wcy5nZXRBbGwoKS50aGVuKGFkZFN0b3BzKTtcblxufTtcblxuLypcbiAgR2V0IHRoZSBzdGF0aW9uIGNvZGUgZnJvbSBhIHN0cmluZ1xuKi9cbmZ1bmN0aW9uIGdldFN0YXRpb25Db2RlKHN0YXRpb24pIHtcblxuICB2YXIgcGFydHMgPSBzdGF0aW9uLnNwbGl0KCctJyk7XG4gIFxuICBpZihwYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgLy8gVGhpcyBjb3VsZCBiZSBhIHN0cmluZyBmcm9tIHRoZSBkYXRhbGlzdCwgZXh0cmFjdCB0aGUgY29kZVxuICAgIHJldHVybiBwYXJ0c1sxXS50cmltKCk7XG4gIH0gXG5cbiAgLy8gVGhpcyBjb3VsZCBiZSBhIGNvZGUgd3JpdHRlbiBieSB0aGUgdXNlclxuICByZXR1cm4gc3RhdGlvbjtcbiAgXG59XG5cbi8qXG4gIENoZWNrIHRoYXQgYSBjb2RlIGlzIGVpdGhlciBhIHBhaXIgc3RhdGlvbiBuYW1lIC0gc3RhdGlvbiBjb2RlIFxuICBmcm9tIHRoZSBmb3JtIGRhdGFsaXN0IG9yIGEgY29kZSBvZiBhIHN0b3Agd3JpdHRlbiBieSB0aGUgdXNlci5cbiovXG5mdW5jdGlvbiBjaGVja1N0YXRpb24oc3RhdGlvbikge1xuXG4gIHZhciBjb2RlID0gZ2V0U3RhdGlvbkNvZGUoc3RhdGlvbik7XG5cbiAgLy8gQ2hlY2sgdGhhdCB0aGUgY29kZSBpcyBpbiB0aGUgbGlzdCBvZiBzdG9wc1xuICByZXR1cm4gU3RvcHMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihzdG9wcyl7XG4gICAgcmV0dXJuIHN0b3BzLnNvbWUoZnVuY3Rpb24gY2hlY2soc3RvcCkge1xuICAgICAgcmV0dXJuIHN0b3Auc3RvcF9pZCA9PSBjb2RlO1xuICAgIH0pO1xuICB9KTtcblxufVxuXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdUcmlwcyhkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzKSB7XG5cbiAgLy8gZ2V0cyBhbGwgdHJpcHMgdGhhdCBnb2VzIHRvIHRoZSBkZXBhcnR1cmUgc3RvcCBhbmQgdGhlIGFycml2YWwgc3RvcFxuICB2YXIgdmFsaWRUcmlwcyA9IGRlcGFydHVyZVRpbWVzLmZpbHRlcihmdW5jdGlvbihkZXBhcnR1cmVUcmlwKXtcbiAgICByZXR1cm4gYXJyaXZhbFRpbWVzLnNvbWUoZnVuY3Rpb24oYXJyaXZhbFRyaXApe1xuICAgICAgcmV0dXJuIGFycml2YWxUcmlwLnRyaXBfaWQgPT0gZGVwYXJ0dXJlVHJpcC50cmlwX2lkO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gdmFsaWRUcmlwcztcbn1cblxuLypcbiAgRmluZHMgdHJpcHMgYmV0d2VlbiB0d28gc3RhdGlvbnMsIHJldHVybnMgdGhlIHRyaXBzIGlkc1xuKi9cbmZ1bmN0aW9uIGZpbmRUcmlwcyhkZXBhcnR1cmVJZCwgYXJyaXZhbElkKSB7XG5cbiAgcmV0dXJuIEh0dHAuc3RvcFRpbWVzKCkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIFxuICAgIHZhciBkZXBhcnR1cmVUaW1lcyA9IHJlc3VsdC5maWx0ZXIoZnVuY3Rpb24odGltZSkge1xuICAgICAgcmV0dXJuIHRpbWUuc3RvcF9pZCA9PSBkZXBhcnR1cmVJZDtcbiAgICB9KTtcblxuICAgIHZhciBhcnJpdmFsVGltZXMgPSByZXN1bHQuZmlsdGVyKGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgIHJldHVybiB0aW1lLnN0b3BfaWQgPT0gYXJyaXZhbElkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpbmRNYXRjaGluZ1RyaXBzKGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpO1xuXG4gIH0pO1xuXG59XG5cbi8qXG4gIFN1Ym1pdCB0aGUgdXNlciBzZWxlY3Rpb24gYW5kIHNob3cgdGhlIHJvdXRlIGlmIGF2YWlsYWJsZSBvciBhblxuICBlcnJvciBtZXNzYWdlIGlmIG5vIHJvdXRlIGlzIGF2YWlsYWJsZS5cbiovXG5mdW5jdGlvbiBzdWJtaXRTdGF0aW9ucyhldnQpIHtcblxuICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgY2xlYXJJbmZvTWVzc2FnZSgpO1xuICBcbiAgLy8gZ2V0IHRoZSBpbnB1dHMgdmFsdWVzXG4gIHZhciBkZXBhcnR1cmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVwYXJ0dXJlJykudmFsdWU7XG4gIHZhciBhcnJpdmFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fycml2YWwnKS52YWx1ZTtcblxuICBQcm9taXNlLmFsbChbY2hlY2tTdGF0aW9uKGRlcGFydHVyZSksIGNoZWNrU3RhdGlvbihhcnJpdmFsKV0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICBcbiAgICBpZighcmVzdWx0WzBdIHx8ICFyZXN1bHRbMV0pIHtcbiAgICAgIHNob3dJbmZvTWVzc2FnZShcbiAgICAgICAgJ1lvdSBoYXZlIHRvIHNlbGVjdCBhIHZhbGlkIGRlcGFydHVyZSBhbmQgYXJyaXZhbCBzdGF0aW9ucyBmcm9tIHRoZSBsaXN0cyBvciB3cml0ZSBhIHZhbGlkIHN0b3AgY29kZS4nLFxuICAgICAgICAnZXJyb3InXG4gICAgICAgICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8vIElmIHRoZSBkZXBhcnR1cmUgYW5kIGFycml2YWwgc3RhdGlvbnMgYXJlIGNvcnJlY3RcbiAgICAvLyBzZWFyY2ggZm9yIGEgdHJpcCBiZXR3ZWVuIHRoZW0gYW5kIHNob3cgdGhlIHRpbWVzIGFuZCByb3V0ZVxuICAgIGZpbmRUcmlwcyhnZXRTdGF0aW9uQ29kZShkZXBhcnR1cmUpLCBnZXRTdGF0aW9uQ29kZShhcnJpdmFsKSkudGhlbihmdW5jdGlvbih0cmlwcyl7XG4gICAgICBpZih0cmlwcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNob3dUcmlwVGltZXModHJpcHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdXZSBjb3VsZG5cXCd0IGZpbmQgYSB0cmlwIGJldHdlZW4gdGhlc2UgdHdvIHN0YXRpb25zJywgJ2Vycm9yJyk7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgfSlcblxuXG59XG5cbi8qXG4gIEluaXRpYWxpemUgdGhlIGFwcGxpY2F0aW9uIFxuKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xuXG4gIC8vIGdldCB0aGUgaW50ZXJhY3RpdmUgZWxlbWVudHMgb2YgdGhlIGludGVyZmFjZVxuICBkZXBhcnR1cmVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGFydHVyZS1zdG9wcycpO1xuICBhcnJpdmFscyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcnJpdmFsLXN0b3BzJyk7XG4gIHN1Ym1pdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2gnKTtcblxuICAvLyBQb3B1bGF0ZSBkYXRhbGlzdHMgYW5kIGFkZCBsaXN0ZW5lcnNcbiAgbG9hZFN0b3BzKCk7XG4gIHN1Ym1pdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHN1Ym1pdFN0YXRpb25zKTtcblxufTtcbiIsImNvbnN0IGJhc2VVcmwgICAgICAgPSAnL2Rpc3QvZGF0YS8nO1xuY29uc3Qgcm91dGVzRmlsZSAgICA9ICdyb3V0ZXMudHh0JztcbmNvbnN0IHRyaXBzRmlsZSAgICAgPSAndHJpcHMudHh0JztcbmNvbnN0IHN0b3BzRmlsZSAgICAgPSAnc3RvcHMudHh0JztcbmNvbnN0IHN0b3BUaW1lc0ZpbGUgPSAnc3RvcF90aW1lcy50eHQnO1xuXG5jb25zdCBjc3ZUb0FycmF5ID0gZnVuY3Rpb24odGV4dCkge1xuICBcbiAgdmFyIHJvd3MgPSB0ZXh0LnRyaW0oKS5zcGxpdCgnXFxuJyk7XG4gIHJldHVybiByb3dzLm1hcCgocm93KSA9PiByb3cuc3BsaXQoJywnKSk7XG5cbn07XG5cbmNvbnN0IGNzdlRvT2JqZWN0cyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICB2YXIgdGFibGUgPSBjc3ZUb0FycmF5KHRleHQpO1xuICB2YXIga2V5cyA9IHRhYmxlWzBdO1xuICB0YWJsZSA9IHRhYmxlLnNsaWNlKDEpO1xuXG4gIHJldHVybiB0YWJsZS5tYXAoZnVuY3Rpb24ocm93KSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXksIGluZGV4KSB7XG4gICAgICBvYmpba2V5XSA9IHJvd1tpbmRleF07XG4gICAgfSk7XG4gICAgcmV0dXJuICBvYmo7XG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGdldENzdkFzT2JqZWN0cyh1cmwpIHtcblxuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXG4gICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuXG4gICAgfSkudGhlbihmdW5jdGlvbih0ZXh0Q29udGVudCkge1xuXG4gICAgICByZXR1cm4gY3N2VG9PYmplY3RzKHRleHRDb250ZW50KTtcblxuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICB9KTtcbn1cblxuLy8gQVBJXG5cbi8qXG4gIFJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgd2l0aCB0aGUgbmFtZXMgb2YgdGhlIFxuICBhdmFpbGFibGUgbGluZXMuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIHJvdXRlcygpIHtcblxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyByb3V0ZXNGaWxlKTtcblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRyaXBzKCkge1xuICAvLyBnZXQgdGhlIHJvdXRlL2xpbmUgYW5kIHJldHVybiB0aGUgdGltZXMgZm9yIHRoaXMgbGluZVxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyB0cmlwc0ZpbGUpO1xuXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gc3RvcHMoKSB7XG4gIC8vIHJldHVybnMgdGhlIHN0b3BzIG9mIHRoaXMgbGluZVxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyBzdG9wc0ZpbGUpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BUaW1lcygpIHtcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc3RvcFRpbWVzRmlsZSk7IFxufTtcbiIsImltcG9ydCAqIGFzIEFwcCBmcm9tICcuL2FwcC5qcyc7XG5cbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0Jztcbi8qZnVuY3Rpb24gcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xuXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xuXG4gICAgdmFyIGluZGV4Q29udHJvbGxlciA9IHRoaXM7XG5cbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignL3N3LmpzJykudGhlbihmdW5jdGlvbihyZWcpIHtcbiAgICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuY29udHJvbGxlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChyZWcud2FpdGluZykge1xuICAgICAgICBpbmRleENvbnRyb2xsZXIuX3VwZGF0ZVJlYWR5KHJlZy53YWl0aW5nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVnLmluc3RhbGxpbmcpIHtcbiAgICAgICAgaW5kZXhDb250cm9sbGVyLl90cmFja0luc3RhbGxpbmcocmVnLmluc3RhbGxpbmcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlZy5hZGRFdmVudExpc3RlbmVyKCd1cGRhdGVmb3VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpbmRleENvbnRyb2xsZXIuX3RyYWNrSW5zdGFsbGluZyhyZWcuaW5zdGFsbGluZyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIEVuc3VyZSByZWZyZXNoIGlzIG9ubHkgY2FsbGVkIG9uY2UuXG4gICAgLy8gVGhpcyB3b3JrcyBhcm91bmQgYSBidWcgaW4gXCJmb3JjZSB1cGRhdGUgb24gcmVsb2FkXCIuXG4gICAgdmFyIHJlZnJlc2hpbmc7XG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignY29udHJvbGxlcmNoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJlZnJlc2hpbmcpIHJldHVybjtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgIHJlZnJlc2hpbmcgPSB0cnVlO1xuICAgIH0pO1xuICB9OyovXG5cbiAgZnVuY3Rpb24gcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xuXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xuXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy9kaXN0L2pzL3NlcnZpY2Vfd29ya2VyLmpzJykudGhlbihmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdSZWdpc3RyYXRpb24gd29ya2VkIScpO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgY29uc29sZS5sb2coJ1JlZ2lzdHJhdGlvbiBmYWlsZWQhJyk7XG4gICAgfSk7XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWR5KCkge1xuICAgICAgXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAvLyByZXNvbHZlIHRoZSBwcm9taXNlIHdoZW4gdGhlIGRvY3VtZW50IGlzIHJlYWR5XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdyZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKGRvY3VtZW50LnJlYWR5U3RhdGUgIT09ICdsb2FkaW5nJykge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9KTtcblxuICB9O1xuXG4gIHJlYWR5KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICBBcHAuaW5pdCgpO1xuICAgIHJlZ2lzdGVyU2VydmljZVdvcmtlcigpO1xuICB9KTtcblxufSkoKTsiLCJpbXBvcnQgKiBhcyBIdHRwIGZyb20gJy4uL2h0dHAuanMnO1xuaW1wb3J0IGlkYiBmcm9tICcuL2RiLmpzJztcblxuLy8gSWYgaW5kZXhlZERCIGlzIHBvcHVsYXRlZCwgZ2V0IHRoZSBkYXRhIGFuZCB0cnkgdG8gdXBkYXRlIGZyb20gbmV0d29ya1xuLy8gZWxzZSB0cnkgdG8gZ2V0IHRoZSBkYXRhIGZyb20gbmV0d29yayBhbmQgc2F2ZSBpdFxuLy8gZWxzZSB3ZSBzaG91bGQgc2hvdyBhIGN1c3RvbSBlcnJvciBtZXNzYWdlIHRvIHRoZSB1c2VyLCB0aGUgYXBwIGlzIG5vdGEgYXZhaWxhYmxlLlxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbCgpIHtcblxuICByZXR1cm4gSHR0cC5zdG9wcygpLnRoZW4oZnVuY3Rpb24ocmVzdWx0cyl7XG5cbiAgICBpZighcmVzdWx0cykge1xuXG4gICAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbihkYil7IFxuICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbignc3RvcHMnKTtcbiAgICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcHMnKS5nZXRBbGwoKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgfVxuXG4gICAgLy8gSWYgSSBnZXQgcmVzdWx0cyBzdG9yZSB0aGUgcmVzdWx0IGluIGluZGV4ZWREQlxuICAgIHJldHVybiBpZGIoKS50aGVuKGZ1bmN0aW9uKGRiKXtcblxuICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3N0b3BzJywgJ3JlYWR3cml0ZScpO1xuICAgICAgdmFyIHN0b3BzU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgnc3RvcHMnKTtcblxuICAgICAgcmVzdWx0cy5mb3JFYWNoKCBmdW5jdGlvbihzdG9wKSB7XG4gICAgICAgIHN0b3BzU3RvcmUucHV0KHN0b3ApO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21wbGV0ZTtcblxuICAgIH0pLnRoZW4oZnVuY3Rpb24oKXtcblxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG5cbiAgICB9KTtcblxuICB9KTtcblxufVxuXG5cbiIsImltcG9ydCBpZGIgZnJvbSAnLi4vLi4vbm9kZV9tb2R1bGVzL2lkYi9saWIvaWRiLmpzJztcblxudmFyIF9kYjtcblxuLy8gVGhpcyBjbGFzcyB3b3JrcyBhcyBhIE9STSB0aGF0IGdldHMgdGhlIGRhdGEgZnJvbSBpbmRleGVkREJcbmZ1bmN0aW9uIG9wZW5EYXRhYmFzZSgpIHtcbiAgXG4gIHJldHVybiBpZGIub3BlbigndHJhaW5zJywgMSwgZnVuY3Rpb24odXBncmFkZURiKSB7XG4gICAgdmFyIHN0b3JlID0gdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdzdG9wcycsIHtcbiAgICAgIGtleVBhdGg6ICdzdG9wX2lkJ1xuICAgIH0pO1xuXG4gICAgdmFyIHN0b3JlID0gdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCd0cmlwcycsIHtcbiAgICAgIGtleVBhdGg6ICd0cmlwX2lkJ1xuICAgIH0pO1xuXG4gICAgdmFyIHN0b3JlID0gdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdyb3V0ZXMnLCB7XG4gICAgICBrZXlQYXRoOiAncm91dGVfaWQnXG4gICAgfSk7XG4gIH0pO1xuXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRiKCkge1xuICBcbiAgaWYoX2RiID09IG51bGwpIHtcbiAgICBfZGIgPSBvcGVuRGF0YWJhc2UoKTtcbiAgfSBcblxuICByZXR1cm4gX2RiO1xuXG59OyIsIid1c2Ugc3RyaWN0JztcblxuKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiB0b0FycmF5KGFycikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICB9O1xuXG4gICAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHJlcXVlc3Q7XG4gICAgdmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3QgPSBvYmpbbWV0aG9kXS5hcHBseShvYmosIGFyZ3MpO1xuICAgICAgcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgfSk7XG5cbiAgICBwLnJlcXVlc3QgPSByZXF1ZXN0O1xuICAgIHJldHVybiBwO1xuICB9XG4gIFxuICBmdW5jdGlvbiBwcm9taXNpZnlDdXJzb3JSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciBwID0gcHJvbWlzaWZ5UmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpO1xuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmICghdmFsdWUpIHJldHVybjtcbiAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBwLnJlcXVlc3QpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlQcm9wZXJ0aWVzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb3h5Q2xhc3MucHJvdG90eXBlLCBwcm9wLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbdGFyZ2V0UHJvcF1bcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlSZXF1ZXN0TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdLmFwcGx5KHRoaXNbdGFyZ2V0UHJvcF0sIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlDdXJzb3JSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIEluZGV4KGluZGV4KSB7XG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcbiAgfVxuXG4gIHByb3h5UHJvcGVydGllcyhJbmRleCwgJ19pbmRleCcsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdtdWx0aUVudHJ5JyxcbiAgICAndW5pcXVlJ1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKEluZGV4LCAnX2luZGV4JywgSURCSW5kZXgsIFtcbiAgICAnZ2V0JyxcbiAgICAnZ2V0S2V5JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKEluZGV4LCAnX2luZGV4JywgSURCSW5kZXgsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIEN1cnNvcihjdXJzb3IsIHJlcXVlc3QpIHtcbiAgICB0aGlzLl9jdXJzb3IgPSBjdXJzb3I7XG4gICAgdGhpcy5fcmVxdWVzdCA9IHJlcXVlc3Q7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoQ3Vyc29yLCAnX2N1cnNvcicsIFtcbiAgICAnZGlyZWN0aW9uJyxcbiAgICAna2V5JyxcbiAgICAncHJpbWFyeUtleScsXG4gICAgJ3ZhbHVlJ1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKEN1cnNvciwgJ19jdXJzb3InLCBJREJDdXJzb3IsIFtcbiAgICAndXBkYXRlJyxcbiAgICAnZGVsZXRlJ1xuICBdKTtcblxuICAvLyBwcm94eSAnbmV4dCcgbWV0aG9kc1xuICBbJ2FkdmFuY2UnLCAnY29udGludWUnLCAnY29udGludWVQcmltYXJ5S2V5J10uZm9yRWFjaChmdW5jdGlvbihtZXRob2ROYW1lKSB7XG4gICAgaWYgKCEobWV0aG9kTmFtZSBpbiBJREJDdXJzb3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgIEN1cnNvci5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjdXJzb3IgPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgY3Vyc29yLl9jdXJzb3JbbWV0aG9kTmFtZV0uYXBwbHkoY3Vyc29yLl9jdXJzb3IsIGFyZ3MpO1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdChjdXJzb3IuX3JlcXVlc3QpLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICAgICAgcmV0dXJuIG5ldyBDdXJzb3IodmFsdWUsIGN1cnNvci5fcmVxdWVzdCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gT2JqZWN0U3RvcmUoc3RvcmUpIHtcbiAgICB0aGlzLl9zdG9yZSA9IHN0b3JlO1xuICB9XG5cbiAgT2JqZWN0U3RvcmUucHJvdG90eXBlLmNyZWF0ZUluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmRleCh0aGlzLl9zdG9yZS5jcmVhdGVJbmRleC5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgT2JqZWN0U3RvcmUucHJvdG90eXBlLmluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmRleCh0aGlzLl9zdG9yZS5pbmRleC5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgW1xuICAgICduYW1lJyxcbiAgICAna2V5UGF0aCcsXG4gICAgJ2luZGV4TmFtZXMnLFxuICAgICdhdXRvSW5jcmVtZW50J1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAncHV0JyxcbiAgICAnYWRkJyxcbiAgICAnZGVsZXRlJyxcbiAgICAnY2xlYXInLFxuICAgICdnZXQnLFxuICAgICdnZXRBbGwnLFxuICAgICdnZXRBbGxLZXlzJyxcbiAgICAnY291bnQnXG4gIF0pO1xuXG4gIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xuICAgICdvcGVuQ3Vyc29yJyxcbiAgICAnb3BlbktleUN1cnNvcidcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnZGVsZXRlSW5kZXgnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIFRyYW5zYWN0aW9uKGlkYlRyYW5zYWN0aW9uKSB7XG4gICAgdGhpcy5fdHggPSBpZGJUcmFuc2FjdGlvbjtcbiAgICB0aGlzLmNvbXBsZXRlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChpZGJUcmFuc2FjdGlvbi5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgVHJhbnNhY3Rpb24ucHJvdG90eXBlLm9iamVjdFN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTdG9yZSh0aGlzLl90eC5vYmplY3RTdG9yZS5hcHBseSh0aGlzLl90eCwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKFRyYW5zYWN0aW9uLCAnX3R4JywgW1xuICAgICdvYmplY3RTdG9yZU5hbWVzJyxcbiAgICAnbW9kZSdcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKFRyYW5zYWN0aW9uLCAnX3R4JywgSURCVHJhbnNhY3Rpb24sIFtcbiAgICAnYWJvcnQnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIFVwZ3JhZGVEQihkYiwgb2xkVmVyc2lvbiwgdHJhbnNhY3Rpb24pIHtcbiAgICB0aGlzLl9kYiA9IGRiO1xuICAgIHRoaXMub2xkVmVyc2lvbiA9IG9sZFZlcnNpb247XG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbih0cmFuc2FjdGlvbik7XG4gIH1cblxuICBVcGdyYWRlREIucHJvdG90eXBlLmNyZWF0ZU9iamVjdFN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTdG9yZSh0aGlzLl9kYi5jcmVhdGVPYmplY3RTdG9yZS5hcHBseSh0aGlzLl9kYiwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKFVwZ3JhZGVEQiwgJ19kYicsIFtcbiAgICAnbmFtZScsXG4gICAgJ3ZlcnNpb24nLFxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoVXBncmFkZURCLCAnX2RiJywgSURCRGF0YWJhc2UsIFtcbiAgICAnZGVsZXRlT2JqZWN0U3RvcmUnLFxuICAgICdjbG9zZSdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gREIoZGIpIHtcbiAgICB0aGlzLl9kYiA9IGRiO1xuICB9XG5cbiAgREIucHJvdG90eXBlLnRyYW5zYWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbih0aGlzLl9kYi50cmFuc2FjdGlvbi5hcHBseSh0aGlzLl9kYiwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKERCLCAnX2RiJywgW1xuICAgICduYW1lJyxcbiAgICAndmVyc2lvbicsXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhEQiwgJ19kYicsIElEQkRhdGFiYXNlLCBbXG4gICAgJ2Nsb3NlJ1xuICBdKTtcblxuICAvLyBBZGQgY3Vyc29yIGl0ZXJhdG9yc1xuICAvLyBUT0RPOiByZW1vdmUgdGhpcyBvbmNlIGJyb3dzZXJzIGRvIHRoZSByaWdodCB0aGluZyB3aXRoIHByb21pc2VzXG4gIFsnb3BlbkN1cnNvcicsICdvcGVuS2V5Q3Vyc29yJ10uZm9yRWFjaChmdW5jdGlvbihmdW5jTmFtZSkge1xuICAgIFtPYmplY3RTdG9yZSwgSW5kZXhdLmZvckVhY2goZnVuY3Rpb24oQ29uc3RydWN0b3IpIHtcbiAgICAgIENvbnN0cnVjdG9yLnByb3RvdHlwZVtmdW5jTmFtZS5yZXBsYWNlKCdvcGVuJywgJ2l0ZXJhdGUnKV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIHJlcXVlc3QgPSAodGhpcy5fc3RvcmUgfHwgdGhpcy5faW5kZXgpW2Z1bmNOYW1lXS5hcHBseSh0aGlzLl9zdG9yZSwgYXJncy5zbGljZSgwLCAtMSkpO1xuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNhbGxiYWNrKHJlcXVlc3QucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIHBvbHlmaWxsIGdldEFsbFxuICBbSW5kZXgsIE9iamVjdFN0b3JlXS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgaWYgKENvbnN0cnVjdG9yLnByb3RvdHlwZS5nZXRBbGwpIHJldHVybjtcbiAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsID0gZnVuY3Rpb24ocXVlcnksIGNvdW50KSB7XG4gICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgdmFyIGl0ZW1zID0gW107XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICAgIGluc3RhbmNlLml0ZXJhdGVDdXJzb3IocXVlcnksIGZ1bmN0aW9uKGN1cnNvcikge1xuICAgICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaXRlbXMucHVzaChjdXJzb3IudmFsdWUpO1xuXG4gICAgICAgICAgaWYgKGNvdW50ICE9PSB1bmRlZmluZWQgJiYgaXRlbXMubGVuZ3RoID09IGNvdW50KSB7XG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgdmFyIGV4cCA9IHtcbiAgICBvcGVuOiBmdW5jdGlvbihuYW1lLCB2ZXJzaW9uLCB1cGdyYWRlQ2FsbGJhY2spIHtcbiAgICAgIHZhciBwID0gcHJvbWlzaWZ5UmVxdWVzdENhbGwoaW5kZXhlZERCLCAnb3BlbicsIFtuYW1lLCB2ZXJzaW9uXSk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHAucmVxdWVzdDtcblxuICAgICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAodXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICAgICAgdXBncmFkZUNhbGxiYWNrKG5ldyBVcGdyYWRlREIocmVxdWVzdC5yZXN1bHQsIGV2ZW50Lm9sZFZlcnNpb24sIHJlcXVlc3QudHJhbnNhY3Rpb24pKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbihkYikge1xuICAgICAgICByZXR1cm4gbmV3IERCKGRiKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwoaW5kZXhlZERCLCAnZGVsZXRlRGF0YWJhc2UnLCBbbmFtZV0pO1xuICAgIH1cbiAgfTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cDtcbiAgfVxuICBlbHNlIHtcbiAgICBzZWxmLmlkYiA9IGV4cDtcbiAgfVxufSgpKTsiXX0=
