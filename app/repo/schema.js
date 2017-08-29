const Schema = function (fields) {
	this.fields = fields;
};

Schema.prototype.parse = function (data, options = { required: true }) {
	let ret = {};

    for (prop in this.fields) {
        if (data[prop] === undefined) {
        	if (options.required) {
            	return false;
            } else {
            	continue;
            }
        }

        if (data[prop] === null) {
            return false;
        }

        if (this.fields[prop] === Schema.Number
            && isNaN(data[prop])) {
            return false;
        }

        if (this.fields[prop] === Schema.Gender
            && data[prop] != 'm' && data[prop] != 'f') {
            return false;
        }

        ret[prop] = data[prop];
    }

    return ret;
};

Schema.Number = Symbol('number');
Schema.String = Symbol('string');
Schema.Gender = Symbol('gender');

module.exports = Schema;