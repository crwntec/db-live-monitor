'use strict'

const createHafas = require('vbb-hafas')
const createMonitor = require('.')

const bbox = {north: 52.52, west: 13.36, south: 52.5, east: 13.39}
const interval = 2 * 60 * 1000 // every two minutes

const hafas = createHafas('hafas-monitor-trips example')
const monitor = createMonitor(hafas, bbox, interval)

monitor.on('stopover', (stopover, trip) => {
	console.log(trip.id, trip.line.name, 'next', stopover.stop.name, stopover.departure || stopover.arrival)
})
monitor.on('position', (location, movement) => {
	console.log(movement.tripId, movement.line.name, 'pos', location.latitude, location.longitude)
})
// monitor.on('trip', trip => console.log(trip.stopovers))
// monitor.on('new-trip', (tripId, t) => console.log('going to watch trip', tripId, t.line.name))
// monitor.on('trip-obsolete', (tripId, t) => console.log('not watching trip anymore', tripId, t.line.name))

monitor.on('error', console.error)
monitor.on('stats', console.error)
