import * as Http from '../http.js';

// This class works as a ORM that gets the data from indexedDB

// If indexedDB is populated, get the data and try to update from network
// else try to get the data from network and save it
// else we should show a custom error message to the user, the app is nota available.
export function getAll() {

  return Http.stops();

  /*.then(function(result){

    // TODO:: store the result in indexedDB


  });*/

}


