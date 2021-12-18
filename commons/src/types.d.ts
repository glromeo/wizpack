declare module "fast-url-parser" {

    export default class Url {
        auth: string;
        slashes: string;
        host: string;
        hostname: string;
        hash: string;
        search: string;
        pathname: string;
        port: string | null;
        query: string | null;
        path: string | null;
        protocol: string | null;
        href: string;
        parse: (url: string, parseQueryString?: boolean, hostDenotesSlash?: boolean, disableAutoEscapeChars?: boolean) => void;
        resolve: (relative: string) => Url;
        format: () => string;
    }

    export var queryString = require("querystring");
    export var parse: (url: string, parseQueryString?: boolean, hostDenotesSlash?: boolean, disableAutoEscapeChars?: boolean) => Url;
    export var resolveObject: (source: string, relative: string) => Url;
    export var format: (url: Url | string) => string;
    export var replace: () => void;
}

declare module "mime-db" {
    export type MimeType = {
        source: "iana" | "apache" | "unknown",
        charset?: "UTF-8" | "US-ASCII" | "7-BIT",
        compressible?: boolean,
        extensions?: string[]
    };
    declare const db: Record<string, MimeType>;
    export default db;
}