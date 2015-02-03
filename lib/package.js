var fs = require('fs'),
	path = require('path'),

	findModuleDir = require('./find-module-dir'),

	pkgCache = {};

function Package(pkg, dir) {
	this.settings = pkg;
	this.dir = dir;
	this.id = pkg.name + '~' + pkg.version;

	pkgCache[this.id] = this;
}

Package.prototype.cache = pkgCache;

Package.prototype.get = function (cwd, dependency) {
	var moduleDir,
		pkgPath,
		pkgSource,
		pkg,
		settings;

	if (!cwd) {
		cwd = process.cwd();
	}

	moduleDir = findModuleDir(cwd, dependency);

	if (!moduleDir) {
		return false;
	}

	pkgPath = path.resolve(moduleDir, 'package.json');

	if (!fs.existsSync(pkgPath)) {
		return false;
	}

	// TODO: If permission error, suggest `npm install`
	pkgSource = fs.readFileSync(pkgPath);
	settings = JSON.parse(pkgSource);

	pkg = new Package(settings, moduleDir);

	return pkg;
};

module.exports = Package;
