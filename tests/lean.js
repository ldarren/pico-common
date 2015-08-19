var __ = {
    env:{},
    onLoad: function(cb){
        if (__.loaded) return cb()
        if (__.env.supportNative){
            document.addEventListener('deviceready', cb, false)
            __.attachFile('cordova.js', 'js')
        }else{
			if ('complete' === document.readyState) return cb()
            else window.addEventListener('load', cb, false)
        }
        __.env.loaded = true
    },

    // method: get/post, url: path, params: null/parameters (optional), opt: {async,un,passwd,headers}, cb: callback, userData: optional
    ajax: function(method, url, params, opt, cb, userData){
        cb=cb || function(err){if(err)console.error(err)} 
        if (!url) return cb('url not defined')
        opt=opt||{}

        var
        xhr = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP'),
        post = 'POST' === (method = method.toUpperCase()),
        dataType = ('string' === typeof params ? 1 : (params instanceof FormData ? 3 : 2))

        url = encodeURI(url)

        if (!post){
            url += '?appVer='+__.env.appVer
            if (params){
                url += '&'
                switch(dataType){
                case 1: url += encodeURIComponent(params); break
                case 2: url += Object.keys(params).reduce(function(a,k){a.push(k+'='+encodeURIComponent(params[k]));return a},[]).join('&'); break
                case 3: return cb('FormData with GET method is not supported yet')
                }
                params = null
            }
        }

        xhr.open(method, url, undefined===opt.async?true:opt.async, opt.un, opt.passwd)

        xhr.onreadystatechange=function(){
            if (1 < xhr.readyState){
                var st = xhr.status
                if (-1 < [301,302,303,305,306,307].indexOf(st)) return arguments.callee(method, xhr.getResponseHeader('location'),params,opt,cb,userData)
                return cb((200 === st || !st) ? null : "Error["+xhr.statusText+"] Info: "+xhr.responseText, xhr.readyState, xhr.responseText, userData)
            }
        }
        xhr.onerror=function(evt){cb(evt, xhr.readyState, null, userData)}
        // never set Content-Type, it will trigger preflight options and chrome 35 has problem with json type
        //if (post && params && 2 === dataType) xhr.setRequestHeader('Content-Type', 'application/json')
        if (post && params && 3 !== dataType) xhr.setRequestHeader('Content-Type', 'text/plain')
        var h=opt.headers
        for (var k in h) xhr.setRequestHeader(k, h[k])

        switch(dataType){
        case 1: xhr.send(params); break
        case 2: xhr.send(JSON.stringify(params)); break
        case 3: xhr.send(params); break
        }
    },
	createEvent: function(name, detail, bubbles, cancelable){
		var evt = document.createEvent('CustomEvent')
		evt.initCustomEvent(name, bubbles || false, cancelable || false, detail)
		return evt
	},
	// http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
	detectEvent: function(eventName, tagName){
		var el = document.createElement(tagName || 'div')
		eventName = 'on' + eventName
		var isSupported = (eventName in el) || (eventName in window)
		if (!isSupported) {
			el.setAttribute(eventName, '')
			isSupported = 'function' === typeof el[eventName]
			el[eventName] = undefined
			el.removeAttribute(eventName)
		}
		el = undefined
		return isSupported
	},
	// http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
	attachFile: function(url, type, cb){
		var
		h = document.getElementsByTagName("head")[0],
		ref
		switch(type){
		case 'js':
			ref=document.createElement('script')
			ref.setAttribute('src', url)
			ref.onload = cb
			ref.onerror = cb
			h.insertBefore(ref, h.lastChild)
			return
		case 'css':
			ref=document.createElement('link')
			ref.setAttribute('rel', 'stylesheet')
			ref.setAttribute('href', url)
			h.insertBefore(ref, h.lastChild)
			return setTimeout(cb, 500)
		default: return cb()
		}
	},
	detachFile: function(url, type){
		var attr, suspects
		switch(type){
		case 'js':
			suspects = document.getElementsByTagName('script')
			attr = 'src'
			break
		case 'css':
			suspects = document.getElementsByTagName('link')
			attr = 'href'
			break
		default:
			suspects = []
			break
		}
		for (var s,i=suspects.length; i>=0,s=suspects[i]; i--){ //search backwards within nodelist for matching elements to remove
			if (s && s.getAttribute(attr)!=null && s.getAttribute(attr).indexOf(url)!=-1)
			s.parentNode.removeChild(s) //remove element by calling parentNode.removeChild()
		}
	}
}
!function(){
    var
    env = __.env,
    appVerTag = document.querySelector('meta[name=app-version]'),
    te = 'transitionend',
    wkte = 'webkitTransitionEnd'

    env.transitionEnd = __.detectEvent(te) ? te : __.detectEvent(wkte.toLowerCase()) ? wkte : undefined

    env.appVer = appVerTag ? appVerTag.getAttribute('content') : '0'
    env.supportNative = false

    if (-1 === document.URL.indexOf('http://') &&
        -1 === document.URL.indexOf('https://')){
        var tag = document.querySelector('meta[name=app-support-native]')
        env.supportNative = tag ? '1' === tag.getAttribute('content').toLowerCase() : false
    }
}()
!function(){
    function flip(e){
        var
        book = e.target,
        page = e.detail.page,
        currPage = book.querySelector('.__page')

        if (!book || !page) return

        if (!currPage){
            page.classList.add('__page')
            book.appendChild(page)
            return book.dispatchEvent(__.createEvent('flipped'))
        }

        currPage.addEventListener(__.env.transitionEnd, function cb(e){
            currPage.removeEventListener(__.env.transitionEnd, cb)
            book.dispatchEvent(__.createEvent('flipped', {page:currPage}))
            currPage = undefined
        }, false)

        switch(e.detail.from){
        case 'right': attr='left'; px=currPage.offsetWidth; break
        case 'left': attr='left'; px=-currPage.offsetWidth; break
        case 'bottom': attr='top'; px=currPage.offsetHeight; break
        case 'top': attr='top'; px=-currPage.offsetHeight; break
        }

        page.style[attr] = px+'px'
        page.classList.add('__page')
        book.appendChild(page)

        page.offsetWidth // reflow

        page.style[attr] = ''
        currPage.style[attr] = (-px)+'px'
    }
    function reset(){
        for(var i=0,ss=document.querySelectorAll('.__book'),s; s=ss[i]; i++){
            s.addEventListener('flip', flip, false)
        }
    }
    reset()
    document.addEventListener('__reset', reset, false)
}()
!function(){
    if (__.detectEvent('touchstart')) return

    var
    dispatchTouch = function(e){
        var name

        switch(e.type){
        case 'mousedown': name = 'touchstart'; break
        case 'mouseup': name = 'touchend'; break
        case 'mousemove': name = 'touchmove'; break
        case 'mouseout': name = 'touchcancel'; break
        default: return console.error('wrong event: '+e.type)
        }

        var
        ele = e.target,
        touches = []

        touches[0] = {}
        touches[0].pageX = e.pageX
        touches[0].pageY = e.pageY
        touches[0].target = ele

        ele.dispatchEvent(new Event(name, {
            bubbles: e.bubbles,
            cancelable: e.cancelable,
            details:{
                target: ele,
                srcElement: e.srcElement,
                touches: touches,
                changedTouches: touches,
                targetTouches: touches,
                mouseToTouch: true
            }   
        }))
    },
    touchstart = function(e){
        document.removeEventListener('mousedown', touchstart)
        document.addEventListener('mousemove', touchmove,  true)
        document.addEventListener('mouseup', touchend,  true)
        document.addEventListener('mouseout', touchcancel,  true)
        dispatchTouch(e)
    },
    touchmove = function(e){
        dispatchTouch(e)
    },
    touchend = function(e){
        document.addEventListener('mousedown', touchstart,  true)
        document.removeEventListener('mousemove', touchmove)
        document.removeEventListener('mouseup', touchend)
        document.removeEventListener('mouseout', touchcancel)
        dispatchTouch(e)
    },
    touchcancel = function(e){
        document.addEventListener('mousedown', touchstart,  true)
        document.removeEventListener('mousemove', touchmove)
        document.removeEventListener('mouseup', touchend)
        document.removeEventListener('mouseout', touchcancel)
        dispatchTouch(e)
    }
    document.addEventListener('mousedown', touchstart,  true)
}()
!function(){
    function rub(e){
    }
    function reset(){
        for(var i=0,ss=document.querySelectorAll('.__rub'),s; s=ss[i]; i++){
            s.addEventListener('touchstart', rub, false)
        }
    }
    reset()
    document.addEventListener('__reset', reset, false)
}()
!function(){
    function transited(e){
        var ele = e.target
        ele.removeEventListener(__.env.transitionEnd, transited)
        ele.dispatchEvent(__.createEvent('transited'))
    }
    function transit(e){
        var
        ele = e.target,
        detail = e.detail,
        dir,dist
        ele.addEventListener(__.env.transitionEnd, transited, false)
        if (!detail) return ele.style.cssText = ''

        switch(detail.from){
        case 'top': dir='top', dist=detail.ref.offsetHeight; break
        case 'bottom': dir='top', dist=-detail.ref.offsetHeight; break
        case 'left': dir='left', dist=detail.ref.offsetWidth; break
        case 'right': dir='left', dist=-detail.ref.offsetWidth; break
        default: return
        }
        ele.style.cssText = dir+':'+dist+'px'
    }
    function reset(){
        for(var i=0,ss=document.querySelectorAll('.__slider'),s; s=ss[i]; i++){
            s.addEventListener('transit', transit, false)
        }
    }
    reset()
    document.addEventListener('__reset', reset, false)
}()
!function(){
    var
    cancelled = false,
    longTapTimer = 0,
    lastTap = 0,
    longTap = function(e){
        if (cancelled) return
        cancelled = true
        e.target.dispatchEvent(__.createEvent('longTap', null, true))
    }
    touchstart = function(e){
        cancelled = false
        lastDown = window.setTimeout(longTap, 2000, e)
    },
    touchend = function(e){
        window.clearTimeout(longTapTimer)
        if (cancelled) return
        var
        evt = 'tap',
        now = Date.now()
        if (now - lastTap < 500) evt='taps'
        e.target.dispatchEvent(__.createEvent(evt, null, true))

    },
    touchmove = function(e){
        cancelled = true 
    },
    touchcancel = function(e){
        cancelled = true
        window.clearTimeout(longTapTimer)
    }
    document.addEventListener('touchstart', touchstart,  true)
    document.addEventListener('touchend', touchend,  true)
    document.addEventListener('touchmove', touchmove,  true)
    document.addEventListener('touchcancel', touchcancel,  true)
}()
