"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayMerge = void 0;
function arrayMerge(left, right) {
    return [...new Set([...left !== null && left !== void 0 ? left : [], ...right !== null && right !== void 0 ? right : []])];
}
exports.arrayMerge = arrayMerge;
//# sourceMappingURL=array-merge.js.map