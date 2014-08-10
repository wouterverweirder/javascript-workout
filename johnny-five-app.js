var five = require("johnny-five");
board = new five.Board();

board.on("ready", function() {
  var servo = new five.Servo(11);
  var sensor = new five.Sensor({
    pin: "A0",
    freq: 250
  });
  sensor.scale([0, 180]).on('data', function(){
    servo.to(sensor.value);
  });
});