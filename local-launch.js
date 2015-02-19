var tty = require('tty.js'),
	spawn = require('child_process').spawn;

console.log('[javascript-workout] starting...');

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

//start tty listener
var ttyApp = tty.createServer({
  shell: 'bash',
  port: 3000,
  cwd: ".",
  localOnly: true,
  static: "./presentation/tty"
});

ttyApp.listen();

//todo: launch presentation