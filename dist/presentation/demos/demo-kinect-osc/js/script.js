{
  const canvas = document.querySelector('canvas'),
    ctx = canvas.getContext('2d');

  const osc = require('osc');

  const udpPort = new osc.UDPPort({ localAddress: "localhost", localPort: 6448});
  udpPort.open();

  udpPort.on("message", (oscMsg) => {
    if (oscMsg.address === '/wek/inputs') {
      const gSendScreen = oscMsg.args.shift();
      const gNormalize = oscMsg.args.shift();
      const step = (gSendScreen) ? 3 : 4;
      const len = oscMsg.args.length;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < len; i += step) {
        const joint = {
          name: oscMsg.args[i],
          x: oscMsg.args[i + 1],
          y: oscMsg.args[i + 2]
        };
        ctx.fillRect(joint.x, joint.y, 10, 10);
      }
    }
  });

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', resize);
  resize();


}