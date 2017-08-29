const Repo = require('./repo'),
    Schema = require('./schema'),
    util = require('../util');

const Locations = function () {
    Repo.apply(this, arguments);

    this.schema = new Schema({
        id: Schema.Number,
        place: Schema.String,
        country: Schema.String,
        city: Schema.String,
        distance: Schema.Number,
    });
};

Locations.prototype = Object.create(Repo.prototype);

Locations.prototype.avgFilter = function () {
    return new Schema({
        fromDate: Schema.Number,
        toDate: Schema.Number,
        fromAge: Schema.Number,
        toAge: Schema.Number,
        gender: Schema.Gender,
    });
};

Locations.prototype.transform = function (entity) {
    return {
        id: entity.id,
        country: entity.country,
        city: entity.city,
        place: entity.place,
        distance: entity.distance,
    };
};

Locations.prototype.parse = function (data) {
    return Repo.prototype.parse.apply(this, arguments);
};

Locations.prototype.insert = function (location) {
    Repo.prototype.insert.apply(this, arguments);

    location.visits = new Map;
};

Locations.prototype.update = function (location, newLocation) {
    return Repo.prototype.update.apply(this, arguments);
};

Locations.prototype.addVisit = function (location, visit) {
    location.visits.set(visit.id, visit);
};

Locations.prototype.removeVisit = function (location, visit) {
    location.visits.delete(visit.id);
};

Locations.prototype.getAvg = function (location, filter) {
    let count = 0;
    let sum = 0;

    let fromAge = filter.fromAge
        ? util.getTimeFromAge(filter.fromAge)
        : null;

    let toAge = filter.toAge
        ? util.getTimeFromAge(filter.toAge)
        : null;

    for (let [id, visit] of location.visits) {
        if (filter.fromDate
            && (visit.visited_at <= parseInt(filter.fromDate))) {
            continue;
        }

        if (filter.toDate
            && visit.visited_at >= parseInt(filter.toDate)) {
            continue;
        }

        if (filter.gender
            && visit.user.gender != filter.gender) {
            continue;
        }

        if (filter.fromAge && visit.user.birth_date >= fromAge) {
            continue;
        }

        if (filter.toAge && visit.user.birth_date <= toAge) {
            continue;
        }

        sum += visit.mark;
        count++;
    }

    return count
        ? util.round(sum / count)
        : 0;
};

module.exports = new Locations;