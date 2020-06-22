import path from 'path';
import fs from 'fs';
import {ModuleCfg, ModuleOverride, ModuleCfgObject} from './types';
import {matchVersion} from './semver';

export function resolveModuleOverridesPath(entryDir: string): string | null {
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

export function findOverrides(overridesPath: string): OverrideMap {
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