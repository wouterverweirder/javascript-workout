module.exports = (function(){
	var Class = require('core/Class');

	var ScoreBar = Class.extend({
		score: 0,
		init: function() {
			this.display = new createjs.Container();

			var bgGfx = new createjs.Graphics();
			bgGfx.s('#fff').dr(0.5, 0.5, 521, 34).es();
			var bg = new createjs.Shape(bgGfx);

			var gradientGfx = new createjs.Graphics();
			gradientGfx.lf(["#f00","#0f0"], [0, 1], 0, 0, 520, 0).dr(0, 0, 520, 33).ef();
			this.gradient = new createjs.Shape(gradientGfx);
			this.gradient.x = 1;
			this.gradient.y = 1;

			this.gradientMaskGfx = new createjs.Graphics();
			this.gradientMaskGfx.f('#fff').dr(0, 0, 520, 33).ef();
			this.gradientMask = new createjs.Shape(this.gradientMaskGfx);
			this.gradientMask.x = this.gradient.x;
			this.gradientMask.y = this.gradient.y;

			this.gradient.mask = this.gradientMask;

			this.gradientMask.scaleX = 0;

			this.display.addChild(bg, this.gradient);
		},

		setScore: function(value) {
			value = Math.min(1, Math.max(0, value));
			if(value !== this.score) {
				this.score = value;
			}
		},

		update: function() {
			this.gradientMask.scaleX += (this.score - this.gradientMask.scaleX) * 0.05;
		}
	});

	return ScoreBar;

})();