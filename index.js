// TODO: make pico a exports.module
!function(module, exports){
    'use strict'

    var
    pico,ajax,
    modules = {},
    paths = {'*':''},
    envs = {production:true},
    dummyCB = function(){},
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
                mod.signalStep(pico.LOAD, [])
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
            envs.production = !!options.production
            script = script.substring(script.indexOf('{') + 1, script.lastIndexOf('}'))

            pico.obj.extend(paths, options.paths)
            options.onLoad(function(){
                vm(options.name, script, function(err, mod){
                    script = undefined
                    options = undefined
                })
            })
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
        LOAD:           {value:'load',          writable:false, configurable:false, enumerable:true},
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
!function(context, mod){
    var
    Abs = Math.abs,Floor=Math.floor,Random=Math.random,
    API_ACK = 'ack',
    PT_CHANNEL = 0,
    PT_HEAD = 1,
    PT_BODY = 2,
    isOnline = true,
    stdCB = function(err){if (err) console.error(err)},
    appendFD = function(fd, name, value){ fd.append(name, value) },
    appendObj = function(obj, name, value){ obj[name] = value },
    timeSync = function(net, cb){
        cb = cb || stdCB
        context.ajax('get', net.url, null, null, function(err, readyState, responseText){
            if (4 !== readyState) return
            if (err) return cb(err)
            var st = parseInt(responseText)
            if (isNaN(st)) return cb('invalid timesync response')
            net.serverTime = st
            net.serverTimeAtClient = Date.now()
            net.beatId = setInterval(onBeat, net.beatRate, net)
            cb()
        })
    },
    onResponse = function(err, readyState, responseText, net){
        if (err) {
            // network or auth error, return error to callbacks
            var
            reqs = net.reqs,
            sep = net.delimiter,
            reqId, cb, r
            for (var i=0,l=reqs.length,r; i<l; i++){
                r = reqs[i]
                if (!r) continue
                try{
                    reqId = JSON.parse(r.split(sep)[0]).reqId
                    cb = net.callbacks[reqId]
                    if (!cb) continue
                    delete net.callbacks[reqId]
                    cb(err)
                }catch(exp){
                    console.error(exp)
                    continue
                }
            }
            reqs.length = 0
            return timeSync(net) // sync time, in case it was due to time error
        }

        // schedule next update
        switch(readyState){
        case 2: // send() and header received
            net.head = null
            net.currPT = PT_CHANNEL
            break
        case 3: break // body loading 
        case 4: // body received
            if (!net.beatId) net.beatId = setInterval(onBeat, net.beatRate, net)
            break
        }

        var
        startPos = net.resEndPos, endPos = -1,
        sep = net.delimiter,
        sepLen = sep.length,
        body = net.body,
        head

        try{
            while(true){
                endPos = responseText.indexOf(sep, startPos)
                if (-1 === endPos) break

                switch(net.currPT){
                case PT_CHANNEL:
                    net.channel = responseText.substring(startPos, endPos)
                    net.currPT = PT_HEAD
                    break
                case PT_HEAD:
                    net.head = JSON.parse(responseText.substring(startPos, endPos))
                    body.length = 0
                    net.currPT = PT_BODY
                    break
                case PT_BODY:
                    body.push(responseText.substring(startPos, endPos))
                    break
                }
                head = net.head
                if (head && head.len === body.length){
                    net.currPT = PT_HEAD

                    if (head.resId){
                        net.request(API_ACK, {resId:head.resId})
                    }
                    if (!head.reqId) {
                        console.error('incomplete response header: '+JSON.stringify(head))
                        return 
                    }
                    if (net.cullAge && net.cullAge < Abs(net.getServerTime()-head.date)) {
                        console.error('invalid server time: '+JSON.stringify(head)+' '+Abs(net.getServerTime()-head.date))
                        return 
                    }
                    if (net.secretKey && body.length){
                        var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.MD5, net.secretKey+head.date)

                        //key: CryptoJS.HmacMD5(JSON.stringify(data), this.secretKey+t).toString(CryptoJS.enc.Base64),
                        for(var i=0,l=body.length; i<l; i++){
                            hmac.update(body[i])
                        }

                        if (head.key !== hmac.finalize().toString(CryptoJS.enc.Base64)){
                            console.error('invalid server key: '+JSON.stringify(head))
                            return 
                        }
                    }
                    if (head.len)
                        head.data = JSON.parse(body[0], function(k, v){
                            switch(k){
                            case 'json': return JSON.parse(body[v])
                            case 'blob': return body[v]
                            default: return v
                            }
                        })
                    net.inbox.push(head)
                    net.head = null
                }

                startPos = endPos + sepLen
            }
        }catch(exp){
            // something is wrong
            console.error(exp)
        }
        net.resEndPos = startPos
    },
    onBeat = function(net){
        if (net.inbox.length){
            var
            inbox = net.inbox,
            callbacks = net.callbacks,
            reqId, cb

            for(var res; res=inbox.pop();){
                reqId = res.reqId
                cb = callbacks[reqId]
                if (cb){
                    delete callbacks[reqId]
                    cb(res.error, res.data)
                }
            }
        }

        // post update tasks, buffer data in memory network if offline
        if (isOnline && (net.uploads.length || net.outbox.length || net.acks.length)){

            net.resEndPos = 0

            if (net.uploads.length){
                var fb = net.uploads.shift()
                fb.append('channel', net.channel)
                context.ajax('post', net.url, net.uploads.shift(), null, onResponse, net)
            }else{
                var reqs = net.reqs = net.acks.concat(net.outbox)
                reqs.unshift(net.channel)
                net.acks.length = net.outbox.length = 0

                context.ajax('post', net.url, reqs.join(net.delimiter)+net.delimiter, null, onResponse, net)
            }
            clearInterval(net.beatId)
            net.beatId = 0
            return
        }
    },
    formation = function(form, addon, dst, prefix){
        prefix = prefix || ''

        var
        append = dst instanceof FormData ? appendFD : appendObj,
        uri = form.baseURI,
        fieldType, f, fl

        for (var i=0,elements = form.elements,field; field = elements[i]; i++) {
            if (!field.hasAttribute('name')) continue
            fieldType = field.hasAttribute('type') ? field.getAttribute('type').toUpperCase() : 'TEXT'
            if (fieldType === 'FILE') {
                for (f = 0, fl=field.files.length; f<fl; append(dst, prefix+field.name, field.files[f++]));
            } else if ((fieldType !== 'RADIO' && fieldType !== 'CHECKBOX') || field.checked) {
                append(dst, prefix+field.name, field.value)
            }//TODO: implement checkbox and radio
        }
        for (var k in addon) { append(dst, prefix+k, addon[k]) }

        uri = uri.substring(0, uri.lastIndexOf('/')+1)

        return form.action.substr(uri.length)
    },
    netConfig = function(net, cfg){
        net.url = cfg.url || net.url
        net.secretKey = cfg.secretKey || net.secretKey
        net.cullAge = cfg.cullAge || net.cullAge || 0
        net.delimiter = cfg.delimiter ? JSON.stringify(cfg.delimiter) : net.delimiter || JSON.stringify(['&'])
        net.beatRate = !cfg.beatRate || cfg.beatRate < 100 ? net.beatRate || 5000 : cfg.beatRate
    },
    netReset = function(net){
        net.resEndPos = net.outbox.length = net.acks.length = 0
        net.currPT = PT_CHANNEL
    }


    function Net(cfg){
        if (!cfg.url) return console.error('url is not set')
        netConfig(this, cfg)
        this.reqId = 1 + Floor(Random() * 1000)
        this.inbox = []
        this.outbox = []
        this.uploads = []
        this.callbacks = {}
        this.acks = []
        this.reqs = []
        this.resEndPos = 0
        this.channel = '',
        this.head = null,
        this.body = [],
        this.currPT = PT_CHANNEL,
        this.serverTime = 0
        this.serverTimeAtClient = 0
        this.beatId = 0
    }

    Net.prototype = {
        reconnect: function(cfg, cb){
            netConfig(this, cfg)
            netReset(this)
            timeSync(this, function(err){
                cb(err, this)
            })
        },
        submit: function(form, addon, cb){
            if ('undefined'===typeof window || !form || !(form instanceof HTMLFormElement)) return console.error('No HTMLFormElement submitted')

            var reqId = 0

            if (cb){
                reqId = this.reqId++
                this.callbacks[reqId] = cb
            }

            var fd = new FormData()

            fd.append('api', formation(form, addon, fd, 'data/'))
            fd.append('reqId', reqId)

            this.uploads.push(fd)
            if (!this.beatId) this.beatId = setInterval(onBeat, this.beatRate, this)
        },
        // data: optional, usually api specific data
        // addon: optional, usually common data for every api
        // cb: optional, without cb, reqId will be 0
        request: function(api, data, addon, cb){
            switch(arguments.length){
            case 2:
                if (data instanceof Function){
                    cb = data
                    data = addon = undefined
                }
                break
            case 3:
                if (addon instanceof Function){
                    cb = addon 
                    addon = undefined
                }
                break
            case 4: break
            default: return console.error('wrong request params!')
            }
            if ('undefined'!==typeof window && data instanceof HTMLFormElement){
                var obj = {}
                api = formation(data, addon, obj)
                data = obj
            }else if(addon){
                for (var k in addon) { data[k] = addon[k] }
            }
            if (!api) return console.error('Missing api,  data['+JSON.stringify(data)+']')

            var queue = this.acks
            if (api !== API_ACK){
                queue = this.outbox
                if (queue.length){
                    var lastReq = queue.shift()
                    if (-1 === lastReq.indexOf(api)){
                        queue.unshift(lastReq)
                    }
                }
            }

            var reqId = 0
            if (cb){
                reqId = this.reqId++
                this.callbacks[reqId] = cb
            }

            var dataList=[]

            if (data){
                dataList.unshift(JSON.stringify(data, function(k, v){
                    switch(k){
                    case 'json': return dataList.push(JSON.stringify(v))
                    case 'blob': return dataList.push(v)
                    default: return v
                    }
                }))
            }

            if (dataList.length && this.secretKey){
                var
                t = this.getServerTime(),
                hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.MD5, this.secretKey+t) // result of utf8 is diff from node.crypto

                //key: CryptoJS.HmacMD5(JSON.stringify(data), this.secretKey+t).toString(CryptoJS.enc.Base64),
                for(var i=0,l=dataList.length; i<l; i++){
                    hmac.update(dataList[i])
                }

                dataList.unshift(JSON.stringify({
                    api: api,
                    reqId: reqId,
                    len:dataList.length,
                    date: t,
                    key: hmac.finalize().toString(CryptoJS.enc.Base64)
                }))
            }else{
                dataList.unshift(JSON.stringify({
                    api: api,
                    reqId: reqId,
                    len:dataList.length
                }))
            }
            queue.push(dataList.join(this.delimiter))

            if (!this.beatId) this.beatId = setInterval(onBeat, this.beatRate, this)
        },
        getServerTime: function(){
            return this.serverTime + (Date.now() - this.serverTimeAtClient)
        }
    }

    context[mod]={
        create: function(cfg, cb){
            var net= new Net(cfg)
            timeSync(net, function(err){
                cb(err, net)
            })
        },
        //window.addEventListener('online', online)
        online: function(){isOnline=true},
        //window.addEventListener('offline', offlie)
        offline: function(){isOnline=false}
    }
}('undefined'===typeof pico?module.exports:pico,'web')
!function(context, mod){
    context[mod] = {
        extend: function(to, from, options){
            var o = 'object'
            if (o !== typeof from || typeof to !== typeof from) return from
            if (!options || o !== typeof options) options = {}
            var tidy = options.tidy, callee=arguments.callee,key, value
            if (undefined === from.length){
                for (key in from){
                    value = from[key]
                    if (undefined === value && tidy) continue
                    to[key] = callee(to[key], value, options)
                }
            }else{
                if (options.mergeArr){
                    var i, l, unique={}
                    for (i=0,l=to.length; i<l; i++){
                        if (undefined === (value = to[i]) && tidy) continue
                        unique[value] = value
                    }
                    for (i=0,l=from.length; i<l; i++){
                        if (undefined === (value = from[i]) && tidy) continue
                        unique[value] = value
                    }
                    to = []
                    for (key in unique) to.push(unique[key]);
                }else{
                    to = from
                }
            }
            return to
        },
        extends: function(to, list, options){
            var e = pico.obj.extend
            for(var i=0,f; f=list[i]; i++){
                to= e(to, f, options)
            }
            return to
        },
        parseInts: function(arr){
            for(var i=0,l=arr.length; i<l; i++){
                arr[i] = parseInt(arr[i])
            }
            return arr
        },
        // pluck([{k:1},{k:2}], 'k') = [1,2]
        pluck: function(objs, key){
            var arr = []
            if (objs.length){
                var map = {}, obj, id, i, l, k
                for(i=0,l=objs.length; i<l; i++){
                    obj = objs[i]
                    if (!obj) continue
                    id = obj[key]
                    if (undefined === id) continue
                    map[id] = id
                }
                for(k in map){
                    arr.push(map[k])
                }
            }
            return arr
        },
        // strip([{k:1,q:1},{k:2,q:2}], 'k') = [{q:1},{q:2}]
        strip: function(objs, key){
            if (objs.length){
                for(var i=0,o; o=objs[i]; i++){
                    o[key] = undefined
                }
            }
            return objs 
        },
        // keyValues([{k:1, v:5},{k:2, v:6}], 'k', 'v') = {1:5, 2:6}
        keyValues: function(arr, key, value){
            var kv = {}
            for(var i=0,a; a=arr[i]; i++){
                kv[a[key]] = a[value]
            }
            return kv
        },
        // map([{k:1, v:5},{k:2, v:6}], {1:'key1', 2:'key2'}, 'k', 'v') = {key1:5, key2:6}
        map: function(arr, keys, K, V){
            var output = {}
            for(var i=0,a; a=arr[i]; i++){
                output[keys[a[K]]] = a[V]
            }
            return output
        },
        // replace([{k:1, v:5},{k:2, v:6}], {1:'key1', 2:'key2'}, 'k') = [{k:'key1', v:5},{k:'key2', v:6}]
        replace: function(arr, keys, K){
            for(var i=0,a; a=arr[i]; i++){
                a[K] = keys[a[K]]
            }
            return arr
        },
        // group([{k:1, v:5},{k:1, v:6}], {1:'key1', 2:'key2'}, 'k') = {key1:[{k:1,v:5},{k:1,v:6}]}
        group: function(arr, keys, K){
            var output = {}, k
            for(var i=0,a; a=arr[i]; i++){
                k = a[K]
                k = keys[k] || k
                output[k] = output[k] || []
                output[k].push(a)
            }
            return output
        },
        // values(['key1','key2'], {key1:1, key2:2}) = [1,2]
        values: function(keys, kv){
            var output = []
            for(var i=0,k; k=keys[i]; i++){
                output.push(kv[k])
            }
            return output
        },
        // merge({key1:1, key2:2}, {key3:3, key4:4}) = {key1:1,key2:2,key3:3,key4:4}
        merge: function(obj1, obj2){
            if (!obj1) return obj2
            if (!obj2) return obj1
            for(var i=0,keys = Object.keys(obj2),k; k=keys[i]; i++){
                obj1[k] = obj2[k]
            }
            return obj1
        },
        // mergeByKey({key1:1, key2:2}, {key1:2, key3:3}, {key1:1, key3:4}, 'key1') = [{key1:1,key2:2,key3:4},{key1:2,key3:3}]
        mergeByKey: function(arr1, arr2, KEY){
            var m=module.exports.merge,k, obj={}, arr=[]
            if (arr1){
                for(var i=0,a1; a1=arr1[i]; i++){
                    k = a1[KEY]
                    if (undefined === k) continue
                    obj[k] = a1
                }
            }
            if (arr2){
                for(var j=0,a2; a2=arr2[j]; j++){
                    k = a2[KEY]
                    if (undefined === k) continue
                    a1 = obj[k]
                    obj[k] = a1 ? m(a1,a2) : a2
                }
            }
            for(k in obj){
                arr.push(obj[k])
            }
            return arr
        },
        // filter([{key1:1,key2:2},{key1:2,key2:3}], [1], 'key1') = [{key1:2,key2:3}]
        filter: function(list, exclude, key){
            var arr=[],k
            for(var i=0,l; l=list[i]; i++){
                k = l[key]
                if (!k || -1 !== exclude.indexOf(k)) continue
                arr.push(l)
            }
            return arr
        },
        // insert([{key2:2}, {key3:3}, {key1:3}], {key4:4,key5:5}) = [{key2:2,key4:4,key5:5},{key3:3,key4:4,key5:5},{key1:3,key4:4,key5:5}]
        insert: function(arr, obj){
            var m = module.exports.merge
            for(var i=0,a; a=arr[i]; i++){
                a = m(a, obj)
            }
            return arr
        }
    }
}('undefined' === typeof pico ? module.exports:pico, 'obj')
!function(context, mod){
    context[mod]= {
        codec: function(num, str){
            var ret=''
            for(var i=0,c; c=str.charCodeAt(i); i++){
                ret += String.fromCharCode(c ^ num)
            }
            return ret
        },
        hash: function(str){
            var h = 0

            for (var i=0,c; c=str.charCodeAt(i); i++) {
                h = ((h<<5)-h)+c
                h = h & h // Convert to 32bit integer
            }
            return h
        }
    }
}('undefined' === typeof pico ? module.exports:pico, 'str')
!function(context, mod){
    var
    HR = 3600000,
    MIN = 60000,
    SEC = 1000

    context[mod]={
        deltaToNext: function(day, hr, min, sec, msec){
            hr = hr || 0
            min = min || 0
            sec = sec || 0
            msec = msec || 0

            var 
            d = new Date(),
            remain = (d.getTime() % HR) - (min*MIN + sec*SEC + msec),
            deltaHr = hr + (24*day) - d.getHours()

            return (deltaHr * HR) - remain
        },
        timeOfNext: function(day, hr, min, sec, msec){
            var
            delta = this.deltaToNext(day, hr, min, sec, msec),
            nextTime = new Date(Date.now() + delta)

            return nextTime.getTime()
        }
    }
}('undefined' === typeof pico ? module.exports:pico, 'time')
!function(context, mod, format){
    context[mod]= {
        ensure: function(msg, task){
            task(function(err, result){
                if (err) return console.error(msg+':\t'+err)
                console.log(msg+':\t'+format(result,{colors:true}))
            })
        }
    }
}('undefined' === typeof pico ? module.exports:pico, 'test', 'undefined' === typeof require ? JSON.stringify : require('util').inspect)
