import * as Http from '../http.js';
import idb from './db.js';

var waitingForNetwork = false;
// If indexedDB is populated, get the data and try to update from network
// else try to get the data from network and save it
// else we should show a custom error message to the user, the app is nota available.
export function setStops() {

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
      return Http.stops()
        .then(storeStops);

    });

}


function storeStops(results) {

  if(results) { 

      return idb().then(function storeStopsInIDB(db){

        var transaction = db.transaction('stops', 'readwrite');
        var stopsStore = transaction.objectStore('stops');

        results.forEach( function(stop) {
          stopsStore.put(stop);
        });

        return transaction.complete;

      }).catch(function(error) {

        console.error(error);

      });

  }

}

/*
  Get all the stops
*/
export function getAll(stop_id) {

  return setStops()
    .then(() => idb())
    .then(function getStops(db){

      var transaction = db.transaction('stops');
      var stopsStore = transaction.objectStore('stops');

      return stopsStore.getAll();
    });

};

