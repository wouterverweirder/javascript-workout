var events = require('events'),
	util = require('util');

//server application logic for a certain slide
function SlideHandler(slide) {
	events.EventEmitter.call(this);

	this.slide = slide;
	this.clientHandlers = [];
}

util.inherits(SlideHandler, events.EventEmitter);

SlideHandler.prototype.dispose = function() {
};

SlideHandler.prototype.onInitializationComplete = function() {
};

SlideHandler.prototype.addClientHandler = function(clientHandler, isAddFromInitialization) {
	this.clientHandlers.push(clientHandler);
	this.onClientHandlerAdded(clientHandler, isAddFromInitialization);
};

SlideHandler.prototype.removeClientHandler = function(clientHandler) {
	var index = this.clientHandlers.indexOf(clientHandler);
	if(index > -1) {
		this.clientHandlers.splice(index, 1);
	}
	this.onClientHandlerRemoved(clientHandler);
};

SlideHandler.prototype.onClientHandlerAdded = function(clientHandler, isAddFromInitialization) {
};

SlideHandler.prototype.onClientHandlerRemoved = function(clientHandler) {
};

SlideHandler.prototype.sendToAll = function() {
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		this.clientHandlers[i].send.apply(this.clientHandlers[i], arguments);
	};
};

SlideHandler.prototype.sendToClientsByRole = function(role) {
	var args = Array.prototype.slice.call(arguments);
	args.shift();
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		if(this.clientHandlers[i].role === role) {
			this.clientHandlers[i].send.apply(this.clientHandlers[i], args);
		}
	};
};

module.exports = SlideHandler;