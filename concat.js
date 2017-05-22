#!/usr/bin/env node

const origDirs= (process.argv[2] || '').split(',')

if (!origDirs[0]) return console.log('Usage: '+process.argv[1]+' COMMA_SEP_PATHS [OUTPUT_NAME]')

const
BIN='bin',
SRC='src',
PREFIX="(function(module,exports,require){",
POSTFIX="}).apply(null, 'undefined' === typeof window ? [module, 'exports', require] : [window, 'pico'])",
uglify=require('uglify-js'),
fs = require('fs'),
path = require('path'),
stream=require('stream'),
symPath= process.argv[1],
getPath = function(dir, file){
    if (path.isAbsolute(file)) return file
    return path.resolve(dir,file)
},
pipeStr=function(str,w,opt){
    const r = new stream.Readable
    r.pipe(w,opt||{end:false})
    r.push(str)    // the string you want
    r.push(null)      // indicates end-of-file basically - the end of the stream
},
readdirs=function(wd,dirs,output,cb){
	if (!dirs.length) return cb(null, output)
	const srcDir = path.join(wd,dirs.shift())
	console.log('read dir', srcDir)
	fs.readdir(srcDir, (err, files)=>{
		if (err) return cb(err)
		for(let i=0,f; f=files[i]; i++){
			if ('.'===f.charAt(0)) continue
			output.push(path.join(srcDir,f))
		}
		readdirs(wd,dirs,output,cb)
	})
}

let dest= process.argv[3] || path.join(BIN,'pico')

fs.readlink(symPath, (err, realPath)=>{
	if (err) realPath = symPath
	const wd = path.dirname(realPath)
	dest = getPath(wd, dest)
	console.log('deleting', dest)
	fs.unlink(dest+'.js', (err)=>{
        console.log('open file', dest)
        const ws = fs.createWriteStream(dest+'.js', {flags:'a'})
        pipeStr(PREFIX,ws)
        readdirs(wd, origDirs, [], (err, files)=>{
            if (err) return console.error(err)
            files.unshift(path.join(wd,SRC,'amd.js'))
            !function(cb){
                if (!files.length) return cb()
                const 
                fname = files.shift(),
                callee = arguments.callee

                console.log('appending', fname, '...')
                const rs = fs.createReadStream(fname)

                rs.on('close', ()=>{ callee(cb) })
                rs.pipe(ws, {end:false})
            }(()=>{
                ws.on('finish',()=>{
                    const minify=uglify.minify(dest+'.js',{outSourceMap:dest+'.min.js.map'})
                    fs.writeFile(dest+'.min.js', minify.code, 'utf8', (err)=>{
                        if (err) return console.error(err)
                        fs.writeFile(dest+'.min.js.map', minify.map, 'utf8', ()=>{
                            if (err) return console.error(err)
                            console.log('Done!')
                        })
                    })
                })
                pipeStr(POSTFIX,ws,{end:true});
            })  
        })
	})
})              
