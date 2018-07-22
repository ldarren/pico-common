define('pico/func',function(exports,require,module,define,inherit,pico){
	function callerFormat(_, stack){
		var r = stack[0]
		var trace = []

		for (var i = 0, s; s = stack[i]; i++){
			trace.push(s.toString())
		}

		return {
			typeName: r.getTypeName(),
			functionName: r.getFunctionName(),
			methodName: r.getMethodName(),
			fileName: r.getFileName(),
			line: r.getLineNumber(),
			column: r.getColumnNumber(),
			evalOrigin: r.getEvalOrigin(),
			isTopLevel: r.isToplevel(),
			isEval: r.isEval(),
			isNative: r.isNative(),
			isConstructor: r.isConstructor(),
			trace: trace
		}
	}

    return {
        reflect: function callee(func){
			var orgPrepare = Error.prepareStackTrace
			var orgCount = Error.stackTraceLimit

			Error.prepareStackTrace = callerFormat
			Error.stackTraceLimit = 1

			var err = new Error
			Error.captureStackTrace(err, func || callee)
			var s = err.stack

			Error.stackTraceLimit = orgCount
			Error.prepareStackTrace = orgPrepare

			return s
		}
    }
})
