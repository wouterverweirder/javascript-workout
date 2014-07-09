var events = require('events'),
	util = require('util'),
	Constants = require('../../../shared/Constants'),
	SlideHandler = require('../SlideHandler');

function ShakeYourPhonesSlideHandler(slide) {
	SlideHandler.call(this, slide);
	console.log('[ShakeYourPhonesSlideHandler] constructor');
	this._updateMaximumMotionHandler = this.updateMaximumMotionHandler.bind(this);
	this._setSubstateHandler = this.setSubstateHandler.bind(this);

	this.substate = Constants.SHAKE_YOUR_PHONES_INTRO;
}

util.inherits(ShakeYourPhonesSlideHandler, SlideHandler);

ShakeYourPhonesSlideHandler.prototype.dispose = function() {
	ShakeYourPhonesSlideHandler.super_.prototype.dispose.apply(this);
	//remove listeners from clientHandlers
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		this.clientHandlers[i].removeListener(Constants.UPDATE_MAXIMUM_MOTION, this._updateMaximumMotionHandler);
		this.clientHandlers[i].removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
	};
};

ShakeYourPhonesSlideHandler.prototype.onClientHandlerAdded = function(clientHandler) {
	clientHandler.send(Constants.SET_SUBSTATE, this.substate);
	if(clientHandler.role === Constants.ROLE_MOBILE) {
		clientHandler.on(Constants.UPDATE_MAXIMUM_MOTION, this._updateMaximumMotionHandler);
	} else if(clientHandler.role === Constants.ROLE_PRESENTATION) {
		clientHandler.on(Constants.SET_SUBSTATE, this._setSubstateHandler);
	}
};

ShakeYourPhonesSlideHandler.prototype.onClientHandlerRemoved = function(clientHandler) {
	clientHandler.removeListener(Constants.UPDATE_MAXIMUM_MOTION, this._updateMaximumMotionHandler);
	clientHandler.removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
};

ShakeYourPhonesSlideHandler.prototype.updateMaximumMotionHandler = function(clientHandler, maximumMotion) {
	clientHandler.maximumMotion = maximumMotion;
};

ShakeYourPhonesSlideHandler.prototype.setSubstateHandler = function(clientHandler, substate) {
	this.setSubstate(substate);
};

ShakeYourPhonesSlideHandler.prototype.setSubstate = function(substate) {
	if(this.substate !== substate) {
		this.substate = substate;
		this.sendToAll(Constants.SET_SUBSTATE, substate);
		if(this.substate === Constants.SHAKE_YOUR_PHONES_GAME) {
			this.substateTimeout = setTimeout(this.setSubstate.bind(this, Constants.SHAKE_YOUR_PHONES_FINISHED), 1000);
		}
	}
};

module.exports = ShakeYourPhonesSlideHandler;