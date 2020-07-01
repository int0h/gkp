//@ts-check
const test = require('tape');

const fs = require('fs');
const path = require('path');
const {tsBuild} = require('../../../');

process.chdir(__dirname);

test('build successful', async t => {
    await tsBuild({
        entryAbsoultePath: path.resolve('./target/app-src/app.js'),
        outPath: './target/build',
        projectRoot: './target/app-src'
    });
    // const {code, sourceMap} = pack(project);
    // fs.writeFileSync('./target/build/bundle.js', code + '\n//# sourceMappingURL=bundle.js.map', 'utf-8');
    // fs.writeFileSync('./target/build/bundle.js.map', sourceMap, 'utf-8');

    /** @type {import('./target/app-src/app').default} */
    const bundle = require('./target/build/bundle').default;

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
        t.is(bundle.depWithBuildHello().binaryPath, 'binary/dep-with-build/bin');
        t.end();
    });

    t.end();
});

