define('pico/str', function(){
	var Ceil=Math.ceil, Random=Math.random
	function partial(func){
		return function(d){
			return func(pico, d)
		}
	}
	function compileRestUnit(unit){
		var idx=unit.search('[#:%]')
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
console.log('>>> buildRest', tokens.length, index, url)
		if (tokens.length <= index) return url
		var token = tokens[index++]
		if (!token.charAt) return buildRest(buildRest(url, token, 0, params, '', mandatory), tokens, index, params, prefix, mandatory)

		url += prefix

		switch(token.charAt(0)){
		case '%':
		case ':':
		case '#':
			url += params[token.slice(1)] || token
			break
		default:
			url += token
			break
		}
		return buildRest(url, tokens, index, params, prefix, mandatory)
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
				js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
				(code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
				return add;
			}
			while(match = re.exec(html)) {
				add(html.slice(cursor, match.index))(match[1], true);
				cursor = match.index + match[0].length;
			}
			add(html.substr(cursor, html.length - cursor));
			return partial(new Function('pico', 'd', (code + 'return r.join("");').replace(/[\r\t\n]/g, ' ')))
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
		buildRest:function(api,build,params){
			var codes
			for (var i=0, b; b = build[i]; i++){
				if (api === b[0]){
					codes = b
					break
				}
			}
			if (!codes) return api
			var url = buildRest('', codes[1], 0, params, '/', true)
			for (var i=2, c; c = codes[i]; i++){
				url = buildRest(url, c, 0, params, '/')
			}
			return ~url.search('[#:%]') ? false : url
		}
	}
})
