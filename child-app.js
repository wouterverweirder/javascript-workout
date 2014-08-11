var five = require("johnny-five");
board = new five.Board();

board.on("ready", function() {

  var servo = new five.Servo(11);
  servo.sweep();

});