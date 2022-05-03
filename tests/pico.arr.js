const pico = require('../bin/pico-cli')
const pArr = pico.export('pico/arr')
const { parallel } = pico.export('pico/test')

parallel('\npico/arr', function(){

	this.test('diff', function(cb){
		var arr1 = [2,5,6]
		var arr2 = [7,1,5]

		var diff = pArr.diff(arr1, arr2)
		var rem = diff[0]
		var add = diff[1]
		if (7 !== add[0]) return cb(null, false)
		if (1 !== add[1]) return cb(null, false)
		if (!rem.includes(2)) return cb(null, false)
		if (!rem.includes(0)) return cb(null, false)

		diff = pArr.diff(arr2, arr1)
		rem = diff[0]
		add = diff[1]
		if (2 !== add[0]) return cb(null, false)
		if (6 !== add[2]) return cb(null, false)
		if (!rem.includes(0)) return cb(null, false)
		if (!rem.includes(1)) return cb(null, false)
		return cb(null, true)
	})

	this.test('diff with edge cases', function(cb){
		var arr = [2,5,6]

		var diff = pArr.diff(arr)
		var rem = diff[0]
		var add = diff[1]
		if (0 !== Object.keys(add).length) return cb(null, false)
		if (!rem.includes(2)) return cb(null, false)
		if (!rem.includes(1)) return cb(null, false)
		if (!rem.includes(0)) return cb(null, false)

		diff = pArr.diff(null, arr)
		rem = diff[0]
		add = diff[1]
		if (2 !== add[0]) return cb(null, false)
		if (5 !== add[1]) return cb(null, false)
		if (6 !== add[2]) return cb(null, false)
		if (0 !== rem.length) return cb(null, false)
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

	this.test('diff and eq', function(cb){
		var arr1 = [2,5,6]
		var arr2 = [5,7,1]

		var diff = pArr.diff(arr1, arr2)
		var rem = diff[0]
		var add = diff[1]

		var res = arr1.slice()
		rem.forEach(idx => res.splice(idx, 1))
		for (var idx in add) {
			res.splice(parseInt(idx), 0, add[idx])
		}

		return cb(null, pArr.eq(res, arr2))
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
