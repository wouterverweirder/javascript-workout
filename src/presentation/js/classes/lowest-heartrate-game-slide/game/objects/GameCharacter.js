export default class GameCharacter extends Phaser.Sprite {
  constructor(game, x, y, character) {
    super(game, x, y, `dragonball-graphics`, `${character}-standing1.png`);
    this.anchor.setTo(0.5, 1);
    if(character === `gohan`) {
      this.scale.setTo(-1, 1);
    }
    this.animations.add(`stand`, [
      `${character}-standing1.png`,
      `${character}-standing2.png`,
    ], 4, true, true);
    this.animations.add(`fall`, [
      `${character}-falling1.png`,
      `${character}-falling2.png`,
      `${character}-falling3.png`,
      `${character}-falling4.png`,
      `${character}-falling5.png`,
      `${character}-falling6.png`,
      `${character}-falling7.png`,
    ], 10, false, true);
    this.animations.add(`kameha`, [
      `${character}-kameha1.png`
    ], 10, true, true);

    this.stand();
  }
  stand() {
    this.animations.play(`stand`);
  }
  fall() {
    this.animations.play(`fall`);
  }
  kameha() {
    this.animations.play(`kameha`);
  }
}
