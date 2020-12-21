define('pico/str', function(){
	var Rand=Math.random
	var Ceil=Math.ceil
	var Min=Math.min
	var re = /<%([\s\S]*?)%>/g
	var reExp = /(^( )?(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|finally|for|function|if|import|let|return|super|switch|throw|try|var|while|with|yield|{|}|;))(.*)?/g
	var PARAM = ':'
	var CAPTURE = '*'
	var SEP = '/'
	var WILD = '?'
	var DYN = [0x3A, 0x2A]

	function getKey(ctx, route, pos){
		if (!route) return ''
		pos = pos || 0

		if (-1 !== (ctx.DYN || DYN).indexOf(route.charCodeAt(pos))) return WILD
		var p = route.indexOf(ctx.SEP || SEP, pos)
		if (-1 === p) return route.slice(pos)
		return route.slice(pos, p + 1)
	}

	function getCD(ctx, route, pos, withSep){
		if (!route) return ''
		pos = pos || 0

		var p = route.indexOf(ctx.SEP || SEP, pos)
		if (-1 === p) return route.slice(pos)
		return route.slice(pos, p + (withSep ? 1 : 0))
	}

	function addNode(ctx, tree, tokens, route, key){
		key = key || getKey(ctx, tokens[0], 0)
		tree[key] = [tokens, route]
		return tree
	}

	// tokenize /events/:id/upload/p*path to ['/events/', ':id', '/upload/p', '*path']
	function tokenizer(ctx, route, tokens, pos){
		tokens = tokens || []
		pos = pos || 0

		if (pos >= route.length) return tokens

		var p0 = route.indexOf(ctx.PARAM || PARAM, pos)
		if (-1 === p0) {
			p0 = route.indexOf(ctx.CAPTURE || CAPTURE, pos)
			if (-1 === p0) {
				tokens.push(route.slice(pos))
				return tokens
			}else{
				tokens.push(route.slice(pos, p0))
				tokens.push(route.slice(p0))
				return tokens
			}
		}

		if (pos !== p0) tokens.push(route.slice(pos, p0))

		var nextPos = route.indexOf(ctx.SEP || SEP, p0)
		if (-1 === nextPos) {
			tokens.push(route.slice(p0))
			return tokens
		}
		tokens.push(route.slice(p0, nextPos))

		return tokenizer(ctx, route, tokens, nextPos)
	}

	function compare(ctx, a, b){
		var D = ctx.DYN || DYN
		var l = a.length
		for (var i = 0, ai, bi; i < l; i++){
			ai = a[i]
			bi = b[i]
			if (ai === bi) continue
			if (-1 === D.indexOf(ai.charCodeAt(0)) || -1 === D.indexOf(bi.charCodeAt(0))) return i
		}
		return l === b.length ? null : l
	}

	function lastCommonSep(ctx, a, b){
		var S = ctx.SEP || SEP
		var lastSep
		var l = a.length
		for (var i = 0, ai, bi; i < l; i++){
			ai = a[i]
			bi = b[i]
			if (ai !== bi) return lastSep
			if (S === ai) lastSep = i + 1
		}
		return l === b.length ? null : lastSep
	}

	function split(left, pos, lastSep){
		var right = []
		if (null == pos) return right
		right = left.splice(pos)
		if (!right.length || !lastSep) return right
		var r0 = right.shift(lastSep)
		left.push(r0.slice(0, lastSep))
		if (r0.length !== lastSep) right.unshift(r0.slice(lastSep))
		return right
	}

	function add(ctx, tree, tokens, route){
		if (1 === tokens.length && -1 === (ctx.DYN || DYN).indexOf(tokens[0].charCodeAt(0))) {
			addNode(ctx, tree, tokens, route, tokens[0])
			return
		}

		var key = getKey(ctx, tokens[0], 0, null, SEP)
		var val = tree[key]
		if (!val) return addNode(ctx, tree, tokens, route, key)

		var nodeTokens = val[0]
		var nodeRoute = val[1]

		var diff = compare(ctx, nodeTokens, tokens)

		// exact same
		if (null == diff) {
			if (nodeRoute.slice) return
			return add(nodeRoute, '', [], route)
		}
		var lastSep = lastCommonSep(ctx, nodeTokens[diff] || '', tokens[diff])
		if (diff + (lastSep && lastSep < nodeTokens[diff].length ? 0 : 1) < nodeTokens.length) {
			nodeRoute = val[1] = addNode(ctx, {}, split(nodeTokens, diff, lastSep), nodeRoute)
		}else if (nodeRoute.slice){
			nodeRoute = val[1] = addNode(ctx, {}, [], nodeRoute)
		}
		add(ctx, nodeRoute, split(tokens, diff, lastSep), route)
	}

	function find(ctx, tree, path, params, pos){
		var key = getCD(ctx, path, pos, 1)

		var node = tree[key] || tree[WILD]
		if (!node) return

		var tokens = node[0]
		var route = node[1]

		if (tokens){
			var lastPos = pos
			for (var i = 0, t, v; (t = tokens[i]); i++){
				switch(t.charAt(0)){
				case PARAM:
					v = getCD(ctx, path, pos, 0)
					params[t.slice(1)] = v
					pos += v.length
					v = route[path.slice(pos)]
					if (v && v[1].charAt) return v[1]
					break
				case CAPTURE:
					v = path.slice(pos)
					params[t.slice(1)] = v
					pos += v.length
					return route
				default:
					if (pos !== path.indexOf(t, pos)) return
					pos += t.length
					break
				}
			}
			if (lastPos === pos) return
		}

		if (pos === path.length && route.charAt) return route
		return find(ctx, route, path, params, pos)
	}

	function Radix(opt, tree){
		opt = Object.assign({
			SEP: SEP,
			PARAM: PARAM,
			CAPTURE: CAPTURE,
		}, opt)
		this.SEP = opt.SEP
		this.PARAM = opt.PARAM
		this.CAPTURE = opt.CAPTURE
		this.DYN = [opt.PARAM.charCodeAt(0), opt.CAPTURE.charCodeAt(0)]
		this.tree = tree || {}
	}

	Radix.prototype = {
		add: function(route){
			var tree = this.tree
			var tokens = tokenizer(this, route, [], 0)

			add(this, tree, tokens, route)
		},
		match: function(path, params){
			if (!path && !path.charAt) return
			var tree = this.tree
			var val = tree[path]
			if (val && (val[0].length < 2) && val[1].charAt) return val[1]

			params = params || {}
			return find(this, tree, path, params, 0)
		},
		build: function(route, params){
			var tokens = tokenizer(this, route, [], 0)

			var path = ''
			var D = this.DYN || DYN
			for(var i = 0, t; (t = tokens[i]); i++){
				if (-1 === D.indexOf(t.charCodeAt(0))) path += t
				else path += params[t.slice(1)]
			}
			return path
		}
	}

	function addCode(code, line, js) {
		line = line.trim()
		if (!line) return code
		js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') : (code += line !== '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '')
		return code
	}
	function partial(func){
		return function(d){
			return func(pico, d)
		}
	}

	return {
		codec: function(num, str){
			for(var i=0,ret='',c; (c=str.charCodeAt(i)); i++){
				ret += String.fromCharCode(c ^ num)
			}
			return ret
		},
		hash: function(str){
			for (var i=0,h=0,c; (c=str.charCodeAt(i)); i++) {
				// same as h = ((h<<5)-h)+c;  h = h | 0 or h = h & h <= Convert to 32bit integer
				h = (h<<3)-h+c | 0
			}
			return h
		},
		rand: function(len, sep){
			sep = sep || ''
			len = Min(len || 10, 512)
			var l = Ceil((len + sep.length) / 10)
			var r = []
			for (var i = 0; i < l; i++) {
				r.push(Rand().toString(36).substr(2))
			}
			return r.join(sep).substring(0, len)
		},
		pad:function(val,n,str){
			return this.tab(val,n,str)+val
		},
		tab:function(val,n,str){
			var c=n-String(val).length+1
			return Array(c>0?c:0).join(str||'0')
		},
		isBase36:function(c){
			return ((c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5e) || (c >= 0x61 && c <= 0x7e))
		},
		// src:https://raw.githubusercontent.com/krasimir/absurd/master/lib/processors/html/helpers/TemplateEngine.js
		// caveat: semicolon is required
		template:function(html){
			var code = 'var r=[];\n'
			var cursor = 0
			var match
			while((match = re.exec(html))) {
				code = addCode(code, html.slice(cursor, match.index))
				code = addCode(code, match[1], true)
				cursor = match.index + match[0].length
			}
			code = addCode(code, html.substr(cursor, html.length - cursor))
			return partial(new Function('pico', 'd', (code + 'return r.join("");').replace(/[\r\t\n]/g, ' ')))
		},

		Radix: Radix,
		compare: compare,
		lastCommonSep: lastCommonSep,
		tokenizer: tokenizer,
	}
})
