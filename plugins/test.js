define('pico/test',function(){
    var
    str=pico.export('pico/str'),
    format='undefined' === typeof require ? JSON.stringify : require('util').inspect

    return {
        ensure: function(msg, task){
            task(function(err, result){
                if (err) return console.error(msg+':'+str.pad(msg,100,'-')+err)
                console.log(msg+':'+str.pad(msg,100,'.')+format(result,{colors:true}))
            })
        }
    }
})
