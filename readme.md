#Instructions

1. npm install in this directory, the spacebrew directory and spark/server/js directory
2. Run the build & run process using gulp: `gulp`
3. For each spark core:

1. Identify the spark core: press mode until blue > run spark identify
2. Put the spark core into DFU by pressing mode + reset, release reset while holding mode for about 3 seconds (until led flashes yellow)
3. Handle the server key: spark keys server default_key.pub.pem 192.168.2.1
4. cd into core_keys
5. Place core into DFU
6. spark keys save INPUT_CORE_ID_HERE
7. reset the core


Point your browser to http://localhost:8000

