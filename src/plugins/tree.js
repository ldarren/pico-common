define('pico/tree', function(){
	var Min = Math.min
	var SEP = '/'
	var PARAM = ':'
	var CAPTURE = '*'

	function tokenizer(route, tokens){
		tokens = tokens || []
		var last = 0
		if (tokens.length){
			last = tokens[tokens.length - 1][0]	+ 1
		}
		var p0 = route.indexOf(PARAM, last)
		if (-1 === p0) {
			p0 = route.indexOf(CAPTURE, last)
			if (-1 === p0) return route
		}
		var p1 = route.indexOf(SEP, p0)
		if (-1 === p1) p1 = route.length
		tokens.push([p0, route.slice(p0 + 1, p1)])

		return tokenizer(route.slice(0, p0 + 1) + route.slice(p1), tokens)
	}

	function getCD(route, startPos, mask, withSep){
		startPos = startPos || 0
		var end = route.indexOf(SEP, startPos)
		if (-1 === end) end = route.length
		else if (withSep) end += 1

		var cd = route.slice(startPos, end)
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

	function insertTree(tree, route, tokens, full){
		var cd = getCD(route, 0, 1, 1)

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

	function findTree(tree, startPos, path, params){
		var cd = getCD(path, startPos, 1, 1)

		var node = tree[cd]
		if (!node) return

		var nodeSection = node[0]
		var nodeTokens = node[1]
		var nodeFull = node[2]

		var lastPos = startPos
		if (nodeTokens){
			for (var i = 0, t, v; (t = nodeTokens[i]; i++){
				lastPos = t[0]
				if (CAPTURE === nodeSection[lastPos]){
					params[t[3]] = path.substring(t[1])
					return nodeFull
				}
				startPos += lastPos
				cd = getCD(path, startPos, 0, 0)
				v = params[t[3]] = cd.substring(t[1])
				startPos += v.length
			}
		}

		if (nodeFull.codePointAt) return nodeFull
		return findTree(tree, startPos + (nodeSection.length - lastPos), path, params)
	}

	return {
		tokenizer,
		getCD,
		compare,
		add: function callee(route, tree){
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
			return findTree(tree, 0, path, params)
		},
		build: function(tree, path, params){
		}
	}
})
