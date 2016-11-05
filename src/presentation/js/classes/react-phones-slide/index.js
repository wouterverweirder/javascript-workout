import {Constants} from '../../../../shared/js/Constants';
import ContentBase from '../../../../shared/js/classes/ContentBase';

export default class ReactPhonesSlide extends ContentBase {

  constructor($slideHolder) {
    super($slideHolder);

    this.gameDuration = 11;
    this.clientsMap = {};
    this.music = $(`#music`)[0];

    this.$slideHolder.find(`#ip`).text(this.settings.mobileServerUrl);

    this.$slideHolder.find(`.substate-intro .btn`).on(`click`, this.startClickHandler.bind(this));
    this.$slideHolder.find(`.substate-finished .btn`).on(`click`, this.winnerClickHandler.bind(this));

    this.setSubstate(Constants.REACT_PHONES_INTRO);
  }

  setSubstate(substate) {
    if(this.substate !== substate) {
      this.substate = substate;
      //send substate to mobile clients
      this.postSocketMessage({
        target: {
          client: `mobile`,
          slide: this.name
        },
        content: {
          action: Constants.SET_SUBSTATE,
          substate: this.substate
        }
      });
      if(this.substate === Constants.REACT_PHONES_GAME) {
        this.resetAllReactionSpeeds();
      }
      this.showCurrentState();
    }
  }

  receiveSocketMessage(message) {
    if(!message.content) {
      return;
    }
    if(message.content.action === `updateRoomList`) {
      //message.content.ids is an array with ids in this room
      const clientMapIds = _.keys(this.clientsMap);
      //which ids are new? (in message.content.ids but not in clientsMap)
      const newClientIds = _.difference(message.content.ids, clientMapIds);
      //which ids need to be removed? (in clientsMap but not in message.content.ids)
      const removeClientIds = _.difference(clientMapIds, message.content.ids);
      //update our map
      newClientIds.forEach(function(id){
        this.clientsMap[id] = {
          id: id,
          reactionSpeed: 99999999999
        };
        this.postSocketMessage({
          target: {
            client: `mobile`,
            slide: this.name
          },
          content: {
            action: Constants.SET_SUBSTATE,
            substate: this.substate
          }
        });
      }, this);
      removeClientIds.forEach(function(id){
        if(this.clientsMap[id]) {
          //this.clientsMap[id].$div.remove();
        }
        delete this.clientsMap[id];
      }, this);

      this.numClientsChanged();
    } else if(message.content.action === Constants.UPDATE_REACTION_SPEED) {
      console.log(message);
      if(!message.sender) {
        return;
      }
      //message.sender.id contains the origin id
      if(!this.clientsMap[message.sender.id]) {
        return;
      }
      console.log(`update reactionspeed to ${  message.content.reactionSpeed}`);
      this.clientsMap[message.sender.id].reactionSpeed = message.content.reactionSpeed;
    }
  }

  startClickHandler() {
    this.setSubstate(Constants.REACT_PHONES_GAME);
  }

  winnerClickHandler() {
    //get the clienthandler with the largest motion, and blink it's screen
    let winningClient = false;
    let reactionSpeed = 99999999999;
    for(const id in this.clientsMap) {
      if(!this.clientsMap[id].speedWinner && this.clientsMap[id].reactionSpeed < reactionSpeed) {
        winningClient = this.clientsMap[id];
        reactionSpeed = winningClient.reactionSpeed;
      }
    }
    if(winningClient) {
      winningClient.speedWinner = true;
      //send message to this client
      this.postSocketMessage({
        target: {
          client: winningClient.id
        },
        content: {
          action: Constants.BLINK,
          text: `<span style="font-size: 5em;">Spectacular, You Win!</span>`,
          backgroundColor: `red`
        }
      });
    }
  }

  resetAllReactionSpeeds() {
    for(const id in this.clientsMap) {
      this.clientsMap[id].reactionSpeed = 99999999999;
      this.clientsMap[id].speedWinner = false;
    }
  }

  numClientsChanged() {
    this.$slideHolder.find(`#connections span`).text(_.keys(this.clientsMap).length);
  }

  showCurrentState() {
    this.$slideHolder.find(`.substate`).removeClass(`active`);
    this.$slideHolder.find(`.slide`).css({
      backgroundImage: `none`
    });
    if(this.substate === Constants.REACT_PHONES_GAME) {
      this.music.play();
      this.$slideHolder.find(`.substate-game .countdown`).html(this.gameDuration);
      this.$slideHolder.find(`.substate-game`).addClass(`active`);
      this.countDownTimeout = setTimeout(this.countDownHandler.bind(this, this.gameDuration - 1), 1000);
    } else if(this.substate === Constants.REACT_PHONES_FINISHED) {
      this.$slideHolder.find(`.substate-finished`).addClass(`active`);
    } else {
      this.$slideHolder.find(`.slide`).css({
        backgroundRepeat: `no-repeat`,
        backgroundSize: `contain`,
        backgroundPosition: `center center`,
        backgroundImage: `url(assets/iphone-connections.png)`
      });
      this.$slideHolder.find(`.substate-intro`).addClass(`active`);
    }
  }

  countDownHandler(timeLeft) {
    this.$slideHolder.find(`.substate-game .countdown`).html(timeLeft);
    if(timeLeft > 0) {
      this.countDownTimeout = setTimeout(this.countDownHandler.bind(this, timeLeft - 1), 1000);
    } else {
      this.setSubstate(Constants.REACT_PHONES_FINISHED);
    }
  }

}
