import * as App from './app.js';

(function() {
'use strict';

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

  ready().then(App.init);

})();