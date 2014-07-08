var events = require('events'),
	util = require('util'),
	AppModel = require('../model/AppModel');

function ClientHandler(socket) {
	events.EventEmitter.call(this);
	this.socket = socket;
	this.appModel = AppModel.getInstance();

	this._disconnectHandler = this.disconnectHandler.bind(this);
	this.socket.on('disconnect', this._disconnectHandler);

	this._currentSlideIndexChangedHandler = this.currentSlideIndexChangedHandler.bind(this);
	this.appModel.on(AppModel.CURRENT_SLIDE_INDEX_CHANGED, this._currentSlideIndexChangedHandler);

	this.currentSlideIndexChangedHandler(this.appModel.getCurrentSlideIndex(), this.appModel.slides[this.appModel.getCurrentSlideIndex()]);
}

util.inherits(ClientHandler, events.EventEmitter);

ClientHandler.prototype.dispose = function() {
	this.appModel.removeListener(AppModel.CURRENT_SLIDE_INDEX_CHANGED, this._currentSlideIndexChangedHandler);
};

ClientHandler.prototype.currentSlideIndexChangedHandler = function(currentSlideIndex, currentSlide) {
	this.socket.emit(AppModel.CURRENT_SLIDE_INDEX_CHANGED, currentSlideIndex, currentSlide);
};

ClientHandler.prototype.disconnectHandler = function() {
	this.emit('disconnect');
};

module.exports = ClientHandler;