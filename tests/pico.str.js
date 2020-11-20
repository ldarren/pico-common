const pico = require('../bin/pico-cli')
const pStr = pico.export('pico/str')
const { parallel } = pico.export('pico/test')

parallel('\npico/str', function(){
	this.test('ensure left pad 8 for a number', function(cb){
		cb(null, '00000019'===pStr.pad(19,8))
	})
	this.test('ensure str.template works', function(cb){
		const
			tmpl=pStr.template('<%d.text%>'),
			obj={text:'Hello World'}

		cb(null, obj.text===tmpl(obj))
	})
	this.test('ensure str.template mix well with js', function(cb){
		const tmpl=pStr.template('<%for(let i=0; i<5; i++){%>1<%}%>')
		cb(null, '11111'===tmpl())
	})
	this.test('ensure str.template has pico as argument', function(cb){
		const env = {
			secret: 'ise',
			cb
		}
		pico.run({ env }, function(){
			const pStr = require('pico/str')
			const tmpl = pStr.template('<%pico.env("secret")%>')
			return function(){
				pico.env('cb')(null, pico.env('secret') === tmpl())
			}
		})
	})
	this.test('ensure str.template work with multiline', function(cb){
		const tmpl = pStr.template(`
			<%
			function plus(x, y){
				return x + y
			}
			function minus(x, y){
				return x - y
			}
			switch(d.type){
			case "plus":%>
			<p><%plus(d.x, d.y)%></p>
			<%break;
			case "minus":%>
			<p><%minus(d.x, d.y)%></p>
			<%break;
			}%>
		`)
		cb(null, '<p>2</p>' === tmpl({type: 'minus', x: 4, y: 2}))
	})

	this.test('ensure tokenizer work', function(cb){
		// ['/events/e', ':id', '/comments/', ':cid', '/', '*path']
		const route = '/events/:id/comments/:cid/*path'
		const tokens = pStr.tokenizer({}, route)

		cb(null,
			6 === tokens.length &&
			'/events/' === tokens[0] &&
			':id' === tokens[1] &&
			'/comments/' === tokens[2] &&
			':cid' === tokens[3] &&
			'/' === tokens[4] &&
			'*path' === tokens[5]
		)
	})

	this.test('ensure compare return last common position', function(cb){
		const ctx = {}
		if (2 !== pStr.compare(ctx, ['1','1','2'], ['1','1','3'])) return cb(null, false)

		if (null != pStr.compare(ctx, ['1',':1','2'], ['1',':2','2'])) return cb(null, false)
		if (3 !== pStr.compare(ctx, ['1',':1','2','1'], ['1',':1','2'])) return cb(null, false)
		if (3 !== pStr.compare(ctx, ['1',':1','2'], ['1',':1','2','1'])) return cb(null, false)
		cb(null, 0 === pStr.compare(ctx, ['1',':1','2'], ['2',':1','2','1']))
	})

	this.test('ensure lastCommonSep returns last common SEP', function(cb){
		const ctx = {}
		if (1 !== pStr.lastCommonSep(ctx, '/users', '/events')) return cb(null, false)
		cb(null, 6 === pStr.lastCommonSep(ctx, '/user/comment', '/user/comments'))
	})

	this.test('ensure route add and match work', function(cb){
		var routes = [
			['/user', '/user', null],
			['/very/deeply/nested/route/hello/there', '/very/deeply/nested/route/hello/there', null],
			['/user/lookup/:id', '/user/lookup/darren', {id: 'darren'}],
			['/user/lookup/email/:email', '/user/lookup/email/darren@mail.co', {email: 'darren@mail.co'}],
			['/event/:id', '/event/1', {id: '1'}],
			['/event/:id/comments', '/event/2/comments', {id: '2'}],
			['/event/:id/comment', '/event/3/comment', {id: '3'}],
			['/user/:id/comment/:cid', '/user/1/comment/2', {id: '1', cid: '2'}],
			['/static/*rest', '/static/foo/bar', {rest: 'foo/bar'}],
		]

		var radix = new pStr.Radix
		var i, r
		for (i = 0; (r = routes[i]); i++){
			radix.add(r[0])
		}
		i = 0
		for (var params, res; (r = routes[i]); i++){
			params = {}
			res = radix.match(r[1], params)
			if (res !== r[0] || JSON.stringify(r[2]) !== JSON.stringify(r[2] ? params : null)) return cb(null, false)
		}
		cb(null, true)
	})

	this.test('ensure router ignore same route with diff params', function(cb){
		var routes = [
			'/user/lookup/:id',
			'/user/lookup/:username',
			'/user/lookup/*rest'
		]

		var radix = new pStr.Radix
		for (var i = 0, r; (r = routes[i]); i++){
			radix.add(r)
		}
		var params = {}
		var res = radix.match('/user/lookup/darren', params)
		if (routes[0] !== res || 'darren' !== params.id) return cb(null, false)

		params = {}
		res = radix.match('/user/lookup/foo/abr', params)
		if (routes[0] !== res || 'foo' !== params.id) return cb(null, false)
		cb(null, true)
	})

	this.test('ensure router build', function(cb){
		var routes = [
			['/users/:id/parcels', {id: 1}, '/users/1/parcels'],
			['/users/:id/devices/:did', {id: 1, did: 'abc'}, '/users/1/devices/abc'],
		]

		var radix = new pStr.Radix
		for (var i = 0, r; (r = routes[i]); i++){
			if (r[2] !== radix.build(r[0], r[1])) return cb(null, false)
		}
		cb(null, true)
	})

	this.test('ensure codec encode string "{"data":123}" and decode to the same', function(cb){
		var
			data = JSON.stringify({data:123}),
			key = parseInt('100007900715391')
		cb(null, data===pStr.codec(key, pStr.codec(key, data)))
	})
	this.test('ensure codec work on time based string', (cb)=>{
		const
			key='00mjvyn50022oq0000zbpt6c000014k2',
			secret='3zuklpkl6k905e5kryoiozuxrkjhunr26vjnlaao',
			now=Math.floor(Date.now()/(5*60*1000)),
			hash=now+pStr.hash(secret),
			token=pStr.codec(hash,key)
		cb(null, key===pStr.codec(key, pStr.codec(hash, token)))
	})
	this.test('ensure hash password to 32bit int', function(cb){
		cb(null, pStr.hash('免费服务会立即翻译英文和英文之间的单词') < 0xFFFFFFFF)
	})
	this.test('ensure hash dont collide in repeating char x9999', function(cb){
		var
			s='p',
			hist=[],
			l=9999,
			n=Date.now()
		for(var i=0,h; i<l; i++){
			h=pStr.hash(s)
			if (~hist.indexOf(h)) break
			hist.push(h)
			s+='p'
		}
		cb(null, l===hist.length, 'count', hist.length, 'ms', Date.now() - n)
	})
	this.test('ensure hash dont collide in uuid x9999', function(cb){
		var
			hist=[],
			l=9999,
			n=Date.now()
		for(var i=0,h; i<l; i++){
			h=pStr.hash(pStr.rand())
			if (~hist.indexOf(h)) break
			hist.push(h)
		}
		cb(null, l===hist.length, 'count', hist.length, 'ms', Date.now() - n)
	})
	this.test('ensure rand generate exact len', function(cb){
		var r = pStr.rand(64)
		cb(null, r.length === 64)
	})
	this.test('ensure rand generate sep', function(cb){
		var r = pStr.rand(96, ' ')
		cb(null, r.length === 96 && -1 !== r.indexOf(' '))
	})
})
