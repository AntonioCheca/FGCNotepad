import assert from "node:assert/strict";
import test from "node:test";

import {canAccessRoute, isAnonymousRoute} from "./routeAccess";

test("public feature routes are open to every signed-in user", () => {
    assert.equal(canAccessRoute("/combos", ["ROLE_USER"]), true);
    assert.equal(canAccessRoute("/", ["ROLE_USER"]), true);
});

test("replay lab needs QA tester or admin", () => {
    assert.equal(canAccessRoute("/replay-lab", ["ROLE_USER"]), false);
    assert.equal(canAccessRoute("/replay-lab/study-deck", ["ROLE_USER", "ROLE_MODERATOR"]), false);
    assert.equal(canAccessRoute("/replay-lab/upload", ["ROLE_USER", "ROLE_QA_TESTER"]), true);
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

test("anonymous visitors can read search, detail and legal pages", () => {
    for (const path of ["/", "/privacy", "/terms", "/about/aboutUs", "/about/aiTransparency", "/guides", "/guides/turns", "/neutral-stats", "/combos", "/combos/68", "/okis", "/okis/1", "/blockstrings", "/blockstrings/2", "/scenarios", "/scenarios/01a0fcbc-398b-7b66-9e6a-d1c1f647d144"]) {
        assert.equal(isAnonymousRoute(path), true, path);
    }
});

test("anonymous visitors cannot open create, edit or account pages", () => {
    for (const path of ["/combos/new", "/okis/new", "/okis/1/edit", "/blockstrings/new", "/scenarios/new", "/scenarios/01a0fcbc-398b-7b66-9e6a-d1c1f647d144/edit", "/profile", "/moderation/queue", "/admin/users", "/replay-lab"]) {
        assert.equal(isAnonymousRoute(path), false, path);
    }
});
