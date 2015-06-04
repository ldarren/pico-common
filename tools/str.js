(function(exports){
    exports.codec = function(num, str){
        for(var i=0,l=str.length,ret=''; i<l; i++){
            ret += String.fromCharCode(str.charCodeAt(i) ^ num)
        }
        return ret
    }
    exports.hash = function(str){
        var hash = 0

        for (var i = 0, l=str.length; i < l; i++) {
            hash = ((hash<<5)-hash)+str.charCodeAt(i)
            hash = hash & hash // Convert to 32bit integer
        }
        return hash
    },
})('undefined' === typeof exports ? pico['str']={} : exports)
