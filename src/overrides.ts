import path from 'path';
import fs from 'fs';
import {ModuleCfg, ModuleOverride, ModuleCfgObject} from './types';
import {matchVersion} from './semver';

function resolveModuleOverridesPath(entryDir: string): string | null {
    const resolved = path.join(entryDir, path.basename(entryDir) === 'node_modules'
        ? '@gkp-overrides'
        : '/node_modules/@gkp-overrides');
    if (fs.existsSync(resolved)) {
        console.log('\n\nFound overrides at:', resolved, '\n\n');
        return resolved;
    }
    if (path.dirname(entryDir) === entryDir) {
        console.log('\n\nOverrides are not found\n\n');
        return null;
    }
    return resolveModuleOverridesPath(path.dirname(entryDir));
}

export type OverrideMap = Record<string, Record<string, ModuleOverride>>;

function readOverrides(overridesPath: string): OverrideMap {
    const moduleOverrides: OverrideMap = {};
    const moduleList = fs.readdirSync(overridesPath);
    moduleList.forEach(packageName => {
        const packagePath = path.join(overridesPath, packageName);
        fs.readdirSync(packagePath).forEach(packageVersion => {
            const versionPath = path.join(packagePath, packageVersion);
            const relPath = './' + path.relative(__dirname, versionPath);
            const overridePath = require.resolve(relPath);
            const cfg = require(overridePath);
            moduleOverrides[packageName] = moduleOverrides[packageName] ?? {};
            moduleOverrides[packageName][packageVersion] = {
                cfg,
                overrideFilePath: overridePath,
                packageName,
                packageVersion
            };
        });
    });
    return moduleOverrides;
}

function findNodeModulesOverridesForDir(entryDir: string): OverrideMap {
    const p = resolveModuleOverridesPath(entryDir);
    if (!p) {
        return {};
    }
    return readOverrides(p);
}

function findLocalOverridesForDir(projectDir: string | undefined): OverrideMap {
    if (!projectDir) {
        return {};
    }
    const ovPath = path.resolve(projectDir, '.gkp-overrides');
    if (!fs.existsSync(ovPath)) {
        return {};
    }
    console.log('\n\nFound local overrides at:', ovPath, '\n\n');
    return readOverrides(ovPath);
}

export function findOverridesForDir(entryDir: string, projectDir: string | undefined): OverrideMap {
    return {
        ...findNodeModulesOverridesForDir(entryDir),
        ...findLocalOverridesForDir(projectDir),
    };
}

export function resolvePackageOverride(moduleOverrides: OverrideMap, packageData: {name?: string, version?: string} | null, curPackageOverride: null | ModuleCfg, addOverrideFile: (override: ModuleOverride) => void): ModuleCfg | null {
    if (!packageData || !packageData.name) {
        return null;
    }

    const inheritedPackageOverride = (curPackageOverride as ModuleCfgObject)?.modules?.[packageData.name];
    if (inheritedPackageOverride) {
        return inheritedPackageOverride;
    }

    const globalPackageOverrideVersionMap = moduleOverrides[packageData.name];
    if (globalPackageOverrideVersionMap) {
        const version = matchVersion(packageData.version || 'latest', Object.keys(globalPackageOverrideVersionMap));
        const globalPackageOverride = globalPackageOverrideVersionMap[version];
        addOverrideFile(globalPackageOverride);
        return globalPackageOverride.cfg;
    }

    return null;
}