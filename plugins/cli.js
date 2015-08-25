if('undefined'!==typeof process && process.argv[2]){
    ajax=function(method, url, params, headers, cb, userData){
        var fs=require('fs')
        fs.readFile(url, {encoding:'utf8'}, function(err, txt){
            if (err) return cb(err,2,null,userData)
            cb(null,4,txt,userData)
        })
    }
    loader(process.argv[2],dummyCB)
}
