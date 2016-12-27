/* eslint camelcase: "off" */

'use strict'

const fs = require('fs')
const regenerate = require('regenerate')

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
	const path = 'src/unicode.js'
	fs.writeFileSync(path, 'module.exports = {\n')
	for (const key in data) {
		fs.appendFileSync(path, `${key}: /${data[key]}/,\n`)
	}
	fs.appendFileSync(path, '}\n')
}
