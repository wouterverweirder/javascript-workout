'use strict';

const tessel = require('tessel');
const ledPin = tessel.port.A.pin[0];

let isOn = false;

setInterval(() => {
  isOn = !isOn;
  ledPin.output(isOn);
}, 250);
