export default class ScoreBar extends Phaser.Group {
  constructor(game, x, y) {
    super(game);

    this.data = {
      score: 0.5
    };

    this.scoreFill = new Phaser.Sprite(game, 0, 0, `ddr-graphics`, `scorebar`);
    this.add(this.scoreFill);

    const outline = new Phaser.Sprite(game, 0, 0, `ddr-graphics`, `scorebar-outline`);
    this.add(outline);

    //mask
    this.scoreFillMask = new Phaser.Graphics(game, 0, 0);
    this.scoreFillMask.beginFill(0xffffff);
    this.scoreFillMask.drawRect(0, 0, this.scoreFill.width * this.data.score, this.scoreFill.height);
    this.add(this.scoreFillMask);

    this.scoreFill.mask = this.scoreFillMask;

    this.x = x - outline.width / 2;
    this.y = y - outline.height / 2;
  }
  set score(value) {
    value = Math.min(1, Math.max(0, value));
    this.data.score = value;
  }
  get score() {
    return this.data.score;
  }
  update() {
    const targetFillWidth = this.scoreFill.width * this.data.score;
    let currentFillWidth = this.scoreFillMask.width;
    currentFillWidth += (targetFillWidth - currentFillWidth) * 0.1;
    this.scoreFillMask.clear();
    this.scoreFillMask.beginFill(0xffffff);
    this.scoreFillMask.drawRect(0, 0, currentFillWidth, this.scoreFill.height);
  }
}
