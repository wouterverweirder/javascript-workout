var Config = require('../config'),
	events = require('events'),
	fs = require('fs'),
	process = require('child_process'),
	util = require('util');

function JohnnyFiveApp() {
	events.EventEmitter.call(this);
	console.log("[JohnnyFiveApp] constructor");
}

util.inherits(JohnnyFiveApp, events.EventEmitter);

JohnnyFiveApp.getInstance = function() {
	if(!JohnnyFiveApp.instance) {
		JohnnyFiveApp.instance = new JohnnyFiveApp();
	}
	return JohnnyFiveApp.instance;
};

JohnnyFiveApp.prototype.runCode = function(code) {
	console.log("[JohnnyFiveApp] runCode");
	//stop current instance
	if(this.runner) {
		this.runner.stdin.end();
		this.runner.kill();
		console.log("[JohnnyFiveApp] kill() executed");
		this.runner = false;
		setTimeout(this.runCode.bind(this, code), 500);
	} else {
		//write code to file
		fs.writeFile(Config.johnnyFiveEditorFilePath, code, function(err) {
		    if(err) {
		        console.log(err);
		    } else {
		        console.log("The file was saved!");
		    }
		}); 

		//run the code
		this.runner = process.spawn("node", [Config.johnnyFiveEditorFilePath]);
		this.runner.on('disconnect', this.onDisconnect.bind(this));
		this.runner.on('close', this.onClose.bind(this));
	}
};

JohnnyFiveApp.prototype.onDisconnect = function() {
	console.log('[JohnnyFiveApp] runner disconnected');
	this.runner = false;
};

JohnnyFiveApp.prototype.onClose = function() {
	console.log('[JohnnyFiveApp] runner closed');
	this.runner = false;
};

module.exports = JohnnyFiveApp;