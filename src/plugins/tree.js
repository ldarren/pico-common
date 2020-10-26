define('pico/tree', function(){
	var SEP = '/'
	var TOKEN = ':'
	var CAPTURE = '#'

	function name(item){
		if (Array.isArray(item)) return item.join('')
		return item || ''
	}

	function add(route, items, tree){
		var init = name(items[0])
		if (!tree[init]) return tree[init] = [items, route]

		var value = tree[init]
		var indices = value[0]
		var l1 = items.length
		var l2 = indices.length

		for (var i = 1, item; i < l1; i++){
			item = items[i]

			if (i >= l2){
				value[1] = {
					'': [[], value[1]],
					[name(item)]: [[items.slice(i)], route]
				}
				break
			}

			if (name(item) === name(indices[i])) continue

			value[0] = indices.slice(0, i)
			value[1] = {
				[name(indices[i])]: [indices.slice(i), value[1]],
				[name(item)]: [[items.slice(i)], route]
			}
			break
		}

		value[1] = {
			[name(indices[l1])]: [indices.slice(l1), value[1]],
			'': [[], route]
		}
	}

	return {
		add: function callee(route, tree){
			if (!route || !route.split) return
			var items = route.split(SEP)
			for (var i = 0, l = items.length, item, idx; i < l; i++){
				item = items[i]
				idx = item.indexOf(TOKEN)
				if (-1 === idx) idx = item.indexOf(CAPTURE)
				if (idx > 0) items[i] = [item.substr(0, idx - 1), item.substr(idx)]
			}

			add(route, items, tree)
		},
		match: function(path, tree, params){
		},
		build: function(path, tree, params){
		}
	}
})
