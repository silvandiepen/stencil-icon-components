const path = require("path");

const kebabCase = (str) =>
	str
		.match(/[A-Z]{2,}(?=[A-Z][a-z0-9]*|\b)|[A-Z]?[a-z0-9]*|[A-Z]|[0-9]+/g)
		.filter(Boolean)
		.map((x) => x.toLowerCase())
		.join("-");

const fileName = (str, settings = null) => {
	if (settings)
		return `${settings.options.prefix}${path
			.basename(str)
			.replace(path.extname(str), "")}`;
	else return `${path.basename(str).replace(path.extname(str), "")}`;
};

module.exports = { kebabCase, fileName };
