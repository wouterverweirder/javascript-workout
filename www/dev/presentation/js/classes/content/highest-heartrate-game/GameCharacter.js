module.exports = (function(){
	var Class = require('core/Class');

	var GameCharacter = Class.extend({
		
		speedX: 0,
		speedY: 0,
		minX: 0,
		minY: 0,
		maxX: 0,
		maxY: 0,
		finalX: 0,
		finalY: 0,
		jumping: false,
		finalReached: false,
		state: false,

		init: function(spriteSheet) {
			this.sprite = new createjs.Sprite(spriteSheet);
			this.sprite.framerate = 12;
		},

		setSpeedX: function(value) {
			value = Math.max(0, Math.min(1, value));
			this.speedX = value;
		},

		jump: function(amount) {
			if(!this.jumping) {
				this.jumping = true;
				if(!amount) {
					amount = 14;
				}
				this.speedY = -amount;
			}
		},

		setState: function(value) {
			if(value !== this.state) {
				this.state = value;
				switch(this.state) {
					case "jumping":
						this.sprite.gotoAndStop("jump");
						break;
					case "running":
						this.sprite.gotoAndPlay("run");
						break;
					default:
						this.sprite.gotoAndStop("run");
						break;
				}
			}
		},

		setCorrectState: function() {
			if(this.jumping) {
				this.setState("jumping");
			} else {
				if(this.speedX > 0) {
					this.setState("running");
				} else {
					this.setState("standing");
				}
			}
		},

		update: function() {
			var targetX = this.sprite.x + (this.speedX * 4);
			var targetY = this.sprite.y + this.speedY;

			this.speedY += 1;
			if(targetY > this.maxY) {
				this.speedY = 0;
				if(this.jumping) {
					this.jumping = false;

				}
			}

			this.setCorrectState();

			this.sprite.x = Math.round(Math.min(this.maxX, Math.max(this.minX, targetX)));
			this.sprite.y = Math.round(Math.min(this.maxY, Math.max(this.minY, targetY)));
		}
	});

	return GameCharacter;

})();