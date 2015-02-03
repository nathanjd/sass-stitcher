var fs = require('fs'),
	path = require('path'),
	semver = require('semver'),

	Package = require('./lib/package'),
	buildDependencyGraph = require('./lib/build-dependency-graph'),
	uniqueDependencyOrder = require('./lib/unique-dependency-order'),

	Foo = require('@nathanjd/foo'),
	Baz = require('@nathanjd/baz');

function getSassImports(entryPath, cwd, npmScope) {
	// Build dependency graph.
	var dependencyGraph = buildDependencyGraph('index.js', cwd, npmScope),
		imports = [];

	console.log('dep graph', dependencyGraph);

	// Get flat order from graph.
	var sortedDependencies = dependencyGraph.overallOrder();

	console.log('ordered', sortedDependencies);

	// Replace all deps with the latest version already present in the graph.
	sortedUniqueDependencies = uniqueDependencyOrder(sortedDependencies);

	console.log('uniqued', sortedUniqueDependencies);

	// Output import statements to a stream
	sortedUniqueDependencies.forEach(function (pkgId) {
		var pkg = Package.prototype.cache[pkgId];

		if (!pkg) {
			return;
		}

		if (pkg.settings.styles && pkg.settings.styles.length) {
			pkg.settings.styles.forEach(function (style) {
				imports.push('@import "' + pkg.dir + '/' + style + '";');
			});
		}
	});

	return imports.join('\n');
};

module.exports = getSassImports;

console.log(getSassImports('index.js', process.cwd(), '@nathanjd'));
