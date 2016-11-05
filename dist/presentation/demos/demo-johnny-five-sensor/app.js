const five = require('johnny-five'),
  board = new five.Board();

board.on('ready', () => {
  const sensor = new five.Sensor({
    pin: 'A0',
    freq: 250
  });
  sensor.on('change', () => {
    console.log(sensor.value);
    // console.log(sensor.scaleTo(0, 10));
  });
});
