const Cylon = require("cylon");
Cylon.robot({
  connections: {
    arduino: { adaptor: "firmata", port: "/dev/cu.usbmodem14141" },
    leap: { adaptor: "leapmotion" }
  },
  devices: {
    servo: { connection: 'arduino', driver: "servo", pin: 11 },
    leap: { connection: 'leap', driver: "leapmotion" }
  },
  work: my => {
    my.leap.on('frame', data => {
      if(data.hands.length === 0) {
        return;
      }
      const hand = data.hands[0];
      const angle = (hand.palmPosition[0]).fromScale(-255, 255).toScale(0, 180);
      my.servo.angle(angle);
    });
  }
}).start();
