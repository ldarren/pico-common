var
obj = require('./tools/obj'),
str = require('./tools/str'),
time = require('./tools/time'),
ensure= require('./tools/test').ensure

ensure('ensure obj2 override obj1. output value of key1 should be 2', function(cb){
    var
    obj1 = {key1:1},
    obj2 = {key1:2}

    cb(null, obj.extend(obj1, obj2))
})

ensure('ensure obj1 merges with obj2. output should contain key1 and key2', function(cb){
    var
    obj1 = {key1:1},
    obj2 = {key2:2}

    cb(null, obj.extend(obj1, obj2))
})

ensure('ensure options.tidy on is working. output should not contain undefined key', function(cb){
    var
    obj1 = {key1:1},
    obj2 = {key2:undefined}

    cb(null, obj.extend(obj1, obj2, {tidy:1}))
})

ensure('ensure options.tidy off is working. output should contain undefined key', function(cb){
    var
    obj1 = {key1:1},
    obj2 = {key2:undefined}

    cb(null, obj.extend(obj1, obj2))
})

ensure('ensure options.mergeArr on is working. output should contain[1,2,3] list', function(cb){
    var
    obj1 = {key1:[1]},
    obj2 = {key1:[2,3]}

    cb(null, obj.extend(obj1, obj2, {mergeArr:1}))
})

ensure('ensure options.mergeArr off is working. output should contain[2,3] list', function(cb){
    var
    obj1 = {key1:[1]},
    obj2 = {key1:[2,3]}

    cb(null, obj.extend(obj1, obj2))
})

ensure('ensure parseInts is working, ["1", "2"] should parse to [1, 2]', function(cb){
    cb(null, obj.parseInts(['1','2']))
})

ensure('ensure deltaToNext 5 sec is 5000', function(cb){
    var d = new Date()
    cb(null, time.deltaToNext(0, d.getHours(), d.getMinutes(), d.getSeconds()+5, d.getMilliseconds()))
})

ensure('ensure timeOfNext 2days 9am is Xxx, D+2 MM YYYY 09:00:00 GMT', function(cb){
    cb(null, (new Date(time.timeOfNext(2, 9))).toUTCString())
})

ensure('ensure strCodec encode string "{"data":123}" and decode the same', function(cb){
    var
    data = JSON.stringify({data:123}),
    key = parseInt('100007900715391')
    cb(null, str.strCodec(key, str.strCodec(key, data)))
})
