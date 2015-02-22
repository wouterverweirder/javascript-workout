module.exports = (function(){

	var PresentationBase = require('shared/Presentation');

	var Constants = require('Constants');
	var Config = require('./config');
	var PolarH7 = require('./sensors/PolarH7');
	var ChildApp = require('./childapps/ChildApp');
	var MobileServerBridge = require('./MobileServerBridge');

	var Twit = requireNode('twit');

	var KEYCODE_LEFT = 37;
	var KEYCODE_RIGHT = 39;

	function Presentation(data, role, settings) {
		if(settings) {
			for(var key in settings) {
				Config[key] = settings[key];
			}
		}
		PresentationBase.call(this, data, 'presentation');

		this.elevatorMusicPlaying = false;
		this.elevatorMusic = false;

		this.polarH7 = new PolarH7();
		this.polarH7.on(PolarH7.HEART_RATE, this.heartRatePolarHandler.bind(this));

		this.twit = new Twit({
			consumer_key:         Config.twitterConsumerKey,
			consumer_secret:      Config.twitterConsumerSecret,
			access_token: 				Config.twitterAccessToken,
			access_token_secret: 	Config.twitterAccessTokenSecret
		});
		this.tweets = [];
		this.stream = this.twit.stream('statuses/filter', { track: '@wouter' });
		this.stream.on('error', function(e){
			console.log('[Twit] Error', e.code);
		});
		this.stream.on('tweet', this.onTweet.bind(this));

		$('#consoleModal').on('show.bs.modal', function (e) {
			var w = $('#consoleModal iframe')[0].contentWindow;
			w.postMessage('consoleModalOpen', 'http://localhost:3000');
		});

		this.elevatorMusic = $('#elevatormusic')[0];
		$('.elevator-button').on('click', $.proxy(this.toggleElevatorMusic, this));

		$('.info .ip').text('jsworkout.herokuapp.com');

		$(window).on('keydown', $.proxy(this.keydownHandler, this));

		$('body').on(Constants.GO_TO_PREVIOUS_SLIDE, $.proxy(this.goToPreviousSlide, this));
		$('body').on(Constants.GO_TO_NEXT_SLIDE, $.proxy(this.goToNextSlide, this));
		$('body').on(Constants.OPEN_COMMAND_LINE, $.proxy(this.openCommandLine, this));
		$('body').on(Constants.OPEN_CAMERA, $.proxy(this.openCamera, this));
	}

	Presentation.prototype = Object.create(PresentationBase.prototype);

	Presentation.prototype.onTweet = function(origTweet) {
		var tweet = {
			user: origTweet.user.screen_name,
			name: origTweet.user.name,
			image: origTweet.user.profile_image_url,
			text: origTweet.text
		};
		this.tweets.push(tweet);
	};

	Presentation.prototype.createMobileServerBridge = function() {
		return new MobileServerBridge(this, Config.mobileServerUrl);
	};

	Presentation.prototype.toggleElevatorMusic = function() {
		this.elevatorMusicPlaying = !this.elevatorMusicPlaying;
		if(this.elevatorMusicPlaying) {
			this.elevatorMusic.play();
		} else {
			this.elevatorMusic.pause();
		}
	};

	Presentation.prototype.createIFrameBridges = function(data) {
		PresentationBase.prototype.createIFrameBridges.call(this, data);
		var that = this;
		var $slideMenu = $('#slideMenu');
		var numIFrameBridges = this.iFrameBridges.length;
		for(var i = 0; i < numIFrameBridges; i++) {
			var iFrameBridge = this.iFrameBridges[i];
			$slideMenu.append('<li><a href="#" data-slidenr="' + i + '">' + (i + 1) + ' ' + iFrameBridge.name + '</a></li>');
		}
		$slideMenu.find('a').on('click', function(event){
			event.preventDefault();
			that.setCurrentSlideIndex(parseInt($(this).data('slidenr')));
		});
	};

	Presentation.prototype.iFrameMessageHandler = function(event) {
		PresentationBase.prototype.iFrameMessageHandler.call(this, event);
		if(!event.data) {
			return;
		}
		switch(event.data.action) {
			case Constants.GO_TO_PREVIOUS_SLIDE:
				this.goToPreviousSlide();
				break;
			case Constants.GO_TO_NEXT_SLIDE:
				this.goToNextSlide();
				break;
			case Constants.OPEN_COMMAND_LINE:
				this.openCommandLine();
				break;
			case Constants.OPEN_CAMERA:
				this.openCamera();
				break;
			case Constants.GET_ALL_TWEETS:
				var currentIFrameBridge = this.getIFrameBridgeByIndex(this.currentSlideIndex);
				if(currentIFrameBridge) {
					currentIFrameBridge.tryToPostMessage({
						action: Constants.GET_ALL_TWEETS_RESULT,
						tweets: this.tweets
					});
				}
				break;
			case Constants.CHILD_APP_SAVE_CODE:
				ChildApp.getInstance().saveCode(event.data.code, event.data.type);
				break;
			case Constants.CHILD_APP_RUN_CODE:
				ChildApp.getInstance().runCode(event.data.code, event.data.type);
				break;
		}
	};

	Presentation.prototype.heartRatePolarHandler = function(heartRate) {
		$('#global-heart-rate').text(heartRate + ' bpm');
		var currentIFrameBridge = this.getIFrameBridgeByIndex(this.currentSlideIndex);
		if(currentIFrameBridge) {
			currentIFrameBridge.tryToPostMessage({
				action: Constants.HEART_RATE_POLAR,
				heartRate: heartRate
			});
		}
	};

	Presentation.prototype.keydownHandler = function(event) {
		switch(event.keyCode) {
			case KEYCODE_LEFT:
				this.goToPreviousSlide();
				break;
			case KEYCODE_RIGHT:
				this.goToNextSlide();
				break;
		}
	};

	Presentation.prototype.openCommandLine = function() {
		$('#consoleModal').modal('show');
	};

	Presentation.prototype.openCamera = function() {
		$('#webcamModal').modal('show');
	};

	return Presentation;

})();