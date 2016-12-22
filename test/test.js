const assert = require('assert')
const sinon = require('sinon')
const JSONext = require('../src/')

describe('Parser', function () {
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
				assert.deepStrictEqual({$: 1, _: 2, 'a\u200C': 3}, JSONext.parse('{$:1,_:2,a\u200C:3}'))
			})

			it('should parse escaped property names', function () {
				assert.deepStrictEqual({ab: 1}, JSONext.parse('{\\u0061\\u0062:1}'))
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
				assert.deepStrictEqual([1, 10, 10, 1, 1.1, 0.1], JSONext.parse('[1e0,1e1,1e01,1.e0,1.1e0,1e-1]'))
			})

			it('should parse binary numbers', function () {
				assert.deepStrictEqual([1, 2], JSONext.parse('[0b1,0b10]'))
			})

			it('should parse octal numbers', function () {
				assert.deepStrictEqual([1, 8], JSONext.parse('[0o1,0o10]'))
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
				assert.strictEqual('\b\f\n\r\t\v\0\x0f\u01FF\n\n\aA', JSONext.parse("'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\a\\u{000041}'"))
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

		describe('comments', function () {
			it('should parse single-line comments', function () {
				assert.deepStrictEqual({}, JSONext.parse('{//comment\n}'))
			})

			it('should parse multi-line comments', function () {
				assert.deepStrictEqual({}, JSONext.parse('{/*comment\n* */}'))
			})
		})

		it('should parse whitespace', function () {
			assert.deepEqual({}, JSONext.parse('{\t\v\f \u00A0\uFEFF\n\r\u2028\u2029}'))
		})

		// it('should support multi-line comments', function () {
		// 	assert.deepEqual({}, JSONext.parse(fs.readFileSync('test/cases/multi-line-comment.jsonext')))
		// })

		// it('should support single-line comments', function () {
		// 	assert.deepEqual({}, JSONext.parse(fs.readFileSync('test/cases/single-line-comment.jsonext')))
		// })

		// it('should throw on invalid comments', function () {
		// 	assert.throws(function () {
		// 		assert.fail(JSONext.parse(fs.readFileSync('test/cases/invalid-comment.jsonext')))
		// 	})
		// })

		// it('should parse nested objects', function () {
		// 	assert.deepEqual([{}], JSONext.parse('[{}]'))
		// })
	})
})
