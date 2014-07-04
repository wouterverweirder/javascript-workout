var config = require('./config'),
	events = require('events'),
	util = require('util'),
	express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	path = require('path');

function Server() {
	events.EventEmitter.call(this);
	console.log("Server constructor");
	server.listen(config.port);
	console.log("Listening on", config.ip + ':' + config.port);
	app.use(express.static(path.join(__dirname, '..', 'www', 'live')));
	app.get('/', function(req, res){
		res.redirect('/mobile/index.html');
	});
	io.sockets.on('connection', this.onSocketConnection.bind(this));

	//test polar
	var PolarH7 = require('./sensors/polarh7');
	var polarh7 = new PolarH7();
	polarh7.on('heartRate', function(heartRate){
		console.log(heartRate);
		io.sockets.emit('heartRate', heartRate);
	});
}

util.inherits(Server, events.EventEmitter);

Server.prototype.onSocketConnection = function(socket) {
	console.log('[Server] onSocketConnection');
};

module.exports = Server;