define('pico/web',function(exports,require,module,define,inherit,pico){
    var
    PJSON=require('pico/json'),
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
        ajax('get', net.url, null, null, function(err, readyState, response){
            if (4 !== readyState) return
            if (err) return cb(err)
            var st = parseInt(response)
            if (isNaN(st)) return cb('invalid timesync response')
            net.serverTime = st
            net.serverTimeAtClient = Date.now()
            cb()
        })
    },
    onResponse = function(err, readyState, response, net){
		if (err && 4===readyState) timeSync(net) // sync time, in case it was due to time error

        // schedule next update
        switch(readyState){
        case 2: // send() and header received
            net.head = null
            net.currPT = PT_HEAD
			net.resEndPos = 0
            break
        case 3: break // body loading 
        case 4: // body received
            break
        }

		if (!response) return

        var
        startPos = net.resEndPos, endPos = -1,
        sep = net.delimiter,
        sepLen = sep.length,
        body = net.body,
        head

        try{
            while(true){
                endPos = response.indexOf(sep, startPos)
                if (-1 === endPos) break

                switch(net.currPT){
                case PT_HEAD:
                    net.head = JSON.parse(response.substring(startPos, endPos))
                    body.length = 0
                    net.currPT = PT_BODY
                    break
                case PT_BODY:
                    body.push(response.substring(startPos, endPos))
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
                    if (head.len) head.data = PJSON.parse(body,true) 
                    net.inbox.push(head)
                    net.head = null
                }

                startPos = endPos + sepLen
            }
        }catch(exp){
            // something is wrong
            console.error(exp)
        }
		//readyState 2 may not arrived
        net.resEndPos = 4===readyState?0:startPos
    },
    formation = function(dst, form, cred, prefix_form, prefix_cred){
        prefix_form = prefix_form || ''
        prefix_cred = prefix_cred || ''

        var
        append = dst instanceof FormData ? appendFD : appendObj,
        uri = form.baseURI,
        fieldType, f, fl

        for (var i=0,elements = form.elements,field; field = elements[i]; i++) {
            if (!field.hasAttribute('name')) continue
            fieldType = field.hasAttribute('type') ? field.getAttribute('type').toUpperCase() : 'TEXT'
            if (fieldType === 'FILE') {
                for (f = 0, fl=field.files.length; f<fl; append(dst, prefix_form+field.name, field.files[f++]));
            } else if ((fieldType !== 'RADIO' && fieldType !== 'CHECKBOX') || field.checked) {
                append(dst, prefix_form+field.name, field.value)
            }//TODO: implement checkbox and radio
        }
        if (cred) for (var k in cred) { append(dst, prefix_cred+k, cred[k]) }

        uri = uri.substring(0, uri.lastIndexOf('/')+1)

        return form.action.substr(uri.length)
    },
    netConfig = function(net, cfg){
        net.url = cfg.url || net.url
        net.secretKey = cfg.secretKey || net.secretKey
        net.cullAge = cfg.cullAge || net.cullAge || 0
        net.delimiter = cfg.delimiter ? JSON.stringify(cfg.delimiter) : net.delimiter || JSON.stringify(['&'])
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
    }

    Net.prototype = {
		beat: function(){
			if (this.inbox.length){
				var
				inbox = this.inbox,
				callbacks = this.callbacks,
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
			if (isOnline && (this.uploads.length || this.outbox.length || this.acks.length)){
				var uploads=this.uploads,outbox=this.outbox,acks=this.acks

				if (uploads.length){
					ajax('post', this.url, uploads.shift(), null, onResponse, this)
				}else{
					var reqs = this.reqs = acks.concat(outbox)
					acks.length = outbox.length = 0

					ajax('post', this.url, reqs.join(this.delimiter)+this.delimiter, null, onResponse, this)
				}
			}
		},
        reconnect: function(cfg, cb){
            netConfig(this, cfg)
            netReset(this)
            timeSync(this, function(err){
                cb(err, this)
            })
        },
        submit: function(form, cred, cb){
            if ('undefined'===typeof window || !form || !(form instanceof HTMLFormElement)) return console.error('No HTMLFormElement submitted')

            var reqId = 0

            if (cb){
                reqId = this.reqId++
                this.callbacks[reqId] = cb
            }

            var fd = new FormData()

            fd.append('api', formation(fd, form, cred, 'data/', 'cred/'))
            fd.append('reqId', reqId)

            this.uploads.push(fd)
        },
        // data: optional, usually api specific data
        // cred: optional, usually common data for every api such as credential or session info
        // cb: optional, without cb, reqId will be 0
        request: function(api, data, cred, cb){
            switch(arguments.length){
            case 2:
                if (data instanceof Function){
                    cb = data
                    data = cred = void 0
                }
                break
            case 3:
                if (cred instanceof Function){
                    cb = cred 
                    cred = void 0
                }
                break
            case 4: break
            default: return console.error('wrong request params!')
            }
            if ('undefined'!==typeof window && data instanceof HTMLFormElement){
                var obj = {}
                api = formation(obj, data)
                data = obj
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

            var dataList=data?PJSON.stringify(data,true):[]

			dataList.unshift(JSON.stringify(cred))

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
