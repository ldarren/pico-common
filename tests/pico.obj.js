const pico = require('../bin/pico-cli')
const pobj = pico.export('pico/obj')
const { parallel } = pico.export('pico/test')

parallel('pico/obj', function(){
	this.test('ensure inherit work with child(obj) and ancestor(obj)', function(cb){
		pico.define('ancestor0',function(exports,require,module,define,inherit,pico){
			return {say:function(txt){
				return txt
			}}
		})
		pico.parse('child0', 'inherit(\'ancestor0\'); return {bark:function(){return this.say(\'hello\')}}',function(err, child){
			if (err) return cb(err)
			cb(null, 'hello'===child.bark())
		})
	})
	this.test('ensure inherit work with child(function) and ancestor(obj)', function(cb){
		pico.parse('child1', 'inherit(\'ancestor0\'); function Child(){this.postfix=\'child\'}; Child.prototype={bark:function(){return this.say(this.postfix)}}; return Child',function(err, child){
			if (err) return cb(err)
			cb(null, 'child'===(new child).bark())
		})
	})
	this.test('ensure inherit work with child(obj) and ancestor(function)', function(cb){
		pico.define('ancestor2',function(exports,require,module,define,inherit,pico){
			function Ancestor(){
				this.prefix='ancestor'
			} Ancestor.prototype={say:function(txt){
				return txt
			}}; return Ancestor
		})
		var child=pico.define('child2',function(exports,require,module,define,inherit,pico){
			inherit('ancestor2'); return {bark:function(){
				return this.say(this.prefix)
			}}
		})
		cb(null, 'ancestor'===(new child).bark())
	})
	this.test('ensure inherit work with child(function) and ancestor(function)', function(cb){
		pico.parse('child3', 'inherit(\'ancestor2\'); function Child(){this.__proto__.constructor();this.postfix=\'child\'}; Child.prototype={bark:function(){return this.say(this.prefix+this.postfix)}}; return Child',function(err, child){
			if (err) return cb(err)
			cb(null, 'ancestorchild'===(new child).bark())
		})
	})
	this.test('ensure extend work with child(obj) and ancestor(function)', function(cb){
		pico.parse('child4', 'return {bark:function(){return this.say(this.prefix)}}',function(err, child){
			if (err) return cb(err)
			var ancestor=pico.export('ancestor2')
			cb(null, 'ancestor'===(new (ancestor.extend(child))).bark())
		})
	})
	this.test('ensure extend work with child(function) and ancestor(function)', function(cb){
		pico.parse('child5', 'function Child(){this.__proto__.constructor();this.postfix=\'child\'}; Child.prototype={bark:function(){return this.say(this.prefix+this.postfix)}}; return Child',function(err, child){
			if (err) return cb(err)
			var ancestor=pico.export('ancestor2')
			cb(null, 'ancestorchild'===(new (ancestor.extend(child))).bark())
		})
	})

	this.test('ensure underscore can be loaded',function(cb){
		const
			V='1.8.3',
			_=pico.define('underscore',function(exports,require,module,define,inherit,pico){
				(function() {
					var root = this

					var _ = function(obj) {
						if (obj instanceof _) return obj
						if (!(this instanceof _)) return new _(obj)
						this._wrapped = obj
					}

					if (typeof exports !== 'undefined') {
						if (typeof module !== 'undefined' && module.exports) {
							exports = module.exports = _
						}
						exports._ = _
					} else {
						root._ = _
					}

					_.VERSION = V

					if (typeof define === 'function' && define.amd) {
						define('underscore', [], function() {
							return _
						})
					}
				}.call(this))
			})
		cb(null, V===_.VERSION)
	})

	this.test('ensure object.extend compatible with pico module', function(cb){
		function a(){}
		a.__proto__ = {
			slots: {
				slotA(){
					return 1
				},
				slotC(){
					return 3
				}
			}
		}
		function b(){}
		b.__proto__ = {
			slots: {
				slotB(){
					return 2
				},
				slotC: function slotC(){
					return 1 + slotC.prototype.call()
				},
			}
		}

		const res = pobj.extend(pobj.extend({}, a), b)

		cb(null, 1 === res.slots.slotA() && 2 === res.slots.slotB() && 4 ===  res.slots.slotC())
	})

	this.test('ensure obj2 override obj1. output value of key1 should be 2', function(cb){
		var out = pobj.extend({key1:1},{key1:2})

		cb(null, 2 === out.key1)
	})

	this.test('ensure obj1 merges with obj2. output should contain key1 and key2', function(cb){
		var out = pobj.extend({key1:1},{key2:2})

		cb(null, !!out.key1 && !!out.key2)
	})

	this.test('compare extend to assign performance', function(cb){
		var
			obj1 = {k1:1,k2:2,k3:3},
			obj2 = {v1:1,v2:2,v3:3},
			t=Date.now(),
			t1,t2

		for(var i=0; i<10000; i++){
			Object.assign(obj1,obj2)
		}
		t1=Date.now()-t

		obj1 = {k1:1,k2:2,k3:3}
		t=Date.now()

		for(i=0; i<10000; i++){
			pobj.extend(obj1,obj2)
		}
		t2=Date.now()-t

		cb(null, t1 + 10 > t2, [t1,t2])
	})

	this.test('ensure options.tidy on is working. output should not contain any undefined key', function(cb){
		var out = pobj.extend({key1:1}, {key2:void 0}, {tidy:1})

		cb(null, 1 === Object.keys(out).length)
	})

	this.test('ensure options.tidy off is working. output should contain an undefined key', function(cb){
		var out = pobj.extend({key1:1}, {key2:void 0})

		cb(null, 2 ===  Object.keys(out).length)
	})

	this.test('ensure options.mergeArr on is working. output should contain[1,2,3] list', function(cb){
		var out = pobj.extend([1,2], [2,3], {mergeArr:1})

		cb(null, JSON.stringify([1,2,3]) === JSON.stringify(out))
	})

	this.test('ensure options.mergeArr off is working. output should contain[2,3] list', function(cb){
		var out = pobj.extend([1,2], [2,3])

		cb(null, JSON.stringify([2,3]) === JSON.stringify(out))
	})

	this.test('ensure function extended correctly', function(cb){
		var
			obj1 = {func:function(){
				return 1
			}},
			obj2 = {func:function(){
				return arguments.callee.prototype()
			}},
			obj3 = {},
			obj4 = pobj.extend(obj3,obj1,obj2)

		cb(null, obj1.func()===obj4.func())
	})

	this.test('ensure obj.extend handled null/undefined correctly', function(cb){
		var outa = pobj.extends({}, [{a: null}, {a: 'a'}])
		var outb = pobj.extends({}, [{b: 'b'}, {b: null}])
		var outc = pobj.extends({}, [{c: undefined}, {c: 'c'}])
		var outd = pobj.extends({}, [{d: 'd'}, {d: undefined}])
		cb(null, 'a' === outa.a && null === outb.b && 'c' === outc.c && 'd' === outd.d)
	})

	this.test('ensure obj.parseInts is working, ["1", "2"] should parse to [1, 2]', function(cb){
		var out = pobj.parseInts(['1','2'])
		cb(null, JSON.stringify([1,2])===JSON.stringify(out))
	})

	this.test('ensure dot doesnt mutate params', function(cb){
		var obj = {a: {b: {c: 'ok'}}}
		var params = ['a', 'b', 'c']
		cb(null, 'ok' === pobj.dot(obj, params) && 3 === params.length && 'c' === params[2])
	})

	this.test('ensure dot optional params work', function(cb){
		var obj = {a: {b: {c: null}}}
		cb(null, null === pobj.dot(obj, [['1', 'a'], ['q', '2', 'b'], ['!', 'c', '3']]))
	})

	this.test('ensure dot default value work', function(cb){
		var obj = {a: {b: {c: 'ok'}}}
		cb(null, 'ko' === pobj.dot(obj, ['a', ['q', '2', 'b'], ['!', '3']], 'ko'))
	})

	this.test('ensure dot return undefined if nothing match', function(cb){
		var obj = {a: {b: null}}
		cb(null, void 0 === pobj.dot(obj, ['a', ['q', '2', 'b'], ['!', '3']]))
	})

	this.test('ensure validate without nested spec work', function(cb){
		var obj = {a:{c:1, d:2}, b:[{e:1, f:2}]}
		var okSpec = {
			a: {
				type: 'object',
				required: 1
			},
			b: 'array',
		}
		var ret1 = null == pobj.validate(okSpec, obj)
		cb(null, ret1)
	})

	this.test('ensure validate for optional and wrong type can handle gracefully', function(cb){
		var obj = {a:{c:1, d:2}, b:[{e:1, f:2}]}
		var koSpec = {
			a: {
				type: 'object',
				required: 1,
				spec: {
					b: {
						type: 'string'
					},
					c: {
						type: 'string'
					},
					d: {
						type: 'null'
					}
				}
			},
			b: {
				type: 'array',
				required: 1
			}
		}
		var ret1 = 'a.c' === pobj.validate(koSpec, obj)
		cb(null, ret1)
	})

	this.test('ensure validate default value works', function(cb){
		var obj = [{a: {b: [{d: '1'}]}}]
		var okSpec = {
			a: {
				type: 'object',
				required: 1,
				spec: {
					b: {
						type: 'array',
						required: 1,
						spec: {
							c: {type: 'string', value: 'hello'},
							d: {type: 'number', required: 1},
							e: {type: 'boolean', value: true}
						}
					}
				}
			},
			c: {
				value: 12
			}
		}
		var out = []
		var ret = null == pobj.validate(okSpec, obj, out)
		var o = out[0].a.b[0]
		cb(null, o.c === 'hello' && o.d === 1 && o.e === true && out[0].c === 12 && ret)
	})

	this.test('ensure validate work', function(cb){
		var obj = [{a: {b: [{c: 'ok', d: '1', e: null}]}}]
		var okSpec = {
			a: {
				type: 'object',
				required: 1,
				spec: {
					b: {
						type: 'array',
						required: 1,
						spec: {
							c: 'string',
							d: {type: 'number', required: 1},
							e: 'boolean'
						}
					}
				}
			}
		}
		var koSpec = {
			a: {
				type: 'object',
				required: 1,
				spec: {
					b: {
						type: 'object',
						spec: {
							c: 'string',
							d: 'number',
							e: 'boolean'
						}
					}
				}
			}
		}
		var out1 = []
		var ret1 = null == pobj.validate(okSpec, obj, out1)
		var ret2 = '0.a.b' === pobj.validate(koSpec, obj)
		var o = out1[0].a.b[0]
		cb(null, o.c === 'ok' && o.d === 1 && o.e === false && ret1 && ret2)
	})
})
