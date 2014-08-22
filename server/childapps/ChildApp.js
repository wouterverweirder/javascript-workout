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

ChildApp.prototype.saveCode = function(code, type) {
	var filePath = Config.childNodeAppFilePath;
	if(type === 'tessel') {
		filePath = Config.childTesselAppFilePath;
	}
	fs.writeFile(filePath, code, function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        console.log("[ChildApp] The file was saved!");
	    }
	});
};

ChildApp.prototype.runCode = function(code, type) {
	console.log("[ChildApp] runCode");
	//stop current instance
	if(this.runner) {
		this.stop();
		console.log("[ChildApp] kill() executed");
		setTimeout(this.runCode.bind(this, code), 500);
	} else {
		//write code to file
		this.saveCode(code, type);

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