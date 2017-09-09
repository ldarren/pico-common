const
globalKeys=Object.keys(global),
pico=require('./bin/pico-cli'),
web= pico.export('pico/web'),
obj= pico.export('pico/obj'),
str= pico.export('pico/str'),
time= pico.export('pico/time'),
ensure= pico.export('pico/test').ensure

ensure('ensure pico has loaded correctly', function(cb){
	cb(null, obj !== undefined)
})
ensure('ensure pico properties no leak', function(cb){
	cb(null, globalKeys.length === Object.keys(global).length)
})

ensure('ensure inherit work with child(obj) and ancestor(obj)', function(cb){
	pico.define('ancestor0',function(exports,require,module,define,inherit,pico){return {say:function(txt){return txt}}})
	pico.parse('child0', "inherit('ancestor0'); return {bark:function(){return this.say('hello')}}",function(err, child){
		if (err) return cb(err)
		cb(null, 'hello'===child.bark())
	})
})
ensure('ensure inherit work with child(function) and ancestor(obj)', function(cb){
	pico.parse('child1', "inherit('ancestor0'); function Child(){this.postfix='child'}; Child.prototype={bark:function(){return this.say(this.postfix)}}; return Child",function(err, child){
		if (err) return cb(err)
		cb(null, 'child'===(new child).bark())
	})
})
ensure('ensure inherit work with child(obj) and ancestor(function)', function(cb){
	pico.define('ancestor2',function(exports,require,module,define,inherit,pico){function Ancestor(){this.prefix='ancestor'}; Ancestor.prototype={say:function(txt){return txt}}; return Ancestor;})
	var child=pico.define('child2',function(exports,require,module,define,inherit,pico){inherit('ancestor2'); return {bark:function(){return this.say(this.prefix)}}})
	cb(null, 'ancestor'===(new child).bark())
})
ensure('ensure inherit work with child(function) and ancestor(function)', function(cb){
	pico.parse('child3', "inherit('ancestor2'); function Child(){Child.__super__.constructor();this.postfix='child'}; Child.prototype={bark:function(){return this.say(this.prefix+this.postfix)}}; return Child",function(err, child){
		if (err) return cb(err)
		cb(null, 'ancestorchild'===(new child).bark())
	})
})
ensure('ensure extend work with child(obj) and ancestor(function)', function(cb){
	pico.parse('child4', "return {bark:function(){return this.say(this.prefix)}}",function(err, child){
		if (err) return cb(err)
		var ancestor=pico.export('ancestor2')
		cb(null, 'ancestor'===(new (ancestor.extend(child))).bark())
	})
})
ensure('ensure extend work with child(function) and ancestor(function)', function(cb){
	pico.parse('child5', "function Child(){Child.__super__.constructor();this.postfix='child'}; Child.prototype={bark:function(){return this.say(this.prefix+this.postfix)}}; return Child",function(err, child){
		if (err) return cb(err)
		var ancestor=pico.export('ancestor2')
		cb(null, 'ancestorchild'===(new (ancestor.extend(child))).bark())
	})
})

ensure('ensure underscore can be loaded',function(cb){
	const 
	V='1.8.3',
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

		  _.VERSION = V;

		  if (typeof define === 'function' && define.amd) {
			define('underscore', [], function() {
			  return _;
			});
		  }
		}.call(this));
	})
	cb(null, V===_.VERSION)
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
		return function(){
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
	pico.parse('ScriptA','return {a:function(){return "hello world"}}',function(err,mod){
		if (err) return console.error(err)
		pico.reload('ScriptA','return {a:function(){return "hot reload"}}',function(err){
			if (err) return console.error(err)
			var scriptA=pico.export('ScriptA')
			cb(null,'hot reload'===scriptA.a())
		})
	})
})

