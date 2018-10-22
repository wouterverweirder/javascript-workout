import events from 'events';

const POLARH7_HRM_HEART_RATE_SERVICE_UUID = `180d`;
const POLARH7_HRM_MEASUREMENT_CHARACTERISTIC_UUID = `2a37`;
const serviceUUIDs = [POLARH7_HRM_HEART_RATE_SERVICE_UUID];

export default class PolarH7 extends events.EventEmitter {
  constructor() {
    super();
    console.log(`[PolarH7] constructor`);

    this.polarH7Peripheral = false;
    this._stateChangeHandler = state => this.stateChangeHandler(state);
    this._discoverHandler = peripheral => this.discoverHandler(peripheral);

    this.noble = requireNode(`noble-mac`);
    this.noble.on(`stateChange`, this._stateChangeHandler);
    this.noble.on(`discover`, this._discoverHandler);
  }

  stateChangeHandler(state) {
    console.log(`[PolarH7] stateChange`, state);
    this.emit(`stateChange`, state);
    if(state === `poweredOn`) {
      this.noble.startScanning(serviceUUIDs);
    } else {
      this.noble.stopScanning();
    }
  }

  discoverHandler(peripheral) {
    console.log(`[PolarH7] discoverHandler`);
    let foundSuitablePeripheral = false;
    for (let i = peripheral.advertisement.serviceUuids.length - 1; i >= 0; i--) {
      if(peripheral.advertisement.serviceUuids[i] === POLARH7_HRM_HEART_RATE_SERVICE_UUID) {
        foundSuitablePeripheral = true;
        break;
      }
    }
    if(foundSuitablePeripheral) {
      this.onFoundSuitablePeripheral(peripheral);
    } else {
      console.log(`[PolarH7] no suitable peripheral`);
    }
  }

  onFoundSuitablePeripheral(peripheral) {
    console.log(`[PolarH7]`, peripheral.advertisement.localName);
    this.noble.stopScanning();
    this.polarH7Peripheral = peripheral;
    this.polarH7Peripheral.connect(error => this.onConnect(error));
  }

  onConnect(error) {
    if(error) {
      console.error(error);
      return;
    }
    console.log(`[PolarH7] on connect`);
    this.emit(`connect`);
    this.polarH7Peripheral.discoverServices([], (error, services) => this.onPeripheralDiscoverServices(error, services));
  }

  onPeripheralDiscoverServices(error, services) {
    console.log(`[PolarH7] onPeripheralDiscoverServices`);
    for (let i = services.length - 1; i >= 0; i--) {
      if(services[i].name) {
        console.log(services[i].uuid, services[i].name);
        services[i].discoverCharacteristics([], (error, characteristics) => this.onPeripheralServiceDiscoverCharacteristics(error, characteristics));
      }
    }
  }

  onPeripheralServiceDiscoverCharacteristics(error, characteristics) {
    for (let i = characteristics.length - 1; i >= 0; i--) {
      const characteristic = characteristics[i];
      if(characteristic.uuid === POLARH7_HRM_MEASUREMENT_CHARACTERISTIC_UUID) {
        //console.log("HRM Characteristic");
        characteristic.on(`read`, (data, isNotification) => this.onHeartRateRead(data, isNotification));
        characteristic.notify(true, error => (error) ? console.log(error) : true);
      }
    }
  }

  onHeartRateRead(data, isNotification) { // eslint-disable-line no-unused-vars
    if((data[0] & 0x01) === 0) {
      const heartRate = data[1];
      if(heartRate) {
        this.emit(PolarH7.HEART_RATE, heartRate);
        // var filePath = Config.heartRateFilePath;
        // fs.appendFile(filePath, new Date().getTime() + ":" + heartRate + "\n", function (err) {
        // 	console.log(err);
        // });
      }
    }
  }
}

PolarH7.HEART_RATE = `heartRate`;
