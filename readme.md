#Javascript Workout

Interactive presentation built with electron & nodejs. (Using electron 1.3.4 on node 4.2.2)

## building

```bash
npm run develop
```

## running

Presentation:

```bash
npm run presentation
```

Server (optional):

```bash
npm run server
```

People can surf to http://REPLACE_WITH_YOUR_IP:5000 and follow the slides on their screen.

##spark core (heartrate)

To link a spark-core to your local cloud, do the following after installing the particle-cli:

1. Identify the spark core: press mode until blue > run particle identify
2. Put the spark core into DFU by pressing mode + reset, release reset while holding mode for about 3 seconds (until led flashes yellow)
3. Handle the server key: particle keys server default_key.pub.pem 192.168.2.1
4. cd into core_keys
5. Place core into DFU
6. particle keys save INPUT_CORE_ID_HERE
7. reset the core

You will need to flash the firmware (spark/pulsesensor-udp) to the spark-core:

1. `particle compile core src/spark-pulse-udp --saveTo dist/spark-pulse-udp.bin`
2. `particle flash --usb dist/spark-pulse-udp.bin`


https://github.com/chuank/spark-protocol
