module.exports = (function(){

	var dgram = requireNode('dgram');

	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');
	var GameCharacter = require('./GameCharacter');
	var HeartRateCanvas = require('../../HeartRateCanvas');

	function HighestHeartrateGame() {
		ContentBase.call(this, 'highest-heartrate-game');
		this.winner = false;
		this.flagDropped = false;
		this.sparkIdMap = {};
		this.minHeartRate = 130;
		this.maxHeartRate = 200;

		this._udpErrorHandler = this.udpErrorHandler.bind(this);
		this._udpMessageHandler = this.udpMessageHandler.bind(this);
		this._udpListeningHandler = this.udpListeningHandler.bind(this);

		this.peachCanvas = new HeartRateCanvas(document.getElementById('peach'));
		this.marioCanvas = new HeartRateCanvas(document.getElementById('mario'));

		//game canvas
		this.canvas = document.getElementById('game');
		this.stage = new createjs.Stage(this.canvas);

		this.backgroundFill = new createjs.Shape();
		this.stage.addChild(this.backgroundFill);

		var manifest = [
			{ src: "images/mario/mario-spritesheet.png", id: "characters" },
			{ src: "images/mario/ground.png", id: "ground" },
			{ src: "images/mario/hills.png", id: "hills" },
			{ src: "images/mario/flagpole.png", id: "flagpole" },
			{ src: "images/mario/flag-spritesheet.png", id: "flag" }
		];
		this.loader = new createjs.LoadQueue(false);
		this.loader.addEventListener("complete", $.proxy(this.loadCompleteHandler, this));
		this.loader.loadManifest(manifest);

		createjs.Ticker.setFPS(60);
		createjs.Ticker.addEventListener("tick", this.stage);

		$('.substate-intro .btn').on('click', this.startClickHandler.bind(this));

		this.showCurrentState();
	}

	HighestHeartrateGame.prototype = Object.create(ContentBase.prototype);

	HighestHeartrateGame.prototype.onStateChanged = function() {
		if(this.state === Constants.STATE_ACTIVE) {
			this.udpSocket = dgram.createSocket('udp4');
			this.udpSocket.on("error", this._udpErrorHandler);
			this.udpSocket.on("message", this._udpMessageHandler);
			this.udpSocket.on("listening", this._udpListeningHandler);
			this.udpSocket.bind(1234);
		} else {
			if(this.udpSocket) {
				//close the udp socket
				this.udpSocket.removeListener("error", this._udpErrorHandler);
				this.udpSocket.removeListener("message", this._udpMessageHandler);
				this.udpSocket.removeListener("listening", this._udpListeningHandler);
				this.udpSocket.close();
				this.udpSocket = null;
			}
		}
	};

	HighestHeartrateGame.prototype.udpErrorHandler = function(error) {
		console.log('[HighestHeartrateGame] udpErrorHandler', error);
		this.udpSocket.close();
	};

	HighestHeartrateGame.prototype.udpMessageHandler = function(message, remoteInfo) {
		var str = message.toString();
		var split = str.split(';');
		if(split.length > 2) {
			this.setHeartRate(split[0], split[2]);
		}
	};

	HighestHeartrateGame.prototype.udpListeningHandler = function() {
		console.log('[HighestHeartrateGame] udpListening');
	};

	HighestHeartrateGame.prototype.setHeartRate = function(id, heartRate) {
		heartRate = parseInt(heartRate);
		if(this.peach) {
			//assets are ready
			if(!this.sparkIdMap[id]) {
				if(!this.peach.sparkId) {
					this.sparkIdMap[id] = {
						character: this.peach,
						heartRateCanvas: this.peachCanvas,
						$col: $('.col-peach')
					};
					this.peach.sparkId = id;
				} else if(!this.mario.sparkId) {
					this.sparkIdMap[id] = {
						character: this.mario,
						heartRateCanvas: this.marioCanvas,
						$col: $('.col-mario')
					};
					this.mario.sparkId = id;
				}
			}
			if(this.sparkIdMap[id]) {
				//update canvas
				this.sparkIdMap[id].heartRateCanvas.updateHeartRate(heartRate);
				//update text
				this.sparkIdMap[id].$col.find('.heartRate').text(heartRate);
				//update character speed
				if(this.substate === Constants.HIGHEST_HEARTRATE_GAME_GAME && !this.winner) {
					var targetSpeed = Math.min(1, Math.max(0, this.map(heartRate, this.minHeartRate, this.maxHeartRate, 0, 1)));
					this.sparkIdMap[id].character.setSpeedX(targetSpeed);
				}
			}
		}
	};

	HighestHeartrateGame.prototype.loadCompleteHandler = function() {
		this.hillsImage = this.loader.getResult("hills");
		this.hills = new createjs.Shape();
		this.hills.tileW = this.hillsImage.width;

		this.groundImage = this.loader.getResult("ground");
		this.ground = new createjs.Shape();
		this.ground.tileW = this.groundImage.width;

		this.flagpole = new createjs.Bitmap(this.loader.getResult("flagpole"));

		this.flag = new createjs.Sprite(new createjs.SpriteSheet(
			{
				images: [this.loader.getResult("flag")], 
				frames:[
					[0, 0, 32, 32, 0, 0, 0],
					[32, 0, 32, 32, 0, 0, 0],
					[0, 32, 32, 32, 0, 0, 0],
				],
				animations: {
					moving:{ frames:[0, 1, 2, ], frequency:4, next:true},
				}
			}
		), "moving");
		this.flag.framerate = 8;

		this.peach = new GameCharacter(new createjs.SpriteSheet(
		{
			images: [this.loader.getResult("characters")],
			frames:[
				[0, 0, 32, 64, 0, 0, 0],
				[32, 0, 32, 64, 0, 0, 0],
				[64, 0, 32, 64, 0, 0, 0],
				[96, 0, 32, 64, 0, 0, 0],
				[0, 64, 32, 64, 0, 0, 0],],
				animations: {
				run:{ frames:[0, 1, 2, 3, ], frequency:4, next:true},
				jump:{ frames:[4, ], frequency:4, next:true},}
		}));
		this.peach.name = "peach";

		this.mario = new GameCharacter(new createjs.SpriteSheet(
		{
			images: [this.loader.getResult("characters")],
			frames:[
				[32, 64, 32, 64, 0, 0, 0],
				[64, 64, 32, 64, 0, 0, 0],
				[96, 64, 32, 64, 0, 0, 0],
				[0, 128, 32, 64, 0, 0, 0],
				[32, 128, 32, 64, 0, 0, 0],],
				animations: {
				run:{ frames:[0, 1, 2, 3, ], frequency:4, next:true},
				jump:{ frames:[4, ], frequency:4, next:true},}
		}));
		this.mario.name = "mario";

		this.resetGame();

		this.stage.addChild(this.hills, this.ground, this.flagpole, this.flag, this.mario.sprite, this.peach.sprite);
		this.resizeHandler();

		//fake control of characters
		$(window).on('keydown', this.keydownHandler.bind(this));
	};

	HighestHeartrateGame.prototype.setSubstate = function(substate) {
		if(this.substate !== substate) {
			this.substate = substate;
			this.showCurrentState();
		}
	};

	HighestHeartrateGame.prototype.showCurrentState = function() {
		$('.substate').removeClass('active');
		if(this.substate === Constants.HIGHEST_HEARTRATE_GAME_GAME) {
			this.resetGame();
			$('.substate-game').addClass('active');
		} else if(this.substate === Constants.HIGHEST_HEARTRATE_GAME_FINISHED) {
			$('.substate-finished').addClass('active');
		} else {
			$('.substate-intro').addClass('active');
		}
	};

	HighestHeartrateGame.prototype.map = function(value, istart, istop, ostart, ostop) {
		return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
	};

	HighestHeartrateGame.prototype.startClickHandler = function() {
		this.setSubstate(Constants.HIGHEST_HEARTRATE_GAME_GAME);
	};

	HighestHeartrateGame.prototype.resetGame = function() {
		this.winner = false;
		this.flagDropped = false;
		if(this.peach) {
			this.peach.setSpeedX(0);
			this.mario.setSpeedX(0);

			this.peach.sprite.x = 50;
			this.mario.sprite.x = 10;

			this.flag.y = this.flagpole.y + 16;
			this.flag.gotoAndPlay("moving");
		}
	};

	HighestHeartrateGame.prototype.drawLoop = function() {
		if(this.peach) {
			this.peach.update();
			this.mario.update();
			if(!this.winner) {
				if(this.peach.sprite.x >= this.peach.finalX) {
					this.setWinner(this.peach);
				} else if(this.mario.sprite.x >= this.mario.finalX) {
					this.setWinner(this.mario);
				}
			} else {
				//stop the non-winner
				if(this.winner === this.mario) {
					this.peach.setSpeedX(0);
				} else {
					this.mario.setSpeedX(0);
				}
				//drop flag?
				if(!this.flagDropped && this.winner.sprite.x >= this.flagpole.x) {
					this.flagDropped = true;
					this.flag.gotoAndStop("moving");
					this.winner.setSpeedX(0);
				}
				if(this.flagDropped) {
					//follow the winner down
					this.flag.y = this.winner.sprite.y;
				}
			}
		}
	};

	HighestHeartrateGame.prototype.setWinner = function(winner) {
		this.winner = winner;
		this.winner.setSpeedX(1);
		this.winner.jump(22);
		this.winner.finalReached = true;
		$('.substate-finished .winner').text(this.winner.name + " wins!");
		this.setSubstate(Constants.HIGHEST_HEARTRATE_GAME_FINISHED);
	};

	HighestHeartrateGame.prototype.keydownHandler = function(event) {
		if(!this.winner) {
			switch(event.keyCode) {
				case 65: //a
					this.peach.setSpeedX(0.5);
					break;
				case 90: //z
					this.mario.setSpeedX(0.5);
					break;
				default:
					this.peach.setSpeedX(0);
					this.mario.setSpeedX(0);
					break;
			}
		}
	};

	HighestHeartrateGame.prototype.resizeHandler = function() {
		//resize the canvas
		var w = this.canvas.width = window.innerWidth;
		var h = this.canvas.height = window.innerHeight;

		this.backgroundFill.graphics.beginFill('#5088a0').drawRect(0, 0, w, h).endFill();

		if(this.loader.loaded) {
			this.hills.graphics.clear();
			this.hills.graphics.beginBitmapFill(this.hillsImage).drawRect(0, 0, w+this.hillsImage.width, this.hillsImage.height);
			this.hills.y = h-this.hillsImage.height-this.groundImage.height;

			this.ground.graphics.clear();
			this.ground.graphics.beginBitmapFill(this.groundImage).drawRect(0, 0, w+this.groundImage.width, this.groundImage.height);
			this.ground.y = h-this.groundImage.height;

			this.flagpole.x = w - 100;
			this.flagpole.y = this.ground.y - this.flagpole.getBounds().height;

			this.peach.minX = this.mario.minX = 0;
			this.peach.maxX = this.mario.maxX = w - 50;

			this.peach.maxY = this.ground.y - this.peach.sprite.getBounds().height;
			this.mario.maxY = this.ground.y - this.mario.sprite.getBounds().height;

			this.peach.finalX = this.mario.finalX = this.flagpole.x - 100;

			this.flag.x = this.flagpole.x + 16;
			if(this.winner && this.flagDropped) {
				this.flag.y = this.winner.y;
			} else {
				this.flag.y = this.flagpole.y + 16;
			}
		}
	};

	return HighestHeartrateGame;

})();