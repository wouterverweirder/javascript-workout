'use strict';

const path = require(`path`),
  childProcess = require(`child_process`),
  pathToElectron = require(`electron`),
  rebuild = require(`electron-rebuild`).rebuild;

const init = () => {
  const env = Object.create(process.env);
  env.CXXFLAGS = '-mmacosx-version-min=10.9';
  env.LDFLAGS = '-mmacosx-version-min=10.9';
  spawnPromised(`echo`, [`Installing Presentation Dependencies`])
    .then(() => spawnPromised(`echo`, [`> Installing Spark Server Dependencies`]))
    .then(() => spawnPromised(`npm`, [`install`], { cwd: path.resolve(__dirname, `vendors`, `spark-server`), env: env }))
    .then(() => spawnPromised(`echo`, [`> Installing Espruino IDE Dependencies`]))
    .then(() => spawnPromised(`npm`, [`install`], { cwd: path.resolve(__dirname, `vendors`, `EspruinoWebIDE`), env: env }))
    .then(() => spawnPromised(`npm`, [`install`], { cwd: path.resolve(__dirname, `vendors`, `EspruinoWebIDE`, `EspruinoTools`), env: env }))
    .then(() => spawnPromised(`echo`, [`> Rebuilding node_modules for Electron`]))
    .then(() => {
      let electronVersion = childProcess.execSync(`${pathToElectron} --version`, { encoding: `utf8` });
      electronVersion = electronVersion.match(/v(\d+\.\d+\.\d+)/)[1];
      return rebuild({
        electronVersion: electronVersion,
        buildPath: path.resolve(`./`)});
    })
    .then(() => console.log(`done`));
};

const spawnPromised = (command, args = [], options = { }) => {
  return new Promise(resolve => {
    const spawn = require(`child_process`).spawn,
      spawnedProcess = spawn(command, args, options);

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
