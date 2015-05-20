#presentation setup

##npm installs

npm install in this directory, the spacebrew directory and spark/server/js directory

##nw.js
The presentation is a nw.js application (http://nwjs.io/). Download nw.js (I used v0.12.0) and place it in the presentation directory.

##launch
Launch the presentation by executing the local-launch.js file with node:

	node ./local-launch.js

This will start the tty.js server, the local spark core cloud, the spacebrew server and the nw.js presentation

##optional

###nw.js with MP3 & MP4 support

https://github.com/nwjs/nw.js/wiki/Using-MP3-&-MP4-%28H.264%29-using-the--video--&--audio--tags.

###spark core (heartrate)
To link a spark-core to your local cloud, do the following:

1. Identify the spark core: press mode until blue > run spark identify
2. Put the spark core into DFU by pressing mode + reset, release reset while holding mode for about 3 seconds (until led flashes yellow)
3. Handle the server key: spark keys server default_key.pub.pem 192.168.2.1
4. cd into core_keys
5. Place core into DFU
6. spark keys save INPUT_CORE_ID_HERE
7. reset the core