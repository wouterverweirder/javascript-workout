{
  const textarea = document.querySelector('textarea');

  const osc = require('osc');

  const udpPort = new osc.UDPPort({ localAddress: "192.168.2.1", localPort: 6448});
  udpPort.open();

  udpPort.on("message", (oscMsg) => {
    textarea.value += oscMsg.address + " " + oscMsg.args.join(", ") + "\n";
    textarea.scrollTop = textarea.scrollHeight;
  });

}