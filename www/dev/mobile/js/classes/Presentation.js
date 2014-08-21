module.exports = (function(){
	var Class = require('core/Class');
	var Slide = require('./Slide');
	var Constants = require('Constants');

	var Presentation = Class.extend({
		currentSlideIndex: 0,
		socket: false,
		iframes: [],
		numIframes: 3,
		slides: [],
		$overlay: false,
		init: function() {
			console.log("[Presentation] init");

			this.createIframes();
			this.login();
			this.$overlay = $('#overlay');
			$('body').on(Constants.BLINK, $.proxy(this.blinkHandler, this));
		},

		createIframes: function() {
			for(var i = 0; i < this.numIframes; i++) {
				var $iframe = $('<iframe class="slide-frame" />');
				this.iframes.push($iframe);
				$('#presentation').append($iframe);
			}
		},

		login: function() {
			var that = this;
			$.post('/login', {
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
			this.socket.on(Constants.BLINK, $.proxy(this.blinkHandler, this, {}));
		},

		socketConnectHandler: function() {
		},

		socketDisconnectHandler: function() {
		},

		blinkHandler: function(event, text, backgroundColor) {
			console.log(text, backgroundColor);
			if(text instanceof Array && text.length > 1) {
				console.log('split it');
				backgroundColor = text[1];
				text = text[0];
			}
			console.log(text, backgroundColor);
			//overlay important, blinking text
			this.$overlay.find('.content').html(text);
			this.$overlay.addClass('active');
			if(this.blinkInterval) {
				clearInterval(this.blinkInterval);
			}
			this.blinkInterval = setInterval($.proxy(this.blinkToggle, this, backgroundColor), 500);
		},

		blinkToggle: function(backgroundColor) {
			this.$overlay.toggleClass('blink-on');
			if(this.$overlay.hasClass('blink-on')) {
				this.$overlay.css('background-color', backgroundColor);
			} else {
				this.$overlay.css('background-color', false);
			}
		},

		currentSlideIndexChangedHandler: function(currentSlideIndex) {
			this.$overlay.removeClass('active');
			if(this.blinkInterval) {
				clearInterval(this.blinkInterval);
			}
			currentSlideIndex = parseInt(currentSlideIndex);
			this.currentSlideIndex = currentSlideIndex;
			var currentSlide = this.getSlideByIndex(currentSlideIndex);
			var previousSlide = this.getSlideByIndex(currentSlideIndex - 1);
			var nextSlide = this.getSlideByIndex(currentSlideIndex + 1);
			//
			var currentIframe = this.getIframeForSlide(currentSlide, [previousSlide, nextSlide]);
			if(currentIframe) {
				if(currentSlide.data.mobile && currentSlide.data.mobile.url) {
					currentSlide.attachToIframe(currentIframe, currentSlide.data.mobile.url);
				} else {
					currentSlide.attachToIframe(currentIframe, "slides/" + currentSlide.name + '.html?token=' + this.token);
				}
				currentSlide.setState(Constants.STATE_ACTIVE);
				$(currentIframe).css('left', 0);
			}
			var previousIframe = this.getIframeForSlide(previousSlide, [currentSlide, nextSlide]);
			if(previousIframe) {
				if(previousSlide.data.mobile && previousSlide.data.mobile.url) {
					previousSlide.attachToIframe(previousIframe, previousSlide.data.mobile.url);
				} else {
					previousSlide.attachToIframe(previousIframe, "slides/" + previousSlide.name + '.html?token=' + this.token);
				}
				previousSlide.setState(Constants.STATE_INACTIVE);
				$(previousIframe).css('left', '-100%');
			}
			var nextIframe = this.getIframeForSlide(nextSlide, [previousSlide, currentSlide]);
			if(nextIframe) {
				if(nextSlide.data.mobile && nextSlide.data.mobile.url) {
					nextSlide.attachToIframe(nextIframe, nextSlide.data.mobile.url);
				} else {
					nextSlide.attachToIframe(nextIframe, "slides/" + nextSlide.name + '.html?token=' + this.token);
				}
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
		}
	});

	return Presentation;

})();