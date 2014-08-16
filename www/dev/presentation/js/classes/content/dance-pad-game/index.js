module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');
	var DanceGameButton = require('./DanceGameButton');
	var ScoreBar = require('./ScoreBar');

	var DancePadGame = ContentBase.extend({

		tweeningNotes: [],
		notesByTime: {"11":[{"name":"blue-down"}],"29":[{"name":"blue-up"}],"30":[{"name":"blue-down"}],"47":[{"name":"blue-up"}],"48":[{"name":"blue-up"}],"57":[{"name":"orange-down"}],"58":[{"name":"orange-down"}],"85":[{"name":"orange-up"}],"95":[{"name":"orange-down"}],"104":[{"name":"blue-up"}],"106":[{"name":"blue-up"}],"114":[{"name":"blue-down"},{"name":"orange-down"}],"9.9":[{"name":"blue-up"}],"12.1":[{"name":"blue-up"}],"13.2":[{"name":"blue-down"}],"14.3":[{"name":"blue-up"}],"15.2":[{"name":"blue-down"}],"16.3":[{"name":"blue-left"}],"18.4":[{"name":"orange-up"}],"19.5":[{"name":"orange-down"}],"20.6":[{"name":"orange-up"}],"21.6":[{"name":"orange-down"}],"22.6":[{"name":"orange-up"}],"23.7":[{"name":"orange-down"}],"24.8":[{"name":"orange-right"}],"26.8":[{"name":"blue-up"}],"27.9":[{"name":"blue-down"}],"31.1":[{"name":"blue-up"}],"32.2":[{"name":"blue-down"}],"33.2":[{"name":"blue-left"}],"35.3":[{"name":"orange-up"}],"36.4":[{"name":"orange-down"}],"37.5":[{"name":"blue-up"}],"38.5":[{"name":"blue-down"}],"39.6":[{"name":"orange-up"}],"40.6":[{"name":"orange-down"}],"41.7":[{"name":"blue-up"}],"42.7":[{"name":"blue-down"}],"43.8":[{"name":"blue-up"}],"44.3":[{"name":"blue-down"}],"44.9":[{"name":"blue-up"}],"45.4":[{"name":"blue-down"}],"45.9":[{"name":"blue-up"}],"46.4":[{"name":"blue-down"}],"47.5":[{"name":"blue-down"}],"48.6":[{"name":"blue-down"}],"49.1":[{"name":"blue-up"}],"49.6":[{"name":"blue-down"}],"50.1":[{"name":"blue-left"}],"52.2":[{"name":"orange-up"}],"52.8":[{"name":"orange-down"}],"53.3":[{"name":"orange-up"}],"53.8":[{"name":"orange-down"}],"54.3":[{"name":"orange-up"}],"54.9":[{"name":"orange-down"}],"55.4":[{"name":"orange-up"}],"55.9":[{"name":"orange-down"}],"56.5":[{"name":"orange-up"}],"57.5":[{"name":"orange-up"}],"58.5":[{"name":"orange-right"}],"60.8":[{"name":"blue-up"}],"61.8":[{"name":"blue-down"}],"62.8":[{"name":"orange-up"}],"63.9":[{"name":"orange-down"}],"64.9":[{"name":"orange-right"}],"69.1":[{"name":"blue-up"}],"70.2":[{"name":"blue-down"}],"71.3":[{"name":"blue-up"}],"72.3":[{"name":"blue-down"}],"73.4":[{"name":"orange-up"}],"74.4":[{"name":"orange-down"}],"75.4":[{"name":"orange-up"}],"76.5":[{"name":"orange-down"}],"77.6":[{"name":"blue-up"}],"78.1":[{"name":"blue-down"}],"78.6":[{"name":"orange-up"}],"79.2":[{"name":"orange-down"}],"79.7":[{"name":"blue-up"}],"80.2":[{"name":"blue-down"}],"80.8":[{"name":"orange-up"}],"81.3":[{"name":"orange-down"}],"81.8":[{"name":"blue-up"}],"82.3":[{"name":"blue-down"}],"82.8":[{"name":"orange-up"}],"83.4":[{"name":"orange-down"}],"83.9":[{"name":"blue-up"}],"84.4":[{"name":"blue-down"}],"85.5":[{"name":"orange-down"}],"86.1":[{"name":"blue-up"}],"86.6":[{"name":"blue-down"}],"87.1":[{"name":"orange-up"}],"87.6":[{"name":"orange-down"}],"88.1":[{"name":"orange-right"}],"88.7":[{"name":"blue-left"}],"89.2":[{"name":"orange-right"}],"89.7":[{"name":"blue-left"}],"90.3":[{"name":"orange-right"}],"90.7":[{"name":"blue-left"}],"91.3":[{"name":"orange-right"}],"91.9":[{"name":"blue-left"}],"92.4":[{"name":"orange-up"}],"92.9":[{"name":"orange-down"}],"94.5":[{"name":"orange-up"}],"95.5":[{"name":"blue-up"}],"96.1":[{"name":"blue-down"}],"96.6":[{"name":"orange-up"}],"97.1":[{"name":"orange-down"}],"97.7":[{"name":"blue-up"}],"98.2":[{"name":"blue-down"}],"98.7":[{"name":"orange-right"}],"99.2":[{"name":"blue-left"}],"99.7":[{"name":"orange-right"}],"100.3":[{"name":"blue-left"}],"100.8":[{"name":"orange-up"}],"101.3":[{"name":"blue-down"}],"102.9":[{"name":"orange-up"}],"103.4":[{"name":"orange-down"}],"104.6":[{"name":"blue-down"}],"105.1":[{"name":"orange-up"}],"105.6":[{"name":"orange-down"}],"106.6":[{"name":"blue-down"}],"107.1":[{"name":"orange-up"}],"107.7":[{"name":"orange-down"}],"108.3":[{"name":"blue-up"}],"108.7":[{"name":"blue-down"}],"109.3":[{"name":"orange-right"}],"109.8":[{"name":"blue-left"}],"111.3":[{"name":"blue-left"}],"111.4":[{"name":"orange-right"}],"111.9":[{"name":"blue-left"},{"name":"orange-right"}],"112.4":[{"name":"blue-up"},{"name":"orange-up"}],"112.9":[{"name":"orange-up"},{"name":"blue-up"}],"113.5":[{"name":"blue-down"},{"name":"orange-down"}],"114.5":[{"name":"blue-up"},{"name":"orange-up"}],"115.1":[{"name":"orange-down"},{"name":"blue-down"}],"115.6":[{"name":"orange-up"},{"name":"blue-up"}],"116.1":[{"name":"blue-down"},{"name":"orange-down"}],"116.7":[{"name":"blue-left"},{"name":"orange-right"}],"117.2":[{"name":"blue-down"},{"name":"orange-down"},{"name":"blue-left"},{"name":"orange-right"}],"117.7":[{"name":"blue-up"},{"name":"orange-up"}],"118.2":[{"name":"blue-left"},{"name":"orange-right"},{"name":"blue-down"},{"name":"orange-down"}],"118.7":[{"name":"blue-left"},{"name":"blue-down"},{"name":"orange-down"},{"name":"orange-right"}],"119.4":[{"name":"blue-down"},{"name":"blue-left"}],"119.8":[{"name":"blue-up"}],"119.9":[{"name":"blue-left"},{"name":"orange-up"},{"name":"orange-right"}],"120.3":[{"name":"blue-up"}],"120.4":[{"name":"orange-up"},{"name":"orange-right"},{"name":"blue-left"}]},
		noteNameMap: {},
		pressedButtons: [],
		speed: 3,
		timeToReachTarget: 0,
		tolerance: 0.15,
		noteNames: [
			"blue-up",
			"blue-down",
			"blue-left",
			"orange-up",
			"orange-down",
			"orange-right"
		],
		score: 0,
		record: true,
		recordedKeys: {},
		audio: false,
		roundedTime: 0,
		init: function(name) {
			this._super(name);
			console.log("[DancePadGame] init");

			this.parseNotesByTime();

			this.audio = $('audio')[0];

			this._setSubstateHandler = $.proxy(this.setSubstateHandler, this);

			this.socket.on(Constants.SET_SUBSTATE, this._setSubstateHandler);

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
		},

		parseNotesByTime: function() {
			var notesByTime = {};
			for(var key in this.notesByTime) {
				notesByTime[parseFloat(key)] = this.notesByTime[key];
			}
			this.notesByTime = notesByTime;
			console.log(this.notesByTime);
		},

		loadCompleteHandler: function() {

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
		},

		//override setState, not to use drawLoop
		setState: function(state) {
			if(state !== this.state) {
				this.state = state;
				this.onStateChanged();
			}
		},

		setSubstateHandler: function(substate) {
			if(this.substate !== substate) {
				this.substate = substate;
				this.showCurrentState();
			}
		},

		map: function(value, istart, istop, ostart, ostop) {
    		return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
  		},

  		round: function(value, numDecimals) {
  			var factor = Math.pow(10, numDecimals);
  			return Math.round(value * factor) / factor;
  		},

		startClickHandler: function() {
			this.socket.emit(Constants.SET_SUBSTATE, Constants.DANCE_PAD_GAME_GAME);
		},

		stopClickHandler: function() {
			this.socket.emit(Constants.SET_SUBSTATE, Constants.DANCE_PAD_GAME_FINISHED);
			this.audio.pause();
			if(this.record) {
				console.log(this.recordedKeys);
			}
		},

		showCurrentState: function() {
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
		},

		resetGame: function() {
			for(var key in this.notesByTime) {
				for (var i = this.notesByTime[key].length - 1; i >= 0; i--) {
					this.notesByTime[key][i].correct = false;
					this.notesByTime[key][i].tweening = false;
				}
			}
			this.setScore(0.5);
		},

		onTick: function(event) {
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
		},

		increaseScore: function() {
			this.setScore(this.score + 0.1);
		},

		decreaseScore: function() {
			this.setScore(this.score - 0.1);
		},

		setScore: function(value) {
			value = Math.min(1, Math.max(0, value));
			if(value !== this.score) {
				this.score = value;
				if(this.scoreBar) {
					this.scoreBar.setScore(this.score);
				}
			}
		},

		keydownHandler: function(event) {
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
		},

		keyupHandler: function(event) {
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
		},

		handleButton: function(name, isDown) {
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
		},

		getNoteByTimeAndName: function(time, name) {
			time = this.round(time, 1);
			if(this.notesByTime[time]) {
				for (var i = this.notesByTime[time].length - 1; i >= 0; i--) {
					if(this.notesByTime[time][i].name === name) {
						return this.notesByTime[time][i];
					}
				}
			}
			return false;
		},

		handleCorrectButtonPress: function(time, name) {
			//flag it as correct
			var note = this.getNoteByTimeAndName(time, name);
			note.correct = true;
		},

		resizeHandler: function() {
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
		}
	});

	return DancePadGame;

})();