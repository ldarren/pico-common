!function(module, exports){
    var
    dummyCB=function(){},
    dummyLoader=function(cb){cb()},
    dummyPico={run:function(){},build:function(){}},
    modules={},
    // module events, e.g. onLoad
    events={},
    EXT_JS='.js',EXT_JSON='.json',
    DEF="define('URL','FUNC')\n",
    // call when pico.run done
    ajax,ran,
    paths={},
    env={},
    getExt=function(url){
        if (!url)return null
        var idx=url.lastIndexOf('.')
        return -1===url.indexOf('/',idx) ? url.substr(idx) : null
    },
    // link to all deps
    linker=function(deps, cb){
        if (!deps.length) return cb()
        loader(deps.pop(),function(err){
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
        path=paths[-1===symbolIdx?url : url.substr(0,symbolIdx)] || paths['*'] || '',
        fname=-1===symbolIdx?url : url.substr(symbolIdx+1)

console.log('loading',url,path+fname+(ext?'':EXT_JS))

        ajax('get',path+fname+(ext?'':EXT_JS),null,null,function(err,state,txt){
            if (err) return cb(err)
            if (4!==state) return
            switch(ext || EXT_JS){
            case EXT_JS: return js(url,txt,cb)
            default: return cb(null, define(url,txt))
            }
        })
    },
    placeHolder=function(){
        return function(){return arguments.callee.__proto__(this)}
    },
    getMod=function(url,cb){
        var mod=modules[url]
console.log('getMod',url,mod)
        if(mod){
            if(cb)cb(null, mod)
            return mod
        }
        if (cb) return loader(url,cb)
        modules[url]=mod=placeHolder()
        return mod
    },
    // do not run the module but getting the deps and inherit
    compile=function(script,deps,base,me){
        me=me||dummyPico
        var
        frequire=function(k){if(!modules[k])deps.push(k)},
        inherit=function(k){base.unshift(k),frequire(k)},
        func=Function('require','exports','module','define','inherit','pico',script)

        func.call({}, frequire,{},{},dummyCB,inherit,me)
        return func
    },
    // run the module and register the module output and events
    define=function(url, func, base){
console.log('defining',url)

        switch(getExt(url)||EXT_JS){
        case EXT_JS:
            var
            module={exports:{}},
            evt={},
            m=func.call(evt,getMod,module.exports,module,define,dummyCB,pico)||module.exports

            if(evt.load)evt.load()

            if (!url) return m

            var o=modules[url]||placeHolder()

            if (base)m.__proto__=base

            o.prototype=m.prototype
            o.__proto__=m
            modules[url]=o
            events[url]=evt
            return o
        case EXT_JSON:
            var m=JSON.parse(func)
            modules[url]=m
            return m
        default:
            modules[url]=func
            return func
        }
    },
    // js file executer
    js=function(url,txt,cb){
        cb=cb||dummyCB
        if (modules[url])return cb(null, modules[url])

        var
        deps=[],
        base=[],
        func=compile(txt,deps,base)

        if(url)modules[url]=placeHolder()

console.log('jsing',url,deps)
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

            ;(options.onLoad||dummyLoader)(function(){
                var txt=func.toString()
                js(null,txt.substring(txt.indexOf('{')+1,txt.lastIndexOf('}')),function(err,main){
                    if (err) return console.error(err)
                    if (main instanceof Function) main()
                    if(ran)ran()
                })
            })
        },
        build:function(options){
            var fs=require('fs')
            fs.unlink(options.output, function(){
                fs.readFile(options.entry, {encoding:'utf8'}, function(err, txt){
                    if (err) return console.error(err)
                    define=function(url, func){
                        if(!url)return
console.log('writing',url)
                        switch(getExt(url)||EXT_JS){
                        case EXT_JS: return fs.appendFile(options.output, DEF.replace('URL',url).replace("'FUNC'",func.toString()))
                        case EXT_JSON: return fs.appendFile(options.output, DEF.replace('URL',url).replace('FUNC',JSON.stringify(JSON.parse(func))))
                        default: return fs.appendFile(options.output, DEF.replace('URL',url).replace('FUNC',func.replace(/[\n\r]/g, '\\n')))
                        }
                    }
                    var func=compile(txt,[],[],pico) // since no define, compile with real pico
                    ran=function(){
                        fs.appendFile(options.output, DEF.replace('URL',options.entry).replace("'FUNC'",func.toString()))
                    }
                })
            })
        },
        ajax:ajax,
        env:function(k){ return env[k] }
    }
    if('undefined'!==typeof process && process.argv[2]){
        var fs=require('fs')
        ajax=function(method, url, params, headers, cb, userData){
            fs.readFile(url, {encoding:'utf8'}, function(err, txt){
                if (err) return cb(err,2,null,userData)
                cb(null,4,txt,userData)
            })
        }
        loader(process.argv[2],dummyCB)
    }
}('undefined' === typeof window ? module : window, 'undefined' === typeof window ? 'exports' : 'pico')
