const five = require('johnny-five'),
  board = new five.Board();

board.on('ready', () => {
  const led = new five.Led(13);
  let isOn = false;
  setInterval(() => {
    isOn = !isOn;
    if(isOn) led.on();
    else led.off();
  }, 500);
});
