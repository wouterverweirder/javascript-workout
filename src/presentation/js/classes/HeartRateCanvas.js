export default class HeartRateCanvas {
  constructor(canvas) {
    this.pixelsPerBeatAt60BPM = 100;
    this.frameNr = 0;
    this.fps = 60;
    this.numValues = 0;
    this.numValuesMargin = 9;
    this.numValuesWithMargin = 9;
    this.heartRate = 0;
    this.backgroundColor = `#fff`;
    this.strokeColor = `#00f`;

    this.canvas = canvas;
    this.ctx = this.canvas.getContext(`2d`);
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this._initSizeDependedVariables();

    this.heartRateTickInterval = Math.round(this.fps * 60 / this.heartRate);
  }

  resize(w, h) {
    this.width = this.canvas.width = w;
    this.height = this.canvas.height = h;
    this._initSizeDependedVariables();
  }

  _initSizeDependedVariables() {
    this.numValues = Math.round(this.width * 0.80);
    this.numValuesWithMargin = this.numValues + this.numValuesMargin;
    if(!this.values) {
      this.values = [];
    }
    this.values.length = this.numValuesWithMargin;
    this.canvasVerticalCenter = this.height / 2;
  }

  tick() {
    this.frameNr++;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvasVerticalCenter - (this.canvasVerticalCenter * this.values[0]));
    for(let i = 1; i < this.numValues; i++) {
      this.ctx.lineTo(i, this.canvasVerticalCenter - (this.canvasVerticalCenter * this.values[i]));
    }
    this.ctx.strokeStyle = this.strokeColor;
    this.ctx.stroke();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.arc(this.numValues - 1, this.canvasVerticalCenter - (this.canvasVerticalCenter * this.values[this.numValues - 1]), 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.strokeColor;
    this.ctx.fill();
    this.ctx.closePath();

    //does the tick align with a beat?
    if(this.heartRate > 0 && this.frameNr % this.heartRateTickInterval === 0) {
      this.frameNr = 0;//reset to zero
      const strength = 0.7 + Math.random() * 0.3;
      this.values[this.numValuesWithMargin - this.numValuesMargin - 1] = 0.05 * strength;
      this.values[this.numValuesWithMargin - this.numValuesMargin + 0] = 0.1 * strength;
      this.values[this.numValuesWithMargin - this.numValuesMargin + 1] = 0.3 * strength;
      this.values[this.numValuesWithMargin - this.numValuesMargin + 2] = 1 * strength;
      this.values[this.numValuesWithMargin - this.numValuesMargin + 3] = 0 * strength;
      this.values[this.numValuesWithMargin - this.numValuesMargin + 4] = -1 * strength;
      this.values[this.numValuesWithMargin - this.numValuesMargin + 5] = -0.3 * strength;
      this.values[this.numValuesWithMargin - this.numValuesMargin + 6] = -0.1 * strength;
      this.values[this.numValuesWithMargin - this.numValuesMargin + 7] = -0.05 * strength;
      this.values[this.numValuesWithMargin - this.numValuesMargin + 8] = 0 * strength;
    }

    this.values.shift();
    this.values.shift();
    this.values.push(Math.random() * 0.05 - 0.1);
    this.values.push(Math.random() * 0.05 - 0.1);
  }

  updateHeartRate(heartRate) {
    this.heartRate = heartRate;
    if(this.heartRate > 0) {
      this.heartRateTickInterval = Math.round(this.fps * 60 / this.heartRate);
    }
  }
}
