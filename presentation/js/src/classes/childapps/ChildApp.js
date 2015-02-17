var Config = require('../config'),
	events = requireNode('events'),
	fs = requireNode('fs'),
	process = requireNode('child_process'),
	util = requireNode('util'),
	path = requireNode('path');

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

ChildApp.prototype.saveCode = function(code, type, cb) {
	//if code is running, stop it
	if(this.runner) {
		this.stop();
		console.log("[ChildApp] kill() executed");
		setTimeout(this.saveCode.bind(this, code, type, cb), 500);
	} else {
		var filePath = Config.childNodeAppFilePath;
		if(type === 'tessel') {
			filePath = Config.childTesselAppFilePath;
		}
		fs.writeFile(filePath, code, function(err) {
				if(err) {
						console.log(err);
				} else {
						console.log("[ChildApp] The file was saved!");
						if(cb) {
							cb();
						}
				}
		});
	}
};

ChildApp.prototype.runCode = function(code, type) {
	console.log("[ChildApp] runCode");
	//write code to file & run it
	this.saveCode(code, type, (function(){
		//run the code
		if(type === 'tessel') {
			this.runner = process.spawn("tessel", ["run", Config.childTesselAppFilePath], {cwd: path.dirname(Config.childTesselAppFilePath)});
		} else {
			console.log("[ChildApp] spawn node", Config.childNodeAppFilePath);
			this.runner = process.spawn("node", [Config.childNodeAppFilePath], {cwd: path.dirname(Config.childNodeAppFilePath)});
		}
		this.runner.stdout.on('data', this.onRunnerData.bind(this));
		this.runner.stderr.on('data', this.onRunnerData.bind(this));
		this.runner.on('disconnect', this.onDisconnect.bind(this));
		this.runner.on('close', this.onClose.bind(this));
	}).bind(this));
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