'use strict'

const createWindow = require('.')

const avgOfLast3 = createWindow(3, 0)
avgOfLast3.get() // 0

avgOfLast3.push(2)
avgOfLast3.push(3)
avgOfLast3.push(4)
avgOfLast3.get() // (2 + 3 + 4) / 3 = 3

avgOfLast3.push(5)
avgOfLast3.get() // (3 + 4 + 5) / 3 = 4
