import db, {MimeType} from "mime-db";

export const JSON_CONTENT_TYPE = "application/json; charset=UTF-8";
export const TEXT_CONTENT_TYPE = "text/plain; charset=UTF-8";
export const JAVASCRIPT_CONTENT_TYPE = "application/javascript; charset=UTF-8";
export const TYPESCRIPT_CONTENT_TYPE = "application/x-typescript; charset=UTF-8";
export const HTML_CONTENT_TYPE = "text/html; charset=UTF-8";
export const SASS_CONTENT_TYPE = "text/x-sass; charset=UTF-8";
export const SCSS_CONTENT_TYPE = "text/x-scss; charset=UTF-8";
export const CSS_CONTENT_TYPE = "text/css; charset=UTF-8";

export const mimeTypes: Record<string, MimeType & { contentType: string }> = {};

for (let [contentType, mimeType] of Object.entries(db)) {
    if (mimeType.extensions) {
        const charset = mimeType.charset || contentType.startsWith("text/") && "UTF-8";
        if (charset) {
            contentType = `${contentType}; charset=${charset}`;
        }
        for (const ext of mimeType.extensions) {
            mimeTypes[ext] = {
                ...mimeType,
                contentType
            };
        }
    }
}

const JAVASCRIPT_MIME_TYPE = mimeTypes["jsx"] = mimeTypes["js"];
JAVASCRIPT_MIME_TYPE.extensions!.push("jsx");

const TYPESCRIPT_MIME_TYPE = mimeTypes["tsx"] = mimeTypes["ts"] = {
    "source": "unknown",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["ts", "tsx"],
    "contentType": TYPESCRIPT_CONTENT_TYPE
};

export function contentType(name = "") {
    const mimeType = mimeTypes[name];
    if (mimeType) {
        return mimeType.contentType;
    }
    const ext = name.lastIndexOf(".") + 1;
    if (ext > 0) {
        const mimeType = mimeTypes[name.substring(ext)];
        if (mimeType) {
            return mimeType.contentType;
        }
    }
}
