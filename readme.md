#presentation setup

##npm installs

npm install in this directory, the spacebrew directory and spark/server/js directory

##node-webkit
The presentation is a node webkit application (http://nwjs.io/). Download node-webkit (I used v0.11.5) and place it in the presentation directory.

##launch
Launch the presentation by executing the local-launch.js file with node:

	node ./local-launch.js

This will start the tty.js server, the local spark core cloud, the spacebrew server and the node-webkit presentation

##optional

###node-webkit with MP3 & MP4 support

For MP3 and MP4 support, you'll need to build node-webkit yourself.

Here's what I did (OSX Yosemite):

1. Install the depot_tools and add them to your path:
	1. git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
	2. Add that directory to your path in your ~/.bash_profile (or ~/.bashrc, ~/.profile, ...)
2. Create a new directory for the source code download
3. Go inside that directory with a terminal window
4. Create a .gclient file with the following contents:

	solutions = [
	   { "name"        : "src",
	     "url"         : "https://github.com/rogerwang/chromium.src.git@origin/nw",
	     "deps_file"   : ".DEPS.git",
	     "managed"     : True,
	     "custom_deps" : {
	       "src/third_party/WebKit/LayoutTests": None,
	       "src/chrome_frame/tools/test/reference_build/chrome": None,
	       "src/chrome_frame/tools/test/reference_build/chrome_win": None,
	       "src/chrome/tools/test/reference_build/chrome": None,
	       "src/chrome/tools/test/reference_build/chrome_linux": None,
	       "src/chrome/tools/test/reference_build/chrome_mac": None,
	       "src/chrome/tools/test/reference_build/chrome_win": None,
	     },
	     "safesync_url": "",
	   },
	]

5. run `gclient sync` to download sources. This will take a while
6. inside build/third_party/ffmpeg/chromium/scripts/build_ffmpeg.py

	change:

	configure_flags['Chrome'].extend([
      '--enable-decoder=aac,h264,mp3',
      '--enable-demuxer=aac,mp3,mov',
      '--enable-parser=aac,h264,mpegaudio',
  ])

  to: 

  configure_flags['Common'].extend([
      '--enable-decoder=aac,h264,mp3',
      '--enable-demuxer=aac,mp3,mov',
      '--enable-parser=aac,h264,mpegaudio',
  ])

 7. `./third_party/ffmpeg/chromium/scripts/build_ffmpeg.py mac x64`
 8. `./third_party/ffmpeg/chromium/scripts/copy_config.sh`
 9. `export GYP_GENERATORS='ninja'`
 10. `export GYP_DEFINES="proprietary_codecs=1 ffmpeg_branding=Chrome"`
 11. `./build/gyp_chromium content/content.gyp --no-circular-check`
 12. `ninja -C out/Release nw -j4`

I used the steps above to build a node-webkit version with MP3 & MP4 support.

###spark core (heartrate)
To link a spark-core to your local cloud, do the following:

1. Identify the spark core: press mode until blue > run spark identify
2. Put the spark core into DFU by pressing mode + reset, release reset while holding mode for about 3 seconds (until led flashes yellow)
3. Handle the server key: spark keys server default_key.pub.pem 192.168.2.1
4. cd into core_keys
5. Place core into DFU
6. spark keys save INPUT_CORE_ID_HERE
7. reset the core