const Parser = require('./parser')
const Stringifier = require('./stringifier')

const JSONext = {
	parse: Parser.parse,
	stringify: Stringifier.stringify,
}

module.exports = JSONext
