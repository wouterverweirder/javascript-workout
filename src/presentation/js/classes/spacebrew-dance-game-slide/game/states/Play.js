import Button from '../objects/Button';
import DanceButtonOutline from '../objects/DanceButtonOutline';
import ScoreBar from '../objects/ScoreBar';

const OVERLAP_SIZE = 20;
const DANCETAG_STATUS_NORMAL = 0;
const DANCETAG_STATUS_CORRECT = 1;
const DANCETAG_STATUS_WRONG = 2;

export default class Play extends Phaser.State {
  init() {
    if(!this.game.backgroundVideo) {
      this.game.backgroundVideo = this.add.video(`background-video`);
      this.game.backgroundVideo.play(true);
    }
    this.game.backgroundVideo.addToWorld();

    this.notesByTime = {12: [{name: `blue-up`}], 28: [{name: `blue-up`}], 29: [{name: `blue-up`}], 30: [{name: `blue-up`}], 39: [{name: `orange-down`}], 48: [{name: `orange-up`}], 57: [{name: `orange-down`}], 58: [{name: `blue-down`}], 66: [{name: `blue-down`}], 67: [{name: `blue-left`}, {name: `orange-right`}], 74: [{name: `blue-left`}, {name: `orange-up`}, {name: `blue-up`}, {name: `orange-right`}], 76: [{name: `blue-left`}, {name: `orange-up`}, {name: `blue-up`}, {name: `orange-right`}], 77: [{name: `orange-up`}, {name: `orange-right`}], 9.8: [{name: `blue-up`}], 10.8: [{name: `blue-down`}], 12.8: [{name: `blue-down`}], 14.2: [{name: `blue-up`}], 15.1: [{name: `blue-down`}], 16.2: [{name: `blue-left`}], 18.4: [{name: `orange-up`}], 19.4: [{name: `orange-down`}], 20.5: [{name: `orange-up`}], 21.6: [{name: `orange-down`}], 22.6: [{name: `orange-up`}], 23.7: [{name: `orange-down`}], 24.7: [{name: `orange-right`}], 26.8: [{name: `blue-up`}], 27.4: [{name: `blue-down`}], 28.5: [{name: `blue-down`}], 29.5: [{name: `blue-down`}], 30.5: [{name: `blue-down`}], 31.1: [{name: `blue-up`}], 31.6: [{name: `blue-down`}], 32.1: [{name: `blue-up`}], 32.6: [{name: `blue-down`}], 33.2: [{name: `blue-left`}], 35.3: [{name: `orange-up`}], 35.8: [{name: `orange-down`}], 36.4: [{name: `orange-up`}], 36.9: [{name: `orange-down`}], 37.4: [{name: `orange-up`}], 37.9: [{name: `orange-down`}], 38.4: [{name: `orange-up`}], 39.6: [{name: `blue-up`}], 40.1: [{name: `blue-down`}], 40.6: [{name: `blue-up`}], 41.1: [{name: `blue-down`}], 41.6: [{name: `blue-up`}], 42.1: [{name: `blue-down`}], 42.7: [{name: `blue-up`}], 43.2: [{name: `blue-down`}], 43.8: [{name: `orange-up`}], 44.3: [{name: `orange-down`}], 44.8: [{name: `blue-up`}], 45.4: [{name: `blue-down`}], 45.9: [{name: `orange-up`}], 46.4: [{name: `orange-down`}], 46.9: [{name: `blue-up`}], 47.5: [{name: `blue-down`}], 48.6: [{name: `orange-down`}], 49.1: [{name: `blue-up`}], 49.6: [{name: `blue-down`}], 50.1: [{name: `orange-right`}], 50.6: [{name: `blue-left`}], 52.2: [{name: `orange-right`}], 52.7: [{name: `blue-left`}], 53.3: [{name: `orange-right`}], 53.8: [{name: `blue-left`}], 54.3: [{name: `orange-right`}], 54.9: [{name: `blue-left`}], 55.4: [{name: `orange-right`}], 55.9: [{name: `blue-left`}], 56.5: [{name: `orange-up`}], 57.5: [{name: `blue-up`}], 58.6: [{name: `orange-up`}], 59.1: [{name: `orange-down`}], 59.6: [{name: `blue-up`}], 60.1: [{name: `blue-down`}], 60.7: [{name: `orange-right`}], 61.2: [{name: `blue-left`}], 61.8: [{name: `orange-up`}], 62.3: [{name: `blue-up`}], 62.8: [{name: `orange-down`}], 63.3: [{name: `blue-down`}], 63.8: [{name: `orange-right`}], 64.3: [{name: `blue-left`}], 64.9: [{name: `orange-up`}], 65.4: [{name: `blue-up`}], 65.9: [{name: `orange-down`}], 66.5: [{name: `blue-down`}, {name: `orange-down`}], 67.5: [{name: `blue-left`}, {name: `orange-right`}], 68.1: [{name: `orange-up`}, {name: `blue-up`}], 68.5: [{name: `blue-up`}], 68.6: [{name: `orange-up`}], 69.2: [{name: `blue-down`}], 69.3: [{name: `orange-up`}, {name: `blue-up`}], 69.8: [{name: `blue-down`}, {name: `blue-up`}], 70.3: [{name: `orange-up`}, {name: `blue-up`}], 70.8: [{name: `blue-down`}, {name: `blue-up`}], 71.4: [{name: `blue-down`}], 71.9: [{name: `blue-left`}, {name: `orange-up`}, {name: `blue-down`}], 72.4: [{name: `blue-left`}, {name: `blue-down`}], 72.9: [{name: `blue-left`}, {name: `orange-up`}, {name: `blue-up`}, {name: `orange-right`}], 73.5: [{name: `blue-up`}], 74.5: [{name: `blue-up`}], 74.9: [{name: `blue-left`}, {name: `orange-up`}, {name: `blue-up`}, {name: `orange-right`}], 75.2: [{name: `orange-up`}, {name: `blue-up`}, {name: `orange-right`}], 75.5: [{name: `orange-up`}, {name: `blue-up`}, {name: `orange-right`}], 75.7: [{name: `orange-up`}], 76.2: [{name: `blue-left`}, {name: `orange-up`}, {name: `blue-up`}, {name: `orange-right`}], 76.5: [{name: `blue-left`}, {name: `orange-up`}, {name: `blue-up`}, {name: `orange-right`}], 76.7: [{name: `orange-up`}, {name: `orange-right`}], 77.3: [{name: `blue-left`}, {name: `orange-up`}, {name: `blue-up`}, {name: `orange-right`}], 77.6: [{name: `orange-up`}, {name: `orange-right`}]};
    this.danceKeyboardKeys = this.input.keyboard.addKeys({
      blueLeft: Phaser.KeyCode.Q,
      blueUp: Phaser.KeyCode.Z,
      blueDown: Phaser.KeyCode.S,
      orangeDown: Phaser.KeyCode.DOWN,
      orangeUp: Phaser.KeyCode.UP,
      orangeRight: Phaser.KeyCode.RIGHT,
    });
  }
  create() {
    this.score = 0.5;

    this.createOutlines();
    this.createDanceTags();
    this.createScoreBar();

    const stopButton = new Button(this.game, this.world.centerX, this.world.centerY, this.stopClicked, this, `blue`, `Stop`);
    stopButton.anchor.setTo(0.5, 0.5);
    this.add.existing(stopButton);

    this.music = this.add.audio(`music`);
    this.game.sound.setDecodedCallback([ this.music ], this.musicDecoded, this);
  }
  musicDecoded() {
    this.createTimers();
    this.music.play();
  }
  createOutlines() {
    this.outlinesLeft = this.add.group();
    this.outlinesLeft.enableBody = true;
    this.blueLeftButton = this.outlinesLeft.add(new DanceButtonOutline(this.game, 0, 0, `blue`, `left`));
    this.blueUpButton = this.outlinesLeft.add(new DanceButtonOutline(this.game, 1 * (this.blueLeftButton.width + 10), 0, `blue`, `up`));
    this.blueDownButton = this.outlinesLeft.add(new DanceButtonOutline(this.game, 2 * (this.blueLeftButton.width + 10), 0, `blue`, `down`));
    this.outlinesLeft.setAll(`body.immovable`, true);
    this.outlinesLeft.setAll(`body.width`, OVERLAP_SIZE);
    this.outlinesLeft.setAll(`body.height`, OVERLAP_SIZE);
    this.outlinesLeft.setAll(`body.offset.x`, (this.blueLeftButton.width / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
    this.outlinesLeft.setAll(`body.offset.y`, (this.blueLeftButton.height / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
    this.outlinesLeft.x = 100;
    this.outlinesLeft.y = this.world.centerY;

    this.outlinesRight = this.add.group();
    this.outlinesRight.enableBody = true;
    this.orangeDownButton = this.outlinesRight.add(new DanceButtonOutline(this.game, 0 * (this.blueLeftButton.width + 10), 0, `orange`, `down`));
    this.orangeUpButton = this.outlinesRight.add(new DanceButtonOutline(this.game, 1 * (this.blueLeftButton.width + 10), 0, `orange`, `up`));
    this.orangeRightButton = this.outlinesRight.add(new DanceButtonOutline(this.game, 2 * (this.blueLeftButton.width + 10), 0, `orange`, `right`));
    this.outlinesRight.setAll(`body.immovable`, true);
    this.outlinesRight.setAll(`body.width`, OVERLAP_SIZE);
    this.outlinesRight.setAll(`body.height`, OVERLAP_SIZE);
    this.outlinesRight.setAll(`body.offset.x`, (this.blueLeftButton.width / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
    this.outlinesRight.setAll(`body.offset.y`, (this.blueLeftButton.height / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
    this.outlinesRight.x = this.world.centerX + 200;
    this.outlinesRight.y = this.world.centerY;
  }
  createDanceTags() {
    this.danceTags = this.add.group();
    this.danceTags.enableBody = true;
    this.danceTags.createMultiple(100, `ddr-graphics`, `blue`);
    this.danceTags.setAll(`anchor.x`, 0.5);
    this.danceTags.setAll(`anchor.y`, 0.5);
    this.danceTags.setAll(`scale.x`, 0.3);
    this.danceTags.setAll(`scale.y`, 0.3);
    this.danceTags.setAll(`checkWorldBounds`, true);
    this.danceTags.setAll(`outOfBoundsKill`, true);
    this.danceTags.setAll(`body.immovable`, true);
    this.danceTags.setAll(`body.width`, OVERLAP_SIZE);
    this.danceTags.setAll(`body.height`, OVERLAP_SIZE);
    this.danceTags.setAll(`body.offset.x`, (this.blueLeftButton.width / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
    this.danceTags.setAll(`body.offset.y`, (this.blueLeftButton.height / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
  }
  createScoreBar() {
    this.scoreBar = new ScoreBar(this.game, this.world.centerX, 100);
    this.add.existing(this.scoreBar);
  }
  createTimers() {
    const timeToReachCenter = 1000;
    for(const time in this.notesByTime) {
      const delay = ~~(parseFloat(time) * Phaser.Timer.SECOND) - timeToReachCenter;
      this.notesByTime[time].forEach(note => {
        const noteSplit = note.name.split(`-`);
        this.time.events.add(delay, this.addDanceTag, this, noteSplit[0], noteSplit[1]);
      });
    }
  }
  addDanceTag(color, orientation) {
    const danceTag = this.danceTags.getFirstDead();
    let xPos = 0;
    switch(orientation) {
    case `up`:
      xPos = (color === `blue`) ? this.outlinesLeft.x + this.blueUpButton.x : this.outlinesRight.x + this.orangeUpButton.x;
      danceTag.angle = 180;
      break;
    case `down`:
      xPos = (color === `blue`) ? this.outlinesLeft.x + this.blueDownButton.x : this.outlinesRight.x + this.orangeDownButton.x;
      danceTag.angle = 0;
      break;
    case `right`:
      xPos = this.outlinesRight.x + this.orangeRightButton.x;
      danceTag.angle = 270;
      break;
    default:
      xPos = this.outlinesLeft.x + this.blueLeftButton.x;
      danceTag.angle = 90;
      break;
    }
    danceTag.reset(xPos, this.world.bottom);
    danceTag.body.velocity.y = -180;
    danceTag.data = {
      color: color,
      orientation: orientation,
      status: DANCETAG_STATUS_NORMAL
    };
    danceTag.frameName = color;
  }
  setScore(value) {
    this.score = Math.min(1, Math.max(0, value));
    if(this.scoreBar) {
      this.scoreBar.score = this.score;
    }
  }
  increaseScore() {
    this.setScore(this.score + 0.1);
  }
  decreaseScore() {
    this.setScore(this.score - 0.1);
  }
  update() {
    this.physics.arcade.overlap(this.danceTags, this.outlinesLeft, this.danceTagOverlap, null, this);
    this.physics.arcade.overlap(this.danceTags, this.outlinesRight, this.danceTagOverlap, null, this);
    //this.handleKeyboardInput();
    this.handleSpacebrewInput();
    this.danceTags.forEachAlive(danceTag => {
      if(danceTag.y < this.world.centerY - OVERLAP_SIZE / 2 && danceTag.data.status === DANCETAG_STATUS_NORMAL) {
        danceTag.data.status = DANCETAG_STATUS_WRONG;
        danceTag.frameName = `${danceTag.data.color}-wrong`;
        this.decreaseScore();
      }
    });
  }
  danceTagOverlap(danceTag, outline) {
    if(danceTag.data.status === DANCETAG_STATUS_NORMAL) {
      if(outline.pressed) {
        danceTag.data.status = DANCETAG_STATUS_CORRECT;
        danceTag.frameName = `${danceTag.data.color}-correct`;
        this.increaseScore();
      }
    }
  }
  render() {
    // this.outlinesLeft.forEach(o => this.game.debug.body(o));
    // this.outlinesRight.forEach(o => this.game.debug.body(o));
    // this.danceTags.forEach(o => this.game.debug.body(o));
  }
  handleKeyboardInput() {
    this.blueLeftButton.pressed = this.danceKeyboardKeys.blueLeft.isDown;
    this.blueUpButton.pressed = this.danceKeyboardKeys.blueUp.isDown;
    this.blueDownButton.pressed = this.danceKeyboardKeys.blueDown.isDown;
    this.orangeUpButton.pressed = this.danceKeyboardKeys.orangeUp.isDown;
    this.orangeDownButton.pressed = this.danceKeyboardKeys.orangeDown.isDown;
    this.orangeRightButton.pressed = this.danceKeyboardKeys.orangeRight.isDown;
  }
  handleSpacebrewInput() {
    this.blueLeftButton.pressed = this.game.spacebrewPlugin.buttons[`blue-left`].isDown;
    this.blueUpButton.pressed = this.game.spacebrewPlugin.buttons[`blue-up`].isDown;
    this.blueDownButton.pressed = this.game.spacebrewPlugin.buttons[`blue-down`].isDown;
    this.orangeUpButton.pressed = this.game.spacebrewPlugin.buttons[`orange-up`].isDown;
    this.orangeDownButton.pressed = this.game.spacebrewPlugin.buttons[`orange-down`].isDown;
    this.orangeRightButton.pressed = this.game.spacebrewPlugin.buttons[`orange-right`].isDown;
  }
  stopClicked() {
    this.state.start(`Menu`);
  }
  shutdown() {
    if(this.music) {
      this.music.destroy();
    }
  }
}
