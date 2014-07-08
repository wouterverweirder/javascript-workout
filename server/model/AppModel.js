var events = require('events'),
	util = require('util'),
	fs = require('fs');

var instance = false;

function AppModel() {
	events.EventEmitter.call(this);
	this._currentSlideIndex = 0;
}

util.inherits(AppModel, events.EventEmitter);

AppModel.CURRENT_SLIDE_INDEX_CHANGED = 'currentSlideIndexChanged';

AppModel.getInstance = function() {
	if(!instance) {
		instance = new AppModel();
		instance.loadSlidesData();
	}
	return instance;
}

AppModel.prototype.loadSlidesData = function() {
	var data = JSON.parse(fs.readFileSync(__dirname + '/../../data.json', {encoding: "utf8"}));
	this.slides = data.slides;
};

AppModel.prototype.setCurrentSlideIndex = function(value) {
	value = Math.max(0, Math.min(value, this.slides.length - 1));
	if(value !== this._currentSlideIndex) {
		this._currentSlideIndex = value;
		this.emit(AppModel.CURRENT_SLIDE_INDEX_CHANGED, this._currentSlideIndex, this.slides[this._currentSlideIndex]);
	}
};

AppModel.prototype.getCurrentSlideIndex = function() {
	return this._currentSlideIndex;
};

module.exports = AppModel;