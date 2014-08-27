var Cylon = require('cylon');
var robot = Cylon.robot({
  connection: { name: 'arduino', adaptor: 'firmata', port: '/dev/tty.usbmodem14111' },
  device: { name: 'servo', driver: 'servo', pin: 11 },
  work: function(my) {
  	var isMax = false;
    setInterval(function(){
      if(isMax) my.servo.angle(180);
      else my.servo.angle(0);
      isMax = !isMax;
    }, 1000);
  }
});
robot.start();