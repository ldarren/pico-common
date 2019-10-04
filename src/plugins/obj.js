define('pico/obj',function(){
	var allows = ['object','function']
	var specialFunc = ['constructor']
	var BOOLS = [true, false, 1, 0, null]
	var ROOT = '$'
	function notin(v, lt, gt){
		if ((null != lt && v >= lt) || (null != gt && v <= gt)) return 1
		return 0
	}
	function set(obj, key, value){
		if (obj && void 0 !== value && ROOT !== key) {
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
		if (!(val instanceof Object) || !Array.isArray(val)) return key
		if (notin(val.length, spec.lt, spec.gt)) return key
		var s = spec.spec
		if (s) {
			set(out, key, [])
			var o = get(out, key)
			for (var j = 0, ret, v; (v = val[j]); j++){
				ret = validateObj(j, s, v, o)
				if (ret) return [key, ret].join('.')
			}
		}else{
			set(out, key, val.slice())
		}
	}
	function validate(k, s, val, out){
		if (void 0 === val) {
			if (s.required) return k
			set(out, k, s.value)
			return
		}

		var t = s.type || s
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
			if (!BOOLS.includes(val)) return k
			set(out, k, !!val)
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
			if (null !== val) return k
			set(out, k, null)
			break
		default: return k
		}
	}
	/*
	function validates(spec, arr, out){
		if (!Array.isArray(arr)) return validate(spec, arr, out)
		if (spec) {
			for (var j = 0, ret, v; (v = arr[j]); j++){
				out && out.push({})
				ret = validate(spec, v, out && out[j])
				if (ret) return [j, ret].join('.')
			}
		}else if (out){
			Array.prototype.push.apply(out, arr)
		}
	}
	function validate(spec, obj, out){
		var keys = Object.keys(spec)
		var s, t, val, ret
		for (var i = 0, k; (k = keys[i]); i++){
			s = spec[k]
			val = obj[k]

			if (void 0 === val) {
				if (s.required) return k
				if (out && void 0 !== s.value) out[k] = s.value
				continue
			}

			t = s.type || s
			switch(t){
			case 'string':
				if (t !== typeof val || notin(val.length, s.lt, s.gt) || !RegExp(s.regex).test(val)) return k
				out && (out[k] = val)
				break
			case 'number':
				val = parseFloat(val)
				if (!isFinite(val) || notin(val, s.lt, s.gt)) return k
				out && (out[k] = val)
				break
			case 'boolean':
				if (!BOOLS.includes(val)) return k
				out && (out[k] = !!val)
				break
			case 'object':
				if (!(val instanceof Object) || Array.isArray(val)) return k
				if ((s.lt || s.gt) && notin(Object.keys(val), s.lt, s.gt)) return k
				out && (out[k] = {})
				if (s.spec) {
					ret = validate(s.spec, val, out && out[k])
					if (ret) return [k, ret].join('.')
				}else if (out){
					Object.assign(out[k], val)
				}
				break
			case 'array':
				if (!(val instanceof Object) || !Array.isArray(val)) return k
				if (notin(val.length, s.lt, s.gt)) return k
				out && (out[k] = [])
				ret = validates(s.spec, val, out && out[k])
				if (ret) return [k, ret].join('.')
				break
			case 'null':
				if (null !== val) return k
				out && (out[k] = null)
				break
			default: return k
			}
		}
	}
	*/

	return  {
		extend: function extend(to, from, options){
			var tf=allows.indexOf(typeof to)
			var ft=allows.indexOf(typeof from)
			if (1 === tf) tf = allows.indexOf(typeof to.__proto__)
			if (1 === ft) ft = allows.indexOf(typeof from.__proto__)
			if (!to || null === from || (-1 === ft && ft === tf)) return void 0 === from ? to : from
			if (1===ft) {
				if(ft === tf)from.prototype=to
				return from
			}
			options=options||{}
			var tidy = options.tidy, key, value
			if (Array.isArray(from)){
				if (options.mergeArr){
					to = to || []
					// TODO: change unique to Set when is more commonly support on mobile
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
					if (void 0 === id) continue
					map[id] = id
				}
				for(k in map){
					arr.push(map[k])
				}
			}
			return arr
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
