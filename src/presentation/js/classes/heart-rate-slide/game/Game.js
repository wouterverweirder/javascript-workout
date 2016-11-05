import SparkHeartRatesPlugin from './SparkHeartRatesPlugin';

import Preload from './states/Preload';
import Play from './states/Play';

export default class Game extends Phaser.Game {
  constructor() {
    super(1280, 720, Phaser.AUTO, `game-container`, { preload: () => this.preload()});
    this.state.add(`Preload`, Preload);
    this.state.add(`Play`, Play);
  }
  preload() {
    this.sparkHeartRatesPlugin = this.plugins.add(SparkHeartRatesPlugin);
    this.onPause.add(() => this.manageSparkHeartRatesPluginConnection());
    this.onResume.add(() => this.manageSparkHeartRatesPluginConnection());
    this.manageSparkHeartRatesPluginConnection();
    this.state.start(`Preload`);
  }
  manageSparkHeartRatesPluginConnection() {
    console.log(`[Game] manageSparkHeartRatesPluginConnection`);
    if(this.paused) {
      this.sparkHeartRatesPlugin.close();
    } else {
      this.sparkHeartRatesPlugin.connect();
    }
  }
}
