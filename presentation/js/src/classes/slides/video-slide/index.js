module.exports = (function(){
	var ContentBase = require('../ContentBase');

	function VideoSlide(name) {
		ContentBase.call(this, name);

		this.videoPlaying = false;

		this.video = $('video')[0];
		$(this.video).on('click', this.clickHandler.bind(this));
	}

	VideoSlide.prototype = Object.create(ContentBase.prototype);

	VideoSlide.prototype.clickHandler = function(event) {
		this.videoPlaying = !this.videoPlaying;
		if(this.videoPlaying) {
			this.video.play();
		} else {
			this.video.pause();
		}
	};

	return VideoSlide;

})();