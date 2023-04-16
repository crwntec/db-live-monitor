import WebSocket from 'ws';
import chalk from 'chalk'; 
import moment from "moment/moment.js";
const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('open', (event) => {
});

socket.addEventListener('message', (event) => {

  const dep = JSON.parse(event.data);
  const departures = dep.departures

  console.clear();

  departures.forEach((departure) => {
    const line = chalk.yellow(departure.line.name);
    const direction = chalk.blue(departure.direction);
    const time = chalk.magenta(moment(Date.parse(departure.when)).format('HH:mm'));
    const delay = chalk.red(departure.delay / 60)

    console.log(`${line} towards ${direction} at ${time}(+${delay})`);
  });
});

socket.addEventListener('close', (event) => {
  console.log('WebSocket connection closed:', event);
});
