const globalKeys = Object.keys(global)
const pico = require('../bin/pico-cli')
const {setup, series, parallel, test} = pico.export('pico/test')

parallel('pico/test parallel', function() {
	this.begin(next => {
		next(null, ['hel', 'wor'])
	})
	this.begin((param1, param2, next) => {
		next(null, [param1+'lo', param2+'ld'])
	})
	this.before((param1, param2, next) => {
		const rand = Math.random().toString(36).substr(2, 4)
		next(null, [param1+rand, param2+rand, rand])
	})
	this.before((param1, param2, rand1, next) => {
		const rand = Math.random().toString(36).substr(2, 4)
		next(null, [param1+rand, param2+rand, rand1, rand])
	})
	this.after((param1, param2, rand1, rand2, next) => {
		next(null, [param1.substr(0, param1.length-4), param2.substr(0, param2.length-4), rand2])
	})
	this.after((param1, param2, rand2, next) => {
		next(null, [param1.substr(0, param1.length-4), param2.substr(0, param2.length-4)])
	})
	this.end((param1, param2, next) => {
		if (param1 !== 'hello' || param2 !== 'world') return next('begin value got midified!')
		next()
	})
	this.end((param1, param2, next) => {
		if (param1 !== 'hello' || param2 !== 'world') return next('begin value got midified!')
		next()
	})

	this.test('parallel 1 test 1', (param1, param2, rand1, rand2, next) => {
		setTimeout(() => {
			next(null, param1 === 'hello'+rand1+rand2 && param2 === 'world'+rand1+rand2)
		}, 1000 * Math.random())
	})
	this.test('parallel 1 test 2', (param1, param2, rand1, rand2, next) => {
		setTimeout(() => {
			next(null, param1 === 'hello'+rand1+rand2 && param2 === 'world'+rand1+rand2)
		}, 1000 * Math.random())
	})
	this.test('parallel 1 test 3', (param1, param2, rand1, rand2, next) => {
		setTimeout(() => {
			next(null, param1 === 'hello'+rand1+rand2 && param2 === 'world'+rand1+rand2)
		}, 1000 * Math.random())
	})
	this.series('parallel 1 series 1', function(){
		this.test('parallel 1 series 1 test 1', (next) => {
			setTimeout(() => {
				next(null, true)
			}, 300 * Math.random())
		})
		this.test('parallel 1 series 1 test 2', (next) => {
			setTimeout(() => {
				next(null, true)
			}, 300 * Math.random())
		})
		this.test('parallel 1 series 1 test 3', (next) => {
			setTimeout(() => {
				next(null, true)
			}, 300 * Math.random())
		})
	})
})
series('pico/test series', function() {
	this.begin(next => {
		next(null, ['hel', 'wor'])
	})
	this.begin((param1, param2, next) => {
		next(null, [param1+'lo', param2+'ld'])
	})
	this.before((param1, param2, next) => {
		const rand = Math.random().toString(36).substr(2, 4)
		next(null, [param1+rand, param2+rand, rand])
	})
	this.before((param1, param2, rand1, next) => {
		const rand = Math.random().toString(36).substr(2, 4)
		next(null, [param1+rand, param2+rand, rand1, rand])
	})
	this.after((param1, param2, rand1, rand2, next) => {
		next(null, [param1.substr(0, param1.length-4), param2.substr(0, param2.length-4), rand2])
	})
	this.after((param1, param2, rand2, next) => {
		next(null, [param1.substr(0, param1.length-4), param2.substr(0, param2.length-4)])
	})
	this.end((param1, param2, next) => {
		if (param1 !== 'hello' || param2 !== 'world') return next('begin value got midified!')
		next()
	})
	this.end((param1, param2, next) => {
		if (param1 !== 'hello' || param2 !== 'world') return next('begin value got midified!')
		next()
	})

	this.test('series 1 test 1', (param1, param2, rand1, rand2, next) => {
		setTimeout(() => {
			next(null, param1 === 'hello'+rand1+rand2, param2 === 'world'+rand1+rand2)
		}, 1000 * Math.random())
	})
	this.test('series 1 test 2', (param1, param2, rand1, rand2, next) => {
		setTimeout(() => {
			next(null, param1 === 'hello'+rand1+rand2, param2 === 'world'+rand1+rand2)
		}, 1000 * Math.random())
	})
	this.test('series 1 test 3', (param1, param2, rand1, rand2, next) => {
		setTimeout(() => {
			next(null, param1 === 'hello'+rand1+rand2, param2 === 'world'+rand1+rand2)
		}, 1000 * Math.random())
	})
	this.parallel('series 1 parallel 1', function(){
		this.test('series 1 parallel 1 test 1', (next) => {
			setTimeout(() => {
				next(null, true)
			}, 300 * Math.random())
		})
		this.test('series 1 parallel 1 test 2', (next) => {
			setTimeout(() => {
				next(null, true)
			}, 300 * Math.random())
		})
		this.test('series 1 parallel 1 test 3', (next) => {
			setTimeout(() => {
				next(null, true)
			}, 300 * Math.random())
		})
	})
})
