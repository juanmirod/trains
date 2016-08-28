'use strict';

(function () {

  var departures, arrivals, submitButton;
  var stops;

  function loadStops() {

    var promise = Routes.stops();

    promise.then(function (result) {

      // keep a reference to the array for validation
      stops = result;

      // add the options to the datalist
      result.forEach(function addStop(stop) {

        var option = '<option value="' + stop.stop_name + ' - ' + stop.stop_id + '"></option>';
        departures.innerHTML += option;
        arrivals.innerHTML += option;
      });
    });
  };

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

  function clearInfoMessage() {
    var messageBox = document.getElementById('message-box');
    messageBox.className = 'alert';
  }

  function checkStation(station) {

    var parts = station.split('-');
    var code = 0;
    if (parts.length > 1) {
      code = parts[1].trim();
    } else {
      code = station;
    }

    return stops.some(function (stop) {
      return stop.stop_id == code;
    });
  }

  function addSubmitHandler() {

    submitButton.addEventListener('click', function (evt) {

      evt.preventDefault();
      clearInfoMessage();

      var departure = document.getElementById('departure').value;
      var arrival = document.getElementById('arrival').value;

      if (!checkStation(departure) || !checkStation(arrival)) {
        showInfoMessage('You have to select a valid departure and arrival stations from the lists or write a valid stop code.', 'error');
        return false;
      }

      // TODO:: if the departure and arrival stations are correct
      // search for a trip between them and show the times and route
      console.log('Valid stations!');
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

    // Initialize the interface
    loadStops();
    addSubmitHandler();
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

  ready().then(init);
})();