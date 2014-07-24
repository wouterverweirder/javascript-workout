module.exports = (function(){
	var Class = require('core/Class');
	var Constants = require('Constants');

	var KEYCODE_LEFT = 37;
	var KEYCODE_RIGHT = 39;

	var ContentBase = Class.extend({
		fps: 60,
		_animationFrameId: false,
		_currentTime: 0,
		_delta: 0,
		_interval: false,
		_lastTime: new Date().getTime(),
		currentFrame: 0,
		slideControlEnabled: true,
		init: function(name) {
			this.name = name;
			this.token = $.getUrlVar('token');
			window.setState = $.proxy(this.setState, this);
			$(window).on('keydown', $.proxy(this.keydownHandler, this));
			this.__drawLoop = $.proxy(this._drawLoop, this);
			this._interval = 1000 / this.fps;

			this.socket = io.connect('/', {
				query: 'token=' + this.token + "&slide=" + name
			});
		},

		setState: function(state) {
			if(state !== this.state) {
				this.state = state;
				this.onStateChanged();
				if(this.state === Constants.STATE_ACTIVE) {
					this.currentFrame = 0;
					this._drawLoop();
				} else {
					window.cancelAnimationFrame(this._animationFrameId);
				}
			}
		},

		onStateChanged: function() {
		},

		_drawLoop: function() {
			this._animationFrameId = window.requestAnimationFrame(this.__drawLoop);
			this._currentTime = (new Date()).getTime();
		    this._delta = (this._currentTime - this._lastTime);
		    if(this._delta > this._interval) {
		    	this.currentFrame++;
		    	this.drawLoop();
		    	this._lastTime = this._currentTime - (this._delta % this._interval);
		    }
		},
		drawLoop: function() {
		},

		keydownHandler: function(event) {
			if(this.slideControlEnabled) {
				switch(event.keyCode) {
					case KEYCODE_LEFT:
						parent.$('body').trigger(Constants.GO_TO_PREVIOUS_SLIDE);
						break;
					case KEYCODE_RIGHT:
						parent.$('body').trigger(Constants.GO_TO_NEXT_SLIDE);
						break;
				}
			}
		},
	});

	return ContentBase;

})();