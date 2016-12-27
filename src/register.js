const fs = require('fs')
const JSONext = require('./')

require.extensions['.jsonext'] = function (module, filename) {
	const content = fs.readFileSync(filename, 'utf8')
	try {
		module.exports = JSONext.parse(content)
	} catch (err) {
		err.message = filename + ': ' + err.message
		throw err
	}
}
