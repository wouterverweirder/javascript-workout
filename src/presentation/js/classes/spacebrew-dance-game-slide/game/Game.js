import Preload from './states/Preload';
import Menu from './states/Menu';
import Play from './states/Play';
import Finished from './states/Finished';

export default class Game extends Phaser.Game {
  constructor(width, height, renderMode, container) {
    super(width, height, renderMode, container);
    this.state.add(`Preload`, Preload);
    this.state.add(`Menu`, Menu);
    this.state.add(`Play`, Play);
    this.state.add(`Finished`, Finished);
    this.state.start(`Preload`);
  }
}
