var
uuid=Date.now(),
dummyCB=function(){},
dummyLoader=function(){arguments[arguments.length-1]()},
dummyPico={run:dummyCB,inherit:dummyCB,reload:dummyCB,parse:dummyCB,define:dummyCB,import:dummyCB,export:dummyCB,env:dummyCB,ajax:dummyCB},//TODO: proxy
modules={},
updates={},
EXT_JS='.js',EXT_JSON='.json',
DEF="pico.define('URL','FUNC')\n",
MOD_PREFIX='"use strict";\n',
MOD_POSTFIX='//# sourceURL=',
PLACE_HOLDER='return arguments.callee.__proto__.apply(this,arguments)', // prevent closure
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
	idx=url.indexOf('/'),
	path=~idx?paths[url.slice(0,idx)]:0,
	fname= path ? url.slice(idx+1) : url

	path=path || paths['~'] || ''

    if (path instanceof Function){
        path(fname, function(err, m){
            if (err) return cb(err)
            modules[url]=m
            cb(null, m)
        })
    }else{
        ajax('get',path+fname+(getExt(url)?'':EXT_JS),null,null,function(err,state,txt){
            if (4!==state) return
            if (err) return cb(err)
			js(url,txt,cb)
        })
    }
},
placeHolder=function(url){
	return Object.defineProperties(Function(PLACE_HOLDER), {
		name:{ value: url },
		i:{ value: uuid }
	})
},
isPlaceHolder=function(obj){
	return 'function' === typeof obj && uuid===obj.i
},
wrap=function(mod, obj){
	if (!mod || mod===obj) return obj
	if (isPlaceHolder(mod)) mod.prototype=obj.prototype
	mod.__proto__=obj
	return mod
},
unwrap=function(obj){
	return isPlaceHolder(obj) ? obj.__proto__ : obj
},
extend=function(classMod,staticMod) {
	if (!classMod) return this
	return inherit(classMod, this, staticMod)
},
inherit=function(mod1,mod2,mod3){
	var
	child=unwrap(mod1),
	ancestor=unwrap(mod2),
	cType=typeof child,
	aType=typeof ancestor

	switch(cType){
	case 'function':
		var
		fn=child,
		props=child.prototype
		break
	case 'object':
		if (cType===aType){
			child.__proto__=ancestor // dun use wrap, inherit not wrap
			return child
		}
		var
		fn= function(){return ancestor.apply(this,arguments)},
		props=child
		break
	default: return child 
	}
	Object.assign(fn,ancestor,unwrap(mod3))
	switch(aType){
	case 'function':
		var fnp=fn.prototype=Object.assign(Object.create(ancestor.prototype),props)
		fnp.constructor=fn
		var cs=child.__super__=ancestor.prototype
		cs.constructor=ancestor
		return fn
	case 'object':
		var fnp=fn.prototype=Object.assign(Object.create(ancestor),props)
		fnp.constructor=fn
		child.__super__=ancestor
		return fn
	default: return child 
	}
},
getMod=function(url,cb){
    var mod=modules[url]
    if(void 0===mod){
		if (cb) return loader(url,cb)
		return modules[url]=placeHolder(url)
    }
	cb && setTimeout(cb, 0, null, mod) // make sure consistent async behaviour
	return mod
},
// do not run the module but getting the deps and inherit
compile=function(url,txt,deps,me){
    me=me||dummyPico
    var
    script=url ? MOD_PREFIX+txt+(env.live ? '' : MOD_POSTFIX+url) : txt,
    frequire=function(k){if(!modules[k])deps.push(k);return modules[k]}

    try{ var func=Function('exports','require','module','define','inherit','pico',script) }
    catch(e){return console.error(url, e.message)}

    func.call({}, {},frequire,{},dummyCB,frequire,me)
    return func
},
// run the module and register the module output
define=function(url, func, mute){
    var
    ext=getExt(url)||EXT_JS,
    pp=preprocessors[ext]

    if (pp) func=pp(url, func)

    switch(ext){
    case EXT_JS:
        var
        module={exports:{}},
        evt={},
		base,
		getBase=function(k){base=getMod(k); return base},
        m=func.call(mute?{}:evt,module.exports,getMod,module,define,getBase,pico)||module.exports

        if (base) m=inherit(m,base)
		if ('function' === typeof m) m.extend=extend
        if (evt.load) evt.load(m)
        if (evt.update) updates[url]=[evt.update,m]

        if (!url) return m

        return modules[url]=wrap(modules[url],m)
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
    func=compile(url,txt,deps)

    if(url)modules[url]=placeHolder(url)

    linker(deps, function(err){
        if (err) return cb(err)
        
        cb(null,define(url,func))
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
            (pp=preprocessors[getExt(url)||EXT_JS]) && (modules[url]=pp(url, modules[url]))
        }

        ;(options.onLoad||dummyLoader)(function(){
            js(options.name||null,funcBody(func.toString()),function(err,main){
                if (err) return console.error(err)

                main && main()
                ran && ran()

				schedule(tick)
            })
        })
    },
    reload:function(url, script, cb){
        if ('function'===typeof script) cb=script
        cb=cb||dummyCB
        var reattach=function(err, m){
            if (err) return cb(err)
			cb(null, modules[url]=wrap(modules[url], m))
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
