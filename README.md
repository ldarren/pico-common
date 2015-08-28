#A Lean Modular System For Browsers and NodeJS
A single file solution to use commonjs/nodejs module definition in your client code. picojs has additional functions such as nodejs friendly, compile into single file, plugin system, etc. All these features in 188 lines of codes (before uglify and minification)

##Why?
* Work on browsers and NodeJS (Universal Javascript)
* Same syntax on client and server 
* Support cycular dependency
* Small footprint

##How?
pico can be this small is due to it has very small dependencies, in fact it is depended on standard javascript and node.js functionality only such as Function object, node.js filesystem etc

##Features
* Asyncronous Module Definition
* Build single file from multiple files
* Plugin system to extend it capabilities

##Installation
###Browser
Link single javascript in your html
```html
<script src=PATH/TO/pico.js></script>
```
###Nodejs
```jaavscript
var pico=require('PATH/TO/pico.js')
```

##Configuration
To start project
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
