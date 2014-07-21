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

ShakeYourPhonesSlideHandler.prototype.onInitializationComplete = function() {
	ShakeYourPhonesSlideHandler.super_.prototype.onInitializationComplete.apply(this);
	this.resetAllMaximumMotions();
	this.sendList();
};

ShakeYourPhonesSlideHandler.prototype.sendList = function() {
	var list = [];
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		if(this.clientHandlers[i].socketTargetSlide === this.slide.name && this.clientHandlers[i].role === Constants.ROLE_MOBILE) {
			list.push({
				id: this.clientHandlers[i].id,
				maximumMotion: this.clientHandlers[i].maximumMotion
			});
		}
	}
	this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.SHAKE_YOUR_PHONES_CLIENT_LIST, list);
};

ShakeYourPhonesSlideHandler.prototype.onClientHandlerAdded = function(clientHandler, isAddFromInitialization) {
	clientHandler.maximumMotion = 0;
	clientHandler.send(Constants.SET_SUBSTATE, this.substate);
	if(clientHandler.role === Constants.ROLE_MOBILE) {
		clientHandler.on(Constants.UPDATE_MAXIMUM_MOTION, this._updateMaximumMotionHandler);
	} else if(clientHandler.role === Constants.ROLE_PRESENTATION) {
		clientHandler.on(Constants.SET_SUBSTATE, this._setSubstateHandler);
	}
	if(!isAddFromInitialization) {
		if(clientHandler.socketTargetSlide === this.slide.name && clientHandler.role === Constants.ROLE_MOBILE) {
			this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.SHAKE_YOUR_PHONES_CLIENT_ADDED, {
				id: clientHandler.id,
				maximumMotion: clientHandler.maximumMotion
			});
		}
	}
};

ShakeYourPhonesSlideHandler.prototype.onClientHandlerRemoved = function(clientHandler) {
	clientHandler.removeListener(Constants.UPDATE_MAXIMUM_MOTION, this._updateMaximumMotionHandler);
	clientHandler.removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
	if(clientHandler.socketTargetSlide === this.slide.name && clientHandler.role === Constants.ROLE_MOBILE) {
		this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.SHAKE_YOUR_PHONES_CLIENT_REMOVED, {
			id: clientHandler.id,
			maximumMotion: clientHandler.maximumMotion
		});
	}
};

ShakeYourPhonesSlideHandler.prototype.updateMaximumMotionHandler = function(clientHandler, maximumMotion) {
	clientHandler.maximumMotion = maximumMotion;
	//inform the presentation of this client's updated maximum motion
	if(clientHandler.socketTargetSlide === this.slide.name && clientHandler.role === Constants.ROLE_MOBILE) {
		this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.SHAKE_YOUR_PHONES_CLIENT_UPDATE, {
			id: clientHandler.id,
			maximumMotion: clientHandler.maximumMotion
		});
	}
};

ShakeYourPhonesSlideHandler.prototype.setSubstateHandler = function(clientHandler, substate) {
	this.setSubstate(substate);
};

ShakeYourPhonesSlideHandler.prototype.resetAllMaximumMotions = function() {
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		this.clientHandlers[i].maximumMotion = 0;
	};
};

ShakeYourPhonesSlideHandler.prototype.setSubstate = function(substate) {
	if(this.substate !== substate) {
		this.substate = substate;
		this.sendToAll(Constants.SET_SUBSTATE, substate);
		if(this.substate === Constants.SHAKE_YOUR_PHONES_GAME) {
			this.resetAllMaximumMotions();
			this.sendList();
			//this.substateTimeout = setTimeout(this.setSubstate.bind(this, Constants.SHAKE_YOUR_PHONES_FINISHED), 1000);
		} else if(this.substate === Constants.SHAKE_YOUR_PHONES_FINISHED) {
		}
	}
};

module.exports = ShakeYourPhonesSlideHandler;