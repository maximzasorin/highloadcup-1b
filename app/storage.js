const locations = require('./repo/locations');
	users = require('./repo/users'),
	visits = require('./repo/visits');

function Storage() {
	this.locations = locations;
	this.users = users;
	this.visits = visits;
};

Storage.prototype.get = function(collection, id) {
	return this[collection].get(id);
};

Storage.prototype.getTransformed = function(collection, id) {
	let entity = this.get(collection, id);

	if (entity) {
		return JSON.stringify(this[collection].transform(entity));
	}

	return entity;
};

Storage.prototype.insert = function(collection, entity) {
	return this[collection].insert(entity);
};

Storage.prototype.parse = function(collection, body, options) {
	try {
		return this[collection].parse(JSON.parse(body), options);
	} catch (e) {
		return null;
	}
};

Storage.prototype.update = function(collection, entity, newEntity) {
	return this[collection].update(entity, newEntity);
};

Storage.prototype.visitsFilter = function() {
	return this.users.visitsFilter();
}

Storage.prototype.getVisits = function(user, filter) {
	return this.users.getVisits(user, filter);
};

Storage.prototype.getTransformedVisits = function(user, filter) {
	return JSON.stringify({ visits: this.getVisits(user, filter) });
}

Storage.prototype.avgFilter = function() {
	return this.locations.avgFilter();
}

Storage.prototype.getAvg = function(location, filter) {
	return this.locations.getAvg(location, filter);
};

Storage.prototype.getTransformedAvg = function(location, filter) {
	return JSON.stringify({ avg: this.getAvg(location, filter) });
};

Storage.prototype.insertBatch = function(collection, items) {
	if (!this[collection]) {
		return false;
	}

	items.forEach(item => {
		this[collection].insert(item);
	});

	return true;
};

module.exports = new Storage;