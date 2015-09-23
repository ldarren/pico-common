define('pico/str', function(){
    return {
        codec: function(num, str){
            var ret=''
            for(var i=0,c; c=str.charCodeAt(i); i++){
                ret += String.fromCharCode(c ^ num)
            }
            return ret
        },
        hash: function(str){
            var h = 0

            for (var i=0,c; c=str.charCodeAt(i); i++) {
                h = ((h<<5)-h)+c
                h = h & h // Convert to 32bit integer
            }
            return h
        },
        tab: function(col1, spaces, c){
            var ret='', l=spaces-col1.length
            if (!l || l<1) return ret
            c=c||' '
            for(var i=0; i<l; i++) ret+=c
            return ret
        }
    }
})
