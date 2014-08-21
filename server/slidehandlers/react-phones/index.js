var events = require('events'),
	util = require('util'),
	Constants = require('../../../shared/Constants'),
	SlideHandler = require('../SlideHandler');

function ReactPhonesSlideHandler(slide) {
	SlideHandler.call(this, slide);
	console.log('[ReactPhonesSlideHandler] constructor');
	this._updateReactionSpeedHandler = this.updateReactionSpeedHandler.bind(this);
	this._setSubstateHandler = this.setSubstateHandler.bind(this);
	this._selectWinnerHandler = this.selectWinnerHandler.bind(this);

	this.substate = Constants.REACT_PHONES_INTRO;
}

util.inherits(ReactPhonesSlideHandler, SlideHandler);

ReactPhonesSlideHandler.prototype.dispose = function() {
	ReactPhonesSlideHandler.super_.prototype.dispose.apply(this);
	//remove listeners from clientHandlers
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		this.clientHandlers[i].removeListener(Constants.UPDATE_REACTION_SPEED, this._updateReactionSpeedHandler);
		this.clientHandlers[i].removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
		this.clientHandlers[i].removeListener(Constants.SELECT_WINNER, this._selectWinnerHandler);
	};
};

ReactPhonesSlideHandler.prototype.onInitializationComplete = function() {
	ReactPhonesSlideHandler.super_.prototype.onInitializationComplete.apply(this);
	this.resetAllReactionSpeeds();
	this.sendList();
};

ReactPhonesSlideHandler.prototype.sendList = function(targets) {
	var list = [];
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		if(this.clientHandlers[i].socketTargetSlide === this.slide.name && this.clientHandlers[i].role === Constants.ROLE_MOBILE) {
			list.push({
				id: this.clientHandlers[i].id,
				reactionSpeed: this.clientHandlers[i].reactionSpeed
			});
		}
	}
	if(!targets) {
		this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.REACT_PHONES_CLIENT_LIST, list);
	} else {
		this.sendTo(targets, Constants.REACT_PHONES_CLIENT_LIST, list);
	}
};

ReactPhonesSlideHandler.prototype.onClientHandlerAdded = function(clientHandler, isAddFromInitialization) {
	clientHandler.reactionSpeed = 0;
	clientHandler.send(Constants.SET_SUBSTATE, this.substate);
	if(clientHandler.role === Constants.ROLE_MOBILE) {
		clientHandler.on(Constants.UPDATE_REACTION_SPEED, this._updateReactionSpeedHandler);
	} else if(clientHandler.role === Constants.ROLE_PRESENTATION) {
		clientHandler.on(Constants.SET_SUBSTATE, this._setSubstateHandler);
		clientHandler.on(Constants.SELECT_WINNER, this._selectWinnerHandler);
		this.sendList([clientHandler]);
	}
	if(!isAddFromInitialization) {
		if(clientHandler.socketTargetSlide === this.slide.name && clientHandler.role === Constants.ROLE_MOBILE) {
			this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.REACT_PHONES_CLIENT_ADDED, {
				id: clientHandler.id,
				reactionSpeed: clientHandler.reactionSpeed
			});
		}
	}
};

ReactPhonesSlideHandler.prototype.onClientHandlerRemoved = function(clientHandler) {
	clientHandler.removeListener(Constants.UPDATE_REACTION_SPEED, this._updateReactionSpeedHandler);
	clientHandler.removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
	clientHandler.removeListener(Constants.SELECT_WINNER, this._selectWinnerHandler);
	if(clientHandler.socketTargetSlide === this.slide.name && clientHandler.role === Constants.ROLE_MOBILE) {
		this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.REACT_PHONES_CLIENT_REMOVED, {
			id: clientHandler.id,
			reactionSpeed: clientHandler.reactionSpeed
		});
	}
};

ReactPhonesSlideHandler.prototype.updateReactionSpeedHandler = function(clientHandler, reactionSpeed) {
	clientHandler.reactionSpeed = reactionSpeed;
	//inform the presentation of this client's updated reaction speed
	if(clientHandler.socketTargetSlide === this.slide.name && clientHandler.role === Constants.ROLE_MOBILE) {
		this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.REACT_PHONES_CLIENT_UPDATE, {
			id: clientHandler.id,
			reactionSpeed: clientHandler.reactionSpeed
		});
	}
};

ReactPhonesSlideHandler.prototype.setSubstateHandler = function(clientHandler, substate) {
	this.setSubstate(substate);
};

ReactPhonesSlideHandler.prototype.resetAllReactionSpeeds = function() {
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		this.clientHandlers[i].reactionSpeed = 0;
		this.clientHandlers[i].speedWinner = false;
	};
};

ReactPhonesSlideHandler.prototype.selectWinnerHandler = function() {
	//get the clienthandler with the smallest reaction speed, and blink it's screen
	var winningClientHandler = false;
	var reactionSpeed = 99999999999;
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		if(this.clientHandlers[i].role === Constants.ROLE_MOBILE && !this.clientHandlers[i].speedWinner && this.clientHandlers[i].reactionSpeed < reactionSpeed && this.clientHandlers[i].reactionSpeed > 0) {
			winningClientHandler = this.clientHandlers[i];
			reactionSpeed = winningClientHandler.reactionSpeed;
		}
	}
	console.log('[ReactPhonesSlideHandler] winningClientHandler', winningClientHandler);
	if(winningClientHandler) {
		winningClientHandler.speedWinner = true;
		winningClientHandler.send(Constants.BLINK, ['<h1>Spectacular, You Win!</h1>', 'red']);
	}
};

ReactPhonesSlideHandler.prototype.setSubstate = function(substate) {
	if(this.substate !== substate) {
		this.substate = substate;
		this.sendToAll(Constants.SET_SUBSTATE, substate);
		if(this.substate === Constants.REACT_PHONES_GAME) {
			this.resetAllReactionSpeeds();
			this.sendList();
		}
	}
};

module.exports = ReactPhonesSlideHandler;