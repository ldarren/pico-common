var
pico=require('./pico'),
web= pico.export('pico/web'),
obj= pico.export('pico/obj'),
str= pico.export('pico/str'),
time= pico.export('pico/time'),
test= pico.export('pico/test'),
_=pico.define('underscore',function(exports,require,module,define,inherit,pico){
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
		var testMod345=pico.export('testMod345')
		cb(null, 345===testMod345.value)
	})
})

ensure('ensure pico.reload does js hot-loading', function(cb){
	pico.reload('testMod345', "return {value:789}", function(err){
		if (err) return cb(err)
		var testMod345=pico.export('testMod345')
		cb(null, 789===testMod345.value)
	})
})

ensure('ensure pico.reload does text hot-loading', function(cb){
	var
	testMod=pico.define('testMod.txt','Hello there'),
	newText='Hello yourself'
	pico.reload('testMod.txt', newText, function(err){
		if (err) return cb(err)
		testMod=pico.export('testMod.txt')
		cb(null, newText===testMod)
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

ensure('compare extend to assign performance', function(cb){
	var
	obj1 = {k1:1,k2:2,k3:3},
	obj2 = {v1:1,v2:2,v3:3},
    t=Date.now(),
    t1,t2

    for(var i=0; i<10000; i++){
        obj.extend(obj1,obj2)
    }
    t1=Date.now()-t

	obj1 = {k1:1,k2:2,k3:3}
    t=Date.now()

    for(var i=0; i<10000; i++){
        Object.assign(obj1,obj2)
    }
    t2=Date.now()-t

	cb(null, [t1,t2])
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

ensure('ensure obj.parseInts is working, ["1", "2"] should parse to [1, 2]', function(cb){
	cb(null, obj.parseInts(['1','2']))
})

ensure('ensure obj.group is working, group [{key:1,value:1},{key:2,value:2},{key:1,value:3}] by key', function(cb){
	cb(null, obj.group([{key:1,value:1},{key:2,value:2},{key:1,value:3}],'key'))
})

ensure('ensure deltaToNext 5 sec is not more than 5000', function(cb){
	var d = new Date()
	cb(null, time.deltaToNext(0, d.getHours(), d.getMinutes(), d.getSeconds()+5, d.getMilliseconds()))
})

ensure('ensure timeOfNext 2days 9am is Xxx, D+2 MM YYYY 09:00:00 GMT', function(cb){
	cb(null, (new Date(time.timeOfNext(2, 9))).toUTCString())
})

var cron='5-20/6 */9 5/5 6/3 6-0 *'
ensure(`ensure parse cron(${cron}) correctly`, function(cb){
	cb(null, time.parse(cron))
})
ensure('ensure get nearest cron(MIN HR DOM MON DOW YR) correctly', function(cb){
	cb(null, (new Date(time.nearest(...time.parse(cron)))).toUTCString())
})
ensure('ensure weeknum of 1/Mar/2016 is 9', function(cb){
	cb(null, (time.weeknum(new Date(2016,0,1,0,0,0))))
})
ensure('ensure yesterday is yesterday', function(cb){
	cb(null, (time.day(new Date(time.timeOfNext(-1)))))
})

ensure('ensure codec encode string "{"data":123}" and decode to the same', function(cb){
	var
	data = JSON.stringify({data:123}),
	key = parseInt('100007900715391')
	cb(null, str.codec(key, str.codec(key, data)))
})
ensure('ensure hash password "password123" to 32bit int', function(cb){
	cb(null, str.hash('password123'))
})
ensure('ensure left pad 8 for a number', function(cb){
	cb(null, str.pad(19,8))
})
ensure('ensure str.log works', function(cb){
	str.log('str.log test')
	cb(null, true)
})
ensure('ensure str.error works', function(cb){
	str.error('str.error test')
	cb(null, true)
})
