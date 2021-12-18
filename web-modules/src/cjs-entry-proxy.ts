import {pathnameToModuleUrl, toPosix} from "./es-import-utils";
import {EntryProxyResult} from "./web-modules";

const excluded = new Set([
    "default",
    "__esModule"
]);

function scanCjs(filename: string): string[] {
    const moduleInstance = require(filename);
    if (moduleInstance && moduleInstance.constructor === Object) {
        return Object.keys(moduleInstance).filter(moduleExport => !excluded.has(moduleExport));
    } else {
        return [];
    }
}

export function generateCjsProxy(filename: string): EntryProxyResult {
    const entryUrl = toPosix(filename);
    const exports = scanCjs(filename);
    let proxy = `import __default__ from "${entryUrl}";\nexport default __default__;\n`;
    if (exports.length > 0) {
        proxy += `export {\n${exports.join(",\n")}\n} from "${entryUrl}";\n`;
    }
    return {
        code: proxy,
        imports: [pathnameToModuleUrl(filename)],
        external: []
    };
}

