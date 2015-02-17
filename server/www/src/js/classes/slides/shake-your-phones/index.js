module.exports = (function(){

	var Constants = require('Constants');
	var ContentBase = require('shared/ContentBase');
	
	function ShakeYourPhones() {
		ContentBase.call(this, 'shake-your-phones');
		this.currentMotion = 0;
		this.motion = 0;
		this.maximumMotion = 0;

		this.$background = $('.background');
		this.$background.css('top', '100%');
		this.$background.css('background-color', 'red');

		this._motionUpdateHandler = this.motionUpdateHandler.bind(this);
	}

	ShakeYourPhones.prototype = Object.create(ContentBase.prototype);

	ShakeYourPhones.prototype.onStateChanged = function() {
		if(this.state === Constants.STATE_ACTIVE) {
			this.maximumMotion = 0;
			if (window.DeviceMotionEvent) {
				window.addEventListener('devicemotion', this._motionUpdateHandler, false);
			} else {
				$('.acceleration').text('Not supported on your device :-(');
			}
		} else {
			window.removeEventListener('devicemotion', this._motionUpdateHandler);
		}
	};

	ShakeYourPhones.prototype.receiveSocketMessage = function(message) {
		if(!message.content) {
			return;
		}
		if(message.content.action === Constants.SET_SUBSTATE) {
			this.setSubstate(message.content.substate);
		}
	};

	ShakeYourPhones.prototype.setSubstate = function(substate) {
		if(this.substate !== substate) {
			this.substate = substate;
			this.showCurrentState();
		}
	};

	ShakeYourPhones.prototype.motionUpdateHandler = function(event) {
		this.currentMotion = event.interval * (Math.abs(event.acceleration.x) + Math.abs(event.acceleration.y) + Math.abs(event.acceleration.z));
	};

	ShakeYourPhones.prototype.drawLoop = function() {
		this.motion += this.currentMotion;
		this.motion *= 0.97;
		this.$background.css('top', 100 - this.motion + '%');
		this.maximumMotion = Math.max(this.maximumMotion, this.motion);
		if(this.currentFrame % 10 === 0 && this.maximumMotion !== this.lastSentMaximumMotion) {
			this.lastSentMaximumMotion = this.maximumMotion;
			this.postSocketMessage({
				target: {
					client: 'presentation',
					slide: 'shake-your-phones'
				},
				content: {
					action: Constants.UPDATE_MAXIMUM_MOTION,
					maximumMotion: this.maximumMotion
				}
			});
		}
	};

	ShakeYourPhones.prototype.showCurrentState = function() {
		$('.substate').removeClass('active');
		if(this.substate === Constants.SHAKE_YOUR_PHONES_GAME) {
			$('.substate-game').addClass('active');
		} else if(this.substate === Constants.SHAKE_YOUR_PHONES_FINISHED) {
			$('.substate-finished').addClass('active');
		} else {
			$('.substate-intro').addClass('active');
		}
	};

	return ShakeYourPhones;

})();