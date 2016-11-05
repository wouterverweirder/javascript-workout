const Cylon = require("cylon");

Cylon.robot({
  connections: {
    arduino: { adaptor: "firmata", port: "/dev/cu.usbmodem1411" }
  },

  devices: {
    led: { driver: "led", pin: 13 }
  },

  work: my => {
    every((1).second(), my.led.toggle);
  }
}).start();
