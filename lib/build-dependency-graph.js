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

	// Add root node to graph.
	graph.addNode(entryPath);

	// Add all dependencies to graph.
	requires.strings.forEach(
		addDependencyToGraph(graph, cwd, entryPath, npmScope)
	);

	return graph;
}

function addDependencyToGraph(graph, cwd, parent, npmScope) {
	return function (dependency) {
		var moduleId,
			moduleDir,
			pkg,
			mainPath,
			mainSource,
			requires;

		// Skip relative imports because they will not be packages.
		// if (isRelative(dependency)) {
		// 	return;
		// }

		// For faster builds, filter out modules not in scope.
		// if (npmScope && dependency.indexOf(npmScope) === -1) {
		// 	return;
		// }

		// Attempt to load module as a package.
		pkg = Package.prototype.get(cwd, dependency);

		// Skip modules that are not packages.
		// if (!pkg) {
		// 	return false;
		// }

		moduleId = pkg ? pkg.id : path.resolve(cwd, dependency);

		// Add node to the graph for this package.
		graph.addNode(moduleId);

		// Connect this node.
		graph.addDependency(parent, moduleId);

		// Crawl for sub-dependencies.
		mainPath = path.resolve(pkg.dir, pkg.settings.main);
		mainSource = fs.readFileSync(mainPath);

		requires = detective.find(mainSource);

		requires.strings.forEach(
			addDependencyToGraph(graph, pkg.dir, moduleId, npmScope)
		);
	};
}

module.exports = buildDependencyGraph;
