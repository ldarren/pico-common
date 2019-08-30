const pico = require('../bin/pico-cli')
const ptime = pico.export('pico/time')
const { parallel } = pico.export('pico/test')

const cron='5-20/6 */9 5/5 6/3 6-0 *'
parallel('pico/time', function(){
	this.test(`ensure parse cron(${cron}) correctly`, function(cb){
		const parsed = ptime.parse(cron)
		function compare(a, b){
			return a.length === b.length && a.every(i => b.includes(i))
		}
		let ret = true && compare(parsed[0], [5, 11, 17])
		ret = ret && compare(parsed[1], [0, 9, 18])
		ret = ret && compare(parsed[2], [5, 10, 15, 20, 25, 30])
		ret = ret && compare(parsed[3], [6, 9, 12])
		ret = ret && compare(parsed[4], [0, 1, 2, 3, 4, 5, 6])
		ret = ret && parsed[5] === 0
		cb(null, ret, parsed)
	})
	this.test('ensure get nearest cron(MIN HR DOM MON DOW YR) correctly', function(cb){
		const parsed = ptime.parse(cron)
		const then = ptime.nearest(...parsed)
		let ret = then > Date.now()

		const t = new Date(then)
		ret = ret && parsed[0].includes(t.getMinutes())
		ret = ret && parsed[1].includes(t.getHours())
		ret = ret && parsed[4] ? true : parsed[2].includes(t.getDate())
		ret = ret && parsed[3].includes(t.getMonth()+1)
		ret = ret && parsed[4].includes(t.getDay())
		cb(null, ret)
	})
	this.test('ensure weeknum of 1/Mar/2016 is 9', function(cb){
		cb(null, 9===ptime.weeknum(new Date(2016,2,1,0,0,0)))
	})
	this.test('ensure "* * * * * *" return less than two min', function(cb){
		const diff = ptime.nearest(...ptime.parse('* * * * * *')) - Date.now()
		cb(null, diff < 2 * 60 * 1000 && diff > 0, diff)
	})
	this.test('ensure "* * * * * *" on last month day behave correctly', function(cb){
		const now = new Date(2019, 7, 31, 7, 8, 0)
		const diff = ptime.nearest(...ptime.parse('* * * * * *'), now.getTime()) - now
		cb(null, diff < 2 * 60 * 1000 && diff > 0, diff)
	})
	this.test('ensure "*/1 * * * * *" always round to nearest min, never return same min', function(cb){
		const parsed = ptime.parse('*/1 * * * * *')
		let ret = ptime.nearest(...parsed, Date.UTC(2018, 11, 11, 1, 22, 30)) === Date.UTC(2018, 11, 11, 1, 24)
		ret = ret && ptime.nearest(...parsed, Date.UTC(2018, 11, 11, 1, 22, 29)) === Date.UTC(2018, 11, 11, 1, 23)
		ret = ret && ptime.nearest(...parsed, Date.UTC(2018, 11, 11, 1, 23, 29)) === Date.UTC(2018, 11, 11, 1, 24)
		ret = ret && ptime.nearest(...parsed, Date.UTC(2018, 11, 11, 1, 23, 30)) === Date.UTC(2018, 11, 11, 1, 25)
		cb(null, ret)
	})
})
