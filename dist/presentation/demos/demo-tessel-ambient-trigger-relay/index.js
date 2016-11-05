'use strict';

const tessel = require('tessel'),
  relaylib = require('relay-mono'),
  ambientlib = require('ambient-attx4');
let ambient,
  relay;

const init = () => {
  initAmbient();
};

const initAmbient = () => {
  ambient = ambientlib.use(tessel.port['B']);
  ambient.on('ready', ambientReady);
};

const ambientReady = () => {
  initRelay();
};

const initRelay = () => {
  relay = relaylib.use(tessel.port['A']);
  relay.on('ready', relayReady);
};

const relayReady = () => {
  ambient.setSoundTrigger(0.1);
  ambient.on('sound-trigger', data => {
    console.log("Something happened with sound: ", data);
    relay.setState(1, true);
    ambient.clearSoundTrigger();
    setTimeout(() => {
      relay.setState(1, false);
      ambient.setSoundTrigger(0.1);
    }, 1500);
  });
};

init();
