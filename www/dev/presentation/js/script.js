(function(){

	var socket = io('/');
	socket.on('connect', function(){
		console.log('connected');
	});
	socket.on('heartRate', function(heartRate){
		console.log(heartRate);
	});

})();