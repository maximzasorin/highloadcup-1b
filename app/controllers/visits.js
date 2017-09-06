const repo = require('../repo/visits'),
    http = require('../http'),
    controller = require('./controller');

module.exports = function () {
    controller('visits', repo);
};