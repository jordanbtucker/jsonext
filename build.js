/* eslint camelcase: "off" */

'use strict'

const fs = require('fs')
const path = require('path')
const del = require('del')
const globby = require('globby')
const regenerate = require('regenerate')
const babel = require('babel-core')
const browserify = require('browserify')

const srcDir = 'src'
const libDir = 'lib'
const distDir = 'dist'

function clean () {
	del.sync(libDir)
	del.sync(distDir)
}

function buildUnicode () {
	const Space_Separator = regenerate()
		.add(require('unicode-9.0.0/General_Category/Space_Separator/code-points'))
		.remove('\t', '\v', '\f', ' ', '\u00A0', '\uFEFF')

	const ID_Start = regenerate()
		.add(require('unicode-9.0.0/Binary_Property/ID_Start/code-points'))
		.remove('$', '_')
		.removeRange('A', 'Z')
		.removeRange('a', 'z')

	const ID_Continue = regenerate()
		.add(require('unicode-9.0.0/Binary_Property/ID_Continue/code-points'))
		.remove('$', '_')
		.removeRange('0', '9')
		.removeRange('A', 'Z')
		.removeRange('a', 'z')

	const outDir = libDir
	const outPath = path.join(outDir, 'unicode.js')

	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir)
	}

	write({
		Space_Separator,
		ID_Start,
		ID_Continue,
	})

	function write (data) {
		fs.writeFileSync(outPath, 'module.exports = {\n')
		for (const key in data) {
			fs.appendFileSync(outPath, `${key}: /${data[key]}/,\n`)
		}

		fs.appendFileSync(outPath, '}\n')
	}
}

function buildBabel () {
	const inDir = srcDir
	const outDir = libDir

	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir)
	}

	const inPaths = globby.sync('*.js', {cwd: inDir})
	for (const inPath of inPaths) {
		const code = babel.transformFileSync(path.join(inDir, inPath)).code
		fs.writeFileSync(path.join(outDir, inPath), code)
	}
}

function buildBrowserify () {
	const inPath = path.join(srcDir, 'index.js')
	const outDir = distDir
	const outPath = path.join(outDir, 'jsonext.js')

	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir)
	}

	browserify(inPath)
		.transform('babelify', {presets: ['es2015']})
		.bundle()
		.pipe(fs.createWriteStream(outPath))
}

clean()
buildUnicode()
buildBabel()
buildBrowserify()
