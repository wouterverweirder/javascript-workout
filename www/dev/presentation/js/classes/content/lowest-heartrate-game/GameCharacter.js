module.exports = (function(){
	var Class = require('core/Class');

	var GameCharacter = Class.extend({
		
		state: false,
		heartRate: 0,

		init: function(spriteSheet) {
			this.sprite = new createjs.Sprite(spriteSheet);
			this.setState("standing");
		},

		setState: function(value) {
			if(value !== this.state) {
				this.state = value;
				switch(this.state) {
					case "falling":
						this.sprite.framerate = 12;
						this.sprite.gotoAndPlay("falling");
						break;
					case "kameha":
						this.sprite.gotoAndPlay("kameha");
						break;
					default:
						this.sprite.framerate = 6;
						this.sprite.gotoAndPlay("standing");
						break;
				}
			}
		},

		update: function() {
		}
	});

	return GameCharacter;

})();