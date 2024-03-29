const pico = require('../bin/pico-cli')
const pobj = pico.export('pico/obj')
const { parallel } = pico.export('pico/test')

const first_name = 'Darren'

parallel('\npico/obj', function(){

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

		cb(null, t1 + 20 > t2, [t1,t2])
	})

	this.test('ensure options.tidy is working', function(cb){
		var o2 = {k1: null, k2: void 0}

		var out = pobj.extend({}, o2)
		if (!pobj.has(out, 'k1') || !pobj.has(out, 'k2')) return cb(null, false)

		out = pobj.extend({}, o2, {tidy: 1})
		if (!pobj.has(out, 'k1') || pobj.has(out, 'k2')) return cb(null, false)

		out = pobj.extend({}, o2, {tidy: 2})
		if (pobj.has(out, 'k1') || !pobj.has(out, 'k2')) return cb(null, false)

		out = pobj.extend({}, o2, {tidy: 3})
		cb(null, !Object.keys(out).length)
	})

	this.test('ensure options.mergeArr on is working. output should contain[1,2,3] list', function(cb){
		var out = pobj.extend([1,2], [2,3], {mergeArr:1})

		cb(null, JSON.stringify([1,2,3]) === JSON.stringify(out))
	})

	this.test('ensure options.mergeArr off is working. output should contain[2,3] list', function(cb){
		var out = pobj.extend([1,2], [2,3])

		cb(null, JSON.stringify([2,3]) === JSON.stringify(out))
	})

	this.test('ensure extend __proto__ work correctly', function(cb){
		var a = pico.export('/')
		var b = {b: 2}
		var c = {c: 3, arr:[1,2,3]}
		a.prototype = b.prototype
		a.__proto__= b
		var out = pobj.extends({}, [c, {a}], {flat: 1})

		cb(null, out.a.b === b.b && 3 === out.arr.length && out.c === c.c && Object.keys(out.a)[0] === 'b')
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

	this.test('ensure obj.extends handled null/undefined correctly', function(cb){
		var outa = pobj.extends({}, [{a: null}, {a: 'a'}])
		var outb = pobj.extends({}, [{b: 'b'}, {b: null}])
		var outc = pobj.extends({}, [{c: undefined}, {c: 'c'}])
		var outd = pobj.extends({}, [{d: 'd'}, {d: undefined}])
		var oute = pobj.extends({}, [{d: 'd'}, {d: undefined}], {tidy: 1})
		cb(null, 'a' === outa.a && null === outb.b && 'c' === outc.c && void 0 === outd.d && 'd' === oute.d)
	})

	this.test('ensure obj.extends merge sub-obj', function(cb){
		var obj1 = {
			idx: 1,
			id: 'a1',
			meta: { h: 3, l: 1, m: 5, w: 2, du: 'in', mu: 'oz' },
			dst: {
				size: 'xs',
				id: '144101',
			},
			src: { idx: 1 },
		}
		var obj2 = {
			id: 'a2',
			ref: 'ref',
			meta: {},
			dst: {
				id: void 0,
				size: 'm'
			}
		}

		var out = pobj.extends({}, [obj1, obj2], {tidy: 0, mergeArr: 1})
		cb(null, out.idx === 1 && out.id === 'a2' && out.ref === obj2.ref && out.meta.h === 3 && out.dst.size === 'm' && out.dst.id == null && out.src.idx === 1)
	})

	this.test('ensure obj.extend handle Date object correctly', function(cb){
		var str = 'suppose to be date'
		var obj1 = {
			d: str
		}
		var obj2 = {
			d: new Date()
		}
		var out = pobj.extend(obj1, obj2)
		cb(null, out.d !== str)
	})

	this.test('ensure dot doesnt mutate params', function(cb){
		var obj = {a: [{b: {c: ['o', 'k']}}]}
		var params = ['a', 0, 'b', 'c', 'length']
		cb(null, 2 === pobj.dot(obj, params) && 5 === params.length && 'c' === params[3])
	})

	this.test('ensure dot optional params work', function(cb){
		var obj = {a: {b: {c: null}}}
		var arr = [0, [[0, 1, 2, null]]]
		var spec = [['1', 'a'], ['q', '0', 'b'], ['!', 'c', '3']]
		cb(null, null === pobj.dot(obj, spec) && null === pobj.dot(arr, spec))
	})

	this.test('ensure dot default value work', function(cb){
		var obj = {a: {b: {c: 'ok'}}}
		cb(null, 'ko' === pobj.dot(obj, ['a', ['q', '2', 'b'], ['!', '3']], 'ko'))
	})

	this.test('ensure dot return undefined if nothing match', function(cb){
		var obj = {a: {b: null}}
		cb(null, void 0 === pobj.dot(obj, ['a', ['q', '2', 'b'], ['!', '3']]))
	})

	this.test('ensure dot handle null and undefined gracefully', function(cb){
		var obj = {a: {b: null}}
		if ('' !== pobj.dot(obj, ['a', 'b', 'c'], '')) return cb(null, false)
		obj = {a: {b: { c: null }}}
		cb(null, null === pobj.dot(obj, ['a', 'b', 'c'], ''))
	})

	this.test('ensure validate work', function(cb){
		var obj = [{a: {b: [{c: '123', d: '1', e: null, f: '2019-10-16 06:33:00', g: 'T1'}]}}]
		var okSpec = {
			type: 'arr',
			spec: {
				type: 'obj',
				spec: {
					a: {
						type: 'obj',
						required: 1,
						spec: {
							b: {
								type: 'arr',
								required: 1,
								spec: {
									type: 'obj',
									spec: {
										c: 'str',
										d: {type: 'num', required: 1},
										e: 'bool',
										f: 'dat',
										g: ['T1', 'T2']
									}
								}
							}
						}
					}
				}
			}
		}
		var koSpec = {
			type: 'arr',
			spec: {
				type: 'obj',
				spec: {
					a: {
						type: 'obj',
						required: 1,
						spec: {
							b: {
								type: 'obj',
								spec: {
									c: 'str',
									d: 'num',
									e: 'boo',
									f: 'dat',
									g: ['T1', 'T2']
								}
							}
						}
					}
				}
			}
		}
		var out1 = []
		var ret1 = pobj.validate(okSpec, obj, out1)
		var ret2 = '$.0.a.b' === pobj.validate(koSpec, obj)
		var o = out1[0].a.b[0]
		cb(null, o.c === '123' && o.d === 1 && o.e === false && !!(o.f.getTime()) && !ret1 && ret2)
	})

	this.test('ensure primitive array type check', function(cb){
		var obj = {a: ['a', 'b'], b: [1, 2], c: [['d', 'e'], ['3', '4']]}
		var okSpec = {
			type: 'obj',
			spec:{
				a: {
					type: 'arr',
					spec: {
						type: 'str'
					}
				},
				b: {
					type: 'arr',
					spec: {
						type: 'num'
					}
				},
				c: {
					type: 'arr',
					spec: {
						type: 'arr',
						spec: {
							type: 'str'
						}
					}
				},
			}
		}
		var ret = pobj.validate(okSpec, obj)
		cb(null, ret == null)
	})

	this.test('ensure validate without nested spec work', function(cb){
		var obj = {a:{c:1, d:2}, b:[{e:1, f:2}]}
		var okSpec = {
			type: 'obj',
			spec:{
				a: {
					type: 'obj',
					required: 1
				},
				b: 'arr',
			}
		}
		var ret = pobj.validate(okSpec, obj)
		cb(null, ret == null)
	})

	this.test('ensure validate for optional handle gracefully', function(cb){
		var obj = {a:{}}
		var okSpec = {
			type: 'obj',
			spec: {
				a: {
					type: 'obj',
					required: 1,
					spec: {
						c: 'dat',
						d: 'str',
						e: 'str',
					}
				},
				b: {
					type: 'arr',
				},
				g: 'obj'
			}
		}
		var out = {}
		var ret = pobj.validate(okSpec, obj, out)
		cb(null, !ret && void 0 === out.b && void 0 === out.g && void 0 === out.a.c && void 0 === out.a.d && void 0 === out.a.e)
	})

	this.test('ensure validate wrong type can handle gracefully', function(cb){
		var obj = {a:{d:1, e:2}, b:[{f:1, g:2}]}
		var koSpec = {
			type: 'object',
			spec: {
				a: {
					type: 'object',
					required: 1,
					spec: {
						d: 'string',
						e: 'string',
					}
				},
				b: {
					type: 'array',
					required: 1
				}
			}
		}
		var ret = pobj.validate(koSpec, obj)
		if (ret !== '$.a.d') cb(null, false, ret)

		var koSpec2 = {
			type: 'object',
			spec: {
				a: {
					type: 'object',
					required: 1,
					spec: {
						type: 'object',
						required: 1,
						spec: {
							d: 'string',
							e: 'string',
						}
					}
				}
			}
		}
		ret = pobj.validate(koSpec2, obj)
		cb(null, ret === '$.a.required', ret)
	})
	this.test('ensure validate default value works', function(cb){
		var obj = [{a: {b: [{c: null, d: '1'}]}}]
		var okSpec = {
			type: 'array',
			spec: {
				type: 'object',
				spec: {
					a: {
						type: 'object',
						required: 1,
						spec: {
							b: {
								type: 'array',
								required: 1,
								spec: {
									type: 'object',
									spec: {
										c: {type: 'string', value: 'hello'},
										d: {type: 'number', required: 1},
										e: {type: 'boolean', value: true},
										f: {type: 'date', value: '2019-10-16 06:36:00'},
										g: {type: 'number', notnull: 1, value: 0}
									}
								}
							}
						}
					},
					c: {
						type: 'number',
						value: 12
					}
				}
			}
		}
		var out = []
		var ret = pobj.validate(okSpec, obj, out)
		if (null != ret) return cb(null, false)
		var o = out[0].a.b[0]
		cb(null, o.c === 'hello' && o.d === 1 && o.e === true && !!(o.f.getTime()) && 0 === o.g && out[0].c === 12)
	})

	this.test('ensure min max validation work', function(cb){
		var spec = {
			type:'array',
			gt: 0,
			lt: 2,
			spec: {
				type: 'object',
				spec: {
					a: {
						type: 'array',
						lt: 5,
						gt: 0
					},
					b: {
						type: 'string',
						lt: 4,
						gt: 0
					},
					c: {
						type: 'number',
						lt: 100,
						gt: 0
					},
					d: {
						type: 'date',
						lt: 1571179049000,
					}
				}
			}
		}

		var out = []
		var res = pobj.validate(spec, [{a:[1,2,3,4], b: '123', c: 98}], out)
		if (res && out[0].c === 98) cb(null, false)

		out = []
		res = pobj.validate(spec, [{a:[1,2,3,4,5], b: '123', c: 98}], out)
		if ('$.0.a' !== res) cb(null, false)

		out = []
		res = pobj.validate(spec, [{a:[1], b: '1234', c: 98}], out)
		if ('$.0.b' !== res) cb(null, false)

		out = []
		res = pobj.validate(spec, [{a:[1], b: '1', c: 198}], out)
		if ('$.0.c' !== res) cb(null, false)

		out = []
		res = pobj.validate(spec, [{a:[1], b: '1', c: 10, d: '2019-10-16 06:40:00'}], out)
		if ('$.0.d' !== res) cb(null, false)

		cb(null, true)
	})

	this.test('ensure regex validation work', function(cb){
		var spec = {
			type: 'object',
			spec: {
				tel: {
					type: 'string',
					regex: '^\\+[0-9]{2}\\s[0-9]{4}\\s[0-9]{4}$'
				},
				email: {
					type: 'string',
					regex: '^(([^<>()[\\]\\\\.,;:\\s@]+(\\.[^<>()[\\]\\\\.,;:\\s@]+)*)|(.+))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
				}
			}
		}

		var res = pobj.validate(spec, {tel: '+65 9876 5432', email: 'darren@yopmail.com'})
		if (res) return cb(null, false)

		res = pobj.validate(spec, {email: 'darren@yopmail.com'})
		if (res) return cb(null, false)

		res = pobj.validate(spec, {tel: '34456', email: 'darren@yopmail.com'})
		if ('$.tel' !== res) return cb(null, false)

		res = pobj.validate(spec, {email: 'world'})
		if ('$.email' !== res) return cb(null, false)

		cb(null, true)
	})

	this.test('ensure null type work for all data', function(cb){
		var spec = {
			type: 'object',
			spec: {
				a: 'null',
				b: 'null',
				c: 'null',
				d: 'null',
				e: 'null',
				f: {
					type: 'null',
					value: 1
				}
			}
		}

		var input = {a: 'hello', b: 321, c: [], d: {}, e: new Date}
		var out = {}
		var res = pobj.validate(spec, input, out)
		if (res) return cb(null, false, res)

		cb(
			null,
			out.a === input.a &&
			out.b === input.b &&
			out.c === input.c &&
			out.d === input.d &&
			out.e === input.e &&
			out.f === 1
		)
	})

	this.test('ensure nullable, object and array without spec return all object', function(cb){
		var input = {a: 1, b: 'hi'}
		var out = {}

		var res = pobj.validate({type:'null'}, input, out)
		if (res) return cb(null, false, res)
		if (out.a !== input.a || out.b !== input.b) return cb(null, false)

		res = pobj.validate({type:'object'}, input, out)
		if (res) return cb(null, false, res)
		if (out.a !== input.a || out.b !== input.b) return cb(null, false)

		input = [1, 'hi']
		out = []
		res = pobj.validate({type:'array'}, input, out)
		if (res) return cb(null, false, res)
		if (out[0] !== input[0] || out[1] !== input[1]) return cb(null, false)
		cb(null, true)
	})

	this.test('separator supports in array', function(cb){
		var input = 'a|b|c'
		var spec = {
			type: 'array',
			sep: '|'
		}
		var out = []

		var res = pobj.validate(spec, input, out)
		if (res) return cb(null, false, res)
		if ('a' !== out[0] || 'b' !== out[1] || 'c' !== out[2]) return cb(null, false)

		cb(null, true)
	})

	this.test('validate support nullable', function(cb){
		var input = {a: null, b: null, c: null, d: null, e: null, f: null}
		var spec = {
			type: 'object',
			spec: {
				a: 'string',
				b: 'number',
				c: 'boolean',
				d: 'bool',
				e: 'array',
				f: 'object',
			}
		}
		var out = {}
		var res = pobj.validate(spec, input, out)
		cb(null, (
			!res &&
			null === out.a &&
			null === out.b &&
			false === out.c &&
			false === out.d &&
			null === out.e &&
			null === out.f
		))
	})

	this.test('validate support not nullable', function(cb){
		var input = {a: null, b: null, c: null, d: null, f: null}
		var spec = {
			type: 'object',
			spec: {
				a: 'string',
				b: 'number',
				c: 'boolean',
				d: 'array',
				e: {
					type: 'number',
					notnull: 1,
					value: 0
				},
				f: {
					type: 'object',
					notnull: 1
				}
			}
		}

		var res = pobj.validate(spec, input, {})
		return cb(null, '$.f' === res)
	})

	this.test('validate array error position', function(cb){
		var spec = {
			type: 'array',
			spec: {
				type: 'number'
			}
		}

		var res = pobj.validate(spec, ['a', 'b'])
		return cb(null, res === '$.0')
	})

	this.test('validate array with specs', function(cb){
		var spec = {
			type: 'array',
			specs: ['number', { type: 'date', required: 1}],
			spec: {
				type: 'string',
				force: 1
			}
		}

		var res = pobj.validate(spec, ['a'])
		if ('$.0' !== res) return cb(null, false, res)
		res = pobj.validate(spec, [0])
		if ('$.1' !== res) return cb(null, false, res)
		var out = []
		res = pobj.validate(spec, [0, '2020-12-30', 0], out)
		cb(null, !res && '0' === out[2])
	})

	this.test('validate array with specs with excess values', function(cb){
		var spec = {
			type: 'array',
			specs: ['number', 'date'],
		}

		var out = []
		var res = pobj.validate(spec, [0, '2020-12-30', 1, 2], out)
		cb(null, !res && 1 === out[2] && 2 === out[3])
	})

	this.test('validate boolean', function(cb){
		var spec = {
			type: 'object',
			spec: {
				bool1: 'bool',
				bool2: 'bool',
				bool3: {
					type: 'bool',
					required: 1
				},
				bool4: 'bool',
				bool5: 'bool',
				bool6: 'bool',
			}
		}

		var out = {}
		var res = pobj.validate(spec, {bool2: 'true', bool3: 'false', bool4: null, bool5: 'no', bool6: '0'}, out)
		if (res) return cb(null, false)
		return cb(null,
			false === out.bool1 &&
			true === out.bool2 &&
			false === out.bool3 &&
			false === out.bool4 &&
			false === out.bool5 &&
			false === out.bool6
		)
	})

	this.test('validate date format', function(cb){
		var spec = {
			type: 'object',
			spec: {
				cat: {
					type: 'date',
					formats: ['D/Y/M', 'D-Y-M', 'Y M D']
				}
			}
		}

		var out = {}
		var res = pobj.validate(spec, {cat: '2020 40 40'}, out)
		if (!res) return cb(null, false)

		out = {}
		res = pobj.validate(spec, {cat: '2020 10 31'}, out)
		if (res) return cb(null, false)
		return cb(null, (new Date(2020, 9, 31)).getTime() === out.cat.getTime())
	})

	this.test('validate dynamic spec with out-of-spec value', function(cb){
		var spec = {
			type: 'object',
			spec: {
				src: {
					type: 'object',
					required: ['ref', ['opt', 0, 'dropoff'], 0],
					spec: {
						first_name: {
							type: 'string',
							required: 1
						},
						last_name: 'string',
					}
				}
			}
		}

		var res = pobj.validate(spec, {})
		if (res) return cb(null, false, res)

		res = pobj.validate(spec, {opt: [{dropoff:1}]})
		if ('$.src' !== res) return cb(null, false, res)

		var out = {}
		res = pobj.validate(spec, {opt: [{dropoff:1}], src: {first_name}}, out)
		return cb(null, !res && !out.opt && out.src.first_name === first_name)
	})

	this.test('validate dynamic spec with ref op', function(cb){
		var spec = {
			type: 'object',
			required: 1,
			spec: {
				id: {
					type: 'string',
					required: 1
				},
				ref: {
					type: 'string',
					value: ['ref', ['id']]
				}
			}
		}

		var out = {}
		var res = pobj.validate(spec, {id: 'a' }, out)
		if (res) return cb(null, false, res)
		if (out.id !== out.ref) return cb(null, false, out)

		res = pobj.validate(spec, {id: 'a', ref: 'b' }, out)
		cb(null, !res && 'b' === out.ref)
	})

	this.test('validate dynamic spec with bool op', function(cb){
		var spec = {
			type: 'array',
			spec: {
				type: 'object',
				spec: {
					idx: {
						type: 'number',
						required: ['bool', ['.', 'ref'], 0, 1]
					},
					ref: {
						type: 'string',
						required: ['bool', ['.', 'idx'], 0, 1]
					},
				}
			}
		}

		var out = []
		var res = pobj.validate(spec, [{idx: 42}, {ref: 'd'}, {idx: 43, ref: 'e'}], out)
		if (res) return cb(null, false, res)

		res = pobj.validate(spec, [{idx: 42}, {ref: 'd'}, {}])
		cb(null, '$.2.idx' === res, res)
	})
	this.test('transform with bool op', function(cb){
		var spec = {
			type: 'array',
			spec: {
				type: 'object',
				spec: {
					enabled: {
						type: 'bool',
						value: ['bool', ['.', 'status'], 0]
					},
					disabled: {
						type: 'bool',
						value: ['bool', ['.', 'status'], 0, 1]
					},
				}
			}
		}

		var out = []
		var res = pobj.validate(spec, [{status: 1}, {status: 0}, {status: true}, {status: false}], out)
		if (res) return cb(null, false, res)
		const cmp = (obj) => ( obj.enabled === !obj.disabled )
		cb(null, cmp(out[0]) && cmp(out[1]) && cmp(out[2]) && cmp(out[3]))
	})

	this.test('validate dynamic spec with eq op', function(cb){
		var spec = {
			type: 'object',
			spec: {
				choice: {
					type: 'number',
					required: 1
				},
				discount: {
					type: 'bool',
					value: ['eq', ['choice'], 0, null, [1,2,3]]
				},
				free_delivery: {
					type: 'bool',
					value: ['eq', ['choice'], 0, null, 1, 1]
				},
				insurance: {
					type: 'number',
					notnull: ['bool', ['policy'], 1],
					value: ['map', ['policy'], 0, ['_', 'premium'], ['price']]
				}
			}
		}

		var ext = {premium: [null, {price: 50}, {price: 30}]}
		var out = {}

		var res = pobj.validate(spec, {choice: 2}, out, ext)
		if (!res || '$.insurance' !== res) return cb(null, false, res)

		out = {}
		res = pobj.validate(spec, {choice: 2, insurance: 10}, out, ext)
		if (res || !out.discount || !out.free_delivery || 10 !== out.insurance) return cb(null, false, res)

		out = {}
		res = pobj.validate(spec, {choice: 1, policy: 2}, out, ext)
		cb(null, !res && out.discount && !out.free_delivery && 30 === out.insurance, out)
	})

	this.test('validate dynamic spec with map op', function(cb){
		var spec1 = {
			type: 'object',
			required: 1,
			spec: {
				id: {
					type: 'number',
				},
				first_name: {
					type: 'string',
					value: ['map',
						['$', 'id'], 0,
						['_', 'user'],
						['$', 'first_name'], 'error'
					]
				}
			}
		}
		// test notnull as required
		var spec2 = {
			type: 'object',
			required: 1,
			spec: {
				id: {
					type: 'number',
				},
				first_name: {
					type: 'string',
					notnull: 1,
					value: ['map',
						['$', 'id'], 0,
						['_', 'user'],
					]
				}
			}
		}
		var ext1 = {user: {0: {first_name: 'NA'}, 1: {first_name}}}
		var ext2 = {user: {0: 'NA', 1: first_name}}

		var out = {}
		var res = pobj.validate(spec1, {}, out, ext1)
		if (res || out.first_name !== 'NA') return cb(null, false, res)

		out = {}
		res = pobj.validate(spec1, {id: 1}, out, ext1)
		if (res) return cb(null, false, res)
		if (out.first_name !== first_name) return cb(null, false, out)

		out = {}
		res = pobj.validate(spec1, {id: 2}, out, ext1)
		if (res && out.first_name !== 'error') return cb(null, false, res)

		out = {}
		res = pobj.validate(spec2, {}, out, ext2)
		if (res || out.first_name !== 'NA') return cb(null, false, res)

		out = {}
		res = pobj.validate(spec2, {id: 1}, out, ext2)
		if (res || out.first_name !== first_name) return cb(null, false, res)

		out = {}
		res = pobj.validate(spec2, {id: 2}, out, ext2)
		return cb(null, '$.first_name' === res, res)
	})

	this.test('validate dynamic spec with now op', function(cb){
		var DAY = 1000 * 60 * 60 * 24
		var spec = {
			type: 'object',
			spec: {
				today: {
					type: 'date',
					value: ['now']
				},
				yesterday: {
					type: 'date',
					value: ['now', null, -1 * DAY]
				}
			}
		}

		var out = {}
		var res = pobj.validate(spec, {}, out)
		if (res || !out.today || !out.yesterday) return cb(null, false, res)
		var diff = out.today.getTime() - out.yesterday.getTime()
		return cb(null, DAY + 5 > diff && DAY - 5 < diff)
	})

	this.test('validate dynamic spec with validate op', function(cb){
		var spec = {
			type: 'object',
			spec: {
				idxs: {
					type: 'array',
					gt: 0,
					value: ['spec', ['ids'], null, {
						type: 'array',
						sep: ',',
						spec: {
							type: 'number',
							map: [['_']],
						}
					}],
					spec: 'number'
				}
			}
		}
		var ext = { a: 1, b: 2, c: 3 }

		var out = {}
		var res = pobj.validate(spec, {ids: 'a,b,c'}, out, ext)
		return cb(null, !res && 3 === out.idxs.length && ext.b === out.idxs[1], res)
	})

	this.test('validate op can be applied to spec', function(cb){
		var spec = {
			type: 'object',
			spec: {
				id: 'string',
				child: {
					type: 'array',
					spec: ['ref', ['_']]
				}
			}
		}
		var ext = {
			type: 'object',
			spec: {
				product_idx: 'number',
				amount: 'number'
			}
		}
		var input = {
			id: 'E1',
			child: [{
				product_idx: '1',
				amount: '10'
			}]
		}

		var out = {}
		var res = pobj.validate(spec, input, out, ext)
		return cb(null, !res && 1 === out.child.length && 1 === out.child[0].product_idx, res)
	})

	this.test('validate nested data structure with ref operator', function(cb){
		var spec = {
			type: 'array',
			specs: ['number', { type: 'array', spec: ['ref', ['_'], null]}],
		}
		var val = [1, [
			[2],
			[3, [
				[4, 0],
				[5]
			]]
		]]

		var out = []
		var res = pobj.validate(spec, val, out, spec)
		return cb(null, res && '$.1.1.1.0.1' === res && val[1][0][1] === out[1][0][1])
	})

	this.test('validate dynamic spec with call operator', function(cb){
		var spec = {
			type: 'object',
			spec: {
				count: {
					type: 'number',
					value: ['call', ['_', 'func'], null, null, 1, null, 2]
				}
			}
		}
		var ext = { func: (a, b) => (a + b) }

		var out = {}
		var res = pobj.validate(spec, {}, out, ext)
		return cb(null, !res && 3 === out.count, res)
	})

	this.test('ensure force attribute works on array and string', function(cb){
		var spec = {
			type: 'object',
			required: 1,
			spec: {
				arr: {
					type: 'array',
					force: 1
				},
				str: {
					type: 'string',
					force: 1
				}
			}
		}

		var out = {}
		var res = pobj.validate(spec, {arr:1, str:1}, out)
		if (res || out.arr[0] !== 1 || out.str !== '1') return cb(null, false, res)

		out = {}
		res = pobj.validate(spec, {arr:{a:1}, str:{a:1}}, out)
		cb(null, !res && out.arr[0].a === 1 && out.str !== '{a:1}')
	})

	this.test('ensure int attribute works on number', function(cb){
		var spec = {
			type: 'object',
			required: 1,
			spec: {
				round: {
					type: 'number',
					int: true
				},
				down: {
					type: 'number',
					int: 'd'
				},
				floor: {
					type: 'number',
					int: 'f'
				},
				up: {
					type: 'number',
					int: 'u'
				},
				ceil: {
					type: 'number',
					int: 'c'
				},
				none: 'number'
			}
		}

		var out = {}
		var res = pobj.validate(spec, {round: 3.6, down: 3.6, floor: 3.6, up: 3.6, ceil: 3.6, none: 3.9}, out)
		cb(null, !res && out.round === 4 && out.down === 3 && out.floor === 3 && out.up === 4 && out.ceil === 4 && out.none !== 4)
	})

	this.test('ensure alias attribute works', function(cb){
		var spec = {
			type: 'object',
			spec: {
				a1: {
					type: 'string',
					alias: 'a'
				},
				b1: {
					type: 'bool',
					alias: 'b'
				},
				c1: {
					type: 'number',
					alias: 'c'
				},
				d1: {
					type: 'date',
					alias: 'd'
				},
				e1: {
					type: 'null',
					alias: 'e'
				},
				f1: {
					type: 'array',
					alias: 'f'
				},
				g1: {
					type: 'object',
					alias: 'g'
				},
			}
		}

		var res = pobj.validate(spec, {f1: 1})
		if ('$.f' !== res) return cb(null, false)

		var out = {}
		res = pobj.validate(spec, {a1: '1', b1: true, c1: 3, d1: '2020-12-16', e1: 5, f1: [], g1: {}}, out)
		cb(null, !res &&
			'1' === out.a &&
			true === out.b &&
			3 === out.c &&
			16 === out.d.getDate() &&
			5 === out.e &&
			0 === out.f.length &&
			0 === Object.keys(out.g).length
		)
	})

	this.test('validate object and array without type', function(cb){
		var spec = {
			type: 'object',
			spec: {
				a: 'number',
				b: 'string',
				c: 'object',
				d: 'array'
			}
		}
		var out
		var res = pobj.validate(spec, {a: 1, b: '2', c: {}, d: []}, out)
		cb(null, !res)
	})

	this.test('validate pObj.create', function(cb){
		var spec = {
			type: 'array',
			required: 1,
			notnull: 1,
			spec: {
				type: 'object',
				spec: {
					num: 'number',
					str: 'string',
					bl: 'bool',
					date: 'date',
					empty: 'null',
					county: {
						type: ['CN', 'MY', 'US', 'SG'],
						required: 1
					}
				}
			}
		}

		var obj = pobj.create(spec)
		if (!obj) return cb(null, false, 'failed to create')

		var res = pobj.validate(spec, obj)
		return cb(null, void 0 === res)
	})

	this.test('validate pObj.create with dynamic op', function(cb){
		var spec = {
			type: 'array',
			required: 1,
			notnull: 1,
			spec: ['ref', ['_']]
		}
		var exp = {
			type: 'object',
			spec: {
				num: 'number',
				str: 'string',
				bl: 'bool',
				date: 'date',
				empty: 'null',
				county: ['CN', 'MY', 'US', 'SG']
			}
		}

		var obj = pobj.create(spec, exp)
		if (!obj) return cb(null, false, 'failed to create')

		var res = pobj.validate(spec, obj)
		return cb(null, void 0 === res)
	})

	this.test('flatten obj', function(cb){
		const obj = {
			mod: {
				ps: {
					host: '://goo.gl',
					u: 'un',
					p: 'passwd'
				}
			}
		}
		const res = pobj.flatten(obj)
		return cb(null,
			res['mod_ps_host'] === obj.mod.ps.host &&
			res['mod_ps_u'] === obj.mod.ps.u &&
			res['mod_ps_p'] === obj.mod.ps.p
		)
	})

	this.test('replace obj value', function(cb){
		const obj = {
			mod: {
				ps: {
					host: '$host',
					u: '$userId',
					p: '$passwd'
				}
			}
		}
		pobj.replace(obj, {host: 1, userId: 2, passwd: 3})
		return cb(null,
			1 === obj.mod.ps.host &&
			2 === obj.mod.ps.u &&
			3 === obj.mod.ps.p
		)
	})
})
