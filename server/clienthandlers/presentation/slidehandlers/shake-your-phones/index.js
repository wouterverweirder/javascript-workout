var events = require('events'),
	util = require('util'),
	SlideHandler = require('../SlideHandler'),
	Constants = require('../../../../../shared/Constants');

function ShakeYourPhonesSlideHandler(slideName, socket) {
	SlideHandler.call(this, slideName, socket);
	console.log('[ShakeYourPhonesSlideHandler] constructor');
}

util.inherits(ShakeYourPhonesSlideHandler, SlideHandler);

module.exports = ShakeYourPhonesSlideHandler;