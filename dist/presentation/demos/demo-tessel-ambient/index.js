'use strict';

const tessel = require('tessel'),
  ambientlib = require('ambient-attx4');

let ambient;

const init = () => {
  initAmbient();
};

const initAmbient = () => {
  ambient = ambientlib.use(tessel.port['B']);
  ambient.on('ready', ambientReady);
};

const ambientReady = () => {
  setInterval(() => {
    ambient.getLightLevel( (err, ldata) => {
      if (err) return;
      ambient.getSoundLevel( (err, sdata) => {
        if (err) return;
        console.log("Light level:", ldata.toFixed(8), " ", "Sound Level:", sdata.toFixed(8));
    });
  })}, 500);
};

init();
