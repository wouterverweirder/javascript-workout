import {Constants} from '../../../../shared/js/Constants';
import ContentBase from '../../../../shared/js/classes/ContentBase';
import HeartRateCanvas from '../HeartRateCanvas';

export default class HeartRateSlide extends ContentBase {

  constructor($slideHolder) {
    super($slideHolder);

    this.heartRateCanvas = new HeartRateCanvas(this.slideHolder.querySelector(`canvas`));
    this.heartRateCanvas.resize(this.width, this.height);
  }

  receiveMessage(event) {
    super.receiveMessage(event);
    if(event.data.action === Constants.HEART_RATE_POLAR) {
      this.updateHeartRate(event.data.heartRate);
    }
  }

  updateHeartRate(heartRate) {
    this.heartRateCanvas.updateHeartRate(heartRate);
    this.$slideHolder.find(`.heart-rate-text`).text(heartRate);
  }

  drawLoop() {
    if(this.sizeChanged) {
      this.heartRateCanvas.resize(this.width, this.height);
    }
    this.heartRateCanvas.tick();
  }

}
