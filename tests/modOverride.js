var modDesc=require('modDesc.txt')
module.exports={
    a:function(){
        return 'modOverride'
    },
    desc:function(){
        return modDesc
    }
}
this.load=function(){
    console.log('modOverride loaded')
}
