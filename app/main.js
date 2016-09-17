import * as App from './app.js';

(function() {
'use strict';

  function registerServiceWorker() {

    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register('./service_worker.js', {scope: '/'}).then(function(reg) {
      //console.log('Registration worked!', reg);

      if (!navigator.serviceWorker.controller) {
        return;
      }

    }).catch(function(error) {

      console.error('Registration failed!', error);
    
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