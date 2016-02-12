(function(module,exports,require){var
dummyCB=function(){},
dummyLoader=function(){arguments[arguments.length-1]()},
dummyPico={run:dummyCB,build:dummyCB,reload:dummyCB,parse:dummyCB,import:dummyCB,export:dummyCB,env:dummyCB,ajax:dummyCB},
htmlescape= { '&':'&amp;', "'":'&#039;', '\n':'\\n','\r':'\\n' },
modules={},
// module events, e.g. onLoad
events={}, //TODO: should be prototype of event class that support sigslot
EXT_JS='.js',EXT_JSON='.json',
DEF="define('URL','FUNC')\n",
MOD_PREFIX='"use strict";\n',
MOD_POSTFIX='//# sourceURL=',
PLACE_HOLDER='return arguments.callee.__proto__.apply(this,arguments)',
// call when pico.run done
ajax,ran,
paths={},
env={},
preprocessors={},
funcBody=function(func){
    return func.substring(func.indexOf('{')+1,func.lastIndexOf('}'))
},
getExt=function(url){
    if (!url)return null
    var idx=url.lastIndexOf('.')
    return -1!==idx && -1===url.indexOf('/',idx) ? url.substr(idx) : null
},
// link to all deps
linker=function(deps, cb){
    if (!deps.length) return cb()
    loader(deps.shift(),function(err){
        if (err) return cb(err)
        linker(deps, cb)
    })
},
// load files, and execute them based on ext
loader=function(url,cb){
    if (modules[url])return cb(null, modules[url])

    var
    ext=getExt(url),
    symbolIdx=url.indexOf('/'),
    path=paths[-1===symbolIdx?url : url.substr(0,symbolIdx)]

    if (!path){
        symbolIdx=-1
        path=paths['*']||''
    }

    var fname=-1===symbolIdx?url : url.substr(symbolIdx+1)

    if (path instanceof Function){
        path(fname, function(err, m){
            if (err) return cb(err)
            modules[url]=m
            cb(null, m)
        })
    }else{
        ajax('get',path+fname+(ext?'':EXT_JS),null,null,function(err,state,txt){
            if (err) return cb(err)
            if (4!==state) return
            switch(ext || EXT_JS){
            case EXT_JS: return js(url,txt,cb)
            default: return cb(null, define(url,txt))
            }
        })
    }
},
placeHolder=function(){
    return Function(PLACE_HOLDER)
},
getMod=function(url,cb){
    var mod=modules[url]
    if(mod){
        setTimeout(cb||dummyCB, 0, null, mod) // make sure consistent async behaviour
        return mod
    }
    if (cb) return loader(url,cb)
    return modules[url]=placeHolder()
},
// do not run the module but getting the deps and inherit
compile=function(url,txt,deps,base,me){
    me=me||dummyPico
    var
    script=url ? MOD_PREFIX+txt+(env.live ? '' : MOD_POSTFIX+url) : txt,
    frequire=function(k){if(!modules[k])deps.push(k);return modules[k]},
    inherit=function(k){base.unshift(k),frequire(k)}

    try{ var func=Function('exports','require','module','define','inherit','pico',script) }
    catch(e){return console.error(url, e.message)}

    func.call({}, {},frequire,{},dummyCB,inherit,me)
    return func
},
// run the module and register the module output and events
define=function(url, func, base, mute){
    var
    ext=getExt(url)||EXT_JS,
    pp=preprocessors[ext]

    if (pp) func=pp(url, func)

    switch(ext){
    case EXT_JS:
        var
        module={exports:{}},
        evt={},
        m=func.call(mute?{}:evt,module.exports,getMod,module,define,dummyCB,pico)||module.exports

        if (base)m.__proto__=base

        if(evt.load)evt.load()

        if (!url) return m

        events[url]=evt

        var o=modules[url]

        if(o){
            o.prototype=m.prototype
            o.__proto__=m
            return modules[url]=o
        }
        return modules[url]=m
    case EXT_JSON:
        try{ return modules[url]=JSON.parse(func) }
        catch(e){return console.error(url, e.message)}
    default: return modules[url]=func
    }
},
// js file executer
js=function(url,txt,cb){
    cb=cb||dummyCB
    if (modules[url])return cb(null, modules[url])

    var
    deps=[],
    base=[],
    func=compile(url,txt,deps,base)

    if(url)modules[url]=placeHolder()

    linker(deps, function(err){
        if (err) return cb(err)
        
        cb(null,define(url,func,modules[base[0]]))
    })
}

var pico=module[exports]={
    run:function(options,func){
        pico.ajax=ajax=options.ajax||ajax
        paths=options.paths||paths
        env=options.env||env
        preprocessors=options.preprocessors||preprocessors

        ;(options.onLoad||dummyLoader)(function(){
            js(options.name||null,funcBody(func.toString()),function(err,main){
                if (err) return console.error(err)
                if (main instanceof Function) main()
                if(ran)ran()
            })
        })
    },
    build:function(options){
        var
        fs=require('fs'),
        entry=options.entry,
        output=options.output,
        exclude=options.exclude,
        orgDefine=define,
        addDeps=function(output, deps){
            if (!deps || !deps.length) return
            fs.appendFileSync(output, fs.readFileSync(deps.shift()))
            fs.appendFileSync(output, '\n')
            addDeps(output, deps)
        },
        addInclude=function(include, cb){
            if (!include || !include.length) return cb()
            loader(include.shift(), function(err){
                addInclude(include, cb)
            })
        }

        // overide define to write function
        define=function(url, func, base){
            orgDefine(url, func, base, true)
            if(!url)return
            if (-1 !== exclude.indexOf(url)) return
            // TODO why appendFile not working?
            switch(getExt(url)||EXT_JS){
            case EXT_JS: return fs.appendFileSync(output, DEF.replace('URL',url).replace("'FUNC'",func.toString()))
            case EXT_JSON: return fs.appendFileSync(output, DEF.replace('URL',url).replace('FUNC',JSON.stringify(JSON.parse(func))))
            default: return fs.appendFileSync(output, DEF.replace('URL',url).replace('FUNC',func.replace(/[&'\n\r]/g, function(m){return htmlescape[m]})))
            }
        }

        fs.unlink(output, function(){
            addDeps(output, options.deps)
            fs.readFile(entry, 'utf8', function(err, txt){
                if (err) return console.error(err)
                // overide define to write function
                var func=compile(null,txt,[],[],pico) // since no define, compile with real pico
                if (-1 !== exclude.indexOf(entry)) return
                ran=function(){
                    // TODO why need to kill?
                    addInclude(options.include, function(err){
                        if (err) console.error(err)
                        fs.appendFileSync(output, funcBody(func.toString()))
                        process.exit()
                    })
                }
            })
        })
    },
    reload:function(url, script, cb){
        if ('function'===typeof script) cb=script
        cb=cb||dummyCB
        var o=modules[url]
        delete modules[url]
        if (EXT_JS !== (getExt(url)||EXT_JS)) return cb(null, o)
        var reattach=function(err, m){
            if (err) return cb(err)
            if (!o) return cb(null, m)
            o.prototype=m.prototype
            o.__proto__=m
            return cb(null, modules[url]=o)
        }
        if ('string'=== typeof script) js(url, script, reattach)
        else loader(url, reattach)
    },
    parse:js,
    import:require,
    export:getMod,
    env:function(k){ return env[k] }
}
if('object'===typeof process){
    ajax=ajax||function(method, url, params, headers, cb, userData){
        /* TODO why readfile not working?
        require('fs').readFile(url, 'utf8', function(err, txt){
            if (err) return cb(err,2,null,userData)
            cb(null,4,txt,userData)
        })
        */
        var txt = require('fs').readFileSync(url, 'utf8')
        if (txt) return process.nextTick(cb, null, 4, txt, userData)
        process.nextTick(cb, 'failed', 2, null, userData)
    }
    if(process.argv[2])loader(process.argv[2],dummyCB)
}
define('pico/obj',function(){
    var allows = ['object','function']
    return  {
        extend: function(to, from, options){
            var tf=allows.indexOf(typeof to)
            if (-1 === tf) return from
            var ft=allows.indexOf(typeof from)
            if (-1 === ft)return to
            if (1===ft && ft===tf) return from
            options=options||{}
            var tidy = options.tidy, callee=arguments.callee,key, value
            if (1===ft || undefined === from.length){ // function or object (non array)
                for (key in from){
                    value = from[key]
                    if (undefined === value && tidy) continue
                    to[key] = callee(to[key], value, options)
                }
            }else{
                if (options.mergeArr){
                    // TODO: change unique to Set when is more commonly support on mobile
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
            var e = this.extend
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
})
define('pico/str', function(){
    var
    Ceil=Math.ceil, Random=Math.random,
    callerFormat = function(_, stack){
        var r = stack[0]
        return '['+
            (r.getFunctionName() || r.getTypeName()+'.'+r.getMethodName())+
            '@'+r.getFileName() + ':' + r.getLineNumber() + ':' + r.getColumnNumber()+']'
    }
    return {
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
        },
        rand: function(){
            return Random().toString(36).substr(2)
        },
        tab: function(col1, spaces, c){
            var ret='', l=spaces-col1.length
            if (!l || l<1) return ret
            c=c||' '
            for(var i=0; i<l; i++) ret+=c
            return ret
        },
        log: function(){
            var
            orgPrepare = Error.prepareStackTrace,
            orgCount = Error.stackTraceLimit

            Error.prepareStackTrace = callerFormat
            Error.stackTraceLimit = 1

            var err = new Error
            Error.captureStackTrace(err, arguments.callee)
            var params = [(new Date).toISOString(), err.stack]
            console.log.apply(console, params.concat(Array.prototype.slice.call(arguments)))

            Error.prepareStackTrace = orgPrepare
            Error.stackTraceLimit = orgCount
        },
        error: function(){
            var orgCount = Error.stackTraceLimit

            Error.stackTraceLimit = 4

            var err = new Error
            Error.captureStackTrace(err, arguments.callee)
            var params = [(new Date).toISOString()]
            params = params.concat(Array.prototype.slice.call(arguments))
            params.push('\n')
            console.error.apply(console, params.concat(err.stack))

            Error.stackTraceLimit = orgCount
        }
    }
})
define('pico/test',function(){
    var
    str=pico.export('pico/str'),
    format='undefined' === typeof require ? JSON.stringify : require('util').inspect

    return {
        ensure: function(msg, task){
            task(function(err, result){
                if (err) return console.error(msg+':'+str.tab(msg,100,'-')+err)
                console.log(msg+':'+str.tab(msg,100,'.')+format(result,{colors:true}))
            })
        }
    }
})
define('pico/time',function(){
    var
    Max=Math.max,
    Min=Math.min,
    Floor=Math.floor,
    DAY= 86400000,
    HR = 3600000,
    MIN = 60000,
    SEC = 1000,
    parseQuark=function(quark, min, max){
        var
        q=quark.split('/'),
        q1=q[0]

        if ('*'===q1){
            q[0]=min
        }else{
            q1=q[0]=parseInt(q1)
            if (q1<min || q1>max) return // error
        }

        if (1===q.length) q.push(0) // interval=1
        else q[1]=parseInt(q[1])

        return q
    },
    parseAtom=function(atom, min, max){
        if ('*'===atom) return 0
        var 
        ret=[]
        list=atom.split(',')
        for(var i=0,l,range,j,r,r1,r2,rm,ri; l=list[i]; i++){
            r=l.split('-')
            if (!r.length) return null// error
            r1=parseQuark(r[0],min,max)
            if (1===r.length){
                ri=r1[1]
                if (ri) for(j=r1[0]; j<=max; j+=ri) ret.push(j);
                else ret.push(r1[0])
                continue
            }
            r2=parseQuark(r[1],min,max)
            j=r1[0]
            rm=r2[0]
            ri=r2[1]||1
            if (j>rm){
                // wrap around
                for(rm=max; j<=rm; j+=ri) ret.push(j);
                for(j=min,rm=r2[0]; j<=rm; j+=ri) ret.push(j);
            }else{
                for(; j<=rm; j+=ri) ret.push(j);
            }
        }
        ret.sort(function(a,b){return a-b})
        return ret
    },
    nearest=function(now, list, max){
        if (!list) return now
        if (Max.apply(Math, list.concat(now))===now) return now+(max-now)+Min.apply(Math, list)
        for(var i=0,l=list.length; i<l; i++){
            if (list[i]>=now) return list[i]
        }
        console.error('not suppose to be here',now, list, max)
    },
    closest=function(now, count, mins, hrs, doms, mons, dows, yrs, cb){
        if (count++ > 1) return cb(0)

        var
        min=nearest(now.getMinutes(), mins, 60),
        hr=nearest(now.getHours()+Floor(min/60), hrs, 24),
        dom=now.getDate(),
        mon=now.getMonth(),
        yr=now.getFullYear(),
        days=(new Date(yr, mon, 0)).getDate()

        if (dows){
            // if dow set ignore dom fields
            var
            day=now.getDay()+Floor(hr/24),
            dow=nearest(day, dows, 7)
            dom+=(dow-day)
        }else{
            dom=nearest(dom+Floor(hr/24), doms, days)
        }
        mon=nearest(mon+1+Floor(dom/days), mons, 12)

        if (now.getMonth()+1 !== mon) return closest(new Date(yr, mon-1), count, mins, hrs, doms, mons, dows, yrs, cb)

        yr=nearest(yr+Floor((mon-1)/12), yrs, 0)
        if (now.getFullYear() !== yr) return closest(new Date(yr, mon-1), count, mins, hrs, doms, mons, dows, yrs, cb)

        var then=(new Date(yr, (mon-1)%12)).getTime()
        then+=(dom%days-1)*DAY // beginning of day
        then+=(hr%24)*HR
        then+=(min%60)*MIN

        return cb(then)
    }

    return {
        deltaToNext: function(day, hr, min, sec, msec){
            var 
            d = new Date(),
            remain = (d.getTime() % HR) - ((min||0)*MIN + (sec||0)*SEC + (msec||0)),
            deltaHr = (hr||0) + (24*day) - d.getHours()

            return (deltaHr * HR) - remain
        },
        timeOfNext: function(day, hr, min, sec, msec){
            return (new Date(Date.now()+this.deltaToNext(day, hr, min, sec, msec))).getTime()
        },
        // fmt: min, hr, dom, M, dow, yr
        parse: function(fmt){
            var atoms=fmt.split(' ')
            if (atoms.length < 6) return 0
            var mins=parseAtom(atoms[0], 0, 59)
            if (null == mins) return 0
            var hrs=parseAtom(atoms[1], 0, 23)
            if (null == hrs) return 0
            var doms=parseAtom(atoms[2], 1, 31)
            if (null == doms) return 0
            var mons=parseAtom(atoms[3], 1, 12)
            if (null == mons) return 0
            var dows=parseAtom(atoms[4], 0, 6)
            if (null == dows) return 0
            var yrs=parseAtom(atoms[5], 1975, 2075)
            if (null == yrs) return 0

            return [mins, hrs, doms, mons, dows, yrs]
        },
        nearest:function(mins, hrs, doms, mons, dows, yrs){
            var
            now=new Date(),
            yr=nearest(now.getFullYear(), yrs, 0),
            mon=nearest(now.getMonth()+1, mons, 12)-1

            if (now.getFullYear()!==yr || now.getMonth()!==mon){
                now=new Date(yr, mon)
            }else{
                var time=now.getTime()
                now=new Date(time+MIN)// round up sec n msec
            }

            return closest(now, 0, mins, hrs, doms, mons, dows, yrs, function(then){ return then })
        }
    }
})
define('pico/web',function(exports,require,module,define,inherit,pico){
    var
    Abs = Math.abs,Floor=Math.floor,Random=Math.random,
    API_ACK = 'ack',
    PT_HEAD = 1,
    PT_BODY = 2,
    isOnline = true,
    stdCB = function(err){if (err) console.error(err)},
    appendFD = function(fd, name, value){ fd.append(name, value) },
    appendObj = function(obj, name, value){ obj[name] = value },
    timeSync = function(net, cb){
        cb = cb || stdCB
        ajax('get', net.url, null, null, function(err, readyState, responseText){
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
            if (4 !== readyState) return
            var reqId, cb
            if (responseText){
                try{ reqId=JSON.parse(responseText).reqId }
                catch(exp){ return console.error(exp) }
                cb=net.callbacks[reqId]
                if (cb){
                    delete net.callbacks[reqId]
                    cb(err)
                }
                return
            }
            var
            reqs = net.reqs,
            sep = net.delimiter
            for (var i=0,l=reqs.length,r; i<l; i++){
                r = reqs[i]
                if (!r) continue
                try{ reqId = JSON.parse(r.split(sep)[0]).reqId }
                catch(exp){ console.error(exp); continue }
                cb = net.callbacks[reqId]
                if (!cb) continue
                delete net.callbacks[reqId]
                cb(err)
            }
            reqs.length = 0
            return timeSync(net) // sync time, in case it was due to time error
        }

        // schedule next update
        switch(readyState){
        case 2: // send() and header received
            net.head = null
            net.currPT = PT_HEAD
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
                ajax('post', net.url, net.uploads.shift(), null, onResponse, net)
            }else{
                var reqs = net.reqs = net.acks.concat(net.outbox)
                net.acks.length = net.outbox.length = 0

                ajax('post', net.url, reqs.join(net.delimiter)+net.delimiter, null, onResponse, net)
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
        net.currPT = PT_HEAD
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
        this.head = null,
        this.body = [],
        this.currPT = PT_HEAD,
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

    return {
        create: function(cfg, cb){
            var net= new Net(cfg)
            timeSync(net, function(err){
                cb(err, net)
            })
        },
        ajax:ajax,
        //window.addEventListener('online', online)
        online: function(){isOnline=true},
        //window.addEventListener('offline', offlie)
        offline: function(){isOnline=false}
    }
})
}).apply(null, 'undefined' === typeof window ? [module, 'exports', require] : [window, 'pico'])