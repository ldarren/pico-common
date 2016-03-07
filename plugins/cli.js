if('object'===typeof process){
    ajax=ajax||function(method, url, params, headers, cb, userData){
        /* TODO why readfile not working?
        require('fs').readFile(url, 'utf8', function(err, txt){
            if (err) return cb(err,2,null,userData)
            cb(null,4,txt,userData)
        })
        */
        var txt = require('fs').readFileSync(url, 'utf8')
        if (txt) return setImmediate(cb, null, 4, txt, userData)
        setImmediate(cb, 'failed', 2, null, userData)
    }
}
