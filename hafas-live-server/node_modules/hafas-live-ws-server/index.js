'use strict'

const createMonitorServer = require('hafas-monitor-trips-server')
const {Server: WebSocketServer} = require('ws')
const {URL} = require('url')

// todo: `new-trip`, `trip-obsolete`
const EVENTS = Object.assign(Object.create(null), {
	'/stopovers': 'stopover',
	'/trips': 'trip',
	'/positions': 'position'
})

const parseBbox = (query) => {
	const bbox = Object.create(null)
	for (const param of ['north', 'west', 'south', 'east']) {
		if (!query.has(param)) {
			throw new Error(`missing ${param} parameter`)
		}
		bbox[param] = parseFloat(query.get(param))
	}
	return bbox
}

const formatError = (err) => {
	const res = {...err, message: err.message}
	if (err.stack) res.stack = err.stack
	return res
}

const defaults = {
	WebSocketServer: WebSocketServer,
	logger: console
}

const createWebSocketServer = (httpServer, hafas, opt = {}) => {
	const {WebSocketServer, logger} = {...defaults, ...opt}

	const wsServer = new WebSocketServer({server: httpServer})
	const monitorServer = createMonitorServer(hafas)

	wsServer.on('connection', (ws, req) => {
		const send = (msg) => {
			try {
				msg = JSON.stringify(msg)
			} catch (err) {}
			ws.send(msg)
		}
		const sendData = (...data) => send(data)

		try {
			const url = new URL(req.url, 'http://example.org/')
			const eventName = EVENTS[url.pathname]
			if (!eventName) return ws.close(new Error('invalid path'))

			const bbox = parseBbox(url.searchParams)
			const sub = monitorServer.subscribe(bbox)

			sub.on(eventName, sendData)
			const onError = err => logger.error(err)
			sub.on('error', onError)
			ws.once('close', () => {
				ws.removeListener(eventName, sendData)
				ws.removeListener('error', onError)
			})
		} catch (err) {
			sendError(err)
		}
	})

	return wsServer
}

module.exports = createWebSocketServer
