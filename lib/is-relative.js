module.exports = function isRelative(dependency) {
	return dependency.indexOf('..') === 0 ||
		dependency.indexOf('.') === 0 ||
		dependency.indexOf('/') === 0;
};
