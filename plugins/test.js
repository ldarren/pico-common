define('pico/test',function(){
    var format='undefined' === typeof require ? JSON.stringify : require('util').inspect
    return {
        ensure: function(msg, task){
            task(function(err, result){
                if (err) return console.error(msg+':\t'+err)
                console.log(msg+':\t'+format(result,{colors:true}))
            })
        }
    }
})
