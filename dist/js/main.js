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

    navigator.serviceWorker.register('./dist/js/service_worker.js').then(function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiLCJhcHAvb3JtL2RiLmpzIiwibm9kZV9tb2R1bGVzL2lkYi9saWIvaWRiLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7UUN1TGdCLEksR0FBQSxJOztBQXZMaEI7O0lBQVksSzs7QUFDWjs7SUFBWSxJOzs7O0FBRVo7QUFDQSxJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsRUFBOEI7O0FBRTVCLE1BQUksVUFBVSxTQUFTLGNBQVQsQ0FBd0IsV0FBeEIsQ0FBZDtBQUNBLFVBQVEsU0FBUixHQUFvQixFQUFwQjs7QUFFQSxRQUFNLE9BQU4sQ0FBZSxVQUFDLElBQUQsRUFBTyxLQUFQLEVBQWlCOztBQUU5QixRQUFJLGlCQUFlLEtBQUssWUFBcEIsV0FBc0MsS0FBSyxPQUEzQyxZQUFKO0FBQ0EsWUFBUSxTQUFSLElBQXFCLEdBQXJCO0FBRUQsR0FMRDtBQU9EOztBQUVEOzs7QUFHQSxTQUFTLGVBQVQsQ0FBeUIsT0FBekIsRUFBa0MsSUFBbEMsRUFBd0M7O0FBRXRDLE1BQUksYUFBYSxTQUFTLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBakI7QUFDQSxhQUFXLFNBQVgsR0FBdUIsT0FBdkI7O0FBRUEsYUFB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCAqIGFzIFN0b3BzIGZyb20gJy4vb3JtL1N0b3BzLmpzJztcbmltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi9odHRwLmpzJztcblxuLy8gSW50ZXJhY3RpdmUgZWxlbWVudHMgaW4gdGhlIHBhZ2VcbnZhciBkZXBhcnR1cmVzLCBhcnJpdmFscywgc3VibWl0QnV0dG9uO1xuXG4vKiBcbiAgQWRkIHRoZSBvcHRpb25zIHRvIHRoZSBkYXRhbGlzdCBlbGVtZW50cyBpbiB0aGUgZm9ybS5cbiovXG5mdW5jdGlvbiBhZGRTdG9wcyhzdG9wcykge1xuXG4gIHN0b3BzLmZvckVhY2goIChzdG9wKSA9PiB7XG4gICAgXG4gICAgdmFyIG9wdGlvbiA9IGA8b3B0aW9uIHZhbHVlPVwiJHtzdG9wLnN0b3BfbmFtZX0gLSAke3N0b3Auc3RvcF9pZH1cIj48L29wdGlvbj5gO1xuICAgIGRlcGFydHVyZXMuaW5uZXJIVE1MICs9IG9wdGlvbjtcbiAgICBhcnJpdmFscy5pbm5lckhUTUwgKz0gb3B0aW9uO1xuXG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIHNob3dUcmlwVGltZXModHJpcHMpIHtcblxuICB2YXIgcmVzdWx0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aW1ldGFibGUnKTtcbiAgcmVzdWx0cy5pbm5lckhUTUwgPSAnJztcbiAgXG4gIHRyaXBzLmZvckVhY2goICh0cmlwLCBpbmRleCkgPT4ge1xuICAgIFxuICAgIHZhciByb3cgPSBgPGRpdj4gJHt0cmlwLmFycml2YWxfdGltZX0gLSAke3RyaXAudHJpcF9pZH0gPC9kaXY+YDtcbiAgICByZXN1bHRzLmlubmVySFRNTCArPSByb3c7XG5cbiAgfSk7XG5cbn1cblxuLypcbiAgU2hvd3MgYSBtZXNzYWdlIGluIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50LlxuKi9cbmZ1bmN0aW9uIHNob3dJbmZvTWVzc2FnZShtZXNzYWdlLCB0eXBlKSB7XG5cbiAgdmFyIG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZS1ib3gnKTtcbiAgbWVzc2FnZUJveC5pbm5lckhUTUwgPSBtZXNzYWdlO1xuXG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0JztcbiAgXG4gIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAnZXJyb3InOlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBlcnJvcic7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgbWVzc2FnZUJveC5jbGFzc05hbWUgKz0gJyBpbmZvJztcbiAgICAgIGJyZWFrOyAgICBcbiAgfVxuXG59XG5cbi8qXG4gIE1ha2VzIHRoZSBtZXNzYWdlLWJveCBlbGVtZW50IGRpc2FwcGVhciB0aHJvdWdoIGNzcyBjbGFzc1xuKi9cbmZ1bmN0aW9uIGNsZWFySW5mb01lc3NhZ2UoKSB7XG4gIHZhciBtZXNzYWdlQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lc3NhZ2UtYm94Jyk7XG4gIG1lc3NhZ2VCb3guY2xhc3NOYW1lID0gJ2FsZXJ0Jztcbn1cblxuXG4vKlxuICBSZXF1ZXN0IHRoZSBzdG9wcyBmcm9tIHNlcnZlciBhbmQgYWRkIHRoZW0gdG8gYW4gYXJyYXlcbiAgdG8gYmUgYWJsZSB0byBjaGVjayB0aGF0IHRoZSB1c2VyIGlucHV0IGlzIHZhbGlkLlxuKi9cbmZ1bmN0aW9uIGxvYWRTdG9wcygpIHtcblxuICBTdG9wcy5nZXRBbGwoKS50aGVuKGFkZFN0b3BzKTtcblxufTtcblxuLypcbiAgR2V0IHRoZSBzdGF0aW9uIGNvZGUgZnJvbSBhIHN0cmluZ1xuKi9cbmZ1bmN0aW9uIGdldFN0YXRpb25Db2RlKHN0YXRpb24pIHtcblxuICB2YXIgcGFydHMgPSBzdGF0aW9uLnNwbGl0KCctJyk7XG4gIFxuICBpZihwYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgLy8gVGhpcyBjb3VsZCBiZSBhIHN0cmluZyBmcm9tIHRoZSBkYXRhbGlzdCwgZXh0cmFjdCB0aGUgY29kZVxuICAgIHJldHVybiBwYXJ0c1sxXS50cmltKCk7XG4gIH0gXG5cbiAgLy8gVGhpcyBjb3VsZCBiZSBhIGNvZGUgd3JpdHRlbiBieSB0aGUgdXNlclxuICByZXR1cm4gc3RhdGlvbjtcbiAgXG59XG5cbi8qXG4gIENoZWNrIHRoYXQgYSBjb2RlIGlzIGVpdGhlciBhIHBhaXIgc3RhdGlvbiBuYW1lIC0gc3RhdGlvbiBjb2RlIFxuICBmcm9tIHRoZSBmb3JtIGRhdGFsaXN0IG9yIGEgY29kZSBvZiBhIHN0b3Agd3JpdHRlbiBieSB0aGUgdXNlci5cbiovXG5mdW5jdGlvbiBjaGVja1N0YXRpb24oc3RhdGlvbikge1xuXG4gIHZhciBjb2RlID0gZ2V0U3RhdGlvbkNvZGUoc3RhdGlvbik7XG5cbiAgLy8gQ2hlY2sgdGhhdCB0aGUgY29kZSBpcyBpbiB0aGUgbGlzdCBvZiBzdG9wc1xuICByZXR1cm4gU3RvcHMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihzdG9wcyl7XG4gICAgcmV0dXJuIHN0b3BzLnNvbWUoZnVuY3Rpb24gY2hlY2soc3RvcCkge1xuICAgICAgcmV0dXJuIHN0b3Auc3RvcF9pZCA9PSBjb2RlO1xuICAgIH0pO1xuICB9KTtcblxufVxuXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdUcmlwcyhkZXBhcnR1cmVUaW1lcywgYXJyaXZhbFRpbWVzKSB7XG5cbiAgLy8gZ2V0cyBhbGwgdHJpcHMgdGhhdCBnb2VzIHRvIHRoZSBkZXBhcnR1cmUgc3RvcCBhbmQgdGhlIGFycml2YWwgc3RvcFxuICB2YXIgdmFsaWRUcmlwcyA9IGRlcGFydHVyZVRpbWVzLmZpbHRlcihmdW5jdGlvbihkZXBhcnR1cmVUcmlwKXtcbiAgICByZXR1cm4gYXJyaXZhbFRpbWVzLnNvbWUoZnVuY3Rpb24oYXJyaXZhbFRyaXApe1xuICAgICAgcmV0dXJuIGFycml2YWxUcmlwLnRyaXBfaWQgPT0gZGVwYXJ0dXJlVHJpcC50cmlwX2lkO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gdmFsaWRUcmlwcztcbn1cblxuLypcbiAgRmluZHMgdHJpcHMgYmV0d2VlbiB0d28gc3RhdGlvbnMsIHJldHVybnMgdGhlIHRyaXBzIGlkc1xuKi9cbmZ1bmN0aW9uIGZpbmRUcmlwcyhkZXBhcnR1cmVJZCwgYXJyaXZhbElkKSB7XG5cbiAgcmV0dXJuIEh0dHAuc3RvcFRpbWVzKCkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIFxuICAgIHZhciBkZXBhcnR1cmVUaW1lcyA9IHJlc3VsdC5maWx0ZXIoZnVuY3Rpb24odGltZSkge1xuICAgICAgcmV0dXJuIHRpbWUuc3RvcF9pZCA9PSBkZXBhcnR1cmVJZDtcbiAgICB9KTtcblxuICAgIHZhciBhcnJpdmFsVGltZXMgPSByZXN1bHQuZmlsdGVyKGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgIHJldHVybiB0aW1lLnN0b3BfaWQgPT0gYXJyaXZhbElkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpbmRNYXRjaGluZ1RyaXBzKGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpO1xuXG4gIH0pO1xuXG59XG5cbi8qXG4gIFN1Ym1pdCB0aGUgdXNlciBzZWxlY3Rpb24gYW5kIHNob3cgdGhlIHJvdXRlIGlmIGF2YWlsYWJsZSBvciBhblxuICBlcnJvciBtZXNzYWdlIGlmIG5vIHJvdXRlIGlzIGF2YWlsYWJsZS5cbiovXG5mdW5jdGlvbiBzdWJtaXRTdGF0aW9ucyhldnQpIHtcblxuICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgY2xlYXJJbmZvTWVzc2FnZSgpO1xuICBcbiAgLy8gZ2V0IHRoZSBpbnB1dHMgdmFsdWVzXG4gIHZhciBkZXBhcnR1cmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVwYXJ0dXJlJykudmFsdWU7XG4gIHZhciBhcnJpdmFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fycml2YWwnKS52YWx1ZTtcblxuICBQcm9taXNlLmFsbChbY2hlY2tTdGF0aW9uKGRlcGFydHVyZSksIGNoZWNrU3RhdGlvbihhcnJpdmFsKV0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICBcbiAgICBpZighcmVzdWx0WzBdIHx8ICFyZXN1bHRbMV0pIHtcbiAgICAgIHNob3dJbmZvTWVzc2FnZShcbiAgICAgICAgJ1lvdSBoYXZlIHRvIHNlbGVjdCBhIHZhbGlkIGRlcGFydHVyZSBhbmQgYXJyaXZhbCBzdGF0aW9ucyBmcm9tIHRoZSBsaXN0cyBvciB3cml0ZSBhIHZhbGlkIHN0b3AgY29kZS4nLFxuICAgICAgICAnZXJyb3InXG4gICAgICAgICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8vIElmIHRoZSBkZXBhcnR1cmUgYW5kIGFycml2YWwgc3RhdGlvbnMgYXJlIGNvcnJlY3RcbiAgICAvLyBzZWFyY2ggZm9yIGEgdHJpcCBiZXR3ZWVuIHRoZW0gYW5kIHNob3cgdGhlIHRpbWVzIGFuZCByb3V0ZVxuICAgIGZpbmRUcmlwcyhnZXRTdGF0aW9uQ29kZShkZXBhcnR1cmUpLCBnZXRTdGF0aW9uQ29kZShhcnJpdmFsKSkudGhlbihmdW5jdGlvbih0cmlwcyl7XG4gICAgICBpZih0cmlwcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNob3dUcmlwVGltZXModHJpcHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdXZSBjb3VsZG5cXCd0IGZpbmQgYSB0cmlwIGJldHdlZW4gdGhlc2UgdHdvIHN0YXRpb25zJywgJ2Vycm9yJyk7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgfSlcblxuXG59XG5cbi8qXG4gIEluaXRpYWxpemUgdGhlIGFwcGxpY2F0aW9uIFxuKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xuXG4gIC8vIGdldCB0aGUgaW50ZXJhY3RpdmUgZWxlbWVudHMgb2YgdGhlIGludGVyZmFjZVxuICBkZXBhcnR1cmVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGFydHVyZS1zdG9wcycpO1xuICBhcnJpdmFscyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcnJpdmFsLXN0b3BzJyk7XG4gIHN1Ym1pdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2gnKTtcblxuICAvLyBQb3B1bGF0ZSBkYXRhbGlzdHMgYW5kIGFkZCBsaXN0ZW5lcnNcbiAgbG9hZFN0b3BzKCk7XG4gIHN1Ym1pdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHN1Ym1pdFN0YXRpb25zKTtcblxufTtcbiIsImNvbnN0IGJhc2VVcmwgICAgICAgPSAnL2Rpc3QvZGF0YS8nO1xuY29uc3Qgcm91dGVzRmlsZSAgICA9ICdyb3V0ZXMudHh0JztcbmNvbnN0IHRyaXBzRmlsZSAgICAgPSAndHJpcHMudHh0JztcbmNvbnN0IHN0b3BzRmlsZSAgICAgPSAnc3RvcHMudHh0JztcbmNvbnN0IHN0b3BUaW1lc0ZpbGUgPSAnc3RvcF90aW1lcy50eHQnO1xuXG5jb25zdCBjc3ZUb0FycmF5ID0gZnVuY3Rpb24odGV4dCkge1xuICBcbiAgdmFyIHJvd3MgPSB0ZXh0LnRyaW0oKS5zcGxpdCgnXFxuJyk7XG4gIHJldHVybiByb3dzLm1hcCgocm93KSA9PiByb3cuc3BsaXQoJywnKSk7XG5cbn07XG5cbmNvbnN0IGNzdlRvT2JqZWN0cyA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICB2YXIgdGFibGUgPSBjc3ZUb0FycmF5KHRleHQpO1xuICB2YXIga2V5cyA9IHRhYmxlWzBdO1xuICB0YWJsZSA9IHRhYmxlLnNsaWNlKDEpO1xuXG4gIHJldHVybiB0YWJsZS5tYXAoZnVuY3Rpb24ocm93KSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXksIGluZGV4KSB7XG4gICAgICBvYmpba2V5XSA9IHJvd1tpbmRleF07XG4gICAgfSk7XG4gICAgcmV0dXJuICBvYmo7XG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGdldENzdkFzT2JqZWN0cyh1cmwpIHtcblxuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXG4gICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuXG4gICAgfSkudGhlbihmdW5jdGlvbih0ZXh0Q29udGVudCkge1xuXG4gICAgICByZXR1cm4gY3N2VG9PYmplY3RzKHRleHRDb250ZW50KTtcblxuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICB9KTtcbn1cblxuLy8gQVBJXG5cbi8qXG4gIFJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgd2l0aCB0aGUgbmFtZXMgb2YgdGhlIFxuICBhdmFpbGFibGUgbGluZXMuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIHJvdXRlcygpIHtcblxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyByb3V0ZXNGaWxlKTtcblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRyaXBzKCkge1xuICAvLyBnZXQgdGhlIHJvdXRlL2xpbmUgYW5kIHJldHVybiB0aGUgdGltZXMgZm9yIHRoaXMgbGluZVxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyB0cmlwc0ZpbGUpO1xuXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gc3RvcHMoKSB7XG4gIC8vIHJldHVybnMgdGhlIHN0b3BzIG9mIHRoaXMgbGluZVxuICByZXR1cm4gZ2V0Q3N2QXNPYmplY3RzKGJhc2VVcmwgKyBzdG9wc0ZpbGUpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BUaW1lcygpIHtcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc3RvcFRpbWVzRmlsZSk7IFxufTtcbiIsImltcG9ydCAqIGFzIEFwcCBmcm9tICcuL2FwcC5qcyc7XG5cbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0Jztcbi8qZnVuY3Rpb24gcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xuXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xuXG4gICAgdmFyIGluZGV4Q29udHJvbGxlciA9IHRoaXM7XG5cbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignL3N3LmpzJykudGhlbihmdW5jdGlvbihyZWcpIHtcbiAgICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuY29udHJvbGxlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChyZWcud2FpdGluZykge1xuICAgICAgICBpbmRleENvbnRyb2xsZXIuX3VwZGF0ZVJlYWR5KHJlZy53YWl0aW5nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVnLmluc3RhbGxpbmcpIHtcbiAgICAgICAgaW5kZXhDb250cm9sbGVyLl90cmFja0luc3RhbGxpbmcocmVnLmluc3RhbGxpbmcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlZy5hZGRFdmVudExpc3RlbmVyKCd1cGRhdGVmb3VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpbmRleENvbnRyb2xsZXIuX3RyYWNrSW5zdGFsbGluZyhyZWcuaW5zdGFsbGluZyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIEVuc3VyZSByZWZyZXNoIGlzIG9ubHkgY2FsbGVkIG9uY2UuXG4gICAgLy8gVGhpcyB3b3JrcyBhcm91bmQgYSBidWcgaW4gXCJmb3JjZSB1cGRhdGUgb24gcmVsb2FkXCIuXG4gICAgdmFyIHJlZnJlc2hpbmc7XG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignY29udHJvbGxlcmNoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJlZnJlc2hpbmcpIHJldHVybjtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgIHJlZnJlc2hpbmcgPSB0cnVlO1xuICAgIH0pO1xuICB9OyovXG5cbiAgZnVuY3Rpb24gcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xuXG4gICAgaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikgcmV0dXJuO1xuXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy4vZGlzdC9qcy9zZXJ2aWNlX3dvcmtlci5qcycpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICBjb25zb2xlLmxvZygnUmVnaXN0cmF0aW9uIHdvcmtlZCEnKTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdSZWdpc3RyYXRpb24gZmFpbGVkIScpO1xuICAgIH0pO1xuXG4gIH1cblxuICBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgLy8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB3aGVuIHRoZSBkb2N1bWVudCBpcyByZWFkeVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZihkb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnbG9hZGluZycpIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgfTtcblxuICByZWFkeSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgQXBwLmluaXQoKTtcbiAgICByZWdpc3RlclNlcnZpY2VXb3JrZXIoKTtcbiAgfSk7XG5cbn0pKCk7IiwiaW1wb3J0ICogYXMgSHR0cCBmcm9tICcuLi9odHRwLmpzJztcbmltcG9ydCBpZGIgZnJvbSAnLi9kYi5qcyc7XG5cbi8vIElmIGluZGV4ZWREQiBpcyBwb3B1bGF0ZWQsIGdldCB0aGUgZGF0YSBhbmQgdHJ5IHRvIHVwZGF0ZSBmcm9tIG5ldHdvcmtcbi8vIGVsc2UgdHJ5IHRvIGdldCB0aGUgZGF0YSBmcm9tIG5ldHdvcmsgYW5kIHNhdmUgaXRcbi8vIGVsc2Ugd2Ugc2hvdWxkIHNob3cgYSBjdXN0b20gZXJyb3IgbWVzc2FnZSB0byB0aGUgdXNlciwgdGhlIGFwcCBpcyBub3RhIGF2YWlsYWJsZS5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGwoKSB7XG5cbiAgcmV0dXJuIEh0dHAuc3RvcHMoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdHMpe1xuXG4gICAgaWYoIXJlc3VsdHMpIHtcblxuICAgICAgcmV0dXJuIGlkYigpLnRoZW4oZnVuY3Rpb24oZGIpeyBcbiAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oJ3N0b3BzJyk7XG4gICAgICAgICByZXR1cm4gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BzJykuZ2V0QWxsKCk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgIH1cblxuICAgIC8vIElmIEkgZ2V0IHJlc3VsdHMgc3RvcmUgdGhlIHJlc3VsdCBpbiBpbmRleGVkREJcbiAgICByZXR1cm4gaWRiKCkudGhlbihmdW5jdGlvbihkYil7XG5cbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKCdzdG9wcycsICdyZWFkd3JpdGUnKTtcbiAgICAgIHZhciBzdG9wc1N0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3N0b3BzJyk7XG5cbiAgICAgIHJlc3VsdHMuZm9yRWFjaCggZnVuY3Rpb24oc3RvcCkge1xuICAgICAgICBzdG9wc1N0b3JlLnB1dChzdG9wKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJhbnNhY3Rpb24uY29tcGxldGU7XG5cbiAgICB9KS50aGVuKGZ1bmN0aW9uKCl7XG5cbiAgICAgIHJldHVybiByZXN1bHRzO1xuXG4gICAgfSk7XG5cbiAgfSk7XG5cbn1cblxuXG4iLCJpbXBvcnQgaWRiIGZyb20gJy4uLy4uL25vZGVfbW9kdWxlcy9pZGIvbGliL2lkYi5qcyc7XG5cbnZhciBfZGI7XG5cbi8vIFRoaXMgY2xhc3Mgd29ya3MgYXMgYSBPUk0gdGhhdCBnZXRzIHRoZSBkYXRhIGZyb20gaW5kZXhlZERCXG5mdW5jdGlvbiBvcGVuRGF0YWJhc2UoKSB7XG4gIFxuICByZXR1cm4gaWRiLm9wZW4oJ3RyYWlucycsIDEsIGZ1bmN0aW9uKHVwZ3JhZGVEYikge1xuICAgIHZhciBzdG9yZSA9IHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgnc3RvcHMnLCB7XG4gICAgICBrZXlQYXRoOiAnc3RvcF9pZCdcbiAgICB9KTtcblxuICAgIHZhciBzdG9yZSA9IHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgndHJpcHMnLCB7XG4gICAgICBrZXlQYXRoOiAndHJpcF9pZCdcbiAgICB9KTtcblxuICAgIHZhciBzdG9yZSA9IHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncm91dGVzJywge1xuICAgICAga2V5UGF0aDogJ3JvdXRlX2lkJ1xuICAgIH0pO1xuICB9KTtcblxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkYigpIHtcbiAgXG4gIGlmKF9kYiA9PSBudWxsKSB7XG4gICAgX2RiID0gb3BlbkRhdGFiYXNlKCk7XG4gIH0gXG5cbiAgcmV0dXJuIF9kYjtcblxufTsiLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gdG9BcnJheShhcnIpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVxdWVzdC5yZXN1bHQpO1xuICAgICAgfTtcblxuICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciByZXF1ZXN0O1xuICAgIHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0ID0gb2JqW21ldGhvZF0uYXBwbHkob2JqLCBhcmdzKTtcbiAgICAgIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0pO1xuXG4gICAgcC5yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICByZXR1cm4gcDtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKTtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgcC5yZXF1ZXN0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UHJvcGVydGllcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm94eUNsYXNzLnByb3RvdHlwZSwgcHJvcCwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXS5hcHBseSh0aGlzW3RhcmdldFByb3BdLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoSW5kZXgsICdfaW5kZXgnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnbXVsdGlFbnRyeScsXG4gICAgJ3VuaXF1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ2dldCcsXG4gICAgJ2dldEtleScsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XG4gICAgdGhpcy5fY3Vyc29yID0gY3Vyc29yO1xuICAgIHRoaXMuX3JlcXVlc3QgPSByZXF1ZXN0O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEN1cnNvciwgJ19jdXJzb3InLCBbXG4gICAgJ2RpcmVjdGlvbicsXG4gICAgJ2tleScsXG4gICAgJ3ByaW1hcnlLZXknLFxuICAgICd2YWx1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXG4gICAgJ3VwZGF0ZScsXG4gICAgJ2RlbGV0ZSdcbiAgXSk7XG5cbiAgLy8gcHJveHkgJ25leHQnIG1ldGhvZHNcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIGlmICghKG1ldGhvZE5hbWUgaW4gSURCQ3Vyc29yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICBDdXJzb3IucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3QoY3Vyc29yLl9yZXF1ZXN0KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcbiAgfVxuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5jcmVhdGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuY3JlYXRlSW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5pbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdpbmRleE5hbWVzJyxcbiAgICAnYXV0b0luY3JlbWVudCdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ3B1dCcsXG4gICAgJ2FkZCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2NsZWFyJyxcbiAgICAnZ2V0JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ2RlbGV0ZUluZGV4J1xuICBdKTtcblxuICBmdW5jdGlvbiBUcmFuc2FjdGlvbihpZGJUcmFuc2FjdGlvbikge1xuICAgIHRoaXMuX3R4ID0gaWRiVHJhbnNhY3Rpb247XG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QoaWRiVHJhbnNhY3Rpb24uZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIFRyYW5zYWN0aW9uLnByb3RvdHlwZS5vYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fdHgub2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fdHgsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhUcmFuc2FjdGlvbiwgJ190eCcsIFtcbiAgICAnb2JqZWN0U3RvcmVOYW1lcycsXG4gICAgJ21vZGUnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhUcmFuc2FjdGlvbiwgJ190eCcsIElEQlRyYW5zYWN0aW9uLCBbXG4gICAgJ2Fib3J0J1xuICBdKTtcblxuICBmdW5jdGlvbiBVcGdyYWRlREIoZGIsIG9sZFZlcnNpb24sIHRyYW5zYWN0aW9uKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgICB0aGlzLm9sZFZlcnNpb24gPSBvbGRWZXJzaW9uO1xuICAgIHRoaXMudHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24pO1xuICB9XG5cbiAgVXBncmFkZURCLnByb3RvdHlwZS5jcmVhdGVPYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fZGIuY3JlYXRlT2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhVcGdyYWRlREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKFVwZ3JhZGVEQiwgJ19kYicsIElEQkRhdGFiYXNlLCBbXG4gICAgJ2RlbGV0ZU9iamVjdFN0b3JlJyxcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIERCKGRiKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgfVxuXG4gIERCLnByb3RvdHlwZS50cmFuc2FjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24odGhpcy5fZGIudHJhbnNhY3Rpb24uYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhEQiwgJ19kYicsIFtcbiAgICAnbmFtZScsXG4gICAgJ3ZlcnNpb24nLFxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdjbG9zZSdcbiAgXSk7XG5cbiAgLy8gQWRkIGN1cnNvciBpdGVyYXRvcnNcbiAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgb25jZSBicm93c2VycyBkbyB0aGUgcmlnaHQgdGhpbmcgd2l0aCBwcm9taXNlc1xuICBbJ29wZW5DdXJzb3InLCAnb3BlbktleUN1cnNvciddLmZvckVhY2goZnVuY3Rpb24oZnVuY05hbWUpIHtcbiAgICBbT2JqZWN0U3RvcmUsIEluZGV4XS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGVbZnVuY05hbWUucmVwbGFjZSgnb3BlbicsICdpdGVyYXRlJyldID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciByZXF1ZXN0ID0gKHRoaXMuX3N0b3JlIHx8IHRoaXMuX2luZGV4KVtmdW5jTmFtZV0uYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3Muc2xpY2UoMCwgLTEpKTtcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBwb2x5ZmlsbCBnZXRBbGxcbiAgW0luZGV4LCBPYmplY3RTdG9yZV0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgIGlmIChDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsKSByZXR1cm47XG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb3VudCkge1xuICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgIHZhciBpdGVtcyA9IFtdO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICBpbnN0YW5jZS5pdGVyYXRlQ3Vyc29yKHF1ZXJ5LCBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0ZW1zLnB1c2goY3Vyc29yLnZhbHVlKTtcblxuICAgICAgICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zLmxlbmd0aCA9PSBjb3VudCkge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIHZhciBleHAgPSB7XG4gICAgb3BlbjogZnVuY3Rpb24obmFtZSwgdmVyc2lvbiwgdXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ29wZW4nLCBbbmFtZSwgdmVyc2lvbl0pO1xuICAgICAgdmFyIHJlcXVlc3QgPSBwLnJlcXVlc3Q7XG5cbiAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgICAgIHVwZ3JhZGVDYWxsYmFjayhuZXcgVXBncmFkZURCKHJlcXVlc3QucmVzdWx0LCBldmVudC5vbGRWZXJzaW9uLCByZXF1ZXN0LnRyYW5zYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEQihkYik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ2RlbGV0ZURhdGFiYXNlJywgW25hbWVdKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBleHA7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2VsZi5pZGIgPSBleHA7XG4gIH1cbn0oKSk7Il19
