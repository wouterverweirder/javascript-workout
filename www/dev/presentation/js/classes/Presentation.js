module.exports = (function(){
	var Class = require('core/Class');

	var KEYCODE_LEFT = 37;
	var KEYCODE_RIGHT = 39;

	var Presentation = Class.extend({
		currentSlideIndex: 0,
		socket: false,
		init: function() {
			console.log("[Presentation] init");

			$("#login").on('submit', $.proxy(this.loginSubmitHandler, this));
			$(window).on('keydown', $.proxy(this.keydownHandler, this));
		},
		
		loginSubmitHandler: function(event) {
			event.preventDefault();
			var that = this;
			$.post('/login', {
				email: $('[name=email]').val(),
				password: $('[name=password]').val()
			}).done(function(result){
				that.connectSocket(result.token);
			});
		},

		connectSocket: function(token) {
			this.socket = io.connect('/', {
				query: 'token=' + token
			});
			this.socket.on('connect', function(){
				console.log('connected');
			});
			this.socket.on('currentSlideIndexChanged', $.proxy(this.currentSlideIndexChangedHandler, this));
		},

		currentSlideIndexChangedHandler: function(currentSlideIndex, currentSlide) {
			console.log('currentSlideIndexChanged', currentSlideIndex, currentSlide);
			this.currentSlideIndex = parseInt(currentSlideIndex);
		},

		keydownHandler: function(event) {
			switch(event.keyCode) {
				case KEYCODE_LEFT:
					this.tryToSend("setCurrentSlideIndex", this.currentSlideIndex - 1);
					break;
				case KEYCODE_RIGHT:
					this.tryToSend("setCurrentSlideIndex", this.currentSlideIndex + 1);
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