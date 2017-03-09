/// <binding ProjectOpened="build, watch" />
const fs           = require("fs");
const gulp         = require("gulp");
const plumber      = require("gulp-plumber");
const runSequence  = require("run-sequence");
const sourcemaps   = require("gulp-sourcemaps");
const rename       = require("gulp-rename");
const sassGlob     = require("gulp-sass-glob");
const sass         = require("gulp-sass");
const babel        = require("gulp-babel");
const concat       = require("gulp-concat");
const uglify       = require("gulp-uglify");
const wait         = require("gulp-wait");
const watch        = require("gulp-watch");
const hb           = require("gulp-hb");
const postcss      = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano      = require("cssnano");
const del          = require("del");
const hbLayouts    = require("handlebars-layouts");
const hbHelpers    = require("handlebars-helpers");
const browserSync  = require("browser-sync").create();
const nodemon      = require("gulp-nodemon");
const packageFile  = require("./package");

gulp.task("styles", function(){
	return gulp.src("src/styles/styles.scss")
		.pipe(plumber({errorHandler: function (err) {
			console.log(err.formatted);
			this.emit("end");
		}}))
		.pipe(sourcemaps.init())
		.pipe(sassGlob())
		.pipe(wait(100)) // fixes issues with Visual Studio Code and SublimeText with atomic_save: false - increase this value if you get scss import errors
		.pipe(sass())
		.pipe(postcss([
			autoprefixer({browsers: ["last 50 versions", "ie >= 9"]}),
			cssnano()
		]))
		.pipe(rename({suffix: ".min"}))
		.pipe(sourcemaps.write("maps"))
		.pipe(gulp.dest("build"))
		.pipe(browserSync.stream({match: "**/*.css"}));
});

gulp.task("scripts", function(){
	return gulp.src([
			"src/scripts/vendor/**/*.js",
			"src/scripts/util/**/*.js",
			"src/scripts/components/**/*.js"
		])
		.pipe(plumber({errorHandler: function (err) {
			console.log(err);
			this.emit("end");
		}}))
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ["es2015"]
		}))
		.pipe(concat("scripts.min.js"))
		.pipe(uglify())
		.pipe(sourcemaps.write("maps"))
		.pipe(gulp.dest("build"))
		.pipe(browserSync.stream({match: "**/*.js"}));
});

gulp.task("images", function(){
	return gulp.src("src/images/**/*.{png,jpg,gif}")
		.pipe(plumber({errorHandler: function (err) {
			console.log(err);
			this.emit("end");
		}}))
		.pipe(gulp.dest("build/images"))
		.pipe(browserSync.stream({match: "images/**/*"}));
});

gulp.task("json", function(){
	return gulp.src("src/**/*.json")
		.pipe(plumber({errorHandler: function (err) {
			console.log(err);
			this.emit("end");
		}}))
		.pipe(gulp.dest("build"))
		.pipe(browserSync.stream({match: "**/*.json"}));
});

gulp.task("fonts", function(){
	return gulp.src("src/fonts/**/*")
		.pipe(plumber({errorHandler: function (err) {
			console.log(err);
			this.emit("end");
		}}))
		.pipe(gulp.dest("build/fonts"))
		.pipe(browserSync.stream({match: "fonts/**/*"}));
});

gulp.task("browsersync", ["nodemon"], function(){
	browserSync.init(null, {
		proxy: "http://localhost:4050",
		files: ["src/build"],
		port: 4051,
		ui: {
			port: 4052
		}
	});
	gulp.start("watch");
});

gulp.task("nodemon", function (cb) {
	var started = false;
	return nodemon({
		script: "app.js",
		ext: "hbs",
		watch: ["app.js"]
	}).on("start", function () {
		if (!started) {
			cb();
			started = true;
		}
	});
});

gulp.task("watch", function(){
	gulp.watch("src/styles/**/*.{css,scss}", ["styles"], browserSync.reload);
	gulp.watch("src/scripts/**/*.js", ["scripts"], browserSync.reload);
	gulp.watch("src/fonts/**/*", ["fonts"], browserSync.reload);
	gulp.watch("src/images/**/*.{png,jpg,gif}", ["images"], browserSync.reload);
	gulp.watch("src/**/*.json", ["json"], browserSync.reload);
});

gulp.task("clean", function(){
	return del(["build/**/*"]);
});

gulp.task("build", function(){
	return runSequence("clean", ["styles", "scripts", "fonts", "json", "images"]);
});

gulp.task("serve", function(){
	return runSequence("clean", ["styles", "scripts", "fonts", "images", "json"], "browsersync");
});

gulp.task("default", [
	"serve"
])
