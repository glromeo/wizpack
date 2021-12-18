import path from "path";

export function isBare(url: string): boolean {
    let cc = url[0];
    if (cc === "/") return false;
    if (cc === ".") {
        if (url.length === 1) return false;
        cc = url[1];
        if (cc === "/") return false;
        if (cc === ".") {
            if (url.length === 2) return false;
            cc = url[2];
            if (cc === "/") return false;
        }
    }
    if (url[1] === ":") {
        let s = url[2];
        if (s === "/" || s === "\\") return false;
    }
    return true;
}

export function posixPathnameToModuleUrl(pathname: string): string {
    const index = pathname.lastIndexOf("/node_modules/");
    return index !== -1 ? pathname.substring(index + 14) : pathname;
}

const BACKSLASH_REGEXP = /\\/g;
const POSIX_SEP = path.posix.sep;

export const pathnameToModuleUrl = path.sep === POSIX_SEP
    ? posixPathnameToModuleUrl
    : function (filename: string): string {
        return posixPathnameToModuleUrl(filename.replace(BACKSLASH_REGEXP, POSIX_SEP));
    };


export function parseModuleUrl(pathname: string): [string | null, string | null] {
    let namespace = pathname[0] === "@";
    let separator = namespace ? pathname.indexOf("/", pathname.indexOf("/", 1) + 1) : pathname.indexOf("/", 0);
    if (separator === -1) return [
        pathname,
        null
    ];
    if (separator > 2 || /^\w\w/.test(pathname)) return [
        pathname.substring(0, separator),
        pathname.substring(separator + 1)
    ];
    return [
        null,
        pathname
    ];
}

export const toPosix = path.sep === "/"
    ? (pathname:string) => pathname
    : (pathname:string) => pathname.replace(/\\/g, "/");
