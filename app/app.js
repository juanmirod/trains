var App = (function() {
  
  var departures, arrivals, submitButton;
  var stops;

  function loadStops() {

    var promise = Routes.stops();
    
    promise.then(function(result){
      
      // keep a reference to the array for validation
      stops = result;

      // add the options to the datalist
      result.forEach( function addStop(stop) {
        
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
    
    switch(type) {
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

  /*
    Check that a code is either a pair station name - station code 
    from the form datalist or a code of a stop written by the user.
  */
  function checkStation(station) {

    var parts = station.split('-');
    var code = 0;
    
    if(parts.length > 1) {
      // This could be a string from the datalist, extract the code
      code = parts[1].trim();
    } else {
      // This could be a code written by the user
      code = station;
    }

    // Check that the code is in the list of stops
    return stops.some(function(stop) {
      return stop.stop_id == code;
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

      // Initialize the interface
      loadStops();
      submitButton.addEventListener('click', submitStations);

    }
 
  };

})();