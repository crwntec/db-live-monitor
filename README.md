# DB Live Monitor
## Unofficial Live Departure Monitor for German Railway Stations
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/P5P3PIBAI) [![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/) [![Vue.js](https://img.shields.io/badge/Vue.js-3.x-brightgreen)](https://vuejs.org/) [![IRIS](https://img.shields.io/badge/IRIS-Data%20Source-orange)](https://iris.noncd.db.de/wbt/js/index.html) [![HAFAS](https://img.shields.io/badge/HAFAS-Data%20Source-blue)](https://github.com/public-transport/hafas-client/)

Available at [https://db-live-view.onrender.com](https://db-live-view.onrender.com). Let me know what you think!

## Disclaimer
Just so you know, this project is a labor of love and a work in progress. I'm always tinkering and making improvements, so you can expect things to evolve. Unfortunately, I can't guarantee that the data is always 100% accurate.

## Data Sources
To make all of this happen, I rely on a couple of data sources:

- **IRIS:** [Timetable data and train order](https://iris.noncd.db.de/wbt/js/index.html)
- **HAFAS (JS Wrapper):** [Additional information](https://github.com/public-transport/hafas-client/)

A big shoutout to derf from finalrewind.org for sparking the inspiration that got this project going!

## Roadmap and Upcoming Features
I'm super excited about what's coming next! Take a peek at our [Roadmap Issue](https://github.com/crwntec/db-live-monitor/issues/1) to see what's on the horizon and how you can get involved.

## How to run it yourself
To run the project yourself you need minimun NodeJS v.19.
1. **Client Setup:**
   ```shell
   cd client
   npm install
   npm run exposed
This gets the client-side up and running.

2. **Server Setup:**
    ```shell
    cd server
    npm install
    npm start

Now, the server is ready to roll!

## Contributing
I'm all ears! If you spot a bug or have a fantastic idea, please share it with me by [creating a new issue](https://github.com/crwntec/db-live-monitor/issues).

## License
This project operates under the [MIT License](LICENSE).

