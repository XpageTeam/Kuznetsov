"use strict";

const $ = require('gulp-load-plugins')(),
gulp = require("gulp"),
bourbon = require('node-bourbon'),
browserSync = require('browser-sync').create(),
del = require('del'),
pngquant = require('imagemin-pngquant'),
gutil = require('gulp-util'),
ftp = require("vinyl-ftp"),
sourcemaps = require("gulp-sourcemaps"),
postcss = require("gulp-postcss"),
prefixer = require("autoprefixer"),
imageminJpegRecompress = require("imagemin-jpeg-recompress"),
sftp = require("gulp-sftp");

const xpager_path = "/www/html.xpager.ru/kuznetsov",
xpager_conn = ftp.create({
	host:      '46.161.37.220',
	user:      'file',
	password:  'X9y7E5d0',
	parallel: 8,
	log: gutil.log
});

const templatePath = "/www/kuznecov92.ru/";
const remotePathCss = templatePath+"css",
	remotePathJs = templatePath+"js",
	remotePathImg = templatePath+"img";

const server_conn = ftp.create({
	host:      '46.161.37.220',
	user:      'kuznecov',
	password:  '0C1j2U3b',
	parallel: 4,
	log: gutil.log
});

var g_if = true;

gulp.task('browser-sync', () =>  {
	browserSync.init({
		server: {
			baseDir: 'app'
		},
		notify: false
	});

	browserSync.watch([
		"app/css/*.css",
		"app/js/*.js",
		"app/*.html",
		]).on("change", browserSync.reload);
});

gulp.task("jade", () => 
	gulp.src("app/jade/*.jade"/*,  {since: gulp.lastRun("jade")}*/)
		.pipe($.jade({pretty: true}))
		.pipe(gulp.dest("app"))
);

gulp.task('sass', () => 
	gulp.src('app/sass/*.sass')
		.pipe($.if(g_if, sourcemaps.init()))
		.pipe($.sass({
			includePaths: bourbon.includePaths,
			outputStyle: 'expanded'
		}).on("error", $.notify.onError()))
		.pipe($.cssmin())
		.pipe($.if(g_if, sourcemaps.write(".")))
		.pipe(gulp.dest('app/css'))
);

