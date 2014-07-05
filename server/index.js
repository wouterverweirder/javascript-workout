var config = require('./config'),
	events = require('events'),
	util = require('util'),
	express = require('express'),
	bodyParser = require('body-parser'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	path = require('path'),
	jwt = require('jsonwebtoken'),
	socketioJwt = require('socketio-jwt');

var jwtSecret = "JdklmazeXHkdlsfdezaiHJK67hdf87";

function Server() {
	events.EventEmitter.call(this);
	console.log("Server constructor");
	server.listen(config.port);
	console.log("Listening on", config.ip + ':' + config.port);

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));

	app.use(express.static(path.join(__dirname, '..', 'www', 'live')));

	app.post('/login', function(req, res){
		console.log(req.body.email, req.body.password);
		var profile = {
			email: 'wouter.verweirder@gmail.com',
			role: 'presenter'
		};
		var token = jwt.sign(profile, jwtSecret, {expiresInMinutes: 60*5});
		res.json({token: token});
	});

	app.get('/', function(req, res){
		if(req.ip === "127.0.0.1" || req.ip === config.ip) {
			res.redirect('/presentation/index.html');
		} else {
			res.redirect('/mobile/index.html');
		}
	});

	io.use(socketioJwt.authorize({
		secret: jwtSecret,
		handshake: true
	}));
	io.sockets.on('connection', this.onSocketConnection.bind(this));

	//test polar
	/*
	var PolarH7 = require('./sensors/polarh7');
	var polarh7 = new PolarH7();
	polarh7.on('heartRate', function(heartRate){
		console.log(heartRate);
		io.sockets.emit('heartRate', heartRate);
	});
	*/
}

util.inherits(Server, events.EventEmitter);

Server.prototype.onSocketConnection = function(socket) {
	console.log('[Server] onSocketConnection');
	console.log(socket.decoded_token.role, 'connected');
};

module.exports = Server;