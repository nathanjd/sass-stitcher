var semver = require('semver'),

	Package = require('./package');

function uniqueDependencyOrder(dependencyOrder) {
	function findLatest(pkg) {
		var latestPkg = pkg;

		dependencyOrder.forEach(function (otherPkgId) {
			var otherPkg = Package.prototype.cache[otherPkgId];

			if (!otherPkg) {
				return;
			}

			if (pkg.settings.name === otherPkg.settings.name &&
				semver.gt(otherPkg.settings.version, latestPkg.settings.version))
			{
				latestPkg = otherPkg;
			}
		});

		return latestPkg;
	}

	// Return the uniqued array.
	return dependencyOrder.map(function (pkgId) {
		var pkg = Package.prototype.cache[pkgId],
			latestPkg;

		if (!pkg) {
			return;
		}

		// Replace all packages with their latest version.
		return findLatest(pkg).id;
	}).filter(onlyUnique);
}

function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

module.exports = uniqueDependencyOrder;
