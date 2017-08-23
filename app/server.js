const path = require('path'),
	fs = require('fs')
	express = require('express'),
	bodyParser = require('body-parser');

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

// Data
let R = {
	users: new Map,
	visits: new Map,
	locations: new Map,
};

// Parse options
let optionsFile = fs.readFileSync('/tmp/data/options.txt', 'utf-8');
let options = optionsFile.split("\n");

global.NOW = options[0] * 1000;
global.MODE = options[1];

console.log('Options loaded.');

// Load data
let dataDirectory = '/data/initial/';

console.log('Initial data loading...');
console.time('Initial data loaded for');

fs.readdirSync(dataDirectory).forEach(file => {
	if (path.extname(file) != '.json') {
		return;
	}

	let data = fs.readFileSync(dataDirectory + file, 'utf-8');
	let json = JSON.parse(data);

	let name = Object.keys(json)[0];

	if (R[name]) {
		json[name].forEach(element => {
			R[name].set(element.id, element);
		});
	}
});

// Prepare data
R.users.forEach(user => {
	user.visits = [];
});

R.locations.forEach(location => {
	location.visits = [];
});

R.visits.forEach(visit => {
	let user = R.users.get(visit.user);

	if (user) {
		visit._user = user;
		user.visits.push(visit);
	}

	let location = R.locations.get(visit.location);

	if (location) {
		visit._location = location;
		location.visits.push(visit);
	}
});

// Expose server
const app = express();

// Body parser
app.use(bodyParser.json());

// Validators

function validateQuery(filterRules, req) {
	for (let param in filterRules) {
        let value = req.query[param];

        if (!value) {
            continue;
        }

        let type = filterRules[param];

        if (type == Number && isNaN(value)) {
            return false;
        } else if (Array.isArray(type) && !type.includes(value)) {
            return false;
        }
    }

    return true;
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
	return transform(visit, [
		'id', 'location', 'user', 'visited_at', 'mark'
	]);
}

function transformVisitForUser(visit) {
	let ret = transform(visit, [
		'mark', 'visited_at'
	]);

	ret.place = visit._location.place;

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

	// Validate query
	let filterRules = {
        fromDate: Number,
        toDate: Number,
        toDistance: Number,
    };

    if (!validateQuery(filterRules, req)) {
        return res.send(400).end();
    }

	let visits = [];

	user.visits.forEach(function (visit) {
		let filtered = true;

		// From date
		if (req.query.fromDate) {
			filtered &= visit.visited_at > parseInt(req.query.fromDate)
		}

		// To date
		if (req.query.fromDate) {
			filtered &= visit.visited_at < parseInt(req.query.toDate)
		}

		// Country
		if (req.query.country) {
            filtered &= visit._location.country == req.query.country;
        }

        // Country
		if (req.query.toDistance) {
            filtered &= visit._location.distance < parseInt(req.query.toDistance);
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

// app.post('/users/new', function (req, res) {
// 	R.users.set(parseInt(req.params.id), req.body);

// 	res.json({});
// });

// app.post('/users/:id', function (req, res) {
// 	let user = R.users.get(parseInt(req.params.id));

// 	if (!user) {
// 		return res.status(404);
// 	}

// 	res.json({});
// });

// Locations

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
    let filterRules = {
        fromDate: Number,
        toDate: Number,
        fromAge: Number,
        toAge: Number,
        gender: ['m', 'f'],
    };

    if (!validateQuery(filterRules, req)) {
        return res.status(400).end();
    }

    let sum = 0;
    let count = 0;

	location.visits.forEach(function (visit) {
		let filtered = true;

		// From date
        if (req.query.fromDate) {
        	filtered &= visit.visited_at > parseInt(req.query.fromDate);
        }

        // To date
        if (req.query.toDate) {
            filtered &= visit.visited_at < parseInt(req.query.toDate);
        }

        // Gender
        if (req.query.gender) {
            filtered &= visit._user.gender == req.query.gender;
        }

        // From age
        if (req.query.fromAge) {
        	filtered &= visit._user.birth_date < getTimeFromAge(parseInt(req.query.fromAge));
        }

        // To age
        if (req.query.toAge) {
            filtered &= visit._user.birth_date > getTimeFromAge(parseInt(req.query.toAge));
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

// Visits

app.get('/visits/:id', function (req, res) {
	let visit = R.visits.get(parseInt(req.params.id));

	if (!visit) {
		return res.status(404).end();
	}

	res.json(transformVisit(visit));
});

// Default route
app.use(function (req, res, next) {
	return res.status(404).end();
});

// Listen
app.listen(PORT, HOST);

console.timeEnd('Initial data loaded for');