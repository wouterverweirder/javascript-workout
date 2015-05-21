var Cylon = require('cylon');
var robot = Cylon.robot({
	connections: {
		arduino: {
			adaptor: 'firmata', port: '/dev/tty.usbmodem14111',
			devices: {
				servo:    { driver: 'servo', pin: 11 },
			}
		},
		leap: {
			adaptor: 'leapmotion',
			devices: {
				leap: 		{ driver: 'leapmotion' }
			}
		}
	},
	work: function(my) {
		var angle = 0;
		var handX = 0;
		my.leap.on('frame', function(frame){
			if(frame.hands.length > 0) {
				handX = frame.hands[0].palmPosition[0];
				angle = (handX).fromScale(-255, 255).toScale(0, 180);
				my.servo.angle(angle);
			}
		});
  }
});
robot.start();