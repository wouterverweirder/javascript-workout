module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');
	var HeartRateCanvas = require('../../HeartRateCanvas');

	var IntroPoster = ContentBase.extend({
		init: function() {
			this._super();
			console.log("[IntroPoster] init");

			this.socket = io.connect('/', {
				query: 'token=' + this.token + "&slide=intro-poster"
			});

			this.heartRateCanvas = new HeartRateCanvas(document.getElementById('polarHeartRateCanvas'));

			this._heartRateHandler = $.proxy(this.heartRateHandler, this);
			this._socketConnectHandler = $.proxy(this.socketConnectHandler, this);
			this._socketDisconnectHandler = $.proxy(this.socketDisconnectHandler, this);

			this.socket.on('heartRate', this._heartRateHandler);
			this.socket.on('connect', this._socketConnectHandler);
			this.socket.on('disconnect', this._socketDisconnectHandler);
			this.socket.on(Constants.HEART_RATE_POLAR, $.proxy(this.heartRatePolarHandler, this));
		},

		socketConnectHandler: function() {
			console.log("[IntroPoster] socket connect");
			this.socket.emit('requestPolarH7');
		},

		socketDisconnectHandler: function() {
			console.log("[IntroPoster] socket disconnect");
		},

		heartRatePolarHandler: function(heartRate) {
			this.heartRateCanvas.updateHeartRate(heartRate);
		}
	});

	return IntroPoster;

})();