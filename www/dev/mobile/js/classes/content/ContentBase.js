module.exports = (function(){
	var Class = require('core/Class');
	var Constants = require('Constants');

	var ContentBase = Class.extend({
		fps: 60,
		_animationFrameId: false,
		_currentTime: 0,
		_delta: 0,
		_interval: false,
		_lastTime: new Date().getTime(),
		currentFrame: 0,
		init: function() {
			this.token = $.getUrlVar('token');
			window.setState = $.proxy(this.setState, this);
			this.__drawLoop = $.proxy(this._drawLoop, this);
			this._interval = 1000 / this.fps;
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
		triggerEventOnParent: function() {
			var args = Array.prototype.slice.call(arguments);
			parent.$('body').trigger.apply(parent.$, args);
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
		}
	});

	return ContentBase;

})();