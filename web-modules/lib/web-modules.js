"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebModules = exports.defaultOptions = void 0;
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const chalk_1 = __importDefault(require("chalk"));
const fast_url_parser_1 = require("fast-url-parser");
const fs_1 = require("fs");
const path_1 = __importStar(require("path"));
const resolve_1 = __importDefault(require("resolve"));
const cjs_entry_proxy_1 = require("./cjs-entry-proxy");
const entry_modules_1 = require("./entry-modules");
const es_import_utils_1 = require("./es-import-utils");
const notifications_1 = require("./notifications");
const utility_1 = require("./utility");
const workspaces_1 = require("./workspaces");
const esbuild = __importStar(require("esbuild"));
const replace_require_1 = require("./replace-require");
const use_memo_1 = require("@wizpack/commons/lib/use-memo");
function defaultOptions() {
    return require(require.resolve(`${process.cwd()}/web-modules.config.js`));
}
exports.defaultOptions = defaultOptions;
function applyDefines(define) {
    eval(Object.keys(define).map(key => `${key} = ${define[key]}`).join(";\n"));
}
exports.useWebModules = (0, use_memo_1.useMemo)((options = defaultOptions()) => {
    if (!options.environment)
        options.environment = "development";
    if (!options.resolve)
        options.resolve = {};
    if (!options.resolve.extensions)
        options.resolve.extensions = [".ts", ".tsx", ".js", ".jsx"];
    if (!options.external)
        options.external = ["@babel/runtime/**"];
    if (!options.esbuild)
        options.esbuild = {};
    const notify = (0, notifications_1.useNotifications)(options);
    options.esbuild = {
        define: {
            "process.env.NODE_ENV": `"${options.environment}"`,
            ...options.esbuild.define
        },
        sourcemap: true,
        target: ["chrome80"],
        ...options.esbuild,
        format: "esm",
        bundle: true
    };
    applyDefines(options.esbuild.define);
    const ALREADY_RESOLVED = Promise.resolve();
    const resolveOptions = {
        basedir: options.rootDir,
        includeCoreModules: false,
        packageFilter(pkg, pkgfile) {
            return { main: pkg.module || pkg["jsnext:main"] || pkg.main };
        },
        ...options.resolve
    };
    const outDir = path_1.default.join(options.rootDir, "web_modules");
    if (options.clean && (0, fs_1.existsSync)(outDir)) {
        (0, fs_1.rmdirSync)(outDir, { recursive: true });
        tiny_node_logger_1.default.warn("cleaned web_modules directory");
    }
    (0, fs_1.mkdirSync)(outDir, { recursive: true });
    const importMap = (0, utility_1.readImportMap)(options.rootDir, outDir);
    const workspaces = (0, workspaces_1.readWorkspaces)(options.rootDir);
    const squash = new Set(options.squash);
    const entryModules = (0, entry_modules_1.collectEntryModules)(resolveOptions, squash);
    const isModule = /\.m?[tj]sx?$/;
    const ignore = function () {
    };
    const isResolved = ((re) => re.test.bind(re))(/^\/(web_modules|workspaces|moderno)\//);
    const resolveImport = async (url, importer) => {
        if (url[0] === "/" && isResolved(url))
            return url;
        let { hostname, pathname, search } = (0, fast_url_parser_1.parse)(url);
        if (hostname !== null) {
            return url;
        }
        let resolved = importMap.imports[pathname];
        if (!resolved) {
            const [module] = (0, es_import_utils_1.parseModuleUrl)(pathname);
            const basedir = importer ? path_1.default.dirname(importer) : options.rootDir;
            const filename = require.resolve(pathname, { paths: [basedir] });
            if (module) {
                pathname = (0, es_import_utils_1.pathnameToModuleUrl)(filename);
                if (workspaces.has(module)) {
                    resolved = path_1.posix.join(workspaces.get(module), pathname.slice(module.length + 1));
                }
                else {
                    resolved = importMap.imports[pathname];
                    if (!resolved) {
                        await bundleWebModule(pathname);
                        resolved = importMap.imports[pathname];
                    }
                }
            }
            else {
                pathname = (0, es_import_utils_1.toPosix)(path_1.default.relative(basedir, filename));
                resolved = (0, es_import_utils_1.isBare)(pathname) ? `./${pathname}` : pathname;
            }
        }
        const type = importer ? resolveModuleType(resolved, importer) : null;
        if (type) {
            search = search ? `?type=${type}&${search.slice(1)}` : `?type=${type}`;
        }
        if (search) {
            return resolved + search;
        }
        else {
            return resolved;
        }
    };
    function resolveModuleType(filename, importer) {
        const ext = path_1.posix.extname(filename);
        if (!isModule.test(ext) && isModule.test(importer)) {
            return "module";
        }
        else {
            return null;
        }
    }
    const pendingTasks = new Map();
    function bundleWebModule(source) {
        if (importMap.imports[source]) {
            return ALREADY_RESOLVED;
        }
        let pendingTask = pendingTasks.get(source);
        if (pendingTask === undefined) {
            pendingTasks.set(source, pendingTask = bundleWebModuleTask(source));
        }
        return pendingTask;
    }
    let resolveEntryFile = function (source) {
        try {
            return resolve_1.default.sync(source, resolveOptions);
        }
        catch (error) {
            tiny_node_logger_1.default.warn("nothing to bundle for:", chalk_1.default.magenta(source), `(${chalk_1.default.gray(error.message)})`);
            return null;
        }
    };
    async function bundleWebModuleTask(source) {
        let startTime = Date.now();
        tiny_node_logger_1.default.debug("bundling web module:", source);
        const bundleNotification = notify(`bundling web module: ${source}`, "info");
        try {
            const entryFile = resolveEntryFile(source);
            if (!entryFile) {
                importMap.imports[source] = `/web_modules/${source}`;
                notify(`nothing to bundle for: ${source}`, "success", true);
                return;
            }
            if (!(entryFile.endsWith(".js") || entryFile.endsWith(".mjs"))) {
                importMap.imports[source] = `/web_modules/${source}`;
                const outFile = path_1.default.resolve(outDir, source);
                (0, fs_1.mkdirSync)(path_1.default.dirname(outFile), { recursive: true });
                await Promise.all([
                    fs_1.promises.copyFile(entryFile, outFile),
                    (0, utility_1.writeImportMap)(outDir, importMap)
                ]);
                const elapsed = Date.now() - startTime;
                tiny_node_logger_1.default.info `copied: ${chalk_1.default.magenta(source)} in: ${chalk_1.default.magenta(String(elapsed))}ms`;
                bundleNotification.update(`copied: ${source} in: ${elapsed}ms`, "success");
                return;
            }
            let entryUrl = (0, es_import_utils_1.pathnameToModuleUrl)(entryFile);
            let pkg = (0, utility_1.closestManifest)(entryFile);
            let isESM = pkg.module || pkg["jsnext:main"]
                || entryFile.endsWith(".mjs")
                || entryFile.indexOf("\\es\\") > 0
                || entryFile.indexOf("\\esm\\") > 0;
            const [entryModule, pathname] = (0, es_import_utils_1.parseModuleUrl)(source);
            if (entryModule && !importMap.imports[entryModule] && entryModule !== source) {
                await bundleWebModule(entryModule);
                if (importMap.imports[entryUrl]) {
                    const elapsed = Date.now() - startTime;
                    tiny_node_logger_1.default.info `already bundled: ${chalk_1.default.magenta(source)}`;
                    bundleNotification.update(`already bundled: ${source}`, "success");
                    return;
                }
            }
            let outName = `${(0, utility_1.stripExt)(source)}.js`;
            let outUrl = `/web_modules/${outName}`;
            let outFile = path_1.default.join(outDir, outName);
            if (pathname) {
                await esbuild.build({
                    ...options.esbuild,
                    entryPoints: [entryUrl],
                    outfile: outFile,
                    plugins: [{
                            name: "web_modules",
                            setup(build) {
                                build.onResolve({ filter: /./ }, async ({ path: url, importer }) => {
                                    if ((0, es_import_utils_1.isBare)(url)) {
                                        if (url === entryUrl) {
                                            return { path: entryFile };
                                        }
                                        let webModuleUrl = importMap.imports[url];
                                        if (webModuleUrl) {
                                            return { path: webModuleUrl, external: true, namespace: "web_modules" };
                                        }
                                        let [m] = (0, es_import_utils_1.parseModuleUrl)(url);
                                        if (entryModules.has(m)) {
                                            return {
                                                path: await resolveImport(url),
                                                external: true,
                                                namespace: "web_modules"
                                            };
                                        }
                                        return null;
                                    }
                                    else {
                                        let bareUrl = resolveToBareUrl(importer, url);
                                        let webModuleUrl = importMap.imports[bareUrl];
                                        if (webModuleUrl) {
                                            return { path: webModuleUrl, external: true, namespace: "web_modules" };
                                        }
                                        return null;
                                    }
                                });
                            }
                        }]
                });
            }
            else {
                await esbuild.build({
                    ...options.esbuild,
                    entryPoints: isESM ? [entryFile] : undefined,
                    stdin: isESM ? undefined : {
                        contents: (0, cjs_entry_proxy_1.generateCjsProxy)(entryFile).code,
                        resolveDir: options.rootDir,
                        sourcefile: `entry-proxy`,
                        loader: "js"
                    },
                    outfile: outFile,
                    plugins: [{
                            name: "web_modules",
                            setup(build) {
                                build.onResolve({ filter: /./ }, async function ({ path: url, importer, kind }) {
                                    if (kind === "require-call") {
                                    }
                                    if ((0, es_import_utils_1.isBare)(url)) {
                                        let [m] = (0, es_import_utils_1.parseModuleUrl)(url);
                                        if (entryModules.has(m)) {
                                            return {
                                                path: await resolveImport(url, importer),
                                                external: true,
                                                namespace: "web_modules"
                                            };
                                        }
                                        return null;
                                    }
                                    return null;
                                });
                            }
                        }]
                });
            }
            importMap.imports[source] = outUrl;
            importMap.imports[entryUrl] = outUrl;
            await Promise.all([
                (0, replace_require_1.replaceRequire)(outFile, resolveImport, options.esbuild.sourcemap),
                (0, utility_1.writeImportMap)(outDir, importMap)
            ]);
            const elapsed = Date.now() - startTime;
            tiny_node_logger_1.default.info `bundled: ${chalk_1.default.magenta(source)} in: ${chalk_1.default.magenta(String(elapsed))}ms`;
            bundleNotification.update(`bundled: ${source} in: ${elapsed}ms`, "success");
        }
        finally {
            pendingTasks.delete(source);
        }
    }
    function resolveToBareUrl(importer, url) {
        let absolute = require.resolve(path_1.default.join(path_1.default.dirname(importer), url));
        return (0, es_import_utils_1.pathnameToModuleUrl)(absolute);
    }
    return {
        options,
        outDir,
        importMap,
        resolveImport,
        bundleWebModule
    };
});
//# sourceMappingURL=web-modules.js.map