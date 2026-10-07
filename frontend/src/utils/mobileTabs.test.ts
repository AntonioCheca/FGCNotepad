import assert from "node:assert/strict";
import test from "node:test";

import type {MobileTab} from "@/src/types/navigation";
import {findActiveMobileTab} from "./mobileTabs";

const tabs = [
    {label: "Home", href: "/", activePrefixes: []},
    {label: "Combos", href: "/combos", activePrefixes: ["/combos"]},
    {label: "Okis", href: "/okis", activePrefixes: ["/okis"]},
] as unknown as MobileTab[];

test("home is only active on the root path", () => {
    assert.equal(findActiveMobileTab("/", tabs)?.label, "Home");
    assert.equal(findActiveMobileTab("/neutral-stats", tabs), null);
});

test("nested and related routes highlight their tab", () => {
    assert.equal(findActiveMobileTab("/combos/42", tabs)?.label, "Combos");
    assert.equal(findActiveMobileTab("/okis/new", tabs)?.label, "Okis");
});

test("prefixes match whole segments only", () => {
    assert.equal(findActiveMobileTab("/okisomething", tabs), null);
    assert.equal(findActiveMobileTab("/profile", tabs), null);
});
