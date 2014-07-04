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
}

util.inherits(Server, events.EventEmitter);

module.exports = Server;