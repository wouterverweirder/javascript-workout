var Server = require('./server'),
		tty = require('tty.js'),
		spawn = require('child_process').spawn;

console.log('[javascript-workout] starting server...');

console.log('[javascript-workout] run command below to forward port 80 to port 8080:');
console.log('[javascript-workout] sudo ipfw add 100 fwd 127.0.0.1,8000 tcp from any to any 80 in');

//start the spark core server
var sparkProcess =  spawn('node', ['main.js'], {cwd: 'spark/server/js'});
sparkProcess.stdout.pipe(process.stdout);
sparkProcess.stderr.pipe(process.stderr);
sparkProcess.on('close', function (code) {
	console.log('[spark] exited with code ' + code);
});

//start the spacebrew server
var spacebrewProcess =  spawn('node', ['node_server_forever.js'], {cwd: 'spacebrew'});
spacebrewProcess.stdout.pipe(process.stdout);
spacebrewProcess.stderr.pipe(process.stderr);
spacebrewProcess.on('close', function (code) {
	console.log('[spacebrew] exited with code ' + code);
});


//start the presentation server
var server = new Server();

//start tty listener
var ttyApp = tty.createServer({
  shell: 'bash',
  port: 3000,
  cwd: ".",
  localOnly: true,
  static: "./www/live/presentation/tty"
});

ttyApp.listen();