# JSONext

An *ext*ention of JSON that supports *Next* gen features.

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
