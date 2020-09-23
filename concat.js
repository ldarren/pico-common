#!/usr/bin/env node

const origDirs= (process.argv[2] || '').split(',')

if (!origDirs[0]) {
	console.log('Usage: '+process.argv[1]+' COMMA_SEP_PATHS [OUTPUT_NAME] [TYPE = {js,es}]')
	process.exit(1)
}

const BIN='bin'
const SRC='src'
const JS='.js'
const MIN_JS='.min.js'
const MIN_MAP=MIN_JS+'.map'
const PREFIX='(function(module,exports,require){'
const POSTFIX='}).apply(null, \'object\' === typeof module ? [module, \'exports\', require] : [window, \'pico\'])'
const ES_PREFIX='var obj = {};(function(module,exports,require){'
const ES_POSTFIX='}).apply(null, [obj, \'esm\']); export default obj.esm'
const {minify} = require('terser')
const fs = require('fs')
const path = require('path')
const stream=require('stream')
const symPath= process.argv[1]

function getPath(dir, file){
	if (path.isAbsolute(file)) return file
	return path.resolve(dir,file)
}
function pipeStr(str,w,opt){
	const r = new stream.Readable
	r.pipe(w,opt||{end:false})
	r.push(str)    // the string you want
	r.push(null)      // indicates end-of-file basically - the end of the stream
}
function readdirs(wd,dirs,output,cb){
	if (!dirs.length) return cb(null, output)
	const srcDir = path.join(wd,dirs.shift())
	console.log('read dir', srcDir)
	fs.readdir(srcDir, (err, files)=>{
		if (err) return cb(err)
		for(let i=0,f; (f=files[i]); i++){
			if ('.'===f.charAt(0)) continue
			output.push(path.join(srcDir,f))
		}
		readdirs(wd,dirs,output,cb)
	})
}

let dest= process.argv[3] || path.join(BIN,'pico')
const [prefix, postfix] = 'es' === process.argv[4] ? [ES_PREFIX, ES_POSTFIX] : [PREFIX, POSTFIX]

fs.readlink(symPath, (err, realPath)=>{
	if (err) realPath = symPath
	const wd = path.dirname(realPath)
	const destAbs = getPath(wd, dest)
	console.log('deleting', destAbs)
	fs.unlink(destAbs+JS, (err)=>{
		console.log('open file', destAbs)
		const ws = fs.createWriteStream(destAbs+JS, {flags:'a'})
		pipeStr(prefix,ws)
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

				rs.on('close', ()=>{
					callee(cb)
				})
				rs.pipe(ws, {end:false})
			}(()=>{
				ws.on('finish',()=>{
					fs.readFile(destAbs+JS,'utf8',async (err,code)=>{
						if (err) return console.error(err)
						const mini=await minify(code,{sourceMap:{filename:dest+MIN_JS,url:dest+MIN_MAP}})
						if (mini.error) return console.error(mini.error)
						fs.writeFile(destAbs+MIN_JS, mini.code, 'utf8', (err)=>{
							if (err) return console.error(err)
							fs.writeFile(destAbs+MIN_MAP, mini.map, 'utf8', ()=>{
								if (err) return console.error(err)
								console.log('Done!')
							})
						})
					})
				})
				pipeStr(postfix,ws,{end:true})
			})
		})
	})
})
