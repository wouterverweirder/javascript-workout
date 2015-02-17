module.exports = (function(){

	function GameCharacter(spriteSheet) {
		this.state = false;
		this.heartRate = 0;
		this.sprite = new createjs.Sprite(spriteSheet);
		this.setState("standing");
	}

	GameCharacter.prototype.setState = function(value) {
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
	};

	GameCharacter.prototype.update = function() {
	};

	return GameCharacter;

})();