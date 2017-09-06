const http = require('../http');

module.exports = function (collection, repo) {
	http.get(Symbol(collection + '_get'), function (req, res) {
        let entity = repo.get(req.params.id);

        if (!entity) {
            return http.s404(res);
        }

        return http.send(res, repo.transform(entity));
    });

    http.post(Symbol(collection + '_new'), function (req, res) {
        let entity = repo.parse(req.body);

        if (!entity) {
            return http.s400(res);
        }

        repo.insert(entity);

        return http.empty(res);
    });

    http.post(Symbol(collection + '_update'), function (req, res) {
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