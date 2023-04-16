'use strict'

const createAvgWindow = require('live-moving-average')

const createRequestCounter = () => {
	let reqs = 0
	const avgReqDuration = createAvgWindow(10, 300)

	const getStats = () => {
		return {
			totalReqs: reqs,
			avgReqDuration: avgReqDuration.get()
		}
	}

	const onReqTime = (reqTime) => {
		reqs++
		avgReqDuration.push(reqTime)
	}

	return {getStats, onReqTime}
}

module.exports = createRequestCounter
