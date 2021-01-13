define('pico/obj',function(exports,require){
	var pTime = require('pico/time')
	var pStr = require('pico/str')
	var Rand = Math.random
	var Round = Math.round
	var Ceil = Math.ceil
	var Floor = Math.floor
	var negative = ['false', '0', 'no']
	var objfun = ['object','function']
	var specialFunc = ['nstructor']
	var ROOT = '$'
	var EXT = '_'
	var REL = '.'
	var attrfun = {
		ref: function(host, ext, p, def){
			return attrdot(this, host, ext, p, def)
		},
		spec: function(host, ext, p, def, spec){
			var obj = {obj: attrdot(this, host, ext, p, def) }
			var out = {}
			validate(ROOT, {type: 'object', spec: {obj: spec}}, obj, out, obj, null, ext)
			return out.obj
		},
		bool: function(host, ext, p, def, inv){
			return (attrdot(this, host, ext, p, def) ? 1 : 0) ^ (inv ? 1 : 0)
		},
		eq: function(host, ext, aP, aDef, bP, bDef, inv){
			var a = attrdot(this, host, ext, aP, aDef)
			var b = attrdot(this, host, ext, bP, bDef)
			var i = inv ? 1 : 0
			if (Array.isArray(b)) return (b.includes(a) ? 1 : 0) ^ i
			return (a === b ? 1 : 0) ^ i
		},
		map: function(host, ext, fromP, fromDef, mapP, toP, toDef){
			var map = attrdot(this, host, ext, mapP)
			if (!map) return
			var from = attrdot(this, host, ext, fromP, fromDef)
			var val = map[from]
			if (toP) return attrdot(val, host, val, toP, toDef)
			return val
		},
		now: function(host, ext, p, def){
			var offset = attrdot(this, host, ext, p, def || 0)
			return new Date(Date.now() + offset)
		},
		call: function(host, ext, p, def, ...args){
			var func = attrdot(this, host, ext, p, def)
			if (!func || !func.apply) return
			var params = []
			for (var i = 0, l = args.length; i < l; i += 2){
				params.push(attrdot(this, host, ext, args[i], args[i+1]))
			}
			return func.apply(null, params)
		}
	}
	function attrdot(obj, host, ext, p, def){
		if (!p) return dot(obj, p, def)
		switch(p[0]){
		case ROOT: return dot(obj, p.slice(1), def)
		case EXT: return dot(ext, p.slice(1), def)
		case REL: return dot(host, p.slice(1), def)
		default: return dot(obj, p, def)
		}
	}
	function find(obj, p){
		if (!p || !obj) return
		for (var i = 0, v, pi; (pi = p[i]); i++){
			v = obj[pi]
			if (void 0 !== v) return v
		}
	}
	function dot(obj, p, def){
		if (!p || !Array.isArray(p)) return def
		if (void 0 === obj) return def
		var v = obj
		for (var i = 0, l = p.length, pi; i < l; i++){
			pi = p[i]
			if (Array.isArray(pi)) v = find(v, pi)
			else v = v[pi]
			if (void 0 === v) return def
		}
		return v
	}
	function isObjFun(o){
		if (!o || o instanceof Date) return -1
		return objfun.indexOf(typeof o)
	}
	function notin(v, lt, gt){
		if ((null != lt && v >= lt) || (null != gt && v <= gt)) return 1
		return 0
	}
	function set(obj, key, value){
		if (!obj || void 0 === value) return
		if (ROOT === key) {
			if (Array.isArray(obj)){
				obj.push.apply(obj, value)
			}else if (obj && obj.constructor === Object){
				Object.assign(obj, value)
			}else{
				obj = value
			}
		} else {
			if (Array.isArray(obj)){
				obj.push(value)
			}else{
				obj[key] = value
			}
		}
	}
	function get(obj, key){
		if (ROOT === key) return obj
		if (obj) return obj[key]
	}
	function Runner(obj, host, ext){
		return function(attr, def){
			if (Array.isArray(attr)){
				var name = attr[0]
				if (name && attrfun[name]) attr = attrfun[name].call(obj, host, ext, ...attr.slice(1))
			}
			return void 0 === attr ? def : attr
		}
	}
	function validateObj(key, spec, val, out, full, ext){
		if (!(spec.type === typeof val) || Array.isArray(val)) return key
		var run = Runner(full, val, ext)
		var s = run(spec.spec)
		if (s) {
			set(out, key, {})
			var o = get(out, key)
			var keys = Object.keys(s)
			for (var i = 0, ret, k; (k = keys[i]); i++){
				ret = validate(k, s[k], val[k], o, full, val, ext)
				if (void 0 !== ret) return [key, ret].join('.')
			}
		}else{
			set(out, key, Object.assign({}, val))
		}
	}
	function validateArr(key, spec, val, out, full, ext){
		var run = Runner(full, val, ext)
		if (spec.sep && val && val.split) val = val.split(run(spec.sep))
		if (!Array.isArray(val)) {
			if (!run(spec.force)) return key
			val = [val]
		}
		if (notin(val.length, run(spec.lt), run(spec.gt))) return key
		set(out, key, [])
		var o = get(out, key)
		var specs = run(spec.specs)
		var j = 0
		var s, l, ret, v
		if (specs) {
			for (l = specs.length; (j < l); j++){
				v = val[j]
				s = specs[j]
				ret = validate(j, s, v, o, full, val, ext)
				if (void 0 !== ret) return [key, ret].join('.')
			}
		}
		s = run(spec.spec)
		if (s) {
			for (l = val.length; (j < l); j++){
				v = val[j]
				ret = validate(j, s, v, o, full, val, ext)
				if (void 0 !== ret) return [key, ret].join('.')
			}
		} else if (o) {
			Array.prototype.push.apply(o, val.slice())
		}
	}
	function validate(key, spec, val, out, full, host, ext){
		var run = Runner(full, host, ext)
		var s = run(spec)
		var k = run(s.alias) || key
		var t = run(s.type) || s
		if (!t || !t.includes) return k
		if (null == val){
			if (void 0 === val) {
				if (run(s.required)) return k
			}
			val = run(s.value) || val
		}
		if (Array.isArray(s.map)){
			val = run(['map', null, val].concat(s.map))
		}
		var vt = typeof val
		if (t.includes('bool')) {
			if ('string' === vt) set(out, k, val && !negative.includes(val.toLowerCase()))
			else set(out, k, !!val)
			return
		}
		if (null == val) {
			if (run(s.notnull)) return k
			set(out, k, val)
			return
		}
		if (Array.isArray(t)){
			if (!t.includes(val)) return k
			set(out, k, val)
			return
		}

		var ret
		switch(t){
		case 'string':
			if (t !== vt){
				if (!s.force) return k
				val = JSON.stringify(val)
			}
			if (notin(val.length, run(s.lt), run(s.gt)) || !RegExp(run(s.regex)).test(val)) return k
			set(out, k, val)
			break
		case 'number':
			val = parseFloat(val)
			if (!isFinite(val)) return k
			switch(s.int){
			case 'd':
			case 'f': val = Floor(val); break
			case 'u':
			case 'c': val = Ceil(val); break
			default: val = Round(val); break
			}
			if (notin(val, run(s.lt), run(s.gt))) return k
			set(out, k, val)
			break
		case 'date':
			val = pTime.convert(val, run(s.formats))
			if (!val.getTime() || notin(val.getTime(), run(s.lt), run(s.gt))) return k
			set(out, k, val)
			break
		case 'object':
			ret = validateObj(k, s, val, out, full, ext)
			if (void 0 !== ret) return ret
			break
		case 'array':
			ret = validateArr(k, s, val, out, full, ext)
			if (void 0 !== ret) return ret
			break
		case 'null':
			set(out, k, null == val ? s.value || null : val)
			break
		default: return k
		}
	}

	function rand(min, max){ return min + Round(Rand() * (max - min)) }
	function randIn(min, max){ return rand(min + 1, max - 1) }

	function createObj(s, ext){
		var out = {}
		if (!s) return out
		var keys = Object.keys(s)
		for (var i = 0, k; (k = keys[i]); i++){
			out[k] = create(s[k], ext)
		}
		return out
	}

	function createArr(s, ext){
		var run = Runner(null, null, ext)
		var out = []
		if (!s) return out
		var l = randIn(run(s.gt, 0), run(s.lt, 10))
		for (var i = 0; i < l; i++){
			out.push(create(s.spec, ext))
		}
		return out
	}

	function create(spec, ext){
		var run = Runner(null, null, ext)
		var s = run(spec)
		var t = run(s.type, s)

		if (!run(s.required)) {
			if (1 > rand(0, 100)) return run(s.value)
		}
		if (!run(s.notnull)) {
			if (1 > rand(0, 100)) return null
		}

		switch(t){
		case 'number':
			return randIn(run(s.gt, -10), run(s.lt, 10))
		case 'string':
			return s.regex ? ext.randex(run(s.regex)) : pStr.rand(randIn(run(s.gt, 0), run(s.lt, 10)), run(s.sep))
		case 'boolean':
		case 'bool':
			return 1 === rand(0, 1)
		case 'date':
			return new Date(randIn(run(s.gt, Date.now() - 0x9A7EC800), run(s.lt, Date.now() + 0x9A7EC800)))
		case 'object':
			return createObj(run(s.spec), ext)
		case 'array':
			return createArr(s, ext)
		case 'null':
			return null
		default:
			if (Array.isArray(t)) return t[rand(0, t.length - 1)]
			return void 0
		}
	}

	function ignore(val, tidy){
		if (!tidy) return
		if ((1 & tidy) && void 0 === val) return 1
		if ((2 & tidy) && null === val) return 1
	}

	return  {
		extend: function extend(to, from, options){
			var tf=isObjFun(to)
			var ft=isObjFun(from)
			if (1 === tf) tf = isObjFun(to.__proto__)
			if (1 === ft) ft = isObjFun(from.__proto__)
			options=options||{}
			var tidy = options.tidy
			if (!to || null === from || (-1 === ft && ft === tf)) return ignore(from, tidy) ? to : from
			if (1===ft) {
				if(ft === tf)from.prototype=to
				return from
			}
			var key, value
			if (Array.isArray(from)){
				if (options.mergeArr){
					to = to || []
					// TODO: change unique to Set when it is more common on mobile
					var i, l, unique={}
					for (i=0,l=to.length; i<l; i++){
						if (ignore((value = to[i]), tidy)) continue
						unique[value] = value
					}
					for (i=0,l=from.length; i<l; i++){
						if (ignore((value = from[i]),  tidy)) continue
						unique[value] = value
					}
					to = []
					for (key in unique) to.push(unique[key])
				}else{
					to = from
				}
			}else{
				to = to || {}
				for (key in from){
					value = from[key]
					if (~specialFunc.indexOf(key) || ignore(value, tidy)) continue
					to[key] = extend(to[key], value, options)
				}
			}
			return to
		},
		extends: function(to, list, options){
			var e = this.extend
			for(var i=0,f; (f=list[i]); i++){
				to= e(to, f, options)
			}
			return to
		},
		dot: dot,
		validate: function(spec, obj, out, ext){
			return validate(ROOT, spec, obj, out, obj, null, ext)
		},
		create: create,
		has: function(obj, key){
			return Object.prototype.hasOwnProperty.call(obj, key)
		}
	}
})
