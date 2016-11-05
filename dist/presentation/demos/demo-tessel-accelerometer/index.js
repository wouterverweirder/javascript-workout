'use strict';

const tessel = require('tessel'),
  accelLib = require('accel-mma84');

let accel;

const init = () => {
  initAccel();
};

const initAccel = () => {
  accel = accelLib.use(tessel.port['A']);
  accel.on('ready', accelReady);
};

const accelReady = () => {
  accel.on('data', (xyz) => {
    console.log('x:', xyz[0].toFixed(2),
      'y:', xyz[1].toFixed(2),
      'z:', xyz[2].toFixed(2));
  });
};

init();
