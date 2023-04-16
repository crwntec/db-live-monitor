'use strict'

const LiveMovingAverage = {
	push: function (val) {
		if ('number' !== typeof val) throw new Error('val must be a number.')

		this.sum -= this.data[this.dataI]
		this.sum += val

		this.data[this.dataI] = val
		this.dataI = (this.dataI + 1) % this.size
	},

	get: function () {
		return this.sum / this.size
	}
}

const createWindow = (size, fill = 0) => {
    if ('number' !== typeof size) throw new Error('size must be a number.')
    if ('number' !== typeof fill) throw new Error('fill must be a number.')

	const w = Object.create(LiveMovingAverage)

	w.sum = size * fill
	w.size = size
	w.data = new Array(size)
	w.data.fill(fill)
	w.dataI = 0

	return w
}

module.exports = createWindow
