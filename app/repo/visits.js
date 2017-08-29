const Repo = require('./repo'),
    Schema = require('./schema'),
    util = require('../util'),
    users = require('./users'),
    locations = require('./locations');

const Visits = function () {
    Repo.apply(this, arguments);

    this.schema = new Schema({
        id: Schema.Number,
        location: Schema.Number,
        user: Schema.Number,
        visited_at: Schema.Number,
        mark: Schema.Number,
    });
};

Visits.prototype = Object.create(Repo.prototype);

Visits.prototype.transform = function (visit) {
    return {
        id: visit.id,
        location: visit.location.id,
        user: visit.user.id,
        visited_at: visit.visited_at,
        mark: visit.mark,
    };
};

Visits.prototype.transformForUser = function (visit) {
    return {
        mark: visit.mark,
        visited_at: visit.visited_at,
        place: visit.location.place,
    };
};

Visits.prototype.insert = function (visit) {
    // Находим пользователя, сохранить его, добавить к нему визит
    visit.user = users.get(visit.user);
    users.addVisit(visit.user, visit);

    // Находим локацию, сохранить ее, добавить к ней визит
    visit.location = locations.get(visit.location);

    locations.addVisit(visit.location, visit);

    return Repo.prototype.insert.apply(this, arguments);
};

Visits.prototype.update = function (visit, newVisit) {
    // Сносим связь со старым пользователем
    if (newVisit.user && newVisit.user != visit.user.id) {
        users.removeVisit(visit.user, visit);
    }

    // Сносим связь со старой локацией
    if (newVisit.location && newVisit.location != visit.location.id) {
        locations.removeVisit(visit.location, visit);
    }

    // Обновляем свойства
    Object.assign(visit, newVisit);

    // Находим нового пользователя, сохранить его, добавляем к нему визит
    if (newVisit.user) {
        visit.user = users.get(visit.user);
        users.addVisit(visit.user, visit);
    }

    // Находим новую локацию, сохранить ее, добавляем к ней визит
    if (newVisit.location) {
        visit.location = locations.get(visit.location);
        locations.addVisit(visit.location, visit);
    }
};

Visits.prototype.parse = function (data) {
    return Repo.prototype.parse.apply(this, arguments);
};

module.exports = new Visits;