gulp.task("base64", () =>
	gulp.src("app/css/*.css")
		.pipe($.cache($.base64({
			extensions: ['svg', 'png', /\.jpg#datauri$/i],
			exclude:    [/\.server\.(com|net)\/dynamic\//, '--live.jpg'],
			maxImageSize: 8*1024, // bytes,
			deleteAfterEncoding: false,
		})))
		.pipe(gulp.dest("app/css"))
);

gulp.task("base64-post", () => 
	gulp.src("app/css/main.css")
		.pipe(postcss([require('postcss-data-packer')({
				dest: 'app/css/main_data.css'
				})
			])
		)
		.pipe(gulp.dest("app/css"))
);

gulp.task("prefixer", () => 
	gulp.src("app/css/*.css")
		.pipe(postcss([prefixer({ 
			browsers: ['last 2 versions', '> 4%', 'ie 11'],
			cascade: true 
			}),
			require("postcss-flexbugs-fixes")
		]))
		.pipe(gulp.dest("app/css"))
);

gulp.task('imagemin', () =>  
	gulp.src('app/img/**/*', {since: gulp.lastRun("imagemin")})
		 // .pipe($.cache($.imagemin({
			// interlaced: true,
			// progressive: true,
			// svgoPlugins: [{removeViewBox: false}],
			// use: [pngquant()]
		// 	$.imagemin.gifsicle({
		// 		interlaced: true,
		// 	}),
		// 	$.imagemin.jpegtran({
		// 		progressive: true,
		// 	}),
		// 	imageminJpegRecompress({
		// 		loops: 5,
		// 		min: 75,
		// 		max: 85,
		// 		quality: "high"
		// 	}),
		// 	// $.imagemin.svgo(),
		// 	$.imagemin.optipng({optimizationLevel: 3}),
  //     		pngquant({quality: '75-85', speed: 5})
		// ],{
  //    		verbose: true
    	// })))
		.pipe(gulp.dest('app/img'))
);

gulp.task("babel", () => 
	gulp.src("app/js-es6/**/*", {since: gulp.lastRun("babel")})
		.pipe(sourcemaps.init())
		.pipe($.babel(
			{
				presets: ["es2015"]
			}
		))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest("app/js"))
);

function pre_build(callback){
	g_if = false;
	callback();
}

gulp.task('remove', (callback) =>  {del.sync('app/css/main_data.css'); callback();});

gulp.task("make:css", gulp.series(pre_build, "remove", gulp.parallel("sass", "imagemin"), "prefixer", "base64", "base64-post"));

gulp.task('removedist', (callback) =>  {del.sync('dist'); callback();});

gulp.task("build:css", () => 
	gulp.src("app/css/**/*").pipe(gulp.dest('dist/css/'))
);

gulp.task("build:files", (callback) => gulp.src('app/*.ico').pipe(gulp.dest('dist')));

gulp.task("build:fonts", () => gulp.src('app/fonts/**/*').pipe(gulp.dest('dist/fonts')));

gulp.task("build:js", () => gulp.src('app/js/**/*').pipe(gulp.dest('dist/js')));

gulp.task("build:images", () => gulp.src("app/img/**/*").pipe(gulp.dest("dist/img")));

gulp.task("build:html", () => gulp.src('app/*.html').pipe(gulp.dest('dist')));

gulp.task('build', gulp.series(gulp.parallel(pre_build, 'removedist', "imagemin"), "make:css", gulp.parallel('build:css', "build:js", "build:fonts", "build:files", "build:html"), 'build:images'));

gulp.task("deploy:xpager", () => 
	gulp.src("dist/**", {buffer: false})
			.pipe(xpager_conn.dest(xpager_path))
);

gulp.task('deploy',gulp.series("build", "deploy:xpager"));

gulp.task('clearcache', (callback) => { $.cache.clearAll(); callback();});

gulp.task("deploy-zip", () => 
	gulp.src([
			"**/*.*",
			"!node_modules/**",
			"!dist/**",
			"!*.zip"
			])
		.pipe($.zip("app.zip"))
		.pipe(xpager_conn.dest(xpager_path))
);

gulp.task("min:css", () => 
	gulp.src("app/css/*.css")
		.pipe($.cssmin())
		.pipe(gulp.dest("app/css"))
);

gulp.task("deploy:css", () => 
	gulp.src("app/css/*.*", {since: gulp.lastRun("sass")})
		.pipe(server_conn.dest(remotePathCss))
);

gulp.task("deploy:js", () => 
	gulp.src("app/js/*.js", {since: gulp.lastRun("deploy:js")})
		.pipe($.uglify())
		.pipe(server_conn.dest(remotePathJs))
);

gulp.task("deploy:img", () => 
	gulp.src("app/img/**/*")
		.pipe(server_conn.dest(remotePathImg))
);

function local_watch(){
	gulp.watch('app/sass/**/*.sass', gulp.series("sass"));
	gulp.watch('app/jade/**/*', gulp.series("jade"));
	gulp.watch("app/js-es6/**/*", gulp.series("babel"));
}

function watch(){
	gulp.watch('app/sass/**/*.sass', gulp.series("sass", "deploy:css"));
	gulp.watch('app/js-es6/**/*.js', gulp.series("babel"));
	gulp.watch('app/js/**/*.js', gulp.series("deploy:js"));
	gulp.watch('app/img/*.*', gulp.series("imagemin", "deploy:img"));
}

gulp.task("finish:him", gulp.series(pre_build, "make:css", "min:css", "babel", gulp.parallel("deploy:css", "deploy:js")));

gulp.task("deploy-to-server", gulp.series("sass", watch));

gulp.task('default', gulp.series("sass", gulp.parallel(local_watch, "browser-sync")));