var pico=require('../../bin/pico-cli')

pico.run({
	ajax:pico.ajaxMock(__dirname),
	onLoad:function(cb){
		cb()
	},
	env:{
	},
	paths:{
	}
},
function(){
	var
		{test}=require('pico/test'),
		modAttach=require('./modAttach'),
		modClass=require('./modClass'),
		modFunc=require('./modFunc'),
		modOverride=require('./modOverride'),
		modUndefined=require('./modUndefined')

	return function(){
		test('ensure amd return attached object and node.js obj, modAttach:node',function(cb){
			cb(null, modAttach.a())
		})
		test('ensure amd return attached object with circular dependency, modClass',function(cb){
			cb(null, modAttach.b())
		})
		test('ensure amd return class, modClass',function(cb){
			cb(null, (new modClass).a())
		})
		test('ensure amd return class, with circular dependency, modAttach:node',function(cb){
			cb(null, (new modClass).b())
		})
		test('ensure amd return function and require json module,[ modFunc, json]',function(cb){
			cb(null, modFunc())
		})
		test('ensure amd return override obj, modOverride',function(cb){
			cb(null, modOverride.a())
		})
		test('ensure amd able to parse text module',function(cb){
			cb(null, modOverride.desc())
		})
		test('ensure amd attempt to load undefined mod without exception, null',function(cb){
			cb(null, modUndefined)
		})
	}
})
