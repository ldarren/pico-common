(function(exports){
    var
    HR = 3600000,
    MIN = 60000,
    SEC = 1000;
    exports.deltaToNext = function(day, hr, min, sec, msec){
        hr = hr || 0;
        min = min || 0;
        sec = sec || 0;
        msec = msec || 0;

        var 
        d = new Date(),
        remain = (d.getTime() % HR) - (min*MIN + sec*SEC + msec),
        deltaHr = hr + (24*day) - d.getHours();

        return (deltaHr * HR) - remain;
    };
    exports.timeOfNext = function(day, hr, min, sec, msec){
        var
        delta = exports.deltaToNext(day, hr, min, sec, msec),
        nextTime = new Date(Date.now() + delta);

        return nextTime.getTime();
    };
})('undefined' === typeof exports ? pico['timeTools']={} : exports);
