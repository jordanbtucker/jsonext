const Parser = require('./parser')

const JSONext = {
	parse: Parser.parse,
	stringify: JSON.stringify,
}

module.exports = JSONext
