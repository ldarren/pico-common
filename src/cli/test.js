define('pico/test',function(){
    var pStr = pico.export('pico/str')
	var isNode = 'undefined' !== typeof require
	var format = isNode ? require('util').inspect : JSON.stringify
	var summary = { total: 0, suceeded: 0, failed: 0, error: 0 }
	var results = []
	var output = { summary: summary, results: results }
	var stdout = true
	var fname, end

	function write(msg, err, result){
		if (!stdout) return
		console.log(msg + ':' + pStr.tab(msg, 100, '.') + format(result, {colors:true}))
		if (err) console.error(err)
	}

	function record(err, result){
		if (err) {
			summary.error++
			write(this, err, false)
			results.push({msg: this, error: err, result: false})
		} else {
			result ? summary.suceeded++ : summary.failed++
			write(this, err, result)
			results.push({msg: this, result: result, extra: Array.prototype.slice.call(arguments, 2)})
		}

		if (summary.total === summary.suceeded + summary.failed + summary.error){
			if (stdout) console.log('\nSummary:', summary)
			if (fname) require('fs').writeFileSync(fname, JSON.stringify(output))
			if (end) end(output)
			if (isNode) process.exit(summary.failed + summary.error)
		}
	}

    return {
		setup: function(options){
			end = options.end
			stdout = options.stdout
			fname = isNode && options.fname
		},
        ensure: function(msg, task){
			summary.total++
            setTimeout(task, 0, function(){
				record.apply(msg, arguments)
            })
        }
    }
})
