'use strict'

const createHafas = require('vbb-hafas')
const createServer = require('.')

const someArea = {
	north: 52.51, south: 52.4, west: 13.35, east: 13.38
}
const someAreaWithin = {
	north: 52.505, south: 52.45, west: 13.355, east: 13.375
}

const hafas = createHafas('hafas-monitor-trips-server example')
const server = createServer(hafas)

const subA = server.subscribe(someArea)
// subA.on('stopover', stopover => console.log('A', stopover))
subA.on('stopover', stopover => {})

const subB = server.subscribe(someAreaWithin)
subB.on('stopover', stopover => console.log('B', stopover))
