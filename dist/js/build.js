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

var departures, arrivals, submitButton;
var stops;

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
  return stops.some(function check(stop) {
    return stop.stop_id == code;
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

  if (!checkStation(departure) || !checkStation(arrival)) {
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

  ready().then(App.init);
})();

},{"./app.js":1}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAll = getAll;

var _http = require('../http.js');

var Http = _interopRequireWildcard(_http);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// This class works as a ORM that gets the data from indexedDB

// If indexedDB is populated, get the data and try to update from network
// else try to get the data from network and save it
// else we should show a custom error message to the user, the app is nota available.
function getAll() {

  return Http.stops();

  /*.then(function(result){
     // TODO:: store the result in indexedDB
    });*/
}

},{"../http.js":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwiYXBwL2h0dHAuanMiLCJhcHAvbWFpbi5qcyIsImFwcC9vcm0vU3RvcHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztRQ2lMZ0IsSSxHQUFBLEk7O0FBakxoQjs7SUFBWSxLOztBQUNaOztJQUFZLEk7Ozs7QUFFWixJQUFJLFVBQUosRUFBZ0IsUUFBaEIsRUFBMEIsWUFBMUI7QUFDQSxJQUFJLEtBQUo7O0FBRUE7OztBQUdBLFNBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5Qjs7QUFFdkIsUUFBTSxPQUFOLENBQWUsVUFBQyxJQUFELEVBQVU7O0FBRXZCLFFBQUksNkJBQTJCLEtBQUssU0FBaEMsV0FBK0MsS0FBSyxPQUFwRCxnQkFBSjtBQUNBLGVBQVcsU0FBWCxJQUF3QixNQUF4QjtBQUNBLGFBQVMsU0FBVCxJQUFzQixNQUF0QjtBQUVELEdBTkQ7QUFRRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsRUFBOEI7O0FBRTVCLE1BQUksVUFBVSxTQUFTLGNBQVQsQ0FBd0IsV0FBeEIsQ0FBZDtBQUNBLFVBQVEsU0FBUixHQUFvQixFQUFwQjs7QUFFQSxRQUFNLE9BQU4sQ0FBZSxVQUFDLElBQUQsRUFBTyxLQUFQLEVBQWlCOztBQUU5QixRQUFJLGlCQUFlLEtBQUssWUFBcEIsV0FBc0MsS0FBSyxPQUEzQyxZQUFKO0FBQ0EsWUFBUSxTQUFSLElBQXFCLEdBQXJCO0FBRUQsR0FMRDtBQU9EOztBQUVEOzs7QUFHQSxTQUFTLGVBQVQsQ0FBeUIsT0FBekIsRUFBa0MsSUFBbEMsRUFBd0M7O0FBRXRDLE1BQUksYUFBYSxTQUFTLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBakI7QUFDQSxhQUFXLFNBQVgsR0FBdUIsT0FBdkI7O0FBRUEsYUFBVyxTQUFYLEdBQXVCLE9BQXZCOztBQUVBLFVBQU8sSUFBUDtB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QUFMLEVBQVA7O0FBRUE7OztBQU9EIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCAqIGFzIFN0b3BzIGZyb20gJy4vb3JtL1N0b3BzLmpzJztcbmltcG9ydCAqIGFzIEh0dHAgZnJvbSAnLi9odHRwLmpzJztcblxudmFyIGRlcGFydHVyZXMsIGFycml2YWxzLCBzdWJtaXRCdXR0b247XG52YXIgc3RvcHM7XG5cbi8qIFxuICBBZGQgdGhlIG9wdGlvbnMgdG8gdGhlIGRhdGFsaXN0IGVsZW1lbnRzIGluIHRoZSBmb3JtLlxuKi9cbmZ1bmN0aW9uIGFkZFN0b3BzKHN0b3BzKSB7XG5cbiAgc3RvcHMuZm9yRWFjaCggKHN0b3ApID0+IHtcbiAgICBcbiAgICB2YXIgb3B0aW9uID0gYDxvcHRpb24gdmFsdWU9XCIke3N0b3Auc3RvcF9uYW1lfSAtICR7c3RvcC5zdG9wX2lkfVwiPjwvb3B0aW9uPmA7XG4gICAgZGVwYXJ0dXJlcy5pbm5lckhUTUwgKz0gb3B0aW9uO1xuICAgIGFycml2YWxzLmlubmVySFRNTCArPSBvcHRpb247XG5cbiAgfSk7XG5cbn1cblxuZnVuY3Rpb24gc2hvd1RyaXBUaW1lcyh0cmlwcykge1xuXG4gIHZhciByZXN1bHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWV0YWJsZScpO1xuICByZXN1bHRzLmlubmVySFRNTCA9ICcnO1xuICBcbiAgdHJpcHMuZm9yRWFjaCggKHRyaXAsIGluZGV4KSA9PiB7XG4gICAgXG4gICAgdmFyIHJvdyA9IGA8ZGl2PiAke3RyaXAuYXJyaXZhbF90aW1lfSAtICR7dHJpcC50cmlwX2lkfSA8L2Rpdj5gO1xuICAgIHJlc3VsdHMuaW5uZXJIVE1MICs9IHJvdztcblxuICB9KTtcblxufVxuXG4vKlxuICBTaG93cyBhIG1lc3NhZ2UgaW4gdGhlIG1lc3NhZ2UtYm94IGVsZW1lbnQuXG4qL1xuZnVuY3Rpb24gc2hvd0luZm9NZXNzYWdlKG1lc3NhZ2UsIHR5cGUpIHtcblxuICB2YXIgbWVzc2FnZUJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZXNzYWdlLWJveCcpO1xuICBtZXNzYWdlQm94LmlubmVySFRNTCA9IG1lc3NhZ2U7XG5cbiAgbWVzc2FnZUJveC5jbGFzc05hbWUgPSAnYWxlcnQnO1xuICBcbiAgc3dpdGNoKHR5cGUpIHtcbiAgICBjYXNlICdlcnJvcic6XG4gICAgICBtZXNzYWdlQm94LmNsYXNzTmFtZSArPSAnIGVycm9yJztcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBtZXNzYWdlQm94LmNsYXNzTmFtZSArPSAnIGluZm8nO1xuICAgICAgYnJlYWs7ICAgIFxuICB9XG5cbn1cblxuLypcbiAgTWFrZXMgdGhlIG1lc3NhZ2UtYm94IGVsZW1lbnQgZGlzYXBwZWFyIHRocm91Z2ggY3NzIGNsYXNzXG4qL1xuZnVuY3Rpb24gY2xlYXJJbmZvTWVzc2FnZSgpIHtcbiAgdmFyIG1lc3NhZ2VCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZS1ib3gnKTtcbiAgbWVzc2FnZUJveC5jbGFzc05hbWUgPSAnYWxlcnQnO1xufVxuXG5cbi8qXG4gIFJlcXVlc3QgdGhlIHN0b3BzIGZyb20gc2VydmVyIGFuZCBhZGQgdGhlbSB0byBhbiBhcnJheVxuICB0byBiZSBhYmxlIHRvIGNoZWNrIHRoYXQgdGhlIHVzZXIgaW5wdXQgaXMgdmFsaWQuXG4qL1xuZnVuY3Rpb24gbG9hZFN0b3BzKCkge1xuXG4gIFN0b3BzLmdldEFsbCgpLnRoZW4oYWRkU3RvcHMpO1xuXG59O1xuXG4vKlxuICBHZXQgdGhlIHN0YXRpb24gY29kZSBmcm9tIGEgc3RyaW5nXG4qL1xuZnVuY3Rpb24gZ2V0U3RhdGlvbkNvZGUoc3RhdGlvbikge1xuXG4gIHZhciBwYXJ0cyA9IHN0YXRpb24uc3BsaXQoJy0nKTtcbiAgXG4gIGlmKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAvLyBUaGlzIGNvdWxkIGJlIGEgc3RyaW5nIGZyb20gdGhlIGRhdGFsaXN0LCBleHRyYWN0IHRoZSBjb2RlXG4gICAgcmV0dXJuIHBhcnRzWzFdLnRyaW0oKTtcbiAgfSBcblxuICAvLyBUaGlzIGNvdWxkIGJlIGEgY29kZSB3cml0dGVuIGJ5IHRoZSB1c2VyXG4gIHJldHVybiBzdGF0aW9uO1xuICBcbn1cblxuLypcbiAgQ2hlY2sgdGhhdCBhIGNvZGUgaXMgZWl0aGVyIGEgcGFpciBzdGF0aW9uIG5hbWUgLSBzdGF0aW9uIGNvZGUgXG4gIGZyb20gdGhlIGZvcm0gZGF0YWxpc3Qgb3IgYSBjb2RlIG9mIGEgc3RvcCB3cml0dGVuIGJ5IHRoZSB1c2VyLlxuKi9cbmZ1bmN0aW9uIGNoZWNrU3RhdGlvbihzdGF0aW9uKSB7XG5cbiAgdmFyIGNvZGUgPSBnZXRTdGF0aW9uQ29kZShzdGF0aW9uKTtcblxuICAvLyBDaGVjayB0aGF0IHRoZSBjb2RlIGlzIGluIHRoZSBsaXN0IG9mIHN0b3BzXG4gIHJldHVybiBzdG9wcy5zb21lKGZ1bmN0aW9uIGNoZWNrKHN0b3ApIHtcbiAgICByZXR1cm4gc3RvcC5zdG9wX2lkID09IGNvZGU7XG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGZpbmRNYXRjaGluZ1RyaXBzKGRlcGFydHVyZVRpbWVzLCBhcnJpdmFsVGltZXMpIHtcblxuICAvLyBnZXRzIGFsbCB0cmlwcyB0aGF0IGdvZXMgdG8gdGhlIGRlcGFydHVyZSBzdG9wIGFuZCB0aGUgYXJyaXZhbCBzdG9wXG4gIHZhciB2YWxpZFRyaXBzID0gZGVwYXJ0dXJlVGltZXMuZmlsdGVyKGZ1bmN0aW9uKGRlcGFydHVyZVRyaXApe1xuICAgIHJldHVybiBhcnJpdmFsVGltZXMuc29tZShmdW5jdGlvbihhcnJpdmFsVHJpcCl7XG4gICAgICByZXR1cm4gYXJyaXZhbFRyaXAudHJpcF9pZCA9PSBkZXBhcnR1cmVUcmlwLnRyaXBfaWQ7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiB2YWxpZFRyaXBzO1xufVxuXG4vKlxuICBGaW5kcyB0cmlwcyBiZXR3ZWVuIHR3byBzdGF0aW9ucywgcmV0dXJucyB0aGUgdHJpcHMgaWRzXG4qL1xuZnVuY3Rpb24gZmluZFRyaXBzKGRlcGFydHVyZUlkLCBhcnJpdmFsSWQpIHtcblxuICByZXR1cm4gSHR0cC5zdG9wVGltZXMoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgXG4gICAgdmFyIGRlcGFydHVyZVRpbWVzID0gcmVzdWx0LmZpbHRlcihmdW5jdGlvbih0aW1lKSB7XG4gICAgICByZXR1cm4gdGltZS5zdG9wX2lkID09IGRlcGFydHVyZUlkO1xuICAgIH0pO1xuXG4gICAgdmFyIGFycml2YWxUaW1lcyA9IHJlc3VsdC5maWx0ZXIoZnVuY3Rpb24odGltZSkge1xuICAgICAgcmV0dXJuIHRpbWUuc3RvcF9pZCA9PSBhcnJpdmFsSWQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmluZE1hdGNoaW5nVHJpcHMoZGVwYXJ0dXJlVGltZXMsIGFycml2YWxUaW1lcyk7XG5cbiAgfSk7XG5cbn1cblxuLypcbiAgU3VibWl0IHRoZSB1c2VyIHNlbGVjdGlvbiBhbmQgc2hvdyB0aGUgcm91dGUgaWYgYXZhaWxhYmxlIG9yIGFuXG4gIGVycm9yIG1lc3NhZ2UgaWYgbm8gcm91dGUgaXMgYXZhaWxhYmxlLlxuKi9cbmZ1bmN0aW9uIHN1Ym1pdFN0YXRpb25zKGV2dCkge1xuXG4gIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICBjbGVhckluZm9NZXNzYWdlKCk7XG4gIFxuICAvLyBnZXQgdGhlIGlucHV0cyB2YWx1ZXNcbiAgdmFyIGRlcGFydHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBhcnR1cmUnKS52YWx1ZTtcbiAgdmFyIGFycml2YWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXJyaXZhbCcpLnZhbHVlO1xuXG4gIGlmKCFjaGVja1N0YXRpb24oZGVwYXJ0dXJlKSB8fCAhY2hlY2tTdGF0aW9uKGFycml2YWwpKSB7XG4gICAgc2hvd0luZm9NZXNzYWdlKFxuICAgICAgJ1lvdSBoYXZlIHRvIHNlbGVjdCBhIHZhbGlkIGRlcGFydHVyZSBhbmQgYXJyaXZhbCBzdGF0aW9ucyBmcm9tIHRoZSBsaXN0cyBvciB3cml0ZSBhIHZhbGlkIHN0b3AgY29kZS4nLFxuICAgICAgJ2Vycm9yJ1xuICAgICAgKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBJZiB0aGUgZGVwYXJ0dXJlIGFuZCBhcnJpdmFsIHN0YXRpb25zIGFyZSBjb3JyZWN0XG4gIC8vIHNlYXJjaCBmb3IgYSB0cmlwIGJldHdlZW4gdGhlbSBhbmQgc2hvdyB0aGUgdGltZXMgYW5kIHJvdXRlXG4gIGZpbmRUcmlwcyhnZXRTdGF0aW9uQ29kZShkZXBhcnR1cmUpLCBnZXRTdGF0aW9uQ29kZShhcnJpdmFsKSkudGhlbihmdW5jdGlvbih0cmlwcyl7XG4gICAgaWYodHJpcHMubGVuZ3RoID4gMCkge1xuICAgICAgc2hvd1RyaXBUaW1lcyh0cmlwcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNob3dJbmZvTWVzc2FnZSgnV2UgY291bGRuXFwndCBmaW5kIGEgdHJpcCBiZXR3ZWVuIHRoZXNlIHR3byBzdGF0aW9ucycsICdlcnJvcicpO1xuICAgIH1cblxuICB9KTtcblxufVxuXG4vKlxuICBJbml0aWFsaXplIHRoZSBhcHBsaWNhdGlvbiBcbiovXG5leHBvcnQgZnVuY3Rpb24gaW5pdCgpIHtcblxuICAvLyBnZXQgdGhlIGludGVyYWN0aXZlIGVsZW1lbnRzIG9mIHRoZSBpbnRlcmZhY2VcbiAgZGVwYXJ0dXJlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBhcnR1cmUtc3RvcHMnKTtcbiAgYXJyaXZhbHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXJyaXZhbC1zdG9wcycpO1xuICBzdWJtaXRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VhcmNoJyk7XG5cbiAgLy8gUG9wdWxhdGUgZGF0YWxpc3RzIGFuZCBhZGQgbGlzdGVuZXJzXG4gIGxvYWRTdG9wcygpO1xuICBzdWJtaXRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdWJtaXRTdGF0aW9ucyk7XG5cbn07XG4iLCJjb25zdCBiYXNlVXJsICAgICAgID0gJy9kaXN0L2RhdGEvJztcbmNvbnN0IHJvdXRlc0ZpbGUgICAgPSAncm91dGVzLnR4dCc7XG5jb25zdCB0cmlwc0ZpbGUgICAgID0gJ3RyaXBzLnR4dCc7XG5jb25zdCBzdG9wc0ZpbGUgICAgID0gJ3N0b3BzLnR4dCc7XG5jb25zdCBzdG9wVGltZXNGaWxlID0gJ3N0b3BfdGltZXMudHh0JztcblxuY29uc3QgY3N2VG9BcnJheSA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgXG4gIHZhciByb3dzID0gdGV4dC50cmltKCkuc3BsaXQoJ1xcbicpO1xuICByZXR1cm4gcm93cy5tYXAoKHJvdykgPT4gcm93LnNwbGl0KCcsJykpO1xuXG59O1xuXG5jb25zdCBjc3ZUb09iamVjdHMgPSBmdW5jdGlvbih0ZXh0KSB7XG5cbiAgdmFyIHRhYmxlID0gY3N2VG9BcnJheSh0ZXh0KTtcbiAgdmFyIGtleXMgPSB0YWJsZVswXTtcbiAgdGFibGUgPSB0YWJsZS5zbGljZSgxKTtcblxuICByZXR1cm4gdGFibGUubWFwKGZ1bmN0aW9uKHJvdykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuICAgICAgb2JqW2tleV0gPSByb3dbaW5kZXhdO1xuICAgIH0pO1xuICAgIHJldHVybiAgb2JqO1xuICB9KTtcblxufVxuXG5mdW5jdGlvbiBnZXRDc3ZBc09iamVjdHModXJsKSB7XG5cbiAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKTtcblxuICAgIH0pLnRoZW4oZnVuY3Rpb24odGV4dENvbnRlbnQpIHtcblxuICAgICAgcmV0dXJuIGNzdlRvT2JqZWN0cyh0ZXh0Q29udGVudCk7XG5cbiAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgfSk7XG59XG5cbi8vIEFQSVxuXG4vKlxuICBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIGFycmF5IHdpdGggdGhlIG5hbWVzIG9mIHRoZSBcbiAgYXZhaWxhYmxlIGxpbmVzLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZXMoKSB7XG5cbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgcm91dGVzRmlsZSk7XG5cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmlwcygpIHtcbiAgLy8gZ2V0IHRoZSByb3V0ZS9saW5lIGFuZCByZXR1cm4gdGhlIHRpbWVzIGZvciB0aGlzIGxpbmVcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgdHJpcHNGaWxlKTtcblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BzKCkge1xuICAvLyByZXR1cm5zIHRoZSBzdG9wcyBvZiB0aGlzIGxpbmVcbiAgcmV0dXJuIGdldENzdkFzT2JqZWN0cyhiYXNlVXJsICsgc3RvcHNGaWxlKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wVGltZXMoKSB7XG4gIHJldHVybiBnZXRDc3ZBc09iamVjdHMoYmFzZVVybCArIHN0b3BUaW1lc0ZpbGUpOyBcbn07XG4iLCJpbXBvcnQgKiBhcyBBcHAgZnJvbSAnLi9hcHAuanMnO1xuXG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgICBcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBcbiAgICAgIC8vIHJlc29sdmUgdGhlIHByb21pc2Ugd2hlbiB0aGUgZG9jdW1lbnQgaXMgcmVhZHlcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0pO1xuXG4gIH07XG5cbiAgcmVhZHkoKS50aGVuKEFwcC5pbml0KTtcblxufSkoKTsiLCJpbXBvcnQgKiBhcyBIdHRwIGZyb20gJy4uL2h0dHAuanMnO1xuXG4vLyBUaGlzIGNsYXNzIHdvcmtzIGFzIGEgT1JNIHRoYXQgZ2V0cyB0aGUgZGF0YSBmcm9tIGluZGV4ZWREQlxuXG4vLyBJZiBpbmRleGVkREIgaXMgcG9wdWxhdGVkLCBnZXQgdGhlIGRhdGEgYW5kIHRyeSB0byB1cGRhdGUgZnJvbSBuZXR3b3JrXG4vLyBlbHNlIHRyeSB0byBnZXQgdGhlIGRhdGEgZnJvbSBuZXR3b3JrIGFuZCBzYXZlIGl0XG4vLyBlbHNlIHdlIHNob3VsZCBzaG93IGEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgdG8gdGhlIHVzZXIsIHRoZSBhcHAgaXMgbm90YSBhdmFpbGFibGUuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsKCkge1xuXG4gIHJldHVybiBIdHRwLnN0b3BzKCk7XG5cbiAgLyoudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuXG4gICAgLy8gVE9ETzo6IHN0b3JlIHRoZSByZXN1bHQgaW4gaW5kZXhlZERCXG5cblxuICB9KTsqL1xuXG59XG5cblxuIl19
