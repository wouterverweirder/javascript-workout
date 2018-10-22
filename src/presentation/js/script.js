require(`es6-promise`).polyfill();

import Presentation from './classes/Presentation';
import SlidesFolderParser from '../../server/classes/SlidesFolderParser';

(() => {

  const remote = requireNode(`electron`).remote;
  const presentationPath = remote.getGlobal(`__dirname`);
  const path = requireNode(`path`);
  var argv = require('minimist')(remote.process.argv);

  const init = () => {
    
    const settings = {
      presentationPath: presentationPath,
      mobileServerUrl: `https://jsworkout.herokuapp.com`,
      mobileServerUsername: `wouter.verweirder@gmail.com`,
      mobileServerPassword: `geheim`
    };

    if (argv['mobile-server-url']) {
      settings.mobileServerUrl = argv['mobile-server-url'];
    }

    const slidesFolderParser = new SlidesFolderParser();
    slidesFolderParser.parse(presentationPath, path.resolve(presentationPath, `slides`))
      .then(data => {
        new Presentation(data, `presentation`, settings);
      });
  };

  init();
})();
