const express = require('express'),
    bodyParser = require('body-parser'),
    hlcup = require('./hlcup'),
    data = require('./data'),
    util = require('./util'),
    http = require('./http');

const PORT = 80;
const HOST = '0.0.0.0';

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

// Expose server
const app = express();

// Body parser
app.use(bodyParser.json());

// Routes
require('./controllers/locations')(app);
require('./controllers/users')(app);
require('./controllers/visits')(app);

// Default route
app.use(function (req, res, next) {
    return http.s404(res);
});

// Listen
app.listen(PORT, HOST);