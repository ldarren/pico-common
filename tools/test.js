(function(exports, format){
    exports.ensure = function(msg, task){
        task(function(err, result){
            if (err) return console.error(msg+':\t'+err);
            console.log(msg+':\t'+format(result,{colors:true}));
        });
    };
})('undefined' === typeof exports ? pico['test']={} : exports, 'undefined' === typeof require ? JSON.stringify : require('util').inspect);
