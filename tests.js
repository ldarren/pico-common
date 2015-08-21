var
web= require('pico/web'),
obj= require('pico/obj'),
str= require('pico/str'),
time= require('pico/time'),
test= require('pico/test')

this.load=function(){
    var ensure=test.ensure
    ensure('ensure pico has obj', function(cb){
        cb(null, pico.obj !== undefined)
    })

    ensure('ensure pico has web', function(cb){
        cb(null, pico.web!== undefined)
    })

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

    ensure('ensure options.tidy on is working. output should not contain any undefined key', function(cb){
        var
        obj1 = {key1:1},
        obj2 = {key2:undefined}

        cb(null, obj.extend(obj1, obj2, {tidy:1}))
    })

    ensure('ensure options.tidy off is working. output should contain an undefined key', function(cb){
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

    ensure('ensure deltaToNext 5 sec is not more than 5000', function(cb){
        var d = new Date()
        cb(null, time.deltaToNext(0, d.getHours(), d.getMinutes(), d.getSeconds()+5, d.getMilliseconds()))
    })

    ensure('ensure timeOfNext 2days 9am is Xxx, D+2 MM YYYY 09:00:00 GMT', function(cb){
        cb(null, (new Date(time.timeOfNext(2, 9))).toUTCString())
    })

    ensure('ensure codec encode string "{"data":123}" and decode to the same', function(cb){
        var
        data = JSON.stringify({data:123}),
        key = parseInt('100007900715391')
        cb(null, str.codec(key, str.codec(key, data)))
    })
}
