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

SlideHandler.prototype.addClientHandler = function(clientHandler) {
	this.clientHandlers.push(clientHandler);
	console.log("[SlideHandler] add client handler", this.clientHandlers.length);
};

SlideHandler.prototype.removeClientHandler = function(clientHandler) {
	var index = this.clientHandlers.indexOf(clientHandler);
	if(index > -1) {
		this.clientHandlers.splice(index, 1);
	}
	//console.log("[SlideHandler] remove client handler", this.clientHandlers.length);
};

module.exports = SlideHandler;