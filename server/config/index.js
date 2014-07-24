var path = require('path');

var Config = {};

// Retrieve local ip for Config
var ip = '127.0.0.1', ifaces = require('os').networkInterfaces();
for (var dev in ifaces) { 
	if(dev.indexOf('bridge') !== 0) {
		ifaces[dev].forEach(function(details) { 
			if (details.family == 'IPv4') {
				ip = details.address; 
			}
		});
	}
}


Config.entryPoint = path.normalize(__dirname + '/../../index.js');
Config.johnnyFiveEditorFilePath = path.normalize(__dirname + '/../../johnny-five-app.js');
Config.ip = ip;
Config.port = 8080;

module.exports = Config;