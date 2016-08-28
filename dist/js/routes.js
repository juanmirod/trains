'use strict';

var Routes = function module() {
  'use strict';

  var baseUrl = '/dist/data/';
  var routesFile = 'routes.txt';
  var tripsFile = 'trips.txt';
  var stopsFile = 'stops.txt';

  var csvToArray = function csvToArray(text) {

    var rows = text.trim().split('\n');
    return rows.map(function (row) {
      return row.split(',');
    });
  };

  var csvToObject = function csvToObject(text) {

    var table = csvToArray(text);
    var keys = table[0];
    table = table.slice(1);

    return table.map(function (row) {
      var obj = {};
      keys.forEach(function (key, index) {
        obj[key] = row[index];
      });
      return obj;
    });
  };

  function getCsvAsObject(url) {

    return fetch(url, {
      method: 'GET'
    }).then(function (response) {

      return response.text();
    }).then(function (textContent) {

      return csvToObject(textContent);
    }).catch(function (error) {

      console.log(error);
    });
  }

  return {

    /*
      Returns a Promise that resolves to an array with the names of the 
      available lines.
    */
    routes: function routes() {

      return getCsvAsObject(baseUrl + routesFile);
    },

    trips: function trips() {
      // get the route/line and return the times for this line
      return getCsvAsObject(baseUrl + tripsFile);
    },

    stops: function stops() {
      // returns the stops of this line
      return getCsvAsObject(baseUrl + stopsFile);
    }

  };
}();