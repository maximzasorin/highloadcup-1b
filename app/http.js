const express = require('express'),
    bodyParser = require('body-parser'),

    http = require('http'),
    url = require('url');

function Http() {
	this.PORT = 80;
	this.routes = [];
};

Http.prototype.get = function (url, func) {
	this.routes.push({ method: 'GET', url, func });
};

Http.prototype.post = function (url, func) {
	this.routes.push({ method: 'POST', url, func });
};

Http.prototype.listen = function () {
	const server = http.createServer((req, res) => {
		let parsed = url.parse(pathname);

		if (req.url) {

		}

		// for (let route of this.routes) {
		// 	if (req.method == route.method && req.url == route.url) {
		// 		route.func(req, res);
		// 	}
		// }

		this.s404(res);
	});

	server.listen(this.PORT);
};

Http.prototype.parseQuery = function(schema, req) {
	return schema.parse(req.query, { required: false });
};

Http.prototype.send = function(res, data) {
	res.writeHead(200);
	res.write(data);
	res.end();
};

Http.prototype.empty = function(res) {
	res.writeHead(200);
	res.write('{}');
	res.end();
};

Http.prototype.s = function(res, status) {
	res.writeHead(status);
	res.end();
};

Http.prototype.s400 = function(res) {
	this.s(res, 400);
};

Http.prototype.s404 = function(res) {
	this.s(res, 404);
};

module.exports = new Http;