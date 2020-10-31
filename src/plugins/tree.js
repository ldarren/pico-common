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

		if (pos !== p0) tokens.push(route.slice(pos, p0))

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
			if (-1 !== cd.indexOf(PARAM)) return WILD
			if (-1 !== cd.indexOf(CAPTURE)) return WILD
		}
		return cd
	}

	function compare(a, b){
		var min = Min(a.length, b.length)
		for (var i = 0, l = min, c; i < l; i++){
			c = a.charCodeAt(i)
			if (c !== b.charCodeAt(i)) return i
			if (42 === c || 58 === c ) return
		}

		if (min !== a.length || min !== b.length) return min
		return
	}

	function split(left, i, lastPos){
		var right = left.splice(i)
		if (null == lastPos) return right

		var token = left.shift()
		left.push(token.slice(0, lastPos))
		right.unshift(token.slice(lastPos))
		return right
	}

	function insertTree(tree, tokens, route){
		if (!Array.isArray(tokens)) return
		if (!tokens.length) return tree[''] = [tokens, route]
		var cd = getCD(tokens[0], 1, 1)

		var node = tree[cd]
		if (node){
			var nodeTokens = node[0]
			var nodeRoute = node[1]
			var min = Min(tokens.length, nodeTokens.length)
			var i = 0
			var lastPos
			for (; i < min; i++){
				lastPos = compare(tokens[i], nodeTokens[i])
			}
			if (i === tokens.length && null == lastPos) {
				if (nodeRoute.slice) return tree
				return insertTree(nodeRoute, [], route)
			}
			var branch = {}
			insertTree(branch, split(nodeTokens, i, lastPos), nodeRoute)
			insertTree(branch, split(tokens, i, lastPos), route)
			return node[1] = branch
		}
		tree[cd] = [tokens, route]
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

			tree = tree || {}
			insertTree(tree, tokenizer(route, [], 0), route, 0)
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
