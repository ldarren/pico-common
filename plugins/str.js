define('pico/str', function(){
    var
    Ceil=Math.ceil, Random=Math.random,
    callerFormat = function(_, stack){
        var r = stack[0]
        return '['+
            (r.getFunctionName() || r.getTypeName()+'.'+r.getMethodName())+
            '@'+r.getFileName() + ':' + r.getLineNumber() + ':' + r.getColumnNumber()+']'
    },
	compileRestUnit=function(unit){
		var idx=unit.search('[*$%]')
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
	parseRestCode=function(code,unit,units,params){
		switch(code[0]){
		default: return code===unit
		case '%': params[code.substr(1)]=parseFloat(unit); break
		case '$': params[code.substr(1)]=unit; break
		case '*': params[code.substr(1)]=unit+'/'+units.join('/'); break
		}
		return true
	},
	matchRestCode=function(units,codes,params){
		for(var i=0,u,c; c=codes[i]; i++){
			u=units.shift()
			if (Array.isArray(c)){
				if (0!==u.indexOf(c[0])) return false
				if (!parseRestCode(c[1],u.substr(1),units,params)) return false
			}else{
				if (!parseRestCode(c,u,units,params)) return false
			}
		}
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
				h = (h * 31 + c) | 0 // same as h = ((h<<5)-h)+c;  h = h | 0 or h = h & h <= Convert to 32bit integer
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
            return Array(n-String(val).length+1).join(str||'0')
		},
		// precedence | / * $ %
		compileRest:function(list, output){
			output=output||[]
			for(var i=0,route; route=list[i]; i++){
				if (-1 === route.search('[|*$%]')) continue
				compileRestOptional(route.split('|'),[route],function(err,codes){
					if (err) throw err
					output.push(codes)
				})
			}
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
        log: function(){
            var
            orgPrepare = Error.prepareStackTrace,
            orgCount = Error.stackTraceLimit

            Error.prepareStackTrace = callerFormat
            Error.stackTraceLimit = 1

            var err = new Error
            Error.captureStackTrace(err, arguments.callee)
            var params = [(new Date).toISOString(), err.stack]
            console.log.apply(console, params.concat(Array.prototype.slice.call(arguments)))

            Error.prepareStackTrace = orgPrepare
            Error.stackTraceLimit = orgCount
        },
        error: function(){
            var orgCount = Error.stackTraceLimit

            Error.stackTraceLimit = 4

            var err = new Error
            Error.captureStackTrace(err, arguments.callee)
            var params = [(new Date).toISOString()]
            params = params.concat(Array.prototype.slice.call(arguments))
            params.push('\n')
            console.error.apply(console, params.concat(err.stack))

            Error.stackTraceLimit = orgCount
        }
    }
})
