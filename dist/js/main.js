"use strict";

(function () {

  // TODO: get all the lines 
  var routes = Routes.routes();
  routes.then(function (result) {
    console.log(result);
  });

  var trips = Routes.trips();
  trips.then(function (result) {
    console.log(result);
  });

  var stops = Routes.stops();
  stops.then(function (result) {
    console.log(result);
  });

  // TODO: get all stops for each line

  // TODO: populate the input fields

  // TODO: add a submit handler
})();