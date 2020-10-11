## syntax
> pObj.validate(spec, target, [output])

### parameters
__spec__: a js object that defined the target object schema

__target__: a value to be validated, it can be any js value such as object, array, string or number

__output [optional]__: an optional js object to store transformed data of the target object. if not provided, only object validation will be performed.

### returns
it returns a string when encountered an error. the string is a [jsonpath](https://www.baeldung.com/guide-to-jayway-jsonpath) to indicator the location of
the first encountered error. return `undefined` if no error encountered.

## spec format
simplest spec can be just the [type](#supported-types)
```js
const spec = 'number'
pObj.validate(spec, 1) // returns undefined
pObj.validate(spec, 'a') // returns '$'
```

spec can also be an object to imporve the constraint. see [attribute section](#validation-attributes) for more
```js
const spec = {type: 'number', gt: 1, lt: 10} // a number greater than 1 and lesser than 10
pObj.validate(spec, 5) // returns undefined
pObj.validate(spec, 10) // returns '$'
```

### supported types
- number
- string
- bool
- array
- object
- null, _null is a wildcard, it accepts any type_
- date
- enum

```js
// enum example
const spec = {type: ['CN', 'ID', 'MY', 'SG']}
pObj.validate(spec, 'SG') // returns undefined
pObj.validate(spec, 'US') // returns '$'
```

### validation attributes
__gt__: greater than, _valid for `string`, `number` and `array`_

__lt__: lesser than, _valid for `string`, `number` and `array`_

__required__: mandatory, error if `undefined` is given, but no error if `null` is given, _valid for all_. 

__notnull__: not null, error if `null` is given, but no error if `undefined` is given, _valid for all_. 

__value__: default value, `value` will be used if `undefined` is given, _valid for all_. 

__sep__: separator, separator to split string value to array, _valid for array_. 

__regex__: regular expression, _valid for string_

__spec__: nested object schema, _valid for array and string_

__type__: data type, _valid for all_

### attribute referencing
> syntax attribute: [['path', 'to', 'value'], 'default_value']

attribute can be taken from the input value, this make attribute dynamic to the input value

for example, requirement of `email` field is depend on the `meta type`, instead of prepare two spec, the `require` of email can be referencing to meta type instead
```js
const spec = {
  type: 'object',
  spec: {
    email: {
      type: 'string',
      required: [['meta', 'type'], 0]
    },
    mobile: {
      type: 'string',
      required: 1
    }
  }
}

pObj.validate(spec, {
  meta: {
    type: 0
  },
  mobile: '12345678'
})
```

### validate nested object
unlimited nested object can be validated with the help of `spec` attributes

A sample nested objects
```js
const nested = [{
  idx: 1,
  id: 'E010070226',
  meta: {r: 'remarks'},
  status: 1,
  uat: '2020-10-07 02:26:00'
},{
  idx: 1,
  id: 'E010070227',
  meta: {r: 'comments'},
  uat: '2020-10-07 02:27:00'
}]
```

the spec of the nested objects
```js
const spec = {
  type: 'array',
  required: 1,
  gt: 0,
  spec: {
    type: 'object',
    notnull: 1,
    spec: {
      idx: {
        type: 'number',
        gt: 0,
        required: 1
      },
      id: {
        type: 'string',
        gt: 8, // minimum 8 characters
        required: 1
      },
       meta: {
        type: 'object',
        spec: {
          r: 'string'
        }
      },
      status: {
        type: 'bool',
        value: 1
      },
      uat: 'date',
   }
  }
}
```
### object transformation
if the target is container (object or array), a third parameter provides the transformation output

number transformation
```js
const spec = {
  type: 'object',
  spec: {
    foo: 'number'
  }
}
const output = {}
pObj.validate(spec, {foo: "123"}, output) // output === {foo: 123}
pObj.validate(spec, {foo: "a12"}, output) // returns '$.foo'
```

array transformation
```js
const spec = {
  type: 'array',
  sep: ',',
  spec: {
    type: 'number'
  }
}
const output = []
pObj.validate(spec, '1,2,3', output) // output === [1, 2, 3]
pObj.validate(spec, 'a,b,c', output) // returns '$.0'
```

date transformation
```js
const spec = {
  type: 'object',
  spec: {
    foo: 'date'
  }
}
const output = {}
pObj.validate(spec, '{foo: '2020-10-07 02:15:00'}, output) // output === {foo: [Date Object]}
```

default value transformation
```js
const spec = {
  type: 'object',
  spec: {
    foo: 'string',
    value: 'bar'
  }
}
const output = {}
pObj.validate(spec, {}, output) // output === {foo: 'bar'}
```

bool transformation
```js
const spec = {
  type: 'object',
  spec: {
    foo: 'bool'
  }
}
const output = {}
pObj.validate(spec, {foo: 1}, output) // output === {foo: true}
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
