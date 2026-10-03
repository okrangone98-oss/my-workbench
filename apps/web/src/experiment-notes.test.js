import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PROFILE, NOTEBOOK_KEY, createAnalysisPrompt, emptyNote, loadNotebook, mergeNotebook, normalizeNote, parseAnalysis, parseNotebook, safeUrl, saveNotebook } from "./experiment-notes.js";

const note = (patch = {}) => ({ ...emptyNote(), title: "AI 소식 테스트", content: "AI로 행사 홍보 장면 초안을 만들 수 있다.", ...patch });
const notebook = (notes = []) => ({ version: 1, profile: DEFAULT_PROFILE, notes });
const storage = () => { const data = new Map(); return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }; };

test("records survive reload and unknown secret fields are excluded from storage and export", () => {
  const target = storage();
  saveNotebook({ ...notebook([note({ apiKey: "secret-fixture", result: "30분 완성" })]), apiKey: "secret-fixture" }, target);
  const restored = loadNotebook(target).data;
  assert.equal(restored.notes[0].result, "30분 완성");
  assert.ok(!target.getItem(NOTEBOOK_KEY).includes("secret-fixture"));
});

test("damaged stored records are preserved instead of silently overwriting them", () => {
  const target = storage(); target.setItem(NOTEBOOK_KEY, "invalid-json");
  assert.ok(loadNotebook(target).error);
  assert.equal(target.getItem(NOTEBOOK_KEY), "invalid-json");
});

test("invalid and duplicate imported records are rejected atomically", () => {
  const first = note();
  assert.throws(() => parseNotebook(notebook([first, { ...first }])));
  assert.throws(() => parseNotebook(notebook([first, { id: "bad" }])));
  assert.throws(() => parseNotebook({ version: 2, notes: [] }));
});

test("restore merges additions and preserves the newer version of a record", () => {
  const first = note({ id: "first", updatedAt: "2026-10-04T10:00:00Z" });
  const older = { ...first, content: "old", updatedAt: "2026-10-03T10:00:00Z" };
  const extra = note({ id: "extra" });
  const merged = mergeNotebook(notebook([first]), notebook([older, extra]));
  assert.equal(merged.notes.length, 2);
  assert.equal(merged.notes.find((n) => n.id === "first").content, first.content);
});

test("URLs with executable schemes or embedded credentials cannot be opened", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,hi", "https://user:pass@example.com", "/local", "invalid"]) assert.equal(safeUrl(url), "");
  assert.equal(safeUrl("https://example.com/docs"), "https://example.com/docs");
});

test("analysis needs source text, limits batch size and carries personal criteria", () => {
  assert.throws(() => createAnalysisPrompt([], DEFAULT_PROFILE));
  assert.throws(() => createAnalysisPrompt([note({ content: "", sourceUrl: "https://threads.net/post" })], DEFAULT_PROFILE));
  assert.throws(() => createAnalysisPrompt(Array.from({ length: 6 }, () => note()), DEFAULT_PROFILE));
  assert.throws(() => createAnalysisPrompt([note({ content: "가".repeat(24000) })], DEFAULT_PROFILE));
  const prompt = createAnalysisPrompt([note()], DEFAULT_PROFILE);
  assert.ok(prompt.includes(DEFAULT_PROFILE.goal));
  assert.ok(prompt.includes("인터넷에 접속했다고 주장"));
});

test("AI recommendations validate source references and mark fabricated quotations", () => {
  const source = note({ id: "source" });
  const recommendation = { noteId: "source", title: "장면 초안 만들기", steps: ["사진 선정"], successCriteria: "30분 완성", sourceQuote: "AI로 행사 홍보" };
  const result = parseAnalysis(JSON.stringify({ summary: "요약", recommendations: [recommendation] }), [source]);
  assert.equal(result.recommendations[0].quoteVerified, true);
  assert.equal(parseAnalysis(JSON.stringify({ summary: "요약", recommendations: [{ ...recommendation, sourceQuote: "없는 인용" }] }), [source]).recommendations[0].quoteVerified, false);
  assert.throws(() => parseAnalysis(JSON.stringify({ summary: "요약", recommendations: [{ ...recommendation, noteId: "invented" }] }), [source]));
  assert.throws(() => parseAnalysis("broken", [source]));
});

test("normalization protects status and numeric fields", () => {
  const value = normalizeNote(note({ status: "__proto__", evidence: "made-up", spentMinutes: -3, revisions: "NaN" }));
  assert.equal(value.status, "idea"); assert.equal(value.evidence, "unverified"); assert.equal(value.spentMinutes, 0); assert.equal(value.revisions, 0);
});
