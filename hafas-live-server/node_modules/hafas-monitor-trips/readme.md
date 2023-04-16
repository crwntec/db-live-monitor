# hafas-monitor-trips

**Using a HAFAS endpoint, watch all trips in a bounding box.**

[![npm version](https://img.shields.io/npm/v/hafas-monitor-trips.svg)](https://www.npmjs.com/package/hafas-monitor-trips)
[![build status](https://api.travis-ci.org/derhuerst/hafas-monitor-trips.svg?branch=master)](https://travis-ci.org/derhuerst/hafas-monitor-trips)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/hafas-monitor-trips.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installation

```shell
npm install hafas-monitor-trips
```


## Usage

```js
const createHafas = require('vbb-hafas')
const createMonitor = require('hafas-monitor-trips')

const hafas = createHafas('hafas-monitor-trips example')
const monitor = createMonitor(hafas, {
	north: 52.52,
	west: 13.36,
	south: 52.5,
	east: 13.39
})

monitor.on('stopover', stopover => console.log(stopover))
monitor.on('error', console.error)
monitor.on('stats', console.error)
// monitor.on('trip', trip => console.log(trip))
// monitor.on('new-trip', (tripId, t) => console.log('going to watch trip', tripId, t.line.name))
// monitor.on('trip-obsolete', (tripId, t) => console.log('not watching trip anymore', tripId, t.line.name))
```

Once you listen to any of `trip`/`new-trip`/`trip-obsolete`/`stopover`/`position`/`stats`, the monitor will automatically start to watch. Once you stop listening to each, the monitor will stop again.


## Contributing

If you have a question or need support using `hafas-monitor-trips`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/hafas-monitor-trips/issues).
