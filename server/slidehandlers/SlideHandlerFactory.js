var	SlideHandler = require('./SlideHandler'),
	IntroPosterSlideHandler = require('./intro-poster'),
	ShakeYourPhonesSlideHandler = require('./shake-your-phones'),
	HighestHeartrateGameSlideHandler = require('./highest-heartrate-game'),
	LowestHeartrateGameSlideHandler = require('./lowest-heartrate-game'),
	DancePadGameSlideHandler = require('./dance-pad-game');

module.exports = {
	createSlideHandler: function(slide) {
		switch(slide.name) {
			case "intro-poster": return new IntroPosterSlideHandler(slide);
			case "shake-your-phones": return new ShakeYourPhonesSlideHandler(slide);
			case "highest-heartrate-game": return new HighestHeartrateGameSlideHandler(slide);
			case "lowest-heartrate-game": return new LowestHeartrateGameSlideHandler(slide);
			case "050-spacebrew-arduino-dance": return new DancePadGameSlideHandler(slide);
		}
		return new SlideHandler(slide);
	}
};