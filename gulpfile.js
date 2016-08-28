var gulp = require('gulp');
var less = require('gulp-less');
var LessAutoprefix = require('less-plugin-autoprefix');
var autoprefix = new LessAutoprefix({ browsers: ['last 2 versions'] });
var babel = require('gulp-babel');
var browserSync = require('browser-sync').create();
var jasmine = require('gulp-jasmine-phantom');

gulp.task('default', function() {
  // place code for your default task here
});

///////////////////////////// STYLES //////////////////////////////////

gulp.task('styles', function(){

  gulp.src('./less/**/*.less')
    .pipe(less({
       plugins: [autoprefix]
     }))
    .pipe(gulp.dest('./dist/css/'));

});

/////////////////////////////// JS //////////////////////////////////

gulp.task('build:js', function() {
  
  gulp.src('./app/**/!(*_tests).js')
    .pipe(babel({
      presets: ['es2015']
      }))
    .pipe(gulp.dest('./dist/js/'));

});

//////////////////////////// TESTS ////////////////////////////////////////
/*
  Run the tests suite once
  */
gulp.task('tests', ['build:js'], function () {
  
  gulp.src([
    'node_modules/babel-polyfill/browser.js',
    'dist/js/routes.js',
    'dist/js/main.js', 
    'app/**/*_tests.js'
  ])
  .pipe(jasmine({
    integration: true,
    jasmineversion: '2.4'
  }));

});

/*
  Watches for js changes and run the tests suite

  TODO:: Test runner doesn't work, we need modules! browserify 
  or webpack should fix this
  */
gulp.task('testrunner', ['tests'], function() {

  gulp.watch(['app/**/!(*_tests).js',
    'app/**/*_tests.js',
    'dist/js/*.js'], ['tests']);

});

/////////////////////////////// LIVE REOLAD ///////////////////////////

gulp.task('server', function() {

  browserSync.init({
    server: {
      baseDir: './'
    }
  });

});

/*
  Reloads the server
  */
gulp.task('reload', function() {
    browserSync.reload();
});

/* 
  Runs browserSync server and watches for changes 
  in css, js or html to reload the browser.
  */

// Development
gulp.task('serve', ['server', 'styles', 'build:js'], function() {

  gulp.watch('less/**/*.less', ['styles']);
  gulp.watch('app/**/*.js', ['build:js']);

  gulp.watch([
    'dist/css/*.css',
    'dist/js/*.js',
    'index.html'
    ], ['reload']);

});