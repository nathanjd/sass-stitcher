// Determines if a node module identifier is relative.
module.exports = function isRelative(identifier) {
	return identifier.indexOf('..') === 0 ||
		identifier.indexOf('.') === 0 ||
		identifier.indexOf('/') === 0;
};
