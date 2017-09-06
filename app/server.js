const hlcup = require('./hlcup'),
    data = require('./data'),
    util = require('./util'),
    http = require('./http');

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

    if (data.insertBatch(collection, entities)) {
        console.log(entities.length + ' inserted into ' + collection + ' // ' + path);
    }
});

// Routes
require('./controllers/locations')();
require('./controllers/users')();
require('./controllers/visits')();

// Expose server
http.listen();