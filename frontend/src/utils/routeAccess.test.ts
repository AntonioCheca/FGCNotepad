import assert from "node:assert/strict";
import test from "node:test";

import {canAccessRoute} from "./routeAccess";

test("public feature routes are open to every signed-in user", () => {
    assert.equal(canAccessRoute("/combos", ["ROLE_USER"]), true);
    assert.equal(canAccessRoute("/", ["ROLE_USER"]), true);
});

test("replay lab and combo recommendations need QA tester or admin", () => {
    assert.equal(canAccessRoute("/replay-lab", ["ROLE_USER"]), false);
    assert.equal(canAccessRoute("/replay-lab/study-deck", ["ROLE_USER", "ROLE_MODERATOR"]), false);
    assert.equal(canAccessRoute("/profile/recommend-combo", ["ROLE_USER"]), false);
    assert.equal(canAccessRoute("/replay-lab/upload", ["ROLE_USER", "ROLE_QA_TESTER"]), true);
    assert.equal(canAccessRoute("/profile/recommend-combo", ["ROLE_USER", "ROLE_ADMIN"]), true);
});

test("character reversals are admin-only while the rest of okis stays open", () => {
    assert.equal(canAccessRoute("/okis/reversals", ["ROLE_USER"]), false);
    assert.equal(canAccessRoute("/okis/reversals", ["ROLE_USER", "ROLE_MODERATOR", "ROLE_QA_TESTER"]), false);
    assert.equal(canAccessRoute("/okis/reversals", ["ROLE_USER", "ROLE_ADMIN"]), true);
    assert.equal(canAccessRoute("/okis", ["ROLE_USER"]), true);
});

test("shared replay review links stay reachable without QA access", () => {
    assert.equal(canAccessRoute("/replay-lab/shared/abc123", ["ROLE_USER"]), true);
});

test("moderators reach situations but not the rest of admin", () => {
    assert.equal(canAccessRoute("/admin/situations", ["ROLE_USER", "ROLE_MODERATOR"]), true);
    assert.equal(canAccessRoute("/admin/users", ["ROLE_USER", "ROLE_MODERATOR"]), false);
    assert.equal(canAccessRoute("/moderation/queue", ["ROLE_USER"]), false);
});

test("prefixes only match whole path segments", () => {
    assert.equal(canAccessRoute("/administrator-guide", ["ROLE_USER"]), true);
    assert.equal(canAccessRoute("/profile", ["ROLE_USER"]), true);
});
