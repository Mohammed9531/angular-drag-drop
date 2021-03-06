// Include gulp
var
  gulp = require('gulp'),
  gulpif = require('gulp-if'),
  gutil = require('gulp-util'),
  clean = require('gulp-clean');
  gulpIgnore = require('gulp-ignore'),
  sourcemaps = require('gulp-sourcemaps'),
  angularFilesort = require('gulp-angular-filesort'),

  // Read Files
  fs = require("fs"),
  header = require("gulp-header"),

  // Add Config
  config = {
    destDir: 'dist',
    baseDir: 'src/**/',
    jsPattern: '*.js',
    htmlPattern: '*.html',
    sassPattern: '*.scss',
    fileName: {
      src: 'angular-drag-drop.js',
      min: 'angular-drag-drop.min.js'
    }
  },

  // To Detect Any File Change
  patterns = [
    config.baseDir + config.jsPattern,
    config.baseDir + config.sassPattern,
    config.baseDir + config.htmlPattern
  ],

  // Include Our Plugins
  sass = require('gulp-sass'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  jshint = require('gulp-jshint'),
  prettify = require('gulp-jsbeautifier'),

    // Use Strict
  iife = require("gulp-iife"),
  replace = require("gulp-replace");


/*******************************************
 * GULP TASKS
 *******************************************/

// Lint Task
gulp.task('lint', function() {
  return gulp.src(config.baseDir + config.jsPattern)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Clean Task
gulp.task('clean', function() {
  return gulp.src(config.destDir)
    .pipe(clean({force: true}));
});

// Compile Our Sass
gulp.task('sass', compileSASS);

// Concatenate & Minify JS
gulp.task('minify', function() {
  return gulp.src(config.baseDir + config.jsPattern)
    .pipe(angularFilesort())
    .pipe(concat(config.fileName.src))
    .pipe(replace(/'use strict';/g, ''))
    .pipe(iife())
    .pipe(header(getHeader()))
    .pipe(sourcemaps.init())
    .pipe(gulp.dest(config.destDir))
    .pipe(rename(config.fileName.min))
    .pipe(uglify())
    .pipe(header(getHeader()))
    .pipe(sourcemaps.write('/'))
    .pipe(gulp.dest(config.destDir));
});

//Watch Files For Changes
gulp.task('watch', function() {
  gutil.log('Watching for changes!');
  gulp.watch(patterns).on("change", prettifyFile);
});

//Prettify JS/HTML/SCSS files
gulp.task('prettify', function() {
  gulp.src(patterns)
    .pipe(gulpIgnore.exclude(IgnoreSass))
    .pipe(prettify({
      indent_size: 2
    }))
    .pipe(gulp.dest(function(file) {
      return file.base;
    }));
});


/*******************************************
 * SHARED METHODS
 *******************************************/
/**
 * @description - Add licence header to the scripts.
 *
 * @return {string} - License verbiage
 */
 function getHeader() {
  return "" + fs.readFileSync('license.js', 'utf8');
 }

/**
 * @param {file} - file object
 *
 * @description - gulp ignore files wrapper.
 *
 * @return {boolean} - True if the file path
 * need to be ignored.
 */
function IgnoreSass(file) {
  if (file.path.indexOf('_variables.scss') > -1) {
    return true;
  }
  return false;
}

/**
 * @param {file} - file object
 *
 * @description - Checks the current file formats
 * and gulp ignore.
 *
 * @return {boolean} - True if the file format is
 * '.scss' and the current file is not included in
 * gulp ignore list.
 */
function isSASS(file) {
  var isSCSS = file.path.indexOf("scss") > -1;
  var isExcluded = IgnoreSass(file);

  if (isSCSS && !isExcluded) {
    return true;
  }
  return false;
}

/**
 * @param {file} - file object
 *
 * @description - Run formatter on the modified file
 * and checks if the file format is '.scss' and executes
 * compile sass task when the file has been prettified.
 * Overwrites the existing file.
 */
function prettifyFile(file) {
  var runSASS = isSASS(file);

  gulp.src(file.path)
    .pipe(gulpIgnore.exclude(IgnoreSass))
    .pipe(prettify({
      indent_size: 2
    }))
    .pipe(gulp.dest(function(file) {
      return file.base;
    }))
    .on('end', function(e) {
      if (runSASS) {
        compileSASS();
      }
    });
}

/**
 * @description - Compiles scss to css and moves it to
 * 'assets/css/stylesheets' directory.
 */
function compileSASS() {
  gutil.log('SASS will be Compiled to src/css');
  return gulp.src(config.baseDir + config.sassPattern)
    .pipe(sass({
        outputStyle: 'compressed'
      })
      .on('error', sass.logError))
    .pipe(gulp.dest(config.baseDir + 'src/css'));
}

// Default Task
gulp.task('default', ['clean', 'minify']);