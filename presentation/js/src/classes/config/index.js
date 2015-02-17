var path = requireNode('path');

var __dirname = requireNode('./js/src/classes/config/dirname');

var Config = {};

// Retrieve local ip for Config
var ip = '127.0.0.1', ifaces = requireNode('os').networkInterfaces();
for (var dev in ifaces) { 
	if(dev.indexOf('bridge') !== 0) {
		/* jshint ignore:start */
		ifaces[dev].forEach(function(details) { 
			if (details.family === 'IPv4') {
				ip = details.address; 
			}
		});
		/* jshint ignore:end */
	}
}

Config.childNodeAppFilePath = path.normalize(__dirname + '/../../../../../child-app/node/app.js');
Config.childTesselAppFilePath = path.normalize(__dirname + '/../../../../../child-app/tessel/app.js');
Config.ip = ip;

//Config.mobileServerUrl = "http://jsworkout.herokuapp.com";
Config.mobileServerUrl = "http://localhost:5000";
Config.mobileServerUsername = "wouter.verweirder@gmail.com";
Config.mobileServerPassword = "geheim";

module.exports = Config;