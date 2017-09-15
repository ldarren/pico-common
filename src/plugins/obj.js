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
            if (1===ft || void 0 === from.length){ // function or object (non array)
                for (key in from){
                    value = from[key]
                    if (void 0 === value && tidy) continue
                    to[key] = extend(to[key], value, options)
                }
            }else{
                if (options.mergeArr){
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
		},
		jsonpath: function(json){
			var current = json

			function unwrap(arr, i) { return i < 0 ? (arr.length || 0) + i : i }
			
			function search(key, obj) {
				if (!obj) return
				if (obj.charAt) return
				if (obj[key]) return obj[key]

				var ret = []
				var found
				var ks = Object.keys(obj)
				for(var i=0,k; k=ks[i]; i++){
					found = search(key, obj[k])
					found && Array.isArray(found) ? ret.push.apply(ret,found) : ret.push(found)
				}
				return ret
			}

			function jwalk(){
				if (!arguments.length) return current
				var isArr = Array.isArray(current)

				switch(typeof arguments[0]){
				case 'string':
					var str = arguments[0]

					switch(str){
					default:
						if (isArr){
							if (!current[0][str]) break
							current = current.map( function(o) { return o[str] } )
						}else{
							if (!current[str]) break
							current = current[str]
						}
						break
					case '..':
						current = search(arguments[1], current) || current
						break
					case '*':
						if (isArr) break
						current = Object.keys(current).map( function(k) { return current[k] } )
						break
					}
					break
				case 'object':
					var arr = arguments[0]
					if (!Array.isArray(arr)) break
					current = arr.map( function(i) { return current[unwrap(current, i)] } )
					break
				case 'number':
					var start = unwrap(current, arguments[0])
					var end = unwrap(current, arguments[1]) || current.length-1 || 0
					var interval = arguments[2] || 1
					var next = []
					var a = []
					for (var i=start; i <= end; i+=interval){
						next.push(current[i])
						a.push(i)
					}
					current = next
					break
				case 'function':
					var cb = arguments[0]
					current = isArr ? current.map( cb ) : cb(current)
					isArr && (current = current.filter( function(o) { return void 0 != o } ))
					break
				}
				if (1 === current.length) current = current.pop()
				return jwalk
			}
			return jwalk
		}
    }
})
