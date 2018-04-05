const globalKeys = Object.keys(global)
const pico = require('./bin/pico-cli')
const pobj = pico.export('pico/obj')
const pjson = pico.export('pico/json')
const pstr = pico.export('pico/str')
const ptime = pico.export('pico/time')
const { setup, ensure } = pico.export('pico/test')

setup({
	stdout: true,
	callback: function(output){
		//console.log(JSON.stringify(output))
	},
	//fname: 'test_result.json'
})

ensure('ensure pico has loaded correctly', function(cb){
	cb(null, pobj !== undefined)
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
	pico.parse('child3', "inherit('ancestor2'); function Child(){this.__proto__.constructor();this.postfix='child'}; Child.prototype={bark:function(){return this.say(this.prefix+this.postfix)}}; return Child",function(err, child){
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
	pico.parse('child5', "function Child(){this.__proto__.constructor();this.postfix='child'}; Child.prototype={bark:function(){return this.say(this.prefix+this.postfix)}}; return Child",function(err, child){
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
		if (err) return cb(err)
		pico.reload('ScriptA','return {a:function(){return "hot reload"}}',function(err){
			if (err) return cb(err)
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
		if (err) return cb(err)
		pico.reload(name, newText, function(err, mod){
			if (err) return cb(err)
			cb(null, newText===pico.export(name))
		})
	})
})

ensure('ensure object.extend compatible with pico module', function(cb){
	function a(){}
	a.__proto__ = {
	  slots: {
		slotA(){ return 1 },
		slotC(){ return 3 }
	  }
	}
	function b(){}
	b.__proto__ = {
	  slots: {
		slotB(){ return 2 },
		slotC: function slotC(){ return 1 + slotC.prototype.call() },
	  }
	}

	const res = pobj.extend(pobj.extend({}, a), b)

	cb(null, 1 === res.slots.slotA() && 2 === res.slots.slotB() && 4 ===  res.slots.slotC())
})

ensure('ensure obj2 override obj1. output value of key1 should be 2', function(cb){
	var out = pobj.extend({key1:1},{key1:2})

	cb(null, 2 === out.key1)
})

ensure('ensure obj1 merges with obj2. output should contain key1 and key2', function(cb){
	var out = pobj.extend({key1:1},{key2:2})

	cb(null, !!out.key1 && !!out.key2)
})

ensure('compare extend to assign performance', function(cb){
	var
	obj1 = {k1:1,k2:2,k3:3},
	obj2 = {v1:1,v2:2,v3:3},
    t=Date.now(),
    t1,t2

    for(var i=0; i<10000; i++){
        Object.assign(obj1,obj2)
    }
    t1=Date.now()-t

	obj1 = {k1:1,k2:2,k3:3}
    t=Date.now()

    for(var i=0; i<10000; i++){
        pobj.extend(obj1,obj2)
    }
    t2=Date.now()-t

	cb(null, [t1,t2])
})

ensure('ensure options.tidy on is working. output should not contain any undefined key', function(cb){
	var out = pobj.extend({key1:1}, {key2:void 0}, {tidy:1})

	cb(null, 1 === Object.keys(out).length)
})

ensure('ensure options.tidy off is working. output should contain an undefined key', function(cb){
	var out = pobj.extend({key1:1}, {key2:void 0})

	cb(null, 2 ===  Object.keys(out).length)
})

ensure('ensure options.mergeArr on is working. output should contain[1,2,3] list', function(cb){
	var out = pobj.extend([1,2], [2,3], {mergeArr:1})

	cb(null, JSON.stringify([1,2,3]) === JSON.stringify(out))
})

ensure('ensure options.mergeArr off is working. output should contain[2,3] list', function(cb){
	var out = pobj.extend([1,2], [2,3])

	cb(null, JSON.stringify([2,3]) === JSON.stringify(out))
})
ensure('ensure function extended properly', function(cb){
	var
	obj1 = {func:function(){return 1}},
	obj2 = {func:function(){return arguments.callee.prototype()}},
	obj3 = {},
	obj4 = pobj.extend(obj3,obj1,obj2)

	cb(null, obj1.func()===obj4.func())
})

ensure('ensure obj.parseInts is working, ["1", "2"] should parse to [1, 2]', function(cb){
	var out = pobj.parseInts(['1','2'])
	cb(null, JSON.stringify([1,2])===JSON.stringify(out))
})

ensure('ensure json.path work', function(cb){
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
	pjson.path(json)('..','price')((price)=>{total+=price; return price})()
	cb(null, 360 === total)
})

var cron='5-20/6 */9 5/5 6/3 6-0 *'
ensure(`ensure parse cron(${cron}) correctly`, function(cb){
	cb(null, ptime.parse(cron))
})
ensure('ensure get nearest cron(MIN HR DOM MON DOW YR) correctly', function(cb){
	cb(null, (new Date(ptime.nearest(...ptime.parse(cron)))).toUTCString())
})
ensure('ensure weeknum of 1/Mar/2016 is 9', function(cb){
	cb(null, 9===ptime.weeknum(new Date(2016,2,1,0,0,0)))
})

ensure('ensure left pad 8 for a number', function(cb){
	cb(null, '00000019'===pstr.pad(19,8))
})
ensure('ensure str.log works', function(cb){
	pstr.log(null,'str.log','test')
	cb(null, true)
})
ensure('ensure str.error works', function(cb){
	pstr.error(arguments.callee,'str.error','test')
	cb(null, true)
})
ensure('ensure str.template works', function(cb){
	const
	tmpl=pstr.template('<%d.text%>'),
	obj={text:'Hello World'}

	cb(null, obj.text===tmpl(obj))
})
ensure('ensure str.template mix well with js', function(cb){
	const tmpl=pstr.template('<%for(var i=0; i<5; i++){%>1<%}%>')
	cb(null, '11111'===tmpl())
})
ensure('ensure restful params parser supported: url/v%version/pushPackage/:pushId',function(cb){
	var
	route='url/v%version/pushPackage/:pushId',
	build=pstr.compileRest(route),
	params={},
	api=pstr.execRest('url/v1/pushPackage/web.com.domain.app',build,params)
	cb(null, api===route && 1===params.version && 'web.com.domain.app'===params.pushId)
})
ensure('ensure restful wildcard parser supported: url/ver%version/path/#path',function(cb){
	var
	route='url/ver%version/path/#path',
	build=pstr.compileRest(route),
	params={},
	api=pstr.execRest('url/ver1/path/web/com/domain/app',build,params)

	cb(null, api===route && 1===params.version && 'web/com/domain/app'===params.path)
})
ensure('ensure restful multiple build supported: /:appName|#appPath',function(cb){
	var
	route='/:appName|#appPath',
	build=pstr.compileRest('ERR|*msg'),
	params={}

	pstr.compileRest(route, build)

	var api=pstr.execRest('/msair',build,params)
	cb(null, api===route && 'msair'===params.appName)
})
ensure('ensure restful optional parser: url/v%version|device/:deviceToken|path/#path',function(cb){
	var
	route='url/v%version|device/:deviceToken|path/#path',
	build=pstr.compileRest(route),
	params={},
	api=pstr.execRest('url/v1/device/ab45/path/web/com/domain/app',build,params)
	if(api!==route || 1!==params.version || 'ab45'!==params.deviceToken || 'web/com/domain/app'!==params.path) return cb(null, false)
	params={}
	api=pstr.execRest('url/v1/device/ab45',build,params)
	if(api!==route || 1!==params.version || 'ab45'!==params.deviceToken) return cb(null, false)
	params={}
	api=pstr.execRest('url/v1',build,params)
	if(api!==route || 1!==params.version) return cb(null, false)
	cb(null, true)
})
ensure('ensure restful optional parser2: /:appName|#appPath',function(cb){
	var
	route='/:appName|#appPath',
	build=pstr.compileRest(route),
	params={},
	api=pstr.execRest('/msair',build,params)
	cb(null, api===route && 'msair'===params.appName)
})
ensure('ensure codec encode string "{"data":123}" and decode to the same', function(cb){
	var
	data = JSON.stringify({data:123}),
	key = parseInt('100007900715391')
	cb(null, data===pstr.codec(key, pstr.codec(key, data)))
})
ensure('ensure codec work on time based string', (cb)=>{
	const
	key='00mjvyn50022oq0000zbpt6c000014k2',
	secret='3zuklpkl6k905e5kryoiozuxrkjhunr26vjnlaao',
	now=Math.floor(Date.now()/(5*60*1000)),
	hash=now+pstr.hash(secret),
	token=pstr.codec(hash,key)
	cb(null, key===pstr.codec(key, pstr.codec(hash, token)))
})
ensure('ensure hash password to 32bit int', function(cb){
	cb(null, pstr.hash('免费服务会立即翻译英文和英文之间的单词'))
})
ensure('ensure hash dont collide in repeating char x9999', function(cb){
	var
	s='p',
	hist=[],
	l=9999,
	n=Date.now()
	for(var i=0,h; i<l; i++){
		h=pstr.hash(s)
		if (~hist.indexOf(h)) break
		hist.push(h)
		s+='p'
	}
	cb(null, l===hist.length, 'count', hist.length, 'ms', Date.now() - n)
})
ensure('ensure hash dont collide in uuid x99999', function(cb){
	var
	hist=[],
	l=99999,
	n=Date.now()
	for(var i=0,h; i<l; i++){
		h=pstr.hash(pstr.rand())
		if (~hist.indexOf(h)) break
		hist.push(h)
	}
	cb(null, l===hist.length, 'count', hist.length, 'ms', Date.now() - n)
})
