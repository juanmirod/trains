import * as App from './app.js';

(function() {
'use strict';
/*function registerServiceWorker() {

    if (!navigator.serviceWorker) return;

    var indexController = this;

    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      if (!navigator.serviceWorker.controller) {
        return;
      }

      if (reg.waiting) {
        indexController._updateReady(reg.waiting);
        return;
      }

      if (reg.installing) {
        indexController._trackInstalling(reg.installing);
        return;
      }

      reg.addEventListener('updatefound', function() {
        indexController._trackInstalling(reg.installing);
      });
    });

    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    var refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  };*/

  function registerServiceWorker() {

    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register('./dist/js/service_worker.js').then(function() {
      console.log('Registration worked!');
    }).catch(function() {
      console.log('Registration failed!');
    });

  }

  function ready() {
      
    return new Promise(function(resolve, reject) {
      
      // resolve the promise when the document is ready
      document.addEventListener('readystatechange', function() {
        if(document.readyState !== 'loading') {
          resolve();
        }
      });

    });

  };

  ready().then(function() {
    App.init();
    registerServiceWorker();
  });

})();