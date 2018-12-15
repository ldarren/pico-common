const pico = require('../bin/pico-cli')
const pstr = pico.export('pico/str')
const { parallel } = pico.export('pico/test')

parallel('pico/str', function(){
	this.test('ensure left pad 8 for a number', function(cb){
		cb(null, '00000019'===pstr.pad(19,8))
	})
	this.test('ensure str.template works', function(cb){
		const
			tmpl=pstr.template('<%d.text%>'),
			obj={text:'Hello World'}

		cb(null, obj.text===tmpl(obj))
	})
	this.test('ensure str.template mix well with js', function(cb){
		const tmpl=pstr.template('<%for(var i=0; i<5; i++){%>1<%}%>')
		cb(null, '11111'===tmpl())
	})
	this.test('ensure str.template has pico as argument', function(cb){
		const env = {
			secret: 'ise',
			cb
		}
		pico.run({ env }, function(){
			const pstr = require('pico/str')
			const tmpl = pstr.template('<%pico.env(\'secret\')%>')
			return function(){
				pico.env('cb')(null, pico.env('secret') === tmpl())
			}
		})
	})
	this.test('ensure restful params parser supported: url/v%version/pushPackage/:pushId',function(cb){
		var
			route='url/v%version/pushPackage/:pushId',
			build=pstr.compileRest(route),
			params={},
			api=pstr.execRest('url/v1/pushPackage/web.com.domain.app',build,params)
		cb(null, api===route && 1===params.version && 'web.com.domain.app'===params.pushId)
	})
	this.test('ensure restful wildcard parser supported: url/ver%version/path/#path',function(cb){
		var
			route='url/ver%version/path/#path',
			build=pstr.compileRest(route),
			params={},
			api=pstr.execRest('url/ver1/path/web/com/domain/app',build,params)

		cb(null, api===route && 1===params.version && 'web/com/domain/app'===params.path)
	})
	this.test('ensure restful multiple build supported: /:appName|#appPath',function(cb){
		var
			route='/:appName|#appPath',
			build=pstr.compileRest('ERR|*msg'),
			params={}

		pstr.compileRest(route, build)

		var api=pstr.execRest('/msair',build,params)
		cb(null, api===route && 'msair'===params.appName)
	})
	this.test('ensure restful optional parser: url/v%version|device/:deviceToken|path/#path',function(cb){
		var
			route='url/v%version|device/:deviceToken|path/#path',
			build=pstr.compileRest(route),
			params={},
			api=pstr.execRest('url/v1/device/ab45/path/web/com/domain/app',build,params)
		if(api!==route || 1!==params.version || 'ab45'!==params.deviceToken || 'web/com/domain/app'!==params.path) return cb(null, false)
		params={}
		api=pstr.execRest('url/v1/device/ab45',build,params)
		if(api!==route || 1!==params.version || 'ab45'!==params.deviceToken) return cb(null, false)
		params={}
		api=pstr.execRest('url/v1',build,params)
		if(api!==route || 1!==params.version) return cb(null, false)
		cb(null, true)
	})
	this.test('ensure restful optional parser2: /:appName|#appPath',function(cb){
		var
			route='/:appName|#appPath',
			build=pstr.compileRest(route),
			params={},
			api=pstr.execRest('/msair',build,params)
		cb(null, api===route && 'msair'===params.appName)
	})
	var route='http://dev.jasaws.com/v%ver/users/:email|#profile'
	var build=pstr.compileRest(route)
	this.test('ensure restful builder works',function(cb){
		var url=pstr.buildRest(route, build, {ver:1.9, email:'test@email.com', profile: 'firstname/lastname'})
		cb(null, 'http://dev.jasaws.com/v1.9/users/test@email.com/firstname/lastname' ===  url)
	})
	this.test('ensure restful builder fails if missing mandatory params',function(cb){
		var url=pstr.buildRest(route, build, {ver:1.9, profile: 'firstname/lastname'})
		cb(null, false ===  url)
	})
	this.test('ensure restful builder success if missing non-mandatory params',function(cb){
		var url=pstr.buildRest(route, build, {ver:1.9, email: 'test@email.com'})
		cb(null, 'http://dev.jasaws.com/v1.9/users/test@email.com' ===  url)
	})
	this.test('ensure codec encode string "{"data":123}" and decode to the same', function(cb){
		var
			data = JSON.stringify({data:123}),
			key = parseInt('100007900715391')
		cb(null, data===pstr.codec(key, pstr.codec(key, data)))
	})
	this.test('ensure codec work on time based string', (cb)=>{
		const
			key='00mjvyn50022oq0000zbpt6c000014k2',
			secret='3zuklpkl6k905e5kryoiozuxrkjhunr26vjnlaao',
			now=Math.floor(Date.now()/(5*60*1000)),
			hash=now+pstr.hash(secret),
			token=pstr.codec(hash,key)
		cb(null, key===pstr.codec(key, pstr.codec(hash, token)))
	})
	this.test('ensure hash password to 32bit int', function(cb){
		cb(null, pstr.hash('免费服务会立即翻译英文和英文之间的单词'))
	})
	this.test('ensure hash dont collide in repeating char x9999', function(cb){
		var
			s='p',
			hist=[],
			l=9999,
			n=Date.now()
		for(var i=0,h; i<l; i++){
			h=pstr.hash(s)
			if (~hist.indexOf(h)) break
			hist.push(h)
			s+='p'
		}
		cb(null, l===hist.length, 'count', hist.length, 'ms', Date.now() - n)
	})
	this.test('ensure hash dont collide in uuid x99999', function(cb){
		var
			hist=[],
			l=99999,
			n=Date.now()
		for(var i=0,h; i<l; i++){
			h=pstr.hash(pstr.rand())
			if (~hist.indexOf(h)) break
			hist.push(h)
		}
		cb(null, l===hist.length, 'count', hist.length, 'ms', Date.now() - n)
	})
})
