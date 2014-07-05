var gulp = require('gulp'),
	browserify = require('gulp-browserify'),
	browserifyHandlebars = require('browserify-handlebars'),
	compass = require('gulp-compass'),
	concat = require('gulp-concat'),
	jshint = require('gulp-jshint'),
	plumber = require('gulp-plumber'),
	uglify = require('gulp-uglify');

gulp.task('mobile-styles', function(){
	return gulp.src('www/dev/mobile/css/*.scss')
		.pipe(plumber())
		.pipe(compass({
			config_file: './config-mobile-styles.rb',
			project: '.',
			sass: 'www/dev/mobile/css',
			css: 'www/live/mobile/css'
		}))
		.pipe(gulp.dest('www/live/mobile/css/'));
});

gulp.task('mobile-js', function(){
	return gulp.src(['www/dev/mobile/js/**/*.js', '!www/dev/mobile/js/vendors/**/*.js'])
		.pipe(plumber())
		.pipe(jshint('www/dev/mobile/js/.jshintrc'))
		.pipe(jshint.reporter('default'))
		.pipe(gulp.src(['www/dev/mobile/js/script.js']))
		.pipe(browserify({
			transform: [browserifyHandlebars]
		}))
		.on('prebundle', function(bundle) {
			//bundle.require(__dirname + '/src/shared-js/classes/core/Class.js', { expose: 'core/Class' });
			//bundle.require(__dirname + '/src/shared-js/classes/utility/Inflector.js', { expose: 'utility/Inflector' });
			//bundle.require(__dirname + '/src/shared-js/classes/components/Calendar.js', { expose: 'components/Calendar' });
			//bundle.require(__dirname + '/src/shared-js/classes/components/CalendarBlock.js', { expose: 'components/CalendarBlock' });
		})
		.pipe(concat('script.min.js'))
		.pipe(gulp.dest('www/live/mobile/js/'));
});

gulp.task('presentation-styles', function(){
	return gulp.src('www/dev/presentation/css/*.scss')
		.pipe(plumber())
		.pipe(compass({
			config_file: './config-presentation-styles.rb',
			project: '.',
			sass: 'www/dev/presentation/css',
			css: 'www/live/presentation/css'
		}))
		.pipe(gulp.dest('www/live/presentation/css/'));
});

gulp.task('presentation-js', function(){
	return gulp.src(['www/dev/presentation/js/**/*.js', '!www/dev/presentation/js/vendors/**/*.js'])
		.pipe(plumber())
		.pipe(jshint('www/dev/presentation/js/.jshintrc'))
		.pipe(jshint.reporter('default'))
		.pipe(gulp.src(['www/dev/presentation/js/script.js']))
		.pipe(browserify({
			transform: [browserifyHandlebars]
		}))
		.on('prebundle', function(bundle) {
			//bundle.require(__dirname + '/src/shared-js/classes/core/Class.js', { expose: 'core/Class' });
			//bundle.require(__dirname + '/src/shared-js/classes/utility/Inflector.js', { expose: 'utility/Inflector' });
			//bundle.require(__dirname + '/src/shared-js/classes/components/Calendar.js', { expose: 'components/Calendar' });
			//bundle.require(__dirname + '/src/shared-js/classes/components/CalendarBlock.js', { expose: 'components/CalendarBlock' });
		})
		.pipe(concat('script.min.js'))
		.pipe(gulp.dest('www/live/presentation/js/'));
});

gulp.task('presentation-vendors-js', function(){
	return gulp.src([
			'www/dev/presentation/js/vendors/jquery.min.js'
        ])
		.pipe(plumber())
		.pipe(concat('vendors.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('www/live/presentation/js/'));
});

gulp.task('watch', function(){
	gulp.watch('www/dev/mobile/css/**/*.scss', ['mobile-styles']);
	gulp.watch('www/dev/mobile/js/**/*.js', ['mobile-js']);
	gulp.watch('www/dev/presentation/css/**/*.scss', ['presentation-styles']);
	gulp.watch('www/dev/presentation/js/**/*.js', ['presentation-js']);
});
