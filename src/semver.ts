export function matchVersion(targetVersion: string, availableVersions: string[]): string {
    const targetSemver = parseSemver(targetVersion);
    const availableSemver = availableVersions.map(parseSemver);
    const matchedMajorVersion = matchVersionNumber(targetSemver[0], availableSemver.map(s => s[0]));
    const filtredMajors = availableSemver.filter(s => s[0] === matchedMajorVersion);
    const targetMinor = matchedMajorVersion === targetSemver[0]
        ? targetSemver[1]
        : matchedMajorVersion > targetSemver[0]
            ? 0
            : Infinity;
    const matchedMinorVersion = matchVersionNumber(targetMinor, filtredMajors.map(s => s[1]));
    const filtredMinors = filtredMajors.filter(s => s[1] === matchedMinorVersion);
    const targetPatch = matchedMajorVersion !== targetSemver[0]
        ? targetMinor
        : matchedMinorVersion === targetSemver[1]
            ? targetSemver[2]
            : matchedMinorVersion > targetSemver[1]
                ? 0
                : Infinity;
    const matchedPatchVersion = matchVersionNumber(targetPatch, filtredMinors.map(s => s[2]));
    return [matchedMajorVersion, matchedMinorVersion, matchedPatchVersion].join('.');
}

function matchVersionNumber(target: number, available: number[]) {
    let best = available[0];
    for (let i = 1; i < available.length; i++) {
        if (available[i] === target) {
            return target;
        }
        if (
            best < target && available[i] > target
            ||
            available[i] > target && available[i] < best
            ||
            available[i] < target && available[i] > best
        ) {
            best = available[i];
        }
    }
    return best;
}

// function compareVersions([aMajor, aMinor, aPatch]: number[], [bMajor, bMinor, bPatch]: number[]): number {
//     const majorDiff = aMajor - bMajor;
//     const minorDiff = aMinor - bMinor;
//     const patchDiff = aPatch - bPatch;
//     return Math.sign(majorDiff || minorDiff || patchDiff);
// }

// function sortVersions(versions: number[][]): number[][] {
//     return [...versions].sort((a, b) => compareVersions(a, b));
// }

function parseSemver(versionString: string): number[] {
    return versionString.split('.').map(Number);
}