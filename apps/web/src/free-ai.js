import { createAnalysisPrompt, parseAnalysis } from "./experiment-notes.js";

const API = "https://openrouter.ai/api/v1";
export const FREE_MODEL = "openrouter/free";
export const AUTH_SESSION_KEY = "my-workbench:openrouter-pkce";

function requestError(status) {
  if (status === 401 || status === 403) return "OpenRouter 연결을 확인해주세요. 연결이 만료됐거나 무료 제공자를 사용할 권한이 없습니다.";
  if (status === 429) return "무료 사용 한도에 도달했습니다. 잠시 후 다시 시도하세요. 유료 모델로 전환하지 않습니다.";
  if (status === 402) return "무료 모델 요청이 거절되었습니다. 결제하거나 유료 모델로 전환하지 않았습니다.";
  return "무료 AI 서비스가 응답하지 못했습니다. 나중에 다시 시도하거나 분석 요청문을 복사하세요.";
}

export async function analyzeFree({ key, notes, profile, signal, fetchImpl = fetch }) {
  if (!key?.trim()) throw new Error("먼저 무료 AI를 연결해주세요.");
  const prompt = createAnalysisPrompt(notes, profile);
  const catalogResponse = await fetchImpl(`${API}/models`, { signal });
  if (!catalogResponse.ok) throw new Error("무료 모델 가격을 확인하지 못해 요청을 중단했습니다.");
  const catalog = await catalogResponse.json();
  const model = catalog.data?.find((item) => item.id === FREE_MODEL);
  const requiredPrices = [model?.pricing?.prompt, model?.pricing?.completion];
  if (!model || requiredPrices.some((price) => price === undefined || price === null || price === "" || !Number.isFinite(Number(price)) || Number(price) !== 0) || Object.values(model.pricing).some((price) => price == null || !Number.isFinite(Number(price)) || Number(price) !== 0)) throw new Error("무료 모델의 가격이 0인지 확인되지 않아 요청을 중단했습니다.");
  const response = await fetchImpl(`${API}/chat/completions`, {
    method: "POST", signal,
    headers: { Authorization: `Bearer ${key.trim()}`, "Content-Type": "application/json", "X-OpenRouter-Title": "My Workbench Experiments" },
    body: JSON.stringify({ model: FREE_MODEL, messages: [{ role: "user", content: prompt }], max_tokens: 2400, response_format: { type: "json_object" }, provider: { max_price: { prompt: 0, completion: 0 }, allow_fallbacks: false } }),
  });
  if (!response.ok) throw new Error(requestError(response.status));
  const value = await response.json();
  if (value.error) throw new Error(requestError(Number(value.error.code)));
  const content = value.choices?.[0]?.message?.content;
  if (typeof content !== "string" || value.choices[0].finish_reason === "length") throw new Error("AI 응답이 비어 있거나 중간에 끝났습니다. 소식 길이를 줄여 다시 시도하세요.");
  return { ...parseAnalysis(content, notes), model: typeof value.model === "string" ? value.model : FREE_MODEL, generatedAt: new Date().toISOString() };
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function startConnection({ storage = sessionStorage, location = window.location, cryptoImpl = crypto } = {}) {
  const verifier = base64url(cryptoImpl.getRandomValues(new Uint8Array(48)));
  const state = base64url(cryptoImpl.getRandomValues(new Uint8Array(24)));
  const challenge = base64url(new Uint8Array(await cryptoImpl.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  const callback = new URL(location.href);
  callback.search = ""; callback.hash = "";
  storage.setItem(AUTH_SESSION_KEY, JSON.stringify({ verifier, state, createdAt: Date.now() }));
  const auth = new URL("https://openrouter.ai/auth");
  auth.search = new URLSearchParams({ callback_url: callback.href, code_challenge: challenge, code_challenge_method: "S256", state, key_label: "My Workbench Free AI" }).toString();
  location.assign(auth.href);
}

export async function finishConnection({ storage = sessionStorage, location = window.location, history = window.history, fetchImpl = fetch } = {}) {
  const url = new URL(location.href);
  if (!url.searchParams.has("code") && !url.searchParams.has("error")) return null;
  const saved = storage.getItem(AUTH_SESSION_KEY);
  storage.removeItem(AUTH_SESSION_KEY);
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  const denied = url.searchParams.has("error");
  for (const name of ["code", "state", "error", "error_description"]) url.searchParams.delete(name);
  history.replaceState(null, "", url.pathname + url.search + url.hash);
  let pending;
  try { pending = JSON.parse(saved || "null"); } catch { pending = null; }
  if (denied || !pending || state !== pending.state || !code || Date.now() - pending.createdAt > 10 * 60 * 1000) throw new Error("AI 연결이 취소되었거나 만료되었습니다. 다시 연결해주세요.");
  const response = await fetchImpl(`${API}/auth/keys`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, code_verifier: pending.verifier, code_challenge_method: "S256" }) });
  if (!response.ok) throw new Error("OpenRouter 연결을 완료하지 못했습니다. 다시 연결해주세요.");
  const value = await response.json();
  if (typeof value.key !== "string" || !value.key) throw new Error("연결 키를 받지 못했습니다.");
  return value.key;
}
