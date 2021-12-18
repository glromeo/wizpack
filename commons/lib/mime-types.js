"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentType = exports.mimeTypes = exports.CSS_CONTENT_TYPE = exports.SCSS_CONTENT_TYPE = exports.SASS_CONTENT_TYPE = exports.HTML_CONTENT_TYPE = exports.TYPESCRIPT_CONTENT_TYPE = exports.JAVASCRIPT_CONTENT_TYPE = exports.TEXT_CONTENT_TYPE = exports.JSON_CONTENT_TYPE = void 0;
const mime_db_1 = __importDefault(require("mime-db"));
exports.JSON_CONTENT_TYPE = "application/json; charset=UTF-8";
exports.TEXT_CONTENT_TYPE = "text/plain; charset=UTF-8";
exports.JAVASCRIPT_CONTENT_TYPE = "application/javascript; charset=UTF-8";
exports.TYPESCRIPT_CONTENT_TYPE = "application/x-typescript; charset=UTF-8";
exports.HTML_CONTENT_TYPE = "text/html; charset=UTF-8";
exports.SASS_CONTENT_TYPE = "text/x-sass; charset=UTF-8";
exports.SCSS_CONTENT_TYPE = "text/x-scss; charset=UTF-8";
exports.CSS_CONTENT_TYPE = "text/css; charset=UTF-8";
exports.mimeTypes = {};
for (let [contentType, mimeType] of Object.entries(mime_db_1.default)) {
    if (mimeType.extensions) {
        const charset = mimeType.charset || contentType.startsWith("text/") && "UTF-8";
        if (charset) {
            contentType = `${contentType}; charset=${charset}`;
        }
        for (const ext of mimeType.extensions) {
            exports.mimeTypes[ext] = {
                ...mimeType,
                contentType
            };
        }
    }
}
const JAVASCRIPT_MIME_TYPE = exports.mimeTypes["jsx"] = exports.mimeTypes["js"];
JAVASCRIPT_MIME_TYPE.extensions.push("jsx");
const TYPESCRIPT_MIME_TYPE = exports.mimeTypes["tsx"] = exports.mimeTypes["ts"] = {
    "source": "unknown",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["ts", "tsx"],
    "contentType": exports.TYPESCRIPT_CONTENT_TYPE
};
function contentType(name = "") {
    const mimeType = exports.mimeTypes[name];
    if (mimeType) {
        return mimeType.contentType;
    }
    const ext = name.lastIndexOf(".") + 1;
    if (ext > 0) {
        const mimeType = exports.mimeTypes[name.substring(ext)];
        if (mimeType) {
            return mimeType.contentType;
        }
    }
}
exports.contentType = contentType;
//# sourceMappingURL=mime-types.js.map