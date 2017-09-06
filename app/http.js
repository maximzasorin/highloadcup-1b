const express = require('express'),
    bodyParser = require('body-parser');

function Http() {
	this.PORT = 80;
	this.HOST = '0.0.0.0';

	this.app = express();
	this.app.use(bodyParser.json());
};

Http.prototype.get = function (route, func) {
	this.app.get(route, func);
};

Http.prototype.post = function (route, func) {
	this.app.post(route, func);
};

Http.prototype.listen = function () {
	// Default route
	this.app.use((req, res, next) => {
	    return this.s404(res);
	});

	// Listen
	this.app.listen(this.PORT, this.HOST);
};

Http.prototype.parseQuery = function(schema, req) {
	return schema.parse(req.query, { required: false });
};

Http.prototype.send = function(res, data) {
	return res.json(data).end();
};

Http.prototype.empty = function(res) {
	return res.send('{}');
};

Http.prototype.s = function(res, status) {
	return res.status(status).end();
};

Http.prototype.s400 = function(res) {
	return this.s(res, 400);
};

Http.prototype.s404 = function(res) {
	return this.s(res, 404);
};

module.exports = new Http;