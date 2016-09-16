import * as Http from '../http.js';
import idb from './db.js';

  /*
    This function checks that the data is in IndexedDB, if not, it gets it from network/cache
    and returns a promise that resolves when the data is stored in IDB.
    This way we don't need any initialization function, just call this function in each retrieving
    method and it will get sure that everything is set up before trying to get the content.
  */
  var waitingForNetwork = false;

  function setTrips() {

    return idb().then(db => {

      if(!db) throw 'We couldn\'t access IndexedDB';

      var transaction = db.transaction('trips');
      var tripsStore = transaction.objectStore('trips');

      return tripsStore.count();

    }).then(result => {

      // if there is something in the db, don't bother in getting the data again from network
      if(result > 0 || waitingForNetwork) {
        return Promise.resolve();
      }

      waitingForNetwork = true;

      // if there is nothing in the trips and times table, fill them!
      return Http.stopTimes()
        .then(storeStopTimes)
        .then(Http.trips)
        .then(storeTrips);

    });


  }


  function storeStopTimes(results) {

    if(results) { 

        return idb().then(function storeTripsInIDB(db){

          var transaction = db.transaction('stop_times', 'readwrite');
          var tripsStore = transaction.objectStore('stop_times');

          results.forEach( function(trip) {
            tripsStore.put(trip);
          });

          return transaction.complete;

        }).catch(function(error) {

          // the transaction didn't complete, so the table should be empty
          console.error(error);

        });

    }

  }

  function storeTrips(results) {

    if(results) { 

        return idb().then(function storeTripsInIDB(db){

          var transaction = db.transaction('trips', 'readwrite');
          var tripsStore = transaction.objectStore('trips');

          results.forEach( function(trip) {
            tripsStore.put(trip);
          });

          return transaction.complete;

        }).catch(function(error) {

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
  export function getRoutesForStop(stop_id) {

    return this.getTripsStopTimes(stop_id)
      .then();

  };

  export function appendTripInfo(stop_times) {

    return idb().then(function getAllRoutes(db) {
      var transaction = db.transaction('trips');
      var tripStore = transaction.objectStore('trips');

      var trips = [];
      stop_times.forEach(function appendTripPromise(trip) {

        trips.push(tripStore.get(trip.trip_id));

      });

      return Promise.all(trips);
      
    }).then(function(trips) { 

      return stop_times.map(function(stop, index) {
        stop.trip = trips[index];
        return stop;
      });

    });
  }

  export function getRoutesForTrips(trips) {

    // get the routes for this trips
    return idb().then(function getAllRoutes(db) {
      var transaction = db.transaction('trips');
      var tripStore = transaction.objectStore('trips');

      var routes = [];
      trips.forEach(function appendTripPromise(trip) {

        routes.push(tripStore.get(trip.trip_id));

      });

      return Promise.all(routes);
      
    }).then(function(routes) {

      var service_ids = [];
      var uniqueRoutes = [];
      routes.forEach(function getUniqueServiceIds(trip) {
        if(service_ids.indexOf(trip.service_id) == -1) {
          service_ids.push(trip.service_id);
          uniqueRoutes.push(trip);
        }
      });

      return uniqueRoutes;

    });

  };

  /*
    Get all the times for a stop
  */
  export function getTripStopTimes(stop_id) {

    return setTrips()
      .then(() => idb())
      .then(function getTripsForStop(db){

        var transaction = db.transaction('stop_times');
        var tripsStore = transaction.objectStore('stop_times');
        var stopIndex = tripsStore.index('stop');

        return stopIndex.getAll(stop_id);
      });

  };

  /*
    Get the time for a stop and a trip
  */
  export function getStopInTripTime(stop_id, trip_id) {

    return this.getTripStopTimes(stop_id)
      .then(function getTimeForATrip(trips){
        return trips.filter((trip) => trip.trip_id == trip_id);
      });

  }