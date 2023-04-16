# hafas-live-ws-server

**A WebSocket server that sends out live HAFAS data.**

[![npm version](https://img.shields.io/npm/v/hafas-live-ws-server.svg)](https://www.npmjs.com/package/hafas-live-ws-server)
[![build status](https://api.travis-ci.org/derhuerst/hafas-live-ws-server.svg?branch=master)](https://travis-ci.org/derhuerst/hafas-live-ws-server)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/hafas-live-ws-server.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installation

```shell
npm install hafas-live-ws-server
```


## Usage

Server:

```js
const createHafas = require('bvg-hafas')
const {createServer: createHttpServer} = require('http')
const createWebSocketServer = require('hafas-live-ws-server')

const hafas = createHafas('hafas-live-ws-server example')
const httpServer = createHttpServer()
const wsServer = createWebSocketServer(httpServer, hafas)
httpServer.listen(3000)
```

Client:

```js
const querystring = require('querystring')
const WebSocket = require('ws')

const bbox = querystring.stringify({
	north: 52.51, south: 52.4, west: 13.35, east: 13.38
})
const ws = new WebSocket('http://localhost:3000/stopovers?' + query)
ws.on('error', console.error)
ws.on('message', msg => console.log(JSON.parse(msg)))
```


## Contributing

If you have a question or need support using `hafas-live-ws-server`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/hafas-live-ws-server/issues).
