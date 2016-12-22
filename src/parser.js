const unicode = require('./unicode')

let text
let parseState
let stack
let pos
let line
let column
let token
let key
let root

function parse (t) {
	text = String(t)
	parseState = 'start'
	stack = []
	pos = 0
	line = 1
	column = 0
	token = undefined
	key = undefined
	root = undefined

	do {
		token = lex()

		if (!parseStates[parseState]) {
			throw invalidParseState()
		}

		parseStates[parseState]()
	} while (token.type !== 'eof')

	return root
}

let lexState
let buffer
let doubleQuote
let sign
let c

function lex () {
	lexState = 'default'
	buffer = ''
	doubleQuote = false
	sign = 1

	for (;;) {
		c = peek()
		if (!lexStates[lexState]) {
			throw invalidLexState(lexState)
		}

		const token = lexStates[lexState]()
		if (token) {
			return token
		}
	}
}

function peek () {
	if (text[pos]) {
		return String.fromCodePoint(text.codePointAt(pos))
	}
}

function read () {
	const c = peek()

	if (c === '\n') {
		line++
		column = 0
	} else if (c) {
		column += c.length
	}

	if (c) {
		pos += c.length
	}

	return c
}

const lexStates = {
	default () {
		switch (c) {
		case '\t':
		case '\v':
		case '\f':
		case ' ':
		case '\u00A0':
		case '\uFEFF':
		case '\n':
		case '\r':
		case '\u2028':
		case '\u2029':
			read()
			return

		case '/':
			read()
			lexState = 'comment'
			return

		case undefined:
			return newToken('eof')
		}

		if (isSpaceSeparator(c)) {
			read()
			return
		}

		if (!lexStates[parseState]) {
			throw invalidLexState(parseState)
		}

		return lexStates[parseState]()
	},

	comment () {
		switch (c) {
		case '*':
			read()
			lexState = 'multiLineComment'
			return

		case '/':
			read()
			lexState = 'singleLineComment'
			return
		}

		throw invalidChar(c)
	},

	multiLineComment () {
		switch (c) {
		case '*':
			lexState = 'multiLineCommentAsterisk'
			break

		case undefined:
			throw invalidChar(c)
		}

		read()
	},

	multiLineCommentAsterisk () {
		if (c === undefined) {
			throw invalidChar(c)
		}

		read()
		lexState = (c === '/') ? 'default' : 'multiLineComment'
	},

	singleLineComment () {
		switch (c) {
		case '\n':
		case '\r':
		case '\u2028':
		case '\u2029':
			lexState = 'default'
			break

		case undefined:
			return newToken('eof')
		}

		read()
	},

	value () {
		switch (c) {
		case '{':
		case '[':
			return newToken('punctuator', read())

		case 'n':
			read()
			literal('ull')
			return newToken('null', null)

		case 't':
			read()
			literal('rue')
			return newToken('boolean', true)

		case 'f':
			read()
			literal('alse')
			return newToken('boolean', false)

		case '-':
		case '+':
			if (read() === '-') {
				sign = -1
			}

			lexState = 'sign'
			return

		case '.':
			buffer = read()
			lexState = 'decimalPointLeading'
			return

		case '0':
			buffer = read()
			lexState = 'zero'
			return

		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
		case '9':
			buffer = read()
			lexState = 'decimalInteger'
			return

		case 'I':
			read()
			literal('nfinity')
			deprecated('Infinity')
			return newToken('numeric', Infinity)

		case 'N':
			read()
			literal('aN')
			deprecated('NaN')
			return newToken('numeric', NaN)

		case '"':
		case "'":
			doubleQuote = (read() === '"')
			buffer = ''
			lexState = 'string'
			return

		case '`':
			read()
			buffer = ''
			lexState = 'template'
			return
		}

		throw invalidChar(c)
	},

	identifierNameStartEscape () {
		if (c !== 'u') {
			throw invalidChar(c)
		}

		read()
		const u = unicodeEscape()
		switch (u) {
		case '$':
		case '_':
			break

		default:
			if (!isIdStartChar(u)) {
				throw invalidIdentifier()
			}

			break
		}

		buffer += u
		lexState = 'identifierName'
		return
	},

	identifierName () {
		switch (c) {
		case '$':
		case '_':
		case '\u200C':
		case '\u200D':
			buffer += read()
			return

		case '\\':
			read()
			lexState = 'identifierNameEscape'
			return
		}

		if (isIdContinueChar(c)) {
			buffer += read()
			return
		}

		return newToken('identifier', buffer)
	},

	identifierNameEscape () {
		if (c !== 'u') {
			throw invalidChar(c)
		}

		read()
		const u = unicodeEscape()
		switch (u) {
		case '$':
		case '_':
		case '\u200C':
		case '\u200D':
			break

		default:
			if (!isIdContinueChar(u)) {
				throw invalidIdentifier()
			}

			break
		}

		buffer += u
		lexState = 'identifierName'
		return
	},

	sign () {
		switch (c) {
		case '.':
			buffer = read()
			lexState = 'decimalPointLeading'
			return

		case '0':
			buffer = read()
			lexState = 'zero'
			return

		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
		case '9':
			buffer = read()
			lexState = 'decimalInteger'
			return

		case 'I':
			read()
			literal('nfinity')
			deprecated('Infinity')
			return newToken('numeric', sign * Infinity)
		}

		throw invalidChar(c)
	},

	zero () {
		switch (c) {
		case '.':
			buffer += read()
			lexState = 'decimalPoint'
			return

		case 'e':
		case 'E':
			buffer += read()
			lexState = 'decimalExponent'
			return

		case 'b':
		case 'B':
			buffer += read()
			lexState = 'binary'
			return

		case 'o':
		case 'O':
			buffer += read()
			lexState = 'octal'
			return

		case 'x':
		case 'X':
			buffer += read()
			lexState = 'hexadecimal'
			return
		}

		return newToken('numeric', 0)
	},

	decimalInteger () {
		switch (c) {
		case '.':
			buffer += read()
			lexState = 'decimalPoint'
			return

		case 'e':
		case 'E':
			buffer += read()
			lexState = 'decimalExponent'
			return
		}

		if (isDigit(c)) {
			buffer += read()
			return
		}

		return newToken('numeric', sign * Number(buffer))
	},

	decimalPointLeading () {
		if (isDigit(c)) {
			buffer += read()
			lexState = 'decimalFraction'
			return
		}

		throw invalidChar(c)
	},

	decimalPoint () {
		switch (c) {
		case 'e':
		case 'E':
			buffer += read()
			lexState = 'decimalExponent'
			return
		}

		if (isDigit(c)) {
			buffer += read()
			lexState = 'decimalFraction'
			return
		}

		return newToken('numeric', sign * Number(buffer))
	},

	decimalFraction () {
		switch (c) {
		case 'e':
		case 'E':
			buffer += read()
			lexState = 'decimalExponent'
			return
		}

		if (isDigit(c)) {
			buffer += read()
			return
		}

		return newToken('numeric', sign * Number(buffer))
	},

	decimalExponent () {
		switch (c) {
		case '+':
		case '-':
			buffer += read()
			lexState = 'decimalExponentSign'
			return
		}

		if (isDigit(c)) {
			buffer += read()
			lexState = 'decimalExponentInteger'
			return
		}

		throw invalidChar(c)
	},

	decimalExponentSign () {
		if (isDigit(c)) {
			buffer += read()
			lexState = 'decimalExponentInteger'
			return
		}

		throw invalidChar(c)
	},

	decimalExponentInteger () {
		if (isDigit(c)) {
			buffer += read()
			return
		}

		return newToken('numeric', sign * Number(buffer))
	},

	binary () {
		switch (c) {
		case '0':
		case '1':
			buffer += read()
			lexState = 'binaryInteger'
			return
		}

		throw invalidChar(c)
	},

	binaryInteger () {
		switch (c) {
		case '0':
		case '1':
			buffer += read()
			return
		}

		return newToken('numeric', sign * Number(buffer))
	},

	octal () {
		switch (c) {
		case '0':
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
			buffer += read()
			lexState = 'octalInteger'
			return
		}

		throw invalidChar(c)
	},

	octalInteger () {
		switch (c) {
		case '0':
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
			buffer += read()
			return
		}

		return newToken('numeric', sign * Number(buffer))
	},

	hexadecimal () {
		if (isHexDigit(c)) {
			buffer += read()
			lexState = 'hexadecimalInteger'
			return
		}

		throw invalidChar(c)
	},

	hexadecimalInteger () {
		if (isHexDigit(c)) {
			buffer += read()
			return
		}

		return newToken('numeric', sign * Number(buffer))
	},

	string () {
		switch (c) {
		case '\\':
			read()
			buffer += escape()
			return

		case '"':
			if (doubleQuote) {
				read()
				return newToken('string', buffer)
			}

			buffer += read()
			return

		case "'":
			if (!doubleQuote) {
				read()
				return newToken('string', buffer)
			}

			buffer += read()
			return

		case '\n':
		case '\r':
			throw invalidChar(c)

		case '\u2028':
		case '\u2029':
			separatorChar(c)
			break

		case undefined:
			throw invalidChar()
		}

		buffer += read()
		return
	},

	template () {
		switch (c) {
		case '$':
			buffer += read()
			lexState = 'templateDollar'
			return

		case '\\':
			read()
			buffer += escape()
			return

		case '\r':
			read()
			if (peek() === '\n') {
				read()
			}

			buffer += '\n'
			return

		case '`':
			read()
			return newToken('string', buffer)

		case undefined:
			throw invalidChar()
		}

		buffer += read()
		return
	},

	templateDollar () {
		switch (c) {
		case '{':
		case undefined:
			throw invalidChar(c)
		}

		buffer += read()
		lexState = 'template'
		return
	},

	start () {
		switch (c) {
		case '{':
		case '[':
			return newToken('punctuator', read())

		case undefined:
			return newToken('eof')
		}

		lexState = 'value'
	},

	beforePropertyName () {
		switch (c) {
		case '$':
		case '_':
			buffer = read()
			lexState = 'identifierName'
			return

		case '\\':
			read()
			lexState = 'identifierNameStartEscape'
			return

		case '}':
			return newToken('punctuator', read())

		case '"':
		case "'":
			doubleQuote = (read() === '"')
			lexState = 'string'
			return
		}

		if (isIdStartChar(c)) {
			buffer += read()
			lexState = 'identifierName'
			return
		}

		throw invalidChar(c)
	},

	afterPropertyName () {
		if (c === ':') {
			return newToken('punctuator', read())
		}

		throw invalidChar(c)
	},

	beforePropertyValue () {
		lexState = 'value'
	},

	afterPropertyValue () {
		switch (c) {
		case ',':
		case '}':
			return newToken('punctuator', read())
		}

		throw invalidChar(c)
	},

	beforeArrayValue () {
		if (c === ']') {
			return newToken('punctuator', read())
		}

		lexState = 'value'
	},

	afterArrayValue () {
		switch (c) {
		case ',':
		case ']':
			return newToken('punctuator', read())
		}

		throw invalidChar(c)
	},

	// This code is unreachable since lexState is never set to 'end'
	// end () {
	// 	if (c === undefined) {
	// 		return newToken('eof')
	// 	}

	// 	throw invalidChar(c)
	// },
}

