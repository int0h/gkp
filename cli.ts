#!/usr/bin/env node
import {cli, option} from 'typed-cli';
import fs from 'fs';
import path from 'path';

import {tsWatch} from './';

const {options, _: arg} = cli({
    description: 'Bundles code',
    name: 'gkp',
    options: {
        watch: option.boolean
            .alias('w')
            .description('to launch in watch mode')
            .default(false),
        compiler: option.oneOf(['ts'])
            .alias('c')
            .description('underlying compiler') // (now olny TS is supported, there are plans to support JS, Sucrase, Swc, Babel etc.)
            .default('ts'),
        output: option.string
            .alias('o')
            .description('path to a directory to which output files')
            .process('post', v => path.resolve(v))
            .required(),
        project: option.string
            .alias('p')
            .description('project root')
            .process('post', v => path.resolve(v)),
    },
    _: option.string
        .description('either entrypoint or project root')
        .process('post', v => path.resolve(v)),
});

if (!options.watch) {
    throw new Error('only watch is supported for now');
}
let projectPath: string;
let entryPath: string;
if (!options.project && !arg) {
    throw new Error('at least --project or entrypoint should be specified');
}
if (arg && fs.statSync(arg).isDirectory()) {
    if (options.project) {
        throw new Error('do not specify --project when passing project path as the 1st argument');
    }
    projectPath = arg;
    entryPath = path.join(projectPath, 'index.js');
} else if (!arg) {
    projectPath = options.project!;
    entryPath = path.join(projectPath, 'index.js');
} else if (!options.project) {
    projectPath = path.dirname(arg);
    entryPath = arg;
} else {
    projectPath = options.project;
    entryPath = arg;
}

tsWatch({
    entryAbsoultePath: entryPath,
    outPath: options.output,
    projectRoot: projectPath,
});

console.log(require.main?.filename, __filename);