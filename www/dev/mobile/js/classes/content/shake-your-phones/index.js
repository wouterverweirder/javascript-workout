module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	var ShakeYourPhones = ContentBase.extend({
		currentMotion: 0,
		motion: 0,
		init: function() {
			this._super();
			console.log('[Mobile] shake your phones init');

			this.$background = $('.background');
			this.$background.css('top', '100%');
			this.$background.css('background-color', 'red');

			this.socket = io.connect('/', {
				query: 'token=' + this.token + "&slide=shake-your-phones"
			});

			this._motionUpdateHandler = $.proxy(this.motionUpdateHandler, this);

			this._socketConnectHandler = $.proxy(this.socketConnectHandler, this);
			this._socketDisconnectHandler = $.proxy(this.socketDisconnectHandler, this);

			this.socket.on('connect', this._socketConnectHandler);
			this.socket.on('disconnect', this._socketDisconnectHandler);
		},

		onStateChanged: function() {
			if(this.state === Constants.STATE_ACTIVE) {
				if (window.DeviceMotionEvent) {
					window.addEventListener('devicemotion', this._motionUpdateHandler, false);
				} else {
					$('.acceleration').text('Not supported on your device :-(');
				}
			} else {
				window.removeEventListener('devicemotion', this._motionUpdateHandler);
			}
		},

		socketConnectHandler: function() {
		},

		socketDisconnectHandler: function() {
		},

		motionUpdateHandler: function(event) {
			this.currentMotion = event.interval * (Math.abs(event.acceleration.x) + Math.abs(event.acceleration.y) + Math.abs(event.acceleration.z));
		},

		drawLoop: function() {
			this.motion += this.currentMotion;
			this.motion *= 0.97;
			this.$background.css('top', 100 - this.motion + '%');
		}
	});

	return ShakeYourPhones;

})();