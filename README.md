# A Lean Modular System For Browsers and NodeJS
A single file solution to use asynchronous module definition (amd) in your browser or server (node.js), it can also compile javascripts into single file. It has tiny footprint, 188 lines of codes (before uglify and minification)

`pico-common` also comes with a series of common lib to be use with or without the amd

## Why?
* Work on browsers and NodeJS (Universal Javascript)
* Same syntax on client and server 
* Support circular dependency
* Small footprint

## Features
* Asyncronous Module Definition
* bundle multiple scripts into one file
* Plugin system to extend it capabilities

## Installation

### Nodejs
install it as a node module
```
npm i pico-common
```
and require it in your script
```javascript
const pico=require('pico-common')

// use plugin without pico's amd 
const pStr = pico.export('pico/str')
```

### Browser
link the minified version in your browser
```html
<script src=//unpkg.com/pico-common@0.10.11/bin/pico.min.js></script>
```
and you can start using in your javascript
```javascript
window.pico

// use plugin witout pico's amd
const pStr = pico.export('pico/str')
```

## amd
It has similar requirejs config but not compatible. To bootstrap the amd
```javascript
pico.run({
	name: 'NAME',			// module name for the bootsrap module
	ajax: ajaxFunc,			// override ajax function used in pico
	onLoad: loadFunc,		// override onload function
	importRule: ()=>{},		// blacklist module here
	preprocessor: ()=>{},		// define special file type preprocessor
	env:envObj,			// add env variable to pico.getEnv()
	paths:{				// require search path, path can be string or function
		'*':./,
		node(name,cb){
			cb(null, pico.require(name))
		}
	}
},function(){		// this function is a bootstrap module
	// Asynchronously load othermodule.js with require keyword defined in pico-common
	const othermodule = require('other')
	// Synchronously load pico-common plugin without using .export
	const pStr = require('pico/str')
	
	// *** do not use othermodule here, not loaded yet ***
	// *** plugin is safe to use here, as it is synchronously loaded ***

	// othermodule is safe to use in this function
	return function(){
		// at this point "othermodule" is fully loaded
		// your app "main loop" start from here
	}
})
```

### Module initialize
> this.load(mod)

`this.load` function should override if an one time initialization is needed after all dependencies are loaded.
```javascript
// amodule.js
const depA = require('depA')
const depB = require('depB')

this.load = function(me){
	// me.hello === 'world'
	do something about depA and depB
}

return {
	hello: 'world'
}
```
`this.load` will be excueted one time only regardless how many time it being required

### Module timer
> this.update(mod, elapsed)

each module has a timer function (`this.update`) that will be called every 0.1s. this is a low overhead timer funtion compare to `setTimeout`
```javascript
// agamemodule.js
const dep = require('dep')

this.update = function(me, elapsed){
	// me.hello === 'world'
	// elapsed ~ 100ms
}

return {
	hello: 'world'
}
```

## bundle multiple script into one script
bundle only work in nodejs env, create a new script with this configuration
```javascript
// newscript.js
pico.build({
	entry:'./main.js',
	output:'./output.js'
})
```
by executing this newscript.js, pico-coomon will create a dependency tree start with `main.js` and put all the dependencies including pico-common into a single file `output.js`

## Examples
### Circular Dependency
Script A
```javascript
var scriptB=require('scriptB')

return function(){
	return 'Script A'
}

this.load=function(){
	console.log(scriptB())
}
```
Script B
```javascript
var scriptA=require('scriptA')

return function(){
	return 'Script B'
}

this.load=function(){
	console.log(scriptA())
}
```
to avoid circular dependency, results returned by require() function can't be use in the document scope, they can only be used in function such as this.load

### Inheritance
child object can inherit properties of one parent object but declare it in child script
```javascript
// parent script
function Parent(){
}
Parent.prototype={
	do:function(){
		console.log("parent do something");
	}
}
return Parent
```
```javascript
// child script
inherit(PATH/TO/PARENT)

return {
	start:function(){
		this.do()
	}
}
```
This can be done in backbone way
```javascript
// parent script
function Parent(){
}
Parent.prototype={
	do:function(){
		console.log("parent do something");
	}
}
return Parent
```
```javascript
// child script
return {
	start:function(){
		this.do()
	}
}
```
```javascript
// somewhere else 
var parent=require("PATH/TO/PARENT")
var child=require("PATH/TO/CHILD")

return {
	run:function(){
		var obj= new (parent.extend(child))
		obj.do();
	}
}
```
Important to take note, parent must be a function/constructor when inherit with extend, child can be object or function/constructor

