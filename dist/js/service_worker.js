var staticCacheName = 'trains-static-v3';

/*
  When the service worker is installing, it feches the resources and cache them in the current
  version of the cache.
*/
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        './index.html',
        './dist/js/main.js',
        './dist/css/styles.css',
        'https://fonts.googleapis.com/css?family=Baloo+Paaji|Ubuntu',
        './dist/data/stops.txt',
        './dist/data/stop_times.txt',
        './dist/data/routes.txt',
        './dist/data/trips.txt'
      ]);
    })
  );
});

/* 
  When the service worker activates it removes previous versions of the cache
  and this ways it will continue operating on the new version and don't leave rubbish behind.
*/
self.addEventListener('activate', function(event) {

  function isNotCurrentVersion(cacheName) {
    return cacheName != staticCacheName;
  }

  event.waitUntil(
    // Remove any old version of the cache
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(isNotCurrentVersion)
          .map((oldVersionCacheName) => caches.delete(oldVersionCacheName))
      );
    })
  );
});

/*
  Intercept fetch and respond with the cached element if there is a match
*/
self.addEventListener('fetch', function(event) {
  
  //var requestUrl = new URL(event.request.url);
  console.log('Fetching...' + event.request.url);

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );

});
