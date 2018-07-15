const pico = require('../bin/pico-cli')
const pjson = pico.export('pico/json')
const { setup, test, series, parallel } = pico.export('pico/test')

parallel('pico/json', function(){
	this.test('ensure json.path work', function(cb){
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
})
