define('pico/obj',function(exports,require){
	var pTime = require('pico/time')
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
	function getV(obj, host, attr, ext){
		if (Array.isArray(attr) && attrfun[attr[0]]) return attrfun[attr[0]].call(obj, host, ext, ...attr.slice(1))
		return attr
	}
	function validateObj(key, spec, val, out, full, ext){
		if (!(val instanceof Object) || Array.isArray(val)) return key
		var s = spec.spec
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
		if (spec.sep && val && val.split) val = val.split(getV(full, val, spec.sep, ext))
		if (!Array.isArray(val)) {
			if (!spec.force) return key
			val = [val]
		}
		if (notin(val.length, getV(full, val, spec.lt, ext), getV(full, val, spec.gt, ext))) return key
		var s = spec.spec
		if (s) {
			set(out, key, [])
			var o = get(out, key)
			for (var j = 0, l = val.length, ret, v; (j < l); j++){
				v = val[j]
				ret = validate(j, s, v, o, full, val, ext)
				if (void 0 !== ret) return [key, ret].join('.')
			}
		}else{
			set(out, key, val.slice())
		}
	}
	function validate(k, s, val, out, full, host, ext){
		var t = getV(full, host, s.type, ext) || s
		if (!t || !t.includes) return k
		if (void 0 === val) {
			if (getV(full, host, s.required, ext)) return k
			val = getV(full, host, s.value, ext)
		}
		if (Array.isArray(t)){
			if (!t.includes(val)) return k
			set(out, k, val)
			return
		}
		var vt = typeof val
		if (t.includes('bool')) {
			if ('string' === vt) set(out, k, val && !negative.includes(val.toLowerCase()))
			else set(out, k, !!val)
			return
		}
		if (null == val) {
			if (getV(full, host, s.notnull, ext)) return k
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
			if (notin(val.length, getV(full, host, s.lt, ext), getV(full, host, s.gt, ext)) || !RegExp(getV(full, host, s.regex, ext)).test(val)) return k
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
			if (notin(val, getV(full, host, s.lt, ext), getV(full, host, s.gt, ext))) return k
			set(out, k, val)
			break
		case 'date':
			val = pTime.convert(val, getV(full, host, s.formats, ext))
			if (!val.getTime() || notin(val.getTime(), getV(full, host, s.lt, ext), getV(full, host, s.gt, ext))) return k
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

	return  {
		extend: function extend(to, from, options){
			var tf=isObjFun(to)
			var ft=isObjFun(from)
			if (1 === tf) tf = isObjFun(to.__proto__)
			if (1 === ft) ft = isObjFun(from.__proto__)
			if (!to || null === from || (-1 === ft && ft === tf)) return (void 0 === from && tidy) ? to : from
			if (1===ft) {
				if(ft === tf)from.prototype=to
				return from
			}
			options=options||{}
			var tidy = options.tidy, key, value
			if (Array.isArray(from)){
				if (options.mergeArr){
					to = to || []
					// TODO: change unique to Set when it is more common on mobile
					var i, l, unique={}
					for (i=0,l=to.length; i<l; i++){
						if (void 0 === (value = to[i]) && tidy) continue
						unique[value] = value
					}
					for (i=0,l=from.length; i<l; i++){
						if (void 0 === (value = from[i]) && tidy) continue
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
					if (~specialFunc.indexOf(key) || (void 0 === value && tidy)) continue
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
	}
})
