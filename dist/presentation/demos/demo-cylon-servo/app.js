const Cylon = require("cylon");

Cylon.robot({
  connections: {
    arduino: { adaptor: "firmata", port: "/dev/cu.usbmodem14141" }
  },

  devices: {
    servo: {
      driver: "servo",
      pin: 11
    }
  },

  work: function(my) {
    let angle = 0;
    let direction = 1;
    every((0.1).seconds(), () => {
      angle += direction;
      if(angle >= 180 || angle <= 0) {
        direction = -direction;
      }
      my.servo.angle(angle);
      console.log(angle);
    });
  }
}).start();
