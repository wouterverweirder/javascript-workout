var config = require('../config'),
	events = require('events'),
	util = require('util'),
	noble = require('noble');

var POLARH7_HRM_HEART_RATE_SERVICE_UUID = "180d";

var POLARH7_HRM_MEASUREMENT_CHARACTERISTIC_UUID = "2a37";

var serviceUUIDs = [POLARH7_HRM_HEART_RATE_SERVICE_UUID];
var polarH7Peripheral = false;
var that;

function PolarH7() {
	events.EventEmitter.call(this);
	that = this;
	console.log("[PolarH7] constructor");

	noble.on('stateChange', stateChangeHandler);
	noble.on('discover', discoverHandler);
}

util.inherits(PolarH7, events.EventEmitter);

function stateChangeHandler(state) {
	console.log('[PolarH7] stateChange', state);
	that.emit('stateChange', state);
	if(state === 'poweredOn') {
		noble.startScanning(serviceUUIDs);
	} else {
		noble.stopScanning();
	}
}

function discoverHandler(peripheral) {
	var foundSuitablePeripheral = false;
	for (var i = peripheral.advertisement.serviceUuids.length - 1; i >= 0; i--) {
		if(peripheral.advertisement.serviceUuids[i] === POLARH7_HRM_HEART_RATE_SERVICE_UUID) {
			foundSuitablePeripheral = true;
			break;
		}
	};
	if(foundSuitablePeripheral) {
		onFoundSuitablePeripheral(peripheral);
	} else {
		console.log('[PolarH7] no suitable peripheral');
	}
}

function onFoundSuitablePeripheral(peripheral) {
	console.log("[PolarH7]", peripheral.advertisement.localName);
	noble.stopScanning();
	polarH7Peripheral = peripheral;
	polarH7Peripheral.connect(onConnect);
}

function onConnect(error) {
	console.log("[PolarH7] on connect");
	that.emit('connect');
	polarH7Peripheral.discoverServices([], onPeripheralDiscoverServices);
}

function onPeripheralDiscoverServices(error, services) {
	for (var i = services.length - 1; i >= 0; i--) {
		if(services[i].name) {
			//console.log(services[i].uuid, services[i].name);
			services[i].discoverCharacteristics([], onPeripheralServiceDiscoverCharacteristics);
		}
	};
}

function onPeripheralServiceDiscoverCharacteristics(error, characteristics) {
	for (var i = characteristics.length - 1; i >= 0; i--) {
		var characteristic = characteristics[i];
		if(characteristic.uuid === POLARH7_HRM_MEASUREMENT_CHARACTERISTIC_UUID) {
			//console.log("HRM Characteristic");
			characteristic.on('read', function(data, isNotification){
				if((data[0] & 0x01) === 0) {
					that.emit('heartRate', data[1]);
				}
			});
			characteristic.notify(true, function(error){
				console.log(error);
			});
		}
	};
}

module.exports = PolarH7;