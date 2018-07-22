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
		},
		path: function(json){
			var current = json

			function unwrap(arr, i) { return i < 0 ? (arr.length || 0) + i : i }
			
			function search(key, obj) {
				if (!key || !obj || 'object' !== typeof obj) return
				if (obj[key]) return obj[key]

				var ret = []
				var found
				var ks = Object.keys(obj)
				for(var i=0,k; k=ks[i]; i++){
					found = search(key, obj[k])
					found && (Array.isArray(found) ? ret.push.apply(ret,found) : ret.push(found))
				}
				return ret.length ? ret : void 0
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
					break
				}
				Array.isArray(current) && (current = current.filter( function(o) { return void 0 != o } ))
				if (1 === current.length) current = current.pop()
				return jwalk
			}
			return jwalk
        }
    }
})
