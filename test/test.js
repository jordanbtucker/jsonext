const assert = require('assert')
const sinon = require('sinon')
const JSONext = require('../lib/')

describe('JSONext', function () {
	describe('#parse()', function () {
		describe('objects', function () {
			it('should parse empty objects', function () {
				assert.deepStrictEqual({}, JSONext.parse('{}'))
			})

			it('should parse double string property names', function () {
				assert.deepStrictEqual({a: 1}, JSONext.parse('{"a":1}'))
			})

			it('should parse single string property names', function () {
				assert.deepStrictEqual({a: 1}, JSONext.parse("{'a':1}"))
			})

			it('should parse unquoted property names', function () {
				assert.deepStrictEqual({a: 1}, JSONext.parse('{a:1}'))
			})

			it('should parse special character property names', function () {
				assert.deepStrictEqual({$_: 1, _$: 2, 'a\u200C': 3}, JSONext.parse('{$_:1,_$:2,a\u200C:3}'))
			})

			it('should parse unicode property names', function () {
				assert.deepStrictEqual({'ùńîċõďë': 9}, JSONext.parse('{ùńîċõďë:9}'))
			})

			it('should parse escaped property names', function () {
				assert.deepStrictEqual({ab: 1, $_: 2, _$: 3}, JSONext.parse('{\\u0061\\u0062:1,\\u0024\\u005F:2,\\u005F\\u0024:3}'))
			})

			it('should parse multiple properties', function () {
				assert.deepStrictEqual({abc: 1, def: 2}, JSONext.parse('{abc:1,def:2}'))
			})

			it('should parse nested objects', function () {
				assert.deepStrictEqual({a: {b: 2}}, JSONext.parse('{a:{b:2}}'))
			})
		})

		describe('arrays', function () {
			it('should parse empty arrays', function () {
				assert.deepStrictEqual([], JSONext.parse('[]'))
			})

			it('should parse array values', function () {
				assert.deepStrictEqual([1], JSONext.parse('[1]'))
			})

			it('should parse multiple array values', function () {
				assert.deepStrictEqual([1, 2], JSONext.parse('[1,2]'))
			})

			it('should parse nested arrays', function () {
				assert.deepStrictEqual([1, [2, 3]], JSONext.parse('[1,[2,3]]'))
			})
		})

		it('should parse nulls', function () {
			assert.strictEqual(null, JSONext.parse('null'))
		})

		it('should parse true', function () {
			assert.strictEqual(true, JSONext.parse('true'))
		})

		it('should parse false', function () {
			assert.strictEqual(false, JSONext.parse('false'))
		})

		describe('numbers', function () {
			it('should parse leading zeroes', function () {
				assert.deepStrictEqual([0, 0, 0], JSONext.parse('[0,0.,0e0]'))
			})

			it('should parse integers', function () {
				assert.deepStrictEqual([1, 23, 456, 7890], JSONext.parse('[1,23,456,7890]'))
			})

			it('should parse signed numbers', function () {
				let warn = sinon.stub(console, 'warn')
				assert.deepStrictEqual([-1, +2, -0.1, -0, -Infinity], JSONext.parse('[-1,+2,-.1,-0,-Infinity]'))
				warn.restore()
			})

			it('should parse leading decimal points', function () {
				assert.deepStrictEqual([0.1, 0.23], JSONext.parse('[.1,.23]'))
			})

			it('should parse fractional numbers', function () {
				assert.deepStrictEqual([1, 1.23], JSONext.parse('[1.0,1.23]'))
			})

			it('should parse exponents', function () {
				assert.deepStrictEqual([1, 10, 10, 1, 1.1, 0.1, 10], JSONext.parse('[1e0,1e1,1e01,1.e0,1.1e0,1e-1,1e+1]'))
			})

			it('should parse binary numbers', function () {
				assert.deepStrictEqual([1, 2, 3], JSONext.parse('[0b1,0b10,0b011]'))
			})

			it('should parse octal numbers', function () {
				assert.deepStrictEqual([1, 8, 9], JSONext.parse('[0o1,0o10,0o011]'))
			})

			it('should parse hexadecimal numbers', function () {
				assert.deepStrictEqual([1, 16, 255, 255], JSONext.parse('[0x1,0x10,0xff,0xFF]'))
			})

			it('should parse Infinity with a warning', function () {
				const warn = sinon.stub(console, 'warn', function (message) {
					assert(message.indexOf('Infinity') >= 0)
				})
				assert.strictEqual(Infinity, JSONext.parse('Infinity'))
				assert(warn.calledOnce)
				warn.restore()
			})

			it('should parse NaN with a warning', function () {
				const warn = sinon.stub(console, 'warn', function (message) {
					assert(message.indexOf('NaN') >= 0)
				})
				assert(isNaN(JSONext.parse('NaN')))
				assert(warn.calledOnce)
				warn.restore()
			})
		})

		describe('strings', function () {
			it('should parse double quoted strings', function () {
				assert.strictEqual('abc', JSONext.parse('"abc"'))
			})

			it('should parse single quoted strings', function () {
				assert.strictEqual('abc', JSONext.parse("'abc'"))
			})

			it('should parse nested quotes strings', function () {
				assert.deepStrictEqual(['"', "'"], JSONext.parse('[\'"\',"\'"]'))
			})

			it('should parse escaped characters', function () {
				assert.strictEqual('\b\f\n\r\t\v\0\x0f\u01FF\n\n\a\'\"A', JSONext.parse("'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\a\\'\\\"\\u{000041}'"))
			})

			it('should parse line and paragraph separators with a warning', function () {
				const warn = sinon.stub(console, 'warn', function (message) {
					assert(message.indexOf('not valid ECMAScript') >= 0)
				})
				assert.strictEqual('\u2028\u2029', JSONext.parse("'\u2028\u2029'"))
				assert(warn.calledTwice)
				warn.restore()
			})
		})

		describe('templates', function () {
			it('should parse empty templates', function () {
				assert.strictEqual('', JSONext.parse('``'))
			})

			it('should parse contents', function () {
				assert.strictEqual('abc', JSONext.parse('`abc`'))
			})

			it('should parse dollar signs', function () {
				assert.strictEqual('a$b', JSONext.parse('`a$b`'))
			})

			it('should parse escaped characters', function () {
				assert.strictEqual('\b\f\n\r\t\v\0\x0f\u01FF\n\n\a\'\"A', JSONext.parse('`\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\a\\\'\\"\\u{000041}`'))
			})

			it('should parse line breaks', function () {
				assert.strictEqual('\n\n\n\u2028\u2029', JSONext.parse('`\n\r\r\n\u2028\u2029`'))
			})
		})

		describe('comments', function () {
			it('should parse single-line comments', function () {
				assert.deepStrictEqual({}, JSONext.parse('{//comment\n}'))
			})

			it('should parse multi-line comments', function () {
				assert.deepStrictEqual({}, JSONext.parse('{/*comment\n* */}'))
			})
		})

		it('should parse whitespace', function () {
			assert.deepEqual({}, JSONext.parse('{\t\v\f \u00A0\uFEFF\n\r\u2028\u2029\u2003}'))
		})
	})

	describe('#parse(text, reviver)', function () {
		it('should modify property values', function () {
			assert.deepStrictEqual({a: 'revived', b: 2}, JSONext.parse('{a:1,b:2}', function (k, v) {
				return (k === 'a') ? 'revived' : v
			}))
		})

		it('should modify nested object property values', function () {
			assert.deepStrictEqual({a: {b: 'revived'}}, JSONext.parse('{a:{b:2}}', function (k, v) {
				return (k === 'b') ? 'revived' : v
			}))
		})

		it('should delete property values', function () {
			assert.deepStrictEqual({b: 2}, JSONext.parse('{a:1,b:2}', function (k, v) {
				return (k === 'a') ? undefined : v
			}))
		})

		it('should modify array values', function () {
			assert.deepStrictEqual([0, 'revived', 2], JSONext.parse('[0,1,2]', function (k, v) {
				return (k === '1') ? 'revived' : v
			}))
		})

		it('should modify nested array values', function () {
			assert.deepStrictEqual([0, [1, 2, 'revived']], JSONext.parse('[0,[1,2,3]]', function (k, v) {
				return (k === '2') ? 'revived' : v
			}))
		})

		it('should delete array values', function () {
			assert.deepStrictEqual([0, , 2], JSONext.parse('[0,1,2]', function (k, v) {
				return (k === '1') ? undefined : v
			}))
		})

		it('should modify the root value', function () {
			assert.deepStrictEqual('revived', JSONext.parse('1', function (k, v) {
				return (k === '') ? 'revived' : v
			}))
		})

		it('should set `this` to the parent value', function () {
			assert.deepStrictEqual({a: {b: 'revived'}}, JSONext.parse('{a:{b:2}}', function (k, v) {
				return (k === 'b' && this.b) ? 'revived' : v
			}))
		})
	})

	describe('#stringify', function () {
		describe('objects', function () {
			it('should stringify empty objects', function () {
				assert.strictEqual('{}', JSONext.stringify({}))
			})

			it('should stringify unquoted property names', function () {
				assert.strictEqual('{a:1}', JSONext.stringify({a: 1}))
			})

			it('should stringify single quoted string property names', function () {
				assert.strictEqual("{'a-b':1}", JSONext.stringify({'a-b': 1}))
			})

			it('should stringify double quoted string property names', function () {
				assert.strictEqual('{"a\'":1}', JSONext.stringify({"a'": 1}))
			})

			it('should stringify special character property names', function () {
				assert.strictEqual('{$_:1,_$:2,a\u200C:3}', JSONext.stringify({$_: 1, _$: 2, 'a\u200C': 3}))
			})

			it('should stringify unicode property names', function () {
				assert.strictEqual('{ùńîċõďë:9}', JSONext.stringify({'ùńîċõďë': 9}))
			})

			it('should stringify escaped property names', function () {
				assert.strictEqual("{'\\b\\f\\n\\r\\t\\v\\0\\x01':1}", JSONext.stringify({'\b\f\n\r\t\v\0\x01': 1}))
			})

			it('should stringify multiple properties', function () {
				assert.strictEqual('{abc:1,def:2}', JSONext.stringify({abc: 1, def: 2}))
			})

			it('should stringify nested objects', function () {
				assert.strictEqual('{a:{b:2}}', JSONext.stringify({a: {b: 2}}))
			})
		})

		describe('arrays', function () {
			it('should stringify empty arrays', function () {
				assert.strictEqual('[]', JSONext.stringify([]))
			})

			it('should stringify array values', function () {
				assert.strictEqual('[1]', JSONext.stringify([1]))
			})

			it('should stringify multiple array values', function () {
				assert.strictEqual('[1,2]', JSONext.stringify([1, 2]))
			})

			it('should stringify nested arrays', function () {
				assert.strictEqual('[1,[2,3]]', JSONext.stringify([1, [2, 3]]))
			})
		})

		it('should stringify nulls', function () {
			assert.strictEqual('null', JSONext.stringify(null))
		})

		it('should stringify true', function () {
			assert.strictEqual('true', JSONext.stringify(true))
		})

		it('should stringify false', function () {
			assert.strictEqual('false', JSONext.stringify(false))
		})

		it('should return undefined for functions', function () {
			assert.strictEqual(undefined, JSONext.stringify(function () {}))
		})

		it('should return null for functions in arrays', function () {
			assert.strictEqual('[null]', JSONext.stringify([function () {}]))
		})

		describe('numbers', function () {
			it('should stringify numbers', function () {
				assert.strictEqual('-1.2', JSONext.stringify(-1.2))
			})

			it('should stringify null for non-finite numbers', function () {
				assert.strictEqual('[null,null]', JSONext.stringify([Infinity, NaN]))
			})
		})

		describe('strings', function () {
			it('should stringify single quoted strings', function () {
				assert.strictEqual("'abc'", JSONext.stringify('abc'))
			})

			it('should stringify double quoted strings', function () {
				assert.strictEqual('"abc\'"', JSONext.stringify("abc'"))
			})

			it('should stringify template strings', function () {
				assert.strictEqual('`abc\'"`', JSONext.stringify('abc\'"'))
			})

			it('should stringify escaped characters', function () {
				assert.strictEqual("'\\b\\f\\n\\r\\t\\v\\0\\x0f'", JSONext.stringify('\b\f\n\r\t\v\0\x0f'))
			})

			it('should stringify escaped single quotes', function () {
				assert.strictEqual("'\\'\"`'", JSONext.stringify('\'"`'))
			})

			it('should stringify escaped double quotes', function () {
				assert.strictEqual('"\'\'\\"`"', JSONext.stringify('\'\'"`'))
			})

			it('should stringify escaped backtick quotes', function () {
				assert.strictEqual('`\'\'""\\``', JSONext.stringify('\'\'""`'))
			})

			it('should stringify escaped line and paragraph separators', function () {
				assert.strictEqual("'\\u2028\\u2029'", JSONext.stringify('\u2028\u2029'))
			})
		})

		it('should stringify using built-in toJSON methods', function () {
			assert.strictEqual("'2016-01-01T00:00:00.000Z'", JSONext.stringify(new Date('2016-01-01T00:00:00.000Z')))
		})

		it('should stringify using user defined toJSON methods', function () {
			RegExp.prototype.toJSON = RegExp.prototype.toString
			assert.strictEqual("'/a/'", JSONext.stringify(/a/))
			RegExp.prototype.toJSON = undefined
		})

		it('should stringify using user defined toJSON(key) methods', function () {
			let C = function () {}
			C.prototype.toJSON = function (key) { return (key === 'a') ? 1 : 2 }
			assert.strictEqual('{a:1,b:2}', JSONext.stringify({a: new C(), b: new C()}))
		})

		it('should stringify using toJSONext methods', function () {
			RegExp.prototype.toJSONext = RegExp.prototype.toString
			assert.strictEqual("'/a/'", JSONext.stringify(/a/))
			RegExp.prototype.toJSONext = undefined
		})

		it('should stringify using toJSONext(key) methods', function () {
			let C = function () {}
			C.prototype.toJSONext = function (key) { return (key === 'a') ? 1 : 2 }
			assert.strictEqual('{a:1,b:2}', JSONext.stringify({a: new C(), b: new C()}))
		})
	})

	describe('#stringify(space)', function () {
		it('should not indent when no value is provided', function () {
			assert.strictEqual('[1]', JSONext.stringify([1]))
		})

		it('should not indent when 0 is provided', function () {
			assert.strictEqual('[1]', JSONext.stringify([1], null, 0))
		})

		it('should not indent when an empty string is provided', function () {
			assert.strictEqual('[1]', JSONext.stringify([1], null, ''))
		})

		it('should indent n spaces when a number is provided', function () {
			assert.strictEqual('[\n  1,\n]', JSONext.stringify([1], null, 2))
		})

		it('should not indent more than 10 spaces when a number is provided', function () {
			assert.strictEqual('[\n          1,\n]', JSONext.stringify([1], null, 11))
		})

		it('should indent with the string provided', function () {
			assert.strictEqual('[\n\t1,\n]', JSONext.stringify([1], null, '\t'))
		})

		it('should not indent more than 10 characters of the string provided', function () {
			assert.strictEqual('[\n          1,\n]', JSONext.stringify([1], null, '           '))
		})

		it('should indent in arrays', function () {
			assert.strictEqual('[\n  1,\n]', JSONext.stringify([1], null, 2))
		})

		it('should indent in nested arrays', function () {
			assert.strictEqual('[\n  1,\n  [\n    2,\n  ],\n  3,\n]', JSONext.stringify([1, [2], 3], null, 2))
		})

		it('should indent in objects', function () {
			assert.strictEqual('{\n  a: 1,\n}', JSONext.stringify({a: 1}, null, 2))
		})

		it('should indent in nested objects', function () {
			assert.strictEqual('{\n  a: {\n    b: 2,\n  },\n}', JSONext.stringify({a: {b: 2}}, null, 2))
		})
	})

	describe('#stringify(replacer)', function () {
		it('should filter keys when an array is provided', function () {
			assert.strictEqual("{a:1,'0':3}", JSONext.stringify({a: 1, b: 2, 0: 3}, ['a', 0]))
		})

		it('should replace values when a function is provided', function () {
			assert.strictEqual('{a:2,b:2}', JSONext.stringify({a: 1, b: 2}, function (key, value) {
				return (key === 'a') ? 2 : value
			}))
		})
	})
})

describe('require(*.jsonext)', function () {
	it('should parse a JSONext document', function () {
		require('../lib/register')
		assert.deepStrictEqual({a: 1, b: 2}, require('./test.jsonext'))
	})
})
