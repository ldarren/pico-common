!function(pico, format){
    pico.text = {
        ensure: function(msg, task){
            task(function(err, result){
                if (err) return console.error(msg+':\t'+err)
                console.log(msg+':\t'+format(result,{colors:true}))
            })
        }
    }
}('undefined' === typeof window ? module.exports : window.pico, 'undefined' === typeof require ? JSON.stringify : require('util').inspect)
