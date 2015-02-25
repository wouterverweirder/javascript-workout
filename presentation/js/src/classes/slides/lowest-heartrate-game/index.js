module.exports = (function(){

	var dgram = requireNode('dgram');

	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');
	var GameCharacter = require('./GameCharacter');
	var HeartRateCanvas = require('../../HeartRateCanvas');

	function LowestHeartrateGame() {
		ContentBase.call(this, 'lowest-heartrate-game');

		this.sparkIdMap = {};
		this.beamPosition = 0.5;
		this.maxHeartRate = 100;
		this.winner = false;

		this._udpErrorHandler = this.udpErrorHandler.bind(this);
		this._udpMessageHandler = this.udpMessageHandler.bind(this);
		this._udpListeningHandler = this.udpListeningHandler.bind(this);

		console.log("[LowestHeartrateGame] init");

		$('.substate-intro .btn').on('click', this.startClickHandler.bind(this));

		//heart rate canvas
		this.gokuCanvas = new HeartRateCanvas(document.getElementById('goku'));
		this.gohanCanvas = new HeartRateCanvas(document.getElementById('gohan'));

		//game canvas
		this.canvas = document.getElementById('game');
		this.stage = new createjs.Stage(this.canvas);

		this.backgroundFill = new createjs.Shape();
		this.stage.addChild(this.backgroundFill);

		var manifest = [
			{ src: "images/dragonball/dragonball-spritesheet.png", id: "characters" },
			{ src: "images/dragonball/beam.png", id: "beam" },
			{ src: "images/dragonball/background.png", id: "background" },
			{ src: "images/dragonball/floor.png", id: "floor" }
		];
		this.loader = new createjs.LoadQueue(false);
		this.loader.addEventListener("complete", this.loadCompleteHandler.bind(this));
		this.loader.loadManifest(manifest);

		createjs.Ticker.setFPS(60);
		createjs.Ticker.addEventListener("tick", this.stage);

		this.showCurrentState();
		$(window).on('resize', this.resizeHandler.bind(this));
		this.resizeHandler();
	}

	LowestHeartrateGame.prototype = Object.create(ContentBase.prototype);

	LowestHeartrateGame.prototype.onStateChanged = function() {
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

	LowestHeartrateGame.prototype.udpErrorHandler = function(error) {
		console.log('[LowestHeartrateGame] udpErrorHandler', error);
		this.udpSocket.close();
	};

	LowestHeartrateGame.prototype.udpMessageHandler = function(message, remoteInfo) {
		var str = message.toString();
		var split = str.split(';');
		if(split.length > 2) {
			this.setHeartRate(split[0], split[2]);
		}
	};

	LowestHeartrateGame.prototype.udpListeningHandler = function() {
		console.log('[LowestHeartrateGame] udpListening');
	};

	LowestHeartrateGame.prototype.loadCompleteHandler = function() {
		this.backgroundImage = new createjs.Bitmap(this.loader.getResult("background"));
		this.floorImage = new createjs.Bitmap(this.loader.getResult("floor"));

		this.goku = new GameCharacter(new createjs.SpriteSheet(
		{
			images: [this.loader.getResult("characters")],
			frames:[
				[364, 364, 182, 182, 0, 0, 0],
				[546, 364, 182, 182, 0, 0, 0],
				[728, 364, 182, 182, 0, 0, 0],
				[0, 546, 182, 182, 0, 0, 0],
				[182, 546, 182, 182, 0, 0, 0],
				[364, 546, 182, 182, 0, 0, 0],
				[546, 546, 182, 182, 0, 0, 0],
				[728, 546, 182, 182, 0, 0, 0],
				[0, 728, 182, 182, 0, 0, 0],
				[182, 728, 182, 182, 0, 0, 0],],
				animations: {
				falling:{ frames:[0, 1, 2, 3, 4, 5, 6, ], frequency:4, next:false},
				kameha:{ frames:[7, ], frequency:4, next:true},
				standing:{ frames:[8, 9, ], frequency:4, next:true},}
		}));
		this.goku.name = "goku";

		this.gohan = new GameCharacter(new createjs.SpriteSheet(
		{
			images: [this.loader.getResult("characters")],
			frames:[
				[364, 0, 182, 182, 0, 0, 0],
				[546, 0, 182, 182, 0, 0, 0],
				[728, 0, 182, 182, 0, 0, 0],
				[0, 182, 182, 182, 0, 0, 0],
				[182, 182, 182, 182, 0, 0, 0],
				[364, 182, 182, 182, 0, 0, 0],
				[546, 182, 182, 182, 0, 0, 0],
				[728, 182, 182, 182, 0, 0, 0],
				[0, 364, 182, 182, 0, 0, 0],
				[182, 364, 182, 182, 0, 0, 0],],
				animations: {
				falling:{ frames:[0, 1, 2, 3, 4, 5, 6, ], frequency:4, next:false},
				kameha:{ frames:[7, ], frequency:4, next:true},
				standing:{ frames:[8, 9, ], frequency:4, next:true},}
		}));
		this.gohan.sprite.scaleX = -1;
		this.gohan.name = "gohan";

		this.beamImage = this.loader.getResult("beam");

		this.gokuBeam = new createjs.Shape();
		this.gokuBeam.regY = this.beamImage.height / 2;
		this.gokuBeam.tileW = this.beamImage.width;

		this.gohanBeam = new createjs.Shape();
		this.gohanBeam.regY = this.beamImage.height / 2;
		this.gohanBeam.tileW = this.beamImage.width;

		this.gokuBeamEnd = new createjs.Sprite(new createjs.SpriteSheet({
			images: [this.loader.getResult("characters")],
			frames:[
				[0, 0, 182, 182, 0, 0, 0],
				[182, 0, 182, 182, 0, 0, 0],],
				animations: {
				beaming:{ frames:[0, 1, ], frequency:4, next:true},}
		}), "beaming");
		this.gokuBeamEnd.regX = this.gokuBeamEnd.getBounds().width / 2 - 20;
		this.gokuBeamEnd.regY = this.gokuBeamEnd.getBounds().height / 2;
		this.gokuBeamEnd.scaleX = -1;
		this.gokuBeamEnd.framerate = 10;

		this.gohanBeamEnd = new createjs.Sprite(new createjs.SpriteSheet({
			images: [this.loader.getResult("characters")],
			frames:[
				[0, 0, 182, 182, 0, 0, 0],
				[182, 0, 182, 182, 0, 0, 0],],
				animations: {
				beaming:{ frames:[0, 1, ], frequency:4, next:true},}
		}), "beaming");
		this.gohanBeamEnd.regX = this.gohanBeamEnd.getBounds().width / 2 - 20;
		this.gohanBeamEnd.regY = this.gohanBeamEnd.getBounds().height / 2;
		this.gohanBeamEnd.framerate = 10;

		this.resizeHandler();
		this.resetGame();

		this.stage.addChild(this.backgroundImage, this.floorImage, this.gohan.sprite, this.goku.sprite, this.gokuBeam, this.gohanBeam, this.gokuBeamEnd, this.gohanBeamEnd);
	};

	LowestHeartrateGame.prototype.setSubstate = function(substate) {
		if(this.substate !== substate) {
			this.substate = substate;
			this.showCurrentState();
		}
	};

	LowestHeartrateGame.prototype.setHeartRate = function(id, heartRate) {
		heartRate = parseInt(heartRate);
		//save it in the sparkIdMap
		if(!this.sparkIdMap[id]) {
			this.sparkIdMap[id] = {};
		}
		this.sparkIdMap[id].heartRate = heartRate;
		this.assignSparkIdsToCharacters();
		this.setHeartRates();
	};

	LowestHeartrateGame.prototype.assignSparkIdsToCharacters = function() {
		if(!this.gohan) {
			return;
		}
		for(var id in this.sparkIdMap) {
			if(!this.sparkIdMap[id].heartRate) {
				this.sparkIdMap[id].heartRate = 60;
			}
			if(!this.sparkIdMap[id].character) {
				if(!this.gohan.sparkId) {
					this.gohan.sparkId = id;
					this.sparkIdMap[id].character = this.gohan;
					this.sparkIdMap[id].heartRateCanvas = this.gohanCanvas;
					this.sparkIdMap[id].$col = $('.col-gohan');
				} else if(!this.goku.sparkId) {
					this.goku.sparkId = id;
					this.sparkIdMap[id].character = this.goku;
					this.sparkIdMap[id].heartRateCanvas = this.gokuCanvas;
					this.sparkIdMap[id].$col = $('.col-goku');
				}
			}
		}
	};

	LowestHeartrateGame.prototype.setHeartRates = function() {
		for(var id in this.sparkIdMap) {
			if(this.sparkIdMap[id].character) {
				//update canvas
				this.sparkIdMap[id].heartRateCanvas.updateHeartRate(this.sparkIdMap[id].heartRate);
				//update text
				this.sparkIdMap[id].$col.find('.heartRate').text(this.sparkIdMap[id].heartRate);
				//update heart rate
				this.sparkIdMap[id].character.heartRate = this.sparkIdMap[id].heartRate;
			}
		}
	};

	LowestHeartrateGame.prototype.map = function(value, istart, istop, ostart, ostop) {
		return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
	};

	LowestHeartrateGame.prototype.startClickHandler = function() {
		this.setSubstate(Constants.LOWEST_HEARTRATE_GAME_GAME);
	};

	LowestHeartrateGame.prototype.showCurrentState = function() {
		$('.substate').removeClass('active');
		if(this.substate === Constants.LOWEST_HEARTRATE_GAME_GAME) {
			this.resetGame();
			$('.substate-game').addClass('active');
		} else if(this.substate === Constants.LOWEST_HEARTRATE_GAME_FINISHED) {
			$('.substate-finished').addClass('active');
		} else {
			$('.substate-intro').addClass('active');
		}
		this.setHeartRates();
	};

	LowestHeartrateGame.prototype.resetGame = function() {
		this.beamPosition = 0.5;
		this.gokuAbsoluteBeamPosition = this.minBeamEndX;
		this.gohanAbsoluteBeamPosition = this.maxBeamEndX;
		this.winner = false;
	};

	LowestHeartrateGame.prototype.drawLoop = function() {
		if(this.goku) {
			this.goku.update();
			this.gohan.update();

			//update beamPosition according to heart rates
			if(this.goku.heartRate > 0 && this.gohan.heartRate > 0) {
				var heartRateDiff = Math.min(this.maxHeartRate, this.gohan.heartRate) - Math.min(this.maxHeartRate, this.goku.heartRate);
				var newBeamPosition = this.beamPosition + (heartRateDiff * 0.0002);
				this.setBeamPosition(newBeamPosition);
			}

			var targetBeamPosition = this.minBeamEndX + this.beamPosition * this.availableBeamWidth;

			this.gokuAbsoluteBeamPosition += (targetBeamPosition - this.gokuAbsoluteBeamPosition) * 0.2;
			this.gohanAbsoluteBeamPosition += (targetBeamPosition - this.gohanAbsoluteBeamPosition) * 0.2;

			//position the beam ends
			this.gokuBeamEnd.x = this.gokuAbsoluteBeamPosition;
			this.gohanBeamEnd.x = this.gohanAbsoluteBeamPosition;

			//redraw the beams
			this.gokuBeam.x = this.minBeamEndX - 30;
			this.gokuBeam.graphics.clear();
			this.gokuBeam.graphics.beginBitmapFill(this.beamImage).drawRect(0, 0, this.gokuAbsoluteBeamPosition + 20 - this.minBeamEndX, this.beamImage.height);

			this.gohanBeam.x = this.gohanAbsoluteBeamPosition + 10;
			this.gohanBeam.graphics.clear();
			this.gohanBeam.graphics.beginBitmapFill(this.beamImage).drawRect(0, 0, this.maxBeamEndX - this.gohanAbsoluteBeamPosition + 16, this.beamImage.height);

			this.gokuBeam.visible = this.gohanBeam.visible = this.gokuBeamEnd.visible = this.gohanBeamEnd.visible = (this.substate === Constants.LOWEST_HEARTRATE_GAME_GAME);

			if(!this.winner) {
				if(this.substate === Constants.LOWEST_HEARTRATE_GAME_GAME) {
					this.goku.setState('kameha');
					this.gohan.setState('kameha');
					if(this.beamPosition < 0.05) {
						this.setWinner(this.gohan);
					} else if(this.beamPosition > 0.95) {
						this.setWinner(this.goku);
					}
				} else {
					this.goku.setState('standing');
					this.gohan.setState('standing');
				}
			} else {
				if(this.substate !== Constants.LOWEST_HEARTRATE_GAME_GAME) {
					this.winner.setState('standing');
				}
				if(this.winner === this.goku) {
					this.gohan.setState('falling');
				} else {
					this.goku.setState('falling');
				}
			}
		}
	};

	LowestHeartrateGame.prototype.setWinner = function(winner) {
		this.winner = winner;
		if(this.winner === this.gohan) {
			this.beamPosition = -1;
		} else {
			this.beamPosition = 2;
		}
		$('.substate-finished .winner').text(this.winner.name + " wins!");
		//timeout to change state
		setTimeout($.proxy(this.setSubstate, this, Constants.LOWEST_HEARTRATE_GAME_FINISHED), 500);
	};

	LowestHeartrateGame.prototype.resizeHandler = function() {
		//resize the canvas
		var w = this.canvas.width = window.innerWidth;
		var h = this.canvas.height = window.innerHeight;

		this.minBeamEndX = 270;
		this.maxBeamEndX = w - 270;
		this.availableBeamWidth = this.maxBeamEndX - this.minBeamEndX;

		this.backgroundFill.graphics.beginFill('#d87040').drawRect(0, 0, w, h).endFill();

		if(this.goku) {
			this.backgroundImage.x = Math.round(w - this.backgroundImage.getBounds().width) / 2;
			this.backgroundImage.y = h - this.backgroundImage.getBounds().height - 100;

			this.floorImage.x = Math.round(w - this.floorImage.getBounds().width) / 2;
			this.floorImage.y = this.backgroundImage.y + this.backgroundImage.getBounds().height;

			this.goku.sprite.x = 100;
			this.goku.sprite.y = h - this.goku.sprite.getBounds().height;

			this.gohan.sprite.x = w - 100;
			this.gohan.sprite.y = h - this.gohan.sprite.getBounds().height;

			//beams
			this.gokuBeamEnd.y = this.gohanBeamEnd.y = h - 120;
			this.gokuBeam.y = this.gohanBeam.y = this.gokuBeamEnd.y;
		}
	};

	LowestHeartrateGame.prototype.setBeamPosition = function(value) {
		value = Math.max(0, Math.min(1, value));
		if(value !== this.beamPosition) {
			this.beamPosition = value;
		}
	};

	return LowestHeartrateGame;

})();