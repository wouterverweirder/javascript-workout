module.exports = (function(){
	
	var Constants = require('Constants');

	function ContentBase(name) {
		this.name = name;
		this.fps = 60;
		this._animationFrameId = false;
		this._currentTime = 0;
		this._delta = 0;
		this._interval = false;
		this._lastTime = new Date().getTime();
		this.currentFrame = 0;

		window.addEventListener("message", this.receiveMessage.bind(this), false);

		this.__drawLoop = this._drawLoop.bind(this);
		this._interval = 1000 / this.fps;
	}

	ContentBase.prototype.receiveMessage = function(event) {
		if(!event.data) {
			return;
		}
		switch(event.data.action) {
			case 'setState':
				this.setState(event.data.state);
				break;
			case Constants.SOCKET_RECEIVE:
				this.receiveSocketMessage(event.data.message);
				break;
			default:
				this.handleMessage(event.data);
				break;
		}
	};

	ContentBase.prototype.postMessage = function(data) {
		parent.postMessage(data, "*");
	};

	ContentBase.prototype.handleMessage = function(data) {
	};

	ContentBase.prototype.postSocketMessage = function(message) {
		this.postMessage({
			action: Constants.SOCKET_SEND,
			message: message
		});
	};

	ContentBase.prototype.receiveSocketMessage = function(message) {
		//console.log('ContentBase.prototype.receiveSocketMessage ' + this.name, message);
	};

	ContentBase.prototype.setState = function(state) {
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
	};

	ContentBase.prototype.onStateChanged = function() {
	};

	ContentBase.prototype._drawLoop = function() {
		this._animationFrameId = window.requestAnimationFrame(this.__drawLoop);
		this._currentTime = (new Date()).getTime();
	    this._delta = (this._currentTime - this._lastTime);
	    if(this._delta > this._interval) {
	    	this.currentFrame++;
	    	this.drawLoop(this._delta);
	    	this._lastTime = this._currentTime - (this._delta % this._interval);
	    }
	};

	ContentBase.prototype.drawLoop = function(delta) {
	};

	return ContentBase;

})();