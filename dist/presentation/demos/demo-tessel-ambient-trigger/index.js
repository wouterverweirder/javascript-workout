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
  ambient.setSoundTrigger(0.1);
  ambient.on('sound-trigger', data => {
    console.log("Something happened with sound: ", data);
    ambient.clearSoundTrigger();
    setTimeout(() => ambient.setSoundTrigger(0.1), 1500);
  });
};

init();
