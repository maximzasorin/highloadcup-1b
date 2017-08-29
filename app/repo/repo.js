const Schema = require('./schema');

var Repo = function () {
    this.map = new Map;
    this.schema = null;
};

Repo.prototype.get = function (id) {
    return this.map.get(parseInt(id));
};

Repo.prototype.has = function (id) {
    return this.map.has(parseInt(id));
};

Repo.prototype.insert = function (entity) {
    this.map.set(entity.id, entity);
};

Repo.prototype.update = function (entity, newEntity) {
    Object.assign(entity, newEntity);
};

Repo.prototype.transform = function (entity) {
    return {};
};

Repo.prototype.parse = function (data, options) {
    if (!this.schema) {
        return false;
    }

    return this.schema.parse(data, options);
};

module.exports = Repo;