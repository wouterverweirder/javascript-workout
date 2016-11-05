export default class Preload extends Phaser.State {
  init() {
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.stage.backgroundColor = `#d87040`;
  }
  preload() {
    this.load.atlasJSONHash(`components`, `assets/dragonball/components.png`, `assets/dragonball/components.json`);
    this.load.atlasJSONHash(`dragonball-graphics`, `assets/dragonball/dragonball-graphics.png`, `assets/dragonball/dragonball-graphics.json`);
  }
  create() {
    this.state.start(`Play`);
  }
}
