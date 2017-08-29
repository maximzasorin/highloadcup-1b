const repo = require('../repo/users'),
    http = require('../http'),
    controller = require('./controller');

module.exports = function (app) {
    controller(app, 'users', repo);

    app.get('/users/:id/visits', function (req, res) {
    	let user = repo.get(req.params.id);

    	if (!user) {
    		return http.s404(res);
    	}

    	let filter = http.parseQuery(repo.visitsFilter(), req);

        if (!filter) {
            return http.s400(res);
        }

        http.send(res, { visits: repo.getVisits(user, filter) });
    });
};