var modUsers=require('modUsers.json')
module.exports=function(){
    return ['modFunc',JSON.stringify(modUsers)]
}
this.load=function(){
    console.log('modFunc loaded')
}
