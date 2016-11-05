export default class GameCharacter extends Phaser.Sprite {
  constructor(game, x, y, character) {
    super(game, x, y, `mario-graphics`, `${character}-run-1.png`);
    this.anchor.setTo(0.5, 1);
    this.animations.add(`stand`, [
      `${character}-run-1.png`,
    ], 10, true, true);
    this.animations.add(`run`, [
      `${character}-run-1.png`,
      `${character}-run-2.png`,
      `${character}-run-3.png`,
      `${character}-run-4.png`
    ], 10, true, true);
    this.animations.add(`jump`, [
      `${character}-jump.png`
    ], 10, true, true);
    this.game.physics.arcade.enable(this);
    this.body.gravity.y = 1000;
  }
  stand() {
    this.animations.play(`stand`);
    this.body.velocity.x = 0;
  }
  run(speed) {
    this.body.velocity.x = speed;
    this.animations.play(`run`);
  }
  jump() {
    if(this.body.touching.down) {
      this.animations.play(`jump`);
      this.body.velocity.x = 100;
      this.body.velocity.y = -750;
    }
  }
}
