import idb from '../../node_modules/idb/lib/idb.js';

var _db;

// This class works as a ORM that gets the data from indexedDB
function openDatabase() {
  
  return idb.open('trains', 1, function(upgradeDb) {
    
    switch(upgradeDb.oldVersion) {
    
      case 0:
        upgradeDb.createObjectStore('stops', {
          keyPath: 'stop_id'
        });

        upgradeDb.createObjectStore('trips', {keyPath: 'trip_id'});

        upgradeDb.createObjectStore('stop_times', {autoIncrement: true});

        upgradeDb.createObjectStore('routes', {
          keyPath: 'route_id'
        });

        var tripStore = upgradeDb.transaction.objectStore('stop_times');
        tripStore.createIndex('stop', 'stop_id');
        tripStore.createIndex('trip', 'trip_id');

    }
  });

}

export default function db() {
  
  if(_db == null) {
    _db = openDatabase();
  } 

  return _db;

};