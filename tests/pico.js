var
fs=require('fs'),
dummyCB=function(){},
modules={},
PREFIX="define('URL',function(require,exports,module,define){",
POSTFIX="})\n",
loadDeps=function(deps, func, cb){
    if (!deps.length) return cb()
    func(deps.pop(),function(err){
        if (err) return cb(err)
        loadDeps(deps, func, cb)
    })
},
require=function(k){return modules[k]},
define=function(url, func){
    var
    module={exports:{}},
    m=func(require,module.exports,module,define)||module.exports,
    o=function(){return arguments.callee.__proto__(this)}

    o.prototype=m.prototype
    o.__proto__=m
console.log('define',url,o)
    modules[url]=o
},
vm=function(url,cb){
    cb=cb||dummyCB
    if (modules[url])return cb(null, modules[url])
    fs.readFile(url+'.js', {encoding:'utf8'},function(err,txt){
        if (err) return cb(err)

        var
        fmodule={exports:{}},
        fdeps=[],
        frequire=function(k){if(!modules[k])fdeps.push(k)}

        Function('require','exports','module','define',txt)(frequire,fmodule.exports,fmodule,dummyCB)

        modules[url]=function(){return arguments.callee.__proto__(this)}
console.log('loading',url)
        loadDeps(fdeps, vm, function(err){
            if (err) return cb(err)

            var
            module={exports:{}},
            m=Function('require','exports','module','define',txt)(require,module.exports,module,define)||module.exports,
            o=modules[url]

            if(m){
                o.prototype = m.prototype
                o.__proto__ = m
console.log(url, o)
            }

            cb(null, o)
        })
    })
},
build=function(url, cb){
    cb=cb||dummyCB
    if(modules[url])return cb()
    fs.readFile(url+'.js', {encoding:'utf8'},function(err,txt){
        if (err) return cb(err)

        var
        fmodule={exports:{}},
        fdeps=[],
        frequire=function(k){if(!modules[k])fdeps.push(k)}

        Function('require','exports','module',txt)(frequire,fmodule.exports,fmodule)

        modules[url]={}
console.log('building',url,fdeps)
        loadDeps(fdeps, build, function(err){
            if (err) return cb(err)

            fs.appendFile('./output.js', PREFIX.replace('URL',url)+txt+POSTFIX, cb)
        })
    })
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
