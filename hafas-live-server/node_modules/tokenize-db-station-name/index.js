'use strict'

const normalize = require('normalize-for-search')

// like \w and \b, but with Unicode support
const w = '[\\p{L}\\p{N}]'
const b = '[^\\p{L}\\p{N}]'
const beforeBdry = `(?<=${b})`
const beforeBdryOrStart = `(?<=^|${b})`
const afterBdry = `(?=${b})`
const afterBdryOrEnd = `(?=$|${b})`

const transformationsRaw = [
	[/\[([^\]]+)\]/g, '$1'],
	[new RegExp(`${beforeBdryOrStart}\\(?S\\+U\\)?${afterBdryOrEnd}`, 'gu'), 'sbahn ubahn'],
	[new RegExp(`${beforeBdryOrStart}\\(?U(-Bahn)?\\)?${afterBdryOrEnd}`, 'gu'), 'ubahn'],
	[new RegExp(`${beforeBdryOrStart}\\(?S(-Bahn)?\\)?${afterBdryOrEnd}`, 'gu'), 'sbahn']
]

const transformationsNormalized = [
	[/(?<!\w)bay(?=$|\s|,)/g, 'bayern'],
	[/(?<!\w)thuer(?=$|\s|,)/g, 'thueringen'],
	[/(?<!\w)sachs(?=$|\s|,)/g, 'sachsen'],
	[/(?<!\w)anh(?=$|\s|,)/g, 'anhalt'],
	[/(?<!\w)westf(?=$|\s|,)/g, 'westfalen'],
	[/(?<!\w)wuertt(?=$|\s|,)/g, 'wuerttemberg'],
	[/(?<!\w)oberpf(?=$|\s|,)/g, 'oberpfalz'],
	[/(?<!\w)schwab(?=$|\s|,)/g, 'schwaben'],
	[/(?<!\w)oberbay(?=$|\s|,)/g, 'oberbayern'],
	[/(?<!\w)holst(?=$|\s|,)/g, 'holstein'],
	[/(?<!\w)braunschw(?=$|\s|,)/g, 'braunschweig'],
	[/(?<!\w)saalkr(?=$|\s|,)/g, 'saalekreis'],
	[/(?<!\w)saalkr(?=$|\s|,)/g, 'saalekreis'],
	[/(?<!\w)niederbay(?=$|\s|,)/g, 'niederbayern'],
	[/(?<!\w)schwarzw(?=$|\s|,)/g, 'schwarzwald'],
	[/(?<!\w)oldb(?=$|\s|,)/g, 'oldenburg'],
	[/(?<!\w)uckerm(?=$|\s|,)/g, 'uckermark'],
	[/(?<!\w)rheinl(?=$|\s|,)/g, 'rheinland'],
	[/(?<!\w)oberfr(?=$|\s|,)/g, 'oberfranken'],
	[/(?<!\w)rheinhess(?=$|\s|,)/g, 'rheinhessen'],
	[/(?<!\w)hess(?=$|\s|,)/g, 'hessen'],
	[/(?<!\w)altm(?=$|\s|,)/g, 'altmark'],
	[/(?<!\w)limes(?=$|\s|,)/g, 'limesstadt'],
	[/(?<!\w)vogtl(?=$|\s|,)/g, 'vogtland'],
	[/(?<!\w)meckl(?=$|\s|,)/g, 'mecklenburg'],
	[/(?<!\w)mittelfr(?=$|\s|,)/g, 'mittelfranken'],
	[/(?<!\w)dillkr(?=$|\s|,)/g, 'dillkreis'],
	[/(?<!\w)odenw(?=$|\s|,)/g, 'odenwald'],
	[/(?<!\w)erzgeb(?=$|\s|,)/g, 'erzgebirge'],
	[/(?<!\w)prign(?=$|\s|,)/g, 'prignitz'],
	[/(?<!\w)oberhess(?=$|\s|,)/g, 'oberhessen'],
	[/(?<!\w)ostfriesl(?=$|\s|,)/g, 'ostfriesland'],
	[/(?<!\w)schlesw(?=$|\s|,)/g, 'schleswig'],
	[/(?<!\w)saechs\sschweiz(?=$|\s|,)/g, 'saechsische schweiz'],
	[/(?<!\w)unterfr(?=$|\s|,)/g, 'unterfranken'],
	[/(?<!\w)westerw(?=$|\s|,)/g, 'westerwald'],
	[/(?<!\w)dithm(?=$|\s|,)/g, 'dithmarschen'],
	[/(?<!\w)thueringerw(?=$|\s|,)/g, 'thueringer wald'],
	[/(?<!\w)schaumb\slippe(?=$|\s|,)/g, 'schaumburg lippe'],

	[/(?<!\w)frankfurt\sm(?=$|\s|,)/g, 'frankfurt main'],
	[/(?<!\w)frankfurt\sam\smain(?=$|\s|,)/g, 'frankfurt main'],

	[/(?<!^|\w)ob(?=$|\s|,)/g, 'oben'],
	[/(?<!^|\w)unt(?=$|\s|,)/g, 'unten'],
	[/(?<!^|\w)bf(?=$|\s|,)/g, 'bahnhof'],
	[/(?<!^|\w)fernbf(?=$|\s|,)/g, 'fernbahnhof'],
	[/(?<!^|\w)hbf(?=$|\s|,)/g, 'hauptbahnhof'],
	[/(?<!^|\w)b(?=\s\w)/g, 'bei'], // "foo b berlin" -> "foo bei berlin"
	// "wein str foo" -> "wein strasse foo"
	// "wein-str foo" -> "wein- strasse foo"
	// "weinstr foo" -> "wein strasse foo"
	// "weinstr" -> "wein strasse"
	[/str(?=$|\s|,)/g, ' strasse'],
	[/(?<=\w)strasse(?=$|\s|,)/g, ' strasse'], // "seestrasse" -> "see strasse"
	// "alexander pl foo" -> "alexander platz foo"
	// "alexander-pl foo" -> "alexander- platz foo"
	// "alexanderpl foo" -> "alexander platz foo"
	// "alexanderpl" -> "alexander platz"
	[/pl(?=$|\s|,)/g, ' platz'],
	[/(?<=\w)platz(?=$|\s|,)/g, ' platz'], // "alexanderplatz" -> "alexander platz"
]

const tokenize = (name) => {
	if ('string' !== typeof name) throw new Error('name must be a string')
	if (name.length === 0) return []

	for (let [pattern, replacement] of transformationsRaw) {
		name = name.replace(pattern, replacement)
	}

	name = normalize(name)
	.replace(/[\/\(\)\-,\.\+]+/g, ' ') // remove special chars
	.replace(/\s+/g, ' ') // remove unnecessary whitespace
	.trim()

	for (let [pattern, replacement] of transformationsNormalized) {
		name = name.replace(pattern, replacement)
	}

	return name.split(/\s+/)
}

module.exports = tokenize
