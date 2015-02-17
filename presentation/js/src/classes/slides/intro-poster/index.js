module.exports = (function(){

	var Constants = require('Constants');
	var ContentBase = require('../ContentBase');
	var HeartRateCanvas = require('../../HeartRateCanvas');

	function IntroPoster() {
		ContentBase.call(this, 'intro-poster');
		console.log("[IntroPoster] init");

		this.heartRateCanvas = new HeartRateCanvas(document.getElementById('polarHeartRateCanvas'));
		this.heartRateCanvas.showHeartRateTextInBackground = true;
		this.heartRateCanvas.updateHeartRate(60);//default 60 bpm
		this.resizeHeartRateCanvas();

		$(window).on('resize', $.proxy(this.resizeHandler, this));
	}

	IntroPoster.prototype = Object.create(ContentBase.prototype);

	IntroPoster.prototype.handleMessage = function(data) {
		if(data.action === Constants.HEART_RATE_POLAR) {
			this.updateHeartRate(data.heartRate);
		}
	};

	IntroPoster.prototype.updateHeartRate = function(heartRate) {
		this.heartRateCanvas.updateHeartRate(heartRate);
		$('.background.heartrate').text(heartRate);
	};

	IntroPoster.prototype.resizeHandler = function() {
		this.resizeHeartRateCanvas();
	};

	IntroPoster.prototype.resizeHeartRateCanvas = function() {
		this.heartRateCanvas.resize(window.innerWidth, window.innerHeight / 2);
	};

	return IntroPoster;

})();