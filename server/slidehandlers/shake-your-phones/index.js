var events = require('events'),
	util = require('util'),
	Constants = require('../../../shared/Constants'),
	SlideHandler = require('../SlideHandler');

function ShakeYourPhonesSlideHandler(slide) {
	SlideHandler.call(this, slide);
	console.log('[ShakeYourPhonesSlideHandler] constructor');
	this._updateMaximumMotionHandler = this.updateMaximumMotionHandler.bind(this);
	this._setSubstateHandler = this.setSubstateHandler.bind(this);
	this._selectWinnerHandler = this.selectWinnerHandler.bind(this);

	this.substate = Constants.SHAKE_YOUR_PHONES_INTRO;
}

util.inherits(ShakeYourPhonesSlideHandler, SlideHandler);

ShakeYourPhonesSlideHandler.prototype.dispose = function() {
	ShakeYourPhonesSlideHandler.super_.prototype.dispose.apply(this);
	//remove listeners from clientHandlers
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		this.clientHandlers[i].removeListener(Constants.UPDATE_MAXIMUM_MOTION, this._updateMaximumMotionHandler);
		this.clientHandlers[i].removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
		this.clientHandlers[i].removeListener(Constants.SELECT_WINNER, this._selectWinnerHandler);
	};
};

ShakeYourPhonesSlideHandler.prototype.onInitializationComplete = function() {
	ShakeYourPhonesSlideHandler.super_.prototype.onInitializationComplete.apply(this);
	this.resetAllMaximumMotions();
	this.sendList();
};

ShakeYourPhonesSlideHandler.prototype.sendList = function(targets) {
	var list = [];
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		if(this.clientHandlers[i].socketTargetSlide === this.slide.name && this.clientHandlers[i].role === Constants.ROLE_MOBILE) {
			list.push({
				id: this.clientHandlers[i].id,
				maximumMotion: this.clientHandlers[i].maximumMotion
			});
		}
	}
	if(!targets) {
		this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.SHAKE_YOUR_PHONES_CLIENT_LIST, list);
	} else {
		this.sendTo(targets, Constants.SHAKE_YOUR_PHONES_CLIENT_LIST, list);
	}
};

ShakeYourPhonesSlideHandler.prototype.onClientHandlerAdded = function(clientHandler, isAddFromInitialization) {
	clientHandler.maximumMotion = 0;
	clientHandler.send(Constants.SET_SUBSTATE, this.substate);
	if(clientHandler.role === Constants.ROLE_MOBILE) {
		clientHandler.on(Constants.UPDATE_MAXIMUM_MOTION, this._updateMaximumMotionHandler);
	} else if(clientHandler.role === Constants.ROLE_PRESENTATION) {
		clientHandler.on(Constants.SET_SUBSTATE, this._setSubstateHandler);
		clientHandler.on(Constants.SELECT_WINNER, this._selectWinnerHandler);
		this.sendList([clientHandler]);
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
	clientHandler.removeListener(Constants.SELECT_WINNER, this._selectWinnerHandler);
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
		this.clientHandlers[i].shakeWinner = false;
	};
};

ShakeYourPhonesSlideHandler.prototype.selectWinnerHandler = function() {
	//get the clienthandler with the largest motion, and blink it's screen
	var winningClientHandler = false;
	var maximumMotion = 0;
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		if(this.clientHandlers[i].role === Constants.ROLE_MOBILE && !this.clientHandlers[i].shakeWinner && this.clientHandlers[i].maximumMotion > maximumMotion) {
			winningClientHandler = this.clientHandlers[i];
			maximumMotion = winningClientHandler.maximumMotion;
		}
	}
	console.log('[ShakeYourPhonesSlideHandler] winningClientHandler', winningClientHandler);
	if(winningClientHandler) {
		winningClientHandler.shakeWinner = true;
		winningClientHandler.send(Constants.BLINK, ['<h1>Spectacular, You Win!</h1>', 'red']);
	}
};

ShakeYourPhonesSlideHandler.prototype.setSubstate = function(substate) {
	if(this.substate !== substate) {
		this.substate = substate;
		this.sendToAll(Constants.SET_SUBSTATE, substate);
		if(this.substate === Constants.SHAKE_YOUR_PHONES_GAME) {
			this.resetAllMaximumMotions();
			this.sendList();
		}
	}
};

module.exports = ShakeYourPhonesSlideHandler;