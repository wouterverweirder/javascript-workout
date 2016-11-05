const Cylon = require('cylon');

Cylon.robot({
  connections: {
    arduino: { adaptor: "firmata", port: "/dev/cu.usbmodem1411" },
    opencv: { adaptor: 'opencv' }
  },

  devices: {
    servo: { connection: 'arduino', driver: "servo", pin: 11 },
    window: { connection: 'opencv', driver: 'window' },
    camera: {
      connection: 'opencv',
      driver: 'camera',
      camera: 0,
      haarcascade: __dirname + "/haarcascade_frontalface_alt.xml"
    }
  },

  work: my => {
    my.camera.once('cameraReady', () => {
      console.log('The camera is ready!')
      my.camera.on('frameReady', (err, im) => {
        my.camera.detectFaces(im);
      });
      my.camera.on('facesDetected', (err, im, faces) => {
        if(faces.length > 0) {
          console.log(faces.length, faces[0].x);
          const angle = (faces[0].x).fromScale(1024, 0).toScale(0, 180);
          my.servo.angle(angle);
        }
        // for (var i = 0; i < faces.length; i++) {
        //   var face = faces[i];
        //   im.rectangle(
        //     [face.x, face.y],
        //     [face.width, face.height],
        //     [0, 255, 0],
        //     2
        //   );
        // }
        // my.window.show(im);
        my.camera.readFrame();
      });
      my.camera.readFrame();
    });
  }
});

Cylon.start();
