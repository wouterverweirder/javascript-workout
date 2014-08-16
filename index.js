console.log('starting server...');

var Server = require('./server');
var server = new Server();

var tty = require('tty.js');

var app = tty.createServer({
  shell: 'bash',
  port: 3000,
  cwd: ".",
  static: "./www/live/presentation/tty"
});

app.listen();