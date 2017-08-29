const repo = require('../repo/visits'),
    http = require('../http'),
    controller = require('./controller');

module.exports = function (app) {
    controller(app, 'visits', repo);
};