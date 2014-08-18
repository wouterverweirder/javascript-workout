var five = require("johnny-five");
board = new five.Board();

board.on("ready", function() {
  var sensor = new five.Sensor({
    pin: "A0",
    freq: 250
  });
  //hello test
});