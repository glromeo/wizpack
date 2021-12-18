import {traverse} from "@babel/core";
import log from "tiny-node-logger";
import {isBare} from "./es-import-utils";
import {useWebModules, WebModulesOptions} from "./index";
import {useMemo} from "@wizpack/commons/lib/use-memo";

export const useWebModulesPlugin = useMemo<WebModulesOptions, any>(config => {

    const {resolveImport} = useWebModules(config);

    function resolveBabelRuntime(importUrl: string) {
        if (importUrl.startsWith("@babel/")) return `/web_modules/${importUrl}.js`;
    }

    function rewriteImports({types}: any): any {

        let filename: string, imports: Set<string>, importMap: any;

        function rewriteImport(path: string, source: any) {

            const importUrl = source.node.value;
            const resolvedUrl = importMap.get(importUrl) || resolveBabelRuntime(importUrl) || importUrl;

            if (importUrl !== resolvedUrl) try {
                log.debug("resolved import:", `'${importUrl}'`, "as:", resolvedUrl);
                source.replaceWith(types.stringLiteral(resolvedUrl));
            } catch (error) {
                throwCodeFrameError(path, importUrl, error);
            }

            if (!isBare(resolvedUrl)) {
                imports.add(resolvedUrl);
                log.trace(filename, "collected link:", resolvedUrl);
            }
        }

        return {
            inherits: require("@babel/plugin-syntax-dynamic-import").default,
            pre(state: any) {
                filename = this.filename;
                importMap = this.opts.importMap;
                imports = new Set();
            },
            post(state: any) {
                this.file.metadata.imports = imports;
            },
            visitor: {
                "CallExpression"(path: any, state: any) {
                    const isImport = path.node.callee.type === "Import";
                    const isRequire = path.node.callee.name === "require";
                    if (isImport || isRequire) {
                        const [source] = path.get("arguments");
                        if (source.type === "StringLiteral") {
                            rewriteImport(path, source);
                        } else {
                            log.debug`source.type is not a StringLiteral at: ${path.toString()}, in: ${this.filename}`;
                        }
                    }
                },
                "ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration"(path: any, state: any) {
                    const source = path.get("source");
                    if (source.node !== null) {
                        rewriteImport(path, source);
                    }
                }
            } as any
        };
    }

    async function resolveImports(filename: string, parsedAst: any) {

        const importMap = new Map();

        traverse(parsedAst, {
            "CallExpression"(path: any, state: any) {
                const isImport = path.node.callee.type === "Import";
                const isRequire = path.node.callee.name === "require";
                if (isImport || isRequire) {
                    const [source] = path.get("arguments");
                    if (source.type === "StringLiteral") {
                        const importUrl = source.node.value;
                        const resolved = resolveImport(importUrl, filename);
                        importMap.set(importUrl, resolved.catch((error: any) => throwCodeFrameError(path, importUrl, error)));
                    }
                }
            },
            "ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration"(path: any, state: any) {
                const source = path.get("source");
                if (source.node !== null) {
                    const importUrl = source.node.value;
                    const resolved = resolveImport(importUrl, filename);
                    importMap.set(importUrl, resolved.catch((error: any) => throwCodeFrameError(path, importUrl, error)));
                }
            }
        } as any);

        for (const [key, value] of importMap.entries()) importMap.set(key, await value);

        return importMap;
    }

    function throwCodeFrameError(path: any, url: string, error: any) {
        if (path.hub) {
            throw path.buildCodeFrameError(`Could not rewrite '${url}'. ${error.message}`);
        } else {
            throw error;
        }
    }

    return {
        resolveImports,
        rewriteImports
    };

});
