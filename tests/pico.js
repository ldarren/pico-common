var
fs=require('fs'),
dummyCB=function(){},
dummyLoader=function(cb){cb()},
dummyPico={run:function(){},build:function(){}},
modules={},
containers={},
EXT_JS='.js',
DEF="define('URL',FUNC)\n",
linker=function(deps, func, cb){
    if (!deps.length) return cb()
    func(deps.pop(),function(err){
        if (err) return cb(err)
        linker(deps, func, cb)
    })
},
getMod=function(url,cb){
    cb=cb||dummyCB
    var mod=modules[url]
    if(mod){
        cb(null, mod)
        return mod
    }
    loader(url,cb)
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
    m=func.call(me,getMod,module.exports,module,define)||module.exports

    if(me.load)me.load()

console.log('define',url)

    if (!url) return m

    var o=modules[url]||function(){return arguments.callee.__proto__(this)}

    if (base)m.__proto__=base

    o.prototype=m.prototype
    o.__proto__=m
    modules[url]=o
    containers[url]=me

    return o
},
write=function(url, func){
    if(!url)return
console.log('writing',url)
    fs.appendFile('./output.js', DEF.replace('URL',url).replace('FUNC',func.toString()))
},
loader=function(url,cb){
    if (modules[url])return cb(null, modules[url])

    var
    idx=url.lastIndexOf('.'),
    sh=-1===idx || -1!==url.indexOf('/',idx),
    ext=sh ? EXT_JS : url.substr(idx)
console.log('loading',url,ext,idx)

    fs.readFile(url+(sh?ext:''), {encoding:'utf8'},function(err,txt){
        if (err) return cb(err)
        switch(ext){
        case EXT_JS: js(url,txt,cb); break
        }
    })
},
js=function(url,txt,cb){
    cb=cb||dummyCB
    if (modules[url])return cb(null, modules[url])

    var
    deps=[],
    base=[],
    org=pico,
    func

    pico=dummyPico
    func=compile(txt,deps,base)
    pico=org

    if(url)modules[url]=function(){return arguments.callee.__proto__(this)}

console.log('jsing',url,deps)
    linker(deps, loader, function(err){
        if (err) return cb(err)
        
        cb(null,define(url,func,modules[base[0]]))
    })
}

pico={
    run:function(options,func){
        var txt=func.toString();
        (options.onLoad||dummyLoader)(function(){
            js(null,txt.substring(txt.indexOf('{')+1,txt.lastIndexOf('}')),function(err,main){
                if (err) return console.error(err)
                if (main instanceof Function) main()
            })
        })
    },
    build:function(options){
        fs.unlink(options.output, function(){
            define=write
            dummyPico=pico
            loader(options.entry,function(err){
                if (err) return console.error(err)
                fs.appendFile(options.output, 'module.exports=require("'+options.entry+'")\n')
            })
        })
    }
}

if(process.argv[2]){
    loader(process.argv[2],function(err){
        if (err) return console.error(err)
    })
}
