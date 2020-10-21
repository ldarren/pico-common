# cron expression parser
A pure js cron expression parser for the browsers and nodejs. This parser convert cron expression to an object that can be easily digest by other pico/time functions such as [nearest function](#get next trigger time)

## syntax
> pTime.parse(cron_expr)

### parameters
__cron_expr__: _string_, [crontab job expression](https://en.wikipedia.org/wiki/Cron#CRON_expression)

### returns
tokenised cron expression for `pTime.nearest` method

# get next trigger time
this function analyse the output of [parser function] and determine the next trigger time in milliseconds
## syntax
> pTime.nearest(mins, hrs, doms, mons, dows, yrs, [now])

### parameters
__mins__: _array_, an array of possible minutes

__hrs__: _array_, an array of possible hours

__doms__: _array_, an array of possible date of month

__mons__: _array_, an array of possible months (o-based)

__downs__: _array_, an array of possible day of week (0 = sunday)

__yrs__: _array_, an array of possible years

__now__: _array_, an array of possible hours

### returns
a unix timestamp of next time that can fullfilled the input parameters

### example
```js
const tokens = pTime.parse('0 * * * * *')
setTimeout(console.log, pTime.nearest(tokens), 'hello every hour')
```

## import

with es6 module

```js
import pCommon from 'pico-common'

const pTime = pCommon.export('pico/time')
```

with nodejs commonjs

```js
const pTime = require('pico-common').export('pico/time')
```

with pico-common amd

```js
const pTime = require('pico/time')
```
