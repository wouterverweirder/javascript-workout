console.log('starting server...');

/*
 * run command below to forward port 80 to port 8080:
		sudo ipfw add 100 fwd 127.0.0.1,8000 tcp from any to any 80 in
*/

var Server = require('./server');
var server = new Server();

var tty = require('tty.js');

var app = tty.createServer({
  shell: 'bash',
  port: 3000,
  cwd: ".",
  localOnly: true,
  static: "./www/live/presentation/tty"
});

app.listen();