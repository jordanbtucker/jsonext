# JSONext

[![Build Status](https://travis-ci.org/jordanbtucker/jsonext.svg?branch=master)](https://travis-ci.org/jordanbtucker/jsonext)

An *ext*ention of JSON that supports *Next* gen features.

## Usage

### Node

```bash
npm install --save jsonext
```

```js
const JSONext = require('jsonext')
```

### Browser

```html
<script src="https://unpkg.com/jsonext/dist/jsonext.js"></script>
```

## API

The JSONext API is compatible with the [JSON API].

### `JSONext.parse(text [, reviver])`

Parses JSONext text into an ECMAScript value.

### `JSONext.stringify(value [, replacer [, space]])`

Returns a string in JSONext format representing an ECMAScript value.

## File extension

JSONext uses the file extension `.jsonext`. You can `require` JSONext files
with the following:

```js
// Register the .jsonext file extension.
require('jsonext/register')

// Load a JSONext file directly.
const config = require('./config.jsonext')
```

## Current features

### JSON5 syntax

```js
{
    // comments
    unquoted: 'and you can quote me on that',
    singleQuotes: 'I can use "double quotes" here',
    lineBreaks: "Look, Mom!\
No \\n's!",
    hexadecimal: 0xdecaf,
    leadingDecimalPoint: .8675309, andTrailing: 8675309.,
    positiveSign: +1,
    trailingComma: 'in objects', andIn: ['arrays',],
    "backward compatible": "with JSON",
}
```

`Infinity` and `NaN` are supported for backward compatibility, but they are
deprecated and produce warnings.

### Unicode property names

Including unicode escapes. The following documents are equivalent.

```js
{ ùńîċõďë: '¡ celebridad internacional !' }
```

```js
{ \u00f9\u0144\u00ee\u010b\u00f5\u010f\u00eb: "¡ celebridad internacional !" }
```

### Unicode code point escapes in strings

```js
{ surrogatePairs: '\u{20BB7}' }
```

### Hex escapes in strings

```js
{ hexEscapes: 'No \x65\x73\x63\x61\x70\x65 from reality' }
```

### Template literals without substitutions

```js
{ templates: `Jane said, "It's great!"` }
```

The following document is invalid.

```js
{ invalidTemplate: `Jane said, "${message}"` }
```

[JSON API]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON#Methods
