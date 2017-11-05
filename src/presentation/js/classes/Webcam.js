const getUserMedia = config => {
  return new Promise((resolve, reject) => {
    navigator.getUserMedia = navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia;
    navigator.getUserMedia(config, stream => {
      resolve(stream);
    }, err => reject(err));
  });
};

const getCameraConfig = videoWidth => {
  return new Promise(resolve => {
    MediaStreamTrack.getSources(mediaSources => {
      let sourceId;
      mediaSources.forEach(mediaSource => {
        if (mediaSource.kind === `video`) {
          console.log(mediaSource.label.toLowerCase());
          if(!sourceId || mediaSource.label.toLowerCase().indexOf(`facetime`) === -1) {
            sourceId = mediaSource.id;
          }
        }
      });
      const cameraConfig = {
        video: {
          optional: [
            {sourceId: sourceId},
            {minWidth: videoWidth}
          ]
        }
      };
      resolve(cameraConfig);
    });
  });
};

export default class Webcam {
  constructor(video) {
    this.video = video;
    getCameraConfig(1280)
      .then(config => getUserMedia(config))
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
