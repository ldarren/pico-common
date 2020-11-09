define('pico/tree', function(){
	var PARAM = ':'
	var CAPTURE = '*'
	var SEP = '/'
	var WILD = '?'
	var DYN = [0x3A, 0x2A]

	function getKey(route, pos, D, S){
		if (!route) return ''
		pos = pos || 0
		D = D || DYN
		S = S || SEP

		if (-1 !== D.indexOf(route.charCodeAt(pos))) return WILD

		var p = route.indexOf(SEP, pos)
		if (-1 === p) return route.slice(pos)
		return route.slice(pos, p + 1)
	}

	function getCD(route, pos, withSep, S){
		if (!route) return ''
		pos = pos || 0
		S = S || SEP

		var p = route.indexOf(SEP, pos)
		if (-1 === p) return route.slice(pos)
		return route.slice(pos, p + (withSep ? 1 : 0))
	}

	function addNode(tree, tokens, route, key, D, S){
		key = key || getKey(tokens[0], 0, D, S)
		tree[key] = [tokens, route]
		return tree
	}

	// tokenize /events/E:id/upload/p*path to ['/events/E', ':id', '/upload/p', '*path']
	function tokenizer(route, tokens, pos, P, C, S){
		tokens = tokens || []
		pos = pos || 0
		P = P || PARAM
		C = C || CAPTURE
		S = S || SEP

		if (pos >= route.length) return tokens

		var p0 = route.indexOf(P, pos)
		if (-1 === p0) {
			p0 = route.indexOf(C, pos)
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

		var nextPos = route.indexOf(S, p0)
		if (-1 === nextPos) {
			tokens.push(route.slice(p0))
			return tokens
		}
		tokens.push(route.slice(p0, nextPos))

		return tokenizer(route, tokens, nextPos, P, C, S)
	}

	function compare(a, b, D){
		D = D || DYN
		var l = a.length
		for (var i = 0, ai, bi; i < l; i++){
			ai = a[i]
			bi = b[i]
			if (ai === bi) continue
			if (-1 === D.indexOf(ai.charCodeAt(0)) || -1 === D.indexOf(bi.charCodeAt(0))) return i
		}
		return l === b.length ? null : l
	}

	function lastCommonSep(a, b, S){
		S = S || SEP
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

	function add(tree, tokens, route, SEP){
		if (1 === tokens.length && -1 === DYN.indexOf(tokens[0].charCodeAt(0))) {
			addNode(tree, tokens, route, tokens[0])
			return
		}

		var key = getKey(tokens[0], 0, null, SEP)
		var val = tree[key]
		if (!val) return addNode(tree, tokens, route, key)

		var nodeTokens = val[0]
		var nodeRoute = val[1]

		var diff = compare(nodeTokens, tokens)

		// exact same
		if (null == diff) {
			if (nodeRoute.slice) return
			return add(nodeRoute, '', [], route)
		}
		var lastSep = lastCommonSep(nodeTokens[diff] || '', tokens[diff])
		if (diff + (lastSep && lastSep < nodeTokens[diff].length ? 0 : 1) < nodeTokens.length) {
			nodeRoute = val[1] = addNode({}, split(nodeTokens, diff, lastSep), nodeRoute)
		}else if (nodeRoute.slice){
			nodeRoute = val[1] = addNode({}, [], nodeRoute)
		}
		add(nodeRoute, split(tokens, diff, lastSep), route, SEP)
	}

	function find(tree, path, params, pos, S){
		S = S || SEP
		var key = getCD(path, pos, 1, S)

		var node = tree[key] || tree[WILD]
		if (!node) return

		var tokens = node[0]
		var route = node[1]

		if (tokens){
			for (var i = 0, t, v; (t = tokens[i]); i++){
				switch(t.charAt(0)){
				case PARAM:
					v = getCD(path, pos, 0, S)
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
		}

		if (route.charAt) return route
		return find(route, path, params, pos)
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
			var S = this.SEP
			var tree = this.tree
			var tokens = tokenizer(route, [], 0, this.PARAM, this.CAPTURE, S)

			add(tree, tokens, route, S)
		},
		match: function(path, params){
			if (!path) return
			var tree = this.tree
			var val = tree[path]
			if (val && val[1].charAt) return val[1]

			params = params || {}
			return find(tree, path, params, 0)
		},
		build: function(route, params){
		}
	}

	return {
		Radix: Radix,
		compare: compare,
		lastCommonSep: lastCommonSep,
		tokenizer: tokenizer,
	}
})
