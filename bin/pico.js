(function(module,exports,require){var
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
    if(undefined!==mod){
        if (cb)setTimeout(cb, 0, null, mod) // make sure consistent async behaviour
        return mod
    }
    if (cb) return loader(url,cb)
    return modules[url]=placeHolder(url)
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

define('pico/json',function(exports,require,module,define,inherit,pico){
    return {
        parse:function(pjson,deep){
            return JSON.parse(pjson[0], function(k, v){
                switch(k[0]){
                case '$': if(deep)return JSON.parse(pjson[v])
                case '_': return pjson[v]
                default: return v
                }
            })
        },
        stringify:function(json, deep){
            var pjson=[]
            pjson.unshift(JSON.stringify(json, function(k, v){
                switch(k[0]){
                case '$': if(deep)return pjson.push(JSON.stringify(v))
                case '_': return pjson.push(v)
                default: return v
                }
            }))
            return pjson
        }
    }
})
define('pico/obj',function(){
    var allows = ['object','function']
    return  {
        extend: function extend(to, from, options){
            var tf=allows.indexOf(typeof to)
            if (-1 === tf) return from
            var ft=allows.indexOf(typeof from)
            if (-1 === ft)return to
            if (1===ft && ft===tf){
				from.prototype=to
				return from
			}
            options=options||{}
            var tidy = options.tidy, key, value
            if (1===ft || undefined === from.length){ // function or object (non array)
                for (key in from){
                    value = from[key]
                    if (undefined === value && tidy) continue
                    to[key] = extend(to[key], value, options)
                }
            }else{
                if (options.mergeArr){
                    // TODO: change unique to Set when is more commonly support on mobile
                    var i, l, unique={}
                    for (i=0,l=to.length; i<l; i++){
                        if (undefined === (value = to[i]) && tidy) continue
                        unique[value] = value
                    }
                    for (i=0,l=from.length; i<l; i++){
                        if (undefined === (value = from[i]) && tidy) continue
                        unique[value] = value
                    }
                    to = []
                    for (key in unique) to.push(unique[key]);
                }else{
                    to = from
                }
            }
            return to
        },
        extends: function(to, list, options){
            var e = this.extend
            for(var i=0,f; f=list[i]; i++){
                to= e(to, f, options)
            }
            return to
        },
        parseInts: function(arr, radix){
            for(var i=0,l=arr.length; i<l; i++){
                arr[i] = parseInt(arr[i], radix)
            }
            return arr
        },
        // pluck([{k:1},{k:2}], 'k') = [1,2]
        pluck: function(objs, key){
            var arr = []
            if (objs.length){
                var map = {}, obj, id, i, l, k
                for(i=0,l=objs.length; i<l; i++){
                    obj = objs[i]
                    if (!obj) continue
                    id = obj[key]
                    if (undefined === id) continue
                    map[id] = id
                }
                for(k in map){
                    arr.push(map[k])
                }
            }
            return arr
        },
		dotchain: function callee(obj, p, value){
			if (!p || !p.length) return obj
			var o = obj[p.shift()]
			if (o) return callee(o, p)
			return value
		}
    }
})
define('pico/str', function(){
    var
    Ceil=Math.ceil, Random=Math.random,
    callerFormat = function(_, stack){
        var r = stack[0]
        return '['+
            (r.getFunctionName() || r.getTypeName()+'.'+r.getMethodName())+
            '@'+(r.isEval()?r.getEvalOrigin():r.getFileName()) + ':' + r.getLineNumber() + ':' + r.getColumnNumber()+']'
    },
	compileRestUnit=function(unit){
		var idx=unit.search('[#:%]')
		switch(idx){
		case -1:
		case 0: return unit
		}
		return [unit.substring(0,idx),unit.substr(idx)]
		
	},
	compileRestPath=function(path,idx,output,cb){
		var nidx=path.indexOf('/',idx)
		if (-1===nidx){
			output.push(compileRestUnit(path.substring(idx)))
			return cb(null, output)
		}
		output.push(compileRestUnit(path.substring(idx,nidx)))
		compileRestPath(path,nidx+1,output,cb)
	},
	compileRestOptional=function(optionals,output,cb){
		if (!optionals.length) return cb(null,output)
		compileRestPath(optionals.shift(),0,[],function(err,code){
			if (err) return cb(err)
			output.push(code)
			compileRestOptional(optionals,output,cb)
		})
	},
	parseRestCode=function(code,unit,units,i,params){
		switch(code[0]){
		default: return code===unit
		case '%': params[code.substr(1)]=parseFloat(unit); break
		case ':': params[code.substr(1)]=unit; break
		case '#': params[code.substr(1)]=units.slice(i).join('/'); break
		}
		return true
	},
	matchRestCode=function(units,codes,params){
		if (units.length < codes.length) return false
		for(var i=0,u,c,l=codes.length; i<l; i++){
			c=codes[i]
			u=units[i]
			if (Array.isArray(c)){
				if (0!==u.indexOf(c[0])) return false
				if (!parseRestCode(c[1],u.substr(c[0].length),units,i,params)) return false
			}else{
				if (!parseRestCode(c,u,units,i,params)) return false
			}
		}
		units.splice(0,l)
		return true
	}

    return {
        codec: function(num, str){
            for(var i=0,ret='',c; c=str.charCodeAt(i); i++){
                ret += String.fromCharCode(c ^ num)
            }
            return ret
        },
        hash: function(str){
            for (var i=0,h=0,c; c=str.charCodeAt(i); i++) {
				// same as h = ((h<<5)-h)+c;  h = h | 0 or h = h & h <= Convert to 32bit integer
				h = (h<<3)-h+c | 0
            }
            return h
        },
        rand: function(){
            return Random().toString(36).substr(2)
        },
        pad:function(val,n,str){
			return this.tab(val,n,str)+val
        },
		tab:function(val,n,str){
			var c=n-String(val).length+1
            return Array(c>0?c:0).join(str||'0')
		},
		// src:https://raw.githubusercontent.com/krasimir/absurd/master/lib/processors/html/helpers/TemplateEngine.js
		template:function(html){
			var re = /<%(.+?)%>/g, 
				reExp = /(^( )?(var|if|for|else|switch|case|break|{|}|;))(.*)?/g, 
				code = 'var r=[];\n', 
				cursor = 0, 
				match;
			var add = function(line, js) {
				js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
					(code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
				return add;
			}
			while(match = re.exec(html)) {
				add(html.slice(cursor, match.index))(match[1], true);
				cursor = match.index + match[0].length;
			}
			add(html.substr(cursor, html.length - cursor));
			return new Function('d', (code + 'return r.join("");').replace(/[\r\t\n]/g, ' '))
		},
		// precedence | / # : %
		compileRest:function(rest, output){
			output=output||[]
			if (-1 === rest.search('[|#:%]')) return output
			compileRestOptional(rest.split('|'),[rest],function(err,codes){
				if (err) throw err
				output.push(codes)
			})
			return output
		},
		execRest:function(api,build,params){
			var units=api.split('/')
			for(var i=0,route,j,opt; route=build[i]; i++){
				if (matchRestCode(units, route[1], params)){
					for(j=2; opt=route[j]; j++){
						if (!matchRestCode(units, opt, params)) break
					}
					return route[0]
				}
			}
			return null
		},
        log: function callee(){
            var
            orgPrepare = Error.prepareStackTrace,
            orgCount = Error.stackTraceLimit

            Error.prepareStackTrace = callerFormat
            Error.stackTraceLimit = 1

            var err = new Error
            Error.captureStackTrace(err, arguments[0]||callee)
            var params = [(new Date).toISOString(), err.stack]
            console.log.apply(console, params.concat(Array.prototype.slice.call(arguments,1)))

            Error.prepareStackTrace = orgPrepare
            Error.stackTraceLimit = orgCount
        },
        error: function callee(){
            var orgCount = Error.stackTraceLimit

            Error.stackTraceLimit = 4

            var err = new Error
            Error.captureStackTrace(err, arguments[0]||callee)
            var params = [(new Date).toISOString()]
            params = params.concat(Array.prototype.slice.call(arguments,1))
            params.push('\n')
            console.error.apply(console, params.concat(err.stack))

            Error.stackTraceLimit = orgCount
        }
    }
})
define('pico/time',function(){
    var
    Max=Math.max,
    Min=Math.min,
    Floor=Math.floor,
    Ceil=Math.ceil,
    SEC = 1000,
    MIN = 60*SEC,
    HR = 60*MIN,
    DAY= 24*HR,
	daynum=function(end,start){
		return (end-start) / DAY
	},
	weeknum=function(date, us, yearoff){
	    var
		offset=us?1:0,
		jan1= new Date(date.getFullYear()+(yearoff||0), 0, 1),
		day1=((7-jan1.getDay())%7 + offset),
		days=daynum(date, jan1)

		if (days > day1) return Ceil((days - day1)/7)
		return weeknum(date, us, -1)
	},
    parseQuark=function(quark, min, max){
        var
        q=quark.split('/'),
        q1=q[0]

        if ('*'===q1){
            q[0]=min
        }else{
            q1=q[0]=parseInt(q1)
            if (q1<min || q1>max) return // error
        }

        if (1===q.length) q.push(0) // interval=1
        else q[1]=parseInt(q[1])

        return q
    },
    parseAtom=function(atom, min, max){
        if ('*'===atom) return 0
        var 
        ret=[]
        list=atom.split(',')
        for(var i=0,l,range,j,r,r1,r2,rm,ri; l=list[i]; i++){
            r=l.split('-')
            if (!r.length) return null// error
            r1=parseQuark(r[0],min,max)
            if (1===r.length){
                ri=r1[1]
                if (ri) for(j=r1[0]; j<=max; j+=ri) ret.push(j);
                else ret.push(r1[0])
                continue
            }
            r2=parseQuark(r[1],min,max)
            j=r1[0]
            rm=r2[0]
            ri=r2[1]||1
            if (j>rm){
                // wrap around
                for(rm=max; j<=rm; j+=ri) ret.push(j);
                for(j=min,rm=r2[0]; j<=rm; j+=ri) ret.push(j);
            }else{
                for(; j<=rm; j+=ri) ret.push(j);
            }
        }
        ret.sort(function(a,b){return a-b})
        return ret
    },
    nearest=function(now, list, max){
        if (!list) return now
        if (Max.apply(Math, list.concat(now))===now) return now+(max-now)+Min.apply(Math, list)
        for(var i=0,l=list.length; i<l; i++){
            if (list[i]>=now) return list[i]
        }
        console.error('not suppose to be here',now, list, max)
    },
    closest=function(now, count, mins, hrs, doms, mons, dows, yrs, cb){
        if (count++ > 1) return cb(0)

        var
        min=nearest(now.getMinutes(), mins, 60),
        hr=nearest(now.getHours()+Floor(min/60), hrs, 24),
        dom=now.getDate(),
        mon=now.getMonth(),
        yr=now.getFullYear(),
        days=(new Date(yr, mon, 0)).getDate()

        if (dows){
            // if dow set ignore dom fields
            var
            day=now.getDay()+Floor(hr/24),
            dow=nearest(day, dows, 7)
            dom+=(dow-day)
        }else{
            dom=nearest(dom+Floor(hr/24), doms, days)
        }
        mon=nearest(mon+1+Floor(dom/days), mons, 12)

        if (now.getMonth()+1 !== mon) return closest(new Date(yr, mon-1), count, mins, hrs, doms, mons, dows, yrs, cb)

        yr=nearest(yr+Floor((mon-1)/12), yrs, 0)
        if (now.getFullYear() !== yr) return closest(new Date(yr, mon-1), count, mins, hrs, doms, mons, dows, yrs, cb)

        var then=(new Date(yr, (mon-1)%12)).getTime()
        then+=(dom%days-1)*DAY // beginning of day
        then+=(hr%24)*HR
        then+=(min%60)*MIN

        return cb(then)
    }

    return {
        // fmt: min hr dom M dow yr
        parse: function(fmt){
            var atoms=fmt.split(' ')
            if (atoms.length < 6) return 0
            var mins=parseAtom(atoms[0], 0, 59)
            if (null == mins) return 0
            var hrs=parseAtom(atoms[1], 0, 23)
            if (null == hrs) return 0
            var doms=parseAtom(atoms[2], 1, 31)
            if (null == doms) return 0
            var mons=parseAtom(atoms[3], 1, 12)
            if (null == mons) return 0
            var dows=parseAtom(atoms[4], 0, 6)
            if (null == dows) return 0
            var yrs=parseAtom(atoms[5], 1975, 2075)
            if (null == yrs) return 0

            return [mins, hrs, doms, mons, dows, yrs]
        },
        nearest:function(mins, hrs, doms, mons, dows, yrs){
            var
            now=new Date,
            yr=nearest(now.getFullYear(), yrs, 0),
            mon=nearest(now.getMonth()+1, mons, 12)-1

            if (now.getFullYear()!==yr || now.getMonth()!==mon){
                now=new Date(yr, mon)
            }else{
                var time=now.getTime()
                now=new Date(time+MIN)// round up sec n msec
            }

            return closest(now, 0, mins, hrs, doms, mons, dows, yrs, function(then){ return then })
        },
		daynum:daynum,
		weeknum:weeknum,
		// node.js should compile with
		// ./configure --with-intl=full-icu --download=all
		// ./configure --with-intl=small-icu --download=all
		day: function(date, locale){
			var
			now=new Date,
			mid=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12,0,0),
			diff=mid-date,
			DAY15=DAY*1.5
			if ((diff >= 0 && diff <= DAY15) || (diff <= 0 && diff > -DAY15)){
				if (now.getDate()===date.getDate())return'Today'
				if (now > date) return 'Yesterday'
				return 'Tomorrow'
			}

			locale=locale||'en-US'
			if (now.getFullYear()===date.getFullYear() && weeknum(now)===weeknum(date)) return date.toLocaleDateString(locale, {weekday:'long'})
			return date.toLocaleDateString(locale,{weekday: 'short', month: 'short', day: 'numeric'})
		}
    }
})
define('pico/web',function(exports,require,module,define,inherit,pico){
    var
    PJSON=require('pico/json'),
    Abs = Math.abs,Floor=Math.floor,Random=Math.random,
    API_ACK = 'ack',
    PT_HEAD = 1,
    PT_BODY = 2,
    isOnline = true,
    stdCB = function(err){if (err) console.error(err)},
    appendFD = function(fd, name, value){ fd.append(name, value) },
    appendObj = function(obj, name, value){ obj[name] = value },
    timeSync = function(net, cb){
        cb = cb || stdCB
        ajax('get', net.url, null, null, function(err, readyState, response){
            if (4 !== readyState) return
            if (err) return cb(err)
            var st = parseInt(response)
            if (isNaN(st)) return cb('invalid timesync response')
            net.serverTime = st
            net.serverTimeAtClient = Date.now()
            cb()
        })
    },
    onResponse = function(err, readyState, response, net){
		if (err && 4===readyState) timeSync(net) // sync time, in case it was due to time error

        // schedule next update
        switch(readyState){
        case 2: // send() and header received
            net.head = null
            net.currPT = PT_HEAD
			net.resEndPos = 0
            break
        case 3: break // body loading 
        case 4: // body received
            break
        }

		if (!response) return

        var
        startPos = net.resEndPos, endPos = -1,
        sep = net.delimiter,
        sepLen = sep.length,
        body = net.body,
        head

        try{
            while(true){
                endPos = response.indexOf(sep, startPos)
                if (-1 === endPos) break

                switch(net.currPT){
                case PT_HEAD:
                    net.head = JSON.parse(response.substring(startPos, endPos))
                    body.length = 0
                    net.currPT = PT_BODY
                    break
                case PT_BODY:
                    body.push(response.substring(startPos, endPos))
                    break
                }
                head = net.head
                if (head && head.len === body.length){
                    net.currPT = PT_HEAD

                    if (head.resId){
                        net.request(API_ACK, {resId:head.resId})
                    }
                    if (!head.reqId) {
                        console.error('incomplete response header: '+JSON.stringify(head))
                        return 
                    }
                    if (net.cullAge && net.cullAge < Abs(net.getServerTime()-head.date)) {
                        console.error('invalid server time: '+JSON.stringify(head)+' '+Abs(net.getServerTime()-head.date))
                        return 
                    }
                    if (net.secretKey && body.length){
                        var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.MD5, net.secretKey+head.date)

                        //key: CryptoJS.HmacMD5(JSON.stringify(data), this.secretKey+t).toString(CryptoJS.enc.Base64),
                        for(var i=0,l=body.length; i<l; i++){
                            hmac.update(body[i])
                        }

                        if (head.key !== hmac.finalize().toString(CryptoJS.enc.Base64)){
                            console.error('invalid server key: '+JSON.stringify(head))
                            return 
                        }
                    }
                    if (head.len) head.data = PJSON.parse(body,true) 
                    net.inbox.push(head)
                    net.head = null
                }

                startPos = endPos + sepLen
            }
        }catch(exp){
            // something is wrong
            console.error(exp)
        }
		//readyState 2 may not arrived
        net.resEndPos = 4===readyState?0:startPos
    },
    formation = function(dst, form, cred, prefix_form, prefix_cred){
        prefix_form = prefix_form || ''
        prefix_cred = prefix_cred || ''

        var
        append = dst instanceof FormData ? appendFD : appendObj,
        uri = form.baseURI,
        fieldType, f, fl

        for (var i=0,elements = form.elements,field; field = elements[i]; i++) {
            if (!field.hasAttribute('name')) continue
            fieldType = field.hasAttribute('type') ? field.getAttribute('type').toUpperCase() : 'TEXT'
            if (fieldType === 'FILE') {
                for (f = 0, fl=field.files.length; f<fl; append(dst, prefix_form+field.name, field.files[f++]));
            } else if ((fieldType !== 'RADIO' && fieldType !== 'CHECKBOX') || field.checked) {
                append(dst, prefix_form+field.name, field.value)
            }//TODO: implement checkbox and radio
        }
        if (cred) for (var k in cred) { append(dst, prefix_cred+k, cred[k]) }

        uri = uri.substring(0, uri.lastIndexOf('/')+1)

        return form.action.substr(uri.length)
    },
    netConfig = function(net, cfg){
        net.url = cfg.url || net.url
        net.secretKey = cfg.secretKey || net.secretKey
        net.cullAge = cfg.cullAge || net.cullAge || 0
        net.delimiter = cfg.delimiter ? JSON.stringify(cfg.delimiter) : net.delimiter || JSON.stringify(['&'])
    },
    netReset = function(net){
        net.resEndPos = net.outbox.length = net.acks.length = 0
        net.currPT = PT_HEAD
    }


    function Net(cfg){
        if (!cfg.url) return console.error('url is not set')
        netConfig(this, cfg)
        this.reqId = 1 + Floor(Random() * 1000)
        this.inbox = []
        this.outbox = []
        this.uploads = []
        this.callbacks = {}
        this.acks = []
        this.reqs = []
        this.resEndPos = 0
        this.head = null,
        this.body = [],
        this.currPT = PT_HEAD,
        this.serverTime = 0
        this.serverTimeAtClient = 0
    }

    Net.prototype = {
		beat: function(){
			if (this.inbox.length){
				var
				inbox = this.inbox,
				callbacks = this.callbacks,
				reqId, cb

				for(var res; res=inbox.pop();){
					reqId = res.reqId
					cb = callbacks[reqId]
					if (cb){
						delete callbacks[reqId]
						cb(res.error, res.data)
					}
				}
			}

			// post update tasks, buffer data in memory network if offline
			if (isOnline && (this.uploads.length || this.outbox.length || this.acks.length)){
				var uploads=this.uploads,outbox=this.outbox,acks=this.acks

				if (uploads.length){
					ajax('post', this.url, uploads.shift(), null, onResponse, this)
				}else{
					var reqs = this.reqs = acks.concat(outbox)
					acks.length = outbox.length = 0

					ajax('post', this.url, reqs.join(this.delimiter)+this.delimiter, null, onResponse, this)
				}
			}
		},
        reconnect: function(cfg, cb){
            netConfig(this, cfg)
            netReset(this)
            timeSync(this, function(err){
                cb(err, this)
            })
        },
        submit: function(form, cred, cb){
            if ('undefined'===typeof window || !form || !(form instanceof HTMLFormElement)) return console.error('No HTMLFormElement submitted')

            var reqId = 0

            if (cb){
                reqId = this.reqId++
                this.callbacks[reqId] = cb
            }

            var fd = new FormData()

            fd.append('api', formation(fd, form, cred, 'data/', 'cred/'))
            fd.append('reqId', reqId)

            this.uploads.push(fd)
        },
        // data: optional, usually api specific data
        // cred: optional, usually common data for every api such as credential or session info
        // cb: optional, without cb, reqId will be 0
        request: function(api, data, cred, cb){
            switch(arguments.length){
            case 2:
                if (data instanceof Function){
                    cb = data
                    data = cred = undefined
                }
                break
            case 3:
                if (cred instanceof Function){
                    cb = cred 
                    cred = undefined
                }
                break
            case 4: break
            default: return console.error('wrong request params!')
            }
            if ('undefined'!==typeof window && data instanceof HTMLFormElement){
                var obj = {}
                api = formation(obj, data)
                data = obj
            }
            if (!api) return console.error('Missing api,  data['+JSON.stringify(data)+']')

            var queue = this.acks
            if (api !== API_ACK){
                queue = this.outbox
                if (queue.length){
                    var lastReq = queue.shift()
                    if (-1 === lastReq.indexOf(api)){
                        queue.unshift(lastReq)
                    }
                }
            }

            var reqId = 0
            if (cb){
                reqId = this.reqId++
                this.callbacks[reqId] = cb
            }

            var dataList=data?PJSON.stringify(data,true):[]

			dataList.unshift(JSON.stringify(cred))

            if (dataList.length && this.secretKey){
                var
                t = this.getServerTime(),
                hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.MD5, this.secretKey+t) // result of utf8 is diff from node.crypto

                //key: CryptoJS.HmacMD5(JSON.stringify(data), this.secretKey+t).toString(CryptoJS.enc.Base64),
                for(var i=0,l=dataList.length; i<l; i++){
                    hmac.update(dataList[i])
                }

                dataList.unshift(JSON.stringify({
                    api: api,
                    reqId: reqId,
                    len:dataList.length,
                    date: t,
                    key: hmac.finalize().toString(CryptoJS.enc.Base64)
                }))
            }else{
                dataList.unshift(JSON.stringify({
                    api: api,
                    reqId: reqId,
                    len:dataList.length
                }))
            }
            queue.push(dataList.join(this.delimiter))
        },
        getServerTime: function(){
            return this.serverTime + (Date.now() - this.serverTimeAtClient)
        }
    }

    return {
        create: function(cfg, cb){
            var net= new Net(cfg)
            timeSync(net, function(err){
                cb(err, net)
            })
        },
        ajax:ajax,
        //window.addEventListener('online', online)
        online: function(){isOnline=true},
        //window.addEventListener('offline', offlie)
        offline: function(){isOnline=false}
    }
})
}).apply(null, 'undefined' === typeof window ? [module, 'exports', require] : [window, 'pico'])