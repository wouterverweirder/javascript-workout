export default class DanceButtonOutline extends Phaser.Sprite {
  constructor(game, x, y, color = `blue`, orientation = `left`) {
    super(game, x, y, `ddr-graphics`, `white-outline`);
    this.data.color = color;
    this.data.orientation = orientation;
    this.anchor.setTo(0.5, 0.5);
    this.scale.setTo(0.3, 0.3);
    switch(orientation) {
    case `up`:
      this.angle = 180;
      break;
    case `down`:
      this.angle = 0;
      break;
    case `right`:
      this.angle = 270;
      break;
    default:
      this.angle = 90;
      break;
    }
  }
  set pressed(value) {
    if(value) {
      this.frameName = `${this.data.color}-outline`;
    } else {
      this.frameName = `white-outline`;
    }
  }
  get pressed() {
    return (this.frameName !== `white-outline`);
  }
}
