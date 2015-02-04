var fs = require('fs'),
	path = require('path'),

	findPackagePath = require('./find-package-path'),

	pkgCache = {};

// A wrapper for npm packages.
function Package(settings, path) {
	this.settings = settings;
	this.path = path;
	this.id = settings.name + '~' + settings.version;

	// Cache this package to prevent further crawling of the user's file system.
	pkgCache[this.id] = this;
}

Package.prototype.cache = pkgCache;

Package.prototype.get = function (identifier, cwd) {
	var packagePath,
		settingsPath,
		settingsSource,
		settings;

	if (!cwd) {
		cwd = process.cwd();
	}

	packagePath = findPackagePath(identifier, cwd);

	if (!packagePath) {
		return false;
	}

	settingsPath = path.resolve(packagePath, 'package.json');

	if (!fs.existsSync(settingsPath)) {
		return false;
	}

	// TODO: If permission error, suggest `npm install`
	settingsSource = fs.readFileSync(settingsPath);
	settings = JSON.parse(settingsSource);

	return new Package(settings, packagePath);
};

module.exports = Package;
