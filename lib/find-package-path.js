var fs = require('fs'),
	path = require('path'),

	isRelative = require('./is-relative');

// http://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders
// Returns null if not a package identifier.
// Returns false if package not found.
module.exports = function findPackagePath(identifier, cwd, climb) {
	var packagePath,
		parentPath;

	if (isRelative(identifier)) {
		return null;
	}

	if (climb) {
		parentPath = path.resolve(cwd, '..');

		if (cwd === parentPath) {
			return false;
		}

		cwd = parentPath;
	}

	packagePath = path.resolve(cwd, 'node_modules', identifier);

	if (!fs.existsSync(packagePath)) {
		return findPackagePath(identifier, cwd, true);
	}

	// Found package path.
	return packagePath;
};
