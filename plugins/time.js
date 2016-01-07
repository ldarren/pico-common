define('pico/time',function(){
    var
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
        cron: function(fmt){
            var atoms=fmt.split(' ')
            if (atoms.length < 6) return 0
            var min=parseAtom(atoms[0], 0, 59)
            if (null == min) return 0
            var hr=parseAtom(atoms[1], 0, 23)
            if (null == hr) return 0
            var dom=parseAtom(atoms[2], 1, 31)
            if (null == dom) return 0
            var mon=parseAtom(atoms[3], 1, 12)
            if (null == mon) return 0
            var dow=parseAtom(atoms[4], 0, 6)
            if (null == dow) return 0
            var yr=parseAtom(atoms[5], 1970, 3000)
            if (null == yr) return 0

            var now=Date.now()

            return [min, hr, dom, mon, dow, yr]
        }
    }
})
