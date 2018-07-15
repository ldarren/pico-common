const pico = require('../bin/pico-cli')
const { setup, test, series, parallel } = pico.export('pico/test')

parallel('pico', function(){
/*
	this.test('ensure pico preprocessors and env work', function(cb){
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
*/
	this.test('ensure pico.parse function text to module', function(cb){
		pico.parse('testMod123', "return {value:123}", function(err, mod){
			if (err) return cb(err)
			cb(null, 123===mod.value)
		})
	})

	this.test('ensure pico.parse define text to module', function(cb){
		pico.parse(null, "define('testMod345',function(){return {value:345}})", function(err){
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
