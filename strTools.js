(function(exports){
    exports.strCodec = function(num, str){ for(var i=0,l=str.length,ret=''; i<l; i++){ ret += String.fromCharCode(str.charCodeAt(i) ^ num); } return ret; };
})('undefined' === typeof exports ? pico['strTools']={} : exports);
