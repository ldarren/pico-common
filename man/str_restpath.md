rest-api path util consist of three functions

# compileRest
rest path tokenizer, the output tokens can be used by `execRest` and `buildRest`

## syntax
> compileRest(route, [tokens])

### parameters
__route__: string

__tokens__, array

### returns
tokens

### tokens
__|__: optional path

__/__: path separator

__:__: token indicator

__#__: capture the rest of path in one parameter

# execRest
given a rest api path, it returns the matching route and parameters

## syntax
> execRest(path, tokens, params)

### parameters
__path__: string

__tokens__: array

__params__: object, holder of output parameters

### returns
string, macthing route

# buildRest
given a route, a rest path tokens and params, it re-constructs rest api path

## syntax
> buildRest(route, tokens, params, [isRelative])

### parameters
__path__: string

__tokens__: array

__params__: object, inout parameters

__isRelative__: bool, is given path a relative path?

### returns
string, path

# example

```js
var route=
var tokens=pstr.compileRest(':DOMAIN/s3/read/:Key')
pstr.compileRest(':DOMAIN/s34/read/:Key', tokens)

var url = pstr.buildRest(route, tokens, {DOMAIN: 'domain', Key: '123'}, true)
// url === 'domain/s3/read/123'

var params = {}
var route = pStr.execRest('domain/s4/read/123', tokens, params)
// route = :DOMAIN/s4/read/:Key
// params = {DOMAIN: 'domain', key: '123'}
```

# import

with es6 module

```js
import pCommon from 'pico-common'

const pStr = pCommon.export('pico/str')
```

with nodejs commonjs

```js
const pStr = require('pico-common').export('pico/str')
```

with pico-common amd

```js
const pStr = require('pico/str')
```
