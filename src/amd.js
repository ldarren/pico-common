var
	uuid=Date.now(),
	modules={},
	updates={},
	paths={},
	ajaxOpt={baseurl:null},
	env={build:'dev'},
	preprocessors={},
	EXT_JS='.js',EXT_JSON='.json',
	MOD_PREFIX='"use strict";\n',
	MOD_POSTFIX='//# sourceURL=',
	PLACE_HOLDER='return arguments.callee.__proto__.apply(this,arguments)', // prevent closure
	getEnv = function(k){
		return env[k]
	},
	dummyCB=function(){},
	dummyLoader=function(){
		arguments[arguments.length-1]()
	},
	// run the module and register the module output
	define=function(url, func, mute){
		if (modules[url] && !isPlaceHolder(modules[url])) return modules[url]
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
				getBase=function(k){
					base=getMod(k); return base
				},
				m=func.call(mute?{}:evt,module.exports,getMod,module,define,getBase,pico)||module.exports

			if (base) m=inherit(m,base)
			if ('function' === typeof m) m.extend=extend
			if (evt.load) evt.load(m)
			if (evt.update) updates[url]=[evt.update,m]

			if (!url) return m

			return modules[url]=wrap(modules[url],m)
		case EXT_JSON:
			try{
				return modules[url]=JSON.parse(func)
			} catch(e){
				return console.error(url, e.message)
			}
		default: return modules[url]=func
		}
	},
	dummyPico={run:dummyCB,inherit:dummyCB,reload:dummyCB,parse:dummyCB,define:define,import:dummyCB,export:dummyCB,env:getEnv,ajax:dummyCB},//TODO: proxy
	// call when pico.run done
	ran,importRule,
	schedule= (function(){
		return ('undefined'===typeof requestAnimationFrame) ? function(cb){
			return setTimeout(cb, 100)
		}: requestAnimationFrame
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
		modules[url] = modules[url] || pico.import(url) // load node module?
		if (modules[url]) return cb(null, modules[url])

		var
			idx=url.indexOf('/'),
			path=~idx?paths[url.slice(0,idx)]:0,
			fname= path ? url.slice(idx+1) : url

		path=path || paths['~'] || ''

		if (path instanceof Function){
			path(fname, function(err, txt){
				if (err) return cb(err)
				js(url,txt,cb)
			})
		}else{
			pico.ajax('get',path+fname+(getExt(url)?'':EXT_JS),null,ajaxOpt,function(err,state,txt){
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
			aType=typeof ancestor,
			fn, props

		switch(cType){
		case 'function':
			fn=child
			props=child.prototype
			break
		case 'object':
			if (cType===aType){
				child.__proto__=ancestor // dun use wrap, inherit not wrap
				return child
			}
			fn= function(){
				return ancestor.apply(this,arguments)
			}
			props=child
			break
		default: return child
		}
		Object.assign(fn,ancestor,unwrap(mod3))
		switch(aType){
		case 'function':
			fn.prototype=Object.assign(Object.create(ancestor.prototype),props,{constructor: ancestor})
			return fn
		case 'object':
			fn.prototype=Object.assign(Object.create(ancestor),props)
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
			script=url ? MOD_PREFIX+txt+('prod' === env.build ? '' : MOD_POSTFIX+url) : txt,
			frequire=function(k){
				if(!modules[k])deps.push(k);return modules[k]
			}

		try{
			var func=Function('exports','require','module','define','inherit','pico',script)
		} catch(e){
			return console.error(url, e.message)
		}

		func.call({}, {},frequire,{},define,frequire,me)
		return func
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
		var f
		for (var k in updates) {
			(f = updates[k]) && f[0](f[1], timestamp)
		}
		schedule(tick)
	}

var pico=module[exports]={
	run:function(options,func){
		pico.ajax=options.ajax||pico.ajax
		ajaxOpt.baseurl=options.baseurl||ajaxOpt.baseurl
		paths=options.paths||paths
		env=options.env||env
		preprocessors=options.preprocessors||preprocessors
		importRule=options.importRule

		var pp
		for(var url in modules){
			(pp=preprocessors[getExt(url)||EXT_JS]) && (modules[url]=pp(url, modules[url]))
		}

		(options.onLoad||dummyLoader)(function(){
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
		if (Array.isArray(importRule) && importRule.some(function(rx){
			return rx.match(url)
		}))
			return require(url)
	},
	export:getMod,
	env:getEnv
}
