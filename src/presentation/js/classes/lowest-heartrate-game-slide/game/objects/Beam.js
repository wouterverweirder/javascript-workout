export default class Beam extends Phaser.Group {
  constructor(game, x, y, maxWidth) {
    super(game);
    this.x = x;
    this.y = y;

    this.data = {
      maxWidth: maxWidth,
      position: 0.5
    };
    this.beamEndLeft = this._createBeamEnd();
    this.beamEndLeft.scale.setTo(-1, 1);
    this.beamLeft = this._createBeam();
    this.beamLeft.anchor.setTo(1, 0.5);

    this.beamEndRight = this._createBeamEnd();
    this.beamRight = this._createBeam();
    this.beamRight.anchor.setTo(0, 0.5);
  }
  _createBeamEnd() {
    const beamEnd = this.add(new Phaser.Sprite(this.game, 0, 0, `dragonball-graphics`, `beaming1.png`));
    beamEnd.anchor.setTo(0.5, 0.5);
    beamEnd.animations.add(`beaming`, [
      `beaming1.png`,
      `beaming2.png`,
    ], 8, true, true);
    beamEnd.animations.play(`beaming`);
    return beamEnd;
  }
  _createBeam() {
    const beam = this.add(new Phaser.TileSprite(this.game, 0, 0, 32, 32, `dragonball-graphics`, `beam.png`));
    return beam;
  }
  set beamPosition(value) {
    this.data.position = value;
  }
  get beamPosition() {
    return this.data.position;
  }
  update() {
    const beamCenter = this.data.maxWidth * this.data.position;
    this.beamEndLeft.x = beamCenter - 20;
    this.beamEndRight.x = beamCenter + 20;
    this.beamLeft.x = this.beamEndLeft.x + 10;
    this.beamRight.x = this.beamEndRight.x - 10;
    this.beamLeft.width = beamCenter;
    this.beamRight.width = this.data.maxWidth - beamCenter;
  }
}
