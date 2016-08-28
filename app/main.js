(function() {
  
  // TODO: get all the lines 
  var routes = Routes.routes();
  routes.then(function(result){
    console.log(result);
  });

  var trips = Routes.trips();
  trips.then(function(result){
    console.log(result);
  });

  var stops = Routes.stops();
  stops.then(function(result){
    //console.log(result);
    var departures = document.getElementById('departure-stops');
    var arrivals = document.getElementById('arrival-stops');

    result.forEach( function(stop) {
      // statements
      var option = '<option value="' + stop.stop_name + ' - ' + stop.stop_id + '"></option>';
      departures.innerHTML += option;
      arrivals.innerHTML += option;    
    });

  });


  // TODO: get all stops for each line

  // TODO: populate the input fields

  // TODO: add a submit handler

})();