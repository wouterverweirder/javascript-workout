'use strict';

const path = require('path'),
  spawn = require('child_process').spawn;

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const platform = process.platform;
const isWin = /^win/.test(platform);

const argv = require('minimist')(process.argv.slice(2));

let debug = (argv.env === 'dev');

require('./xterm-app.js');

//start the spark core server
const sparkProcess =  spawn('node', ['main.js'], {cwd: path.resolve(__dirname, 'vendors', 'spark-server')});
sparkProcess.stdout.pipe(process.stdout);
sparkProcess.stderr.pipe(process.stderr);
sparkProcess.on('close', code => {
	console.log('[spark] exited with code ' + code);
});

let mainWindow;

global.__dirname = __dirname;

function createWindow () {
  mainWindow = new BrowserWindow({
    "width": 1280,
    "height": 700,
    "fullscreen": true,
    "kiosk": false,
    "autoHideMenuBar": false
  });
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  if(debug) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  //kill the spawned processes
  process.kill(sparkProcess.pid, 'SIGTERM');
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
