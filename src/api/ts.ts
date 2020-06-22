import {LayerVfs, RealFs, build, watch, loadProject} from '../';

type TsParams = {
    projectRoot?: string;
    tsConfigPath?: string;
    entryAbsoultePath: string;
    onBuildComplete?: () => void;
    outPath: string;
}

export function tsBuild(params: TsParams) {}

export function tsWatch(params: TsParams) {
    const vfs = new LayerVfs(new RealFs());
    const started = Date.now();

    watch({
        fs: {
            writeFile: (path, content) => vfs.writeFile(path, content)
        },
        projectRoot: params.projectRoot,
        onBuildComplete: () => {
            console.time('reading');
            const project = loadProject(params.entryAbsoultePath, {}, vfs);
            console.timeEnd('reading');

            console.time('building');
            build(project, params.outPath);
            console.timeEnd('building');
            console.log('\n\nDONE\n\n', Date.now() - started);

            params.onBuildComplete?.();
        }
    });
}