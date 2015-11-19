pico.run({
    env:{
    },
    paths:{
        '*':'./',
        'node':function(name,cb){
console.log('path',name)
            cb(null, pico.import(name))
        }
    }
},
function(){
    var
    modAttach=require('modAttach'),
    modClass=require('modClass')
})
