define('pico/obj',function(exports,require,module,define,inherit,pico){
	var objfun = ['object','function']
	var specialFunc = ['nstructor']
	var ROOT = '$'
	var attrfun = {
		ref: function(p, def){
			return dot(this, p, def)
		},
		invert: function(p, def){
			return dot(this, p, def) ? 0 : 1
		},
		map: function(fromP, fromDef, mapP, toP, toDef, ext){
			if (!ext) return
			var map = ext[mapP]
			if (!map) return
			var to = dot(this, fromP, fromDef)
			var val = map[to]
			if (toP) return dot(val, toP, toDef)
			return val
		},
	}
	function find(obj, p){
		if (!p || !obj) return
		for (var i = 0, v, pi; (pi = p[i]); i++){
			v = obj[pi]
			if (void 0 !== v) return v
		}
	}
	function dot(obj, p, def){
		if (!p || !Array.isArray(p)) return void 0 === obj ? def : obj
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
	function getV(obj, attr, ext){
		if (Array.isArray(attr) && attrfun[attr[0]]) return attrfun[attr[0]].call(obj, ...attr.slice(1), ext)
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
				ret = validate(k, s[k], val[k], o, full, ext)
				if (void 0 !== ret) return [key, ret].join('.')
			}
		}else{
			set(out, key, Object.assign({}, val))
		}
	}
	function validateArr(key, spec, val, out, full, ext){
		if (spec.sep && val && val.split) val = val.split(getV(full, spec.sep, ext))
		if (!Array.isArray(val)) return key
		if (notin(val.length, getV(full, spec.lt, ext), getV(full, spec.gt, ext))) return key
		var s = spec.spec
		if (s) {
			set(out, key, [])
			var o = get(out, key)
			for (var j = 0, ret, v; (v = val[j]); j++){
				ret = validate(j, s, v, o, full, ext)
				if (void 0 !== ret) return [key, ret].join('.')
			}
		}else{
			set(out, key, val.slice())
		}
	}
	function validate(k, s, val, out, full, ext){
		var t = getV(full, s.type, ext) || s
		if (!t) return k
		if (void 0 === val) {
			if (getV(full, s.required, ext)) return k
			val = getV(full, s.value, ext)
		}
		var vt = typeof val
		if (t.includes('bool')) {
			if ('string' === vt) set(out, k, val && 'false' !== val.toLowerCase())
			else set(out, k, !!val)
			return
		}
		if (void 0 === val) {
			set(out, k, val)
			return
		}
		if (Array.isArray(t)){
			if (!t.includes(val)) return k
			set(out, k, val)
			return
		}
		if (null === val) {
			if (getV(full, s.notnull, ext)) return k
			set(out, k, val)
			return
		}

		var ret
		switch(t){
		case 'string':
			if (t !== vt || notin(val.length, getV(full, s.lt, ext), getV(full, s.gt, ext)) || !RegExp(getV(full, s.regex, ext)).test(val)) return k
			set(out, k, val)
			break
		case 'number':
			val = parseFloat(val)
			if (!isFinite(val) || notin(val, getV(full, s.lt, ext), getV(full, s.gt, ext))) return k
			set(out, k, val)
			break
		case 'date':
			val = new Date(val)
			if (!val.getTime() || notin(val.getTime(), getV(full, s.lt, ext), getV(full, s.gt, ext))) return k
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
			return validate(ROOT, spec, obj, out, obj, ext)
		},
	}
})
