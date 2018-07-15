const globalKeys = Object.keys(global)
const pico = require('../bin/pico-cli')
const { setup, test, series, parallel } = pico.export('pico/test')

setup({
	stdout: true,
	end: function(result){
		//console.log(JSON.stringify(result))
	},
	//fname: 'test_result.json'
})

test('ensure pico has loaded correctly', function(cb){
	cb(null, pico !== undefined)
})
test('ensure pico properties no leak', function(cb){
	cb(null, globalKeys.length === Object.keys(global).length)
})

require('./pico.amd.js')
require('./pico.json.js')
require('./pico.obj.js')
require('./pico.str.js')
require('./pico.test.js')
require('./pico.time.js')
