#!/usr/bin/env node

var TOOL_PATH= process.argv[2]

if (!TOOL_PATH) return console.log('Usage: '+process.argv[1]+' TOOL_PATH [index.js]')

var
fs = require('fs'),
path = require('path'),
symPath= process.argv[1],
dest= process.argv[3] || 'index.js',
getPath = function(dir, file){
    if (path.isAbsolute(file)) return file
    return dir+path.sep+file
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
        fs.readdir(getPath(wd, TOOL_PATH), function(err, files){
            if (err) return console.error(err)
            files.unshift('../pico.js')
console.log(wd,files)
            !function(cb){
                if (!files.length) return cb()
                var
                fname = files.shift(),
                callee = arguments.callee

                if ('.' === fname || '..' === fname) return callee(cb)
                console.log('appending', fname, '...')
                var rs = fs.createReadStream(getPath(sd,fname))

                rs.on('close', function(){ callee(cb) })
                rs.pipe(ws, {end:false})
            }(function(){ console.log('Done!')})  
        })
	})
})              
