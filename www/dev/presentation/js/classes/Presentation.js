module.exports = (function(){
	var Class = require('core/Class');
	var Slide = require('./Slide');
	var Constants = require('Constants');

	var KEYCODE_LEFT = 37;
	var KEYCODE_RIGHT = 39;

	var Presentation = Class.extend({
		currentSlideIndex: 0,
		socket: false,
		iframes: [],
		numIframes: 3,
		slides: [],
		init: function() {
			console.log("[Presentation] init");

			this.createIframes();

			$("#login").on('submit', $.proxy(this.loginSubmitHandler, this));
			$(window).on('keydown', $.proxy(this.keydownHandler, this));
		},

		createIframes: function() {
			for(var i = 0; i < this.numIframes; i++) {
				var $iframe = $('<iframe class="slide-frame" />');
				this.iframes.push($iframe);
				$('#presentation').append($iframe);
			}
		},

		loginSubmitHandler: function(event) {
			event.preventDefault();
			var that = this;
			$.post('/login', {
				email: $('[name=email]').val(),
				password: $('[name=password]').val()
			}).done(function(result){
				that.slides = [];
				var numSlides = result.slides.length;
				for(var i = 0; i < numSlides; i++) {
					that.slides.push(new Slide(result.slides[i]));
				}
				that.connectSocket(result.token);
			});
		},

		connectSocket: function(token) {
			this.token = token;
			this.socket = io.connect('/', {
				query: 'token=' + token
			});
			this.socket.on('connect', $.proxy(this.socketConnectHandler, this));
			this.socket.on('disconnect', $.proxy(this.socketDisconnectHandler, this));
			this.socket.on('currentSlideIndexChanged', $.proxy(this.currentSlideIndexChangedHandler, this));
		},

		socketConnectHandler: function() {
			$('#login').hide();
		},

		socketDisconnectHandler: function() {
			$('#login').show();
		},

		currentSlideIndexChangedHandler: function(currentSlideIndex) {
			currentSlideIndex = parseInt(currentSlideIndex);
			this.currentSlideIndex = currentSlideIndex;
			var currentSlide = this.getSlideByIndex(currentSlideIndex);
			var previousSlide = this.getSlideByIndex(currentSlideIndex - 1);
			var nextSlide = this.getSlideByIndex(currentSlideIndex + 1);
			//
			var currentIframe = this.getIframeForSlide(currentSlide, [previousSlide, nextSlide]);
			if(currentIframe) {
				currentSlide.attachToIframe(currentIframe, "slides/" + currentSlide.name + '.html?token=' + this.token);
				currentSlide.setState(Constants.STATE_ACTIVE);
				$(currentIframe).css('left', 0);
			}
			var previousIframe = this.getIframeForSlide(previousSlide, [currentSlide, nextSlide]);
			if(previousIframe) {
				previousSlide.attachToIframe(previousIframe, "slides/" + previousSlide.name + '.html?token=' + this.token);
				previousSlide.setState(Constants.STATE_INACTIVE);
				$(previousIframe).css('left', '-100%');
			}
			var nextIframe = this.getIframeForSlide(nextSlide, [previousSlide, currentSlide]);
			if(nextIframe) {
				nextSlide.attachToIframe(nextIframe, "slides/" + nextSlide.name + '.html?token=' + this.token);
				nextSlide.setState(Constants.STATE_INACTIVE);
				$(nextIframe).css('left', '100%');
			}
		},

		getSlideByIndex: function(index) {
			if(index >= 0 && index < this.slides.length) {
				return this.slides[index];
			}
			return false;
		},

		getIframeForSlide: function(slide, slidesNotToClear) {
			if(slide) {
				var $iframe = $('iframe[name=' + slide.name + ']');
				if($iframe.length > 0) {
					return $iframe[0];
				}
				//get a free iframe
				var slideNamesNotToClear = [];
				$(slidesNotToClear).each(function(index, obj){
					slideNamesNotToClear.push(obj.name);
				});
				var $iframes = $('iframe.slide-frame');
				for (var i = $iframes.length - 1; i >= 0; i--) {
					$iframe = $($iframes[i]);
					var name = $iframe.attr('name');
					if(!name || slideNamesNotToClear.indexOf(name) === -1) {
						return $iframe[0];
					}
				}
			}
			return false;
		},

		keydownHandler: function(event) {
			switch(event.keyCode) {
				case KEYCODE_LEFT:
					this.tryToSend(Constants.SET_CURRENT_SLIDE_INDEX, this.currentSlideIndex - 1);
					break;
				case KEYCODE_RIGHT:
					this.tryToSend(Constants.SET_CURRENT_SLIDE_INDEX, this.currentSlideIndex + 1);
					break;
			}
		},

		tryToSend: function() {
			if(this.socket) {
				this.socket.emit.apply(this.socket, arguments);
			}
		}
	});

	return Presentation;

})();