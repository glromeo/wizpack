import "mocha-toolkit";

import {expect, sinon} from "mocha-toolkit";

import {useMemo} from "../src/use-memo";
import {arrayMerge} from "../src/array-merge";
import {MultiMap} from "../src/multi-map";
import {contentType} from "../src/mime-types";

describe("utils", function () {

    describe("array-merge", function () {

        it("removes duplicates", function () {
            expect(arrayMerge([1, 2], [2, 3])).eql([1, 2, 3]);
        });

        it("preserves order", function () {
            expect(arrayMerge([2, 1], [3, 2])).eql([2, 1, 3]);
        });

        it("handles nulls & undefined", function () {
            expect(arrayMerge(null, [1, 2, 3])).eql([1, 2, 3]);
            expect(arrayMerge([1, 2, 3], undefined)).eql([1, 2, 3]);
        });
    });

    describe("use-memo", function () {

        it("de-duplicates invocations", function () {
            let fn = sinon.fake();
            const memo = useMemo(fn);
            memo(0);
            memo(0);
            expect(fn).calledOnce;
        });

        it("based on strict equality (===)", function () {
            let fn = sinon.fake();
            const memo = useMemo(fn);
            memo([0]);
            memo([0]);
            expect(fn).calledTwice;
        });

        it("unless the argument is different", function () {
            let fn = sinon.fake();
            const memo = useMemo(fn);
            memo(0);
            memo("0");
            memo(0);
            memo("0");
            expect(fn).calledTwice;
        });
    });

    describe("multi-map", function () {

        it("add/remove respect the fluent api of map", function () {
            const map = new MultiMap<object, object>();
            const value = {};
            expect(map.add(value, value)).eq(map);
            expect(map.remove(value, value)).eq(map);
        });

        it("add stores the elements in a set", function () {
            const map = new MultiMap<string, number>();
            map.add("one", 1);
            map.add("one", 1.5);
            map.add("two", 2);
            expect(map.size).eq(2);
            expect(map.get("one")!.size).eq(2);
        });

        it("remove deletes the element from the set", function () {
            const map = new MultiMap<string, any>();
            map.add("alpha", {});
            map.add("alpha", null);
            map.add("beta", []);
            expect(map.size).eq(2);
            expect(map.get("alpha")!.size).eq(2);

            map.remove("alpha", null);
            expect(map.size).eq(2);
            expect(map.get("alpha")!.size).eq(1);
        });
    });

    describe("mime types", function () {

        it("lookup by plain ext without .", function () {
            expect(contentType("js")).eq("application/javascript; charset=UTF-8");
            expect(contentType()).undefined;
        });

        it(". is supported but discouraged", function () {
            expect(contentType(".js")).eq("application/javascript; charset=UTF-8");
        });

        it("supports ts, tsx and jsx", function () {
            expect(contentType("ts")).eq("application/x-typescript; charset=UTF-8");
            expect(contentType("tsx")).eq("application/x-typescript; charset=UTF-8");
            expect(contentType("jsx")).eq("application/javascript; charset=UTF-8");
        });

        it("can lookup by full filename (no urls!)", function () {
            expect(contentType("path/file.html")).eq("text/html; charset=UTF-8");
            expect(contentType("path/file.html?q=v")).undefined;
            expect(contentType("path/file")).undefined;
        });

    });

});