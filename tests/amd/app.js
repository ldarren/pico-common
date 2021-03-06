var
	fs=require('fs'),
	pico=require('../bin/pico-cli')

pico.run({
	ajax:function(method, url, params, headers, cb, userData){
		fs.readFile(url, {encoding:'utf8'}, function(err, txt){
			if (err) return cb(err,2,null,userData)
			cb(null,4,txt,userData)
		})
	},
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
		ensure=require('pico/test').ensure,
		modAttach=require('./modAttach'),
		modClass=require('./modClass'),
		modFunc=require('./modFunc'),
		modOverride=require('./modOverride')

	return function(){
		ensure('ensure amd return attached object and node.js obj, modAttach:node',function(cb){
			cb(null, modAttach.a())
		})
		ensure('ensure amd return attached object with circular dependency, modClass',function(cb){
			cb(null, modAttach.b())
		})
		ensure('ensure amd return class, modClass',function(cb){
			cb(null, (new modClass).a())
		})
		ensure('ensure amd return class, with circular dependency, modAttach:node',function(cb){
			cb(null, (new modClass).b())
		})
		ensure('ensure amd return function and require json module,[ modFunc, json]',function(cb){
			cb(null, modFunc())
		})
		ensure('ensure amd return override obj, modOverride',function(cb){
			cb(null, modOverride.a())
		})
		ensure('ensure amd able to parse text module',function(cb){
			cb(null, modOverride.desc())
		})
	}
})
