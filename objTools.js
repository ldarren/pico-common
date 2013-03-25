(function(exports){
    var mergeObj;
    exports.mergeObj = mergeObj = function(base, obj, options){
        if (typeof base !== typeof obj) {
            base = obj;
            return base;
        }
        if (!options || typeof options !== 'object') options = {};
        var key, value;
        if (obj.length === undefined){
            for (key in obj){
                value = obj[key];
                if (typeof value === 'object')
                    base[key] = mergeObj(base[key], value);
                else
                    base[key] = obj[key];
            }
        }else{
            if (options.mergeArray){
                var i, l, unique={};
                for (i=0,l=base.length; i<l; i++){
                    value = base[i];
                    unique[value] = value;
                }
                for (i=0,l=obj.length; i<l; i++){
                    value = obj[i];
                    unique[value] = value;
                }
                base = [];
                for (key in unique){
                    base.push(unique[key]);
                }
            }else{
                base = obj;
            }
        }
        return base;
    };
})(exports === undefined ? this['objTools']={} : exports);
