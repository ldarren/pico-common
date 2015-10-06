#!/usr/bin/env node

var TOOL_PATH= process.argv[2]

if (!TOOL_PATH) return console.log('Usage: '+process.argv[1]+' TOOL_PATH [pico.js]')

var
PREFIX="(function(module,exports,require){",
POSTFIX="}).apply(null, 'undefined' === typeof window ? [module, 'exports', require] : [window, 'pico'])",
fs = require('fs'),
path = require('path'),
stream=require('stream'),
symPath= process.argv[1],
dest= process.argv[3] || 'pico.js',
getPath = function(dir, file){
    if (path.isAbsolute(file)) return file
    return path.resolve(dir,file)
},
pipeStr=function(str,w){
    var r = new stream.Readable
    r.pipe(w,{end:false})
    r.push(str)    // the string you want
    r.push(null)      // indicates end-of-file basically - the end of the stream
}

fs.readlink(symPath, function(err, realPath){
	if (err) realPath = symPath
	var
    wd = path.dirname(realPath),
    sd = getPath(wd, TOOL_PATH)
	dest = getPath(wd, dest)
	console.log('delete', dest)
	fs.unlink(dest, function(err){
        console.log('open file', dest)
        var ws = fs.createWriteStream(dest, {flags:'a'})
        pipeStr(PREFIX,ws)
        fs.readdir(getPath(wd, TOOL_PATH), function(err, files){
            if (err) return console.error(err)
            files.unshift('../amd.js')
            !function(cb){
                if (!files.length) return cb()
                var
                fname = files.shift(),
                callee = arguments.callee

                if ('.' === fname || '..' === fname) return callee(cb)
                console.log('appending', getPath(sd,fname), '...')
                var rs = fs.createReadStream(getPath(sd,fname))

                rs.on('close', function(){ callee(cb) })
                rs.pipe(ws, {end:false})
            }(function(){ pipeStr(POSTFIX,ws);console.log('Done!')})  
        })
	})
})              
