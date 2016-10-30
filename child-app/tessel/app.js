var tessel = require('tessel');
var gpio = tessel.port['GPIO'];
var isOn = false;
var ambientlib = require('ambient-attx4');

var ambient = ambientlib.use(tessel.port['B']);

ambient.on('ready', function () {

  ambient.setSoundTrigger(0.1);

  ambient.on('sound-trigger', function(data) {
    isOn = !isOn;
    gpio.pin['G3'].write(isOn);

    ambient.clearSoundTrigger();
    setTimeout(function () { 
        ambient.setSoundTrigger(0.1);
    },1500);
  });
});

ambient.on('error', function (err) {
  console.log(err)
});