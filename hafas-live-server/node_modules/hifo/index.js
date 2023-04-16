'use strict'

const Hifo = require('./hifo')



const lowest = function (primary, secondary) {
	if (arguments.length === 2)
		return (a, b) => {
			const d = a[primary] - b[primary]
			if (d === 0) return a[secondary] - b[secondary]
			else return d
		}

	if (arguments.length === 1)
		return (a, b) => a[primary] - b[primary]

	return (a, b) => a - b
}

const highest = function (primary, secondary) {
	if (arguments.length === 2)
		return (a, b) => {
			var d = b[primary] - a[primary]
			if (d === 0) return b[secondary] - a[secondary]
			else return d
		}

	if (arguments.length === 1)
		return (a, b) => b[primary] - a[primary]

	return (a, b) => b - a
}



const factory = (sort, options) => {
	const instance = Object.create(Hifo)
	instance.init(sort, options)
	return instance
}

module.exports = Object.assign(factory, {lowest, highest, Hifo})
