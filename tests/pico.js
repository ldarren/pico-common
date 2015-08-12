var
fs=require('fs'),
dummyCB=function(){},
modules={},
containers={},
DEF="define('URL',function(require,exports,module,define,inherit){BODY})\n",
loadDeps=function(deps, func, cb){
    if (!deps.length) return cb()
    func(deps.pop(),function(err){
        if (err) return cb(err)
        loadDeps(deps, func, cb)
    })
},
getMod=function(url,cb){
    cb=cb||dummyCB
    var mod=modules[url]
    if(mod){
        cb(null, mod)
        return mod
    }
    vm(url,cb)
},
compile=function(script,deps,base){
    var
    frequire=function(k){if(!modules[k])deps.push(k)},
    inherit=function(k){base.unshift(k),frequire(k)},
    func=Function('require','exports','module','define','inherit',script)

    func.call({}, frequire,{},{},dummyCB,inherit)
    return func
},
define=function(url, func, base){
    var
    module={exports:{}},
    me={},
    m=func.call(me,getMod,module.exports,module,define)||module.exports,
    o=modules[url]||function(){return arguments.callee.__proto__(this)}

    if (base)m.__proto__=base

    o.prototype=m.prototype
    o.__proto__=m
console.log('define',url,o)
    modules[url]=o
    containers[url]=me
    return o
},
vm=function(url,cb){
    cb=cb||dummyCB
    if (modules[url])return cb(null, modules[url])
    fs.readFile(url+'.js', {encoding:'utf8'},function(err,txt){
        if (err) return cb(err)

        var
        deps=[],
        base=[],
        func=compile(txt,deps,base)

        modules[url]=function(){return arguments.callee.__proto__(this)}

console.log('loading',url)
        loadDeps(deps, vm, function(err){
            if (err) return cb(err)
            
            var
            m=define(url,func,modules[base[0]]),
            me=containers[url]
            if(me.load)me.load()
            cb(null,m)
        })
    })
},
build=function(url, cb){
    cb=cb||dummyCB
    if(modules[url])return cb()
    fs.readFile(url+'.js', {encoding:'utf8'},function(err,txt){
        if (err) return cb(err)

        var
        deps=[],
        base=[]

        compile(txt,deps,base)

        modules[url]=1
console.log('building',url,deps)
        loadDeps(deps, build, function(err){
            if (err) return cb(err)

            fs.appendFile('./output.js', DEF.replace('URL',url).replace('BODY',txt), cb)
        })
    })
}

pico={
    run:function(options,func){
    },
    build:function(options,func){
    },
    embed:function(link){
    }
}

switch(process.argv[2]){
case 'run':
    vm(process.argv[3],function(err, main){
        if (err) return console.error(err)
console.log('vm',main)
        main()
    })
    break
case 'build':
    fs.unlink('./output.js', function(){
        build(process.argv[3],function(err){
            if (err) return console.error(err)
            fs.appendFile('./output.js',"return require('"+process.argv[3]+"')",dummyCB)
        })
    })
    break
}
