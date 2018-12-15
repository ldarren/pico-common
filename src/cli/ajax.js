if('object'===typeof process){
	pico.ajax=pico.ajax||function(method, url, params, options, cb, userData){
		/* TODO why readfile not working?
        require('fs').readFile(url, 'utf8', (err, txt) => {
            if (err) return cb(err,4,null,userData)
            cb(null,4,txt,userData)
        })
        */
		var txt = require('fs').readFileSync(url, 'utf8')
		if (txt) return setImmediate(cb, null, 4, txt, userData)
		setImmediate(cb, 'failed', 4, null, userData)
	}
}
