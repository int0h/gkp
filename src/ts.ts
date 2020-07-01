import ts = require("typescript");

export type Cfg = {
    tsConfigPath?: string;
    projectRoot?: string;
    fs: {
        writeFile: (path: string, content: string) => void;
    };
    onBuildComplete?: () => void;
    onError?: (opts: {message: string, code: number}) => void;
};

export function watch(cfg: Cfg) {
    const configPath = cfg.tsConfigPath ?? (cfg.projectRoot &&
        ts.findConfigFile(
            cfg.projectRoot, // search path
            ts.sys.fileExists,
            "tsconfig.json"
        )
    );
    if (!configPath) {
        throw new Error("Could not find a valid 'tsconfig.json'.");
    }

    const createProgram = ts.createSemanticDiagnosticsBuilderProgram;

    const customSys = {
        ...ts.sys,
        writeFile(path: string, data: string, writeByteOrderMark?: boolean) {
            cfg.fs.writeFile(path, data);
        }
    };

    const host = ts.createWatchCompilerHost(
        configPath,
        {},
        customSys,
        createProgram,
        reportDiagnostic,
        reportWatchStatusChanged
    );

    const formatHost: ts.FormatDiagnosticsHost = {
        getCanonicalFileName: path => path,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine
    };

    function reportDiagnostic(diagnostic: ts.Diagnostic) {
        const code = diagnostic.code;
        const message = ts.flattenDiagnosticMessageText( diagnostic.messageText, formatHost.getNewLine());
        console.error("Error", code, ":", message);
        cfg.onError && setTimeout(() => {
            cfg.onError?.({
                code,
                message,
            });
        }, 0);
    }

    /**
     * Prints a diagnostic every time the watch status changes.
     * This is mainly for messages like "Starting compilation" or "Compilation completed".
     */
    function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
        if (diagnostic.code === 6194 && diagnostic.messageText.toString().indexOf('Found 0') === 0) {
            cfg.onBuildComplete && setTimeout(() => {
                cfg.onBuildComplete?.();
            }, 0);
        }
        console.info(ts.formatDiagnostic(diagnostic, formatHost));
    }

    return ts.createWatchProgram(host);
}

export function build(cfg: Cfg): Promise<void> {
    return new Promise((resolve, reject) => {
        const prog = watch({
            ...cfg,
            onBuildComplete: () => {
                cfg.onBuildComplete?.();
                prog.close();
                resolve();
            },
            onError: (opts) => {
                cfg.onError?.(opts);
                prog.close();
                reject();
            }
        })
    });

}


