"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMemo = void 0;
function useMemo(fn) {
    let head = undefined;
    return (key) => {
        let tail = head;
        while (tail) {
            if (tail.key === key) {
                return tail.value;
            }
            else {
                tail = tail.next;
            }
        }
        const value = fn(key);
        head = { key, value, next: head };
        return value;
    };
}
exports.useMemo = useMemo;
//# sourceMappingURL=use-memo.js.map