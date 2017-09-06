const http = require('../http');

module.exports = function (collection, repo) {
	http.get('/' + collection + '/:id', function (req, res) {
        let entity = repo.get(req.params.id);

        if (!entity) {
            return http.s404(res);
        }

        return http.send(res, repo.transform(entity));
    });

    http.post('/' + collection + '/new', function (req, res) {
        let entity = repo.parse(req.body);

        if (!entity) {
            return http.s400(res);
        }

        repo.insert(entity);

        return http.empty(res);
    });

    http.post('/' + collection + '/:id', function (req, res) {
        let entity = repo.get(req.params.id);

        if (!entity) {
            return http.s404(res);
        }

        let newEntity = repo.parse(req.body, { required: false });

        if (!newEntity || !Object.keys(newEntity).length) {
            return http.s400(res);
        }

        repo.update(entity, newEntity);

        return http.empty(res);
    });
};