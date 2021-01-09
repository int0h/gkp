#!/usr/bin/env node
import {cli, option} from 'typed-cli';
import fs from 'fs';
import path from 'path';

import {tsWatch, tsBuild} from './';

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
            .process('post', v => path.resolve(v))
            .required(),
            entry: option.string
            .alias('e')
            .description('project entry')
            .process('post', v => path.resolve(v))
            .required(),
    },
    _: option.string
        .description('either entrypoint or project root')
        .process('post', v => path.resolve(v)),
});

const params = {
    entryAbsoultePath: options.entry,
    outPath: options.output,
    projectRoot: options.project,
};

if (!options.watch) {
    tsBuild(params)
        .then(() => {
            console.log('Compilled successfully!');
            process.exit(0);
        })
        .catch((e) => {
            console.error(e);
            console.log('Failed to compille!');
            process.exit(1);
        });
} else {
    tsWatch(params);
}



console.log(require.main?.filename, __filename);