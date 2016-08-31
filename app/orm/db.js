import idb from '../../node_modules/idb/lib/idb.js';

var _db;

// This class works as a ORM that gets the data from indexedDB
function openDatabase() {
  
  return idb.open('trains', 1, function(upgradeDb) {
    var store = upgradeDb.createObjectStore('stops', {
      keyPath: 'stop_id'
    });

    var store = upgradeDb.createObjectStore('trips', {
      keyPath: 'trip_id'
    });

    var store = upgradeDb.createObjectStore('routes', {
      keyPath: 'route_id'
    });
  });

}

export default function db() {
  
  if(_db == null) {
    _db = openDatabase();
  } 

  return _db;

};