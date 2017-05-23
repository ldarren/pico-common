define('pico/build',function(){
	const
	CR=/['\n\r]/g,
	htmlescape= { "'":'&#039;', '\n':'\\n','\r':'\\n' },
	esc=(m)=>{return htmlescape[m]}

    return function(options){
        const
        fs=require('fs'),
        entry=options.entry,
        output=options.output,
        exclude=options.exclude,
        orgDefine=define,
        addDeps=function(output, deps){
            if (!deps || !deps.length) return
            fs.appendFileSync(output, fs.readFileSync(deps.shift()))
            fs.appendFileSync(output, ';')
            addDeps(output, deps)
        },
        addInclude=function(include, cb){
            if (!include || !include.length) return cb()
            loader(include.shift(), function(err){
                addInclude(include, cb)
            })
        }

        // overide tick to write function
        tick=dummyCB

        // overide define to write function
        define=function(url, func, base){
            orgDefine(url, func, base, true)
            if(!url)return
            if (-1 !== exclude.indexOf(url)) return
            // TODO why appendFile not working?
            switch(getExt(url)||EXT_JS){
            case EXT_JS: return fs.appendFileSync(output, DEF.replace('URL',url).replace("'FUNC'",func.toString()))
            case EXT_JSON: return fs.appendFileSync(output, DEF.replace('URL',url).replace('FUNC',JSON.stringify(JSON.parse(func)).replace(CR, esc)))
            default: return fs.appendFileSync(output, DEF.replace('URL',url).replace('FUNC',func.replace(CR, esc)))
            }
        }

        fs.unlink(output, ()=>{
            addDeps(output, [...options.deps])
            fs.readFile(entry, 'utf8', (err, txt)=>{
                if (err) return console.error(err)
                // overide define to write function
                var func=compile(null,txt,[],pico) // since no define, compile with real pico
                if (-1 !== exclude.indexOf(entry)) return
                ran=function(){
                    fs.appendFileSync(output, funcBody(func.toString()))
                    addInclude([...options.include], (err)=>{
                        if (err) console.error(err)
                        // TODO why need to kill?
                        process.exit()
                    })
                }
            })
        })
    }
})
