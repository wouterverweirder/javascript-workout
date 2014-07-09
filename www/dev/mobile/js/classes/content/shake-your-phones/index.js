module.exports = (function(){
	var ContentBase = require('../ContentBase');
	//var Constants = require('Constants');

	var ShakeYourPhones = ContentBase.extend({
		totalMotion: 0,
		init: function() {
			this._super();
			console.log('[Mobile] shake your phones init');

			this.socket = io.connect('/', {
				query: 'token=' + this.token + "&slide=shake-your-phones"
			});

			this._motionUpdateHandler = $.proxy(this.motionUpdateHandler, this);

			this._socketConnectHandler = $.proxy(this.socketConnectHandler, this);
			this._socketDisconnectHandler = $.proxy(this.socketDisconnectHandler, this);

			this.socket.on('connect', this._socketConnectHandler);
			this.socket.on('disconnect', this._socketDisconnectHandler);
		},

		socketConnectHandler: function() {
			console.log('start tracking');
			if (window.DeviceMotionEvent) {
				window.addEventListener('devicemotion', this._motionUpdateHandler, false);
			} else {
				$('.acceleration').text('Not supported on your device :-(');
			}
		},

		socketDisconnectHandler: function() {
			console.log('stop tracking');
			window.removeEventListener('devicemotion', this._motionUpdateHandler);
		},

		motionUpdateHandler: function(event) {
			var motion = Math.abs(event.acceleration.x) + Math.abs(event.acceleration.y) + Math.abs(event.acceleration.z);
			$('.acceleration').text(motion);
		}
	});

	return ShakeYourPhones;

})();