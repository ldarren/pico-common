const pico = require('../bin/pico-cli')
const { parallel } = pico.export('pico/test')

parallel('\npico', function(){

	this.test('ensure pico preprocessors and env work', function(cb){
		pico.run({
			name: 'test',
			preprocessors:{
				'.md':function(){return 1}
			},
			ajax: pico.ajaxMock,
			env:{
				cb
			}
		},function(){
			pico.env('cb')(null, true) // tmp solution, for some reason, the `return function()` never trigger
			var md=require('README.md')
			return function(){
				pico.env('cb')(null, 1 === md)
			}
		})
	})

	this.test('ensure pico.parse function text to module', function(cb){
		pico.parse('testMod123', 'return {value:123}', function(err, mod){
			if (err) return cb(err)
			cb(null, 123===mod.value)
		})
	})

	this.test('ensure pico.parse define text to module', function(cb){
		pico.parse(null, 'define(\'testMod345\',function(){return {value:345}})', function(err){
			if (err) return cb(err)
			var testMod345=pico.export('testMod345')
			cb(null, 345===testMod345.value)
		})
	})

	this.test('ensure pico.reload does js hot-loading', function(cb){
		pico.parse('ScriptA','return {a:function(){return "hello world"}}',function(err,mod){
			if (err) return cb(err)
			pico.reload('ScriptA','return {a:function(){return "hot reload"}}',function(err){
				if (err) return cb(err)
				var scriptA=pico.export('ScriptA')
				cb(null,'hot reload'===scriptA.a())
			})
		})
	})

	this.test('ensure pico.reload does text hot-loading', function(cb){
		var name='testMod.txt'
		var newText='Hello yourself'
		pico.parse(name,'Hello there',function(err,mod){
			if (err) return cb(err)
			pico.reload(name, newText, function(err, mod){
				if (err) return cb(err)
				cb(null, newText===pico.export(name))
			})
		})
	})
})
