import Button from '../objects/Button';
import GameCharacter from '../objects/GameCharacter';
import Flagpole from '../objects/Flagpole';

const SUBSTATE_INTRO = `intro`;
const SUBSTATE_PLAY = `play`;
const SUBSTATE_JUMP_POLE = `jump`;
const SUBSTATE_FINISHED = `finished`;

const WINNER_DISTANCE_POLE = 100;

export default class Play extends Phaser.State {
  init() {
    // if(!this.game.backgroundVideo) {
    //   this.game.backgroundVideo = this.add.video('background-video');
    //   this.game.backgroundVideo.play(true);
    // }
    // this.game.backgroundVideo.addToWorld();
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  create() {
    this.createEnvironment();
    this.createPlayers();
    this.createButtons();

    this.setSubState(SUBSTATE_INTRO);
  }
  createEnvironment() {
    this.ground = this.add.tileSprite(0, this.world.height, this.world.width, 82, `mario-graphics`, `ground.png`);
    this.ground.anchor.setTo(0, 1);
    this.physics.arcade.enable(this.ground);
    this.ground.body.immovable = true;

    this.hills = this.add.tileSprite(0, this.world.height - 82, this.world.width, 428, `mario-graphics`, `hills.png`);
    this.hills.anchor.setTo(0, 1);

    this.flagpole = new Flagpole(this.game, this.world.width - 50, this.world.height - 82);
    this.add.existing(this.flagpole);
  }
  createPlayers() {
    this.peach = this.add.existing(new GameCharacter(this.game, 30, 10, `peach`));
    this.mario = this.add.existing(new GameCharacter(this.game, 10, 10, `mario`));
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
    this.physics.arcade.collide(this.ground, this.peach);
    this.physics.arcade.collide(this.ground, this.mario);
    if(this.subState === SUBSTATE_PLAY) {
      this.updatePlayState();
    } else if(this.subState === SUBSTATE_JUMP_POLE) {
      this.updateJumpState();
    } else if(this.subState === SUBSTATE_FINISHED) {
      this.updateFinishedState();
    }
  }
  updatePlayState() {
    const distanceMario = this.flagpole.x - this.mario.x;
    const distancePeach = this.flagpole.x - this.peach.x;
    this.peach.run(this.game.sparkHeartRatesPlugin.player1.heartRate);
    this.mario.run(this.game.sparkHeartRatesPlugin.player2.heartRate);
    if(distanceMario < WINNER_DISTANCE_POLE || distancePeach < WINNER_DISTANCE_POLE) {
      if(distanceMario < distancePeach) {
        this.winner = this.mario;
        this.loser = this.peach;
      } else {
        this.winner = this.peach;
        this.loser = this.mario;
      }
      this.setSubState(SUBSTATE_JUMP_POLE);
    }
  }
  updateJumpState() {
    const distanceWinner = this.flagpole.x - this.winner.x;
    if(distanceWinner <= 0) {
      this.winner.body.velocity.x = 0;
      this.setSubState(SUBSTATE_FINISHED);
    }
  }
  updateFinishedState() {
    this.flagpole.flag.y = this.winner.y - this.flagpole.y;
  }
  setSubState(value) {
    this.subState = value;
    this.playButton.visible = false;
    this.stopButton.visible = false;
    if(this.subState === SUBSTATE_PLAY) {
      this.stopButton.visible = true;
      // this.peach.run(100);
      // this.mario.run(50);
    } else if(this.subState === SUBSTATE_JUMP_POLE){
      this.stopButton.visible = true;
      this.loser.stand();
      this.winner.jump();
    } else if(this.subState === SUBSTATE_FINISHED){
      this.playButton.visible = true;
    } else {
      this.playButton.visible = true;
    }
  }
  playClicked() {
    this.setSubState(SUBSTATE_PLAY);
  }
  stopClicked() {
    this.state.start(`Play`);
  }
}
