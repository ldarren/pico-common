!function(context, mod, format){
    context[mod]= {
        ensure: function(msg, task){
            task(function(err, result){
                if (err) return console.error(msg+':\t'+err)
                console.log(msg+':\t'+format(result,{colors:true}))
            })
        }
    }
}('undefined' === typeof pico ? module.exports:pico, 'test', 'undefined' === typeof require ? JSON.stringify : require('util').inspect)
