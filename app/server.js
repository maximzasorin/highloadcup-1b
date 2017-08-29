const path = require('path'),
    fs = require('fs'),
    express = require('express'),
    bodyParser = require('body-parser'),
    unzip = require('unzip2');

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

let R = {
    visits: new Map,
    users: new Map,
    locations: new Map,
};

// Parse options
let optionsFile = fs.readFileSync('/tmp/data/options.txt', 'utf-8');
let options = optionsFile.split("\n");

global.NOW = options[0] * 1000;
global.MODE = options[1];

console.log('Options loaded.');

// Load data
let dataArchive = '/tmp/data/data.zip';

console.log('Initial data loading...');
console.time('Initial data loaded for');

// 
function parseData(callback) {
    fs.createReadStream(dataArchive)
        .pipe(unzip.Parse())
        .on('entry', function (entry) {
            if (path.extname(entry.path) != '.json') {
                return;
            }

            let chunks = [];

            // console.time('bufferize string from ' + entry.path);

            entry.on('data', (data) => {
                chunks.push(data);
            });

            entry.on('end', () => {
                // console.timeEnd('bufferize string from ' + entry.path);

                entry.autodrain();

                console.time('parse json from ' + entry.path);

                let string = Buffer.concat(chunks).toString();

                let json = JSON.parse(string);
                delete string;

                // console.timeEnd('parse json from ' + entry.path);

                let name = Object.keys(json)[0];

                if (R[name]) {
                    // console.time('copy objects to repo from ' + entry.path);
                    
                    json[name].forEach(element => {
                        R[name].set(element.id, element);
                    });
                    
                    // console.timeEnd('copy objects to repo from ' + entry.path);
                    
                    console.log('import ' + json[name].length + ' objects from ' + entry.path);
                }

                delete json;
            });
        })
        .on('close', function () {
            console.timeEnd('Initial data loaded for');

            callback();
        });
}

parseData(function () {
    // Prepare data
    console.time('prepare users');

    R.users.forEach(user => {
        user.visits = new Map;
    });

    console.timeEnd('prepare users');

    console.time('prepare locations');

    R.locations.forEach(location => {
        location.visits = new Map;
    });

    console.timeEnd('prepare locations');

    console.time('prepare visits');

    R.visits.forEach(visit => {
        let user = R.users.get(visit.user);
        if (user) {
            visit.user = user;
            user.visits.set(visit.id, visit);
        }

        let location = R.locations.get(visit.location);
        if (location) {
            visit.location = location;
            location.visits.set(visit.id, visit);
        }
    });

    console.timeEnd('prepare visits');
});

// Expose server
const app = express();

// Body parser
app.use(bodyParser.json());

// Validators

function schema(rules) {
    function validate(type, value) {
        if (value === null) {
            return false;
        } else if (type == Number && isNaN(value)) {
            return false;
        } else if (Array.isArray(type) && !type.includes(value)) {
            return false;
        }

        return true;
    }

    return {
        parse (data, required = true) {
            let ret = {};

            for (let prop in rules) {
                if (data[prop] === undefined) {
                    if (required) {
                        return false;
                    } else {
                        continue;
                    }
                }

                if (!validate(rules[prop], data[prop])) {
                    return false;
                }

                ret[prop] = data[prop];
            }

            return ret;
        }
    }
}

// Transformers

function transform(source, fields) {
    let ret = {};

    fields.forEach(function (field) {
        ret[field] = source[field];
    });

    return ret;
}

function transformUser(user) {
    return transform(user, [
        'id', 'first_name', 'last_name', 'birth_date', 'gender', 'email'
    ]);
}

function transformLocation(location) {
    return transform(location, [
        'id', 'place', 'country', 'city', 'distance'
    ]);
}

function transformVisit(visit) {
    let ret = transform(visit, [
        'id', 'visited_at', 'mark'
    ]);

    if (visit.location) {
        ret.location = visit.location.id;
    }

    if (visit.user) {
        ret.user = visit.user.id;
    }

    return ret;
}

function transformVisitForUser(visit) {
    let ret = transform(visit, [
        'mark', 'visited_at'
    ]);

    if (visit.location) {
        ret.place = visit.location.place;
    }

    return ret;
}

// Other
function getTimeFromAge(age) {
    let date = new Date(global.NOW);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setFullYear(date.getFullYear() - age);

    return Math.floor(date.getTime() / 1000);
}

function round(value) {
    return Math.round(value * 100000) / 100000;
}


// Routes

// Users

let userSchema = schema({
    id: Number,
    email: String,
    first_name: String,
    last_name: String,
    gender: ['m', 'f'],
    birth_date: Number,
});

let visitsFilter = schema({
    fromDate: Number,
    toDate: Number,
    country: String,
    toDistance: Number,
});

app.get('/users/:id', function (req, res) {
    let user = R.users.get(parseInt(req.params.id));

    if (!user) {
        return res.status(404).end();
    }

    res.json(transformUser(user));
});

