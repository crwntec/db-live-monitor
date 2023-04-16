'use strict'

const createHafas = require('bvg-hafas')
const {createServer: createHttpServer} = require('http')
const createWebSocketServer = require('.')
const querystring = require('querystring')
const WebSocket = require('ws')

const hafas = createHafas('hafas-live-ws-server example')
const httpServer = createHttpServer()
const wsServer = createWebSocketServer(httpServer, hafas)

const onError = (err) => {
	console.error(err)
	process.exit(1)
}

httpServer.listen(3000, (err) => {
	if (err) return onError(err)

	const query = querystring.stringify({
		north: 52.51, south: 52.4, west: 13.35, east: 13.38
	})
	const ws = new WebSocket('http://localhost:3000/stopovers?' + query)
	ws.on('error', onError)
	ws.on('message', msg => console.log(JSON.parse(msg)))
})
