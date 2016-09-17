const baseUrl       = '/dist/data/';
const routesFile    = 'routes.txt';
const tripsFile     = 'trips.txt';
const stopsFile     = 'stops.txt';
const stopTimesFile = 'stop_times.txt';
const shapesFile    = 'shapes.txt';

const csvToArray = function(text) {
  
  var rows = text.trim().split('\n');
  return rows.map((row) => row.split(','));

};

const csvToObjects = function(text) {

  var table = csvToArray(text);
  var keys = table[0];
  table = table.slice(1);

  return table.map(function(row) {
    var obj = {};
    keys.forEach(function(key, index) {
      obj[key] = row[index];
    });
    return  obj;
  });

}

function getCsvAsObjects(url) {

  return fetch(url, {
      method: 'GET',
    }).then(function(response){

      return response.text();

    }).then(function(textContent) {

      return csvToObjects(textContent);

    }).catch(function(error){

      console.error(error);

    });
}

// API

/*
  Returns a Promise that resolves to an array with the names of the 
  available lines.
*/
export function routes() {

  return getCsvAsObjects(baseUrl + routesFile);

};

export function trips() {
  // get the route/line and return the times for this line
  return getCsvAsObjects(baseUrl + tripsFile);

};

export function stops() {
  // returns the stops of this line
  return getCsvAsObjects(baseUrl + stopsFile);
};

export function stopTimes() {
  return getCsvAsObjects(baseUrl + stopTimesFile); 
};

export function shapes() {
  return getCsvAsObjects(baseUrl + shapesFile); 
};
