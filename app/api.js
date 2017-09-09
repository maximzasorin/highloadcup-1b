const http = require('http'),
	querystring = require('querystring'),
	storage = require('./storage');

function Api() {
	this.PORT = 80;
	this.routes = [];
};

Api.prototype.listen = function () {
	const server = http.createServer((req, res) => {
		let parts = req.url.split('/');

		if (req.method == 'GET') {
			if (parts.length >= 3) {
				let id = parseInt(parts[2])

				if (id) {
					// GET /(locations|visits|users)/xx
					if (parts.length == 3) {
						return this.getEntity(res, parts[1], id);
					} else if (parts.length == 4) {
						// GET /users/xx/visits?fromAge=...
						if (parts[1] == 'users') {
							return this.getUserVisits(res, id, parts[3].substring(7));
						// GET /locations/xx/avg?fromAge=...
						} else if (parts[1] == 'locations') {
							this.sendLocationAvg(res, id, parts[3].substring(4));
						}
					}
				}
			}
		} else if (req.method == 'POST') {
			if (parts.length == 3) {
				if (parts[2].substring(0, 3) == 'new') {
					return this.insertEntity(res, parts[1], req);
				} else {
					let id = parseInt(parts[2]);

					if (id) {
						return this.updateEntity(res, parts[1], id, req);
					}
				}
			}
		}

		this.s404(res);
	});

	server.listen(this.PORT);
};

Api.prototype.getEntity = function(res, collection, id) {
	let entity = storage.getTransformed(collection, id);

    if (!entity) {
        return this.s404(res);
    }

    this.send(res, entity);
}

Api.prototype.insertEntity = function(res, collection, req) {
	this.readBody(req, body => {
		let entity = storage.parse(collection, body);

	    if (!entity) {
	        return this.s400(res);
	    }

	    storage.insert(collection, entity);

	    this.empty(res);
	});
};

Api.prototype.updateEntity = function(res, collection, id, req) {
	let entity = storage.get(collection, id);

    if (!entity) {
        return this.s404(res);
    }

    this.readBody(req, body => {
    	let newEntity = storage.parse(collection, body, { required: false });

	    if (!newEntity || !Object.keys(newEntity).length) {
	        return this.s400(res);
	    }

	    storage.update(collection, entity, newEntity);

	    return this.empty(res);
    });
};

Api.prototype.getUserVisits = function(res, id, query) {
	let user = storage.get('users', id);

	if (!user) {
		return this.s404(res);
	}

	let filter = this.parseQuery(storage.visitsFilter(), query);

    if (!filter) {
        return this.s400(res);
    }

    this.send(res, storage.getTransformedVisits(user, filter));
};

Api.prototype.sendLocationAvg = function(res, id, query) {
	let location = storage.get('locations', id);

    if (!location) {
        return this.s404(res);
    }

    let filter = this.parseQuery(storage.avgFilter(), query);

    if (!filter) {
        return this.s400(res);
    }

    this.send(res, storage.getTransformedAvg(location, filter));
};

Api.prototype.parseQuery = function(schema, query) {
	return schema.parse(querystring.parse(query), { required: false });
};

Api.prototype.readBody = function(req, callback) {
	let body = [];

	req.on('data', (chunk) => {
		body.push(chunk);
	}).on('end', () => {
		body = Buffer.concat(body).toString();

		callback(body);
	});
};

Api.prototype.send = function(res, data) {
	this._send(res, Buffer.from(data));
};

Api.prototype._send = function(res, data) {
	data = Buffer.from(data);

	res.writeHead(200, {
		'Content-Type': 'application/json; charset=utf-8',
		'Content-Length': data.length
	});
	res.write(data);
	res.end();
};

Api.prototype.empty = function(res) {
	this.send(res, Buffer.from('{}'));
};

Api.prototype.s = function(res, status) {
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Content-Length': 0
	});
	res.end();
};

Api.prototype.s400 = function(res) {
	this.s(res, 400);
};

Api.prototype.s404 = function(res) {
	this.s(res, 404);
};

module.exports = new Api;