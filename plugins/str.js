define('pico/str', function(){
    function pinPointCaller(_, stack){
        var r = stack[0]
        return '['+
            (r.getFunctionName() || r.getTypeName()+'.'+r.getMethodName())+
            '@'+r.getFileName() + ':' + r.getLineNumber() + ':' + r.getColumnNumber()+']'
    }
    return {
        codec: function(num, str){
            var ret=''
            for(var i=0,c; c=str.charCodeAt(i); i++){
                ret += String.fromCharCode(c ^ num)
            }
            return ret
        },
        hash: function(str){
            var h = 0

            for (var i=0,c; c=str.charCodeAt(i); i++) {
                h = ((h<<5)-h)+c
                h = h & h // Convert to 32bit integer
            }
            return h
        },
        tab: function(col1, spaces, c){
            var ret='', l=spaces-col1.length
            if (!l || l<1) return ret
            c=c||' '
            for(var i=0; i<l; i++) ret+=c
            return ret
        },
        log: function(){
            var
            orgPrepare = Error.prepareStackTrace,
            orgCount = Error.stackTraceLimit

            Error.prepareStackTrace = pinPointCaller
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
