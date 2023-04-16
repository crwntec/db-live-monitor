# live-moving-average

**An ever updating average of the last n values.** See [Moving Average](https://en.wikipedia.org/wiki/Moving_average).

[![npm version](https://img.shields.io/npm/v/live-moving-average.svg)](https://www.npmjs.com/package/live-moving-average)
[![build status](https://api.travis-ci.org/derhuerst/live-moving-average.svg?branch=master)](https://travis-ci.org/derhuerst/live-moving-average)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/live-moving-average.svg)
![minimum Node.js version](https://img.shields.io/node/v/live-moving-average.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me via GitHub Sponsors](https://img.shields.io/badge/support%20me-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)

Reuses the values array to prevent GC-thrashing. Does not slow down with an increasing window size:

```
window size 10, 1 push, 1 get x 52,341,933 ops/sec ±0.26% (92 runs sampled)
window size 10, 1 push, 10 get x 35,395,743 ops/sec ±4.57% (87 runs sampled)
window size 1000, 1 push, 1 get x 51,765,093 ops/sec ±0.65% (87 runs sampled)
window size 100, 1 push, 10 get x 37,744,938 ops/sec ±0.94% (91 runs sampled)
```


## Installing

```shell
npm install live-moving-average
```


## Usage

```js
const createWindow = require('live-moving-average')

const avg = createWindow(3, 0) // size of 3, fill with 0

avg.push(2)
avg.push(3)
avg.push(4)
avg.get() // 3, because (2 + 3 + 4) / 3

avg.push(5)
avg.push(6)
avg.get() // 5, because (4 + 5 + 6) / 3

avg.push(7)
avg.get() // 6, because (5 + 6 + 7) / 3
```


## API

### `const w = createWindow(size, fill = 0)`

`size` and `fill` must be a number.

### `w.push(val)`

`val` must be a number.

### `w.get()`

Returns the moving average.


## Contributing

If you have a question or have difficulties using `live-moving-average`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/live-moving-average/issues).
