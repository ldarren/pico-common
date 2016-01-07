define('pico/time',function(){
    var
    Max=Math.max,
    Min=Math.min,
    DAY= 86400000,
    HR = 3600000,
    MIN = 60000,
    SEC = 1000,
    nearest=function(now, list, max){
        if (!list) return now
        if (Max(now, ...list)===now) return now+(max-now)+Min(...list)
        for(var i=0,l=list.length; i<l; i++){
            if (list[i]>=now) return list[i]
        }
        console.error('not suppose to be here',now, list, max)
    },
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
        ret=new Set(),
        list=atom.split(',')
        for(var i=0,l,range,j,r,r1,r2,rm,ri; l=list[i]; i++){
            r=l.split('-')
            if (!r.length) return null// error
            r1=parseQuark(r[0],min,max)
            if (1===r.length){
                ri=r1[1]
                if (ri) for(j=r1[0]; j<=max; j+=ri) ret.add(j);
                else ret.add(r1[0])
                continue
            }
            r2=parseQuark(r[1],min,max)
            for(j=r1[0],rm=r2[0],ri=r2[1]||1; j<=rm; j+=ri) ret.add(j);
        }
        ret=[...ret]
        ret.sort((a,b)=>{return a-b})
        return ret
    }

    return {
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
            var yrs=parseAtom(atoms[5], 1970, 3000)
            if (null == yrs) return 0

            return [mins, hrs, doms, mons, dows, yrs]
        },
        nearest:function(mins, hrs, doms, mons, dows, yrs){
            var
            now=new Date(),
            yr=nearest(now.getFullYear(), yrs, 0),
            day=now.getDay(),
            dow=nearest(day, dows, 7),
            mon=now.getMonth(),
            dom=now.getDate(),
            hr=nearest(now.getHours(), hrs, 24),
            m=nearest(now.getMinutes(), mins, 60)

            if (day===dow){
                mon=nearest(mon, mons, 12)
                dom=nearest(dom, doms, new Date(yr, mon-1, 0).getDate())
            }else{
                dom+=(dow-day)
            }

            if (mon > 12){
                yr+=Floor(mon/12)
                mon=mon%12
            }

            var then=(new Date(yr, mon)).getTime()
            then+=dom*DAY
            then+=hr*HR
            then+=m*MIN

            return then
        }
    }
})
