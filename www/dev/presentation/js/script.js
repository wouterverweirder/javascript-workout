(function(){

	var KEYCODE_LEFT = 37;
	var KEYCODE_RIGHT = 39;

	var _currentSlideIndex;
	var _socket;

	$("#login").on('submit', function(event){
		event.preventDefault();
		$.post('/login', {
			email: $('[name=email]').val(),
			password: $('[name=password]').val()
		}).done(function(result){
			connectSocket(result.token);
		});
	});

	$(window).on('keydown', keydownHandler);

	function connectSocket(token) {
		_socket = io.connect('/', {
			query: 'token=' + token
		});
		_socket.on('connect', function(){
			console.log('connected');
		});
		_socket.on('currentSlideIndexChanged', currentSlideIndexChangedHandler);
	}

	function currentSlideIndexChangedHandler(currentSlideIndex, currentSlide) {
		console.log('currentSlideIndexChanged', currentSlideIndex, currentSlide);
		_currentSlideIndex = parseInt(currentSlideIndex);
	}

	function keydownHandler(event) {
		switch(event.keyCode) {
			case KEYCODE_LEFT:
				tryToSend("setCurrentSlideIndex", _currentSlideIndex - 1);
				break;
			case KEYCODE_RIGHT:
				tryToSend("setCurrentSlideIndex", _currentSlideIndex + 1);
				break;
		}
	}

	function tryToSend() {
		if(_socket) {
			_socket.emit.apply(_socket, arguments);
		}
	}

})();