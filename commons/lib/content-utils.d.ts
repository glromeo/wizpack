/// <reference types="node" />
import { Readable, Writable } from "stream";
export declare function contentText(content: string | Readable | Buffer): Promise<string>;
export declare function sendContent(stream: Writable, content: string | Readable | Buffer, userAgent: string): Promise<unknown> | undefined;