function isSpaceSeparator (c) {
	return unicode.Space_Separator.test(c)
}

function isIdStartChar (c) {
	return (c >= 'a' && c <= 'z') ||
	(c >= 'A' && c <= 'Z') ||
	unicode.ID_Start.test(c)
}

function isIdContinueChar (c) {
	return (c >= 'a' && c <= 'z') ||
	(c >= 'A' && c <= 'Z') ||
	(c >= '0' && c <= '9') ||
	unicode.ID_Continue.test(c)
}

function isDigit (c) {
	return /[0-9]/.test(c)
}

function isHexDigit (c) {
	return /[0-9A-Fa-f]/.test(c)
}

function newToken (type, value) {
	return {
		type,
		value,
		line,
		column,
	}
}

function literal (s) {
	for (const c of s) {
		const p = peek()

		if (p !== c) {
			throw invalidChar(p)
		}

		read()
	}
}

function escape () {
	const c = peek()
	switch (c) {
	case 'b':
		read()
		return '\b'

	case 'f':
		read()
		return '\f'

	case 'n':
		read()
		return '\n'

	case 'r':
		read()
		return '\r'

	case 't':
		read()
		return '\t'

	case 'v':
		read()
		return '\v'

	case '0':
		read()
		return '\0'

	case 'x':
		read()
		return hexEscape()

	case 'u':
		read()
		return unicodeEscape()

	case '\n':
	case '\u2028':
	case '\u2029':
		read()
		return '\n'

	case '\r':
		read()
		if (peek() === '\n') {
			read()
		}

		return '\n'

	case undefined:
		throw invalidChar(c)
	}

	return read()
}

