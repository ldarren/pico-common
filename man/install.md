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
// use plugin without pico's amd
const pStr = window.pico.export('pico/str')
```

### Browser with ES6 Module
ESM import is supported
```html
<script type=module>
import pico from './bin/pico-es.min.js'
const pStr = pico.export('pico/str')
</script>
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
