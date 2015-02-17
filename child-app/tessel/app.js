var tessel = require('tessel');
var accelLib = require('accel-mma84');
var accel = accelLib.use(tessel.port['A']);

accel.on('ready', function () {
  accel.on('data', function (xyz) {
    console.log('x:', xyz[0].toFixed(2),
      'y:', xyz[1].toFixed(2),
      'z:', xyz[2].toFixed(2));
  });

});