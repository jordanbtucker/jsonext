/* eslint camelcase: "off" */

'use strict'

const fs = require('fs')
const path = require('path')
const regenerate = require('regenerate')

const outdir = 'lib'
const outfile = 'unicode.js'

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

write({
	Space_Separator,
	ID_Start,
	ID_Continue,
})

function write (data) {
	if (!fs.existsSync(outdir)) {
		fs.mkdirSync(outdir)
	}

	const outpath = path.join(outdir, outfile)
	fs.writeFileSync(outpath, 'module.exports = {\n')
	for (const key in data) {
		fs.appendFileSync(outpath, `${key}: /${data[key]}/,\n`)
	}

	fs.appendFileSync(outpath, '}\n')
}
