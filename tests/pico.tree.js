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

	this.test('ensure compare return last common position', function(cb){
		if (2 !== pTree.compare(['1','1','2'], ['1','1','3'])) return cb(null, false)
		if (null != pTree.compare(['1',':1','2'], ['1',':2','2'])) return cb(null, false)
		if (3 !== pTree.compare(['1',':1','2','1'], ['1',':1','2'])) return cb(null, false)
		if (3 !== pTree.compare(['1',':1','2'], ['1',':1','2','1'])) return cb(null, false)
		cb(null, 0 === pTree.compare(['1',':1','2'], ['2',':1','2','1']))
	})

	this.test('ensure lastCommonSep returns last common SEP', function(cb){
		if (1 !== pTree.lastCommonSep('/users', '/events')) return cb(null, false)
		cb(null, 6 === pTree.lastCommonSep('/user/comment', '/user/comments'))
	})

	this.test('ensure route add and match work', function(cb){
		var routes = [
			['/user', '/user', null],
			['/very/deeply/nested/route/hello/there', '/very/deeply/nested/route/hello/there', null],
			['/user/comments/time', '/user/comments/time', null],
			['/user/comment/time', '/user/comment/time', null],
			['/user/lookup/:username', '/user/lookup/darren', {username: 'darren'}],
			['/user/lookup/email/:email', '/user/lookup/email/darren@mail.co', {email: 'darren@mail.co'}],
			['/event/:id', '/event/1', {id: '1'}],
			['/event/:id/comments', '/event/2/comments', {id: '2'}],
			['/event/:id/comment', '/event/3/comment', {id: '3'}],
			['/user/:id/comment/:cid', '/user/1/comment/2', {id: '1', cid: '2'}],
			['/static/*rest', '/static/foo/bar', {rest: 'foo/bar'}],
		]

		var radix = new pTree.Radix
		var i, r
		for (i = 0; (r = routes[i]); i++){
			radix.add(r[0])
		}
		i = 0
		for (var params, res; (r = routes[i]); i++){
			params ={}
			res = radix.match(r[1], params)
			if (res !== r[0] || JSON.stringify(r[2]) !== JSON.stringify(r[2] ? params : null)) return cb(null, false)
		}
		cb(null, true)
	})
})
