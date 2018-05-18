define('pico/build',function(){
	var
	CR=/['\n\r]/g,
	htmlescape= { "'":'&#039;', '\n':'\\n','\r':'\\n' },
	esc=function(m){return htmlescape[m]}

	return function(options){
		var fs=require('fs')
		var path=require('path')
		var srcDir = options.shift()
		var dstDir = options.shift()
		var orgDefine = define

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
			loader(include.shift(), function(err) {
				if (err) return cb(err)
				addInclude(include, cb)
			})
		}

		function overrideDefine(dst, exclude){
			define = function (url, func, base) {
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

			var o = options.shift()
			var dst = path.join(dstDir, o.entry + EXT_JS)

			// overide define function
			overrideDefine(dst, o.exclude || [])

			fs.unlink(dst, function() {
				addDeps(dst, o.deps)
				addInclude(o.include, function(err) {
					if (err) return console.error(err)
					var txt = fs.readFileSync(path.join(srcDir, o.entry + EXT_JS))
					// since no define, compile with real pico
					var func = compile(null, txt, [], pico)
					js(o.entry, txt, function(err) {
						if (err) return cb(err)
						fs.appendFileSync(dst, funcBody(func.toString()))
						createBundle(options, mainModules, cb)
					})
				})
			})
		}

		var mo = options.shift()
		var dst = path.join(dstDir, mo.entry + EXT_JS)
		var exclude = mo.exclude || []

		// overide define function
		overrideDefine(dst, exclude)

		fs.unlink(dst, function() {
			addDeps(dst, mo.deps)
			var txt = fs.readFileSync(path.join(srcDir, mo.entry + EXT_JS))
			// since no define, compile with real pico
			var func = compile(null, txt, [], pico)
			if (~exclude.indexOf(mo.entry)) return
			ran = function(){
				addInclude(mo.include, function(err) {
					if (err) return console.error(err)
					fs.appendFileSync(dst, funcBody(func.toString()))
					// TODO why need to kill?
					createBundle(options, Object.assign({}, modules), function() {
						process.exit()
					})
				})
			}
		})
	}
})
