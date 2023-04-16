'use strict'

const {polygon, point} = require('@turf/helpers')
const debug = require('debug')('hafas-monitor-trips')
const {default: PQueue} = require('p-queue')
const throttle = require('lodash.throttle')
const {EventEmitter} = require('events')
const isWithin = require('@turf/boolean-within').default
const computeTiles = require('./lib/compute-tiles')
const createReqCounter = require('./lib/req-counter')

const SECOND = 1000
const MINUTE = 60 * SECOND
const MAX_TILE_SIZE = 5 // in kilometers

const WATCH_EVENTS = [
	'trip', 'new-trip', 'trip-obsolete',
	'stopover',
	'position',
	'stats'
]

const LONG_QUEUE_MSG = 'many queued requests, consider monitoring a smaller' +
	' bbox or increasing the concurrency'

const createMonitor = (hafas, bbox, interval = MINUTE, concurrency = 8, maxTileSize = 5) => {
	if (!hafas || 'function' !== typeof hafas.radar || 'function' !== typeof hafas.trip) {
		throw new Error('Invalid HAFAS client passed.')
	}

	const tiles = computeTiles(bbox, {maxTileSize})
	debug('tiles', tiles)

	const discoverInterval = Math.max(Math.min(interval, 3 * MINUTE), 30 * SECOND)

	const queue = new PQueue({concurrency: 8})
	const trips = new Map()

	let nrOfTrips = 0
	const reqCounter = createReqCounter()
	const reportStats = throttle(() => {
		out.emit('stats', {
			...reqCounter.getStats(),
			queuedReqs: queue.size,
			trips: nrOfTrips,
			tiles: tiles.length
		})
		if (queue.size > trips * 1.5) debug(LONG_QUEUE_MSG)
	}, 1000)
	const onReqTime = (reqTime) => {
		reqCounter.onReqTime(reqTime)
		reportStats()
	}

	const fetchTile = (tile) => async () => {
		debug('fetching tile', tile)

		const t0 = Date.now()
		let movements
		try {
			movements = await hafas.radar(tile, {
				results: 1000, duration: 0, frames: 0, polylines: false // todo: `opt.language`
			})
		} catch (err) {
			out.emit('error', err)
			return
		}
		onReqTime(Date.now() - t0)

		for (const m of movements) {
			out.emit('position', m.location, m)

			if (trips.has(m.tripId)) continue
			debug('unknown trip, adding', m.tripId)
			trips.set(m.tripId, m.line && m.line.name || 'foo')
			nrOfTrips++
			out.emit('new-trip', m.tripId, m)
			// todo: processs `m.nextStopovers`
		}
	}

	const bboxAsRectangle = polygon([[
		[bbox.west, bbox.north],
		[bbox.east, bbox.north],
		[bbox.east, bbox.south],
		[bbox.west, bbox.south],
		[bbox.west, bbox.north] // close
	]])
	const isStopoverObsolete = (s) => {
		const when = s.arrival || s.scheduledArrival || s.departure || s.scheduledDeparture
		const inThePast = when && new Date(when) < (Date.now() - 5 * MINUTE)
		if (!inThePast) return false
		const stopLoc = point([s.stop.location.longitude, s.stop.location.latitude])
		return !isWithin(stopLoc, bboxAsRectangle)
	}

	// todo: remove trip if not found
	const fetchTrip = (tripId, lineName) => async () => {
		if (!running) return;
		debug('fetching trip', tripId)

		let trip
		try {
			const t0 = Date.now()
			trip = await hafas.trip(tripId, lineName) // todo: `opt.language`
			onReqTime(Date.now() - t0)
		} catch (err) {
			out.emit('error', err)
			return
		}
		if (trip.stopovers.every(isStopoverObsolete)) {
			debug('trip obsolete, removing', trip.stopovers.map(s => [s.stop.location, s.arrival]))
			trips.delete(tripId)
			nrOfTrips--
			out.emit('trip-obsolete', tripId, trip)
			return
		}

		out.emit('trip', trip)
		for (const stopover of trip.stopovers) {
			out.emit('stopover', {
				tripId: trip.id,
				line: trip.line,
				...stopover
			}, trip)
		}
	}

	let running = false
	let tilesTimer = null
	let tripsTimer = null

	const fetchAllTiles = async () => {
		if (!running) return;

		try {
			await queue.addAll(tiles.map(fetchTile), {priority: 1})
		} catch (err) {
			out.emit('error', err)
		}

		if (running) tilesTimer = setTimeout(fetchAllTiles, discoverInterval)
	}

	const fetchAllTrips = throttle(() => {
		if (!running) return;

		for (const [tripId, lineName] of trips.entries()) {
			queue.add(fetchTrip(tripId, lineName)) // todo: rejection?
		}

		tripsTimer = setTimeout(fetchAllTrips, interval)
	}, interval)

	// todo: queue on error?
	const out = new EventEmitter()

	out.on('newListener', (eventName) => {
		if (!WATCH_EVENTS.includes(eventName) || running) return;
		debug('starting monitor')

		running = true
		fetchAllTiles()
		.catch(() => {}) // silence rejection
		.then(fetchAllTrips)
	})
	// todo: should still be watching after on() on() off() [bug]
	out.on('removeListener', (eventName) => {
		if (!WATCH_EVENTS.includes(eventName) || !running) return;
		debug('stopping monitor')

		running = false
		queue.clear()
		fetchAllTrips.cancel()
		clearTimeout(tilesTimer)
		tilesTimer = null
		clearTimeout(tripsTimer)
		tripsTimer = null
	})

	out.hafas = hafas
	return out
}

module.exports = createMonitor
