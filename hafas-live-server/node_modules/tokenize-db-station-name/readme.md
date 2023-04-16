# tokenize-db-station-name

**Make [Deutsche Bahn](https://en.wikipedia.org/wiki/Deutsche_Bahn) station names search-safe.**

The station names from DB are inconsistent and user's search queries are not perfect either. This module tries to compensate edge cases:

- `Reuth (b Plauen/Vogtl)` -> `reuth bei plauen vogtland`
- `Königstein (Sächs Schweiz)` -> `koenigstein saechische schweiz`
- `Zwickau (Sachs) Hbf` -> `zwickau sachsen hauptbahnhof`

[![npm version](https://img.shields.io/npm/v/tokenize-db-station-name.svg)](https://www.npmjs.com/package/tokenize-db-station-name)
[![build status](https://img.shields.io/travis/derhuerst/tokenize-db-station-name.svg)](https://travis-ci.org/derhuerst/tokenize-db-station-name)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/tokenize-db-station-name.svg)
[![support me via GitHub Sponsors](https://img.shields.io/badge/support%20me-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)
[![chat with me on Twitter](https://img.shields.io/badge/chat%20with%20me-on%20Twitter-1da1f2.svg)](https://twitter.com/derhuerst)


## Installing

```shell
npm install tokenize-db-station-name
```


## Usage

```js
const tokenize = require('tokenize-db-station-name')

tokenize('Königstein (Sächs Schweiz)')
.join(' ') // -> 'koenigstein saechsische schweiz'
```


## Related

- [`db-clean-station-name`](https://github.com/juliuste/db-clean-station-name) – Remove noise and fix common typographic errors in Deutsche Bahn (German railways) station names.


## Contributing

If you **have a question**, **found a bug** or want to **propose a feature**, have a look at [the issues page](https://github.com/derhuerst/tokenize-db-station-name/issues).
