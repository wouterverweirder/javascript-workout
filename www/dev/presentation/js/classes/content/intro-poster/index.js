module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');
	var HeartRateCanvas = require('../../HeartRateCanvas');

	var IntroPoster = ContentBase.extend({
		init: function(name) {
			this._super(name);
			console.log("[IntroPoster] init");

			this.heartRateCanvas = new HeartRateCanvas(document.getElementById('polarHeartRateCanvas'));
			this.heartRateCanvas.updateHeartRate(60);//default 60 bpm
			this.resizeHeartRateCanvas();

			this._heartRateHandler = $.proxy(this.heartRateHandler, this);
			this._socketConnectHandler = $.proxy(this.socketConnectHandler, this);

			this.socket.on('heartRate', this._heartRateHandler);
			this.socket.on('connect', this._socketConnectHandler);
			this.socket.on(Constants.HEART_RATE_POLAR, $.proxy(this.heartRatePolarHandler, this));

			$(window).on('resize', $.proxy(this.resizeHandler, this));
		},

		socketConnectHandler: function() {
			console.log("[IntroPoster] socket connect");
			this.socket.emit('requestPolarH7');
		},

		heartRatePolarHandler: function(heartRate) {
			this.heartRateCanvas.updateHeartRate(heartRate);
		},

		resizeHandler: function() {
			this.resizeHeartRateCanvas();
		},

		resizeHeartRateCanvas: function() {
			this.heartRateCanvas.resize(window.innerWidth, window.innerHeight / 2);
		}
	});

	return IntroPoster;

})();