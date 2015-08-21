#A Lean Modular System For Browsers and NodeJS
##Why?
* Work on browsers and NodeJS
* Same syntax on all platforms
* Support cycular dependency
* Small footprint
##Features
##Installation
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
