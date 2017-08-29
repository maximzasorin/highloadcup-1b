function Http() {};

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