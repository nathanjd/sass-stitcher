var fs = require('fs'),
	path = require('path'),
	DepGraph = require('dependency-graph').DepGraph,
	detective = require('detective'),

	Package = require('./package');

function buildDependencyGraph(entryPath, cwd) {
	var graph = new DepGraph(),
		entrySource = fs.readFileSync(entryPath),

		rootId = path.resolve(cwd, entryPath),

		// Find Dependencies.
		requires = detective.find(entrySource);

	// Add root node to graph.
	graph.addNode(rootId);

	// Add all dependencies to graph.
	requires.strings.forEach(addModuleToGraph(graph, cwd, rootId));

	return graph;
}

function addModuleToGraph(graph, cwd, parent) {
	return function (identifier) {
		// Attempt to load module as a package.
		var pkg = Package.prototype.get(identifier, cwd),

			modulePath   = pkg ? path.resolve(pkg.path, pkg.settings.main) :
				path.resolve(cwd, identifier + '.js'),
			moduleDir    = pkg ? pkg.path : path.dirname(modulePath),
			moduleId     = pkg ? pkg.id : modulePath,
			moduleSource,

			requires;

		if (!fs.existsSync(modulePath)) {
			return;
		}

		moduleSource = fs.readFileSync(modulePath);

		// Add node to the graph for this package.
		graph.addNode(moduleId);

		// Connect this node.
		graph.addDependency(parent, moduleId);

		// Crawl for sub-dependencies.
		requires = detective.find(moduleSource);

		// Add sub-dependencies to graph.
		requires.strings.forEach(
			addModuleToGraph(graph, moduleDir, moduleId)
		);
	};
}

module.exports = buildDependencyGraph;
