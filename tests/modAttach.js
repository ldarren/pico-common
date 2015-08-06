var modClass=require('./modClass')
exports.a=function(){
    return 'modAttach'
}
exports.b=function(){
    return (new modClass).a()
}
