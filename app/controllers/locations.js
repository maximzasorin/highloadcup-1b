const repo = require('../repo/locations'),
    http = require('../http'),
    controller = require('./controller');

module.exports = function (app) {
    controller(app, 'locations', repo);

    app.get('/locations/:id/avg', function (req, res) {
        let location = repo.get(req.params.id);

        if (!location) {
            return http.s404(res);
        }

        let filter = http.parseQuery(repo.avgFilter(), req);

        if (!filter) {
            return http.s400(res);
        }

        return http.send(res, {
            avg: repo.getAvg(location, filter)
        });
    });
};