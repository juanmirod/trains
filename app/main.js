(function() {

  function ready() {
      
    var promise = new Promise(function(resolve, reject) {
      document.addEventListener('readystatechange', function() {
        if(document.readyState !== 'loading') {
          resolve();
        }
      });
    });

    return promise;

  };

  function loadStops() {

    var stops = Routes.stops();
    
    stops.then(function(result){
      //console.log(result);
      var departures = document.getElementById('departure-stops');
      var arrivals = document.getElementById('arrival-stops');

      result.forEach( function addStop(stop) {
        
        var option = '<option value="' + stop.stop_name + ' - ' + stop.stop_id + '"></option>';
        departures.innerHTML += option;
        arrivals.innerHTML += option;

      });

    });

  };

  ready().then(loadStops);
  
  // TODO: get all the lines 
  /*var routes = Routes.routes();
  routes.then(function(result){
    console.log(result);
  });

  var trips = Routes.trips();
  trips.then(function(result){
    console.log(result);
  });*/

})();