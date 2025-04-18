// Load plugins
const { src, dest, watch, parallel, series } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const gulpautoprefixer = require("gulp-autoprefixer");
const browsersync = require("browser-sync").create();
const fileinclude = require("gulp-file-include");
const useref = require("gulp-useref");
const gulpIf = require("gulp-if");
const npmDist = require("gulp-npm-dist");
const postcss = require("gulp-postcss");
const { formatHTML } = require(`gulp-format-html`);
const cssnano = require("cssnano");
const replace = require("gulp-replace");
const del = require("del");
const autoprefixer = require("autoprefixer");
const terser = require("gulp-terser");
const minifyCSS = require("gulp-clean-css");

//**************************//
// Set Your Default Paths
//**************************//
const paths = {
  base: {
    base: "./",
    node: "./node_modules",
  },
  src: {
    basesrc: "./src",
    basesrcfiles: "./src/**/*",
    scss: "./src/assets/scss/**/*.scss",
    css: "./src/assets/css",
    js: "./src/assets/js/**/*.js",
    html: "./src/**/*.html",
    fonts: "./src/assets/fonts/**/*",
    assets: "./src/assets/**/*",
    shared: "./src/**/partials/**/*",
    images: "./src/assets/images/**/*",
  },
  temp: {
    basetemp: "./.temp",
  },
  dist: {
    basedist: "./dist",
    js: "./dist/assets/js",
    images: "./dist/assets/images",
    fonts: "./dist/assets/fonts",
    css: "./dist/assets/css",
    libs: "./dist/assets/libs",
  },
};

//**************************//
// Compile SCSS to CSS
//**************************//
function scss() {
  return src(paths.src.scss)
    .pipe(sass().on("error", sass.logError))
    .pipe(gulpautoprefixer())
    .pipe(minifyCSS())
    .pipe(dest(paths.src.css))
    .pipe(browsersync.stream());
}

//**************************//
// File Includes
//**************************//
function html() {
  return src([paths.src.html, "!./src/**/partials/**/*"])
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(replace(/src="(.{0,10})node_modules/g, 'src="$1assets/libs'))
    .pipe(replace(/href="(.{0,10})node_modules/g, 'href="$1assets/libs'))
    .pipe(useref())
    .pipe(gulpIf("*.css", postcss([autoprefixer(), cssnano()])))
    .pipe(gulpIf("*.js", terser()))
    .pipe(gulpIf("*.html", formatHTML()))
    .pipe(dest(paths.dist.basedist))
    .pipe(browsersync.stream());
}

// File include task for temp
function fileincludeTask() {
  return src([paths.src.html, "!./src/partials/**/*"])
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(dest(paths.temp.basetemp));
}

// Copy libs file from nodemodules to dist
function copyLibs() {
  return src(npmDist(), { base: paths.base.node }).pipe(dest(paths.dist.libs));
}

// Image
function images() {
  return src(paths.src.images).pipe(dest(paths.dist.images));
}
// Image
function fonts() {
  return src(paths.src.fonts).pipe(dest(paths.dist.fonts));
}
// Image
function js() {
  return src(paths.src.js).pipe(dest(paths.dist.js));
}
function css() {
  return src("./src/assets/css/**/*.css").pipe(dest(paths.dist.css));
}

// Clean .temp folder
function cleanTemp(callback) {
  del.sync(paths.temp.basetemp);
  callback();
}

// Clean Dist folder
function cleanDist(callback) {
  del.sync(paths.dist.basedist);
  callback();
}

// Browser Sync Serve
function browsersyncServe(callback) {
  browsersync.init({
    server: {
      baseDir: [paths.temp.basetemp, paths.src.basesrc, paths.base.base],
    },
  });
  callback();
}

// SyncReload
function syncReload(callback) {
  browsersync.reload();
  callback();
}

// Watch Task
function watchTask() {
  watch(paths.src.html, series(fileincludeTask, syncReload));
  watch([paths.src.images], series(images));
  watch([paths.src.scss], series(scss, syncReload));
}

// Default Task Preview
exports.default = series(scss, fileincludeTask, browsersyncServe, watchTask);

// Build Task for Dist
exports.build = series(
  parallel(cleanDist),
  html,
  images,
  css,
  js,
  fonts,
  copyLibs,
  cleanTemp
);

// export tasks
exports.scss = scss;
exports.html = html;
exports.fileincludeTask = fileincludeTask;
exports.copyLibs = copyLibs;
exports.cleanTemp = cleanTemp;
exports.cleanDist = cleanDist;
exports.images = images;
exports.css = css;
exports.fonts = fonts;
exports.js = js;
