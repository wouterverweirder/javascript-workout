'use strict';

const av = require('tessel-av'),
  os = require('os'),
  http = require('http'),
  port = 8000,
  camera = new av.Camera();

http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'image/jpg' });
  camera.capture().pipe(response);
}).listen(port, () => console.log(`http://${os.hostname()}.local:${port}`));
process.on("SIGINT", _ => server.close());
