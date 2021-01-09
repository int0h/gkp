import * as fs from 'fs';
import path from 'path';

export function findPackageJson(absPath: string): undefined | string {
    const packageJsonPath = path.resolve(absPath, './package.json');
    if (fs.existsSync(packageJsonPath)) {
        return packageJsonPath;
    }
    const parentDir = path.dirname(absPath);
    const isRoot = absPath === parentDir;
    if (isRoot) {
        return undefined;
    }
    return findPackageJson(parentDir);
}

type PackageJsonData = {name: string, version: string, packageJsonPath: string};
const packageJsonCache: Record<string, PackageJsonData> = {};
export function resolvePackageJsonData(absPath: string): PackageJsonData | null {
    const packageJsonPath = findPackageJson(absPath);
    if (!packageJsonPath) {
        return null;
    }
    if (packageJsonCache[packageJsonPath]) {
        return packageJsonCache[packageJsonPath];
    }
    const json = fs.readFileSync(packageJsonPath, 'utf-8');
    const {name, version} = JSON.parse(json) as PackageJsonData;
    packageJsonCache[packageJsonPath] = {name, version, packageJsonPath};
    return {name, version, packageJsonPath};
}