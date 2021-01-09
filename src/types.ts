export type DynamicDepMeta = {
    code: string;
    line: number;
    column: number;
};

export type Parser = (filename: string, code: string) => {
    deps: string[];
    dynamicDeps: DynamicDepMeta[];
};

export type RequireMetaData<B> = {
    /**
     * Module id, can be a path or module name
     * require('<id>')
     * @example 'fs', './foo.js'
     */
    id: string;
    // fromPath: string;
    // fromModule: string;
    buildResult: B;
    /**
     * real Node.js require function
     */
    require: typeof require;
}

export type BuildFnArg = {
    packageAbsPath: string;
    outputPath: string;
    outputBinaryPath: string;
}

export type ModuleCfgObject<B = any> = {
    modules?: Record<string, ModuleCfg>;
    allowDynamicRequire?: boolean;
    ignoreStaticModules?: string[];
    requireOverride?: (meta: RequireMetaData<B>) => any;
    dynamicRequire?: (meta: RequireMetaData<B>) => any;
    build?: (arg: BuildFnArg) => B;
    prerequires?: string[];
};

export type ModuleCfg = ModuleStub | ModuleCfgObject;

export type ModuleStub = (require: (p: string) => any) => any;

export type ModuleOverride = {
    cfg: ModuleCfg;
    packageName: string;
    packageVersion: string;
    overrideFilePath: string;
};

export type ContentObj = {
    code: string;
    sourceMap: string | null;
    path: string;
};

export type ContentArray = Array<string | ContentObj>;