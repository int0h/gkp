import fs from 'fs';

export interface IVfs {
    stat(p: string): StatResult;

    readFile(p: string): string;

    writeFile(p: string, content: string): void;
}

type StatResult = 'file' | 'directory' | null;

export class RealFs implements IVfs {
    stat(absolutePath: string) {
        if (!fs.existsSync(absolutePath)) {
            return null;
        }
        if (fs.statSync(absolutePath).isDirectory()) {
            return 'directory';
        }
        return 'file';
    }

    readFile(absolutePath: string) {
        return fs.readFileSync(absolutePath, 'utf-8');
    }

    writeFile(absolutePath: string, content: string) {
        return fs.writeFileSync(absolutePath, content, 'utf-8');
    }
}

export class LayerVfs implements IVfs {
    files = new Map<string, string>();
    stats = new Map<string, StatResult>();
    fallback: IVfs;

    constructor (fallback: IVfs) {
        this.fallback = fallback;
    }

    stat(absolutePath: string) {
        const cached = this.stats.get(absolutePath)
        if (cached) {
            return cached;
        }
        const stat = this.fallback.stat(absolutePath);
        this.stats.set(absolutePath, stat);
        return stat;
    }

    readFile(absolutePath: string) {
        const cached = this.files.get(absolutePath);
        if (cached) {
            return cached;
        }
        const content = this.fallback.readFile(absolutePath);
        this.files.set(absolutePath, content);
        return content;
    }

    writeFile(absolutePath: string, content: string) {
        this.files.set(absolutePath, content);
    }
}