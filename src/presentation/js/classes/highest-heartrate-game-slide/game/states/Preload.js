export default class Preload extends Phaser.State {
  init() {
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.stage.backgroundColor = `#5088a0`;
  }
  preload() {
    this.load.atlasJSONHash(`components`, `assets/mario/components.png`, `assets/mario/components.json`);
    this.load.atlasJSONHash(`mario-graphics`, `assets/mario/mario-graphics.png`, `assets/mario/mario-graphics.json`);
  }
  create() {
    this.state.start(`Play`);
  }
}
