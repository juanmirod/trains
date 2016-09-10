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

  dbPromise = idb.open('test-db', 4, function(upgradeDb) {
  switch(upgradeDb.oldVersion) {
    case 0:
      var keyValStore = upgradeDb.createObjectStore('keyval');
      keyValStore.put("world", "hello");
    case 1:
      upgradeDb.createObjectStore('people', { keyPath: 'name' });
    case 2:
      var peopleStore = upgradeDb.transaction.objectStore('people');
      peopleStore.createIndex('animal', 'favoriteAnimal');
    case 3:
      peopleStore = upgradeDb.transaction.objectStore('people');
      peopleStore.createIndex('age', 'age');
  }
});

}

export default function db() {
  
  if(_db == null) {
    _db = openDatabase();
  } 

  return _db;

};