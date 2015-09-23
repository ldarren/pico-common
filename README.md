#A Lean Modular System For Browsers and NodeJS
A single file solution to use commonjs/nodejs module definition in your browser or server (node.js), it can also compile javascripts into single file. It has tiny footprint, 188 lines of codes (before uglify and minification)

##Why?
* Work on browsers and NodeJS (Universal Javascript)
* Same syntax on client and server 
* Support circular dependency
* Small footprint

##Features
* Asyncronous Module Definition
* Build single file from multiple files
* Plugin system to extend it capabilities

##Installation
Download just the [pico.js](https://raw.githubusercontent.com/ldarren/pico-common/master/pico.js) or clone github
```
git clone https://github.com/ldarren/pico-common.git pico-common
```
###Browser
```html
<script src=PATH/TO/pico.js></script>
```
###Nodejs
```javascript
var pico=require('PATH/TO/pico.js')
```

##Configuration
It has similar requirejs config but not compatible. To bootstrap the amd
```javascript
pico.run({
    ajax:ajaxFunc,
    env:envObj,
    path:{
        '*':./,
        'node':function(name,cb){
            cb(null, pico.require(name))
        }
    }
},function(){
    var main=require('main')
})
```
To compress project into one file
```javascript
pico.build({
    entry:'./main.js',
    output:'./output.js'
})
```
##Examples
###Circular Dependency
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
