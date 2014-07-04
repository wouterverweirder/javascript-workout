var Config = {};

// Retrieve local ip for Config
var ip = '127.0.0.1', ifaces = require('os').networkInterfaces();
for (var dev in ifaces) { 
	ifaces[dev].forEach(function(details) { 
		if (details.family == 'IPv4') {
			ip = details.address; 
		}
	});
}

Config.ip = ip;
Config.port = 8080;

module.exports = Config;