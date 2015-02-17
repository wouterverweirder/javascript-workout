module.exports = (function(){

	function HeartRateCanvas(canvas) {
		this.pixelsPerBeatAt60BPM = 100;
		this.frameNr = 0;
		this.fps = 60;
		this.numValues = 0;
		this.numValuesMargin = 9;
		this.numValuesWithMargin = 9;
		this.heartRate = 0;
		this.backgroundColor = '#fff';
		this.strokeColor = '#00f';

		this.canvas = canvas;
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		this._initSizeDependedVariables();

		this.heartRateTickInterval = Math.round(this.fps * 60 / this.heartRate);

		this.stage = new createjs.Stage(this.canvas);
		
		this.drawingShape = new createjs.Shape();
		this.stage.addChild(this.drawingShape);

		createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
		createjs.Ticker.setFPS(this.fps);
		this._tick = $.proxy(this.tick, this);
		createjs.Ticker.addEventListener("tick", this._tick);
	}

	HeartRateCanvas.prototype.resize = function(w, h) {
		this.width = this.canvas.width = w;
		this.height = this.canvas.height = h;
		this._initSizeDependedVariables();
	};

	HeartRateCanvas.prototype._initSizeDependedVariables = function() {
		this.numValues = Math.round(this.width * 0.80);
		this.numValuesWithMargin = this.numValues + this.numValuesMargin;
		if(!this.values) {
			this.values = [];
		}
		this.values.length = this.numValuesWithMargin;
		this.canvasVerticalCenter = this.height / 2;
	};

	HeartRateCanvas.prototype.dispose = function() {
		createjs.Ticker.removeEventListener("tick", this._tick);
	};

	HeartRateCanvas.prototype.tick = function() {
		this.frameNr++;

		this.drawingShape.graphics.clear()
			//.beginFill(this.backgroundColor)
			//.drawRect(0, 0, this.width, this.height)
			//.endFill()
			.beginStroke(this.strokeColor);

		this.drawingShape.graphics.moveTo(0, this.canvasVerticalCenter - (this.canvasVerticalCenter * this.values[0]));
		for(var i = 1; i < this.numValues; i++) {
			this.drawingShape.graphics.lineTo(i, this.canvasVerticalCenter - (this.canvasVerticalCenter * this.values[i]));
		}
		this.drawingShape.graphics.endStroke();

		this.drawingShape.graphics.beginFill(this.strokeColor)
			.drawCircle(this.numValues - 1, this.canvasVerticalCenter - (this.canvasVerticalCenter * this.values[this.numValues - 1]), 2)
			.endFill();

		//does the tick align with a beat?
		if(this.heartRate > 0 && this.frameNr % this.heartRateTickInterval === 0) {
			this.frameNr = 0;//reset to zero
			var strength = 0.7 + Math.random() * 0.3;
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

		this.stage.update();
	};

	HeartRateCanvas.prototype.updateHeartRate = function(heartRate) {
		this.heartRate = heartRate;
		if(this.heartRate > 0) {
			this.heartRateTickInterval = Math.round(this.fps * 60 / this.heartRate);
		}
	};

	return HeartRateCanvas;

})();