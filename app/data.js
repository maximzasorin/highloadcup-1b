const locations = require('./repo/locations');
	users = require('./repo/users'),
	visits = require('./repo/visits')

module.exports = {
	locations,
	users,
	visits,

	insertBatch(collection, items) {
		if (!this[collection]) {
			return false;
		}

		items.forEach(item => {
			this[collection].insert(item);
		});

		return true;
	}
};