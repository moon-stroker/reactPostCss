'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserify = require('browserify');
var watchify = require('watchify');
var babel = require('babelify');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
// var sass = require('gulp-ruby-sass');
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var pagespeed = require('psi');
var reload = browserSync.reload;
var concat = require('gulp-concat');
var postcss = require('gulp-postcss');
//plugins postcss
var partialImport = require('postcss-partial-import');
var cssNext = require('postcss-cssnext');
var cssnano = require('cssnano')({ autoprefixer: false });

//Browserify
gulp.task('browserify-serve', function(){

    var bundler = watchify(browserify('./source/js/main.js', { debug: true })
        .transform(babel.configure({
            // Use all of the ES2015 spec
            presets: ['react', 'es2015', 'stage-0']
        })));
    return bundler.bundle()
        .on('error', function(err) { console.error(err); this.emit('end'); })
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./js/'));
});



gulp.task('browserify', function(){

    return browserify('./source/js/main.js')
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write('./'))
        .pipe(buffer())
        .pipe($.uglify())
        .pipe(gulp.dest('./js/'))
});

// Lint JavaScript
gulp.task('jshint', function () {
    return gulp.src(['./source/js/components/*.js', './source/js/*.js'])
        .pipe(reload({stream: true, once: true}))
        .pipe($.jshint({'esversion':6}))
        .pipe($.jshint.reporter('jshint-stylish'))
        .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});
// // Optimize Images
// gulp.task('images', function () {
//     return gulp.src('images/**/*')
//         .pipe($.cache($.imagemin({
//             progressive: true,
//             interlaced: true
//         })))
//         .pipe(gulp.dest('dist/images'))
//         .pipe($.size({title: 'images'}));
// });


gulp.task('styles-serve', function () {
    var processorArray = [
        partialImport,
        cssNext
    ];
    return gulp.src('./source/css/main.css')
        .pipe(postcss(processorArray))
        .pipe(gulp.dest('css'))
});

gulp.task('styles', function () {
    var processorArray = [
        partialImport,
        cssNext,
        cssnano
    ];
    return gulp.src('./source/css/main.css')
        .pipe(postcss(processorArray))
        .pipe(gulp.dest('css'))
});

// Watch Files For Changes & Reload
gulp.task('serve', ['browserify-serve', 'styles-serve', 'scripts'], function () {
    browserSync({
      notify: false,
      // Run as an https by uncommenting 'https: true'
      // Note: this uses an unsigned certificate which on first access
      //       will present a certificate warning in the browser.
      // https: true,
      server: ['./']
    });

    gulp.watch(['*.html'], reload);
    gulp.watch(['source/*.css', 'source/css/*.css','source/css/**/*.css'], ['styles-serve', reload]);
    gulp.watch(['source/js/*.js', 'source/js/**/*.js', '!source/js/vendors/*.js'], ['browserify-serve', reload]);
    gulp.watch(['sorce/js/vendor/*.js'], ['scripts']);
    gulp.watch(['images/**/*'], reload);
});

// Build Production Files, the Default Task
gulp.task('default', ['browserify', 'styles', 'scripts'], function (cb) {
    runSequence('styles', ['browserify', 'scripts'], cb);
});

// Run PageSpeed Insights
// Update `url` below to the public URL for your site
gulp.task('pagespeed', pagespeed.bind(null, {
    // By default, we use the PageSpeed Insights
    // free (no API key) tier. You can use a Google
    // Developer API key if you have one. See
    // http://goo.gl/RkN0vE for info key: 'YOUR_API_KEY'
    url: 'https://example.com',
    strategy: 'mobile'
}));

//clear file cache
gulp.task('clear', function (done) {
    return $.cache.clearAll(done);
});

gulp.task('scripts', function() {
    return gulp.src('./source/js/vendor/*.js')
        .pipe(concat('vendors.js'))
        .pipe(gulp.dest('./js/'));
});


// Load custom tasks from the `tasks` directory
try { require('require-dir')('tasks'); } catch (err) {}

