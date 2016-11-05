import Button from '../objects/Button';
import GameCharacter from '../objects/GameCharacter';
import Beam from '../objects/Beam';

const SUBSTATE_INTRO = `intro`;
const SUBSTATE_PLAY = `play`;
const SUBSTATE_FALLING = `falling`;
const SUBSTATE_FINISHED = `finished`;

const BEAM_OFFSET = 143;
const MAX_HEARTRATE = 100;

export default class Play extends Phaser.State {
  init() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  create() {
    this.createEnvironment();
    this.createPlayers();
    this.createButtons();
    this.createBeam();

    this.setSubState(SUBSTATE_INTRO);
  }
  createEnvironment() {
    this.background = this.add.sprite(this.world.centerX, this.world.height - 112, `dragonball-graphics`, `background.png`);
    this.background.anchor.setTo(0.5, 1);

    this.ground = this.add.sprite(this.world.centerX, this.world.height, `dragonball-graphics`, `floor.png`);
    this.ground.anchor.setTo(0.5, 1);
  }
  createPlayers() {
    this.goku = this.add.existing(new GameCharacter(this.game, 80, this.world.height, `goku`));
    this.gohan = this.add.existing(new GameCharacter(this.game, this.world.width - 80, this.world.height, `gohan`));
  }
  createBeam() {
    this.beam = this.add.existing(new Beam(this.game, BEAM_OFFSET, this.world.centerY + 210, this.world.width - BEAM_OFFSET * 2));
  }
  createButtons() {
    this.playButton = new Button(this.game, this.world.centerX, this.world.centerY, this.playClicked, this, `blue`, `Play`);
    this.playButton.anchor.setTo(0.5, 0.5);
    this.add.existing(this.playButton);

    this.stopButton = new Button(this.game, this.world.centerX, this.world.centerY, this.stopClicked, this, `blue`, `Stop`);
    this.stopButton.anchor.setTo(0.5, 0.5);
    this.add.existing(this.stopButton);
  }
  update() {
    if(this.subState === SUBSTATE_PLAY) {
      this.updatePlayState();
    } else if(this.subState === SUBSTATE_FINISHED) {
      this.updateFinishedState();
    }
  }
  updatePlayState() {
    //update beamPosition according to heart rates
    if(this.game.sparkHeartRatesPlugin.player1.heartRate > 0 && this.game.sparkHeartRatesPlugin.player2.heartRate > 0) {
      const heartRateDiff = Math.min(MAX_HEARTRATE, this.game.sparkHeartRatesPlugin.player2.heartRate) - Math.min(MAX_HEARTRATE, this.game.sparkHeartRatesPlugin.player1.heartRate);
      this.beam.beamPosition = this.beam.beamPosition + (heartRateDiff * 0.0002);
    }
    const position = this.beam.beamPosition;
    if (position < 0.01) {
      this.winner = this.gohan;
      this.loser = this.goku;
      this.add.tween(this.beam).to({x: -this.world.width}, 350, Phaser.Easing.Linear.NONE, true);
    } else if (position > 0.99) {
      this.winner = this.goku;
      this.loser = this.gohan;
      this.add.tween(this.beam).to({x: this.world.width}, 350, Phaser.Easing.Linear.NONE, true);
    }
    if(this.winner) {
      this.winner.stand();
      this.loser.fall();
      this.setSubState(SUBSTATE_FALLING);
      this.time.events.add(500, () => {
        this.setSubState(SUBSTATE_FINISHED);
      });
    }
  }
  updateFinishedState() {
  }
  setSubState(value) {
    this.subState = value;
    this.playButton.visible = false;
    this.stopButton.visible = false;
    this.beam.visible = false;
    this.beam.x = BEAM_OFFSET;
    if(this.subState === SUBSTATE_PLAY) {
      this.stopButton.visible = true;
      this.beam.visible = true;
      this.winner = false;
      this.loser = false;
      this.beam.beamPosition = 0.5;
      this.goku.kameha();
      this.gohan.kameha();
    } else if(this.subState === SUBSTATE_FALLING){
      this.beam.visible = true;
      this.playButton.visible = true;
    } else if(this.subState === SUBSTATE_FINISHED){
      this.playButton.visible = true;
    } else {
      this.playButton.visible = true;
      this.winner = false;
      this.loser = false;
      this.goku.stand();
      this.gohan.stand();
    }
  }
  playClicked() {
    this.setSubState(SUBSTATE_PLAY);
  }
  stopClicked() {
    this.state.start(`Play`);
  }
}
