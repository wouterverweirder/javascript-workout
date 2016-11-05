const PLAYER_1_SPARK_ID = `55ff70065075555332171787`; //red one
const PLAYER_2_SPARK_ID = `53ff73065075535143191387`; //blue one

export default class SparkHeartRatesPlugin extends Phaser.Plugin {
  constructor(game, parent) {
    super(game, parent);
    this.connected = false;
  }
  init() {
    console.log(`SparkHeartRatesPlugin Plugin init`);
    this.player1 = {
      sparkId: PLAYER_1_SPARK_ID,
      heartRate: 0
    };
    this.player2 = {
      sparkId: PLAYER_2_SPARK_ID,
      heartRate: 0
    };
    this._udpErrorHandler = error => this.udpErrorHandler(error);
    this._udpMessageHandler = (message, remoteInfo) => this.udpMessageHandler(message, remoteInfo);
    this._udpListeningHandler = () => this.udpListeningHandler();
  }
  connect() {
    if(this.connected) {
      return;
    }
    console.log(`SparkHeartRatesPlugin connect`);
    this.connected = true;
    let dgram;
    try {
      dgram = (requireNode !== null) ? requireNode(`dgram`) : require(`dgram`);
    } catch (e) {
      console.error(e);
    }
    if(!dgram) {
      return;
    }
    this.udpSocket = dgram.createSocket(`udp4`);
    this.udpSocket.on(`error`, this._udpErrorHandler);
    this.udpSocket.on(`message`, this._udpMessageHandler);
    this.udpSocket.on(`listening`, this._udpListeningHandler);
    this.udpSocket.bind(1234);
  }
  close() {
    if(!this.connected) {
      return;
    }
    console.log(`SparkHeartRatesPlugin close`);
    this.connected = false;
    if(!this.udpSocket) {
      return;
    }
    this.udpSocket.removeListener(`error`, this._udpErrorHandler);
    this.udpSocket.removeListener(`message`, this._udpMessageHandler);
    this.udpSocket.removeListener(`listening`, this._udpListeningHandler);
    this.udpSocket.close();
    this.udpSocket = null;
  }
  udpErrorHandler(error) {
    console.log(`[SparkHeartRatesPlugin] udpErrorHandler`, error);
    this.udpSocket.close();
  }
  udpMessageHandler(message, remoteInfo) { // eslint-disable-line no-unused-vars
    const str = message.toString();
    const split = str.split(`;`);
    if(split.length > 2) {
      this.setHeartRate(split[0], split[2]);
    }
  }
  udpListeningHandler() {
    console.log(`[SparkHeartRatesPlugin] udpListening`);
  }
  setHeartRate(sparkId, heartRate) {
    heartRate = parseInt(heartRate);
    if(this.player1.sparkId === sparkId) {
      this.player1.heartRate = heartRate;
      return;
    }
    if(this.player2.sparkId === sparkId) {
      this.player2.heartRate = heartRate;
      return;
    }
  }
  destroy() {
    this.close();
    super.destroy();
  }
}
