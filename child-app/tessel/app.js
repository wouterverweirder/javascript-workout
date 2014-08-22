var tessel = require('tessel');

setInterval(function () {
    tessel.led[0].toggle();
}, 500);