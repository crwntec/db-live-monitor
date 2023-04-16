# hafas-monitor-trips-server

**A server that manages [HAFAS monitors](https://github.com/derhuerst/hafas-monitor-trips).**

[![npm version](https://img.shields.io/npm/v/hafas-monitor-trips-server.svg)](https://www.npmjs.com/package/hafas-monitor-trips-server)
[![build status](https://api.travis-ci.org/derhuerst/hafas-monitor-trips-server.svg?branch=master)](https://travis-ci.org/derhuerst/hafas-monitor-trips-server)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/hafas-monitor-trips-server.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installation

```shell
npm install hafas-monitor-trips-server
```


## Usage

```js
const createServer = require('hafas-monitor-trips-server')

const server = createServer(hafas)
const subA = server.subscribe({
	north: 52.51, south: 52.4, west: 13.35, east: 13.38
})
const subB = server.subscribe({
	north: 52.505, south: 52.45, west: 13.355, east: 13.375
})

subA.on('stopover', stopover => console.log('A', stopover))
subB.on('stopover', stopover => console.log('B', stopover))
```

- `subA` and `subB` have overlapping bounding boxes, so they will share one monitor.
- `hafas` is a [`hafas-client`/`*-hafas`](https://npmjs.com/package/hafas-client) instance.
- `subscribe(bbox)` returns an [`EventEmitter`](https://nodejs.org/docs/latest-v12.x/api/events.html#events_class_eventemitter), emitting the same events as a [`hafas-monitor-trips`](https://npmjs.com/package/hafas-monitor-trips) instance.

See [`example.js`](example.js) for a full example.


## Contributing

If you have a question or need support using `hafas-monitor-trips-server`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/hafas-monitor-trips-server/issues).
