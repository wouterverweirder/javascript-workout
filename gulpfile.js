var gulp = require('gulp'),
		gutil = require('gulp-util'),
		browserify = require('browserify'),
		buffer = require('gulp-buffer'),
		concat = require('gulp-concat'),
		jshint = require('gulp-jshint'),
		less = require('gulp-less'),
		minifyCSS = require('gulp-minify-css'),
		source = require('vinyl-source-stream'),
		sourcemaps = require('gulp-sourcemaps'),
		stylish = require('jshint-stylish'),
		uglify = require('gulp-uglify');

var production = false;

gulp.task('default', ['watch']);

gulp.task('presentation-lint', function(){
	return gulp.src('./presentation/js/src/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter(stylish));
});

gulp.task('presentation-js', ['presentation-lint'], function(){

	var bundler = browserify({
		entries: ['./presentation/js/src/script.js'],
		debug: !production
	});

	bundler.require(__dirname + '/shared/js/Constants.js', { expose: 'Constants'});
	bundler.require(__dirname + '/shared/js/classes/slides/ContentBase.js', { expose: 'shared/ContentBase'});
	bundler.require(__dirname + '/shared/js/classes/IFrameBridge.js', { expose: 'shared/IFrameBridge'});
	bundler.require(__dirname + '/shared/js/classes/Presentation.js', { expose: 'shared/Presentation'});
	bundler.require(__dirname + '/shared/js/classes/MobileServerBridge.js', { expose: 'shared/MobileServerBridge'});

	bundler.require(__dirname + '/presentation/js/src/classes/slides/title/index.js', { expose: 'slides/TitleSlide'});
	bundler.require(__dirname + '/presentation/js/src/classes/slides/intro-poster/index.js', { expose: 'slides/IntroPoster'});
	bundler.require(__dirname + '/presentation/js/src/classes/slides/video-slide/index.js', { expose: 'slides/VideoSlide'});
	bundler.require(__dirname + '/presentation/js/src/classes/slides/shake-your-phones/index.js', { expose: 'slides/ShakeYourPhones'});
	bundler.require(__dirname + '/presentation/js/src/classes/slides/highest-heartrate-game/index.js', { expose: 'slides/HighestHeartrateGame'});
	bundler.require(__dirname + '/presentation/js/src/classes/slides/lowest-heartrate-game/index.js', { expose: 'slides/LowestHeartrateGame'});
	bundler.require(__dirname + '/presentation/js/src/classes/slides/childapp-editor/index.js', { expose: 'slides/ChildAppEditor'});
	bundler.require(__dirname + '/presentation/js/src/classes/slides/react-phones/index.js', { expose: 'slides/ReactPhones'});
	bundler.require(__dirname + '/presentation/js/src/classes/slides/spacebrew-dance-game/index.js', { expose: 'slides/SpacebrewDanceGame'});

	return bundler.bundle()
		.on('error', function(err) {
			gutil.log(err.message);
			gutil.beep();
			this.emit('end');
		})
		.pipe(source('script.min.js'))
		.pipe(buffer())
		.pipe(production ? gutil.noop() : sourcemaps.init({loadMaps: true}))
    .pipe(production ? uglify() : gutil.noop())
    .pipe(production ? gutil.noop() : sourcemaps.write('./', {}))
    .pipe(gulp.dest('./presentation/js'));
});

gulp.task('presentation-styles', function(){
	return gulp.src('./presentation/css/src/style.less')
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(sourcemaps.write('./'))
		.on('error', function(err) {
			gutil.log(err.message);
			gutil.beep();
			this.emit('end');
		})
		.pipe(production ? minifyCSS() : gutil.noop())
		.pipe(gulp.dest('./presentation/css'));
});

gulp.task('presentation-vendors-js', function(){
	return gulp.src([
		'presentation/js/vendors/jquery.min.js',
		'presentation/js/vendors/underscore.min.js',
		'presentation/js/vendors/bean.min.js',
		'presentation/js/vendors/bootstrap.js',
		'presentation/js/vendors/jquery.geturlvars.js',
		'presentation/js/vendors/rAF.js',
		'presentation/js/vendors/easeljs-0.7.1.min.js',
		'presentation/js/vendors/preloadjs-0.4.1.min.js',
		'presentation/js/vendors/sb-1.4.1.js',
		'presentation/codemirror/lib/codemirror.js',
		'presentation/codemirror/mode/javascript/javascript.js',
		'presentation/codemirror/mode/clike/clike.js',
		'presentation/codemirror/addon/hint/show-hint.js',
		'presentation/codemirror/addon/hint/javascript-hint.js',
      ])
	.pipe(concat('vendors.min.js'))
	//.pipe(uglify())
	.pipe(gulp.dest('./presentation/js'));
});

gulp.task('server-lint', function(){
	return gulp.src('./server.js')
		.pipe(jshint())
		.pipe(jshint.reporter(stylish));
});

gulp.task('mobile-lint', function(){
	return gulp.src(['./server/www/src/js/**/*.js', '!./server/www/src/js/vendors/**/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter(stylish));
});

gulp.task('mobile-js', ['mobile-lint'], function(){

	var bundler = browserify({
		entries: ['./server/www/src/js/script.js'],
		debug: !production
	});

	bundler.require(__dirname + '/shared/js/Constants.js', { expose: 'Constants'});
	bundler.require(__dirname + '/shared/js/classes/slides/ContentBase.js', { expose: 'shared/ContentBase'});
	bundler.require(__dirname + '/shared/js/classes/IFrameBridge.js', { expose: 'shared/IFrameBridge'});
	bundler.require(__dirname + '/shared/js/classes/Presentation.js', { expose: 'shared/Presentation'});
	bundler.require(__dirname + '/shared/js/classes/MobileServerBridge.js', { expose: 'shared/MobileServerBridge'});

	bundler.require(__dirname + '/server/www/src/js/classes/slides/shake-your-phones/index.js', { expose: 'slides/ShakeYourPhones'});
	bundler.require(__dirname + '/server/www/src/js/classes/slides/react-phones/index.js', { expose: 'slides/ReactPhones'});

	return bundler.bundle()
		.on('error', function(err) {
			gutil.log(err.message);
			gutil.beep();
			this.emit('end');
		})
		.pipe(source('script.min.js'))
		.pipe(buffer())
		.pipe(production ? gutil.noop() : sourcemaps.init({loadMaps: true}))
    .pipe(production ? uglify() : gutil.noop())
    .pipe(production ? gutil.noop() : sourcemaps.write('./', {}))
    .pipe(gulp.dest('./server/www/live/js'));
});

gulp.task('mobile-styles', function(){
	return gulp.src('./server/www/src/css/style.less')
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(sourcemaps.write('./'))
		.on('error', function(err) {
			gutil.log(err.message);
			gutil.beep();
			this.emit('end');
		})
		.pipe(production ? minifyCSS() : gutil.noop())
		.pipe(gulp.dest('./server/www/live/css'));
});

gulp.task('mobile-vendors-js', function(){
	return gulp.src([
		'./server/www/src/js/vendors/jquery.min.js',
		'./server/www/src/js/vendors/bean.min.js',
		'./server/www/src/js/vendors/modernizr.min.js',
	])
	.pipe(concat('vendors.min.js'))
	//.pipe(uglify())
	.pipe(gulp.dest('./server/www/live/js'));
});

gulp.task('default', ['watch']);

gulp.task('watch', ['presentation-js', 'presentation-styles', 'mobile-js', 'mobile-styles'], function(){
	gulp.watch('presentation/js/src/**/**', ['presentation-js']);
	gulp.watch('presentation/css/src/**/*.less', ['presentation-styles']);

	gulp.watch('server/www/src/js/**/**', ['mobile-js']);
	gulp.watch('server/www/src/css/**/*.less', ['mobile-styles']);

	gulp.watch('shared/js/**/**', ['presentation-js', 'mobile-js']);
});