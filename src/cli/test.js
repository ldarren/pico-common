define('pico/test', function(){
    var pStr = pico.export('pico/str')
	var isNode = 'undefined' !== typeof require
	var format = isNode ? require('util').inspect : JSON.stringify
	var stdout = true
	var fname, end

	function write(msg, err, result){
		if (!stdout) return
		console.log(msg + ':' + pStr.tab(msg, 100, '.') + format(result, {colors:true}))
		if (err) console.error(err)
	}

	function writeSection(msg, output){
		if (stdout) {
			console.log(msg)
			//console.log('Summary:', output.summary)
			output.results.forEach(function(r){
				write(r.msg, r.err, r.result)
			})
		}
	}

	function test(runner, msg, task, writable){
		runner.run(runner, task, function(err, result, extra){
			if (writable) write(msg, err, result, extra)
			return {msg: msg, error: err, result: result, extra: extra}
		})
	}

	// TODO: for series, exec should add to task list
	function spawn(runner, Flow, msg, group){
		runner.branch()

		function C(){
			Flow.call(this, function(output){
				writeSection(msg, output)
				runner.merge(output)
			})
			group.call(this)	
		}

		C.prototype  = Flow.prototype

		runner.exec(function(){ new C })
	}

	function recur(ctx, funcs, idx, args, cb){
		if (funcs.length <= idx) return cb(null, args.slice())
		funcs[idx++].apply(ctx, args.concat([function(err, as){
			if (err) return cb(err)
			if (as){
				args.length = as.length
				for (var i=0, l=args.length; i<l; i++){
					args[i] = as[i]
				}
			}
			recur(ctx, funcs, idx, args, cb)
		}]))
	}
	function onBegin(ctx, total, next){
		if (total) return next(null, ctx.args.slice())
		recur(ctx, ctx.begins, 0, ctx.args, next)
	}
	function onEnd(ctx, next){
		recur(ctx, ctx.ends, 0, ctx.args, next)
		ctx.begins.length = 0
		ctx.befores.length = 0
		ctx.afters.length = 0
		ctx.ends.length = 0
	}
	function onBefore(ctx, args, next){
		recur(ctx, ctx.befores, 0, args, next)
	}
	function onAfter(ctx, args, next){
		recur(ctx, ctx.afters, 0, args, next)
	}

	function Section(){
		this.begins = []
		this.ends = []
		this.befores = []
		this.afters = []
		this.args = []
	}

	Section.prototype = {
		begin: function(task){
			this.begins.push(task)
		},
		end: function(task){
			this.ends.push(task)
		},
		before: function(task){
			this.befores.push(task)
		},
		after: function(task){
			this.afters.push(task)
		},
		test: function(msg, task){
			test(this, msg, task)
		},
		series: function(msg, group){
			spawn(this, Series, msg, group)
		},
		parallel: function(msg, group){
			spawn(this, Parallel, msg, group)
		}
	}

	function Parallel(done){
		Section.call(this)
		this.summary = {total: 0, suceeded: 0, failed: 0, error: 0}
		this.results = []
		this.done = done
	}

	Parallel.prototype = Object.assign({
		run: function(ctx, func, cb){
			var o = this
			var s = o.summary
			var rs = o.results

			onBegin(o, s.total, function(err, args){
				if (err) return cb(err)
				s.total++

				setTimeout(function(next){
					onBefore(o, args, function(){
						func.apply(ctx, args.concat([next]))
					})
				}, 0, function(err, result){
					rs.push(cb(err, result, Array.prototype.slice.call(arguments, 2)))

					if (err) s.error++ 
					else result ? s.suceeded++ : s.failed++
					onAfter(o, args, function(){
						if (s.total === s.suceeded + s.failed + s.error)
							return onEnd(o, function(){
								o.done({summary: s, results: rs})
							})
					})
				})
			})
		},
		exec: function(func){
			setTimeout(func, 0)
		},
		branch: function(){
			this.summary.total += 1
		},
		merge: function(output){
			var s = this.summary

			s.total -= 1

			var os = output.summary

			s.total += os.total
			s.suceeded += os.suceeded
			s.failed += os.failed
			s.error += os.error

			var rs = this.results
			var ors = output.results
			rs.push.apply(rs, ors)

			if (s.total === s.suceeded + s.failed + s.error) this.done({summary: s, results: rs})
		}
	}, Section.prototype)

	function Series(done){
		Parallel.call(this, done)
		this.tasks = []
		this.running = false
	}

	Series.prototype = Object.assign({
		run: function(ctx, func, cb, retry){
			var o = this
			var ts = o.tasks
			var s = o.summary
			var rs = o.results
		
			onBegin(o, s.total, function(err, args){
				if (err) return cb(err)
				s.total += retry ? 0 : 1
				if ((!retry && ts.length) || o.running) return ts.push([ctx, func, cb, 1])

				o.running = true

				// use timeout in case func is blocking
				setTimeout(function(next){
					onBefore(o, args, function(){
						func.apply(ctx, args.concat([next]))
					})
				}, 0, function(err, result){
					rs.push(cb(err, result, Array.prototype.slice.call(arguments, 2)))
					if (err) s.error++
					else result ? s.suceeded++ : s.failed++
					onAfter(o, args, function(){
						if (s.total === s.suceeded + s.failed + s.error) 
							return onEnd(o, function(){
								o.done({summary: s, results: rs})
							})

						o.running = false
						o.run.apply(o, ts.shift())
					})
				})
			})
		},
		exec: function(func){
			var o = this
			var ts = o.tasks
			if (ts.length) return ts.push([null, func, function(){}, 1])
			func()
		},
		branch: function(){
			this.running = true
			Parallel.prototype.branch.call(this)
		},
		merge: function(output){
			this.running = false
			Parallel.prototype.merge.call(this, output)
		}
	}, Section.prototype)

	var runner = new Series(function(output){
		var s = output.summary
		if (stdout) console.log('\nSummary:', s)
		if (fname) require('fs').writeFileSync(fname, JSON.stringify(output))
		if (end) end(output)
		if (isNode) process.exit(s.failed + s.error)
	})

	return {
		setup: function(options){
			end = options.end
			stdout = options.stdout
			fname = isNode && options.fname
		},
		test: function(msg, task){
			test(runner, msg, task, true)
		},
		series: function(msg, group){
			spawn(runner, Series, msg, group)
		},
		parallel: function(msg, group){
			spawn(runner, Parallel, msg, group)
		}
	}
})
