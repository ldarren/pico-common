define('pico/build',function(){
	var
	CR=/['\n\r]/g,
	htmlescape= { "'":'&#039;', '\n':'\\n','\r':'\\n' },
	esc=function(m){return htmlescape[m]}

	return function(options){
		const fs=require('fs')
		const path=require('path')
		const srcDir = options.shift()
		const dstDir = options.shift()
		const orgDefine = define

        // overide tick function
        tick=dummyCB

		function addDeps(dst, deps){
			if (!deps || !deps.length) return
			fs.appendFileSync(dst, fs.readFileSync(deps.shift()))
			fs.appendFileSync(dst, ';\n')
			return addDeps(dst, deps)
		}

		function addInclude(include, cb){
			if (!include || !include.length) return cb()
			loader(include.shift(), err => {
				if (err) return cb(err)
				addInclude(include, cb)
			})
		}

		function overrideDefine(dst, exclude){
			define = (url, func, base) => {
				orgDefine(url, func, base, true)
				if (!url) return
				if (-1 !== exclude.indexOf(url)) return
				switch(getExt(url) || EXT_JS){
				case EXT_JS: return fs.appendFileSync(dst, DEF.replace('URL',url).replace("'FUNC'",func.toString()))
				case EXT_JSON: return fs.appendFileSync(dst, DEF.replace('URL',url).replace('FUNC',JSON.stringify(JSON.parse(func)).replace(CR, esc)))
				default: return fs.appendFileSync(dst, DEF.replace('URL',url).replace('FUNC',func.replace(CR, esc)))
				}
			}
		}

		function createBundle(options, mainModules, cb){
			if (!options || !options.length) return cb

			// reset to main modules state
			modules = Object.assign({}, mainModules)

			const o = options.shift()
			const dst = path.join(dstDir, o.entry + EXT_JS)
			const exclude = o.exclude || []

			// overide define function
			overrideDefine(dst, exclude)

			fs.unlink(dst, () => {
				addDeps(dst, o.deps)
				addInclude(o.include, (err) => {
					if (err) return console.error(err)
					const txt = fs.readFileSync(path.join(srcDir, o.entry + EXT_JS))
					// since no define, compile with real pico
					const func = compile(null, txt, [], pico)
					js(o.entry, txt, (err) => {
						if (err) return cb(err)
						fs.appendFileSync(dst, funcBody(func.toString()))
						createBundle(options, mainModules, cb)
					})
				})
			})
		}

		const mo = options.shift()
		const dst = path.join(dstDir, mo.entry + EXT_JS)
		const exclude = mo.exclude || []

		// overide define function
		overrideDefine(dst, exclude)

		fs.unlink(dst, () => {
			addDeps(dst, mo.deps)
			const txt = fs.readFileSync(path.join(srcDir, mo.entry + EXT_JS))
			// since no define, compile with real pico
			const func = compile(null, txt, [], pico)
			if (~exclude.indexOf(mo.entry)) return
			ran = function(){
				addInclude(mo.include, (err) => {
					if (err) return console.error(err)
					fs.appendFileSync(dst, funcBody(func.toString()))
					// TODO why need to kill?
					createBundle(options, Object.assign({}, modules), () => {
						process.exit()
					})
				})
			}
		})
	}
})
