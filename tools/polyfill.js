// embed this script before pico.js to make pico.js compatible to < IE10
if (!window.addEventListener && window.attachEvent) window.addEventListener = function(name, func){ return window.attachEvent('on'+name, func); };
if (!window.removeEventListener && window.detachEvent) window.removeEventListener = function(name, func){ return window.detachEvent('on'+name, func); };
if (!Date.now) Date.now = function(){ return +new Date; };
if (!Object.freeze) Object.freeze = function(){};
if (!Object.keys) Object.keys = function(obj){
    var result = [];
    for(var key in obj){
        result.push(key);
    }
    return result;
};
if (!Object.create) Object.create = function(obj, properties) {
    if (!obj) obj = {};
    for(var key in properties){
        obj[key] = properties[key].value;
    }
    return obj;
};
if (!Object.defineProperties) Object.defineProperties = Object.create;
if (!Object.defineProperty) Object.defineProperty = function(obj, key, property){
    obj[key] = property.value;
    return obj;
};