function hexEscape () {
	let buffer = ''
	let c = peek()

	if (!isHexDigit(c)) {
		throw invalidChar(c)
	}

	buffer += read()

	c = peek()
	if (!isHexDigit(c)) {
		throw invalidChar(c)
	}

	buffer += read()

	return String.fromCodePoint(parseInt(buffer, 16))
}

function unicodeEscape () {
	const c = peek()
	if (c === '{') {
		read()
		return unicodeCodePointEscape()
	}

	return unicodeCodeUnitEscape()
}

function unicodeCodeUnitEscape () {
	let buffer = ''
	let count = 4

	while (count-- > 0) {
		const c = peek()
		if (!isHexDigit(c)) {
			throw invalidChar(c)
		}

		buffer += read()
	}

	return String.fromCodePoint(parseInt(buffer, 16))
}

function unicodeCodePointEscape () {
	let buffer = ''

	let c = peek()
	if (!isHexDigit(c)) {
		throw invalidChar(c)
	}

	buffer += read()

	while (isHexDigit(c = peek())) {
		buffer += read()
	}

	if (c === '}') {
		read()
		return String.fromCodePoint(parseInt(buffer, 16))
	}

	throw invalidChar(c)
}

const parseStates = {
	start () {
		push()
	},

	beforePropertyName () {
		switch (token.type) {
		case 'identifier':
		case 'string':
			key = token.value
			parseState = 'afterPropertyName'
			return

		case 'punctuator':
			if (token.value !== '}') {
				throw invalidToken()
			}

			pop()
			return
		}

		throw invalidToken()
	},

	afterPropertyName () {
		if (token.type !== 'punctuator' || token.value !== ':') {
			throw invalidToken()
		}

		parseState = 'beforePropertyValue'
	},

	beforePropertyValue () {
		push()
	},

	beforeArrayValue () {
		if (token.type === 'punctuator' && token.value === ']') {
			pop()
			return
		}

		push()
	},

	afterPropertyValue () {
		if (token.type !== 'punctuator') {
			throw invalidToken()
		}

		switch (token.value) {
		case ',':
			parseState = 'beforePropertyName'
			return

		case '}':
			pop()
			return
		}

		throw invalidToken()
	},

	afterArrayValue () {
		if (token.type !== 'punctuator') {
			throw invalidToken()
		}

		switch (token.value) {
		case ',':
			parseState = 'beforeArrayValue'
			return

		case ']':
			pop()
			return
		}

		throw invalidToken()
	},

	end () {
		if (token.type !== 'eof') {
			throw invalidToken()
		}
	},
}

