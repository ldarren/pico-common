define('pico/arr',function(exports,require){
	function eq(a1, a2){
		if (!Array.isArray(a1) || !Array.isArray(a2) || a1.length !== a2.length) return false
		a1 = a1.slice().sort()
		a2 = a2.slice().sort()
		for (var i = 0, l = a1.length, a; i < l; i++){
			a = a1[i]
			if (Array.isArray(a)) if (!eq(a, a2[i])) return false
			if (a !== a2[i]) return false
		}
		return true
	}
	return {
		diff: function(from, to){
			if (!Array.isArray(from) || !from.length) return [to, []]
			if (!Array.isArray(to) || !to.length) return [[], from]
			var rem = from.filter(f => !to.includes(f))
			var add = to.filter(t => !from.includes(t))
			return [add, rem]
		},
		eq: eq,
	}
})
