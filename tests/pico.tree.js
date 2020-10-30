const pico = require('../bin/pico-cli')
const pTree = pico.export('pico/tree')
const { parallel } = pico.export('pico/test')

parallel('\npico/tree', function(){
	this.test('ensure tokenizer work', function(cb){
		// ['/events/e', ':id', '/comments/', ':cid', '/', '*path']
		const route = '/events/e:id/comments/:cid/*path'
		const tokens = pTree.tokenizer(route)

		cb(null,
			6 === tokens.length &&
			'/events/e' === tokens[0] &&
			':id' === tokens[1] &&
			'/comments/' === tokens[2] &&
			':cid' === tokens[3] &&
			'/' === tokens[4] &&
			'*path' === tokens[5]
		)
	})

	this.test('ensure getCD returns tail slash', function(cb){
		var cd = pTree.getCD('/r:id', 1)
		if ('/' !== cd) return cb(null, false, cd)
		cd = pTree.getCD('r:id/', 1)
		if ('r:id/' !== cd) return cb(null, false, cd)
		cd = pTree.getCD('r:id', 1)
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

		cb(null, true)
	})

	this.test('ensure start with param has no issue', function(cb){
		cb(null, false)
	})

	this.test('ensure find route works', function(cb){
		var tree = {
			'/': [['/events/e', ':id'], {
				'': [[], '/events/e:id'],
				'/': [['/comments'], '/events/e:id/comments'],
			}]
		}
		var path = '/events/e1'
		var params = {}
		var route = pTree.match(tree, path, params)
		if ('/events/e:id' !== route || '1' !== params.id) return cb(null, false)

		path = '/events/e1/comments'
		params = {}
		route = pTree.match(tree, path, params)
		cb(null, '/events/e:id/comments' === route && '1' === params.id)
	})
})