function push () {
	let value

	switch (token.type) {
	case 'punctuator':
		switch (token.value) {
		case '{':
			value = {}
			break

		case '[':
			value = []
			break
		}

		break

	case 'null':
	case 'boolean':
	case 'numeric':
	case 'string':
		value = token.value
		break

	default:
		throw invalidToken()
	}

	if (root === undefined) {
		root = value
	} else {
		const parent = stack[stack.length - 1]
		if (Array.isArray(parent)) {
			parent.push(value)
		} else {
			parent[key] = value
		}
	}

	if (value !== null && typeof value === 'object') {
		stack.push(value)

		if (Array.isArray(value)) {
			parseState = 'beforeArrayValue'
		} else {
			parseState = 'beforePropertyName'
		}
	} else {
		const current = stack[stack.length - 1]
		if (current == null) {
			parseState = 'end'
		} else if (Array.isArray(current)) {
			parseState = 'afterArrayValue'
		} else {
			parseState = 'afterPropertyValue'
		}
	}
}

function pop () {
	stack.pop()

	const current = stack[stack.length - 1]
	if (current == null) {
		parseState = 'end'
	} else if (Array.isArray(current)) {
		parseState = 'afterArrayValue'
	} else {
		parseState = 'afterPropertyValue'
	}
}

function invalidParseState () {
	return new Error(`JSONext: invalid parse state '${parseState}'`)
}

function invalidLexState (state) {
	return new Error(`JSONext: invalid lex state '${state}`)
}

function invalidChar (c) {
	if (c === undefined) {
		return new SyntaxError(`JSONext: invalid end of input at ${line}:${column}`)
	}

	return new SyntaxError(`JSONext: invalid character '${c}' at ${line}:${column}`)
}

function invalidToken () {
	if (token.type === 'eof') {
		return new SyntaxError(`JSONext: invalid end of input at ${line}:${column}`)
	}

	const c = String.fromCodePoint(token.value.codePointAt(0))
	return new SyntaxError(`JSONext: invalid character '${c}' at ${line}:${column}`)
}

function invalidIdentifier () {
	return new SyntaxError(`JSONext: invalid character '${c}' at ${line}:${column}`)
}

function deprecated (s) {
	console.warn(`JSONext: '${s}' is deprecated`)
}

function separatorChar (c) {
	console.warn(`JSONext: '${c}' is not valid ECMAScript; consider escaping`)
}

module.exports = {
	parse,
}
