var path = require('path'),
	express = require('express'),
	bodyParser = require('body-parser'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	jwt = require('jsonwebtoken'),
	socketioJwt = require('socketio-jwt'),
	_ = require('lodash');

var port = process.env.PORT || 5000;
var jwtSecret = process.env.JWTSECRET || "JdklmazeXHkdlsfdezaiHJK67hdf87";
var username = process.env.USERNAME || "wouter.verweirder@gmail.com";
var password = process.env.PASSWORD || "geheim";

var data = require('./data.json');

var currentSlideIndex = -1;

server.listen(port);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(express.static(path.join(__dirname, 'server', 'www', 'live')));

app.get('/data.json', function(req, res){
	res.json(data);
});

app.post('/login', function(req, res){
	console.log('login post received');
	var token;
	if(req.body.email === username && req.body.password === password) {
		var profile = {
			email: username,
			role: 'presentation'
		};
		token = jwt.sign(profile, jwtSecret, {expiresInMinutes: 60*5});
		console.log('send presentation token');
	} else {
		token = jwt.sign({}, jwtSecret, {expiresInMinutes: 60*5});
		console.log('send mobile token');
	}
	res.json({token: token});
});

io.use(socketioJwt.authorize({
	secret: jwtSecret,
	handshake: true
}));

var rooms = {};

function ClientHandler(socket) {
	this.socket = socket;
	this.id = this.socket.id;
	this.role = (socket.decoded_token && socket.decoded_token.role === 'presentation') ? 'presentation' : 'mobile';
	this.rooms = {};
	this.join('role:' + this.role);
	if(this.role === 'presentation') {
		this.socket.on('message', this.presentationMessageHandler.bind(this));
	} else {
		this.socket.on('message', this.mobileMessageHandler.bind(this));
		//sent the current slide index
		if(currentSlideIndex > -1) {
			sendMessage({
				target: { client: this.id },
				content: {
					action: 'setCurrentSlideIndex',
					currentSlideIndex: currentSlideIndex
				}
			});
		}
	}
	socket.on('disconnect', this.disconnectHandler.bind(this));
	socket.on('joinSlideRoom', this.joinSlideRoomHandler.bind(this));
	socket.on('leaveSlideRoom', this.leaveSlideRoomHandler.bind(this));
}

ClientHandler.prototype.join = function(roomName) {
	if(!roomName) {
		return;
	}
	this.rooms[roomName] = true;
	rooms[roomName] = rooms[roomName] || {};
	rooms[roomName][this.id] = true;
	sendRoomListToPresentation(roomName);
};

ClientHandler.prototype.leave = function(roomName) {
	if(!roomName) {
		return;
	}
	delete this.rooms[roomName];
	rooms[roomName] = rooms[roomName] || {};
	delete rooms[roomName][this.id];
	sendRoomListToPresentation(roomName);
};

ClientHandler.prototype.presentationMessageHandler = function(message) {
	if(message.content && message.content.action === 'setCurrentSlideIndex') {
		currentSlideIndex = message.content.currentSlideIndex;
	}
	sendMessage(message);
};

ClientHandler.prototype.mobileMessageHandler = function(message) {
	//add sender id
	message.sender = {
		id: this.id
	};
	sendMessage(message);
};

ClientHandler.prototype.joinSlideRoomHandler = function(roomName) {
	if(roomName === 'role:presentation' || roomName === 'role:mobile') {
		return;
	}
	this.join(roomName);
};

ClientHandler.prototype.leaveSlideRoomHandler = function(roomName) {
	if(!roomName) {
		return;
	}
	this.leave(roomName);
};

ClientHandler.prototype.disconnectHandler = function() {
	var roomNames = Object.keys(this.rooms);
	roomNames.forEach(function(roomName, i){
		this.leave(roomName);
	}, this);
};

function sendMessage(message) {
	if(message.target) {
		var roomNames = [];
		var allowSend = true;
		if(message.target.slide) {
			roomNames.push(message.target.slide);
		}
		if(message.target.client) {
			if(message.target.client === 'all') {
				//no further filtering
			}else if(message.target.client === 'mobile' || message.target.client === 'presentation') {
				roomNames.push('role:' + message.target.client);
			} else {
				//one specific id
				sendMessageToIds([message.target.client], message);
				allowSend = false;
			}
			if(allowSend) {
				if(roomNames.length > 0) {
					sendMessageToIds(getClientHandlerIdsInRooms(roomNames), message);
				} else {
					io.sockets.emit('message', message);
				}
			}
		}
	}
}

function getClientHandlerIdsInRooms(roomNames) {
	if(!rooms[roomNames[0]]) {
		return [];
	}
	var ids = Object.keys(rooms[roomNames[0]]);
	var numRoomNames = roomNames.length;
	for(var i = 1; i < numRoomNames; i++) {
		if(!rooms[roomNames[i]]) {
			return [];
		}
		var roomIds = Object.keys(rooms[roomNames[i]]);
		ids = _.intersection(ids, roomIds);
	}
	return ids;
}

function sendMessageToIds(ids, message) {
	ids.forEach(function(id){
		io.to(id).emit('message', message);
	});
}

function sendRoomListToPresentation(roomName) {
	console.log('sendRoomListToPresentation: ' + roomName);
	rooms[roomName] = rooms[roomName] || {};
	var clientIdsInRoom = getClientHandlerIdsInRooms([roomName, 'role:mobile']);
	var target = { client: 'presentation' };
	if(roomName !== 'role:mobile' && roomName !== 'role:presentation') {
		target.slide = roomName;
	}
	sendMessage({
		target: target,
		content: {
			action: 'updateRoomList',
			ids: clientIdsInRoom
		}
	});
}

io.on('connection', function(socket){
	new ClientHandler(socket);
});