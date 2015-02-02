var fs = require('fs'),
    path = require('path'),
    semver = require('semver'),

    Foo = require('@nathanjd/foo'),
    Baz = require('@nathanjd/baz'),

    detective = require('detective'),
    DepGraph = require('dependency-graph').DepGraph,

    npmScope = '@nathanjd',
    pkgCache = {};

function buildDependencyGraph(entryPath) {
    var graph = new DepGraph(),
        entrySource = fs.readFileSync(entryPath),
        cwd = process.cwd(),

        // Find Dependencies.
        requires = detective.find(entrySource);

    console.dir(requires);

    graph.addNode(entryPath);

    requires.strings.forEach(addDependencyToGraph(graph, cwd, entryPath));

    return graph;
}

function addDependencyToGraph(graph, cwd, parent) {
    return function (dependency) {
        var moduleDir,
            pkg,
            mainPath,
            mainSource,
            requires;

        if (isRelative(dependency)) {
            return;
        }

        if (dependency.indexOf(npmScope) === -1) {
            return;
        }

        pkg = getPackage(cwd, dependency);

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

        requires.strings.forEach(addDependencyToGraph(graph, pkg.dir, pkg.id));
    };
}

function Package(pkg, dir) {
    this.settings = pkg;
    this.dir = dir;
    this.id = pkg.name + '~' + pkg.version;

    pkgCache[this.id] = this;
}

function getPackage(cwd, dependency) {
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

    // If permission error, suggest `npm install`
    pkgSource = fs.readFileSync(pkgPath);
    settings = JSON.parse(pkgSource);

    pkg = new Package(settings, moduleDir);

    console.log('found package', pkg.id, 'at', pkg.dir);

    return pkg;
}

function findModuleDir(cwd, dependency, climb) {
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

    // console.log(moduleDir, 'exists?', fs.existsSync(moduleDir));

    if (!fs.existsSync(moduleDir)) {
        return findModuleDir(cwd, dependency, true);
    }

    return moduleDir;
}

function isRelative(dependency) {
    return dependency.indexOf('..') === 0 || dependency.indexOf('.') === 0 || dependency.indexOf('/') === 0;
}

function findLatestVersion(pkg, graph) {
    var latestPkg;

    console.log('---');
    console.log('looking for latest version of', pkg.settings.name);

    Object.keys(graph.nodes).forEach(function (pkgId) {
        var otherPkg = pkgCache[pkgId];

        if (!otherPkg) {
            return false;
        }

        console.log('pkg', pkg.id, 'other', otherPkg.id);

        if (pkg.settings.name === otherPkg.settings.name &&
            (!latestPkg ||
                semver.gt(otherPkg.settings.version, latestPkg.settings.version)
            ))
        {
            latestPkg = otherPkg;
            console.log('found newer version', latestPkg.id);
        }
    });

    return latestPkg;
}

function uniqueGraph(graph) {
    graph.overallOrder().forEach(function (pkgId) {
        var pkg = pkgCache[pkgId],
            latestPkg;

        if (!pkg) {
            return;
        }

        latestPkg = findLatestVersion(pkg, graph);
        console.log(latestPkg.id, '>', pkg.id, semver.gt(latestPkg.settings.version, pkg.settings.version));

        if (semver.gt(latestPkg.settings.version, pkg.settings.version)) {
            // Shift dependency to latest.
            graph.incomingEdges[pkg.id].forEach(function (parentPkgId) {
                // Link parents to latest node.
                graph.addDependency(parentPkgId, latestPkg.id);

                // Remove links to this node.
                graph.removeDependency(parentPkgId, pkg.id);
            });

            // Clean up any dependent nodes (outgoing edges)
            graph.outgoingEdges[pkg.id].forEach(function (dependentPkgId) {

            });

            // Can only delete edge nodes?
            console.log('removing', pkg.id);
            graph.removeNode(pkg.id);
        }
    });
}

// Build dependency graph.
var dependencyGraph = buildDependencyGraph('index.js');

console.log('dep graph', dependencyGraph);

// Replace all deps with the latest version already present in the graph.
uniqueGraph(dependencyGraph);

console.log('uniqued graph', dependencyGraph);

// Get flat order from graph.
var sortedDependencies = dependencyGraph.overallOrder();

console.log('order', sortedDependencies);

// Output import statements to a stream
sortedDependencies.forEach(function (pkgId) {
    var pkg = pkgCache[pkgId];

    if (!pkg) {
        return;
    }

    if (pkg.settings.styles && pkg.settings.styles.length) {
        pkg.settings.styles.forEach(function (style) {
            console.log('@import "' + pkg.dir + '/' + style + '";');
        });
    }
});
