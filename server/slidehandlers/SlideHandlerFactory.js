var	SlideHandler = require('./SlideHandler'),
	IntroPosterSlideHandler = require('./intro-poster'),
	ShakeYourPhonesSlideHandler = require('./shake-your-phones');

module.exports = {
	createSlideHandler: function(slide) {
		switch(slide.name) {
			case "intro-poster": return new IntroPosterSlideHandler(slide);
			case "shake-your-phones": return new ShakeYourPhonesSlideHandler(slide);
		}
		return new SlideHandler(slide);
	}
};