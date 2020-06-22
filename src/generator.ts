import fs from 'fs';
import path from 'path';
import { Project } from './reader';
import { resolveSourcemap, joinChunks } from './sourcemaps';
import {ContentArray, ContentObj} from './types';

function wrapFile(jsCode: string, sourceMap: string | null, filePath: string): ContentArray {
    return [
        'function(exports, require, module, __filename, __dirname){',
        '\n',
        '// start of the file:',
        '\n\n',
        {
            code: jsCode.replace(/\n\/\/# sourceMappingURL=[^\n]*/g, '\n'),
            sourceMap,
            path: filePath
        },
        '\n\n',
        '// end of the file',
        '\n',
        ';}',
    ];
}

export function concatProject(projectMeta: Project): ContentArray {
    const moduleCodeChunks: ContentArray = [];
    Object.entries(projectMeta.modules).forEach(([id, {code, resolveMap, packageName, packageVersion, sourceMap, buildResult}]) => {
        moduleCodeChunks.push(
            '\n\n\n',
            '// ' + '='.repeat(80),
            '\n',
            `//module: ${packageName}: id`,
            '\n',
            JSON.stringify(id),
            `: {...${JSON.stringify({resolveMap, packageName, packageVersion, buildResult}, null, '\t')}, fn:\n`,
            // ...wrapFile(code, sourceMap, path.relative(projectMeta.entry, id) || 'entry.js'),
            ...wrapFile(code, sourceMap, id),
            '\n},',
            '\n',
            '// ' + '='.repeat(80),
            '\n\n\n',
        );
    });
    const runtimePath = path.resolve(__dirname, './runtime.js');
    const runtimeCode = fs.readFileSync(runtimePath, 'utf-8');
    const runtimeSourcemap = resolveSourcemap(projectMeta.entry, runtimeCode, runtimePath);
    return [
        `(function(entry, modules, overrides){\n`,
        {code: runtimeCode, sourceMap: runtimeSourcemap, path: runtimePath},
        `;\n})(${JSON.stringify(projectMeta.entry)}, {`,
        ...moduleCodeChunks,
        `}, ${JSON.stringify(projectMeta.usedGlobalOverrides, null, '\t')});`
    ];
}

function buildProject(projectMeta: Project, outputPath: string): Project {
    const newProjectMeta = {
        ...projectMeta,
        modules: {...projectMeta.modules}
    };
    Object.entries(projectMeta.modules).forEach(([id, {buildFn, packageName}]) => {
        if (!buildFn || !packageName) {
            return;
        }
        const buildResult = buildFn({
            outputPath,
            outputBinaryPath: path.join(outputPath, './binary', packageName),
            packageAbsPath: id,
        }) as any;
        newProjectMeta.modules[id] = {
            ...projectMeta.modules[id],
            buildResult
        };
    });
    return newProjectMeta;
}

export function pack(projectMeta: Project): ContentObj {
    const chunks = concatProject(projectMeta);
    return joinChunks(chunks);
}

export function build(projectMeta: Project, outputPath: string) {
    const pm = buildProject(projectMeta, outputPath);
    const {code, sourceMap} = pack(pm);
    //  use string concatenation to avoid parsing this line as source map ref
    fs.writeFileSync(path.join(outputPath, './bundle.js'), code + '\n//' + '# sourceMappingURL=bundle.js.map', 'utf-8'); // TODO do it better
    fs.writeFileSync(path.join(outputPath, './bundle.js.map'), sourceMap, 'utf-8');
}