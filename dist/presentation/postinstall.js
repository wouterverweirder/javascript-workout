'use strict';

const path = require(`path`),
  childProcess = require(`child_process`),
  pathToElectron = require(`electron`),
  electronRebuild = require(`electron-rebuild`),
  installNodeHeaders = electronRebuild.installNodeHeaders,
  rebuildNativeModules = electronRebuild.rebuildNativeModules;

const init = () => {
  spawnPromised(`echo`, [`Installing Presentation Dependencies`])
    .then(() => spawnPromised(`echo`, [`> Installing Spark Server Dependencies`]))
    .then(() => spawnPromised(`npm`, [`install`], path.resolve(__dirname, `vendors`, `spark-server`)))
    .then(() => spawnPromised(`echo`, [`> Installing Espruino IDE Dependencies`]))
    .then(() => spawnPromised(`npm`, [`install`], path.resolve(__dirname, `vendors`, `EspruinoWebIDE`)))
    .then(() => spawnPromised(`echo`, [`> Rebuilding node_modules for Electron`]))
    .then(() => {
      let electronVersion = childProcess.execSync(`${pathToElectron} --version`, { encoding: `utf8` });
      electronVersion = electronVersion.match(/v(\d+\.\d+\.\d+)/)[1];
      return installNodeHeaders(electronVersion)
        .then(() => rebuildNativeModules(electronVersion, `./node_modules`));
    })
    .then(() => {
      let electronVersion = childProcess.execSync(`${pathToElectron} --version`, { encoding: `utf8` });
      electronVersion = electronVersion.match(/v(\d+\.\d+\.\d+)/)[1];
      return installNodeHeaders(electronVersion)
        .then(() => rebuildNativeModules(electronVersion, `./vendors/EspruinoWebIDE/node_modules`));
    })
    .then(() => console.log(`done`));
};

const spawnPromised = (command, args = [], cwd = __dirname) => {
  return new Promise(resolve => {
    const spawn = require(`child_process`).spawn,
      spawnedProcess = spawn(command, args, { cwd: cwd });

    spawnedProcess.stdout.on(`data`, data => {
      console.log(data.toString());
    });

    spawnedProcess.stderr.on(`data`, data => {
      console.log(data.toString());
    });

    spawnedProcess.on(`exit`, () => {
      resolve();
    });
  });
};

init();
