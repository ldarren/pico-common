const pico = require('../bin/pico-cli')
const ptime = pico.export('pico/time')
const { parallel } = pico.export('pico/test')

const cron='5-20/6 */9 5/5 6/3 6-0 *'
parallel('\npico/time', function(){
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
	this.test('ensure daynum from 1/Mar/2016 to 30/Oct/2020 is 1704', function(cb){
		cb(null, 1704===ptime.daynum('2020-10-30', '2016-03-01T00:00:00Z'))
	})
	this.test('ensure weeknum of 1/Mar/2016 is 9', function(cb){
		cb(null, 9===ptime.weeknum(new Date(2016,2,1)))
	})
	this.test('ensure day() return user friendly day', function(cb){
		var now = new Date(2020, 9, 30, 18, 10, 0)
		var ytt = [ -1, 0, 1, {weekday:'short'}, {day: 'numeric'}]

		if (0 !== ptime.day(new Date(2020, 9, 30, 21), null, ytt, now)) return cb(null, false)
		if (-1 !== ptime.day(new Date(2020, 9, 29, 21), null, ytt, now)) return cb(null, false)
		if (1 !== ptime.day(new Date(2020, 9, 31, 21), null, ytt, now)) return cb(null, false)
		if ('Wed' !== ptime.day(new Date(2020, 9, 28, 21), null, ytt, now)) return cb(null, false)
		cb(null, '4' === ptime.day(new Date(2020, 10, 4, 21), null, ytt, now))
	})
	this.test('ensure date convert work', function(cb){
		var time = (new Date('Oct 31 20')).getTime()
		var formats = ['D-M-Y', 'D/M/Y', 'Y M D']
		if (time !== ptime.convert('31-10-20', formats).getTime()) return cb(null, false)
		if (time !== ptime.convert('31/10/20', formats).getTime()) return cb(null, false)
		if (time !== ptime.convert('2020 10 31', formats).getTime()) return cb(null, false)
		cb(null, (new Date('Oct 31 20 01:01:01')).getTime() === ptime.convert('2020 Oct 31, 01:01:01.000', formats).getTime())
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
	this.test('ensure get nearest return date correctly with hr = 24 with dow presented', function(cb){
		const parsed = ptime.parse(cron)
		let ret = ptime.nearest(...parsed, new Date(2020, 8, 23, 19, 30, 30)) === (new Date(2020, 8, 24, 0, 5)).getTime()
		cb(null, ret)
	})
})
