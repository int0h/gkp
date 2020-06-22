declare var entry: string;
declare var modules: Modules;
declare var overrides: Record<string, string>;

(global as any).__require = require; // TODO: fix me

import type {ModuleCfg, ModuleOverride, ModuleCfgObject} from './types';

type ModuleMeta = {
    resolveMap: Record<string, string>;
    packageName: string | null;
    packageVersion: string;
    buildResult: any;
    fn: ModuleFn;
};

type Modules = Record<string, ModuleMeta>;

type ModuleFn = (exports: any, require: (path: string) => any, module: any, __filename: string, __dirname: string) => void;

const genModuleObj = () => ({exports: {} as any});

type RuntimeModule = ModuleMeta & {
    state: number;
    moduleVar: ReturnType<typeof genModuleObj>;
};

const runtimeModules: Record<string, RuntimeModule> = {};
for (const key of Object.keys(modules)) {
    runtimeModules[key] = {
        ...modules[key],
        state: 0,
        moduleVar: genModuleObj()
    };
}

const coreModules: string[] = require('module').builtinModules;

function prepareRequireForModule(moduleObj: RuntimeModule, packageOverride: ModuleCfgObject | null): (path: string) => any {
    return (reqPath: string) => {
        if (coreModules.includes(reqPath)) {
            return require(reqPath);
        }
        const staticMapped = moduleObj.resolveMap[reqPath];
        if (staticMapped) {
            const packageName = runtimeModules[staticMapped].packageName;
            if (!packageName) {
                return requireModule(staticMapped, null);
            }
            const key = [packageName, runtimeModules[staticMapped].packageVersion].join('@');
            const childOverride = packageOverride?.modules?.[packageName] || moduleOverrides[key] || null;
            if (typeof childOverride === 'function') {
                return childOverride(require);
            }
            return requireModule(staticMapped, childOverride);
        }
        if (packageOverride?.dynamicRequire) {
            return packageOverride.dynamicRequire({
                buildResult: moduleObj.buildResult,
                id: reqPath,
                require,
            }); // TODO: fix me
        }
        throw new Error('todo');
    };
}

function requireModule(moduleId: string, packageOverride: ModuleCfgObject | null) {
    const moduleObj = runtimeModules[moduleId];
    if (moduleObj.state > 0) {
        return moduleObj.moduleVar.exports;
    }
    moduleObj.state = 1;
    moduleObj.fn(
        moduleObj.moduleVar.exports,
        prepareRequireForModule(moduleObj, packageOverride),
        moduleObj.moduleVar,
        moduleId,
        moduleId.replace(/\/[^\/]*$/, '')
    );
    moduleObj.state = 2;
    return moduleObj.moduleVar.exports;
}

const moduleOverrides: Record<string, ModuleCfg> = {};
for (const [packageName, overridePath] of Object.entries(overrides)) {
    moduleOverrides[packageName] = requireModule(overridePath, null);
}

module.exports = requireModule(entry, null);