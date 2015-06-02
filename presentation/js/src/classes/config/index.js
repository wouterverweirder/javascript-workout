module.exports = (function(){
	var path = requireNode('path');

	var __dirname = requireNode('./js/src/classes/config/dirname');

	if(!global.Config) {
		global.Config = {};
		
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

		global.Config.heartRateFilePath = path.normalize(__dirname + '/../../../../../heartrate.json');
		global.Config.childNodeAppFilePath = path.normalize(__dirname + '/../../../../../child-app/node/app.js');
		global.Config.childTesselAppFilePath = path.normalize(__dirname + '/../../../../../child-app/tessel/app.js');
		global.Config.ip = ip;

		global.Config.mobileServerUrl = "";
		global.Config.mobileServerUsername = "";
		global.Config.mobileServerPassword = "";

		//set this to your twitter api credentials
		global.Config.twitterConsumerKey = "";
		global.Config.twitterConsumerSecret = "";

	}

	return global.Config;

})();