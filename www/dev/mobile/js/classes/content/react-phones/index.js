module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	var ReactPhones = ContentBase.extend({
		totalReactionSpeed: 0,
		numReactionSpeeds: 0,
		numCorrectAnswers: 1,
		averageReactionSpeed: 9999999,
		visiblePosition: 0,
		targetPosition: 0,
		lastAnswerTime: new Date(),
		positions: [],
		init: function() {
			this._super();
			console.log('[Mobile] react phones init');

			this.$game = $('#game');
			this.$slidesContainer = $('.react-phones-slides-container');
			this.$slide1 = $('.react-phones-slide-1');
			this.$slide1text = $('.react-phones-slide-1 .react-phones-slide-text');
			this.$slide2 = $('.react-phones-slide-2');
			this.$slide2text = $('.react-phones-slide-2 .react-phones-slide-text');

			this.socket = io.connect('/', {
				query: 'token=' + this.token + "&slide=react-phones"
			});

			this._socketConnectHandler = $.proxy(this.socketConnectHandler, this);
			this._socketDisconnectHandler = $.proxy(this.socketDisconnectHandler, this);
			this._setSubstateHandler = $.proxy(this.setSubstateHandler, this);

			this.socket.on('connect', this._socketConnectHandler);
			this.socket.on('disconnect', this._socketDisconnectHandler);
			this.socket.on(Constants.SET_SUBSTATE, this._setSubstateHandler);
			this.socket.on(Constants.BLINK, $.proxy(this.triggerEventOnParent, this, Constants.BLINK));

			$('.touch .touchbutton').on('touchstart', $.proxy(this.onButtonTouchStart, this));
			$('.touch .touchbutton').on('touchend', $.proxy(this.onButtonTouchEnd, this));

			$('.no-touch .touchbutton').on('mousedown', $.proxy(this.onButtonTouchStart, this));
			$('.no-touch .touchbutton').on('mouseup', $.proxy(this.onButtonTouchEnd, this));

			this.resetGame();
		},

		onButtonTouchStart: function(e) {
			$(e.currentTarget).addClass('down');
			this.selectAnswer($(e.currentTarget).text());
		},

		onButtonTouchEnd: function(e) {
			$(e.currentTarget).removeClass('down');
		},

		selectAnswer: function(answer) {
			var now = new Date();
			var time = now.getTime() - this.lastAnswerTime.getTime();
			this.totalReactionSpeed += time;
			if(answer.toLowerCase() === this.positions[this.targetPosition].colorString.toLowerCase()) {
				//correct answer
				this.numCorrectAnswers++;
			} else {
				//penalty time
				this.totalReactionSpeed += 1000;
			}
			this.numReactionSpeeds++;
			this.lastAnswerTime = now;
			this.targetPosition++;
			this.fillPositionsWhenNeeded();
			//send to server
			this.socket.emit(Constants.UPDATE_REACTION_SPEED, this.totalReactionSpeed / this.numCorrectAnswers);
		},

		onStateChanged: function() {
			if(this.state === Constants.STATE_ACTIVE) {
				this.resetGame();
			}
		},

		resetGame: function() {
			this.lastAnswerTime = new Date();
			this.totalReactionSpeed = 0;
			this.numReactionSpeeds = 0;
			this.numCorrectAnswers = 1;
			this.averageReactionSpeed = 9999999;
			this.visiblePosition = 0;
			this.targetPosition = 0;
			this.positions = [];
			this.fillPositionsWhenNeeded();
		},

		fillPositionsWhenNeeded: function() {
			var numPositionsToAdd = this.numReactionSpeeds + 2 - this.positions.length;
			for(var i = 0; i < numPositionsToAdd; i++) {
				var position = {
					colorString: (Math.random() > 0.5) ? 'red' : 'blue',
					bgcolor: (Math.random() > 0.5) ? '#c6363d' : '#0684AF'
				};
				if(position.colorString === 'red') {
					position.color = '#c6363d';
				} else {
					position.color = '#0684AF';
				}
				this.positions.push(position);
			}
		},

		socketConnectHandler: function() {
		},

		socketDisconnectHandler: function() {
		},

		setSubstateHandler: function(substate) {
			if(this.substate !== substate) {
				this.substate = substate;
				this.showCurrentState();
			}
		},

		drawLoop: function() {
			this.visiblePosition += (this.targetPosition - this.visiblePosition) * 0.1;
			if(this.visiblePosition % 1 > 0.995) {
				this.visiblePosition = Math.round(this.visiblePosition);
			}
			this.$slidesContainer.css('left', this.visiblePosition * -100 + '%');

			var flooredVisiblePosition = Math.floor(this.visiblePosition);
			if(flooredVisiblePosition % 2 === 0) {
				this.$slide1.css({
					'left' : flooredVisiblePosition * 100 + '%',
					'background-color' : this.positions[flooredVisiblePosition].bgcolor
				});
				this.$slide2.css({
					'left' : flooredVisiblePosition * 100 + 100 + '%',
					'background-color' : this.positions[flooredVisiblePosition+1].bgcolor
				});

				this.$slide1text.text(this.positions[flooredVisiblePosition].colorString);
				this.$slide2text.text(this.positions[flooredVisiblePosition+1].colorString);
			} else {
				this.$slide2.css({
					'left' : flooredVisiblePosition * 100 + '%',
					'background-color' : this.positions[flooredVisiblePosition].bgcolor
				});
				this.$slide1.css({
					'left' : flooredVisiblePosition * 100 + 100 + '%',
					'background-color' : this.positions[flooredVisiblePosition+1].bgcolor
				});

				this.$slide2text.text(this.positions[flooredVisiblePosition].colorString);
				this.$slide1text.text(this.positions[flooredVisiblePosition+1].colorString);
			}
		},

		showCurrentState: function() {
			$('.substate').removeClass('active');
			this.$game.css({
				'z-index': -1,
				'opacity': 0.3
			});
			if(this.substate === Constants.REACT_PHONES_GAME) {
				$('.substate-game').addClass('active');
				this.$game.css({
					'z-index': 10,
					'opacity': 1
				});
			} else if(this.substate === Constants.REACT_PHONES_FINISHED) {
				$('.substate-finished').addClass('active');
			} else {
				$('.substate-intro').addClass('active');
			}
		}
	});

	return ReactPhones;

})();