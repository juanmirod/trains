import * as Stops from './orm/Stops.js';
import * as Http from './http.js';

// Interactive elements in the page
var departures, arrivals, submitButton;

/* 
  Add the options to the datalist elements in the form.
*/
function addStops(stops) {

  stops.forEach( (stop) => {
    
    var option = `<option value="${stop.stop_name} - ${stop.stop_id}"></option>`;
    departures.innerHTML += option;
    arrivals.innerHTML += option;

  });

}

function showTripTimes(trips) {

  var results = document.getElementById('timetable');
  results.innerHTML = '';
  
  trips.forEach( (trip, index) => {
    
    var row = `<div> ${trip.arrival_time} - ${trip.trip_id} </div>`;
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

  Stops.getAll().then(addStops);

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
  return Stops.getAll().then(function(stops){
    return stops.some(function check(stop) {
      return stop.stop_id == code;
    });
  });

}

function findMatchingTrips(departureTimes, arrivalTimes) {

  // gets all trips that goes to the departure stop and the arrival stop
  var validTrips = departureTimes.filter(function(departureTrip){
    return arrivalTimes.some(function(arrivalTrip){
      return arrivalTrip.trip_id == departureTrip.trip_id;
    });
  });

  return validTrips;
}

/*
  Finds trips between two stations, returns the trips ids
*/
function findTrips(departureId, arrivalId) {

  return Http.stopTimes().then(function(result){
    
    var departureTimes = result.filter(function(time) {
      return time.stop_id == departureId;
    });

    var arrivalTimes = result.filter(function(time) {
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

  Promise.all([checkStation(departure), checkStation(arrival)]).then(function(result){
    
    if(!result[0] || !result[1]) {
      showInfoMessage(
        'You have to select a valid departure and arrival stations from the lists or write a valid stop code.',
        'error'
        );
      return false;
    }
    
    // If the departure and arrival stations are correct
    // search for a trip between them and show the times and route
    findTrips(getStationCode(departure), getStationCode(arrival)).then(function(trips){
      if(trips.length > 0) {
        showTripTimes(trips);
      } else {
        showInfoMessage('We couldn\'t find a trip between these two stations', 'error');
      }

    });
  })


}

/*
  Initialize the application 
*/
export function init() {

  // get the interactive elements of the interface
  departures = document.getElementById('departure-stops');
  arrivals = document.getElementById('arrival-stops');
  submitButton = document.getElementById('search');

  // Populate datalists and add listeners
  loadStops();
  submitButton.addEventListener('click', submitStations);

};
