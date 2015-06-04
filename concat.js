#!/usr/bin/env node

var
fs = require('fs'),
path = require('path'),
src = process.argv[2]

if (!src) return console.log('Usage: '+process.argv[1]+' pico.js,tools/obj.js [output.js]')

var
symPath = process.argv[1]
dest = process.argv[3] || 'output.js',
files= src.split(','),
getPath = function(dir, file){
    if (path.isAbsolute(file)) return file
    return dir+path.sep+file
}

fs.readlink(symPath, function(err, realPath){
	if (err) realPath = symPath
	var wd = path.dirname(realPath)
	dest = getPath(wd, dest)
	console.log('delete', dest)
	fs.unlink(dest, function(err){
        console.log('open file', dest)
        var ws = fs.createWriteStream(dest, {flags:'a'});
        (function(cb){
            if (!files.length) return cb()
            var
            fname = files.shift(),
            callee = arguments.callee

            if ('.' === fname || '..' === fname) callee(cb)
            console.log('appending', fname, '...')
            var rs = fs.createReadStream(getPath(wd,fname))

            rs.on('close', function(){ callee(cb) })
            rs.pipe(ws, {end:false})
        })(function(){ console.log('Done!')})  
	})
})              
