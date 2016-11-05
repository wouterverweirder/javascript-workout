import Button from '../objects/Button';

export default class Menu extends Phaser.State {
  init() {
    if(!this.game.backgroundVideo) {
      this.game.backgroundVideo = this.add.video(`background-video`);
      this.game.backgroundVideo.play(true);
    }
    this.game.backgroundVideo.addToWorld();
  }
  create() {
    const playButton = new Button(this.game, this.world.centerX, this.world.centerY, this.playClicked, this, `blue`, `Play`);
    playButton.anchor.setTo(0.5, 0.5);
    this.add.existing(playButton);
  }
  playClicked() {
    this.state.start(`Play`);
  }
}
