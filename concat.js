#!/usr/bin/env node

var
fs = require('fs'),
path = require('path'),
symPath = process.argv[1],
dest = path.sep + (process.argv[2] || 'velvet.js'),
srcDir = path.sep + (process.argv[3] || 'js') + path.sep

fs.readlink(symPath, function(err, realPath){
	if (err) realPath = symPath
	var wd = path.dirname(realPath)
	dest = wd + dest
	srcDir = wd + srcDir
	console.log('delete', dest)
	fs.unlink(dest, function(err){
		console.log('read dir', srcDir)
		fs.readdir(srcDir, function(err, files){
			if (err) return console.error(err)
			console.log('open file', dest)
			var ws = fs.createWriteStream(dest, {flags:'a'});
			(function(cb){
				if (!files.length) return cb()
				var
				fname = files.shift(),
				callee = arguments.callee

				if ('.' === fname || '..' === fname) callee(cb)
				console.log('appending', fname, '...')
				var rs = fs.createReadStream(srcDir+fname)

				rs.on('close', function(){ callee(cb) })
				rs.pipe(ws, {end:false})
			})(function(){ console.log('Done!')})  
		})      
	})
})              
