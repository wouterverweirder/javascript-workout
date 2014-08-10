var gulp = require('gulp'),
	browserify = require('gulp-browserify'),
	browserifyHandlebars = require('browserify-handlebars'),
	path = require('path'),
	less = require('gulp-less'),
	uncss = require('gulp-uncss'),
	concat = require('gulp-concat'),
	jshint = require('gulp-jshint'),
	plumber = require('gulp-plumber'),
	uglify = require('gulp-uglify');

gulp.task('mobile-styles', function(){
	return gulp.src('www/dev/mobile/css/style.less')
		.pipe(less())
		.pipe(gulp.dest('www/live/mobile/css'));
});

gulp.task('mobile-js', function(){
	gulp.src(['www/dev/mobile/js/**/*.js', '!www/dev/mobile/js/vendors/**/*.js'])
		.pipe(plumber())
		.pipe(jshint('www/dev/mobile/js/.jshintrc'))
		.pipe(jshint.reporter('default'));
	return gulp.src(['www/dev/mobile/js/script.js'])
		.pipe(plumber())
		.pipe(browserify({
			transform: [browserifyHandlebars]
		}))
		.on('prebundle', function(bundle) {
			bundle.require(__dirname + '/shared/Constants.js', { expose: 'Constants'});
			bundle.require(__dirname + '/www/dev/shared/js/classes/core/Class.js', { expose: 'core/Class' });
			//content
			bundle.require(__dirname + '/www/dev/mobile/js/classes/content/shake-your-phones/index.js', { expose: 'classes/content/shake-your-phones'});
		})
		.pipe(concat('script.min.js'))
		//.pipe(uglify())
		.pipe(gulp.dest('www/live/mobile/js/'));
});

gulp.task('presentation-styles', function(){
	return gulp.src('www/dev/presentation/css/style.less')
		.pipe(less())
		/*.pipe(uncss({
			html: [
				'www/live/presentation/index.html',
				'www/live/presentation/slides/highest-heartrate-game.html',
				'www/live/presentation/slides/intro-poster.html',
				'www/live/presentation/slides/shake-your-phones.html',
				'www/live/presentation/slides/thank-you.html'
			],
			ignore: [
				'iframe',
				'.substate.active'
			]
		}))*/
		.pipe(gulp.dest('www/live/presentation/css'));

});

gulp.task('presentation-js', function(){
	gulp.src(['www/dev/presentation/js/**/*.js', '!www/dev/presentation/js/vendors/**/*.js'])
		.pipe(plumber())
		.pipe(jshint('www/dev/presentation/js/.jshintrc'))
		.pipe(jshint.reporter('default'));
	return gulp.src(['www/dev/presentation/js/script.js'])
		.pipe(plumber())
		.pipe(browserify({
			transform: [browserifyHandlebars]
		}))
		.on('prebundle', function(bundle) {
			bundle.require(__dirname + '/shared/Constants.js', { expose: 'Constants'});
			bundle.require(__dirname + '/www/dev/shared/js/classes/core/Class.js', { expose: 'core/Class' });
			//content
			bundle.require(__dirname + '/www/dev/presentation/js/classes/content/intro-poster/index.js', { expose: 'classes/content/intro-poster'});
			bundle.require(__dirname + '/www/dev/presentation/js/classes/content/shake-your-phones/index.js', { expose: 'classes/content/shake-your-phones'});
			bundle.require(__dirname + '/www/dev/presentation/js/classes/content/highest-heartrate-game/index.js', { expose: 'classes/content/highest-heartrate-game'});
			bundle.require(__dirname + '/www/dev/presentation/js/classes/content/lowest-heartrate-game/index.js', { expose: 'classes/content/lowest-heartrate-game'});

			bundle.require(__dirname + '/www/dev/presentation/js/classes/content/node-app-editor/index.js', { expose: 'classes/content/node-app-editor'});
		})
		.pipe(concat('script.min.js'))
		//.pipe(uglify())
		.pipe(gulp.dest('www/live/presentation/js/'));
});

gulp.task('presentation-vendors-js', function(){
	return gulp.src([
			'www/dev/presentation/js/vendors/jquery.min.js',
			'www/dev/presentation/js/vendors/bootstrap.js',
			'www/dev/presentation/js/vendors/jquery.geturlvars.js',
			'www/dev/presentation/js/vendors/rAF.js',
			'www/dev/presentation/js/vendors/easeljs-0.7.1.min.js',
			'www/dev/presentation/js/vendors/preloadjs-0.4.1.min.js',
			'www/dev/presentation/codemirror/lib/codemirror.js',
			'www/dev/presentation/codemirror/mode/javascript/javascript.js',
			'www/dev/presentation/codemirror/mode/clike/clike.js',
			'www/dev/presentation/codemirror/addon/hint/show-hint.js',
			'www/dev/presentation/codemirror/addon/hint/javascript-hint.js'
        ])
		.pipe(plumber())
		.pipe(concat('vendors.min.js'))
		//.pipe(uglify())
		.pipe(gulp.dest('www/live/presentation/js/'));
});

gulp.task('mobile-vendors-js', function(){
	return gulp.src([
			'www/dev/mobile/js/vendors/jquery.min.js',
			'www/dev/mobile/js/vendors/jquery.geturlvars.js',
			'www/dev/mobile/js/vendors/rAF.js'
        ])
		.pipe(plumber())
		.pipe(concat('vendors.min.js'))
		//.pipe(uglify())
		.pipe(gulp.dest('www/live/mobile/js/'));
});

gulp.task('watch', function(){
	gulp.watch('www/dev/shared/css/**/*.less', ['mobile-styles', 'presentation-styles']);
	gulp.watch('www/dev/mobile/css/**/*.less', ['mobile-styles']);
	gulp.watch(['www/dev/mobile/js/**/*.js', 'shared/**/*.js'], ['mobile-js']);
	gulp.watch('www/dev/mobile/js/vendors/**/*.js', ['mobile-vendors-js']);
	gulp.watch('www/dev/presentation/css/**/*.less', ['presentation-styles']);
	gulp.watch(['www/dev/presentation/js/**/*.js', 'shared/**/*.js'], ['presentation-js']);
	gulp.watch('www/dev/presentation/js/vendors/**/*.js', ['presentation-vendors-js']);
});
