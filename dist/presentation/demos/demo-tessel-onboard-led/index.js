'use strict';

const tessel = require('tessel');

tessel.led[2].on();

setInterval(() => {
  tessel.led[2].toggle();
  tessel.led[3].toggle();
}, 250);

console.log("I'm blinking! (Press CTRL + C to stop)");
