!function(module, exports){
    'use strict'

    var
    pico,ajax,
    LOAD='load',
    modules = {},
    paths = {'*':''},
    envs = {production:true},
    dummyCB = function(){},
    dummyLoader=function(cb){cb()},
    dummyObj = {},
    dummyGlobal = function(){
        var
        g = this,
        notAllows = ['frameElement'],
        o = {}
        for(var k in g){
            if (-1 !== k.indexOf('webkit') || -1 !== notAllows.indexOf(k)) continue
            if (g[k] instanceof Function) o[k] = dummyCB
            else o[k] = dummyObj
        }
        return o
    }(),
    createMod = function(link, obj, ancestor){
        ancestor = ancestor || pico.prototype

        obj.__proto__ = Object.create(ancestor, {
            moduleName: {value:link,    writable:false, configurable:false, enumerable:true},
            base:       {value:ancestor,writable:false, configurable:false, enumerable:true},
            slots:      {value:{},      writable:false, configurable:false, enumerable:false},
            signals:    {value:{},      writable:false, configurable:false, enumerable:false},
            contexts:   {value:{},      writable:false, configurable:false, enumerable:false},
        })
        return obj
    },
    getMod = function(link){
        var mod = modules[link]
        if (mod) return mod
        return modules[link] = {}
    },
    getModAsync = function(link, cb){
        return cb ? loadLink(link, cb) : getMod(link)
    },
    parseFunc = function(me, require, inherit, script){
        try{
            Function('exports', 'require', 'inherit', 'me', script).call(this, me, require, inherit, me)
            return me
        }catch(exp){
            //console.error(exp.fileName+' ('+exp.lineNumber+':'+exp.columnNumber+')')
            console.error(exp.stack)
        }
    },
    vm = function(scriptLink, script, cb){
        // 2 evaluation passes, 1st is a dry run to get deps, after loading deps, do the actual run
        var
        deps=[],
        ancestorLink

        parseFunc.call(dummyGlobal, createMod(scriptLink, {}), function(l){if(!modules[l])deps.push(l)}, function(l){ancestorLink=l}, script)

        loadLink(ancestorLink, function(err, ancestor){
            if (err) return cb(err)

            var mod = parseFunc(createMod(scriptLink, getMod(scriptLink), ancestor), getModAsync, dummyCB, '"use strict"\n'+script+(envs.production ? '' : '//# sourceURL='+scriptLink))
            loadDeps(deps, function(err){
                if (err) return cb(err)
                mod.signalStep(LOAD, [])
                cb(null, mod)
                deps = ancestorLink = ancestor = script = mod = undefined
            })
        })
    },
    loadLink = function(link, cb){
        if (!link) return cb()
        var mod = modules[link]
        if (mod && mod.moduleName) return cb(null, mod)
        if (!mod) mod = modules[link] = {}

        var
        raw = '@' === link[0],
        symbol = raw ? link.substr(1) : link,
        fname = paths[symbol],
        path = ''

        if (!fname){
            var keyPos = symbol.indexOf('/')

            if (-1 !== keyPos){
                path = paths[symbol.substr(0, keyPos)]
            }
            fname = symbol.substr(keyPos+1)
            path = path || paths['*'] || ''
        }
        fname = raw ? fname : fname+'.js'

        ajax('get', path+fname, '', null, function(err, readyState, text){
            if (err) return cb(err)
            if (4 !== readyState) return
            if (raw){
                mod.text = text
                try{ mod.json = JSON.parse(mod.text) }
                catch(exp){}
                return cb(null, mod)
            }
            return vm(link, text, cb)
        })

        return mod
    },
    // recurssively load dependencies in a module
    loadDeps = function(deps, cb){
        if (!cb) cb = function(){}
        if (!deps || !deps.length) return cb()

        var link = deps.shift()

        loadLink(link, function(err){
            if (err) return cb(err)
            return loadDeps(deps, cb)
        })
    }

    module[exports]=pico={
        start: function(options, cb){
            var script = cb.toString()

            pico.ajax = ajax = options.ajax
            envs.production = 'prod'===options.env
            script = script.substring(script.indexOf('{') + 1, script.lastIndexOf('}'))

            pico.obj.extend(paths, options.paths);
            (options.onLoad || dummyLoader)(function(){
                vm(options.name, script, function(err, mod){
                    script = undefined
                    options = undefined
                })
            })
        },
        stop: function(){
        },
        ajax: null,
        // for future file concatenating
        def: function(scriptLink, script){
            vm(srciptLink, script, dummyCB)
        },
        getEnv: function(key){ return envs[key] },
        // use require('html') insteads?
        embed: function(holder, url, cb){
            ajax('get', url, '', null, function(err, readyState, text){
                if (err) return cb(err)
                if (4 !== readyState) return
                holder.innerHTML = text

                pico.embedJS(Array.prototype.slice.call(holder.getElementsByTagName('script')), cb)
            })
        },
        // always fire LOAD event when script is embed, due to dom have been reloaded
        embedJS: function(scripts, cb){
            if (!scripts || !scripts.length) return cb && cb()

            var
            script = scripts.shift(),
            link = script.getAttribute('link'),
            content = script.textContent || script.innerText

            if (!link) return pico.embedJS(scripts, cb) // non pico script tag, ignore

            if (content){
                vm(link, content, function(err){
                    if (err) console.error('embedJS ['+link+'] with content error: '+err)
                    return pico.embedJS(scripts, cb)
                })
            }else{
                loadLink(link, function(err){
                    if (err) console.error('embedJS['+link+'] without content error: '+err)
                    return pico.embedJS(scripts, cb)
                })
            }
        },

        slot: function(channelName, func, context){
            var
            channel = this.slots[channelName] = this.slots[channelName] || {},
            con = this.contexts[channelName] = this.contexts[channelName] || {},
            evt = this.signals[channelName],
            h = pico.str.hash(channelName+func.toString())

            channel[h] = func
            con[h] = context
            if (evt) func.apply(context, evt)
        },
        unslot: function(channelName, func){
            var
            slots = this.slots,
            contexts = this.contexts,
            k, c
            switch(arguments.length){
            case 0:
                for(k in slots) delete slots[k]
                for(k in contexts) delete contexts[k]
                break
            case 1:
                c = slots[channelName] || {}
                for(k in c) delete c[k]
                c = contexts[channelName] || {}
                for(k in c) delete c[k]
                break
            case 2:
                var h = pico.str.hash(channelName + func.toString())
                c = slots[channelName] || {}
                if (c) delete c[h]
                c = contexts[channelName] || {}
                if (c) delete c[h]
                break
            }
        },
        signal: function(channelName, evt){
            var
            channel = this.slots[channelName],
            con = this.contexts[channelName],
            results = [],
            mod

            if (!channel) return results
            evt = evt || []

            for(var key in channel){
                results.push(channel[key].apply(con[key], evt))
            }
            return results
        },
        signalStep: function(channelName, evt){
            this.signals[channelName] = evt
            this.signal(channelName, evt)
        }
    }

    Object.defineProperties(pico, {
        slots:          {value:{},              writable:false, configurable:false, enumerable:false},
        signals:        {value:{},              writable:false, configurable:false, enumerable:false},
        contexts:       {value:{},              writable:false, configurable:false, enumerable:false},
    })

    pico.prototype = {
        slot: pico.slot,
        unslot: pico.unslot,
        signal: pico.signal,
        signalStep: pico.signalStep,
    }

}('undefined' === typeof window ? module : window, 'undefined' === typeof window ? 'exports':'pico')
