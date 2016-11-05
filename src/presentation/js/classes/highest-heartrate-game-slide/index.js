import {Constants} from '../../../../shared/js/Constants';
import ContentBase from '../../../../shared/js/classes/ContentBase';

import Game from './game/Game';

export default class HighestHeartrateGameSlide extends ContentBase{

  constructor($slideHolder) {
    super($slideHolder);
    this.game = new Game($slideHolder[0], 1280, 670, Phaser.AUTO, `highest-heartrate-game-container`);
  }

  onStateChanged() {
    if(this.state === Constants.STATE_ACTIVE) {
      this.game.paused = false;
    } else {
      this.game.paused = true;
    }
  }

  destroy() {
    this.game.destroy();
    super.destroy();
  }

}
