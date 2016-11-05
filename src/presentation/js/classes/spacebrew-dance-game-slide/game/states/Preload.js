import SpacebrewPlugin from '../SpacebrewPlugin';

export default class Preload extends Phaser.State {
  init() {
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.spacebrewPlugin = this.game.plugins.add(SpacebrewPlugin);
  }
  preload() {
    this.load.video(`background-video`, `assets/spacebrew-dance-game/disco-background.mp4`);
    this.load.audio(`music`, `assets/spacebrew-dance-game/never-gonna-give-you-up.mp3`);
    this.load.atlasJSONHash(`ddr-graphics`, `assets/spacebrew-dance-game/ddr-graphics.png`, `assets/spacebrew-dance-game/ddr-graphics.json`);
    this.load.atlasJSONHash(`components`, `assets/spacebrew-dance-game/components.png`, `assets/spacebrew-dance-game/components.json`);
  }
  create() {
    this.state.start(`Menu`);
    // this.state.start('Play');
  }
}
