var App = (function() {
  
  var departures, arrivals, submitButton;
  var stops;

  /* 
    Add the options to the datalist elements in the form.
  */
  function addStops(stops) {

    stops.forEach( function addStop(stop) {
      
      var option = '<option value="' + stop.stop_name + ' - ' + stop.stop_id + '"></option>';
      departures.innerHTML += option;
      arrivals.innerHTML += option;

    });

  }

  /*
    Shows a message in the message-box element.
  */
  function showInfoMessage(message, type) {

    var messageBox = document.getElementById('message-box');
    messageBox.innerHTML = message;

    messageBox.className = 'alert';
    
    switch(type) {
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

    var promise = Routes.stops();
    
    promise.then(function(result){
      
      // keep a reference to the array for validation
      stops = result;

      addStops(stops);

    });

  };

  /*
    Get the station code from a string
  */
  function getStationCode(station) {

    var parts = station.split('-');
    
    if(parts.length > 1) {
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
    return stops.some(function(stop) {
      return stop.stop_id == code;
    });

  }

  /*
    Finds a trip between two stations, returns the trip id
  */
  function findTrip(departureId, arrivalId) {

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
  
    if(!checkStation(departure) || !checkStation(arrival)) {
      showInfoMessage(
        'You have to select a valid departure and arrival stations from the lists or write a valid stop code.',
        'error'
        );
      return false;
    }

    // If the departure and arrival stations are correct
    // search for a trip between them and show the times and route
    console.log('Valid stations!');
    findTrip(getStationCode(departure), getStationCode(arrival));

  }

  return {
    /*
      Initialize the application 
    */
    init: function() {

      // get the interactive elements of the interface
      departures = document.getElementById('departure-stops');
      arrivals = document.getElementById('arrival-stops');
      submitButton = document.getElementById('search');

      // Populate datalists and add listeners
      loadStops();
      submitButton.addEventListener('click', submitStations);

    }
 
  };

})();