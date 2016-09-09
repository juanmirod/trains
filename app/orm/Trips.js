import * as Http from '../http.js';
import idb from './db.js';

  /*
    This function checks that the data is in IndexedDB, if not, it gets it from network/cache
    and returns a promise that resolves when the data is stored in IDB.
    This way we don't need any initialization function, just call this function in each retrieving
    method and it will get sure that everything is set up before trying to get the content.
  */
  function setTrips() {

    return idb().then(db => {

      if(!db) throw 'We couldn\'t access IndexedDB';

      var transaction = db.transaction('trips');
      var tripsStore = transaction.objectStore('trips');

      return tripsStore.count();

    }).then(result => {

      // if there is something in the db, don't bother in getting the data again from network
      if(result > 0) {
        console.log(result);
        return Promise.resolve();
      }

      // if there is nothing in the trips table, fill it!
      return Http.stopTimes().then(function getStopTimesFromNetwork(results) {

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

      });

    });


  }


  // If indexedDB is populated, get the data and try to update from network
  // else try to get the data from network and save it
  // else we should show a custom error message to the user, the app is nota available.

  /*
    Get the trips that stop at stop_id, one per route, independently of stop times
  */
  export function getRoutesForStop(stop_id) {

    return this.getTripsStopTimes(stop_id)
      .then(function getRoutesForTrips(trips) {

        var routes = [];
        trips.forEach(function getUniqueRoutes(trip) {
          if(routes.indexOf(trip.route_id) == -1) {
            routes.push(trip.route_id);
          }
        });

        return routes;

      });

  };

  /*
    Get all the times for a stop
  */
  export function getTripStopTimes(stop_id) {

    return setTrips()
      .then(() => idb())
      .then(function getTripsForStop(db){

        var transaction = db.transaction('trips');
        var tripsStore = transaction.objectStore('trips');
        var stopIndex = tripsStore.index('stop');

        return stopIndex.getAll(stop_id);
      });

  };

  /*
    Get all the trips for a route
  */
  export function getTripsForRoute(route_id) {

  };

  /*
    Get all the stops for a route
  */
  export function getStopsForRoute(route_id) {

  };
