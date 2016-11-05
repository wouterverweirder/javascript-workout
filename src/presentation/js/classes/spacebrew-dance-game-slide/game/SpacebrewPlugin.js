export default class SpacebrewPlugin extends Phaser.Plugin {
  constructor(game, parent) {
    super(game, parent);
  }
  init() {
    console.log(`Spacebrew Plugin init`);
    this.noteNames = [
      `blue-left`,
      `blue-up`,
      `blue-down`,
      `orange-down`,
      `orange-up`,
      `orange-right`
    ];
    this.buttons = {};
    //spacebrew connection
    this.sb = new Spacebrew.Client(`localhost`, `DDR Presentation`);
    this.sb.onStringMessage = (name, isDown) => this.handleButton(name, (isDown === `true`));
    this.noteNames.forEach(noteName => {
      this.buttons[noteName] = { isDown: false };
      this.sb.addSubscribe(noteName, `string`);
    });
    this.sb.connect();
  }
  handleButton(name, isDown) {
    this.buttons[name].isDown = isDown;
  }
  destroy() {
    if(this.sb) {
      this.sb.close();
    }
    super.destroy();
  }
}
