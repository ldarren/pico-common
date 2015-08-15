var
fs=require('fs'),
dummyCB=function(){},
dummyLoader=function(cb){cb()},
dummyPico={run:function(){},build:function(){}},
modules={},
// module events, e.g. onLoad
events={},
EXT_JS='.js',
DEF="define('URL',FUNC)\n",
// call when pico.run done
ran,
// link to all deps
linker=function(deps, func, cb){
    if (!deps.length) return cb()
    func(deps.pop(),function(err){
        if (err) return cb(err)
        linker(deps, func, cb)
    })
},
getMod=function(url,cb){
    var mod=modules[url]
console.log('getMod',url,mod)
    if(mod){
        if(cb)cb(null, mod)
        return mod
    }
    if (cb) return loader(url,cb)
    modules[url]=mod=function(){return arguments.callee.__proto__(this)}
    return mod
},
// do not run the module but getting the deps and inherit
compile=function(script,deps,base,andRun){
    var
    frequire=function(k){if(!modules[k])deps.push(k)},
    inherit=function(k){base.unshift(k),frequire(k)},
    func=Function('require','exports','module','define','inherit',script)

    if (!andRun){
        var org=pico
        pico=dummyPico // prevent actual execution
    }
    func.call({}, frequire,{},{},dummyCB,inherit)
    if (org)pico=org
    return func
},
// run the module and register the module output and events
define=function(url, func, base){
console.log('# defining',url)

    var
    module={exports:{}},
    me={},
    m=func.call(me,getMod,module.exports,module,define,dummyCB)||module.exports

    if(me.load)me.load()

    if (!url) return m

    var o=modules[url]||function(){return arguments.callee.__proto__(this)}

    if (base)m.__proto__=base

    o.prototype=m.prototype
    o.__proto__=m
    modules[url]=o
    events[url]=me

console.log('# defined',url)
    return o
},
// write module to file, replacement of define
write=function(url, func){
    if(!url)return
console.log('writing',url)
    fs.appendFile('./output.js', DEF.replace('URL',url).replace('FUNC',func.toString()))
},
// load files, and execute them based on ext
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
// js file executer
js=function(url,txt,cb){
    cb=cb||dummyCB
    if (modules[url])return cb(null, modules[url])

    var
    deps=[],
    base=[],
    func=compile(txt,deps,base)

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
                if(ran)ran()
            })
        })
    },
    build:function(options){
        fs.unlink(options.output, function(){
            fs.readFile(options.entry, {encoding:'utf8'}, function(err, txt){
                if (err) return console.error(err)
                define=write // write instead of run
                var func=compile(txt,[],[],true) // since no define, compile and run
                ran=function(){
                    fs.appendFile(options.output, DEF.replace('URL',options.entry).replace('FUNC',func.toString()))
                }
            })
        })
    }
}
if(process.argv[2]){
    loader(process.argv[2],function(err){
        if (err) return console.error(err)
    })
}
