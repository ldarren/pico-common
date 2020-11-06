const pico = require('../bin/pico-cli')
const pObj = pico.export('pico/obj')
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
		if (-3 !== pTree.compare('1121', '112')) return cb(null, false)
		cb(null, 3 === pTree.compare('112', '1121'))
	})

	this.test('ensure route add and match work', function(cb){
		var routes = [
			'/user',
			'/user/comments',
			'/user/avatar',
			'/user/lookup/username/:username',
			'/user/lookup/email/:address',
			'/event/e:id',
			'/event/e:id/comments',
			'/event/e:id/comment',
			'/map/:location/events',
			'/status',
			'/very/deeply/nested/route/hello/there',
			'/static/*rest',
		]

		var tree = {}
		for (var i = 0, r; (r = routes[i]); i++){
			pTree.add(r, tree)
		}

		var params = {}
		var route = pTree.match(tree, routes[0], params)
		if (routes[0] !== route || Object.keys(params).length) return cb(null, false)

		params = {}
		route = pTree.match(tree, routes[1], params)
		if (routes[1] !== route || Object.keys(params).length) return cb(null, false)

		params = {}
		route = pTree.match(tree, routes[2], params)
		if (routes[2] !== route || Object.keys(params).length) return cb(null, false)

		params = {}
		route = pTree.match(tree, '/user/lookup/username/Darren', params)
		if (routes[3] !== route || 'Darren' !== params.username) return cb(null, false)

		params = {}
		route = pTree.match(tree, '/user/lookup/email/darren@mail.com', params)
		if (routes[4] !== route || 'darren@mail.com' !== params.address) return cb(null, false)

		params = {}
		route = pTree.match(tree, '/event/e1', params)
		if (routes[5] !== route || '1' !== params.id) return cb(null, false)

		params = {}
		route = pTree.match(tree, '/event/e1/comments', params)
		if (routes[6] !== route || '1' !== params.id) return cb(null, false)

		params = {}
		route = pTree.match(tree, '/event/e1/comment', params)
		if (routes[7] !== route || '1' !== params.id) return cb(null, false)

		params = {}
		route = pTree.match(tree, '/map/SG/events', params)
		if (routes[8] !== route || 'SG' !== params.location) return cb(null, false)

		params = {}
		route = pTree.match(tree, routes[9], params)
		if (routes[9] !== route || Object.keys(params).length) return cb(null, false)

		params = {}
		route = pTree.match(tree, routes[10], params)
		if (routes[10] !== route || Object.keys(params).length) return cb(null, false)

		params = {}
		route = pTree.match(tree, '/static/foo/bar', params)
		cb(null, routes[11] === route && 'foo/bar' === params.rest)
	})

	this.test('ensure start with param has no issue', function(cb){
		var route = ':date/:month/:year'
		var tree = pTree.add(route)
		var matched = pTree.match(tree, '1/11/20')
		cb(null, matched === route)
	})
})
