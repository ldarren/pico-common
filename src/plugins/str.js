define('pico/str', function(){
	var Random=Math.random
	var re = /<%([\s\S]*?)%>/g
	var reExp = /(^( )?(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|let|return|super|switch|throw|try|var|while|with|yield|{|}|;))(.*)?/g
	function addCode(code, line, js) {
		line = line.trim()
		if (!line) return code
		js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') : (code += line !== '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '')
		return code
	}
	function partial(func){
		return function(d){
			return func(pico, d)
		}
	}
	function compileRestUnit(unit){
		var idx=unit.search(/[#:%][a-zA-Z]/)
		switch(idx){
		case -1:
		case 0: return unit
		}
		return [unit.substring(0,idx),unit.substr(idx)]
	}
	function compileRestPath(path,idx,output,cb){
		var nidx=path.indexOf('/',idx)
		if (-1===nidx){
			output.push(compileRestUnit(path.substring(idx)))
			return cb(null, output)
		}
		output.push(compileRestUnit(path.substring(idx,nidx)))
		compileRestPath(path,nidx+1,output,cb)
	}
	function compileRestOptional(optionals,output,cb){
		if (!optionals.length) return cb(null,output)
		compileRestPath(optionals.shift(),0,[],function(err,code){
			if (err) return cb(err)
			output.push(code)
			compileRestOptional(optionals,output,cb)
		})
	}
	function parseRestCode(code,unit,units,i,params){
		switch(code[0]){
		default: return code===unit
		case '%': params[code.substr(1)]=parseFloat(unit); break
		case ':': params[code.substr(1)]=unit; break
		case '#': params[code.substr(1)]=units.slice(i).join('/'); break
		}
		return true
	}
	function matchRestCode(units,codes,params){
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
	function buildRest(url, tokens, index, params, prefix, mandatory){
		if (tokens.length <= index) return url
		var token = tokens[index++]
		if (!token.charAt) return buildRest(buildRest(url + prefix, token, 0, params, '', mandatory), tokens, index, params, prefix, mandatory)

		if (token.length > 1){
			switch(token.charAt(0)){
			case '%':
			case ':':
			case '#':
				token = params[token.slice(1)]
				if (!token) return mandatory ? '' : url
				break
			}
		}
		url += prefix + token
		return buildRest(url, tokens, index, params, prefix, mandatory)
	}

	return {
		codec: function(num, str){
			for(var i=0,ret='',c; (c=str.charCodeAt(i)); i++){
				ret += String.fromCharCode(c ^ num)
			}
			return ret
		},
		hash: function(str){
			for (var i=0,h=0,c; (c=str.charCodeAt(i)); i++) {
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
		// caveat: semicolon is required
		template:function(html){
			var code = 'var r=[];\n'
			var cursor = 0
			var match
			while((match = re.exec(html))) {
				code = addCode(code, html.slice(cursor, match.index))
				code = addCode(code, match[1], true)
				cursor = match.index + match[0].length
			}
			code = addCode(code, html.substr(cursor, html.length - cursor))
			return partial(new Function('pico', 'd', (code + 'return r.join("");').replace(/[\r\t\n]/g, ' ')))
		},
		// precedence | / # : %
		compileRest:function(rest, output){
			output=output||[]
			if (-1 === rest.search(/[|#:%][a-zA-Z]/)) return output
			compileRestOptional(rest.split('|'),[rest],function(err,codes){
				if (err) throw err
				output.push(codes)
			})
			return output
		},
		execRest:function(api,build,params){
			var units=api.split('/')
			for(var i=0,route,j,opt; (route=build[i]); i++){
				if (matchRestCode(units, route[1], params)){
					for(j=2; (opt=route[j]); j++){
						if (!matchRestCode(units, opt, params)) break
					}
					return route[0]
				}
			}
			return null
		},
		buildRest:function(api,build,params,relativePath){
			var codes
			for (var i=0, b; (b = build[i]); i++){
				if (api === b[0]){
					codes = b
					break
				}
			}
			if (!codes) return api
			var url = buildRest('', codes[1], 0, params || {}, '/', true)
			if (!url) return false
			var c
			for (i=2; (c = codes[i]); i++){
				url = buildRest(url, c, 0, params, '/')
			}
			// remove the first slash
			if (relativePath || 1 === url.indexOf('http')) url = url.slice(1)
			return ~url.search(/[#%][a-zA-Z]/) ? false : url
		}
	}
})
