(function(exports){
    var mergeObj;
    exports.mergeObj = mergeObj = function(base, obj, options){
        if (typeof base !== typeof obj) {
            base = obj;
            return base;
        }
        if (!options || typeof options !== 'object') options = {};
        var tidy = options.tidy, key, value;
        if (undefined === obj.length){
            for (key in obj){
                value = obj[key];
                if (undefined === value && tidy) continue;
                if (typeof value === 'object')
                    base[key] = mergeObj(base[key], value, options);
                else
                    base[key] = value;
            }
        }else{
            if (options.mergeArr){
                var i, l, unique={};
                for (i=0,l=base.length; i<l; i++){
                    if (undefined === (value = base[i]) && tidy) continue;
                    unique[value] = value;
                }
                for (i=0,l=obj.length; i<l; i++){
                    if (undefined === (value = obj[i]) && tidy) continue;
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
})(undefined === exports ? this['objTools']={} : exports);
