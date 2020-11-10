pFunc.reflect return reflection of a given function, it returns
- typeName: method or function
- functionName: function name
- methodName: method name
- fileName: filename
- line: line number
- column: column number
- evalOrigin: 
- isTopLevel
- isEval
- isNative
- isConstructor
- trace: call stack

## syntax
> pFunc.reflect(function, [limit = 1])

### parameters
__function__: _function_, function to be analyzed

__limit__, _optional limit_, call stack limit

## import

with es6 module

```js
import pCommon from 'pico-common'

const pFunc = pCommon.export('pico/func')
```

with nodejs commonjs

```js
const pFunc = require('pico-common').export('pico/func')
```

with pico-common amd

```js
const pFunc = require('pico/func')
```
