var Cylon = require('cylon');
Cylon.robot({
  connections: [
    { name: 'arduino', adaptor: 'firmata', port: '/dev/tty.usbmodem14111' },
    { name: 'opencv', adaptor: 'opencv' }
  ],
  devices: [
    { name: 'servo', driver: 'servo', pin: 11, connection: "arduino" },
    { name: 'camera', driver: 'camera', camera: 0, connection: "opencv", haarcascade: __dirname + "/haarcascade_frontalface_alt.xml" }
  ],
  work: function(my) {
    var angle = 0;
    my.camera.once('cameraReady', function() {
      my.camera.on('facesDetected', function(err, im, faces) {
        if(faces.length > 0) {
          console.log(faces.length, faces[0].x);
          angle = (faces[0].x).fromScale(1024, 0).toScale(0, 180);
          my.servo.angle(angle);
        }
        my.camera.readFrame();
      });
      my.camera.on('frameReady', function(err, im) {
        my.camera.detectFaces(im);
      });
      my.camera.readFrame();
    });
  }
}).start();