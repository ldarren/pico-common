const pico = require('../bin/pico-cli')
const pArr = pico.export('pico/arr')
const { parallel } = pico.export('pico/test')

parallel('\npico/arr', function(){

	this.test('diff', function(cb){
		var arr1 = [2,5,6]
		var arr2 = [5,7,1]

		var diff = pArr.diff(arr1, arr2)
		var add = diff[0]
		var rem = diff[1]
		if (!add.includes(7)) return cb(null, false)
		if (!add.includes(1)) return cb(null, false)
		if (!rem.includes(2)) return cb(null, false)
		if (!rem.includes(6)) return cb(null, false)

		diff = pArr.diff(arr2, arr1)
		add = diff[0]
		rem = diff[1]
		if (!add.includes(2)) return cb(null, false)
		if (!add.includes(6)) return cb(null, false)
		if (!rem.includes(7)) return cb(null, false)
		if (!rem.includes(1)) return cb(null, false)
		return cb(null, true)
	})

	this.test('eq basic', function(cb){
		var arr1 = [2,5,6]
		var arr2 = [5,7,1]

		var eq = pArr.eq(arr1, arr2)
		if (eq) return cb(null, false)

		eq = pArr.diff(arr1, [6, 5, 2])
		if (!eq) return cb(null, false)
		return cb(null, true)
	})

	this.test('eq nested', function(cb){
		var arr1 = [2,5,['a', 'c']]
		var arr2 = [['a', 'd'], 5, 2]

		var eq = pArr.eq(arr1, arr2)
		if (eq) return cb(null, false)

		eq = pArr.diff(arr1, [2, ['a', 'c'], 5])
		if (!eq) return cb(null, false)
		return cb(null, true)
	})
})
