module.exports = (function(){
	var Class = require('core/Class');

	var DancegameButton = Class.extend({

		init: function(spriteSheet, color, orientation) {
			this.spriteSheet = spriteSheet;
			this.color = color;
			this.orientation = orientation;

			this.state = DancegameButton.STATE_NORMAL;

			this.sprite = new createjs.Sprite(spriteSheet, color);
			this.sprite.regX = this.sprite.getBounds().width / 2;
			this.sprite.regY = this.sprite.getBounds().height / 2;
			switch(orientation) {
				case "up":
				this.sprite.rotation = 180;
					break;
				case "left":
					this.sprite.rotation = 90;
					break;
				case "right":
					this.sprite.rotation = 270;
					break;
			}
		},

		setState: function(state) {
			if(this.state !== state) {
				this.state = state;
				switch(this.state) {
					case DancegameButton.STATE_CORRECT:
						this.gotoAndStop(this.color + '-correct');
						break;
					case DancegameButton.STATE_WRONG:
						this.gotoAndStop(this.color + '-wrong');
						break;
					default:
						this.gotoAndStop(this.color);
						break;
				}
			}
		},

		gotoAndStop: function(frame) {
			this.sprite.gotoAndStop(frame);
		},

		update: function(speed) {
			this.sprite.y += -speed;
		}
	});

	DancegameButton.STATE_NORMAL = 'normal';
	DancegameButton.STATE_CORRECT = 'correct';
	DancegameButton.STATE_WRONG = 'wrong';

	return DancegameButton;

})();