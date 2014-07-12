module.exports = (function(){
	var Class = require('core/Class');

	var HeartRateCanvas = Class.extend({
		pixelsPerBeatAt60BPM: 100,
		frameNr: 0,
		fps: 60,
		numValues: 0,
		numValuesMargin: 9,
		numValuesWithMargin: 9,
		heartRate: 60,
		init: function(canvas) {
			this.canvas = canvas;

			this.heartRateTickInterval = Math.round(this.fps * 60 / this.heartRate);

			this.numValues = Math.round(this.canvas.width * 0.75);
			this.numValuesWithMargin = this.numValues + this.numValuesMargin;
			this.values = new Array(this.numValuesWithMargin);
			for(var i = 0; i < this.numValuesWithMargin; i++) {
				this.values[i] = 0;
			}

			this.stage = new createjs.Stage(this.canvas);
			
			this.drawingShape = new createjs.Shape();
			this.stage.addChild(this.drawingShape);

			createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
			createjs.Ticker.setFPS(this.fps);
			this._tick = $.proxy(this.tick, this);
			createjs.Ticker.addEventListener("tick", this._tick);
		},
		dispose: function() {
			createjs.Ticker.removeEventListener("tick", this._tick);
		},
		tick: function() {
			this.frameNr++;
			this.drawingShape.graphics.clear()
				.beginFill('#000')
				.drawRect(0, 0, this.canvas.width, this.canvas.height)
				.endFill()
				.beginStroke("#0f0");

			var canvasVerticalCenter = this.canvas.height / 2;
			this.drawingShape.graphics.moveTo(0, canvasVerticalCenter - (canvasVerticalCenter * this.values[0]));
			for(var i = 1; i < this.numValues; i++) {
				this.drawingShape.graphics.lineTo(i, canvasVerticalCenter - (canvasVerticalCenter * this.values[i]));
			}
			this.drawingShape.graphics.endStroke();

			this.drawingShape.graphics.beginFill("#0f0")
				.drawCircle(this.numValues - 1, canvasVerticalCenter - (canvasVerticalCenter * this.values[this.numValues - 1]), 2)
				.endFill();

			//does the tick align with a beat?
			if(this.frameNr % this.heartRateTickInterval === 0) {
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
			this.values.push(Math.random() * 0.05 - 0.1);

			this.stage.update();
		},
		updateHeartRate: function(heartRate) {
			this.heartRate = heartRate;
			this.heartRateTickInterval = Math.round(this.fps * 60 / this.heartRate);
		},
	});

	return HeartRateCanvas;

})();