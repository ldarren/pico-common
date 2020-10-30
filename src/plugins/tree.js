define('pico/tree', function(){
	var Min = Math.min
	var SEP = '/'
	var PARAM = ':'
	var CAPTURE = '*'
	var WILD = '?'

	// tokenize /events/E:id/upload/p*path to [9, [':', 'id'], 8, ['*', 'path']]
	function tokenizer(route, tokens, pos){
		if (pos >= route.length) return tokens

		var p0 = route.indexOf(PARAM, pos)
		if (-1 === p0) {
			p0 = route.indexOf(CAPTURE, pos)
			if (-1 === p0) {
				tokens.push(route.slice(pos))
				return tokens
			}else{
				tokens.push(route.slice(pos, p0))
				tokens.push(route.slice(p0))
				return tokens
			}
		}

		tokens.push(route.slice(pos, p0))

		var nextPos = route.indexOf(SEP, p0)
		if (-1 === nextPos) nextPos = route.length
		tokens.push(route.slice(p0, nextPos))

		return tokenizer(route, tokens, nextPos)
	}

	function getCD(route, withSep, mask, pos){
		pos = pos || 0
		var end = route.indexOf(SEP, pos)
		if (-1 === end) end = route.length
		else if (withSep) end += 1

		var cd = route.slice(pos, end)
		if (mask){
			if (-1 !== cd.indexOf(PARAM)) return PARAM
			else if (-1 !== cd.indexOf(CAPTURE)) return CAPTURE
		}
		return cd
	}

	function compare(a, b){
		var min = Min(a.length, b.length)
		for (var i = 0, l = min; i < l; i++){
			if (a.codePointAt(i) !== b.codePointAt(i)) {
				var lastSep = a.lastIndexOf(SEP, i) 
				if (-1 === lastSep) return i
				return lastSep
			}
		}

		if (min !== a.length || min !== b.length) return min
		return
	}

	function tokenLeft(lastPos, tokens){
		var left = []
		for (var i = 0, t; (t = tokens[i]); i++){
			if (lastPos < t[0]) left.push(t)
		}
		return left.length ? left : null
	}

	function makeBranch(full){
		if (!full.codePointAt) return
		return {
			'': ['', [], full]
		}
	}

	function insertTree(tree, route, tokens, pos){
		var cd = getCD(route, 1, 0, pos)

		var node = tree[cd]
		if (node){
			var nodeSection = node[0]
			var nodeTokens = node[1]
			var nodeFull = node[2]
			var lastPos = compare(route, nodeSection)
			if (null == lastPos) {
				if (full === nodeFull) return
				insertTree(makeBranch(nodeFull), '', [], full)
			} else {
				var branch = {}
				insertTree(branch, nodeSection.slice(lastPos), tokenLeft(lastPos, nodeTokens), nodeFull)
				insertTree(branch, route.slice(lastPos), tokenLeft(lastPos, tokens), full)
				node[2] = branch
			}
		}else{
			tree[cd] = [route, tokens, full]
		}
	}

	function findTree(tree, path, params, pos){
		var cd = getCD(path, 1, 0, pos)

		var node = tree[cd]
		if (!node) {
			node = tree[WILD]
			if (!node) return
		}

		var tokens = node[0]
		var route = node[1]

		if (tokens){
			for (var i = 0, t, v; (t = tokens[i]); i++){
				switch(t.charAt(0)){
				case PARAM:
					v = getCD(path, 0, 0, pos)
					params[t.slice(1)] = v
					pos += v.length
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
		return findTree(route, path, params, pos)
	}

	return {
		tokenizer: function (route, tokens, pos){
			return tokenizer(route, tokens || [], pos || 0)
		},
		getCD,
		compare,
		add: function (route, tree){
			if (!route || !route.slice) return
			var tokens = []
			var normalized = tokenizer(route, tokens)

			tree = tree || {}
			insertTree(tree, normalized, tokens, normalized)
			return tree
		},
		match: function(tree, path, params){
			if (!tree || !path) return

			params = params || {}
			return findTree(tree, path, params, 0, 0)
		},
		build: function(tree, path, params){
		}
	}
})
