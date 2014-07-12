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
	socketioJwt = require('socketio-jwt'),
	AppModel = require('./model/AppModel'),
	SlideHandlerFactory = require('./slidehandlers/SlideHandlerFactory'),
	ClientHandlerFactory = require('./clienthandlers/ClientHandlerFactory'),
	Constants = require('../shared/Constants');

var jwtSecret = "JdklmazeXHkdlsfdezaiHJK67hdf87";
var appModel = AppModel.getInstance();

function Server() {
	events.EventEmitter.call(this);
	console.log("[Server] constructor");
	this.clientHandlers = [];
	this._currentSlideIndexChangedHandler = this.currentSlideIndexChangedHandler.bind(this);
	appModel.on(AppModel.CURRENT_SLIDE_INDEX_CHANGED, this._currentSlideIndexChangedHandler);
	server.listen(config.port);
	console.log("[Server] Listening on", config.ip + ':' + config.port);

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));

	app.use(express.static(path.join(__dirname, '..', 'www', 'live')));

	app.post('/login', function(req, res){
		if(req.body.email === 'wouter.verweirder@gmail.com' && req.body.password === 'geheim') {
			var profile = {
				email: 'wouter.verweirder@gmail.com',
				role: 'presentation'
			};
			var token = jwt.sign(profile, jwtSecret, {expiresInMinutes: 60*5});
			res.json({token: token, slides: appModel.slides});
		} else {
			var token = jwt.sign({}, jwtSecret, {expiresInMinutes: 60*5});
			res.json({token: token, slides: appModel.slides});
		}
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

	io.on('connection', this.onConnection.bind(this));
	this.currentSlideIndexChangedHandler(appModel.getCurrentSlideIndex(), appModel.slides[appModel.getCurrentSlideIndex()]);

	appModel.setMaxListeners(0);
	/*
	setInterval(function(){
		console.log(events.EventEmitter.listenerCount(appModel, AppModel.CURRENT_SLIDE_INDEX_CHANGED));
	}, 1000);
	*/
}

util.inherits(Server, events.EventEmitter);

Server.prototype.currentSlideIndexChangedHandler = function(slideIndex, slide) {
	console.log('[Server] currentSlideIndexChangedHandler', slideIndex, slide);
	if(this.currentSlideHandler) {
		this.currentSlideHandler.dispose();
	}
	this.currentSlideHandler = SlideHandlerFactory.createSlideHandler(slide);
	var numClientHandlers = this.clientHandlers.length;
	for(var i = 0; i < numClientHandlers; i++) {
		this.currentSlideHandler.addClientHandler(this.clientHandlers[i], true);
	}
	this.currentSlideHandler.onInitializationComplete();
};

Server.prototype.onConnection = function(socket) {
	var clientHandler = ClientHandlerFactory.createClientHandler(socket);
	
	this.clientHandlers.push(clientHandler);
	if(this.currentSlideHandler) {
		this.currentSlideHandler.addClientHandler(clientHandler);
	}

	clientHandler.on('disconnect', this.onDisconnect.bind(this, clientHandler));
};

Server.prototype.onDisconnect = function(clientHandler) {
	var index = this.clientHandlers.indexOf(clientHandler);
	if(index > -1) {
		this.clientHandlers.splice(index, 1);
	}
	if(this.currentSlideHandler) {
		this.currentSlideHandler.removeClientHandler(clientHandler);
	}
	clientHandler.removeAllListeners();
	clientHandler.dispose();
};

module.exports = Server;