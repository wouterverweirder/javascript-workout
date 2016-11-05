import HeartRateCanvas from '../../HeartRateCanvas';

import SparkHeartRatesPlugin from './SparkHeartRatesPlugin';

import Preload from './states/Preload';
import Play from './states/Play';

export default class Game extends Phaser.Game {
  constructor(slideHolder, width, height, renderMode, container) {
    super(width, height, renderMode, container, { preload: () => this.preload()});
    this.slideHolder = slideHolder;
    this.state.add(`Preload`, Preload);
    this.state.add(`Play`, Play);

    this.player1HeartRateCanvas = new HeartRateCanvas(this.slideHolder.querySelector(`.player1-container canvas`));
    this.player1HeartRateText = this.slideHolder.querySelector(`.player1-container .heartRate`);
    this.player2HeartRateCanvas = new HeartRateCanvas(this.slideHolder.querySelector(`.player2-container canvas`));
    this.player2HeartRateText = this.slideHolder.querySelector(`.player2-container .heartRate`);
  }
  preload() {
    this.sparkHeartRatesPlugin = this.plugins.add(SparkHeartRatesPlugin);
    this.onPause.add(() => this.manageSparkHeartRatesPluginConnection());
    this.onResume.add(() => this.manageSparkHeartRatesPluginConnection());
    this.manageSparkHeartRatesPluginConnection();
    this.state.start(`Preload`);
  }
  update(time) {
    super.update(time);
    if(!this.sparkHeartRatesPlugin) {
      return;
    }
    this.player1HeartRateCanvas.tick();
    this.player1HeartRateCanvas.updateHeartRate(this.sparkHeartRatesPlugin.player1.heartRate);
    this.player1HeartRateText.innerHTML = this.sparkHeartRatesPlugin.player1.heartRate;
    this.player2HeartRateCanvas.tick();
    this.player2HeartRateCanvas.updateHeartRate(this.sparkHeartRatesPlugin.player2.heartRate);
    this.player2HeartRateText.innerHTML = this.sparkHeartRatesPlugin.player2.heartRate;
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
