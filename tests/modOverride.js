module.exports={
    a:function(){
        return 'modOverride'
    }
}
this.load=function(){
    console.log('modOverride loaded')
}
