## syntax
Single object extension
> pObj.extend(target, source, [option])

### parameters
__target__: The target object — what to apply the sources’ properties to, which is returned after it is modified.

__source__: The source object — objects containing the properties you want to apply.

__output [optional]__: an optional object to define the option of extension.

### returns
the target object

## syntax
Multiple objects extension
> pObj.extends(target, sources, [option])

### parameters
__target__: The target object — what to apply the sources’ properties to, which is returned after it is modified.

__sources__: The source objects — array of objects containing the properties you want to apply.

__output [optional]__: an optional object to define the option of extension.

### returns
the target object

## option
__tidy__: if tidy equal to true, undefined value in object will be ignored in the output

__mergeArr__: if mergeArr equal to true, 

## example
simple extend example
```js
const target = {
  foo: {
    a: 1,
    b: 2
  }
}
const source = {
  foo: {
    b: 1,
    c: 1
  }
}

const output = pObj.extend(target, source)
// output = { foo: {a: 1, b: 1, c: 1}}
```

multiple extends example
```js
const target = {
  foo: {
    a: 1,
    b: 2
  }
}
const source1 = {
  foo: {
    c: 1
  }
}
const source2 = {
  foo: {
    b: 3,
    e: 3
  }
}

const output = pObj.extend(target, [source1, soruce2])
// output = { foo: {a: 1, b: 3, c: 1, e: 3}}
```
