module.exports = (function(){

	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');
	var DanceGameButton = require('./DanceGameButton');
	var ScoreBar = require('./ScoreBar');

	function SpacebrewDanceGame() {
		ContentBase.call(this, 'spacebrew-dance-game');
		this.tweeningNotes = [];
		this.notesByTime = {"12":[{"name":"blue-up"}],"28":[{"name":"blue-up"}],"29":[{"name":"blue-up"}],"30":[{"name":"blue-up"}],"39":[{"name":"orange-down"}],"48":[{"name":"orange-up"}],"57":[{"name":"orange-down"}],"58":[{"name":"blue-down"}],"66":[{"name":"blue-down"}],"67":[{"name":"blue-left"},{"name":"orange-right"}],"74":[{"name":"blue-left"},{"name":"orange-up"},{"name":"blue-up"},{"name":"orange-right"}],"76":[{"name":"blue-left"},{"name":"orange-up"},{"name":"blue-up"},{"name":"orange-right"}],"77":[{"name":"orange-up"},{"name":"orange-right"}],"9.8":[{"name":"blue-up"}],"10.8":[{"name":"blue-down"}],"12.8":[{"name":"blue-down"}],"14.2":[{"name":"blue-up"}],"15.1":[{"name":"blue-down"}],"16.2":[{"name":"blue-left"}],"18.4":[{"name":"orange-up"}],"19.4":[{"name":"orange-down"}],"20.5":[{"name":"orange-up"}],"21.6":[{"name":"orange-down"}],"22.6":[{"name":"orange-up"}],"23.7":[{"name":"orange-down"}],"24.7":[{"name":"orange-right"}],"26.8":[{"name":"blue-up"}],"27.4":[{"name":"blue-down"}],"28.5":[{"name":"blue-down"}],"29.5":[{"name":"blue-down"}],"30.5":[{"name":"blue-down"}],"31.1":[{"name":"blue-up"}],"31.6":[{"name":"blue-down"}],"32.1":[{"name":"blue-up"}],"32.6":[{"name":"blue-down"}],"33.2":[{"name":"blue-left"}],"35.3":[{"name":"orange-up"}],"35.8":[{"name":"orange-down"}],"36.4":[{"name":"orange-up"}],"36.9":[{"name":"orange-down"}],"37.4":[{"name":"orange-up"}],"37.9":[{"name":"orange-down"}],"38.4":[{"name":"orange-up"}],"39.6":[{"name":"blue-up"}],"40.1":[{"name":"blue-down"}],"40.6":[{"name":"blue-up"}],"41.1":[{"name":"blue-down"}],"41.6":[{"name":"blue-up"}],"42.1":[{"name":"blue-down"}],"42.7":[{"name":"blue-up"}],"43.2":[{"name":"blue-down"}],"43.8":[{"name":"orange-up"}],"44.3":[{"name":"orange-down"}],"44.8":[{"name":"blue-up"}],"45.4":[{"name":"blue-down"}],"45.9":[{"name":"orange-up"}],"46.4":[{"name":"orange-down"}],"46.9":[{"name":"blue-up"}],"47.5":[{"name":"blue-down"}],"48.6":[{"name":"orange-down"}],"49.1":[{"name":"blue-up"}],"49.6":[{"name":"blue-down"}],"50.1":[{"name":"orange-right"}],"50.6":[{"name":"blue-left"}],"52.2":[{"name":"orange-right"}],"52.7":[{"name":"blue-left"}],"53.3":[{"name":"orange-right"}],"53.8":[{"name":"blue-left"}],"54.3":[{"name":"orange-right"}],"54.9":[{"name":"blue-left"}],"55.4":[{"name":"orange-right"}],"55.9":[{"name":"blue-left"}],"56.5":[{"name":"orange-up"}],"57.5":[{"name":"blue-up"}],"58.6":[{"name":"orange-up"}],"59.1":[{"name":"orange-down"}],"59.6":[{"name":"blue-up"}],"60.1":[{"name":"blue-down"}],"60.7":[{"name":"orange-right"}],"61.2":[{"name":"blue-left"}],"61.8":[{"name":"orange-up"}],"62.3":[{"name":"blue-up"}],"62.8":[{"name":"orange-down"}],"63.3":[{"name":"blue-down"}],"63.8":[{"name":"orange-right"}],"64.3":[{"name":"blue-left"}],"64.9":[{"name":"orange-up"}],"65.4":[{"name":"blue-up"}],"65.9":[{"name":"orange-down"}],"66.5":[{"name":"blue-down"},{"name":"orange-down"}],"67.5":[{"name":"blue-left"},{"name":"orange-right"}],"68.1":[{"name":"orange-up"},{"name":"blue-up"}],"68.5":[{"name":"blue-up"}],"68.6":[{"name":"orange-up"}],"69.2":[{"name":"blue-down"}],"69.3":[{"name":"orange-up"},{"name":"blue-up"}],"69.8":[{"name":"blue-down"},{"name":"blue-up"}],"70.3":[{"name":"orange-up"},{"name":"blue-up"}],"70.8":[{"name":"blue-down"},{"name":"blue-up"}],"71.4":[{"name":"blue-down"}],"71.9":[{"name":"blue-left"},{"name":"orange-up"},{"name":"blue-down"}],"72.4":[{"name":"blue-left"},{"name":"blue-down"}],"72.9":[{"name":"blue-left"},{"name":"orange-up"},{"name":"blue-up"},{"name":"orange-right"}],"73.5":[{"name":"blue-up"}],"74.5":[{"name":"blue-up"}],"74.9":[{"name":"blue-left"},{"name":"orange-up"},{"name":"blue-up"},{"name":"orange-right"}],"75.2":[{"name":"orange-up"},{"name":"blue-up"},{"name":"orange-right"}],"75.5":[{"name":"orange-up"},{"name":"blue-up"},{"name":"orange-right"}],"75.7":[{"name":"orange-up"}],"76.2":[{"name":"blue-left"},{"name":"orange-up"},{"name":"blue-up"},{"name":"orange-right"}],"76.5":[{"name":"blue-left"},{"name":"orange-up"},{"name":"blue-up"},{"name":"orange-right"}],"76.7":[{"name":"orange-up"},{"name":"orange-right"}],"77.3":[{"name":"blue-left"},{"name":"orange-up"},{"name":"blue-up"},{"name":"orange-right"}],"77.6":[{"name":"orange-up"},{"name":"orange-right"}]};
		this.noteNameMap = {};
		this.pressedButtons = [];
		this.speed = 3;
		this.timeToReachTarget = 0;
		this.tolerance = 0.15;
		this.noteNames = [
			"blue-up",
			"blue-down",
			"blue-left",
			"orange-up",
			"orange-down",
			"orange-right"
		];
		this.score = 0;
		this.record = true;
		this.recordedKeys = {};
		this.audio = false;
		this.roundedTime = 0;

		this.parseNotesByTime();

		this.audio = $('audio')[0];

		$('.substate-intro .btn').on('click', $.proxy(this.startClickHandler, this));
		$('.substate-game .btn').on('click', $.proxy(this.stopClickHandler, this));

		//spacebrew connection
		this.sb = new Spacebrew.Client("localhost", "DDR Presentation");
		this.sb.onBooleanMessage = $.proxy(this.handleButton, this);
		for (var i = this.noteNames.length - 1; i >= 0; i--) {
			this.sb.addSubscribe(this.noteNames[i], "boolean");
		}
		this.sb.connect();

		//game canvas
		this.canvas = document.getElementById('game');
		this.stage = new createjs.Stage(this.canvas);

		var manifest = [
			{ src: "images/dance/dancegame-buttons.png", id: "buttons" }
		];
		this.loader = new createjs.LoadQueue(false);
		this.loader.addEventListener("complete", $.proxy(this.loadCompleteHandler, this));
		this.loader.loadManifest(manifest);

		createjs.Ticker.setFPS(60);
		createjs.Ticker.addEventListener("tick", $.proxy(this.onTick, this));

		this.showCurrentState();
		$(window).on('resize', $.proxy(this.resizeHandler, this));
		this.resizeHandler();

		$(window).on('keyup', $.proxy(this.keyupHandler, this));
	}

	SpacebrewDanceGame.prototype = Object.create(ContentBase.prototype);

	SpacebrewDanceGame.prototype.parseNotesByTime = function() {
		var notesByTime = {};
		for(var key in this.notesByTime) {
			notesByTime[parseFloat(key)] = this.notesByTime[key];
		}
		this.notesByTime = notesByTime;
		console.log(this.notesByTime);
	};

	SpacebrewDanceGame.prototype.loadCompleteHandler = function() {

		this.buttonsSheet = new createjs.SpriteSheet(
{
images: [this.loader.getResult('buttons')], 
frames:[
[0, 0, 120, 120, 0, 0, 0],
[120, 0, 120, 120, 0, 0, 0],
[240, 0, 120, 120, 0, 0, 0],
[0, 120, 120, 120, 0, 0, 0],
[120, 120, 120, 120, 0, 0, 0],
[240, 120, 120, 120, 0, 0, 0],
[0, 240, 120, 120, 0, 0, 0],
[120, 240, 120, 120, 0, 0, 0],
[240, 240, 120, 120, 0, 0, 0],],
animations: {
'blue-wrong':{ frames:[0, ], frequency:4, next:true},
'orange-wrong':{ frames:[1, ], frequency:4, next:true},
'orange-correct':{ frames:[2, ], frequency:4, next:true},
'blue-correct':{ frames:[3, ], frequency:4, next:true},
'orange-outline':{ frames:[4, ], frequency:4, next:true},
'blue-outline':{ frames:[5, ], frequency:4, next:true},
'neutral-outline':{ frames:[6, ], frequency:4, next:true},
'orange':{ frames:[7, ], frequency:4, next:true},
'blue':{ frames:[8, ], frequency:4, next:true},}
});

		this.transparentBlueLeftButton = new DanceGameButton(this.buttonsSheet, 'neutral-outline', 'left');
		this.transparentBlueUpButton = new DanceGameButton(this.buttonsSheet, 'neutral-outline', 'up');
		this.transparentBlueDownButton = new DanceGameButton(this.buttonsSheet, 'neutral-outline', 'down');
		
		this.transparentOrangeDownButton = new DanceGameButton(this.buttonsSheet, 'neutral-outline', 'down');
		this.transparentOrangeUpButton = new DanceGameButton(this.buttonsSheet, 'neutral-outline', 'up');
		this.transparentOrangeRightButton = new DanceGameButton(this.buttonsSheet, 'neutral-outline', 'right');
		
		this.blueLeftContainer = new createjs.Container();
		this.blueUpContainer = new createjs.Container();
		this.blueDownContainer = new createjs.Container();

		this.orangeDownContainer = new createjs.Container();
		this.orangeUpContainer = new createjs.Container();
		this.orangeRightContainer = new createjs.Container();

		this.stage.addChild(this.blueLeftContainer, this.blueUpContainer, this.blueDownContainer, this.orangeDownContainer, this.orangeUpContainer, this.orangeRightContainer);
		this.stage.addChild(this.transparentBlueLeftButton.sprite, this.transparentBlueUpButton.sprite, this.transparentBlueDownButton.sprite, this.transparentOrangeRightButton.sprite, this.transparentOrangeUpButton.sprite, this.transparentOrangeDownButton.sprite);

		this.noteNameMap = {
			"orange-down": {
				orientation: "down",
				container: this.orangeDownContainer,
				transparentButton: this.transparentOrangeDownButton,
				color: "orange"
			},
			"orange-up": {
				orientation: "up",
				container: this.orangeUpContainer,
				transparentButton: this.transparentOrangeUpButton,
				color: "orange"
			},
			"orange-right": {
				orientation: "right",
				container: this.orangeRightContainer,
				transparentButton: this.transparentOrangeRightButton,
				color: "orange"
			},

			"blue-down": {
				orientation: "down",
				container: this.blueDownContainer,
				transparentButton: this.transparentBlueDownButton,
				color: "blue"
			},
			"blue-up": {
				orientation: "up",
				container: this.blueUpContainer,
				transparentButton: this.transparentBlueUpButton,
				color: "blue"
			},
			"blue-left": {
				orientation: "left",
				container: this.blueLeftContainer,
				transparentButton: this.transparentBlueLeftButton,
				color: "blue"
			}
		};

		this.scoreBar = new ScoreBar();
		this.stage.addChild(this.scoreBar.display);

		this.resetGame();
		this.resizeHandler();
	};

	//override setState, not to use drawLoop
	SpacebrewDanceGame.prototype.setState = function(state) {
		if(state !== this.state) {
			this.state = state;
			this.onStateChanged();
		}
	};

	SpacebrewDanceGame.prototype.setSubstate = function(substate) {
		if(this.substate !== substate) {
			this.substate = substate;
			this.showCurrentState();
		}
	};

	SpacebrewDanceGame.prototype.map = function(value, istart, istop, ostart, ostop) {
		return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
	};

	SpacebrewDanceGame.prototype.round = function(value, numDecimals) {
		var factor = Math.pow(10, numDecimals);
		return Math.round(value * factor) / factor;
	};

	SpacebrewDanceGame.prototype.startClickHandler = function() {
		this.setSubstate(Constants.DANCE_PAD_GAME_GAME);
	};

	SpacebrewDanceGame.prototype.stopClickHandler = function() {
		this.setSubstate(Constants.DANCE_PAD_GAME_FINISHED);
		this.audio.pause();
		if(this.record) {
			console.log(this.recordedKeys);
		}
	};

	SpacebrewDanceGame.prototype.showCurrentState = function() {
		console.log('showCurrentState', this.substate);
		$('.substate').removeClass('active');
		if(this.substate === Constants.DANCE_PAD_GAME_GAME) {
			this.resetGame();
			$('.substate-game').addClass('active');
			if(this.record) {
				this.recordedKeys = {};
			}
			this.roundedTime = 0;
			this.audio.currentTime = 0;
			this.audio.play();
		} else if(this.substate === Constants.DANCE_PAD_GAME_FINISHED) {
			$('.substate-finished').addClass('active');
			if(this.record) {
				console.log(JSON.stringify(this.recordedKeys));
			}
		} else {
			$('.substate-intro').addClass('active');
		}
	};

	SpacebrewDanceGame.prototype.resetGame = function() {
		for(var key in this.notesByTime) {
			for (var i = this.notesByTime[key].length - 1; i >= 0; i--) {
				this.notesByTime[key][i].correct = false;
				this.notesByTime[key][i].tweening = false;
			}
		}
		this.setScore(0.5);
	};

	SpacebrewDanceGame.prototype.onTick = function(event) {
		if(this.loader.loaded) {
			//show button states
			var noteName;
			var note;
			for (var i = this.noteNames.length - 1; i >= 0; i--) {
				noteName = this.noteNames[i];
				var isDown = (this.pressedButtons.indexOf(noteName) !== -1);
				if(isDown) {
					this.noteNameMap[noteName].transparentButton.gotoAndStop(this.noteNameMap[noteName].color + "-outline");
				} else {
					this.noteNameMap[noteName].transparentButton.gotoAndStop("neutral-outline");
				}
			}
			if(this.substate !== Constants.DANCE_PAD_GAME_INTRO) {
				this.roundedTime = this.round(this.audio.currentTime, 1);
				var timeWithOffset = this.round(this.roundedTime + this.timeToReachTarget, 1);
				if(this.notesByTime[timeWithOffset]) {
					for (var j = this.notesByTime[timeWithOffset].length - 1; j >= 0; j--) {
						var noteByTime = this.notesByTime[timeWithOffset][j];
						if(!noteByTime.tweening) {
							noteByTime.tweening = true;
							var mappedNote = this.noteNameMap[noteByTime.name];
							note = new DanceGameButton(this.buttonsSheet, mappedNote.color, mappedNote.orientation);
							note.time = timeWithOffset;
							note.noteByTime = noteByTime;
							note.sprite.y = this.canvas.height;
							mappedNote.container.addChild(note.sprite);
							this.tweeningNotes.push(note);
						}
					}
				}
				var visibleTweeningNotes = [];
				var min = this.roundedTime - this.tolerance;

				var speed = event.delta/1000*this.pixelsPerSecond;

				for (var k = this.tweeningNotes.length - 1; k >= 0; k--) {
					note = this.tweeningNotes[k];
					note.update(speed);
					//check state
					if(note.noteByTime.correct) {
						if(note.state !== DanceGameButton.STATE_CORRECT) {
							note.setState(DanceGameButton.STATE_CORRECT);
							this.increaseScore();
						}
					} else {
						if(note.time < min) {
							if(note.state !== DanceGameButton.STATE_WRONG) {
								note.setState(DanceGameButton.STATE_WRONG);
								this.decreaseScore();
							}
						}
					}
					if(note.sprite.y > -100) {
						visibleTweeningNotes.push(note);
					} else {
						note.sprite.parent.removeChild(note.sprite);
					}
				}
				this.tweeningNotes = visibleTweeningNotes;
			}
			this.scoreBar.update();
		}
		this.stage.update();
	};

	SpacebrewDanceGame.prototype.increaseScore = function() {
		this.setScore(this.score + 0.1);
	};

	SpacebrewDanceGame.prototype.decreaseScore = function() {
		this.setScore(this.score - 0.1);
	};

	SpacebrewDanceGame.prototype.setScore = function(value) {
		value = Math.min(1, Math.max(0, value));
		if(value !== this.score) {
			this.score = value;
			if(this.scoreBar) {
				this.scoreBar.setScore(this.score);
			}
		}
	};

	SpacebrewDanceGame.prototype.keydownHandler = function(event) {
		switch(event.keyCode) {
			case 90: //z - blue up
				return this.handleButton('blue-up', true);
			case 83: //s - blue down
				return this.handleButton('blue-down', true);
			case 81: //q - blue left
				return this.handleButton('blue-left', true);
			case 79: //o - orange up
				return this.handleButton('orange-up', true);
			case 76: //l - orange down
				return this.handleButton('orange-down', true);
			case 77: //m - orange right
				return this.handleButton('orange-right', true);
		}
	};

	SpacebrewDanceGame.prototype.keyupHandler = function(event) {
		switch(event.keyCode) {
			case 90: //z - blue up
				return this.handleButton('blue-up', false);
			case 83: //s - blue down
				return this.handleButton('blue-down', false);
			case 81: //q - blue left
				return this.handleButton('blue-left', false);
			case 79: //o - orange up
				return this.handleButton('orange-up', false);
			case 76: //l - orange down
				return this.handleButton('orange-down', false);
			case 77: //m - orange right
				return this.handleButton('orange-right', false);
		}
	};

	SpacebrewDanceGame.prototype.handleButton = function(name, isDown) {
		var index = this.pressedButtons.indexOf(name);
		if(isDown) {
			if(index === -1) {
				this.pressedButtons.push(name);
				if(this.record) {
					if(!this.recordedKeys[this.roundedTime]) {
						this.recordedKeys[this.roundedTime] = [];
					}
					this.recordedKeys[this.roundedTime].push({name: name});
				}
				//is it on the right time?
				var min = this.round(this.roundedTime - this.tolerance, 1);
				var max = this.round(this.roundedTime + this.tolerance, 1);
				for(var i = min; i < max; i+= 0.1) {
					var note = this.getNoteByTimeAndName(i, name);
					if(note) {
						this.handleCorrectButtonPress(i, name);
						break;
					}
				}
			}
		} else {
			if(index !== -1) {
				this.pressedButtons.splice(index, 1);
			}
		}
	};

	SpacebrewDanceGame.prototype.getNoteByTimeAndName = function(time, name) {
		time = this.round(time, 1);
		if(this.notesByTime[time]) {
			for (var i = this.notesByTime[time].length - 1; i >= 0; i--) {
				if(this.notesByTime[time][i].name === name) {
					return this.notesByTime[time][i];
				}
			}
		}
		return false;
	};

	SpacebrewDanceGame.prototype.handleCorrectButtonPress = function(time, name) {
		//flag it as correct
		var note = this.getNoteByTimeAndName(time, name);
		note.correct = true;
	};

	SpacebrewDanceGame.prototype.resizeHandler = function() {
		//resize the canvas
		var w = this.canvas.width = window.innerWidth;
		var h = this.canvas.height = window.innerHeight;

		var hc = w / 2;
		var vc = h / 2;

		this.pixelsPerSecond = this.speed * this.fps;
		this.timeToReachTarget = this.round(vc / this.pixelsPerSecond, 1);

		if(this.loader.loaded) {
			this.transparentBlueLeftButton.sprite.y = this.transparentBlueUpButton.sprite.y = this.transparentBlueDownButton.sprite.y = this.transparentOrangeRightButton.sprite.y = this.transparentOrangeUpButton.sprite.y = this.transparentOrangeDownButton.sprite.y = vc;

			this.transparentBlueLeftButton.sprite.x = this.blueLeftContainer.x = hc - 500;
			this.transparentBlueUpButton.sprite.x = this.blueUpContainer.x = hc - 350;
			this.transparentBlueDownButton.sprite.x = this.blueDownContainer.x = hc - 200;

			this.transparentOrangeDownButton.sprite.x = this.orangeDownContainer.x = hc + 200;
			this.transparentOrangeUpButton.sprite.x = this.orangeUpContainer.x = hc + 350;
			this.transparentOrangeRightButton.sprite.x = this.orangeRightContainer.x = hc + 500;

			this.scoreBar.display.x = hc - 261;
			this.scoreBar.display.y = 100;
		}
	};

	return SpacebrewDanceGame;

})();