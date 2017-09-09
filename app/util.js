const Util = function () {};

let timeOfAge = new Map;

Util.prototype.round = function (value) {
    return Math.round(value * 100000) / 100000;
};

Util.prototype.calculateTimeFromAge = function (age) {
	let date = new Date(global.NOW);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setFullYear(date.getFullYear() - parseInt(age));

    return Math.floor(date.getTime() / 1000);
};

Util.prototype.getTimeFromAge = function (age) {
	return timeOfAge.get(age);
};

Util.prototype.init = function () {
	for (let year = 0; year < 150; year++) {
		timeOfAge.set(year.toString(), this.calculateTimeFromAge(year));
	}
}

module.exports = new Util;