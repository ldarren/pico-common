pFunc.reflect return reflection of a given function, it returns
- typeName: method or function
- functionName: function name
- methodName: method name
- fileName: filename
- line: line number
- column: column number
- evalOrigin: 
- isTopLevel
- isEval
- isNative
- isConstructor
- trace: call stack

## syntax
> pFunc.reflect(function, [limit = 1])

### parameters
__function__: _function_, function to be analyzed

__limit__, _optional limit_, call stack limit
