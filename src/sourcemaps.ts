import Concat from 'concat-with-sourcemaps';
import fs from 'fs';
import path from 'path';
import { ContentArray, ContentObj } from './types';

const base64Prefix = 'data:application/json;base64,';

function readSourcemap(jsCode: string, filePath: string): string | null {
    const sourceMapLine = jsCode.match(/\/\/# sourceMappingURL=[^\n]*/)?.[0];
    if (!sourceMapLine) {
        return null;
    }
    const sourceMapValueString = sourceMapLine.slice(sourceMapLine.indexOf('=') + 1);
    if (sourceMapValueString.indexOf(base64Prefix) === 0) {
        const b64 = sourceMapValueString.slice(base64Prefix.length);
        const json = Buffer.from(b64, 'base64').toString();
        return json;
    }
    const sourceMapPath = path.resolve(path.dirname(filePath), sourceMapValueString);
    try {
        const content = fs.readFileSync(sourceMapPath, 'utf-8');
        return content;
    } catch(e) {
        console.error('failed to load sourcemap:', sourceMapPath);
        return null;
    }
}

export function resolveSourcemap(entry: string, jsCode: string, filePath: string, outDir: string): string | null {
    const sourcemap = readSourcemap(jsCode, filePath);
    if (!sourcemap) {
        return null;
    }
    const parsed = JSON.parse(sourcemap);
    const res = {
        ...parsed,
        file: path.relative(outDir, path.resolve(path.dirname(filePath), parsed.file)) || entry,
        sources: parsed.sources.map((p: string) => path.relative(outDir, path.resolve(path.dirname(filePath), p)) || entry)
    };
    return JSON.stringify(res);
}

export function joinChunks(chunks: ContentArray): ContentObj {
    const concat = new Concat(true, 'app.js', '');
    chunks.forEach(c => {
        if (typeof c === 'string') {
            concat.add(null, c);
        } else {
            concat.add(c.path, c.code, c.sourceMap ?? undefined);
        }
    });
    return {
        code: concat.content.toString(),
        sourceMap: concat.sourceMap?.toString() ?? null,
        path: ''
    };
}