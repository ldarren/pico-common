define('pico/str', function(){
    var
    Ceil=Math.ceil, Random=Math.random,
    callerFormat = function(_, stack){
        var r = stack[0]
        return '['+
            (r.getFunctionName() || r.getTypeName()+'.'+r.getMethodName())+
            '@'+(r.isEval()?r.getEvalOrigin():r.getFileName()) + ':' + r.getLineNumber() + ':' + r.getColumnNumber()+']'
    },
	compileRestUnit=function(unit){
		var idx=unit.search('[#:%]')
		switch(idx){
		case -1:
		case 0: return unit
		}
		return [unit.substring(0,idx),unit.substr(idx)]
		
	},
	compileRestPath=function(path,idx,output,cb){
		var nidx=path.indexOf('/',idx)
		if (-1===nidx){
			output.push(compileRestUnit(path.substring(idx)))
			return cb(null, output)
		}
		output.push(compileRestUnit(path.substring(idx,nidx)))
		compileRestPath(path,nidx+1,output,cb)
	},
	compileRestOptional=function(optionals,output,cb){
		if (!optionals.length) return cb(null,output)
		compileRestPath(optionals.shift(),0,[],function(err,code){
			if (err) return cb(err)
			output.push(code)
			compileRestOptional(optionals,output,cb)
		})
	},
	parseRestCode=function(code,unit,units,i,params){
		switch(code[0]){
		default: return code===unit
		case '%': params[code.substr(1)]=parseFloat(unit); break
		case ':': params[code.substr(1)]=unit; break
		case '#': params[code.substr(1)]=units.slice(i).join('/'); break
		}
		return true
	},
	matchRestCode=function(units,codes,params){
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
				js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
					(code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
				return add;
			}
			while(match = re.exec(html)) {
				add(html.slice(cursor, match.index))(match[1], true);
				cursor = match.index + match[0].length;
			}
			add(html.substr(cursor, html.length - cursor));
			return new Function('d', (code + 'return r.join("");').replace(/[\r\t\n]/g, ' '))
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
        log: function callee(){
            var
            orgPrepare = Error.prepareStackTrace,
            orgCount = Error.stackTraceLimit

            Error.prepareStackTrace = callerFormat
            Error.stackTraceLimit = 1

            var err = new Error
            Error.captureStackTrace(err, arguments[0]||callee)
            var params = [(new Date).toISOString(), err.stack]
            console.log.apply(console, params.concat(Array.prototype.slice.call(arguments,1)))

            Error.prepareStackTrace = orgPrepare
            Error.stackTraceLimit = orgCount
        },
        error: function callee(){
            var orgCount = Error.stackTraceLimit

            Error.stackTraceLimit = 4

            var err = new Error
            Error.captureStackTrace(err, arguments[0]||callee)
            var params = [(new Date).toISOString()]
            params = params.concat(Array.prototype.slice.call(arguments,1))
            params.push('\n')
            console.error.apply(console, params.concat(err.stack))

            Error.stackTraceLimit = orgCount
        }
    }
})
