const five = require('johnny-five'),
  board = new five.Board();

board.on('ready', () => {
  const sensor = new five.Sensor({
    pin: 'A0',
    freq: 250
  });
  const servo = new five.Servo(11);
  sensor.on('change', () => {
    console.log(sensor.value);
    const angle = five.Fn.scale(sensor.value, 500, 1024, 0, 180);
    servo.to(angle);
  });
});
