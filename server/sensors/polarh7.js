var config = require('../config'),
	events = require('events'),
	util = require('util');

var POLARH7_HRM_HEART_RATE_SERVICE_UUID = "180d";

var POLARH7_HRM_MEASUREMENT_CHARACTERISTIC_UUID = "2a37";

var serviceUUIDs = [POLARH7_HRM_HEART_RATE_SERVICE_UUID];

function PolarH7() {
	events.EventEmitter.call(this);
	console.log("[PolarH7] constructor");

	this.polarH7Peripheral = false;

	this._stateChangeHandler = this.stateChangeHandler.bind(this);
	this._discoverHandler = this.discoverHandler.bind(this);

	this.noble = require('noble');
	this.noble.on('stateChange', this._stateChangeHandler);
	this.noble.on('discover', this._discoverHandler);
}

util.inherits(PolarH7, events.EventEmitter);

PolarH7.HEART_RATE = 'heartRate';

PolarH7.getInstance = function() {
	if(!PolarH7.instance) {
		PolarH7.instance = new PolarH7();
	}
	return PolarH7.instance;
};

PolarH7.prototype.stateChangeHandler = function(state) {
	console.log('[PolarH7] stateChange', state);
	this.emit('stateChange', state);
	if(state === 'poweredOn') {
		this.noble.startScanning(serviceUUIDs);
	} else {
		this.noble.stopScanning();
	}
};

PolarH7.prototype.discoverHandler = function(peripheral) {
	var foundSuitablePeripheral = false;
	for (var i = peripheral.advertisement.serviceUuids.length - 1; i >= 0; i--) {
		if(peripheral.advertisement.serviceUuids[i] === POLARH7_HRM_HEART_RATE_SERVICE_UUID) {
			foundSuitablePeripheral = true;
			break;
		}
	};
	if(foundSuitablePeripheral) {
		this.onFoundSuitablePeripheral(peripheral);
	} else {
		console.log('[PolarH7] no suitable peripheral');
	}	
};

PolarH7.prototype.onFoundSuitablePeripheral = function(peripheral) {
	console.log("[PolarH7]", peripheral.advertisement.localName);
	this.noble.stopScanning();
	this.polarH7Peripheral = peripheral;
	this.polarH7Peripheral.connect(this.onConnect.bind(this));
};

PolarH7.prototype.onConnect = function(error) {
	console.log("[PolarH7] on connect");
	this.emit('connect');
	this.polarH7Peripheral.discoverServices([], this.onPeripheralDiscoverServices.bind(this));
};

PolarH7.prototype.onPeripheralDiscoverServices = function(error, services) {
	console.log("[PolarH7] onPeripheralDiscoverServices");
	for (var i = services.length - 1; i >= 0; i--) {
		if(services[i].name) {
			console.log(services[i].uuid, services[i].name);
			services[i].discoverCharacteristics([], this.onPeripheralServiceDiscoverCharacteristics.bind(this));
		}
	}	
};

PolarH7.prototype.onPeripheralServiceDiscoverCharacteristics = function(error, characteristics) {
	for (var i = characteristics.length - 1; i >= 0; i--) {
		var characteristic = characteristics[i];
		if(characteristic.uuid === POLARH7_HRM_MEASUREMENT_CHARACTERISTIC_UUID) {
			//console.log("HRM Characteristic");
			characteristic.on('read', this.onHeartRateRead.bind(this));
			characteristic.notify(true, function(error){
				if(error) {
					console.log(error);
				}
			});
		}
	};	
};

PolarH7.prototype.onHeartRateRead = function(data, isNotification) {
	if((data[0] & 0x01) === 0) {
		var heartRate = data[1];
		if(heartRate) {
			this.emit(PolarH7.HEART_RATE, heartRate);
		}
	}
};

module.exports = PolarH7;