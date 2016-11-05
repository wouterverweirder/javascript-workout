export default class Flagpole extends Phaser.Group {
  constructor(game, x, y) {
    super(game);
    this.x = x;
    this.y = y;

    this.pole = new Phaser.Sprite(this.game, 0, 0, `mario-graphics`, `flagpole.png`);
    this.pole.anchor.setTo(0.5, 1);
    this.add(this.pole);

    this.flag = new Phaser.Sprite(this.game, 0, 0, `mario-graphics`, `flag-moving1.png`);
    this.flag.anchor.setTo(0, 1);
    this.flag.y = -this.pole.height + this.flag.height + 20;
    this.flag.animations.add(`moving`, [
      `flag-moving1.png`,
      `flag-moving2.png`,
      `flag-moving3.png`
    ], 10, true, true);
    this.flag.animations.play(`moving`);
    this.add(this.flag);
  }
}
