pico.run({
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
        console.log('modOverride',modOverride.desc())
    }
})
