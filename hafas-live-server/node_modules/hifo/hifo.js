'use strict'

module.exports = {

	init: function (sort, size) {
		if (!sort) throw new Error('Missing `sort` parameter.')
		this.sort = sort

		this.size = size || 10
		this.data = []

		return this
	},

	add: function (entry) {
		this.insert(entry)
		return this
	},

	insert: function (entry) {
		let i

		// `this.data` is empty
		if (this.data.length === 0) {
			this.data.push(entry)
			return 0
		}

		// abort if `entry` is lower than the last
		if (this.data.length >= this.size
		&& this.sort(this.data[this.data.length - 1], entry) < 0)
			return

		// check if `entry` exists
		i = this.data.indexOf(entry)
		if (i >= 0) this.data.splice(i, 1) // delete

		// move forward
		i = this.data.length - 1
		while (i >= 0 && this.sort(this.data[i], entry) >= 0) i--
		this.data.splice(i + 1, 0, entry) // add

		// `this.data` is full
		if (this.data.length > this.size) this.data.pop() // remove last

		return i + 1
	},

	reset: function () {
		this.data = []
		return this
	}

}
