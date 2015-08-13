var
fs=require('fs'),
dummyCB=function(){},
dummyLoader=function(cb){cb()},
modules={},
containers={},
DEF="define('URL',FUNC)\n",
loadDeps=function(deps, func, cb){
    if (!deps.length) return cb()
    func(deps.pop(),function(err){
        if (err) return cb(err)
        loadDeps(deps, func, cb)
    })
},
getMod=function(url,cb){
    cb=cb||dummyCB
    var mod=modules[url]
    if(mod){
        cb(null, mod)
        return mod
    }
    linker(url,cb)
},
compile=function(script,deps,base){
    var
    frequire=function(k){if(!modules[k])deps.push(k)},
    inherit=function(k){base.unshift(k),frequire(k)},
    func=Function('require','exports','module','define','inherit',script)

    func.call({}, frequire,{},{},dummyCB,inherit)
    return func
},
define=function(url, func, base){
    var
    module={exports:{}},
    me={},
    m=func.call(me,getMod,module.exports,module,define)||module.exports,
    o=modules[url]||function(){return arguments.callee.__proto__(this)}

    if (base)m.__proto__=base

    o.prototype=m.prototype
    o.__proto__=m
console.log('define',url,o)
    modules[url]=o
    containers[url]=me
    if(me.load)me.load()
    return o
},
write=function(url, func){
console.log('writing',url)
    fs.appendFile('./output.js', DEF.replace('URL',url).replace('FUNC',func.toString()))
},
linker=function(url,cb){
    if (modules[url])return cb(null, modules[url])
    fs.readFile(url+'.js', {encoding:'utf8'},function(err,txt){
        if (err) return cb(err)
        vm(url,txt,cb)
    })
},
vm=function(url,txt,cb){
    cb=cb||dummyCB
    if (modules[url])return cb(null, modules[url])

    var deps=[], base=[], func=compile(txt,deps,base)

    modules[url]=function(){return arguments.callee.__proto__(this)}

console.log('loading',url)
    loadDeps(deps, linker, function(err){
        if (err) return cb(err)
        
        cb(null,define(url,func,modules[base[0]]))
    })
}

pico={
    run:function(options,func){
        var txt=func.toString();
        (options.onLoad||dummyLoader)(function(){
            vm('main',txt.substring(txt.indexOf('{')+1,txt.lastIndexOf('}')),function(err,main){
                if (err) return console.error(err)
                if (main instanceof Function) main()
            })
        })
    },
    build:function(options){
        fs.unlink('./output.js', function(){
            define=write
            linker(options.entry,function(err){
                if (err) return console.error(err)
                fs.appendFile('./output.js', 'return require("'+options.entry+'")')
            })
        })
    }
}

if(process.argv[2]){
    linker(process.argv[2],function(err){
        if (err) return console.error(err)
    })
}
