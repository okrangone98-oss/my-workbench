import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PROFILE, emptyNote } from "./experiment-notes.js";
import { AUTH_SESSION_KEY, FREE_MODEL, analyzeFree, finishConnection, startConnection } from "./free-ai.js";

const source = { ...emptyNote(), title: "홍보 AI 소식", content: "행사 사진으로 장면 초안을 만든다." };
const result = JSON.stringify({ summary: "홍보 실험 추천", recommendations: [{ noteId: source.id, title: "장면 만들기", steps: ["사진 준비"], successCriteria: "30분 완성", sourceQuote: "행사 사진" }] });
const response = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => value });
const catalog = (pricing = { prompt: "0", completion: "0" }) => response({ data: [{ id: FREE_MODEL, pricing }] });
const options = (fetchImpl) => ({ key: "test-key-only", notes: [source], profile: DEFAULT_PROFILE, fetchImpl });

test("free requests never add paid fallback models or paid tools", async () => {
  const calls = [];
  const value = await analyzeFree(options(async (url, init) => { calls.push({ url, init }); return calls.length === 1 ? catalog() : response({ model: "test/free:free", choices: [{ finish_reason: "stop", message: { content: result } }] }); }));
  assert.equal(value.model, "test/free:free");
  assert.equal(calls.length, 2);
  const body = JSON.parse(calls[1].init.body);
  assert.equal(body.model, FREE_MODEL);
  assert.deepEqual(body.provider.max_price, { prompt: 0, completion: 0 });
  assert.equal(body.provider.allow_fallbacks, false);
  assert.equal(body.models, undefined); assert.equal(body.plugins, undefined); assert.equal(body.tools, undefined);
});

test("missing, malformed, positive or supplementary prices stop before generation", async () => {
  for (const pricing of [{ prompt: "0.01", completion: "0" }, { prompt: "0" }, { prompt: "", completion: "0" }, { prompt: "0", completion: "0", request: "0.1" }, { prompt: "not-a-price", completion: "0" }]) {
    let calls = 0;
    await assert.rejects(analyzeFree(options(async () => { calls++; return catalog(pricing); })), /가격/);
    assert.equal(calls, 1);
  }
});

test("no key and link-only input do not make network requests", async () => {
  const fetchImpl = async () => assert.fail("must not fetch");
  await assert.rejects(analyzeFree({ ...options(fetchImpl), key: "" }), /연결/);
  await assert.rejects(analyzeFree({ ...options(fetchImpl), notes: [{ ...source, content: "" }] }), /원문/);
});

test("quota, authorization and credit errors never trigger retries", async () => {
  for (const status of [401, 402, 429, 503]) {
    let calls = 0;
    await assert.rejects(analyzeFree(options(async () => ++calls === 1 ? catalog() : response({}, status))));
    assert.equal(calls, 2);
  }
});

test("truncated AI output is rejected", async () => {
  let calls = 0;
  await assert.rejects(analyzeFree(options(async () => ++calls === 1 ? catalog() : response({ choices: [{ finish_reason: "length", message: { content: result } }] }))), /중간/);
});

test("PKCE uses random S256 verifier and state without persisting an API key", async () => {
  const stored = new Map(), location = { href: "https://example.github.io/my-workbench/", assign: (url) => { location.target = url; } };
  await startConnection({ storage: { setItem: (key, value) => stored.set(key, value) }, location });
  const url = new URL(location.target), pending = JSON.parse(stored.get(AUTH_SESSION_KEY));
  assert.equal(url.origin, "https://openrouter.ai");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("state"), pending.state);
  const callback = new URL(url.searchParams.get("callback_url"));
  assert.equal(callback.origin + callback.pathname, location.href);
  assert.equal(callback.searchParams.get("state"), pending.state);
  assert.equal(pending.key, undefined);
});

test("provider adding only code to the registered callback completes the PKCE round trip", async () => {
  const stored = new Map();
  const storage = { setItem: (key, value) => stored.set(key, value), getItem: (key) => stored.get(key), removeItem: (key) => stored.delete(key) };
  const location = { href: "https://example.github.io/my-workbench/?old=value#section", assign: (url) => { location.target = url; } };
  await startConnection({ storage, location });
  const auth = new URL(location.target);
  const callback = new URL(auth.searchParams.get("callback_url"));
  callback.searchParams.set("code", "provider-code");
  let cleaned;
  const key = await finishConnection({ storage, location: { href: callback.href }, history: { replaceState: (_, __, url) => { cleaned = url; } }, fetchImpl: async (_, init) => {
    const body = JSON.parse(init.body);
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body.code_verifier));
    assert.equal(Buffer.from(hash).toString("base64url"), auth.searchParams.get("code_challenge"));
    assert.equal(body.code, "provider-code");
    return response({ key: "temporary-test-key" });
  } });
  assert.equal(key, "temporary-test-key");
  assert.equal(cleaned, "/my-workbench/");
  assert.equal(stored.size, 0);
});

test("OAuth state mismatch removes callback data and never exchanges a key", async () => {
  let removed = false, cleaned = "";
  const storage = { getItem: () => JSON.stringify({ verifier: "v", state: "correct", createdAt: Date.now() }), removeItem: () => { removed = true; } };
  await assert.rejects(finishConnection({ storage, location: { href: "https://example.github.io/my-workbench/?code=temporary&state=wrong" }, history: { replaceState: (_, __, url) => { cleaned = url; } }, fetchImpl: async () => assert.fail("must not exchange") }));
  assert.ok(removed); assert.equal(cleaned, "/my-workbench/");
});

test("OAuth success returns a key in memory only and strips callback code", async () => {
  let posted, cleaned;
  const storage = { getItem: () => JSON.stringify({ verifier: "verifier", state: "state", createdAt: Date.now() }), removeItem: () => {}, setItem: () => assert.fail("must not store key") };
  const key = await finishConnection({ storage, location: { href: "https://example.github.io/my-workbench/?code=once&state=state" }, history: { replaceState: (_, __, url) => { cleaned = url; } }, fetchImpl: async (_, init) => { posted = JSON.parse(init.body); return response({ key: "test-secret-only" }); } });
  assert.equal(key, "test-secret-only"); assert.equal(posted.code_verifier, "verifier"); assert.equal(cleaned, "/my-workbench/");
});
