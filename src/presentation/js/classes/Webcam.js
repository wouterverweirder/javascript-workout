const getCameraConfig = videoWidth => {
  let sourceId = false;
  return window.navigator.mediaDevices.enumerateDevices()
    .then(devices => devices.filter(device => device.kind === `video`))
    .then(devices => {
      devices.forEach(device => {
        console.log(device);
        if(!sourceId || device.label.toLowerCase().indexOf(`facetime`) === -1) {
          sourceId = device.deviceId;
        }
      });
    })
    .then(() => {
      return {
        video: {
          optional: [
            { sourceId },
            { minWidth: videoWidth}
          ]
        }
      };
    });
};

export default class Webcam {
  constructor(video) {
    this.video = video;
    getCameraConfig(1280)
      .then(config => window.navigator.mediaDevices.getUserMedia(config))
      .then(stream => {
        this.video.src = window.URL.createObjectURL(stream);
        this.video.onloadedmetadata = () => {
          this.video.width = this.video.videoWidth;
          this.video.height = this.video.videoHeight;
          this.video.play();
        };
      });
  }
}
