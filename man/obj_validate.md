# syntax
> pObj.validate(spec, input, [output], [external])

## parameters
__spec__: a js object that defined the target object schema

__input__: a value to be validated, it can be any js value such as object, array, string or number

__output [optional]__: an optional js object to store transformed data of the target object. if not provided, only object validation will be performed.

__external [optional]__: an optional js object, any data needed to transform the input to output should be placed here. external data is accessable by [dynamic attributes](#dynamic attribute)

## returns
it returns a string when encountered an error. the string is a [jsonpath](https://www.baeldung.com/guide-to-jayway-jsonpath) to indicator the location of
the first encountered error. return `undefined` if no error encountered.

# spec format
the simplest spec can be just the [type](#supported-types)
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

## supported types
- number
- string
- bool, _false for undefined, null, "", "false", false, 0_
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

## validation attributes
__type__: data type, _valid for all_

__required__: mandatory, `required` test is runs before `value`, `notnull`, it returns error if `undefined` is given, but no error if `null` is given, _valid for all_. 

__value__: default value, `value` will be used if `undefined` is given and `required` is false, _valid for all_. 

__notnull__: not nullable, it runs after `required` and `value`, it returns error if `null` or `undefined` is given and `value` is not defined, _valid for all_. 

__spec__: nested object schema, _valid for array and object_

__force__: force type, given value type if force to the defined type if a non-conform value is given, _valid for array and string_

__int__: integer, round the given number, 'f' or 'd' for round down, 'c' or 'u' for round up, _valid for number_

__gt__: greater than, _valid for `string`, `number`, `date` and `array`_

__lt__: lesser than, _valid for `string`, `number`, `date` and `array`_

__sep__: separator, separator to split string value to array, _valid for array_. 

__regex__: regular expression, _valid for string_

__formats__: array of time format such as ['Y/M/D', 'D M Y'], _valid for date_

__*__: object key, _valid for object's spec_

## dynamic attribute
all attributes supported dynamic values by using operators. there are four operators supported

### ref operator
> syntax: ['operator_name', 'path_to_value', ['default_value']]

__operator_name__: _string_, `ref` for reference

__path_to_value__: _array_, an array of string for the path to referencing value, e.g. [{id: 1}, {id: 2}, {id: 3}], the _path_to_value_ of `id:3` is [2, 'id']

__default_value__: if value not found in the given _path_to_value_, the default value will be used instead


### bool operator
convert value to boolean value: 1 or 0
> syntax: ['operator_name', 'path', ['default'], [invertor]]

__operator_name__: _string_, `bool` for inverting a value

__path__: _array_, an array of string for the path to referencing value, e.g. [{id: 1}, {id: 2}, {id: 3}], the _path_to_value_ of `id:3` is [2, 'id']

__default__: if value not found in the given _path_to_value_, the default value will be used instead

__invertor__: _bool_, if invertor === false, bool operator return true if path's value is true, if true, bool operator return true if path's value is empty or does not exisit

an dynamic attribute example to have either `idx` or `ref` be mandatory
```js
const spec = {
  type: 'object',
  spec: {
    idx: {
      type: 'number',
      required: ['inv', ['ref'], 0] // required = 1 if ref is undefined
    },
    ref: {
      type: 'string',
      required: ['inv', ['idx'], 0] // required = 1 if idx is undefined
    }
  }
}

pObj.validate(spec, {
  idx: 42
})
```

### eq operator
> syntax: ['operator_name', 'A path', 'A default', 'B path', ['B default'], ['invertor']]

__operator_name__: _string_, `eq` for comparing value `A` and `B`

__A_path__: _array_, path to value A

__A_default__: default value A if path not found

__B_path__: _array_, path to value B

__B_default__: default value B if path not found

__invertor__: _bool_, if invertor === false, eq operator return true if A === B, if true, eq operator return true if A !== B

### map operator
> syntax: ['operator_name', 'A path', 'A default', 'map path', 'B path', ['B default']]

__operator_name__: _string_, `map` for mapping value A to B

__A_path__: _array_, path to value A

__A_default__: default value A if path not found

__map_path__: path to find mapping object, mapping object can in input or extension object

__B_path__: _array_, path to value B

__B_default__: default value B if path not found


## validate nested object
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
## object transformation
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

# import

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
