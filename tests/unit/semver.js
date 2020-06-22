const test = require('tape');

const {matchVersion} = require('../../src/semver');

process.chdir(__dirname);

test('version mathching', t => {

    t.is(matchVersion('2.0.0', ['1.0.0', '2.0.0', '3.0.0']), '2.0.0', 'if exact version provided it should be choosen');
    t.is(matchVersion('2.0.0', ['1.0.0', '3.0.0', '4.0.0']), '3.0.0', 'if no exact major version provided it should return the oldest from ones which are newer');

    t.is(matchVersion('2.0.0', ['1.0.0', '1.99.0', '3.0.0']), '3.0.0', 'mathcing major-ish version is always beats lower version matching (even if the oldest is "closer" to target one)');

    test('if higher version mismatched (2.5 != 2.0 here) the closest lower version should be choosen', t => {
        t.is(matchVersion('2.0.0', ['1.0.0', '2.5.0', '2.5.1']), '2.5.0', 'closest patch <');
        t.is(matchVersion('3.0.0', ['1.0.0', '2.5.0', '2.5.1']), '2.5.1', 'closest patch >');
        t.is(matchVersion('0.0.0', ['1.0.0', '1.5.0']), '1.0.0', 'closest minor >');
        t.is(matchVersion('2.0.0', ['1.0.0', '1.5.0']), '1.5.0', 'closest minor <');
        t.is(matchVersion('2.0.0', ['1.0.0', '1.0.5']), '1.0.5', 'closest minor-skipped >');
        t.is(matchVersion('0.0.0', ['1.0.0', '1.0.5']), '1.0.0', 'closest minor-skipped <');
        t.end();
    });

    t.end();
});