app.get('/users/:id/visits', function (req, res) {
    let user = R.users.get(parseInt(req.params.id));

    if (!user) {
        return res.status(404).end();
    }

    let filter = visitsFilter.parse(req.query, false);

    if (!filter) {
        return res.status(400).end();
    }

    let visits = [];

    user.visits
        .forEach(function (visit) {
            let filtered = true;

            // From date
            if (filter.fromDate) {
                filtered &= visit.visited_at > parseInt(filter.fromDate)
            }

            // To date
            if (filter.toDate) {
                filtered &= visit.visited_at < parseInt(filter.toDate)
            }

            // Country
            if (filter.country) {
                filtered &= visit.location.country == filter.country;
            }

            // Country
            if (filter.toDistance) {
                filtered &= visit.location.distance < parseInt(filter.toDistance);
            }

            if (filtered) {
                visits.push(transformVisitForUser(visit));
            }
        });

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

    res.json({ visits });
});

app.post('/users/new', function (req, res) {
    let user = userSchema.parse(req.body);

    if (!user) {
        return res.status(400).end();
    }

    user.visits = new Map;
    R.users.set(user.id, user);

    res.json({});
});

app.post('/users/:id', function (req, res) {
    let user = R.users.get(parseInt(req.params.id));

    if (!user) {
        return res.status(404).end();
    }

    let newUser = userSchema.parse(req.body, false);

    if (!newUser) {
        return res.status(400).end();
    }

    if (!Object.keys(newUser).length) {
        return res.status(400).end();
    }

    Object.assign(user, newUser);

    res.json({});
});

// Locations

let locationSchema = schema({
    id: Number,
    place: String,
    country: String,
    city: String,
    distance: Number,
});

let locationFilter = schema({
    fromDate: Number,
    toDate: Number,
    fromAge: Number,
    toAge: Number,
    gender: ['m', 'f'],
});

app.get('/locations/:id', function (req, res) {
    let location = R.locations.get(parseInt(req.params.id));

    if (!location) {
        return res.status(404).end();
    }

    res.json(transformLocation(location));
});

app.get('/locations/:id/avg', function (req, res) {
    let location = R.locations.get(parseInt(req.params.id));

    if (!location) {
        return res.status(404).end();
    }

    // Validate filter params
    let filter = locationFilter.parse(req.query, false);

    if (!filter) {
        return res.status(400).end();
    }

    let sum = 0;
    let count = 0;

    location.visits
        .forEach(function (visit) {
            let filtered = true;

            // From date
            if (filter.fromDate) {
                filtered &= visit.visited_at > parseInt(filter.fromDate);
            }

            // To date
            if (filter.toDate) {
                filtered &= visit.visited_at < parseInt(filter.toDate);
            }

            // Gender
            if (filter.gender) {
                filtered &= visit.user.gender == filter.gender;
            }

            // From age
            if (filter.fromAge) {
                filtered &= visit.user.birth_date < getTimeFromAge(parseInt(filter.fromAge));
            }

            // To age
            if (filter.toAge) {
                filtered &= visit.user.birth_date > getTimeFromAge(parseInt(filter.toAge));
            }

            if (filtered) {
                sum += visit.mark;
                count++;
            }
        });

    let avg = count > 0
        ? round(sum / count)
        : 0;

    res.json({ avg });
});

app.post('/locations/new', function (req, res) {
    let location = locationSchema.parse(req.body);

    if (!location) {
        return res.status(400).end();
    }

    location.visits = new Map;
    R.locations.set(location.id, location);

    res.json({});
});

app.post('/locations/:id', function (req, res) {
    let location = R.locations.get(parseInt(req.params.id));

    if (!location) {
        return res.status(404).end();
    }

    let newLocation = locationSchema.parse(req.body, false);

    if (!newLocation) {
        res.status(400).end();
    }
    
    if (!Object.keys(newLocation).length) {
        return res.status(400).end();
    }

    Object.assign(location, newLocation);

    res.json({});
});

// Visits

let visitSchema = schema({
    id: Number,
    location: Number,
    user: Number,
    visited_at: Number,
    mark: Number,
});

app.get('/visits/:id', function (req, res) {
    let visit = R.visits.get(parseInt(req.params.id));

    if (!visit) {
        return res.status(404).end();
    }

    res.json(transformVisit(visit));
});

app.post('/visits/new', function (req, res) {
    let visit = visitSchema.parse(req.body);

    if (!visit) {
        return res.status(400).end();
    }

    R.visits.set(visit.id, visit);

    visit.user = R.users.get(visit.user);
    visit.user.visits.set(visit.id, visit);

    visit.location = R.users.get(visit.location);
    visit.location.visits.set(visit.id, visit);

    res.json({});
});

app.post('/visits/:id', function (req, res) {
    let visit = R.visits.get(parseInt(req.params.id));

    if (!visit) {
        return res.status(404).end();
    }

    let newVisit = visitSchema.parse(req.body, false);

    if (!newVisit || !Object.keys(newVisit).length) {
        return res.status(400).end();
    }

    // Сносим связь со старой локацией
    if (newVisit.user && newVisit.user != visit.user.id) {
        visit.user.visits.delete(visit.id);
    }

    // Сносим связь со старой локацией
    if (newVisit.location && newVisit.location != visit.location.id) {
        visit.location.visits.delete(visit.id);
    }

    // Обновляем свойства
    Object.assign(visit, newVisit);

    // Обновляем связи
    if (newVisit.user) {
        visit.user = R.users.get(visit.user);
        visit.user.visits.set(visit.id, visit);
    }

    if (newVisit.location) {
        visit.location = R.locations.get(visit.location);
        visit.location.visits.set(visit.id, visit);
    }

    res.json({});
});

// Default route
app.use(function (req, res, next) {
    return res.status(404).end();
});

// Listen
app.listen(PORT, HOST);