ensure('ensure pico.reload does text hot-loading', function(cb){
	var
	name='testMod.txt',
	newText='Hello yourself'
	pico.parse(name,'Hello there',function(err,mod){
		if (err) return console.error(err)
		pico.reload(name, newText, function(err, mod){
			if (err) return cb(err)
			cb(null, newText===pico.export(name))
		})
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
ensure('ensure function extended properly', function(cb){
	var
	obj1 = {func:function(){return 1}},
	obj2 = {func:function(){return arguments.callee.prototype()}},
	obj3 = {},
	obj4 = obj.extend(obj3,obj1,obj2)

	cb(null, obj1.func()===obj4.func())
})

ensure('ensure obj.parseInts is working, ["1", "2"] should parse to [1, 2]', function(cb){
	cb(null, obj.parseInts(['1','2']))
})

ensure('ensure obj.jsonpath work', function(cb){
	var json = {
		store: {
			book: [
				{price: 10},
				{price: 20},
				{price: 30},
				{price: 40}
			],
			bycycle: [
				{price: 50},
				{price: 60},
				{price: 70},
				{price: 80}
			]
		}
	}
	var total = 0
	obj.jsonpath(json)('*')('>|','price')((price)=>{total+=price; return price})()
	cb(null, total === 360)
})

var cron='5-20/6 */9 5/5 6/3 6-0 *'
ensure(`ensure parse cron(${cron}) correctly`, function(cb){
	cb(null, time.parse(cron))
})
ensure('ensure get nearest cron(MIN HR DOM MON DOW YR) correctly', function(cb){
	cb(null, (new Date(time.nearest(...time.parse(cron)))).toUTCString())
})
ensure('ensure weeknum of 1/Mar/2016 is 9', function(cb){
	cb(null, 9===time.weeknum(new Date(2016,2,1,0,0,0)))
})

ensure('ensure left pad 8 for a number', function(cb){
	cb(null, '00000019'===str.pad(19,8))
})
ensure('ensure str.log works', function(cb){
	str.log(null,'str.log','test')
	cb(null, true)
})
ensure('ensure str.error works', function(cb){
	str.error(arguments.callee,'str.error','test')
	cb(null, true)
})
ensure('ensure str.template works', function(cb){
	const
	tmpl=str.template('<%d.text%>'),
	obj={text:'Hello World'}

	cb(null, obj.text===tmpl(obj))
})
ensure('ensure str.template mix well with js', function(cb){
	const tmpl=str.template('<%for(var i=0; i<5; i++){%>1<%}%>')
	cb(null, '11111'===tmpl())
})
ensure('ensure restful params parser supported: url/v%version/pushPackage/:pushId',function(cb){
	var
	route='url/v%version/pushPackage/:pushId',
	build=str.compileRest(route),
	params={},
	api=str.execRest('url/v1/pushPackage/web.com.domain.app',build,params)
	cb(null, api===route && 1===params.version && 'web.com.domain.app'===params.pushId)
})
ensure('ensure restful wildcard parser supported: url/ver%version/path/#path',function(cb){
	var
	route='url/ver%version/path/#path',
	build=str.compileRest(route),
	params={},
	api=str.execRest('url/ver1/path/web/com/domain/app',build,params)

	cb(null, api===route && 1===params.version && 'web/com/domain/app'===params.path)
})
ensure('ensure restful multiple build supported: /:appName|#appPath',function(cb){
	var
	route='/:appName|#appPath',
	build=str.compileRest('ERR|*msg'),
	params={}

	str.compileRest(route, build)

	var api=str.execRest('/msair',build,params)
	cb(null, api===route && 'msair'===params.appName)
})
ensure('ensure restful optional parser: url/v%version|device/:deviceToken|path/#path',function(cb){
	var
	route='url/v%version|device/:deviceToken|path/#path',
	build=str.compileRest(route),
	params={},
	api=str.execRest('url/v1/device/ab45/path/web/com/domain/app',build,params)
	if(api!==route || 1!==params.version || 'ab45'!==params.deviceToken || 'web/com/domain/app'!==params.path) return cb(null, false)
	params={}
	api=str.execRest('url/v1/device/ab45',build,params)
	if(api!==route || 1!==params.version || 'ab45'!==params.deviceToken) return cb(null, false)
	params={}
	api=str.execRest('url/v1',build,params)
	if(api!==route || 1!==params.version) return cb(null, false)
	cb(null, true)
})
ensure('ensure restful optional parser2: /:appName|#appPath',function(cb){
	var
	route='/:appName|#appPath',
	build=str.compileRest(route),
	params={},
	api=str.execRest('/msair',build,params)
	cb(null, api===route && 'msair'===params.appName)
})
ensure('ensure codec encode string "{"data":123}" and decode to the same', function(cb){
	var
	data = JSON.stringify({data:123}),
	key = parseInt('100007900715391')
	cb(null, data===str.codec(key, str.codec(key, data)))
})
ensure('ensure codec work on time based string', (cb)=>{
	const
	key='00mjvyn50022oq0000zbpt6c000014k2',
	secret='3zuklpkl6k905e5kryoiozuxrkjhunr26vjnlaao',
	now=Math.floor(Date.now()/(5*60*1000)),
	hash=now+str.hash(secret),
	token=str.codec(hash,key)
	cb(null, key===str.codec(key, str.codec(hash, token)))
})
ensure('ensure hash password to 32bit int', function(cb){
	cb(null, str.hash('免费服务会立即翻译英文和英文之间的单词'))
})
ensure('ensure hash dont collide in repeating char x9999', function(cb){
	var
	s='p',
	hist=[],
	l=9999,
	n=Date.now()
	for(var i=0,h; i<l; i++){
		h=str.hash(s)
		if (~hist.indexOf(h)) break
		hist.push(h)
		s+='p'
	}
	console.log('perf',Date.now()-n,hist.length)
	cb(null, l===hist.length)
})
ensure('ensure hash dont collide in uuid x99999', function(cb){
	var
	uuid=require('uuid/v4'),
	hist=[],
	l=99999,
	n=Date.now()
	for(var i=0,h; i<l; i++){
		h=str.hash(uuid())
		if (~hist.indexOf(h)) break
		hist.push(h)
	}
	console.log('perf',Date.now()-n,hist.length)
	cb(null, l===hist.length)
})
