import path from 'path';
import fs from 'fs';
import {ModuleCfg, ModuleOverride, ModuleCfgObject} from './types';
import {parse} from './parsers/acorn';
import {resolvePackageOverride, findOverridesForDir} from './overrides';
import {resolvePackageJsonData} from './package-json';
import {resolveRequired, ResolutionFileType} from './resolver';
import {resolveSourcemap} from './sourcemaps';
import {IVfs} from './vfs';
import {cacheParser} from './parsers/cached';

type ModuleMeta = {
    resolveMap: Record<string, string>;
    packageName: string | null;
    packageVersion: string;
    code: string;
    sourceMap: string | null;
    buildFn: ModuleCfgObject['build'] | null;
    buildResult: any;
};

type Modules = Record<string, ModuleMeta>;

export type Project = ReturnType<typeof loadProject>;

const parseCached = cacheParser(parse);

export function loadProject(entry: string, cfg: ModuleCfg = {modules: {}}, vfs: IVfs, projectRoot: string, outDir: string) {
    if (!path.isAbsolute(entry)) {
        throw new Error('entry has to be absolute');
    }

    const globalOverrides = findOverridesForDir(path.dirname(entry), projectRoot);
    const usedGlobalOverrides: Record<string, string> = {};
    const modulesWithPrerequires = new Set<string>();

    const resolvedModules: Modules = {};

    function loadFile(absolutePath: string, fileType: ResolutionFileType, filesPath: string[], modulesPath: string[], curPackageOverride: null | ModuleCfg) {
        if (resolvedModules[absolutePath]) {
            return;
        }

        const packageData = resolvePackageJsonData(absolutePath);
        const packageName = packageData?.name || null;
        const packageVersion = packageData?.version || 'latest';
        const packageOverride = packageData?.name === modulesPath[modulesPath.length - 1]
            ? curPackageOverride
            : resolvePackageOverride(globalOverrides, packageData, curPackageOverride, override => {
                loadFile(override.overrideFilePath, 'js-file', [], [], {modules: {['@gkp-overrides/' + override.packageName]: {allowDynamicRequire: true}}});
                const key = [packageName, packageVersion].join('@');
                usedGlobalOverrides[key] = override.overrideFilePath;
            });

        if (typeof packageOverride === 'function') {
            console.log(packageName, 'is function stub');
            resolvedModules[absolutePath] = {
                code: `throw new Error('module ${packageName} is stubbed')`,
                packageName,
                packageVersion,
                resolveMap: {},
                sourceMap: null,
                buildFn: null,
                buildResult: null,
            }
            return;
        }

        if (fileType === 'json') {
            const jsonCode = vfs.readFile(absolutePath);
            const packageData = resolvePackageJsonData(absolutePath);
            resolvedModules[absolutePath] = {
                code: `module.exports = ${jsonCode};`,
                packageName: packageData?.name || null,
                packageVersion,
                resolveMap: {},
                sourceMap: null,
                buildFn: null,
                buildResult: null,
            }
            return;
        }

        const jsCode = vfs.readFile(absolutePath);
        const res = {
            resolveMap: {} as Record<string, string>,
            packageName,
            packageVersion,
            code: jsCode,
            sourceMap: resolveSourcemap(entry, jsCode, absolutePath, outDir),
            buildFn: packageOverride?.build ?? null,
            buildResult: null,
        };
        resolvedModules[absolutePath] = res;

        const newFilesPath = filesPath.concat(absolutePath);
        const newModulesPath = !packageName || modulesPath[modulesPath.length - 1] === packageName
            ? modulesPath
            : modulesPath.concat(packageName);

        let {dynamicDeps, deps} = parseCached(absolutePath, jsCode);

        if (packageData && packageOverride?.prerequires && packageName && !modulesWithPrerequires.has(packageName)) {
            const prerequires = packageOverride.prerequires;
            modulesWithPrerequires.add(packageName);
            deps = deps.concat(deps, prerequires.map(p => {
                const absPrereqPath = path.resolve(path.dirname(packageData.packageJsonPath), p);
                const relPath = path.relative(path.dirname(absolutePath), absPrereqPath);
                return './' + relPath;
            }));
        }

        for (const ddep of dynamicDeps) {
            if (!packageOverride?.allowDynamicRequire) {
                console.warn('dynamic dep', ddep.code, absolutePath + ':' + ddep.line, '  :', packageName);
            }
        }

        deps.forEach(reqPath => {
            const resolvedPath = resolveRequired(reqPath, path.dirname(absolutePath), vfs);
            if (!resolvedPath) {
                if (!packageOverride) {
                    console.error('todo', packageName);
                    return;
                }
                const packageCfg = packageOverride;
                const ignoreList = packageCfg.ignoreStaticModules || [];
                if (ignoreList.includes(reqPath)) {
                    console.info(reqPath, 'is ignored');
                    return;
                } else {
                    console.error(reqPath, 'is not found');
                    return;
                }
            }
            if (['core', 'addon'].includes(resolvedPath.type)) {
                return;
            }
            res.resolveMap[reqPath] = resolvedPath.absPath;
            loadFile(resolvedPath.absPath, resolvedPath.type, newFilesPath, newModulesPath, packageOverride);
        });
    }

    loadFile(entry, 'js-file', [], [], null);

    return {
        modules: resolvedModules,
        entry,
        usedGlobalOverrides
    };
}