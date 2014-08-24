var tessel = require('tessel');
var gpio = tessel.port['GPIO'];
var isOn = false;

setInterval(function () {
  gpio.pin['G3'].write(isOn);
  isOn = !isOn;
}, 500);