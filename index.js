var fs = require('fs'),
	path = require('path'),
	semver = require('semver'),

	Package = require('./lib/package'),
	buildDependencyGraph = require('./lib/build-dependency-graph'),
	uniqueDependencyOrder = require('./lib/unique-dependency-order');

function getSassImports(entryPath, cwd) {
	// Build dependency graph.
	var dependencyGraph = buildDependencyGraph('index.js', cwd),

		// Get flat order from graph.
		sortedDependencies = dependencyGraph.overallOrder(),

		// Replace all deps with the latest version already present in the graph.
		sortedUniqueDependencies = uniqueDependencyOrder(sortedDependencies);

		imports = [];

	// Build import statements.
	sortedUniqueDependencies.forEach(function (pkgId) {
		var pkg = Package.prototype.cache[pkgId];

		if (!pkg) {
			return;
		}

		if (pkg.settings.styles && pkg.settings.styles.length) {
			pkg.settings.styles.forEach(function (style) {
				imports.push('@import "' + pkg.path + '/' + style + '";');
			});
		}
	});

	return imports.join('\n');
};

module.exports = getSassImports;
