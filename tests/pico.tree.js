const pico = require('../bin/pico-cli')
const pTree = pico.export('pico/tree')
const { parallel } = pico.export('pico/test')

parallel('\npico/tree', function(){
	this.test('ensure tokenizer work', function(cb){
		const route = '/events/e:id/comments/:cid/*path'
		const tokens = []
		const normalized = pTree.tokenizer(route, tokens)

		cb(null,
			'/events/e:/comments/:/*' === normalized &&
			3 === tokens.length &&
			9 === tokens[0][0] &&
			'id' === tokens[0][1] &&
			20 === tokens[1][0] &&
			'cid' === tokens[1][1] &&
			22 === tokens[2][0] &&
			'path' === tokens[2][1]
		)
	})

	this.test('ensure getCD returns tail slash', function(cb){
		var cd = pTree.getCD('/r:id')
		if ('/' !== cd) return cb(null, false, cd)
		cd = pTree.getCD('r:id/')
		if ('r:id/' !== cd) return cb(null, false, cd)
		cd = pTree.getCD('r:id')
		cb(null, 'r:id' === cd)
	})

	this.test('ensure compare return last common position', function(cb){
		if (2 !== pTree.compare('112', '113')) return cb(null, false)
		if (null != pTree.compare('112', '112')) return cb(null, false)
		if (3 !== pTree.compare('1121', '112')) return cb(null, false)
		cb(null, 3 === pTree.compare('112', '1121'))
	})

	this.test('ensure route add', function(cb){
		var tree = {}
		pTree.add('/events/:id', tree)
		pTree.add('/events/:id/comments', tree)

		console.log('=====>', JSON.stringify(tree, '\t'))
		cb(null, true)
	})

	this.test('ensure start with param has no issue', function(cb){
		cb(null, false)
	})
})
