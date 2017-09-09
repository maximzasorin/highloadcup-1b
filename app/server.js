const hlcup = require('./hlcup'),
    storage = require('./storage'),
    util = require('./util'),
    api = require('./api');

hlcup.parseOptions();

util.init();

console.time('Initial data loaded for');

hlcup.loadData(function (collection, entities, path) {
    if (!collection) {
        console.timeEnd('Initial data loaded for');

        if (global.gc) {
            global.gc();

            console.log('global.gc()');
        }

        return;
    }

    if (storage.insertBatch(collection, entities)) {
        console.log(entities.length + ' inserted into ' + collection + ' // ' + path);
    }
});

// Expose server
api.listen();