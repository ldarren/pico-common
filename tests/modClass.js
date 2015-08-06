var modAttach=require('./modAttach')
module.exports=function(){
}

module.exports.prototype={
    a:function(){
        return 'modClass'
    },
    b:function(){
        return modAttach.a()
    }
}
