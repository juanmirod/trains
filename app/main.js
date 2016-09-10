import * as App from './app.js';

(function() {
'use strict';

  function registerServiceWorker() {

    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register('./dist/js/service_worker.js').then(function(reg) {
      console.log('Registration worked!', reg);
    }).catch(function(error) {
      console.log('Registration failed!', error);
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