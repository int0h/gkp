const test = require('tape');

const fs = require('fs');
const path = require('path');
const {loadProject, pack, build} = require('../../../src/index');

process.chdir(__dirname);

test('build successful', t => {
    const project = loadProject(path.resolve('./target/app-src/app.js'));
    build(project, './target/build');
    // const {code, sourceMap} = pack(project);
    // fs.writeFileSync('./target/build/bundle.js', code + '\n//# sourceMappingURL=bundle.js.map', 'utf-8');
    // fs.writeFileSync('./target/build/bundle.js.map', sourceMap, 'utf-8');

    /** @type {import('./target/app-src/app')} */
    const bundle = require('./target/build/bundle');

    test('dependencies works fine', t => {
        t.is(bundle.simpleDepHello(), 'hello');
        t.end();
    });

    test('dependencies can be overriden', t => {
        t.is(bundle.simpleOverrideHello(), 'overriden');
        t.end();
    });

    test('cfg.modules overrides', t => {
        t.is(bundle.depWithDepsHello(), 'module-override');
        t.end();
    });

    test('dep versions matching', t => {
        t.is(bundle.versionedHello(), 'v1.0 override');
        t.is(bundle.versionedDepHolderHello(), 'v2.0 override');
        t.end();
    });

    test('build step', t => {
        t.is(bundle.depWithBuildHello().binaryPath, 'binary/bin');
        t.end();
    });

    t.end();
});

