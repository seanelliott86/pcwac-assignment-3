var gulp = require('gulp');
var sass = require('gulp-sass');
var cache = require('gulp-cached');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var autoprefixer = require('autoprefixer');
var postcss = require('gulp-postcss');
var pump = require('pump');
var browserSync = require('browser-sync');
var portNumber = 3333;
var svgSprite = require('gulp-svg-sprite');
var config = {
    "mode": {
        "defs": {
            "sprite": "sprite.svg"
        }
    }
};
var processors = [
  autoprefixer({ add: false, browsers: ['last 3 versions'] })
];

gulp.task('svgsprite', function() {
    return gulp.src('*.svg', {cwd: 'output/img/svg/'})
        .pipe(svgSprite(config)).on('error', function(error){ console.log(error); })
        .pipe(gulp.dest('output/img/svg/'))
});


gulp.task('browserSync', ['styles', 'compress'], function() {
  browserSync.init({
    server: {
      baseDir: 'output'
    },
    port: portNumber
  })
})

gulp.task('styles', function() {
	return gulp.src('sass/**/*.scss')
	    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
      .pipe(postcss(processors))
	    .pipe(gulp.dest('./output/css/'))
	    .pipe(browserSync.reload({stream: true}));
});


gulp.task('compress', function (cb) {
  pump([
      gulp.src('js/**/*.js'),
      cache('jscompress'),
      rename({suffix: '.min'}),
      uglify(),
      gulp.dest('./output/js/'),
      browserSync.reload({stream: true})
    ],
    cb
  );
});

gulp.task('default', ['browserSync'], function() {
	gulp.watch('sass/**/*.scss',['styles']);
	gulp.watch('js/**/*.js',['compress']);
  gulp.watch('output/img/svg/*.svg',['svgsprite']);
	gulp.watch("output/*.html").on('change', browserSync.reload);
})