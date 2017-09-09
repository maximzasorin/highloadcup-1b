let get = [
	'/users/xx',
	'/users/xx/visits?fromAge=xx...',
	'/locations/xx',
	'/locations/xx/avg?fromAge=xx...',
	'/visits/xx',
];

get.forEach(function (route) {
	let parts = [];
	let p = getRegExp.exec(route)

	if (p) {
		p.forEach((part) => { parts.push(part); });
	}

	console.log({route, parts});
})


// POST '/users/new'
// POST '/users/xx'
// POST '/locations/new'
// POST '/locations/xx'
// POST '/visits/new'
// POST '/visits/xx'