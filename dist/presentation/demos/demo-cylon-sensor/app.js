const Cylon = require("cylon");

Cylon.robot({
  connections: {
    arduino: { adaptor: "firmata", port: "/dev/cu.usbmodem14141" }
  },

  devices: {
    sensor: {
      driver: "analogSensor",
      pin: 0
    },
    servo: {
      driver: "servo",
      pin: 11
    }
  },

  work: my => {
    my.sensor.on('analogRead', val => {
      my.servo.angle((val).fromScale(0, 500).toScale(0, 180));
    });
  }
}).start();
