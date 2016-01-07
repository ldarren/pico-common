define('pico/time',function(){
    var
    HR = 3600000,
    MIN = 60000,
    SEC = 1000,
    parseAtom=function(atom, min, max){
        if ('*'===atom) return -1
        var 
        ret=new Set(),
        list=atom.split(',')
        for(var i=0,l,range,j,r,r1,r2; l=list[i]; i++){
            r=l.split('-')
            if (!r.length) return null
            r1=parseInt(r[0])
            if (1===r.length){
                ret.add(r1)
                continue
            }
            r2=parseInt(r[1])
            for(j=r1; j<=r2; j++) ret.add(j);
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

            return [min, hr, dom, mon, dow, yr]
        }
    }
})
