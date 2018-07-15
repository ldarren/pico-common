const pico = require('../bin/pico-cli')
const ptime = pico.export('pico/time')
const { setup, test, series, parallel } = pico.export('pico/test')

const cron='5-20/6 */9 5/5 6/3 6-0 *'
parallel('pico/time', function(){
	this.test(`ensure parse cron(${cron}) correctly`, function(cb){
		cb(null, ptime.parse(cron))
	})
	this.test('ensure get nearest cron(MIN HR DOM MON DOW YR) correctly', function(cb){
		cb(null, (new Date(ptime.nearest(...ptime.parse(cron)))).toUTCString())
	})
	this.test('ensure weeknum of 1/Mar/2016 is 9', function(cb){
		cb(null, 9===ptime.weeknum(new Date(2016,2,1,0,0,0)))
	})
})
