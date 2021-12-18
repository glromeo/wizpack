"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCjsProxy = void 0;
const es_import_utils_1 = require("./es-import-utils");
const excluded = new Set([
    "default",
    "__esModule"
]);
function scanCjs(filename) {
    const moduleInstance = require(filename);
    if (moduleInstance && moduleInstance.constructor === Object) {
        return Object.keys(moduleInstance).filter(moduleExport => !excluded.has(moduleExport));
    }
    else {
        return [];
    }
}
function generateCjsProxy(filename) {
    const entryUrl = (0, es_import_utils_1.toPosix)(filename);
    const exports = scanCjs(filename);
    let proxy = `import __default__ from "${entryUrl}";\nexport default __default__;\n`;
    if (exports.length > 0) {
        proxy += `export {\n${exports.join(",\n")}\n} from "${entryUrl}";\n`;
    }
    return {
        code: proxy,
        imports: [(0, es_import_utils_1.pathnameToModuleUrl)(filename)],
        external: []
    };
}
exports.generateCjsProxy = generateCjsProxy;
//# sourceMappingURL=cjs-entry-proxy.js.map