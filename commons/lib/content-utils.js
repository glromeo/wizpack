"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendContent = exports.contentText = void 0;
const stream_1 = require("stream");
const NODE_FETCH_USER_AGENT = "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)";
async function contentText(content) {
    if (content instanceof stream_1.Readable) {
        return new Promise(function (resolve, reject) {
            let text = "";
            content.setEncoding("utf8");
            content.on("data", function (chunk) {
                text += chunk;
            });
            content.on("end", function () {
                resolve(text);
            });
            content.on("error", reject);
        });
    }
    else if (content) {
        return content.toString();
    }
    else {
        return "";
    }
}
exports.contentText = contentText;
function sendContent(stream, content, userAgent) {
    if (content instanceof stream_1.Readable) {
        return new Promise(function (resolve, reject) {
            stream.on("end", resolve);
            stream.on("error", reject);
            content.pipe(stream);
        });
    }
    else if (Buffer.isBuffer(content)) {
        stream.end(content, "binary");
    }
    else {
        stream.end(content, userAgent === NODE_FETCH_USER_AGENT ? "binary" : "utf8");
    }
}
exports.sendContent = sendContent;
//# sourceMappingURL=content-utils.js.map