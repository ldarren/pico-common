const pico = require('../bin/pico-cli')
const pfunc = pico.export('pico/func')
const { setup, test, series, parallel } = pico.export('pico/test')

parallel('pico/func', function(){
	this.test('ensure func.reflect works correctly', function callee(cb){
		const f = pfunc.reflect() 
		cb(null, 'callee' === f.functionName)
	})
	this.test('ensure func.reflect able to skip caller', function callee(cb){
		function callee2(){
			return pfunc.reflect(callee2)
		}
		const f = callee2()
		cb(null, 'callee' === f.functionName)
	})
	this.test('ensure func.reflect create trace based on limit', function callee(cb){
		const limit = 5
		const f = pfunc.reflect(null, limit) 
		cb(null, limit === f.trace.length)
	})
})
