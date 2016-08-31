import * as Http from '../http.js';
import idb from './db.js';

// If indexedDB is populated, get the data and try to update from network
// else try to get the data from network and save it
// else we should show a custom error message to the user, the app is nota available.
export function getAll() {

  return Http.stops().then(function(results){

    if(!results) {

      return idb().then(function(db){ 
        var transaction = db.transaction('stops');
         return transaction.objectStore('stops').getAll();
      });
      
    }

    // If I get results store the result in indexedDB
    return idb().then(function(db){

      var transaction = db.transaction('stops', 'readwrite');
      var stopsStore = transaction.objectStore('stops');

      results.forEach( function(stop) {
        stopsStore.put(stop);
      });

      return transaction.complete;

    }).then(function(){

      return results;

    });

  });

}


