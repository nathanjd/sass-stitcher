var fs = require('fs'),
	path = require('path'),
	DepGraph = require('dependency-graph').DepGraph,
	detective = require('detective'),

	Package = require('./package'),
	isRelative = require('./is-relative');

function buildDependencyGraph(entryPath, cwd) {
	var graph = new DepGraph(),
		entrySource = fs.readFileSync(entryPath),

		// Find Dependencies.
		requires = detective.find(entrySource);

	// Add root node to graph.
	graph.addNode(entryPath);

	// Add all dependencies to graph.
	requires.strings.forEach(addDependencyToGraph(graph, cwd, entryPath));

	return graph;
}

function addDependencyToGraph(graph, cwd, parent) {
	return function (dependency) {
		var moduleId,
			moduleDir,
			modulePath,
			moduleSource,
			pkg,
			requires;

		// Attempt to load module as a package.
		pkg = Package.prototype.get(cwd, dependency);

		moduleId = pkg ? pkg.id : path.resolve(cwd, dependency);
		modulePath = pkg ? path.resolve(pkg.dir, pkg.settings.main) :
			moduleId + '.js';
		moduleDir = pkg ? pkg.dir : path.dirname(modulePath);

		console.log(!pkg, cwd, dependency);
		console.log(moduleId, modulePath, moduleDir);

		// Add node to the graph for this package.
		graph.addNode(moduleId);

		// Connect this node.
		graph.addDependency(parent, moduleId);

		// Crawl for sub-dependencies.
		moduleSource = fs.readFileSync(modulePath);

		requires = detective.find(moduleSource);

		requires.strings.forEach(
			addDependencyToGraph(graph, moduleDir, moduleId)
		);
	};
}

module.exports = buildDependencyGraph;
