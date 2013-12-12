// Export components
var module, key;
['const', 'objTools', 'timeTools', 'testTools'].forEach(function(path) {
    module = require('./' + path);
    if (module){
        for (key in module) {
            exports[key] = module[key];
        }
    }
});
