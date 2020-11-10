A Radix tree based REST router build for nodejs and the browsers. A [benchmark](https://github.com/alexanderankin/router-benchmarks) against other popular javascript routers:

```
======================
 pico-common benchmark 
======================
short static: 91,350,211 ops/sec
static with same radix: 39,474,811 ops/sec
dynamic route: 2,323,660 ops/sec
mixed static dynamic: 2,870,571 ops/sec
long static: 46,697,054 ops/sec
wildcard: 3,542,488 ops/sec
all together: 818,534 ops/sec

===================
 express benchmark 
===================
static with same radix: 1,738,085 ops/sec
dynamic route: 859,155 ops/sec
mixed static dynamic: 663,477 ops/sec
long static: 835,287 ops/sec
wildcard: 495,018 ops/sec
all together: 139,861 ops/sec

======================
 koa-router benchmark
======================
short static: 961,663 ops/sec
static with same radix: 944,295 ops/sec
dynamic route: 943,490 ops/sec
mixed static dynamic: 917,677 ops/sec
long static: 955,660 ops/sec
wildcard: 949,585 ops/sec
all together: 155,295 ops/sec
```

# example
```js
import pCommon from 'pico-common'

const pStr = pCommon.export('pico/str')
const radix = new pStr.Radix

// add routes
radix.add('/users/:id')
radix.add('/users/:id/devices')

// find matching route
function onRequest(path){
  const params = {}
  const route = radix.match(path, params) 
}

// create path from route and params
function send(route, params){
  const path radix.build(route, params)
  // send your request here
}
```

# add
rest path tokenizer, the output tokens can be used by [`match`](#match)

## syntax
> add(route)

### parameters
__route__: string

### returns
void

### tokens
__/__: path separator

__:__: token indicator

__*__: capture the rest of path in one parameter

# match
given a rest api path, it returns the matching route and parameters

## syntax
> math(path, params)

### parameters
__path__: string

__params__: object, holder of output parameters

### returns
string, macthing route

# build
given a route, and params, it re-constructs rest api path

## syntax
> build(route, params)

### parameters
__path__: string

__params__: object, params hold REST router parameters

### returns
string, path

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
