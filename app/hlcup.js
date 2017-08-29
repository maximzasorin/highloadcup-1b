const path = require('path'),
	fs = require('fs');

const dataDirectory = '/data/initial/';

exports.parseOptions = function () {
	let optionsFile = fs.readFileSync('/tmp/data/options.txt', 'utf-8');
	let options = optionsFile.split("\n");

	global.NOW = options[0] * 1000;
	global.MODE = options[1];
};

exports.loadData = function (callback) {
    fs.readdirSync(dataDirectory).forEach(file => {
        if (path.extname(file) != '.json') {
            return;
        }

        let data = fs.readFileSync(dataDirectory + file, 'utf-8');
        let json = JSON.parse(data);
        delete data;

        let name = Object.keys(json)[0];

        callback(name, json[name], file);
    });

    callback();
};