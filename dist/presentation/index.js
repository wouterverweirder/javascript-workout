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

const tty = require('tty.js');

let ttyServer = tty.createServer({
  shell: 'bash',
  port: 3000,
  localOnly: true,
  static: path.resolve(__dirname, 'vendors', 'tty'),
  cwd: path.resolve(__dirname)
});

ttyServer.listen();

//start the spark core server
const sparkProcess =  spawn('node', ['main.js'], {cwd: path.resolve(__dirname, 'vendors', 'spark-server')});
sparkProcess.stdout.pipe(process.stdout);
sparkProcess.stderr.pipe(process.stderr);
sparkProcess.on('close', code => {
	console.log('[spark] exited with code ' + code);
});

//start the spacebrew server
const spacebrewProcess =  spawn('node', ['node_server.js'], {cwd: path.resolve(__dirname, 'vendors', 'spacebrew')});
spacebrewProcess.stdout.pipe(process.stdout);
spacebrewProcess.stderr.pipe(process.stderr);
spacebrewProcess.on('close', code => {
	console.log('[spacebrew] exited with code ' + code);
});

let mainWindow;

global.__dirname = __dirname;

function createWindow () {
  mainWindow = new BrowserWindow({
    "width": 1280,
    "height": 700,
    "fullscreen": false,
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
  process.kill(spacebrewProcess.pid, 'SIGTERM');
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
