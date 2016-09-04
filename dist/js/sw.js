(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var staticCacheName = 'trains-static-v2';

/*
  When the service worker is installing, it feches the resources and cache them in the current
  version of the cache.
*/
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(staticCacheName).then(function (cache) {
    return cache.addAll(['/index.html', '/dist/js/main.js', '/dist/css/styles.css', 'https://fonts.googleapis.com/css?family=Baloo+Paaji|Ubuntu', '/dist/data/stops.txt', '/dist/data/stop_times.txt', '/dist/data/routes.txt', '/dist/data/trips.txt']);
  }));
});

/* 
  When the service worker activates it removes previous versions of the cache
  and this ways it will continue operating on the new version and don't leave rubbish behind.
*/
self.addEventListener('activate', function (event) {

  function isNotCurrentVersion(cacheName) {
    return cacheName != staticCacheName;
  }

  event.waitUntil(
  // Remove any old version of the cache
  caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.filter(isNotCurrentVersion).map(function (oldVersionCacheName) {
      return caches.delete(oldVersionCacheName);
    }));
  }));
});

/*
  Intercept fetch and respond with the cached element if there is a match
*/
self.addEventListener('fetch', function (event) {

  var requestUrl = new URL(event.request.url);
  console.log('Fetching...' + requestUrl);

  event.respondWith(new Response('Hello World!'));
  /*  caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );*/
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2VydmljZV93b3JrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLElBQUksa0JBQWtCLGtCQUF0Qjs7QUFFQTs7OztBQUlBLEtBQUssZ0JBQUwsQ0FBc0IsU0FBdEIsRUFBaUMsVUFBUyxLQUFULEVBQWdCO0FBQy9DLFFBQU0sU0FBTixDQUNFLE9BQU8sSUFBUCxDQUFZLGVBQVosRUFBNkIsSUFBN0IsQ0FBa0MsVUFBUyxLQUFULEVBQWdCO0FBQ2hELFdBQU8sTUFBTSxNQUFOLENBQWEsQ0FDbEIsYUFEa0IsRUFFbEIsa0JBRmtCLEVBR2xCLHNCQUhrQixFQUlsQiw0REFKa0IsRUFLbEIsc0JBTGtCLEVBTWxCLDJCQU5rQixFQU9sQix1QkFQa0IsRUFRbEIsc0JBUmtCLENBQWIsQ0FBUDtBQVVELEdBWEQsQ0FERjtBQWNELENBZkQ7O0FBaUJBOzs7O0FBSUEsS0FBSyxnQkFBTCxDQUFzQixVQUF0QixFQUFrQyxVQUFTLEtBQVQsRUFBZ0I7O0FBRWhELFdBQVMsbUJBQVQsQ0FBNkIsU0FBN0IsRUFBd0M7QUFDdEMsV0FBTyxhQUFhLGVBQXBCO0FBQ0Q7O0FBRUQsUUFBTSxTQUFOO0FBQ0U7QUFDQSxTQUFPLElBQVAsR0FBYyxJQUFkLENBQW1CLFVBQVMsVUFBVCxFQUFxQjtBQUN0QyxXQUFPLFFBQVEsR0FBUixDQUNMLFdBQ0csTUFESCxDQUNVLG1CQURWLEVBRUcsR0FGSCxDQUVPLFVBQUMsbUJBQUQ7QUFBQSxhQUF5QixPQUFPLE1BQVAsQ0FBYyxtQkFBZCxDQUF6QjtBQUFBLEtBRlAsQ0FESyxDQUFQO0FBS0QsR0FORCxDQUZGO0FBVUQsQ0FoQkQ7O0FBa0JBOzs7QUFHQSxLQUFLLGdCQUFMLENBQXNCLE9BQXRCLEVBQStCLFVBQVMsS0FBVCxFQUFnQjs7QUFFN0MsTUFBSSxhQUFhLElBQUksR0FBSixDQUFRLE1BQU0sT0FBTixDQUFjLEdBQXRCLENBQWpCO0FBQ0EsVUFBUSxHQUFSLENBQVksZ0JBQWdCLFVBQTVCOztBQUVBLFFBQU0sV0FBTixDQUFrQixJQUFJLFFBQUosQ0FBYSxjQUFiLENBQWxCO0FBQ0E7Ozs7QUFLRCxDQVhEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBzdGF0aWNDYWNoZU5hbWUgPSAndHJhaW5zLXN0YXRpYy12Mic7XG5cbi8qXG4gIFdoZW4gdGhlIHNlcnZpY2Ugd29ya2VyIGlzIGluc3RhbGxpbmcsIGl0IGZlY2hlcyB0aGUgcmVzb3VyY2VzIGFuZCBjYWNoZSB0aGVtIGluIHRoZSBjdXJyZW50XG4gIHZlcnNpb24gb2YgdGhlIGNhY2hlLlxuKi9cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignaW5zdGFsbCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gIGV2ZW50LndhaXRVbnRpbChcbiAgICBjYWNoZXMub3BlbihzdGF0aWNDYWNoZU5hbWUpLnRoZW4oZnVuY3Rpb24oY2FjaGUpIHtcbiAgICAgIHJldHVybiBjYWNoZS5hZGRBbGwoW1xuICAgICAgICAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAnL2Rpc3QvanMvbWFpbi5qcycsXG4gICAgICAgICcvZGlzdC9jc3Mvc3R5bGVzLmNzcycsXG4gICAgICAgICdodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2Nzcz9mYW1pbHk9QmFsb28rUGFhaml8VWJ1bnR1JyxcbiAgICAgICAgJy9kaXN0L2RhdGEvc3RvcHMudHh0JyxcbiAgICAgICAgJy9kaXN0L2RhdGEvc3RvcF90aW1lcy50eHQnLFxuICAgICAgICAnL2Rpc3QvZGF0YS9yb3V0ZXMudHh0JyxcbiAgICAgICAgJy9kaXN0L2RhdGEvdHJpcHMudHh0J1xuICAgICAgXSk7XG4gICAgfSlcbiAgKTtcbn0pO1xuXG4vKiBcbiAgV2hlbiB0aGUgc2VydmljZSB3b3JrZXIgYWN0aXZhdGVzIGl0IHJlbW92ZXMgcHJldmlvdXMgdmVyc2lvbnMgb2YgdGhlIGNhY2hlXG4gIGFuZCB0aGlzIHdheXMgaXQgd2lsbCBjb250aW51ZSBvcGVyYXRpbmcgb24gdGhlIG5ldyB2ZXJzaW9uIGFuZCBkb24ndCBsZWF2ZSBydWJiaXNoIGJlaGluZC5cbiovXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2FjdGl2YXRlJywgZnVuY3Rpb24oZXZlbnQpIHtcblxuICBmdW5jdGlvbiBpc05vdEN1cnJlbnRWZXJzaW9uKGNhY2hlTmFtZSkge1xuICAgIHJldHVybiBjYWNoZU5hbWUgIT0gc3RhdGljQ2FjaGVOYW1lO1xuICB9XG5cbiAgZXZlbnQud2FpdFVudGlsKFxuICAgIC8vIFJlbW92ZSBhbnkgb2xkIHZlcnNpb24gb2YgdGhlIGNhY2hlXG4gICAgY2FjaGVzLmtleXMoKS50aGVuKGZ1bmN0aW9uKGNhY2hlTmFtZXMpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgICAgY2FjaGVOYW1lc1xuICAgICAgICAgIC5maWx0ZXIoaXNOb3RDdXJyZW50VmVyc2lvbilcbiAgICAgICAgICAubWFwKChvbGRWZXJzaW9uQ2FjaGVOYW1lKSA9PiBjYWNoZXMuZGVsZXRlKG9sZFZlcnNpb25DYWNoZU5hbWUpKVxuICAgICAgKTtcbiAgICB9KVxuICApO1xufSk7XG5cbi8qXG4gIEludGVyY2VwdCBmZXRjaCBhbmQgcmVzcG9uZCB3aXRoIHRoZSBjYWNoZWQgZWxlbWVudCBpZiB0aGVyZSBpcyBhIG1hdGNoXG4qL1xuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdmZXRjaCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gIFxuICB2YXIgcmVxdWVzdFVybCA9IG5ldyBVUkwoZXZlbnQucmVxdWVzdC51cmwpO1xuICBjb25zb2xlLmxvZygnRmV0Y2hpbmcuLi4nICsgcmVxdWVzdFVybCk7XG5cbiAgZXZlbnQucmVzcG9uZFdpdGgobmV3IFJlc3BvbnNlKCdIZWxsbyBXb3JsZCEnKSk7XG4gIC8qICBjYWNoZXMubWF0Y2goZXZlbnQucmVxdWVzdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlIHx8IGZldGNoKGV2ZW50LnJlcXVlc3QpO1xuICAgIH0pXG4gICk7Ki9cblxufSk7Il19
