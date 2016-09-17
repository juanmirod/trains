import * as Stops from './orm/Stops.js';
import * as Trips from './orm/Trips.js';
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

function showTripTimes(departure_id, arrival_id, stop_times, routes) {

  var container = document.getElementById('route-result');
  var results = document.getElementById('timetable');
  results.innerHTML = '';
  container.style.opacity = 1;

  var uniqueRoutes = [];
  var options = [];
  var tripsPromises = [];


  // Get the times for each trip
  routes.forEach( (route) => {

    options[route.service_id] = '';

    var routeTrips = stop_times
      .filter((stop) => stop.trip.service_id == route.service_id );

    routeTrips.forEach(function (trip) {

      var departurePromise = Trips.getStopInTripTime(departure_id, trip.trip_id);
      var arrivalPromise = Trips.getStopInTripTime(arrival_id, trip.trip_id);
      
      tripsPromises.push(Promise.all([departurePromise, arrivalPromise]).then(function([departureTime, arrivalTime]) {
        
        var durationInSeconds = timeToSeconds(arrivalTime[0].arrival_time) - timeToSeconds(departureTime[0].arrival_time);
        var duration = secondsToTime(durationInSeconds);

        options[route.service_id] += `<div class="row">
                                      <div class="col-33 cell">
                                        ${departureTime[0].stop_id} - ${departureTime[0].arrival_time}
                                      </div>
                                      <div class="col-33 cell">
                                        ${arrivalTime[0].stop_id} - ${arrivalTime[0].arrival_time}
                                      </div>
                                      <div class="col-33 cell">
                                        ${duration}
                                      </div>
                                    </div>`;
        
      }));

    });

  });

  // create html for each route, adding the times calculated for each trip
  Promise.all(tripsPromises).then(function() {

    routes.forEach( (route, index) => {
    
      if(uniqueRoutes.indexOf(route.service_id) == -1) {
        // new route!!
        uniqueRoutes.push(route.service_id);
        var row =`<div class="">
                    Route: ${route.route_id}
                  </div>
                  <div class="">
                    Service: ${route.service_id}
                  </div>
                  <div class="table"> 
                      <div class="row"> 
                        <div class="col-33 cell">Depart. - Time</div>
                        <div class="col-33 cell">Arriv. - Time</div>
                        <div class="col-33 cell">Duration</div>
                      </div>
                      ${options[route.service_id]}
                      <hr>
                  </div>`;
    
        results.innerHTML += row;
      }

    });

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

/*
  Takes a time in 00:00:00 format and returns the number of seconds
  from 00:00:00 to the provided time.
*/
function timeToSeconds(time) {

  var timeParts = time.split(':').map(num => parseInt(num));
  return timeParts[0]*3600 + timeParts[1]*60 + timeParts[2];

}

function secondsToTime(seconds) {

  var hours = Math.floor(seconds/3600);
  var minutes = Math.floor((seconds - hours*3600)/60);
  return `${twoDigits(hours)}:${twoDigits(minutes)}:${twoDigits(seconds%60)}`;

}

function twoDigits(number) {
  
  return number > 9 ? `${number}` : `0${number}`; 

}

/*
  Auxiliary function to find trips that meet the requirements 
   - A valid trip must go to both the departure stop and the arrival stop
   - A valid trip must go first to the departure stop, ie the departure stop time must 
   be before the arrival stop time.
*/
function findMatchingTrips(departureTimes, arrivalTimes) {

  // gets all trips that goes to the departure stop and the arrival stop
  var validTrips = departureTimes.filter(function(departureTrip){
    return arrivalTimes.some(function(arrivalTrip){
      return arrivalTrip.trip_id == departureTrip.trip_id && 
        timeToSeconds(departureTrip.arrival_time) < timeToSeconds(arrivalTrip.arrival_time);
    });
  });

  return validTrips;
}

/*
  Finds trips between two stations, returns the trips ids
*/
function findTrips(departureId, arrivalId) {

  return Promise.all([Trips.getTripStopTimes(departureId), Trips.getTripStopTimes(arrivalId)]).then(
      function([departureTimes, arrivalTimes]) {
      
        var stop_times = findMatchingTrips(departureTimes, arrivalTimes);
        return {trips: Trips.appendTripInfo(stop_times), routes: Trips.getRoutesForTrips(stop_times)};

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
  var departure_id = getStationCode(document.getElementById('departure').value);
  var arrival_id = getStationCode(document.getElementById('arrival').value);

  Promise.all([checkStation(departure_id), checkStation(arrival_id)]).then(function(result){
    
    if(!result[0] || !result[1]) {
      showInfoMessage(
        'You have to select a valid departure and arrival stations from the lists or write a valid stop code.',
        'error'
        );
      return false;
    }
    
    // If the departure and arrival stations are correct
    // search for a trip between them and show the times and route
    findTrips(departure_id, arrival_id).then(function(data) {

      Promise.all([data.trips, data.routes]).then(function([trips, routes]){
        
        if(routes.length > 0) {
          showTripTimes(departure_id, arrival_id, trips, routes);
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
export function init() {

  // get the interactive elements of the interface
  departures = document.getElementById('departure-stops');
  arrivals = document.getElementById('arrival-stops');
  submitButton = document.getElementById('search');

  // Populate datalists and add listeners
  loadStops();
  submitButton.addEventListener('click', submitStations);

};
