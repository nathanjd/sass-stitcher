var fs = require('fs'),
	path = require('path'),
	DepGraph = require('dependency-graph').DepGraph,
	detective = require('detective'),

	Package = require('./package'),
	isRelative = require('./is-relative');

function buildDependencyGraph(entryPath, cwd, npmScope) {
	var graph = new DepGraph(),
		entrySource = fs.readFileSync(entryPath),

		// Find Dependencies.
		requires = detective.find(entrySource);

	graph.addNode(entryPath);

	requires.strings.forEach(
		addDependencyToGraph(graph, cwd, entryPath, npmScope)
	);

	return graph;
}

function addDependencyToGraph(graph, cwd, parent, npmScope) {
	return function (dependency) {
		var moduleDir,
			pkg,
			mainPath,
			mainSource,
			requires;

		if (isRelative(dependency)) {
			return;
		}

		// For faster builds, filter out modules not in scope.
		if (npmScope && dependency.indexOf(npmScope) === -1) {
			return;
		}

		pkg = Package.prototype.get(cwd, dependency);

		if (!pkg) {
			return false;
		}

		// Add node to the graph.
		graph.addNode(pkg.id);

		// Connect this node.
		graph.addDependency(parent, pkg.id);

		// Crawl for sub-dependencies.
		mainPath = path.resolve(pkg.dir, pkg.settings.main);
		mainSource = fs.readFileSync(mainPath);

		requires = detective.find(mainSource);

		requires.strings.forEach(
			addDependencyToGraph(graph, pkg.dir, pkg.id, npmScope)
		);
	};
}

module.exports = buildDependencyGraph;
