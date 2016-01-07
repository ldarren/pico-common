#!/usr/bin/env node

var TOOL_PATH= process.argv[2]

if (!TOOL_PATH) return console.log('Usage: '+process.argv[1]+' TOOL_PATH [OUTPUT_NAME]')

var
uglify=require('uglify-js'),
PREFIX="(function(module,exports,require){",
POSTFIX="}).apply(null, 'undefined' === typeof window ? [module, 'exports', require] : [window, 'pico'])",
fs = require('fs'),
path = require('path'),
stream=require('stream'),
symPath= process.argv[1],
dest= process.argv[3] || 'pico',
getPath = function(dir, file){
    if (path.isAbsolute(file)) return file
    return path.resolve(dir,file)
},
pipeStr=function(str,w,opt){
    var r = new stream.Readable
    r.pipe(w,opt||{end:false})
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
	fs.unlink(dest+'.js', function(err){
        console.log('open file', dest)
        var ws = fs.createWriteStream(dest+'.js', {flags:'a'})
        pipeStr(PREFIX,ws)
        fs.readdir(getPath(wd, TOOL_PATH), function(err, files){
            if (err) return console.error(err)
            files.unshift('../amd.js')
            !function(cb){
                if (!files.length) return cb()
                var
                fname = files.shift(),
                callee = arguments.callee

                if ('.' === fname[0]) return callee(cb)
                console.log('appending', getPath(sd,fname), '...')
                var rs = fs.createReadStream(getPath(sd,fname))

                rs.on('close', function(){ callee(cb) })
                rs.pipe(ws, {end:false})
            }(function(){
                ws.on('finish',()=>{
/*                    var minify=uglify.minify(dest+'.js',{outSourceMap:dest+'.min.js.map'})
                    fs.writeFile(dest+'.min.js', minify.code, 'utf8', (err)=>{
                        if (err) return console.error(err)
                        fs.writeFile(dest+'.min.js.map', minify.map, 'utf8', ()=>{
                            if (err) return console.error(err)*/
                            console.log('Done!')
                       /* })
                    })*/
                })
                pipeStr(POSTFIX,ws,{end:true});
            })  
        })
	})
})              
