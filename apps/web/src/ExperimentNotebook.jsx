import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Check, ClipboardCheck, Copy, Download, ExternalLink, FileUp, FlaskConical, Link2, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { DEFAULT_PROFILE, EVIDENCE_LABELS, MAX_TEXT, NOTEBOOK_KEY, STATUS_LABELS, createAnalysisPrompt, emptyNote, loadNotebook, mergeNotebook, normalizeNote, notebookMarkdown, parseNotebook, safeUrl, saveNotebook } from "./experiment-notes.js";
import { analyzeFree, finishConnection, startConnection } from "./free-ai.js";
import "./experiment-notebook.css";

const DRAFT_KEY = `${NOTEBOOK_KEY}:draft`;
const example = {
  title: "AI 홍보영상 소식, 내 행사에서도 쓸 수 있을까?",
  content: "[학습용 가상 소식] 행사 사진과 안내문으로 AI 홍보영상 초안을 만들 수 있다는 게시물을 보았다. 제작 시간과 수정 횟수, 행사 대상에 맞는 안내가 포함되는지 직접 비교해보고 싶다. 무료로 사용할 수 있는 도구와 이용 조건은 공식 문서에서 따로 확인해야 한다.",
  claim: "사진과 안내문만으로 홍보영상 초안 제작 시간을 줄일 수 있다는 주장",
  application: "내가 준비하는 행사의 홍보 콘텐츠 초안 만들기",
  experiment: "내 행사 사진 3장과 안내문으로 15초 영상의 장면 구성 초안을 만든다.",
  successCriteria: "30분 안에 장면 구성 3개 완성, 일시·장소·신청 방법 누락 0개, 수정 2회 이내",
};

function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function readSourceFile(file) {
  if (file.size > 20 * 1024 * 1024) throw new Error("파일은 20MB 이내로 선택해주세요.");
  const extension = file.name.toLowerCase().split(".").at(-1);
  let content;
  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false });
    try {
      const pdf = await loadingTask.promise;
      if (pdf.numPages > 100) throw new Error("100쪽 이내의 PDF를 선택해주세요.");
      const pages = [];
      for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number);
        const items = await page.getTextContent();
        pages.push(items.items.map((item) => item.str || "").join(" ").trim());
      }
      content = pages.join("\n\n");
      if (!content.trim()) throw new Error("이 PDF에는 추출할 글자가 없습니다. 스캔 PDF는 먼저 OCR로 글자를 꺼내주세요.");
    } finally { await loadingTask.destroy(); }
  } else if (["txt", "md"].includes(extension)) content = await file.text();
  else throw new Error("TXT, MD, 글자가 있는 PDF 파일을 지원합니다.");
  if (!content.trim()) throw new Error("파일에 읽을 내용이 없습니다.");
  if (content.length > MAX_TEXT) throw new Error("소식은 24,000자 이내로 정리해서 넣어주세요.");
  return content;
}

function Field({ label, name, draft, setDraft, multiline = false, ...props }) {
  const Component = multiline ? "textarea" : "input";
  return <label className="lab-field"><span>{label}</span><Component name={name} value={draft[name]} onChange={(event) => setDraft((current) => ({ ...current, [name]: event.target.value }))} {...(multiline ? { rows: 3 } : { type: "text" })} {...props} /></label>;
}

