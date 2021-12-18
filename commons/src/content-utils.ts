import {Readable, Writable} from "stream";

const NODE_FETCH_USER_AGENT = "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)";

export async function contentText(content: string | Readable | Buffer): Promise<string> {
    if (content instanceof Readable) {
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
    } else if (content) {
        return content.toString();
    } else {
        return "";
    }
}

export function sendContent(stream: Writable, content: string | Readable | Buffer, userAgent: string) {
    if (content instanceof Readable) {
        return new Promise(function (resolve, reject) {
            stream.on("end", resolve);
            stream.on("error", reject);
            content.pipe(stream);
        });
    } else if (Buffer.isBuffer(content)) {
        stream.end(content, "binary");
    } else {
        // This is to circumvent an issue with node-fetch returning empty response.text()
        // when emoji are used in the response
        stream.end(content, userAgent === NODE_FETCH_USER_AGENT ? "binary" : "utf8");
    }
}
