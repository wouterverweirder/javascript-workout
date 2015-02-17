module.exports = (function(){

	function GameCharacter(spriteSheet) {
		this.speedX = 0;
		this.speedY = 0;
		this.minX = 0;
		this.minY = 0;
		this.maxX = 0;
		this.maxY = 0;
		this.finalX = 0;
		this.finalY = 0;
		this.jumping = false;
		this.finalReached = false;
		this.state = false;

		this.sprite = new createjs.Sprite(spriteSheet);
		this.sprite.framerate = 12;
	}

	GameCharacter.prototype.setSpeedX = function(value) {
		value = Math.max(0, Math.min(1, value));
		this.speedX = value;
	};

	GameCharacter.prototype.jump = function(amount) {
		if(!this.jumping) {
			this.jumping = true;
			if(!amount) {
				amount = 14;
			}
			this.speedY = -amount;
		}
	};

	GameCharacter.prototype.setState = function(value) {
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
	};

	GameCharacter.prototype.setCorrectState = function() {
		if(this.jumping) {
			this.setState("jumping");
		} else {
			if(this.speedX > 0) {
				this.setState("running");
			} else {
				this.setState("standing");
			}
		}
	};

	GameCharacter.prototype.update = function() {
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
	};

	return GameCharacter;

})();