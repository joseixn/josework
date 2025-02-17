const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const header = require('gulp-header');
const yaml = require('yaml');
const fs = require('fs/promises');
const dashify = require('dashify');
const webpack = require('webpack-stream');
const named = require('vinyl-named');
const autoprefixer = require('gulp-autoprefixer');

const config = async ()=>{
    const file = await fs.readFile('config/config.yml', 'utf8');
    return yaml.parse(file);
}

const blockStyles = async ()=>{
    const cfg = await config();
    return gulp.src('blocks/**/*.scss')
        .pipe(header(`
            ${cfg.style?.variables&&Object.entries(cfg.style.variables).map(([ns, nsv])=>Object.entries(nsv).map(([key, value])=>`$${dashify(ns+'-'+key)}: ${value};`).join('\n')).join('\n')}
        `))
        .pipe(sass({
            includePaths: ['src/styles'],
        }))
        // .pipe(cleanCSS({
        //     inline: ['none']
        // }))
        .pipe(autoprefixer())
        .pipe(gulp.dest('blocks'));
}

const styles = async ()=>{
    const cfg = await config();
    return gulp.src('src/styles/style.scss')
        .pipe(header(`
            ${cfg.style?.variables&&Object.entries(cfg.style.variables).map(([ns, nsv])=>Object.entries(nsv).map(([key, value])=>`$${dashify(ns+'-'+key)}: ${value};`).join('\n')).join('\n')}
            :root {
                ${cfg.style?.variables&&Object.entries(cfg.style.variables).map(([ns, nsv])=>Object.entries(nsv).map(([key, value])=>`--${dashify(ns+'-'+key)}: ${value};`).join('\n')).join('\n')}
            }`))
        .pipe(sass({
            // variables: cfg.style,
        }))
        .pipe(autoprefixer())
        .pipe(cleanCSS({
            inline: ['none']
        }))
        .pipe(gulp.dest('assets/styles'));
}

const watchBlockStyles = ()=>
    gulp.watch('blocks/**/*.scss', blockStyles);

const watchStyles = ()=>
    gulp.watch('src/styles/*.scss', gulp.parallel(styles, blockStyles));

const js = ()=>
    gulp.src('src/scripts/site.js')
    .pipe(webpack())
    .pipe(gulp.dest('assets/scripts'));

// const jsPages = ()=>
//     gulp.src('src/scripts/pages/*.js')
//     .pipe(named())
//     .pipe(webpack())
//     .pipe(gulp.dest('assets/scripts/pages'));

const watchJS = ()=>
    gulp.watch('src/scripts/**/*.js', gulp.parallel(js));


const watch = gulp.parallel(blockStyles, styles, js, watchBlockStyles, watchStyles, watchJS);


exports.blockStyles = blockStyles;
exports.watchBlockStyles = watchBlockStyles;
exports.watchStyles = watchStyles;
exports.styles = styles;
exports.watch = watch;
exports.js = js;