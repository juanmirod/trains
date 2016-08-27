var gulp = require('gulp');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();

gulp.task('default', function() {
  // place code for your default task here
});

gulp.task('styles', function(){

  gulp.src('less/**/*.less')
    .pipe(less(['autoprefix']))
    .pipe(gulp.dest('./dist/css/'));

});

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
gulp.task('serve', ['server', 'styles'], function() {

  gulp.watch('less/**/*.less', ['styles']);

  gulp.watch([
    'dist/css/*.css',
    'dist/js/*.js',
    'index.html'
    ], ['reload']);

});