var events = require('events'),
	util = require('util'),
	Constants = require('../../../shared/Constants'),
	SlideHandler = require('../SlideHandler');

function DancePadGameSlideHandler(slide) {
	SlideHandler.call(this, slide);
	console.log('[DancePadGameSlideHandler] constructor');
	this._setSubstateHandler = this.setSubstateHandler.bind(this);

	this.substate = Constants.DANCE_PAD_GAME_INTRO;
}

util.inherits(DancePadGameSlideHandler, SlideHandler);

DancePadGameSlideHandler.prototype.dispose = function() {
	DancePadGameSlideHandler.super_.prototype.dispose.apply(this);
	//remove listeners from clientHandlers
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		this.clientHandlers[i].removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
	};
};

DancePadGameSlideHandler.prototype.onClientHandlerAdded = function(clientHandler, isAddFromInitialization) {
	clientHandler.send(Constants.SET_SUBSTATE, this.substate);
	if(clientHandler.role === Constants.ROLE_PRESENTATION) {
		clientHandler.on(Constants.SET_SUBSTATE, this._setSubstateHandler);
	}
};

DancePadGameSlideHandler.prototype.onClientHandlerRemoved = function(clientHandler) {
	clientHandler.removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
};

DancePadGameSlideHandler.prototype.setSubstateHandler = function(clientHandler, substate) {
	this.setSubstate(substate);
};

DancePadGameSlideHandler.prototype.setSubstate = function(substate) {
	if(this.substate !== substate) {
		this.substate = substate;
		this.sendToAll(Constants.SET_SUBSTATE, substate);
		if(this.substate === Constants.DANCE_PAD_GAME_GAME) {
		} else if(this.substate === Constants.DANCE_PAD_GAME_FINISHED) {
		}
	}
};

module.exports = DancePadGameSlideHandler;