var
dummyCB=function(){},
dummyLoader=function(){arguments[arguments.length-1]()},
dummyPico={run:dummyCB,inherit:dummyCB,reload:dummyCB,parse:dummyCB,define:dummyCB,import:dummyCB,export:dummyCB,env:dummyCB,ajax:dummyCB},//TODO: proxy
modules={},
updates={},
EXT_JS='.js',EXT_JSON='.json',
DEF="pico.define('URL','FUNC')\n",
MOD_PREFIX='"use strict";\n',
MOD_POSTFIX='//# sourceURL=',
PLACE_HOLDER='return arguments.callee.__proto__.apply(this,arguments)',
// call when pico.run done
ajax,ran,importRule,
paths={},
env={},
preprocessors={},
schedule= (function(){
	return ('undefined'===typeof requestAnimationFrame) ? function(cb){ return setTimeout(cb, 100) }: requestAnimationFrame
})(),
funcBody=function(func){
    return func.substring(func.indexOf('{')+1,func.lastIndexOf('}'))
},
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
        ajax('get',path+fname+(getExt(url)?'':EXT_JS),null,null,function(err,state,txt){
            if (err) return cb(err)
            if (4!==state) return
			js(url,txt,cb)
        })
    }
},
placeHolder=function(url){
	return Object.defineProperty(Function(PLACE_HOLDER), 'name', { value: url })
},
inherit=function(child,ancestor){
	var isFunc='function'===typeof child
	switch(typeof ancestor){
	case 'function':
		var fn=isFunc ? child : function(){return ancestor.apply(this,arguments)}
		Object.assign(fn,ancestor)
		var fnp=fn.prototype=Object.assign(Object.create(ancestor.prototype),isFunc?child.prototype:child)
		fnp.constructor=fn
		var cs=child.__super__=ancestor.prototype
		cs.constructor=ancestor
		return fn
	case 'object':
		isFunc?child.prototype=ancestor:child.__proto__=ancestor
	default: return child
	}
},
getMod=function(url,cb){
    var mod=modules[url]
    if(mod){
        if (cb)setTimeout(cb, 0, null, mod) // make sure consistent async behaviour
        return mod
    }
    if (cb) return loader(url,cb)
    return modules[url]=placeHolder(url)
},
// do not run the module but getting the deps and inherit
compile=function(url,txt,deps,base,me){
    me=me||dummyPico
    var
    script=url ? MOD_PREFIX+txt+(env.live ? '' : MOD_POSTFIX+url) : txt,
    frequire=function(k){if(!modules[k])deps.push(k);return modules[k]},
    inherit=function(k){base.unshift(k),frequire(k)}

    try{ var func=Function('exports','require','module','define','inherit','pico',script) }
    catch(e){return console.error(url, e.message)}

    func.call({}, {},frequire,{},dummyCB,inherit,me)
    return func
},
// run the module and register the module output
define=function(url, func, base, mute){
    var
    ext=getExt(url)||EXT_JS,
    pp=preprocessors[ext]

    if (pp) func=pp(url, func)

    switch(ext){
    case EXT_JS:
        var
        module={exports:{}},
        evt={},
        m=func.call(mute?{}:evt,module.exports,getMod,module,define,getMod,pico)||module.exports

        if (base)m=inherit(m,base)

        if(evt.load)evt.load(m)
        if ('function'===typeof evt.update)updates[url]=[evt.update,m]

        if (!url) return m

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
    if(modules[url]) return cb(null, modules[url])
	if(EXT_JS !== (getExt(url)||EXT_JS)) return cb(null, define(url,txt))

    var
    deps=[],
    base=[],
    func=compile(url,txt,deps,base)

    if(url)modules[url]=placeHolder(url)

    linker(deps, function(err){
        if (err) return cb(err)
        
        cb(null,define(url,func,modules[base[0]]))
    })
},
tick=function(timestamp){
	schedule(tick)
	for(var i=0,keys=Object.keys(updates),f; f=updates[keys[i]]; i++){
		f[0](f[1],timestamp)
	}
}

var pico=module[exports]={
    run:function(options,func){
        pico.ajax=ajax=options.ajax||ajax
        paths=options.paths||paths
        env=options.env||env
        preprocessors=options.preprocessors||preprocessors
		importRule=options.importRule

        var pp
        for(var url in modules){
            pp=preprocessors[getExt(url)||EXT_JS]
            if (pp) modules[url]=pp(url, modules[url])
        }

        ;(options.onLoad||dummyLoader)(function(){
            js(options.name||null,funcBody(func.toString()),function(err,main){
                if (err) return console.error(err)

                if (main) main()
                if (ran)ran()

				schedule(tick)
            })
        })
    },
    reload:function(url, script, cb){
        if ('function'===typeof script) cb=script
        cb=cb||dummyCB
        var
		o=modules[url],
        reattach=function(err, m){
            if (err) return cb(err)
            if (!o || 'function'!==typeof o) return cb(null, m)
            o.prototype=m.prototype
            o.__proto__=m
            return cb(null, modules[url]=o)
        }
        delete modules[url]
        if (cb===script) loader(url, reattach)
		else js(url, script, reattach)
    },
    parse:js,
    define:define,
    import:function(url){
		if (Array.isArray(importRule) && -1===importRule.indexOf(url)) return
		return require(url)
	},
    export:getMod,
    env:function(k){ return env[k] }
}
