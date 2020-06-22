import ts = require("typescript");

export type Cfg = {
    tsConfigPath?: string;
    projectRoot?: string;
    fs: {
        writeFile: (path: string, content: string) => void;
    };
    onBuildComplete?: () => void;
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
        console.error("Error", diagnostic.code, ":", ts.flattenDiagnosticMessageText( diagnostic.messageText, formatHost.getNewLine()));
    }

    /**
     * Prints a diagnostic every time the watch status changes.
     * This is mainly for messages like "Starting compilation" or "Compilation completed".
     */
    function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
        if (diagnostic.code === 6194 && diagnostic.messageText.toString().indexOf('Found 0') === 0) {
            cfg.onBuildComplete?.();
        }
        console.info(ts.formatDiagnostic(diagnostic, formatHost));
    }

    ts.createWatchProgram(host);
}


