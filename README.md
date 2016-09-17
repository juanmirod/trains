# Trains

An offline first sample app that shows routes and times for trains between two stations in California with CalTrain using the available [CalTrain public data]().

This application uses Service Workers, Caches and indexedDB to cache the information in the user browser and continue working if the user lose the conection signal. You can load the app, disable the network and continue using the application completely offline (Tested on Chrome 48 and Firefox 48, see [this page](https://jakearchibald.github.io/isserviceworkerready/index.html) for compatibility details). 

Built without frameworks but using ES2015 for modules, arrow functions, template strings and Promises mainly, Gulp + Browserify + Babel to transpile and bundle the code (see [gulpfile](https://github.com/juanmirod/trains/blob/master/gulpfile.js) for details). I wanted to try the new ES2015 features but not being constraint to use them inside Angular or React. ES2015 module system is awesome and arrow functions + array functions + template strings allow you to write code that is mode declarative and clean.

## Install

To install and run the local server you have to run this commands:

    $> git clone https://github.com/juanmirod/trains trains2
    $> npm install
    $> gulp serve

This last command should launch the browser and open the app at `localhost:3000/` Enjoy!

## Sample route:

This sample is not about user interaction but about offline first, the user interface is really basic and the app doesn't calculate transfers, if you don't know CalTrain services you may not found a route on the first try. These are a couple of trips that have a direct route.

    Departure                         -   Arrival

    San Bruno Caltrain - 70052        -   22nd St Caltrain - 70022
    22nd St Caltrain - 70021          -   San Francisco Caltrain - 70011
    Hillsdale Caltrain - 70111        -   San Mateo Caltrain - 70091

