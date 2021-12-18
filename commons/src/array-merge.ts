export function arrayMerge<T>(left: T[] | null | undefined, right: T[] | null | undefined): T[] {
    return [...new Set([...left ?? [], ...right ?? []])];
}
