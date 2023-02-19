if('object'===typeof process){
	pico.ajaxMock = function(wd){
		var fs = require('fs')
		var path = require('path')
		return function(method, url, params, options, cb, userData){
			/* TODO why readfile not working?
			fs.readFile(url, 'utf8', (err, txt) => {
				if (err) return cb(err,4,null,userData)
				cb(null,4,txt,userData)
			})
			*/
			var p = path.resolve(wd, url)
			if (!fs.existsSync(p)) return setImmediate(cb, p+':not found', 4, null, userData)
			var txt = fs.readFileSync(p, 'utf8')
			if (txt) return setImmediate(cb, null, 4, txt, userData)
			setImmediate(cb, p+':failed', 4, null, userData)
		}
	}
}