export default function ExperimentNotebook() {
  const [loaded] = useState(() => loadNotebook(localStorage));
  const [data, setData] = useState(loaded.data);
  const [storageError, setStorageError] = useState(loaded.error);
  const [draft, setDraft] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); return saved?.title ? { ...emptyNote(), ...normalizeNote(saved) } : emptyNote(); } catch { return emptyNote(); }
  });
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [key, setKey] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [settings, setSettings] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [aiError, setAiError] = useState("");
  const sourceRef = useRef(null), backupRef = useRef(null), editorRef = useRef(null), abortRef = useRef(null), authStarted = useRef(false);

  useEffect(() => {
    if (editing) editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editing, draft.id]);

  useEffect(() => {
    if (authStarted.current) return;
    authStarted.current = true;
    finishConnection().then((connectedKey) => {
      if (connectedKey) { setKey(connectedKey); setMessage("무료 AI가 연결되었습니다. 새로고침하면 연결 키가 지워집니다."); }
    }).catch((error) => { setAiError(error.message); setSettings(true); });
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }
      catch { setMessage("초안을 자동 저장하지 못했습니다. 저장 공간을 확인하거나 기록을 내보내주세요."); }
    }, 400);
    return () => clearTimeout(timer);
  }, [draft]);

  function commit(next, allowRecovery = false) {
    if (storageError && !allowRecovery) { setMessage("기존 기록을 보호하기 위해 저장을 멈췄습니다. 먼저 원본 백업과 복원을 진행하세요."); return false; }
    try { const clean = saveNotebook(next, localStorage); setData(clean); setStorageError(""); return true; }
    catch { setMessage("기록을 저장하지 못했습니다. 브라우저 공간을 확인하고 백업을 내려받으세요."); return false; }
  }

  function openNew() { setDraft(emptyNote()); setEditing(true); setMessage(""); }
  function openNote(note) { setDraft({ ...note }); setEditing(true); setMessage(""); }
  function saveDraft(event) {
    event.preventDefault();
    if (!draft.title.trim()) { setMessage("소식 제목을 적어주세요."); return; }
    if ([draft.sourceUrl, draft.evidenceUrl].some((url) => url.trim() && !safeUrl(url))) { setMessage("출처는 http 또는 https로 시작하는 주소를 입력해주세요."); return; }
    if (draft.status === "completed" && !draft.result.trim()) { setMessage("실험 완료로 바꾸기 전에 관찰한 결과를 적어주세요."); return; }
    const note = normalizeNote({ ...draft, title: draft.title.trim(), updatedAt: new Date().toISOString() });
    if (commit({ ...data, notes: [note, ...data.notes.filter((item) => item.id !== note.id)] })) { setDraft(note); setMessage("소식을 저장했습니다. 같은 브라우저에서 다시 열 수 있습니다."); setSelected((current) => current.includes(note.id) ? current : [...current.slice(0, 4), note.id]); }
  }

  function deleteNote(note) {
    if (!window.confirm(`‘${note.title}’ 소식과 실험 기록을 삭제할까요?`)) return;
    if (commit({ ...data, notes: data.notes.filter((item) => item.id !== note.id) })) {
      setSelected((current) => current.filter((id) => id !== note.id));
      if (draft.id === note.id) { setDraft(emptyNote()); setEditing(false); }
      setMessage("기록을 삭제했습니다.");
    }
  }

  async function readFile(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    const draftId = draft.id;
    setFileBusy(true); setMessage("파일에서 글자를 읽고 있습니다.");
    try {
      const content = await readSourceFile(file);
      setDraft((current) => current.id === draftId ? { ...current, content, title: current.title || file.name.replace(/\.[^.]+$/, "") } : current);
      setMessage("파일을 읽었습니다. 원문 순서와 빠진 내용이 없는지 확인해주세요.");
    } catch (error) { setMessage(error.message || "파일을 읽지 못했습니다."); }
    finally { setFileBusy(false); }
  }

  async function restore(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("백업은 20MB 이내로 선택해주세요.");
      const imported = parseNotebook(await file.text());
      if (storageError && !window.confirm("읽지 못한 원본을 먼저 내려받았나요? 선택한 백업으로 복원합니다.")) return;
      if (commit(storageError ? imported : mergeNotebook(data, imported), true)) setMessage("백업을 복원했습니다. 같은 기록은 더 최근 내용을 유지했습니다.");
    } catch (error) { setMessage(error.message || "백업을 읽지 못했습니다."); }
  }

  const chosen = data.notes.filter((note) => selected.includes(note.id));
  async function runAnalysis() {
    setAiError("");
    if (!consent) { setAiError("선택한 원문과 내 관심을 OpenRouter에 보내는 데 동의해주세요."); return; }
    const controller = new AbortController(); abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 60000);
    setBusy(true); setAnalysis(null);
    try { setAnalysis(await analyzeFree({ key, notes: chosen, profile: data.profile, signal: controller.signal })); }
    catch (error) { setAiError(error.name === "AbortError" ? "분석이 취소되었거나 60초를 넘었습니다. 입력을 줄여 다시 시도하세요." : error instanceof TypeError ? "네트워크 연결을 확인해주세요. AI 서비스에 연결하지 못했습니다." : error.message); }
    finally { clearTimeout(timeout); setBusy(false); abortRef.current = null; }
  }

  async function copyPrompt() {
    try { await navigator.clipboard.writeText(createAnalysisPrompt(chosen, data.profile)); setMessage("분석 요청문을 복사했습니다. 현재 사용하는 ChatGPT나 Codex에 붙여넣으세요."); }
    catch (error) { setMessage(error.name === "NotAllowedError" ? "클립보드 접근이 허용되지 않았습니다." : error.message); }
  }

  function applyRecommendation(item) {
    const note = data.notes.find((note) => note.id === item.noteId);
    if (!note) { setMessage("추천의 원본 소식이 삭제되었습니다."); return; }
    if (note.experiment && !window.confirm("이 소식의 기존 실험 내용을 AI 제안으로 바꿀까요?")) return;
    const next = { ...note, status: "planned", experiment: `${item.title}\n${item.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}`, successCriteria: item.successCriteria, application: item.reason, aiAnalysis: JSON.stringify(analysis, null, 2), aiModel: analysis.model, updatedAt: new Date().toISOString() };
    if (commit({ ...data, notes: data.notes.map((note) => note.id === next.id ? next : note) })) { openNote(next); setMessage("실험 초안을 저장했습니다. 성공 기준을 확인한 뒤 시작하세요."); }
  }

  const visible = data.notes.filter((note) => (filter === "all" || note.status === filter) && `${note.title} ${note.content} ${note.claim}`.toLowerCase().includes(query.toLowerCase()));
  const date = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(new Date());

  return <main className="lab-shell">
    <header className="lab-hero">
      <div><p className="lab-eyebrow">MY WORKBENCH / LEARN BY DOING</p><h1>소식을 읽고,<br /><span>내 실험으로.</span></h1><p className="lab-intro">AI가 할 수 있다는 이야기에서<br />내가 직접 해본 작은 변화까지.</p><p className="lab-date">{date} · 나의 AI 실험 노트</p></div>
      <div className="lab-hero-card"><FlaskConical size={34} /><h2>오늘은 하나만 해보기</h2><p>소식 1~5개를 모아 비교하고<br />내 업무에 쓸 실험 하나를 고르세요.</p><button className="lab-primary" onClick={openNew}><Plus size={18} />소식 기록하기</button><span>무료 모델 전용 · 기록은 내 브라우저에</span></div>
    </header>

    <section className="lab-stats" aria-label="실험 현황">
      {Object.entries(STATUS_LABELS).map(([status, label]) => <button key={status} className={filter === status ? "selected" : ""} aria-pressed={filter === status} onClick={() => setFilter(filter === status ? "all" : status)}><span>{label}</span><strong>{data.notes.filter((note) => note.status === status).length.toString().padStart(2, "0")}</strong></button>)}
    </section>

    {storageError && <div className="lab-error" role="alert">{storageError}<button onClick={() => downloadFile("experiment-notes-recovery.txt", localStorage.getItem(NOTEBOOK_KEY) || "", "text/plain")}>원본 내려받기</button></div>}
    {message && <p className="lab-message" role="status">{message}</p>}

    <div className="lab-columns">
      <section className="lab-main">
        <div className="lab-section-heading"><div><p className="lab-eyebrow">01 / COLLECT</p><h2>소식 저장함</h2></div><button className="lab-secondary" onClick={() => { setDraft({ ...emptyNote(), ...example }); setEditing(true); }}><BookOpen size={16} />예제로 시작</button></div>
        <div className="lab-list-tools"><label className="lab-search"><Search size={17} /><input aria-label="소식 검색" placeholder="제목, 주장, 원문 검색" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="lab-text-button" onClick={() => { setFilter("all"); setQuery(""); }}>전체 보기</button></div>
        {!visible.length && <div className="lab-empty"><FlaskConical size={30} /><h3>{data.notes.length ? "조건에 맞는 소식이 없어요" : "읽은 소식 하나에서 시작해요"}</h3><p>Threads 링크와 관심이 생긴 내용을 남겨보세요.<br />링크의 원문은 직접 붙여넣어 주세요.</p><button className="lab-primary" onClick={openNew}><Plus size={17} />첫 소식 기록하기</button></div>}
        <div className="lab-note-list">{visible.map((note) => <article className="lab-note-card" key={note.id}>
          <div className="lab-card-meta"><span className={`lab-badge ${note.status}`}>{STATUS_LABELS[note.status]}</span><span className="lab-evidence">{EVIDENCE_LABELS[note.evidence]}</span><label className="lab-compare"><input type="checkbox" aria-label={`${note.title} 비교 선택`} checked={selected.includes(note.id)} onChange={(event) => { if (event.target.checked && selected.length >= 5) { setMessage("비교할 소식은 최대 5개입니다."); return; } setSelected((current) => event.target.checked ? [...current, note.id] : current.filter((id) => id !== note.id)); }} />비교</label></div>
          <h3><button onClick={() => openNote(note)}>{note.title}</button></h3><p className="lab-card-content">{note.claim || note.content || "내용을 더해보세요."}</p>
          {note.experiment && <p className="lab-card-experiment"><FlaskConical size={15} />{note.experiment.split("\n")[0]}</p>}
          <div className="lab-card-footer"><span>{new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(note.updatedAt))}</span>{safeUrl(note.sourceUrl) && <a href={safeUrl(note.sourceUrl)} target="_blank" rel="noopener noreferrer">원문 열기<ExternalLink size={13} /></a>}<button onClick={() => openNote(note)}>기록 열기<ArrowRight size={14} /></button><button aria-label={`${note.title} 삭제`} onClick={() => deleteNote(note)}><Trash2 size={15} /></button></div>
        </article>)}</div>

        {editing && <section className="lab-editor" ref={editorRef} aria-label="소식과 실험 편집" style={{ scrollMarginTop: 90 }}>
          <div className="lab-section-heading"><div><p className="lab-eyebrow">MY NOTE</p><h2>소식에서 실험까지</h2></div><button aria-label="편집 닫기" className="lab-icon-button" onClick={() => setEditing(false)}><X size={20} /></button></div>
          <form onSubmit={saveDraft}>
            <Field label="소식 제목" name="title" draft={draft} setDraft={setDraft} placeholder="예: AI 영상 제작, 내 행사에도 쓸 수 있을까?" maxLength={200} required />
            <Field label="Threads 또는 기사 링크" name="sourceUrl" draft={draft} setDraft={setDraft} placeholder="https://…" maxLength={2000} />
            <div className="lab-file-row"><span>원문은 여기서 직접 읽어요</span><button type="button" className="lab-secondary" disabled={fileBusy} onClick={() => sourceRef.current.click()}><FileUp size={16} />{fileBusy ? "읽는 중…" : "TXT · MD · PDF 읽기"}</button><input ref={sourceRef} hidden type="file" accept=".txt,.md,.pdf" onChange={readFile} /></div>
            <Field label="소식 원문 / 읽은 내용" name="content" draft={draft} setDraft={setDraft} multiline rows={7} maxLength={MAX_TEXT} placeholder="주장과 조건을 판단할 수 있도록 게시물 내용을 붙여넣으세요. 링크만으로 원문을 읽지는 않습니다." />
            <div className="lab-subheading"><span>1</span><h3>주장과 근거 구분하기</h3></div>
            <Field label="이 소식이 주장하는 것은?" name="claim" draft={draft} setDraft={setDraft} multiline maxLength={3000} />
            <div className="lab-form-grid"><label className="lab-field"><span>내가 확인한 상태</span><select value={draft.evidence} onChange={(event) => setDraft((current) => ({ ...current, evidence: event.target.value }))}>{Object.entries(EVIDENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Field label="공식 문서 / 실행 결과 링크" name="evidenceUrl" draft={draft} setDraft={setDraft} placeholder="https://…" maxLength={2000} /></div>
            <Field label="무엇을 확인했나요? 아직 모르는 점은?" name="evidenceNote" draft={draft} setDraft={setDraft} multiline maxLength={5000} />
            <div className="lab-subheading"><span>2</span><h3>내 업무의 작은 실험으로</h3></div>
            <Field label="내 업무에서 해결할 문제" name="application" draft={draft} setDraft={setDraft} multiline maxLength={5000} />
            <Field label="기존 프로젝트에서 무엇을 시험할까요?" name="experiment" draft={draft} setDraft={setDraft} multiline rows={4} maxLength={5000} />
            <Field label="성공했다고 판단할 결과" name="successCriteria" draft={draft} setDraft={setDraft} multiline placeholder="예: 30분 안에 안내문 완성, 필수 정보 누락 0개" maxLength={3000} />
            <div className="lab-subheading"><span>3</span><h3>실제로 해보고 기록하기</h3></div>
            <div className="lab-form-grid"><label className="lab-field"><span>진행 상태</span><select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="lab-form-grid"><Field label="소요 시간 (분)" name="spentMinutes" draft={draft} setDraft={setDraft} type="number" min="0" max="100000" /><Field label="수정 횟수" name="revisions" draft={draft} setDraft={setDraft} type="number" min="0" max="100000" step="1" /></div></div>
            <Field label="관찰한 결과 / 성공 기준과 비교" name="result" draft={draft} setDraft={setDraft} multiline maxLength={5000} />
            <Field label="배운 개념과 직접 바꿔볼 한 가지" name="learning" draft={draft} setDraft={setDraft} multiline maxLength={5000} />
            <Field label="다음 행동" name="nextAction" draft={draft} setDraft={setDraft} placeholder="예: 안내문 자동 생성 기능을 내 프로젝트에 추가하기" maxLength={3000} />
            {draft.aiAnalysis && <details className="lab-details"><summary>저장된 AI 추천 · {draft.aiModel}</summary><pre>{draft.aiAnalysis}</pre></details>}
            <div className="lab-save-row"><span>입력 초안은 자동 보관됩니다.</span><button className="lab-primary" type="submit" disabled={fileBusy || Boolean(storageError)}><Check size={17} />소식·실험 저장</button></div>
          </form>
        </section>}
      </section>

      <aside className="lab-aside">
        <section className="lab-panel"><p className="lab-eyebrow">MY COMPASS</p><h2>내 관심과 기준</h2><p className="lab-muted">추천이 내 일에 가까워지는 기준이에요.</p>{[["interests", "흥미 있는 주제"], ["work", "내가 하는 업무"], ["goal", "배우고 싶은 것"]].map(([field, label]) => <label key={field} className="lab-field"><span>{label}</span><textarea rows={2} maxLength={2000} value={data.profile[field]} onChange={(event) => commit({ ...data, profile: { ...data.profile, [field]: event.target.value } })} /></label>)}<label className="lab-field"><span>한 실험에 쓸 시간 (분)</span><input type="number" min="5" max="1440" value={data.profile.availableMinutes} onChange={(event) => commit({ ...data, profile: { ...data.profile, availableMinutes: event.target.value } })} /></label></section>

        <section className="lab-panel lab-ai-panel"><p className="lab-eyebrow">02 / FIND AN EXPERIMENT</p><h2><Sparkles size={21} />내가 해볼 실험 찾기</h2><p>선택한 소식 {chosen.length}개를 내 관심과 함께 비교합니다. AI 제안은 직접 확인한 근거와 구분해서 보세요.</p><button className="lab-secondary" onClick={() => setSettings((current) => !current)}><Link2 size={16} />{key ? "무료 AI 연결됨" : "무료 AI 연결"}</button>
          {settings && <div className="lab-connection"><p>OpenRouter 계정으로 연결하세요. 앱은 무료 모델만 호출하며, 연결 키는 새로고침하면 지워집니다.</p><button className="lab-primary" onClick={async () => { try { if (draft.title) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); await startConnection(); } catch { setAiError("연결을 시작하지 못했습니다. 브라우저 저장 권한과 인터넷 연결을 확인해주세요."); } }}>OpenRouter 계정 연결<ExternalLink size={15} /></button><details className="lab-details"><summary>이미 가진 개인 키로 연결</summary><label className="lab-field"><span>개인 OpenRouter 키 · 저장하지 않음</span><input type="password" autoComplete="off" value={manualKey} onChange={(event) => setManualKey(event.target.value)} /></label><button className="lab-secondary" onClick={() => { if (!manualKey.trim()) return; setKey(manualKey.trim()); setManualKey(""); setMessage("개인 키를 이번 실행에만 연결했습니다."); }}>임시 연결</button></details>{key && <button className="lab-text-button" onClick={() => { abortRef.current?.abort(); setKey(""); setManualKey(""); }}>연결 해제</button>}<a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer">내 연결 키 관리<ExternalLink size={12} /></a></div>}
          <label className="lab-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>선택한 원문·근거와 내 관심을 OpenRouter에 보내겠습니다. 공개 소식만 사용합니다.</span></label>
          <button className="lab-primary" disabled={busy || !chosen.length || !key || !consent} onClick={runAnalysis}><Sparkles size={17} />{busy ? "소식을 비교하는 중…" : "무료 AI로 실험 추천받기"}</button>{busy && <button className="lab-text-button" onClick={() => abortRef.current?.abort()}>요청 취소</button>}<button className="lab-text-button" disabled={!chosen.length} onClick={copyPrompt}><Copy size={15} />ChatGPT · Codex 요청문 복사</button><p className="lab-small">무료 모델이 중단되거나 한도에 도달하면 요청을 멈춥니다. 유료 모델로 자동 전환하지 않습니다.</p>{aiError && <p className="lab-error" role="alert">{aiError}</p>}
        </section>

        <section className="lab-panel"><p className="lab-eyebrow">03 / KEEP LEARNING</p><h2>하나씩 이해하기</h2>{[["파일 처리", "파일을 선택하는 것과 글자를 읽는 것은 달라요. 같은 원문을 TXT와 PDF로 넣고 빠진 내용과 문장 순서를 비교해보세요."], ["저장 방식", "초안과 기록은 이 브라우저에 저장돼요. 새로고침 후 기록을 확인하고 JSON 백업을 다른 브라우저에서 복원해보세요."], ["API", "실험 추천 버튼이 선택한 원문과 관심을 AI 서비스에 보냅니다. 연결되지 않은 경우와 무료 한도 오류를 비교해보세요."], ["환경변수와 배포", "이 앱은 비밀키 없는 정적 사이트예요. GitHub Pages 빌드는 VITE_BASE_PATH 설정으로 웹 주소의 폴더 경로를 맞춥니다."]].map(([title, description]) => <details className="lab-details" key={title}><summary><BookOpen size={15} />{title}</summary><p>{description}</p></details>)}</section>
        <section className="lab-panel lab-backup"><h2><Download size={19} />내 기록 보관하기</h2><p>브라우저를 바꾸거나 데이터를 지우기 전에 백업하세요. 내려받은 파일은 G드라이브 개발 작업 폴더에 보관할 수 있어요.</p><button className="lab-secondary" onClick={() => downloadFile("my-workbench-experiments.json", JSON.stringify(parseNotebook(data), null, 2), "application/json")}><Download size={15} />JSON 백업</button><button className="lab-secondary" onClick={() => downloadFile("my-workbench-experiments.md", notebookMarkdown(data), "text/markdown")}><Download size={15} />읽기 쉬운 기록</button><button className="lab-text-button" onClick={() => backupRef.current.click()}><FileUp size={15} />백업 복원</button><input ref={backupRef} hidden type="file" accept=".json" onChange={restore} /><p className="lab-small">개인 기록은 GitHub에 올라가지 않습니다. 기기 간 자동 동기화는 지원하지 않습니다.</p></section>
      </aside>
    </div>

    {analysis && <section className="lab-analysis" aria-label="AI 실험 추천"><div className="lab-section-heading"><div><p className="lab-eyebrow">AI SUGGESTIONS / REVIEW BEFORE TRYING</p><h2>내 업무에 가까운 작은 실험</h2></div><span className="lab-badge">{analysis.model}</span></div><p>{analysis.summary}</p>{analysis.cautions.length > 0 && <div className="lab-cautions"><ClipboardCheck size={19} /><div><strong>직접 확인할 것</strong><ul>{analysis.cautions.map((caution, index) => <li key={index}>{caution}</li>)}</ul></div></div>}<div className="lab-recommendations">{analysis.recommendations.map((item, index) => <article key={`${item.noteId}-${index}`}><span className="lab-recommendation-number">0{index + 1}</span><h3>{item.title}</h3><p>{item.reason}</p>{item.sourceQuote && <blockquote>{item.sourceQuote}<span>{item.quoteVerified ? "제공 원문과 일치 · 사실 검증은 별도" : "원문과 일치하지 않는 인용 · 확인 필요"}</span></blockquote>}<ol>{item.steps.map((step, index) => <li key={index}>{step}</li>)}</ol><div className="lab-criteria"><strong>성공 기준</strong><p>{item.successCriteria}</p><strong>배우는 것 · 약 {item.estimatedMinutes}분</strong><p>{item.learning}</p></div><button className="lab-primary" onClick={() => applyRecommendation(item)}>이 실험 준비하기<ArrowRight size={16} /></button></article>)}</div></section>}
    <footer className="lab-footer">읽은 것보다, 해본 것이 남도록. <span>My Workbench · AI 실험 노트</span></footer>
  </main>;
}
