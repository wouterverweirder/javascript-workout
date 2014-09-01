module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');
	var GameCharacter = require('./GameCharacter');
	var HeartRateCanvas = require('../../HeartRateCanvas');

	var LowestHeartrateGame = ContentBase.extend({
		sparkIdMap: {},
		beamPosition: 0.5,
		maxHeartRate: 70,
		winner: false,
		init: function(name) {
			this._super(name);
			console.log("[LowestHeartrateGame] init");

			this._setSubstateHandler = $.proxy(this.setSubstateHandler, this);
			this._heartRateSparkHandler = $.proxy(this.heartRateSparkHandler, this);

			this.socket.on(Constants.SET_SUBSTATE, this._setSubstateHandler);
			this.socket.on(Constants.HEART_RATE_SPARK, this._heartRateSparkHandler);

			$('.substate-intro .btn').on('click', $.proxy(this.startClickHandler, this));

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
			this.loader.addEventListener("complete", $.proxy(this.loadCompleteHandler, this));
			this.loader.loadManifest(manifest);

			createjs.Ticker.setFPS(60);
			createjs.Ticker.addEventListener("tick", this.stage);

			this.showCurrentState();
			$(window).on('resize', $.proxy(this.resizeHandler, this));
			this.resizeHandler();

			//fake control
			//$(window).on('mousemove', $.proxy(this.mousemoveHandler, this));
		},

		loadCompleteHandler: function() {

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
		},

		setSubstateHandler: function(substate) {
			if(this.substate !== substate) {
				this.substate = substate;
				this.showCurrentState();
			}
		},

		heartRateSparkHandler: function(id, heartRate) {
			heartRate = parseInt(heartRate);
			if(this.goku) {
				//assets are ready
				if(!this.sparkIdMap[id]) {
					if(!this.goku.sparkId) {
						this.sparkIdMap[id] = {
							character: this.goku,
							heartRateCanvas: this.gokuCanvas,
							$col: $('.col-goku')
						};
						this.goku.sparkId = id;
					} else if(!this.gohan.sparkId) {
						this.sparkIdMap[id] = {
							character: this.gohan,
							heartRateCanvas: this.gohanCanvas,
							$col: $('.col-gohan')
						};
						this.gohan.sparkId = id;
					}
				}
				if(this.sparkIdMap[id]) {
					//update canvas
					this.sparkIdMap[id].heartRateCanvas.updateHeartRate(heartRate);
					//update text
					this.sparkIdMap[id].$col.find('.heartRate').text(heartRate);
					//update heart rate
					this.sparkIdMap[id].character.heartRate = heartRate;
				}
			}
		},

		map: function(value, istart, istop, ostart, ostop) {
    		return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
  		},

		startClickHandler: function() {
			this.socket.emit(Constants.SET_SUBSTATE, Constants.LOWEST_HEARTRATE_GAME_GAME);
		},

		showCurrentState: function() {
			$('.substate').removeClass('active');
			if(this.substate === Constants.LOWEST_HEARTRATE_GAME_GAME) {
				this.resetGame();
				$('.substate-game').addClass('active');
			} else if(this.substate === Constants.LOWEST_HEARTRATE_GAME_FINISHED) {
				$('.substate-finished').addClass('active');
			} else {
				$('.substate-intro').addClass('active');
			}
		},

		resetGame: function() {
			this.beamPosition = 0.5;
			this.gokuAbsoluteBeamPosition = this.minBeamEndX;
			this.gohanAbsoluteBeamPosition = this.maxBeamEndX;
			this.winner = false;
		},

		drawLoop: function() {
			if(this.goku) {
				this.goku.update();
				this.gohan.update();

				//update beamPosition according to heart rates
				if(this.goku.heartRate > 0 && this.gohan.heartRate > 0 && this.goku.heartRate < this.maxHeartRate && this.gohan.heartRate < this.maxHeartRate) {
					var heartRateDiff = this.gohan.heartRate - this.goku.heartRate;
					var newBeamPosition = this.beamPosition + (heartRateDiff * 0.0001);
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
		},

		setWinner: function(winner) {
			this.winner = winner;
			if(this.winner === this.gohan) {
				this.beamPosition = -1;
			} else {
				this.beamPosition = 2;
			}
			$('.substate-finished .winner').text(this.winner.name + " wins!");
			//timeout to change state
			setTimeout($.proxy(this.socket.emit, this.socket, Constants.SET_SUBSTATE, Constants.LOWEST_HEARTRATE_GAME_FINISHED), 500);
		},

		resizeHandler: function() {
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
		},

		setBeamPosition: function(value) {
			value = Math.max(0, Math.min(1, value));
			if(value !== this.beamPosition) {
				this.beamPosition = value;
			}
		},

		/**
		 * test with mouse instead of heartrates
		 */
		mousemoveHandler: function(event) {
			if(!this.winner) {
				this.setBeamPosition(event.clientX / this.canvas.width);
			}
		}
	});

	return LowestHeartrateGame;

})();