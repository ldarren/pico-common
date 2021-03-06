define('pico/time',function(exports,require){
	var
		pStr = require('pico/str'),
		Max=Math.max,
		Min=Math.min,
		Floor=Math.floor,
		Ceil=Math.ceil,
		SEC = 1000,
		MIN = 60*SEC,
		SAFE_MIN = 90*SEC,
		HR = 60*MIN,
		DAY= 24*HR,
		daynum=function(end,start){
			return (new Date(end)-new Date(start)) / DAY
		},
		weeknum=function(date, us, yearoff){
			var
				offset=us?1:0,
				jan1= new Date(date.getFullYear()+(yearoff||0), 0, 1),
				day1=((7-jan1.getDay())%7 + offset),
				days=daynum(date, jan1)

			if (days > day1) return Ceil((days - day1)/7)
			return weeknum(date, us, -1)
		},
		parseQuark=function(quark, min, max){
			var
				q=quark.split('/'),
				q0=q[0]

			if ('*'===q0){
				q[0]=min
			}else{
				q0 = parseInt(q0)
				q0 = Max(min, q0)
				q0 = Min(max, q0)
				q[0] = q0
			}

			if (1===q.length) q.push(0) // interval=1
			else q[1]=parseInt(q[1])

			return q
		},
		parseAtom=function(atom, min, max){
			if ('*'===atom) return 0
			var
				ret=[],
				list=atom.split(',')
			for(var i=0,l,j,r,r0,r1,rm,ri; (l=list[i]); i++){
				r=l.split('-')
				r0=parseQuark(r[0],min,max)
				if (1===r.length){
					ri=r0[1]
					if (ri) for(j=r0[0]; j<=max; j+=ri) ret.push(j)
					else ret.push(r0[0])
					continue
				}
				r1=parseQuark(r[1],min,max)
				j=r0[0]
				rm=r1[0]
				ri=r1[1]||1

				if (j>rm){
					// wrap around
					for(; j>=rm; j-=ri) {
						ret.push(j)
					}
				}else{
					for(; j<=rm; j+=ri) {
						ret.push(j)
					}
				}
			}
			ret.sort(function(a,b){
				return a-b
			})
			return ret
		},
		closest=function(now, list, max){
			if (!list) return now
			if (Max.apply(Math, list.concat(now))===now) return max + Min.apply(Math, list)
			for(var i=0,l=list.length; i<l; i++){
				if (list[i]>=now) return list[i]
			}
			console.error('not suppose to be here',now, list, max)
		},
		nearest=function(now, count, mins, hrs, doms, mons, dows, yrs, cb){
			if (count++ > 3) return cb(0)

			var
				min=closest(now.getMinutes(), mins, 60),
				hr=closest(now.getHours()+Floor(min/60), hrs, 24),
				dom=now.getDate(),
				mon=now.getMonth(),
				yr=now.getFullYear(),
				days=(new Date(yr, mon+1, 0)).getDate()

			if (dows){
				// if dow set ignore dom fields
				var
					day = now.getDay(),
					dow=closest(day, dows, 7)
				dom+=(dow-day+Floor(hr/24))
			}else{
				dom=closest(dom+Floor(hr/24), doms, days)
			}
			mon=closest(mon+1+Floor(dom/(days+1)), mons, 12)

			if (now.getMonth()+1 !== mon) return nearest(new Date(yr, mon-1), count, mins, hrs, doms, mons, dows, yrs, cb)

			yr=closest(yr+Floor((mon-1)/12), yrs, 0)
			if (now.getFullYear() !== yr) return nearest(new Date(yr, mon-1), count, mins, hrs, doms, mons, dows, yrs, cb)

			var then=(new Date(yr, (mon-1)%12)).getTime()
			then+=(dom%(days+1)-1)*DAY // beginning of day
			then+=(hr%24)*HR
			then+=(min%60)*MIN

			return cb(then)
		}

	return {
		// fmt: min hr dom M dow yr
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
		nearest:function(mins, hrs, doms, mons, dows, yrs, now){
			now = now || Date.now()
			return nearest(new Date(now + SAFE_MIN), 0, mins, hrs, doms, mons, dows, yrs, function(then){
				return then
			})
		},
		daynum:daynum,
		weeknum:weeknum,
		// node.js should compile with
		// ./configure --with-intl=full-icu --download=all
		// ./configure --with-intl=small-icu --download=all
		day: function(date, locale, ytt, now){
			ytt = ytt || [
				'Yesterday',
				'Today',
				'Tomorrow',
				{weekday:'long'},
				{weekday: 'short', month: 'short', day: 'numeric'}]
			now = now || new Date
			var
				mid=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12,0,0),
				diff=mid-date,
				DAY15=DAY*1.5
			if ((diff >= 0 && diff <= DAY15) || (diff <= 0 && diff > -DAY15)){
				if (now.getDate()===date.getDate())return ytt[1]
				if (now > date) return ytt[0]
				return ytt[2]
			}

			locale=locale||'en-US'
			if (now.getFullYear()===date.getFullYear() && weeknum(now)===weeknum(date)) return date.toLocaleDateString(locale, ytt[3])
			return date.toLocaleDateString(locale,ytt[4])
		},
		convert: function callee(str, formats, idx){
			idx = idx || 0
			if (!Array.isArray(formats) || idx >= formats.length || !str.slice) return new Date(str)
			var format = formats[idx++]
			var date = {}
			var pos = 0
			for (var l = str.length, c, p, j = 0, key; pos < l; pos++){
				c = pStr.isBase36(str.charCodeAt(pos))
				if (p !== c) {
					if (j >= format.length) break
					key = format[j++]
				}
				if (c){
					if (!date[key]) date[key] = str[pos]
					else date[key] += str[pos]
				}else{
					if (key !== str[pos]) return callee(str, formats, idx)
				}
				p = c
			}
			var d = new Date(`${date.M} ${date.D} ${date.Y} ${str.slice(pos)}`)
			return d.getTime() ? d : new Date(str)
		}
	}
})
