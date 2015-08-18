var
fs=require('fs'),
pico=require('./pico')

console.log(pico)

pico.run({
    ajax:function(method, url, params, headers, cb, userData){
        fs.readFile(url, {encoding:'utf8'}, function(err, txt){
            if (err) return cb(err,2,null,userData)
            cb(null,4,txt,userData)
        })
    },
    onLoad:function(cb){
        cb()
    },
    env:{
    },
    paths:{
    }
},
function(){
    var
    modAttach=require('./modAttach'),
    modClass=require('./modClass'),
    modFunc=require('./modFunc'),
    modOverride=require('./modOverride')

    return function(){
        console.log('modAttach.a',modAttach.a())
        console.log('modAttach.b',modAttach.b())
        console.log('modClass.a',(new modClass).a())
        console.log('modClass.b',(new modClass).b())
        console.log('modFunc',modFunc())
        console.log('modOverride',modOverride.a())
    }
})
