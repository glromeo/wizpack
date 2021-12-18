"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiMap = void 0;
class MultiMap extends Map {
    add(key, value) {
        let set = super.get(key);
        if (!set) {
            set = new Set();
            super.set(key, set);
        }
        set.add(value);
        return this;
    }
    remove(key, value) {
        let set = super.get(key);
        if (set) {
            set.delete(value);
            if (!set.size) {
                super.delete(key);
            }
        }
        return this;
    }
}
exports.MultiMap = MultiMap;
//# sourceMappingURL=multi-map.js.map