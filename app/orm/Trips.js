var Trips = (function module() {
'use strict';

  // This class works as a ORM that gets the data from indexedDB
  return {

    // If indexedDB is populated, get the data and try to update from network
    // else try to get the data from network and save it
    // else we should show a custom error message to the user, the app is nota available.
    getUniqueRouteTripsFor: function(stop_id) {

    },

    getTripsForRoute: function(route_id) {

    },

    getStopsForRoute: function(route_id) {

    }
    
  }

})();