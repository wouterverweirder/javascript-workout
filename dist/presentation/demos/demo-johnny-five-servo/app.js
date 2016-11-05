const five = require('johnny-five'),
  board = new five.Board();

board.on('ready', () => {
  const servo = new five.Servo(11);
  let isMax = false;
  setInterval(() => {
    isMax = !isMax;
    if(isMax) servo.to(180);
    else servo.to(0)
  }, 1000);
});
