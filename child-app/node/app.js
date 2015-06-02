var Cylon = require('cylon');
var robot = Cylon.robot({
	connections: {
		arduino: {
			adaptor: 'firmata',
			port: '/dev/tty.usbmodem14111',
			devices: {
				led:    { driver: 'led', pin: 13 },
			}
		}
	},
	work: function(my) {
    setInterval(function(){
      my.led.toggle();
    }, 250);
  }
});
robot.start();