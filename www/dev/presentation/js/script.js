(function(){

	$("#login").on('submit', function(event){
		event.preventDefault();
		$.post('/login', {
			email: $('[name=email]').val(),
			password: $('[name=password]').val()
		}).done(function(result){
			connectSocket(result.token);
		});
	});

	function connectSocket(token) {
		var socket = io.connect('/', {
			query: 'token=' + token
		});
		socket.on('connect', function(){
			console.log('connected');
		});
		socket.on('heartRate', function(heartRate){
			console.log(heartRate);
		});
	}

})();