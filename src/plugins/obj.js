define('pico/obj',function(){
	var allows = ['object','function']
	var specialFunc = ['constructor']
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
		dotchain: function callee(obj, p, value){
			if (!p || !p.length) return obj
			var o = obj[p.shift()]
			if (o) return callee(o, p)
			return value
		}
	}
})
