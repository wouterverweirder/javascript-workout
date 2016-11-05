'use strict';

const tessel = require('tessel'),
  ambientlib = require('ambient-attx4'),
  av = require('tessel-av'),
  os = require('os'),
  http = require('http'),
  port = 8000,
  camera = new av.Camera();

let server,
  snapshot,
  ambient;

const init = () => {
  initServer();
  initAmbient();
};

const initServer = () => {
  server = http.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "image/jpg" });
    response.end(snapshot);
  }).listen(port, () => console.log(`http://${os.hostname()}.local:${port}`));
  process.on("SIGINT", _ => server.close());
};

const initAmbient = () => {
  ambient = ambientlib.use(tessel.port['B']);
  ambient.on('ready', ambientReady);
};

const ambientReady = () => {
  ambient.setSoundTrigger(0.1);
  ambient.on('sound-trigger', data => {
    console.log("Something happened with sound: ", data);
    camera.capture().on('data', data => snapshot = data);
    ambient.clearSoundTrigger();
    setTimeout(() => ambient.setSoundTrigger(0.1), 1500);
  });
};

init();
