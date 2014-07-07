module.exports = (function(){
	var ContentBase = require('../ContentBase');

	var IntroPoster = ContentBase.extend({
		init: function() {
			this._super();
			console.log("[IntroPoster] init");

			this.socket = io.connect('/', {
				query: 'token=' + this.token
			});

			this._heartRateHandler = $.proxy(this.heartRateHandler, this);
			this._socketConnectHandler = $.proxy(this.socketConnectHandler, this);
			this._socketDisconnectHandler = $.proxy(this.socketDisconnectHandler, this);

			this.socket.on('heartRate', this._heartRateHandler);
			this.socket.on('connect', this._socketConnectHandler);
			this.socket.on('disconnect', this._socketDisconnectHandler);
		},

		socketConnectHandler: function() {
			console.log("[IntroPoster] socket connect");
			this.socket.emit('requestPolarH7');
		},

		socketDisconnectHandler: function() {
			console.log("[IntroPoster] socket disconnect");
		},

		heartRateHandler: function(heartRate) {
			//console.log("[intro-poster] heartRate", heartRate);
			$('.heartRate').text(heartRate + ' bpm');
		}
	});

	return IntroPoster;

})();