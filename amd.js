var
dummyCB=function(){},
dummyLoader=function(){arguments[arguments.length-1]()},
dummyPico={run:dummyCB,build:dummyCB,define:dummyCB,ajax:dummyLoader,env:dummyCB},
modules={},
// module events, e.g. onLoad
events={}, //TODO: should be prototype of event class that support sigslot
EXT_JS='.js',EXT_JSON='.json',
DEF="define('URL','FUNC')\n",
MOD_PREFIX='"use strict";\n',
MOD_POSTFIX='//# sourceURL=',
PLACE_HOLDER='return arguments.callee.__proto__.apply(this,arguments)',
// call when pico.run done
ajax,ran,
paths={},
env={},
preprocessors={},
getExt=function(url){
    if (!url)return null
    var idx=url.lastIndexOf('.')
    return -1!==idx && -1===url.indexOf('/',idx) ? url.substr(idx) : null
},
// link to all deps
linker=function(deps, cb){
    if (!deps.length) return cb()
    loader(deps.shift(),function(err){
        if (err) return cb(err)
        linker(deps, cb)
    })
},
// load files, and execute them based on ext
loader=function(url,cb){
    if (modules[url])return cb(null, modules[url])

    var
    ext=getExt(url),
    symbolIdx=url.indexOf('/'),
    path=paths[-1===symbolIdx?url : url.substr(0,symbolIdx)]

    if (!path){
        symbolIdx=-1
        path=paths['*']||''
    }

    var fname=-1===symbolIdx?url : url.substr(symbolIdx+1)

    if (path instanceof Function){
        path(fname, function(err, m){
            if (err) return cb(err)
            modules[url]=m
            cb(null, m)
        })
    }else{
        ajax('get',path+fname+(ext?'':EXT_JS),null,null,function(err,state,txt){
            if (err) return cb(err)
            if (4!==state) return
            switch(ext || EXT_JS){
            case EXT_JS: return js(url,txt,cb)
            default: return cb(null, define(url,txt))
            }
        })
    }
},
placeHolder=function(){
    return Function(PLACE_HOLDER)
},
getMod=function(url,cb){
    var mod=modules[url]
    if(mod){
        setTimeout(cb||dummyCB, 0, null, mod) // make sure consistent async behaviour
        return mod
    }
    if (cb) return loader(url,cb)
    return modules[url]=placeHolder()
},
// do not run the module but getting the deps and inherit
compile=function(url,txt,deps,base,me){
    me=me||dummyPico
    var
    script=url ? MOD_PREFIX+txt+(env.live ? '' : MOD_POSTFIX+url) : txt,
    frequire=function(k){if(!modules[k])deps.push(k);return modules[k]},
    inherit=function(k){base.unshift(k),frequire(k)},
    func=Function('exports','require','module','define','inherit','pico',script)

    func.call({}, {},frequire,{},dummyCB,inherit,me)
    return func
},
// run the module and register the module output and events
define=function(url, func, base){
    var
    ext=getExt(url)||EXT_JS,
    pp=preprocessors[ext]

    if (pp) func=pp(url, func)

    switch(ext){
    case EXT_JS:
        var
        module={exports:{}},
        evt={},
        m=func.call(evt,module.exports,getMod,module,define,dummyCB,pico)||module.exports

        if (base)m.__proto__=base

        if(evt.load)evt.load()

        if (!url) return m

        events[url]=evt

        var o=modules[url]

        if(o){
            o.prototype=m.prototype
            o.__proto__=m
            return modules[url]=o
        }
        return modules[url]=m
    case EXT_JSON:
        try{ return modules[url]=JSON.parse(func) }
        catch(e){return console.error(url, e.message)}
    default: return modules[url]=func
    }
},
// js file executer
js=function(url,txt,cb){
    cb=cb||dummyCB
    if (modules[url])return cb(null, modules[url])

    var
    deps=[],
    base=[],
    func=compile(url,txt,deps,base)

    if(url)modules[url]=placeHolder()

    linker(deps, function(err){
        if (err) return cb(err)
        
        cb(null,define(url,func,modules[base[0]]))
    })
}

var pico=module[exports]={
    run:function(options,func){
        pico.ajax=ajax=options.ajax||ajax
        paths=options.paths||paths
        env=options.env||env
        preprocessors=options.preprocessors||preprocessors

        ;(options.onLoad||dummyLoader)(function(){
            var txt=func.toString()
            js(options.name||null,txt.substring(txt.indexOf('{')+1,txt.lastIndexOf('}')),function(err,main){
                if (err) return console.error(err)
                if (main instanceof Function) main()
                if(ran)ran()
            })
        })
    },
    build:function(options){
        var
        fs=require('fs'),
        entry=options.entry,
        output=options.output,
        exclude=options.exclude

        // overide define to write function
        define=function(url, func){
            if(!url)return
            if (-1 !== exclude.indexOf(url)) return
            switch(getExt(url)||EXT_JS){
            case EXT_JS: return fs.appendFile(output, DEF.replace('URL',url).replace("'FUNC'",func.toString()))
            case EXT_JSON: return fs.appendFile(output, DEF.replace('URL',url).replace('FUNC',JSON.stringify(JSON.parse(func))))
            default: return fs.appendFile(output, DEF.replace('URL',url).replace('FUNC',func.replace(/[\n\r]/g, '\\n')))
            }
        }

        fs.unlink(output, function(){
            fs.readFile(entry, {encoding:'utf8'}, function(err, txt){
                if (err) return console.error(err)
                // overide define to write function
                var func=compile(null,txt,[],[],pico) // since no define, compile with real pico
                if (-1 !== exclude.indexOf(entry)) return
                ran=function(){
                    fs.appendFile(output, DEF.replace('URL',entry).replace("'FUNC'",func.toString()))
                }
            })
        })
    },
    reload:function(url, script, cb){
        if ('function'===typeof script) cb=script
        cb=cb||dummyCB
        var o=modules[url]
        delete modules[url]
        if (EXT_JS !== (getExt(url)||EXT_JS)) return cb(null, o)
        var reattach=function(err, m){
            if (err) return cb(err)
            if (!o) return cb(null, m)
            o.prototype=m.prototype
            o.__proto__=m
            return cb(null, modules[url]=o)
        }
        if ('string'=== typeof script) js(url, script, reattach)
        else loader(url, reattach)
    },
    parse:js,
    import:require,
    export:getMod,
    env:function(k){ return env[k] }
}
