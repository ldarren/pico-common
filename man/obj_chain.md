# A Data driven Optional chaining
Similar to [JS optional chaining operator (?.)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) but is data driven and suitable to be use in configuration file.

## syntax
> pObj.dot(input, path, [value])

### parameters
__input__: _object_, input can be either array or object

__path__: _array_, paths to reading a value from the input object. it supported multiple branching

__value optional__: _any_, default value if the `path` doesn't yeild any value from `input`

### returns
value yeild by the `path` in `input` or the default `value`

## example
```js
const input = [{name: 'Darren'}, {name: 'San'}]

pObj.dot(input, [1, 'name']) // return 'Darren'

pObj.dot(input, [2, 'name']) // return undefined

pObj.dot(input, [2, 'name'], 'NA') // return 'NA'
```

## import

with es6 module

```js
import pCommon from 'pico-common'

const pObj = pCommon.export('pico/obj')
```

with nodejs commonjs

```js
const pObj = require('pico-common').export('pico/obj')
```

with pico-common amd

```js
const pObj = require('pico/obj')
```
