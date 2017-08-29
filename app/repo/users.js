const Repo = require('./repo'),
    Schema = require('./schema'),
    util = require('../util');

const Users = function () {
    Repo.apply(this, arguments);

    this.schema = new Schema({
        id: Schema.Number,
        email: Schema.String,
        first_name: Schema.String,
        last_name: Schema.String,
        gender: Schema.Gender,
        birth_date: Schema.Number,
    });
};

Users.prototype = Object.create(Repo.prototype);

Users.prototype.visitsFilter = function () {
    return new Schema({
        fromDate: Schema.Number,
        toDate: Schema.Number,
        country: Schema.String,
        toDistance: Schema.Number,
    });
};

Users.prototype.transform = function (user) {
    return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        gender: user.gender,
        birth_date: user.birth_date,
    };
};

Users.prototype.parse = function (data) {
    return Repo.prototype.parse.apply(this, arguments);
};

Users.prototype.insert = function (user) {
    Repo.prototype.insert.apply(this, arguments);
    
    user.visits = new Map;
};

Users.prototype.update = function (user, newUser) {
    return Repo.prototype.update.apply(this, arguments);
};

Users.prototype.addVisit = function (user, visit) {
    user.visits.set(visit.id, visit);
};

Users.prototype.removeVisit = function (user, visit) {
    user.visits.delete(visit.id);
};

Users.prototype.getVisits = function (user, filter) {
    let visits = [];
    let transform = require('./visits').transformForUser;

    for (let [id, visit] of user.visits) {
        if (filter.fromDate
            && (visit.visited_at <= parseInt(filter.fromDate))) {
            continue;
        }

        if (filter.toDate
            && visit.visited_at >= parseInt(filter.toDate)) {
            continue;
        }

        if (filter.country
            && visit.location.country != filter.country) {
            continue;
        }

        if (filter.toDistance
            && visit.location.distance >= parseInt(filter.toDistance)) {
            continue;
        }

        visits.push(transform(visit));
    }

    // Sorting
    visits.sort(function (a, b) {
        if (a.visited_at < b.visited_at) {
            return -1;
        }

        if (a.visited_at > b.visited_at) {
            return 1;
        }

        return 0;
    });

    return visits;
};

module.exports = new Users;