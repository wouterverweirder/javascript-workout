import {Constants} from '../../../../shared/js/Constants';
import ContentBase from '../../../../shared/js/classes/ContentBase';

export default class ReactPhonesSlide extends ContentBase{

  constructor($slideHolder) {
    super($slideHolder);

    this.totalReactionSpeed = 0;
    this.numReactionSpeeds = 0;
    this.numCorrectAnswers = 1;
    this.averageReactionSpeed = 9999999;
    this.visiblePosition = 0;
    this.targetPosition = 0;
    this.lastAnswerTime = new Date();
    this.positions = [];

    this.$game = this.$slideHolder.find(`.game`);
    this.$slidesContainer = this.$slideHolder.find(`.react-phones-slides-container`);
    this.$slide1 = this.$slideHolder.find(`.react-phones-slide-1`);
    this.$slide1text = this.$slideHolder.find(`.react-phones-slide-1 .react-phones-slide-text`);
    this.$slide2 = this.$slideHolder.find(`.react-phones-slide-2`);
    this.$slide2text = this.$slideHolder.find(`.react-phones-slide-2 .react-phones-slide-text`);

    this.$slideHolder.find(`.touchbutton`).on(`touchstart`, $.proxy(this.onButtonTouchStart, this));
    this.$slideHolder.find(`.touchbutton`).on(`touchend`, $.proxy(this.onButtonTouchEnd, this));

    this.$slideHolder.find(`.touchbutton`).on(`mousedown`, $.proxy(this.onButtonTouchStart, this));
    this.$slideHolder.find(`.touchbutton`).on(`mouseup`, $.proxy(this.onButtonTouchEnd, this));

    this.resetGame();
  }

  onButtonTouchStart(e) {
    e.preventDefault();
    $(e.currentTarget).addClass(`down`);
    this.selectAnswer($(e.currentTarget).text());
  }

  onButtonTouchEnd(e) {
    e.preventDefault();
    $(e.currentTarget).removeClass(`down`);
  }

  selectAnswer(answer) {
    const now = new Date();
    const time = now.getTime() - this.lastAnswerTime.getTime();
    this.totalReactionSpeed += time;
    if(answer.toLowerCase() === this.positions[this.targetPosition].colorString.toLowerCase()) {
			//correct answer
      this.numCorrectAnswers++;
    } else {
			//penalty time
      this.totalReactionSpeed += 1000;
    }
    this.numReactionSpeeds++;
    this.lastAnswerTime = now;
    this.targetPosition++;
    this.fillPositionsWhenNeeded();
		//send to server
    this.postSocketMessage({
      target: {
        client: `presentation`,
        slide: this.name
      },
      content: {
        action: Constants.UPDATE_REACTION_SPEED,
        reactionSpeed: this.totalReactionSpeed / this.numCorrectAnswers
      }
    });
  }

  showCurrentState() {
    this.$slideHolder.find(`.substate`).removeClass(`active`);
    this.$game.css({
      'z-index': -1,
      opacity: 0.3,
      'pointer-events': `none`
    });
    if(this.substate === Constants.REACT_PHONES_GAME) {
      this.$slideHolder.find(`.substate-game`).addClass(`active`);
      this.$game.css({
        'z-index': 10,
        opacity: 1,
        'pointer-events': `auto`
      });
    } else if(this.substate === Constants.REACT_PHONES_FINISHED) {
      this.$slideHolder.find(`.substate-finished`).addClass(`active`);
    } else {
      this.$slideHolder.find(`.substate-intro`).addClass(`active`);
    }
  }

  onStateChanged() {
    if(this.state === Constants.STATE_ACTIVE) {
      this.resetGame();
    }
  }

  resetGame() {
    this.lastAnswerTime = new Date();
    this.totalReactionSpeed = 0;
    this.numReactionSpeeds = 0;
    this.numCorrectAnswers = 1;
    this.averageReactionSpeed = 9999999;
    this.visiblePosition = 0;
    this.targetPosition = 0;
    this.positions = [];
    this.fillPositionsWhenNeeded();
  }

  fillPositionsWhenNeeded() {
    const numPositionsToAdd = this.numReactionSpeeds + 2 - this.positions.length;
    for(let i = 0; i < numPositionsToAdd; i++) {
      const position = {
        colorString: (Math.random() > 0.5) ? `red` : `blue`,
        bgcolor: (Math.random() > 0.5) ? `#c6363d` : `#0684AF`
      };
      if(position.colorString === `red`) {
        position.color = `#c6363d`;
      } else {
        position.color = `#0684AF`;
      }
      this.positions.push(position);
    }
  }

  drawLoop() {
    this.visiblePosition += (this.targetPosition - this.visiblePosition) * 0.1;
    if(this.visiblePosition % 1 > 0.995) {
      this.visiblePosition = Math.round(this.visiblePosition);
    }
    this.$slidesContainer.css(`left`, `${this.visiblePosition * -100  }%`);

    const flooredVisiblePosition = Math.floor(this.visiblePosition);
    if(flooredVisiblePosition % 2 === 0) {
      this.$slide1.css({
        left: `${flooredVisiblePosition * 100  }%`,
        'background-color': this.positions[flooredVisiblePosition].bgcolor
      });
      this.$slide2.css({
        left: `${flooredVisiblePosition * 100 + 100  }%`,
        'background-color': this.positions[flooredVisiblePosition + 1].bgcolor
      });

      this.$slide1text.text(this.positions[flooredVisiblePosition].colorString);
      this.$slide2text.text(this.positions[flooredVisiblePosition + 1].colorString);
    } else {
      this.$slide2.css({
        left: `${flooredVisiblePosition * 100  }%`,
        'background-color': this.positions[flooredVisiblePosition].bgcolor
      });
      this.$slide1.css({
        left: `${flooredVisiblePosition * 100 + 100  }%`,
        'background-color': this.positions[flooredVisiblePosition + 1].bgcolor
      });

      this.$slide2text.text(this.positions[flooredVisiblePosition].colorString);
      this.$slide1text.text(this.positions[flooredVisiblePosition + 1].colorString);
    }
  }

  receiveSocketMessage(message) {
    if(!message.content) {
      return;
    }
    if(message.content.action === Constants.SET_SUBSTATE) {
      this.setSubstate(message.content.substate);
    }
  }

  setSubstate(substate) {
    if(this.substate !== substate) {
      this.substate = substate;
      this.showCurrentState();
    }
  }

}
