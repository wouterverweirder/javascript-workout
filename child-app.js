var Cylon = require('cylon');
var robot = Cylon.robot({
  connection: { 
  	name: 'arduino', 
  	adaptor: 'firmata', 
  	port: '/dev/tty.usbmodem14131' 
  },
  device: { name: 'led', driver: 'led', pin: 13 },
  work: function(my) {
    setInterval(function(){
      my.led.toggle();
    }, 250);
  }
});
robot.start();