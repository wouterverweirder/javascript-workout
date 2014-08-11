var Config = require('../config'),
	events = require('events'),
	fs = require('fs'),
	process = require('child_process'),
	util = require('util');

function ChildApp() {
	events.EventEmitter.call(this);
	console.log("[ChildApp] constructor");
}

util.inherits(ChildApp, events.EventEmitter);

ChildApp.getInstance = function() {
	if(!ChildApp.instance) {
		ChildApp.instance = new ChildApp();
	}
	return ChildApp.instance;
};

ChildApp.prototype.runCode = function(code) {
	console.log("[ChildApp] runCode");
	//stop current instance
	if(this.runner) {
		this.stop();
		console.log("[ChildApp] kill() executed");
		setTimeout(this.runCode.bind(this, code), 500);
	} else {
		//write code to file
		fs.writeFile(Config.childAppFilePath, code, function(err) {
		    if(err) {
		        console.log(err);
		    } else {
		        console.log("The file was saved!");
		    }
		}); 

		//run the code
		this.runner = process.spawn("node", [Config.childAppFilePath]);
		this.runner.stdout.on('data', this.onRunnerData.bind(this));
		this.runner.stderr.on('data', this.onRunnerData.bind(this));
		this.runner.on('disconnect', this.onDisconnect.bind(this));
		this.runner.on('close', this.onClose.bind(this));
	}
};

ChildApp.prototype.stop = function() {
	if(this.runner) {
		this.runner.stdout.removeAllListeners();
		this.runner.stderr.removeAllListeners();
		this.runner.stdin.end();
		this.runner.kill();
		this.runner = false;
	}
};

ChildApp.prototype.onRunnerData = function(data) {
	console.log(data.toString().trim());
};

ChildApp.prototype.onDisconnect = function() {
	console.log('[ChildApp] runner disconnected');
	this.runner = false;
};

ChildApp.prototype.onClose = function() {
	console.log('[ChildApp] runner closed');
	this.runner = false;
};

module.exports = ChildApp;