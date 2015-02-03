var fs = require('fs'),
	path = require('path');

module.exports = function findModuleDir(cwd, dependency, climb) {
	var moduleDir,
		parentDir;

	if (climb) {
		parentDir = path.resolve(cwd, '..');

		if (cwd === parentDir) {
			return false;
		}

		cwd = parentDir;
	}

	moduleDir = path.resolve(cwd, 'node_modules', dependency);

	if (!fs.existsSync(moduleDir)) {
		return findModuleDir(cwd, dependency, true);
	}

	return moduleDir;
};
