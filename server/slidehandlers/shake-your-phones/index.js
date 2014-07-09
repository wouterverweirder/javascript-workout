var events = require('events'),
	util = require('util'),
	SlideHandler = require('../SlideHandler');

function ShakeYourPhonesSlideHandler(slide) {
	SlideHandler.call(this, slide);
	console.log('[ShakeYourPhonesSlideHandler] constructor');
	//clients will send accelerometer data
}

util.inherits(ShakeYourPhonesSlideHandler, SlideHandler);

module.exports = ShakeYourPhonesSlideHandler;