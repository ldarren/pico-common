
define('pico/json',function(exports,require,module,define,inherit,pico){
    return {
        parse:function(pjson,deep){
            return JSON.parse(pjson[0], function(k, v){
                switch(k[0]){
                case '$': if(deep)return JSON.parse(pjson[v])
                case '_': return pjson[v]
                default: return v
                }
            })
        },
        stringify:function(json, deep){
            var pjson=[]
            pjson.unshift(JSON.stringify(json, function(k, v){
                switch(k[0]){
                case '$': if(deep)return pjson.push(JSON.stringify(v))
                case '_': return pjson.push(v)
                default: return v
                }
            }))
            return pjson
        }
    }
})
