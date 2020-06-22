import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';
import { IVfs } from './vfs';

const coreModules: string[] = require('module').builtinModules;

export type ResolutionFileType = 'core' | 'js-file' | 'addon' | 'json';

export type ResolutionResult = {
    type: ResolutionFileType;
    absPath: string;
} | null;

require.extensions['.ts'] = require.extensions['.js'];

type CompileCache = Record<string, string>;

export function resolveRequired(reqPath: string, fromPath: string, vfs: IVfs): ResolutionResult {
    if (coreModules.includes(reqPath)) {
        return {type: 'core', absPath: reqPath};
    }
    let resolvedPath: null | string = null;
    try {
        resolvedPath = resolveFrom(fromPath, reqPath);
    } catch(e) {
        // console.error(e);
    }
    if (!resolvedPath) {
        return null;
    }
    const ext = path.extname(resolvedPath);
    if (ext === '.ts') {
        const jsFilePath = resolvedPath.replace(/\.ts$/, '.js');
        const cached = vfs.readFile(jsFilePath);
        if (cached) {
            return {
                absPath: jsFilePath,
                type: 'js-file',
            };
        }
    }
    const type = ({
        '.js': 'js-file',
        '.node': 'addon',
        '.json': 'json'
    } as any)[ext];
    const res = {
        absPath: resolvedPath,
        type
    };
    return res;
}



// function resolveRelative(reqPath: string, fromPath: string): ResolutionResult {
//     const absPath = path.resolve(fromPath, reqPath);
//     if (fs.existsSync(absPath)) {
//         if (fs.statSync(absPath).isDirectory()) {
//             if (fs.existsSync(absPath + '/index.js')) {
//                 return {type: 'js-file', absPath: absPath + '.js'};
//             }
//             if (fs.existsSync(absPath + '/index.json')) {
//                 return {type: 'json', absPath: absPath + '.json'};
//             }
//             if (fs.existsSync(absPath + '/index.node')) {
//                 return {type: 'addon', absPath: absPath + '.node'};
//             }
//         }
//         const ext = path.extname(absPath);
//         const type = ({
//             js: 'js-file',
//             node: 'addon',
//             json: 'json'
//         } as any)[ext];
//         return {type, absPath};
//     }
//     if (fs.existsSync(absPath + '.js')) {
//         return {type: 'js-file', absPath: absPath + '.js'};
//     }
//     if (fs.existsSync(absPath + '.json')) {
//         return {type: 'json', absPath: absPath + '.json'};
//     }
//     if (fs.existsSync(absPath + '.node')) {
//         return {type: 'addon', absPath: absPath + '.node'};
//     }
//     return null;
// }

// function resolveNodeModule(reqPath: string, fromPath: string): ResolutionResult {

// }

// function resolveRequired2(reqPath: string, fromPath: string): ResolutionResult {
//     if (coreModules.includes(reqPath)) {
//         return {type: 'core', absPath: reqPath};
//     }
//     if (/^\.?\.?\//.test(reqPath)) {
//         return resolveRelative(reqPath, fromPath);
//     }

// }
