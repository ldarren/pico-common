var
web= require('pico/web'),
obj= require('pico/obj'),
str= require('pico/str'),
time= require('pico/time'),
test= require('pico/test'),
_=define('underscore',function(exports,require,module,define,inherit,pico){
(function() {
  var root = this;

  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  _.VERSION = '1.8.3';

  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));
})

this.load=function(){
    var ensure=test.ensure

    ensure('ensure pico has loaded correctly', function(cb){
        cb(null, obj !== undefined)
    })

    ensure('ensure underscore loaded correctly, VER should be 1.8.3',function(cb){
        //cb(null, require('backbone').VERSION)
        cb(null, _.VERSION)
    })

    ensure('ensure pico preprocessors and env work', function(cb){
        pico.run({
            preprocessors:{
                '.md':function(){return 1}
            },
            env:{
                cb:cb
            }
        },function(){
            var md=require('README.md')
            this.load=function(){
                pico.env('cb')(null, md===1)
            }
        })
    })

    ensure('ensure pico.parse function text to module', function(cb){
        pico.parse('testMod123', "return {value:123}", function(err, mod){
            if (err) return cb(err)
            cb(null, 123===mod.value)
        })
    })

    ensure('ensure pico.parse define text to module', function(cb){
        pico.parse(null, "define('testMod345',function(){return {value:345}})", function(err){
            if (err) return cb(err)
            var testMod345=require('testMod345')
            cb(null, 345===testMod345.value)
        })
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
        obj1 = [1,2],
        obj2 = [2,3]

        cb(null, obj.extend(obj1, obj2, {mergeArr:1}))
    })

    ensure('ensure options.mergeArr off is working. output should contain[2,3] list', function(cb){
        var
        obj1 = [1,2],
        obj2 = [2,3]

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

    ensure('ensure str.log works', function(cb){
        str.log('str.log test')
        cb(null, true)
    })

    ensure('ensure str.error works', function(cb){
        str.error('str.error test')
        cb(null, true)
    })
}