### Hot reload
ScriptA
```javascript
return {
	a:function(){return 'Hello World'}
}
```
in runtime
```javascript
var scriptA=require('ScriptA')
console.log(scriptA.a()) // 'Hello World'

pico.reload('ScriptA', "return {a:function(){return 'Hot Reload'}}")
console.log(scriptA.a()) // 'Hot Reload'
```

## Caveat
The object returns by require() are not the actual object itself but a proxy object. In most cases, you can handle the proxy object just like the actual object except for few cases
```javascript
// obj.js
module.exports={
	a:1,
	b:2
}
// somewhere.js
var proxy=require('obj')
proxy[a] // 1
Object.keys(proxy) // []
Object.keys(Object.getPrototypeOf(proxy)) // ['a','b']
```
```javascript
// arr.js
module.exports=[ 1, 2 ]
// somewhere.js
var proxy=require('arr')
proxy[0] // 1
proxy.length // 0
Object.getPrototypeOf(proxy).length // 2
```
```javascript
// func.js
module.exports=function(name){return name}
// somewhere.js
var proxy=require('func')
proxy('hello pico') // 'hello pico'
proxy.length // 0
Object.getPrototypeOf(proxy).length // 1
```

## plugins
pico-common has included many useful javascript modules that can be used on both browser and nodejs.

to use the module
1) In your pico loaded module
```javascript
const { setup, ensure } = require('pico/test')
```

2) In your none pico loaded module
in browser
```javascript
const { steup, ensure } = window.pico.export('pico/test');
```
in nodejs
```javascript
const { steup, ensure } = require('pico-common').export('pico/test');
```

### pico/str
pico string library
#### rest url handling
example rest url: `/rest/url/s:str/v%num|#wildcard`
1) `:`, string variable
2) `%`, number variable
3) `|`, optional variable
4) `#`, wildcard variable

##### pStr.compileRest
> pStr.compileRest(rest, [build])

##### pStr.execRest
> pStr.execRest(rest, build, params)

##### pStr.buildRest
> pStr.buildRest(rest, build, params, [relativePath])

##### example
url = `/rest/url/shello/v123/some/more/url`
rest = `/rest/url/s:str/v%num/#wildcard`
str=hello, num=123, wildcard=/some/more/url

url = `/rest/url/shello/v123`
rest = `/rest/url/s:str/v%num/#wildcard`
error: wildcard undefined

url = `/rest/url/shello/v123`
rest = `/rest/url/s:str/v%num|#wildcard`
str=hello, num=123, wildcard=undefined (no error, wildcard is optional)

```javascript
const pStr = require('pico/str')

const build = pStr.compileRest('/rest1/s:str/v%num/#wildcard')
pStr.compileRest('/rest2/:str/%num/#wildcard', build) // append more build
const params = {}
const api = pStr.execRest('/rest2/hello/123/foo/bar', build, params)
// api === '/rest2/:str/%num/#wildcard'
// params === {str: 'hello', num: 123, wildcard: 'foo/bar'}
```

pico is able to build url from rest path and parameter
```javascript
const pStr = require('pico/str')

const build = pStr.compileRest('/rest1/s:str/v%num/#wildcard')
const params = {str: 'foo', num: 123, wildcard: 'bar/456'}
var url = pStr.buildRest('/rest1/s:str/v%num/#wildcard', build, params)
// url === '/rest1/sfoo/v123/bar/456'
var url = pStr.buildRest('/rest1/s:str/v%num/#wildcard', build, params, true)
// url === 'rest1/sfoo/v123/bar/456'
```

### pico/test

pico test library, which able to test code in parallel or series

```javascript
const pico = require('pico-common/bin/pico-cli')
const { setup, test, parallel, series} = pico.export('pico/test')

setup({
	stdout: false, // default: true, toggle standard out
	fname: 'output.json', // default: undefined, output filename
	end: result => {} // default: undefined, callback at the end of test
})

test('ensure 1 is true', cb => {
	cb(null, 1)
})

// optional remarks
test('ensure "" is false', cb => {
	cb(null, "", 'optional', 'remark')
})

// parallel tests
parallel('the tests in here are executed in parallel', function(){
	// execute 1 time
	this.begin(next => {
		next(null, (1, 2))
	})
	// execute 1 time
	this.end((arg1, arg2, next) => {
		next()
	})
	// execute everytime before this.test
	this.before((arg1, arg2, next )=> {
		next(null, (1, 2))
	})
	// execute everytime after this.test
	this.after((arg1, arg2, next )=> {
		next(null, (1, 2))
	})
	this.test('first parallel', (arg1, arg2, next) => {
		next(null, true)
	})
})

series('the tests in here are executed in series', function(){
	// same methods as parallel
})
```
