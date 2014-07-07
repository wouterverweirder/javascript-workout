module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	var ShakeYourPhones = ContentBase.extend({
		init: function() {
			this._super();
			console.log("[ShakeYourPhones] init");

			this.socket = io.connect('/', {
				query: 'token=' + this.token + "&slide=shake-your-phones"
			});

			this._socketConnectHandler = $.proxy(this.socketConnectHandler, this);
			this._socketDisconnectHandler = $.proxy(this.socketDisconnectHandler, this);

			this.socket.on('connect', this._socketConnectHandler);
			this.socket.on('disconnect', this._socketDisconnectHandler);
		},

		socketConnectHandler: function() {
			console.log("[ShakeYourPhones] socket connect");
			this.socket.emit(Constants.SHAKE_YOUR_PHONES_INIT);
		},

		socketDisconnectHandler: function() {
			console.log("[ShakeYourPhones] socket disconnect");
		}
	});

	return ShakeYourPhones;

})();