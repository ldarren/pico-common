define('pico/obj',function(){
	var objfun = ['object','function']
	var specialFunc = ['constructor']
	var ROOT = '$'
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
	function validateObj(key, spec, val, out){
		if (!(val instanceof Object) || Array.isArray(val)) return key
		var s = spec.spec
		if (s) {
			set(out, key, {})
			var o = get(out, key)
			var keys = Object.keys(s)
			for (var i = 0, ret, k; (k = keys[i]); i++){
				ret = validate(k, s[k], val[k], o)
				if (ret) return [key, ret].join('.')
			}
		}else{
			set(out, key, Object.assign({}, val))
		}
	}
	function validateArr(key, spec, val, out){
		if (spec.sep && val && val.split) val = val.split(spec.sep)
		if (!Array.isArray(val)) return key
		if (notin(val.length, spec.lt, spec.gt)) return key
		var s = spec.spec
		if (s) {
			set(out, key, [])
			var o = get(out, key)
			for (var j = 0, ret, v; (v = val[j]); j++){
				ret = validate(j, s, v, o)
				if (ret) return [key, ret].join('.')
			}
		}else{
			set(out, key, val.slice())
		}
	}
	function validate(k, s, val, out){
		var t = s.type || s
		if (!t) return k
		if (void 0 === val) {
			if (s.required) return k
			val = s.value
			if (void 0 === val) {
				set(out, k, val)
				return
			}
		}
		if (Array.isArray(t)){
			if (!t.includes(val)) return k
			set(out, k, val)
			return
		}
		if (null === val && 'boolean' !== t) {
			if (s.notnull) return k
			set(out, k, val)
			return
		}

		var ret
		switch(t){
		case 'string':
			if (t !== typeof val || notin(val.length, s.lt, s.gt) || !RegExp(s.regex).test(val)) return k
			set(out, k, val)
			break
		case 'number':
			val = parseFloat(val)
			if (!isFinite(val) || notin(val, s.lt, s.gt)) return k
			set(out, k, val)
			break
		case 'boolean':
		case 'bool':
			set(out, k, !!val)
			break
		case 'date':
			val = new Date(val)
			if (!val.getTime() || notin(val.getTime(), s.lt, s.gt)) return k
			set(out, k, val)
			break
		case 'object':
			ret = validateObj(k, s, val, out)
			if (ret) return ret
			break
		case 'array':
			ret = validateArr(k, s, val, out)
			if (ret) return ret
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
		dot: function callee(obj, p, value, idx){
			idx |= 0
			if (!p || idx === p.length) return void 0 === obj ? value : obj
			if (!obj) return value
			var k = p[idx]
			var v
			if (Array.isArray(k)){
				for (var i = 0, ki; (ki = k[i]); i++){
					v = obj[ki]
					if (void 0 !== v) break
				}
			}else{
				v = obj[k]
			}
			return callee(v, p, value, idx + 1)
		},
		validate: function(spec, obj, out){
			return validate(ROOT, spec, obj, out)
		},
	}
})
