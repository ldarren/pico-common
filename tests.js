var
util = require('util'),
common = require('./index'),
mergeObj = common.mergeObj,
deltaToNext = common.deltaToNext,
timeOfNext = common.timeOfNext,
ensure = function(msg, task){
    task(function(err, result){
        if (err) return console.error(msg+':', '\t', err);
        console.log(msg+':', '\t', util.inspect(result,{colors:true}));
    });
};

ensure('ensure obj2 override obj1. output value of key1 should be 2', function(cb){
    var
    obj1 = {key1:1},
    obj2 = {key1:2};

    cb(null, mergeObj(obj1, obj2));
});

ensure('ensure obj1 merges with obj2. output should contain key1 and key2', function(cb){
    var
    obj1 = {key1:1},
    obj2 = {key2:2};

    cb(null, mergeObj(obj1, obj2));
});

ensure('ensure options.tidy on is working. output should not contain undefined key', function(cb){
    var
    obj1 = {key1:1},
    obj2 = {key2:undefined};

    cb(null, mergeObj(obj1, obj2, {tidy:1}));
});

ensure('ensure options.tidy off is working. output should contain undefined key', function(cb){
    var
    obj1 = {key1:1},
    obj2 = {key2:undefined};

    cb(null, mergeObj(obj1, obj2));
});

ensure('ensure options.mergeArr on is working. output should contain[1,2,3] list', function(cb){
    var
    obj1 = {key1:[1]},
    obj2 = {key1:[2,3]};

    cb(null, mergeObj(obj1, obj2, {mergeArr:1}));
});

ensure('ensure options.mergeArr off is working. output should contain[2,3] list', function(cb){
    var
    obj1 = {key1:[1]},
    obj2 = {key1:[2,3]};

    cb(null, mergeObj(obj1, obj2));
});

ensure('ensure deltaToNext 5 sec is 5000', function(cb){
    var d = new Date();
    cb(null, deltaToNext(0, d.getHours(), d.getMinutes(), d.getSeconds()+5, d.getMilliseconds()));
});

ensure('ensure timeOfNext 2days 9am is Xxx, D+2 MM YYYY 09:00:00 GMT', function(cb){
    cb(null, (new Date(timeOfNext(2, 9))).toUTCString());
});
