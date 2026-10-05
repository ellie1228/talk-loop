// 말하기 탭의 '문법' (문법 뼈대 연습): 레슨별 설명 표 + 한 군데만 바꾼 문장을 빠르게 반복.
// 영어판 전용. wordlist.js가 이 파일을 불러오고, 이 파일이 레슨 데이터(basics-data.js)를 불러온다.
// 기록은 따로 쌓인다(kind: 'gram'). extra.js·drill.js의 도우미(pickNext, statOf, playText, runAuto …)를 쓴다.
'use strict';
const G = { lesson: 'g1', guide: true, current: null, shown: false, started: 0, ms: 0, state: { seq: 0, recent: [] } };
const gramStat = statOf('gram');
let GRAM_CARDS = [];

(() => {
  const style = document.createElement('style');
  style.textContent = `
    .gram-table{overflow-x:auto;margin:6px 0}
    .gram-table table{border-collapse:collapse;width:100%;min-width:420px;font-size:15px}
    .gram-table th,.gram-table td{border-bottom:1px solid #e1e7f0;padding:8px 10px;text-align:left}
    .gram-table th{background:#f3f6ff;color:#1d49e8;font-size:13px}
    .gram-table td:first-child{font-weight:800;color:#18223b;white-space:nowrap}
    .gram-tips{margin:8px 0;padding-left:18px;color:#33436a}.gram-tips li{margin:4px 0}
    .gram-goal{display:inline-block;background:#f3f6fc;color:#4b5775;border-radius:99px;padding:3px 12px;font-size:13px}
    .gram-hl{color:#1d49e8;background:#eef2ff;border-radius:6px;padding:0 3px}
    .gram-kohl{color:#9c4820;background:#fff4ef;border-radius:6px;padding:0 3px}
    #gramCard .prompt h2{margin:6px 0}
    #gramAnswer{border-top:1px solid #e5eaf3;padding:10px 0;text-align:center;display:grid;gap:6px}
    #gramAnswer h3{margin:0;font-size:28px}
    #gramWrong{background:#fff4ef;color:#9c4820;border-color:#ffddcc}#gramRight{background:#1d49e8;color:#fff;border-color:#1d49e8}
    #gramGrading,#gramReveal{margin-top:10px}
    #gramMini{text-align:left;background:#f8faff;border-radius:12px;padding:6px 10px;margin-top:6px;width:100%}
    .gram-list{margin:8px 0;padding-left:22px}.gram-list li{margin:6px 0}
    #gramDecks details{margin:6px 0}#gramDecks summary{font-weight:800;font-size:16px;cursor:pointer;padding:6px 0}
    #deckViewList .gram-sheet-guide{padding:10px 16px;background:#fff;border-bottom:1px solid #e1e7f0}
    .workspace>div{min-width:0}
    #gramGuideBtn{grid-column:1/-1}
    @media(max-width:760px){.seg button{padding:8px 2px;font-size:13px;min-height:44px}.seg button small{display:none}}`;
  document.head.appendChild(style);

  // 전환 버튼: 응용 바로 뒤에 [문법]
  const btn = document.createElement('button');
  btn.id = 'modeGram'; btn.setAttribute('role', 'tab'); btn.setAttribute('aria-selected', 'false');
  btn.innerHTML = '문법<small>뼈대 연습</small>';
  $('modeDrill').after(btn);
  const seg = btn.parentElement; seg.style.gridTemplateColumns = `repeat(${seg.children.length},1fr)`;

  const ws = document.createElement('div');
  ws.className = 'workspace'; ws.id = 'gramWorkspace'; ws.hidden = true;
  ws.innerHTML = `<aside><h2>문법 뼈대</h2><label>레슨<select id="gramLesson"></select></label>
    <button id="gramGuideBtn" class="auto" style="width:100%;margin:4px 0 10px">📖 설명 보기</button>
    <label>반복 방식<select id="gramOrder"><option value="sequence" selected>순서대로 익히기</option><option value="smart">오답 우선 · 골고루</option><option value="wrong">틀린 카드만</option><option value="new">새 카드만</option></select></label>
    <p class="muted small">같은 문장에서 한 군데만 바뀌어요. 파란 부분이 이번 레슨의 핵심이에요. 1~2초 안에 입에서 나오는 게 목표!</p></aside>
    <div><article class="card" id="gramGuide"></article>
    <article class="card drillcard" id="gramCard" hidden><div class="card-top"><span id="gramTag"></span><span id="gramPos"></span></div>
      <div class="prompt"><span id="gramForm" class="chip dir"></span><h2 id="gramKo"></h2><button id="gramMiniBtn" class="mini" aria-label="이 레슨 설명 보기">📖 설명</button><div id="gramMini" hidden></div></div>
      <div id="gramAnswer" hidden><h3 id="gramEn" lang="en"></h3><p id="gramNote" class="muted"></p><div id="gramAlt" class="similar" hidden></div>
        <div class="row"><button id="gramListen">▷ 모범 음성 <kbd>R</kbd></button><button id="gramSlow">천천히 듣기</button></div></div>
      <button id="gramReveal" class="primary wide">정답 확인 <span>Space</span></button>
      <div id="gramGrading" class="grading" hidden><button id="gramWrong">✕ 아직 막혀요 <kbd>1</kbd></button><button id="gramRight">○ 바로 말했어요 <kbd>2</kbd></button></div>
      <button id="gramSkip" class="textbutton">건너뛰기</button>
      <div class="autobar"><button id="autoGram" class="auto">▶ 툭툭 넘기기</button><label>간격<select id="autoGramGap"><option value="2">2초</option><option value="3" selected>3초</option><option value="5">5초</option><option value="8">8초</option></select></label></div>
    </article><p class="hint" id="gramHint" hidden>Space 정답 · 1 다시 연습 · 2 맞음 · R 음성 · → 건너뛰기</p></div>`;
  $('drillWorkspace').after(ws);

  SPEAK_MODES.gram = ['modeGram', 'gramWorkspace'];
  SPEAK_ENTER.gram = () => { if (!G.guide && !G.current) gramNext(); };
  AUTO_BTN.gram = 'autoGram';
  btn.onclick = () => setSpeakMode('gram');

  const s = document.createElement('script'); s.src = 'basics-data.js';
  s.onload = () => {
    const lessons = window.BASICS?.lessons || [];
    GRAM_CARDS = lessons.flatMap(l => l.cards.map((c, i) => ({ ...c, id: `${l.id}-${i + 1}`, lesson: l.id })));
    const groups = gramGroups();
    $('gramLesson').innerHTML = `<option value="all">전체 레슨 순서대로 (${GRAM_CARDS.length})</option><option value="mix">전체 레슨 섞기 (${GRAM_CARDS.length})</option>` +
      groups.map(([gname, ls]) => `<optgroup label="${esc(gname)}">${groups.length > 1 ? `<option value="grp:${esc(gname)}">▸ ${esc(gname)} 단원 전체 (${ls.reduce((n, l) => n + l.cards.length, 0)})</option>` : ''}${ls.map(l => `<option value="${esc(l.id)}">${esc(l.title)} (${l.cards.length})</option>`).join('')}</optgroup>`).join('');
    try { const v = localStorage.getItem('loop-gram-lesson'); if (v && [...$('gramLesson').options].some(o => o.value === v)) G.lesson = v; } catch {}
    renderGramDecks();
    $('gramLesson').value = G.lesson;
    showGuide(true);
    try { if (localStorage.getItem('loop-speak-mode') === 'gram') setSpeakMode('gram'); } catch {}
  };
  document.head.appendChild(s);
})();

const gramLessons = () => window.BASICS?.lessons || [];
const gramLessonData = (id = G.lesson) => gramLessons().find(l => l.id === id);
// 단원(group)별로 레슨을 묶는다. Basic Grammar in Use 레슨은 group만 다르게 주면 자동으로 따로 묶인다.
function gramGroups() { const m = new Map(); gramLessons().forEach(l => { const k = l.group || '기초 뼈대'; if (!m.has(k)) m.set(k, []); m.get(k).push(l); }); return [...m]; }
// 지금 고른 범위의 레슨들: 한 레슨 / 단원 전체 / 전체
function gramSelected() { const v = G.lesson; if (v === 'all' || v === 'mix') return gramLessons(); if (v.startsWith('grp:')) return gramLessons().filter(l => (l.group || '기초 뼈대') === v.slice(4)); return gramLessons().filter(l => l.id === v); }
const gramMulti = () => gramSelected().length !== 1;
function gramTableHtml(l) {
  const t = l.table || {};
  return `<p class="gram-goal">${esc(l.goal || '')}</p><div class="gram-table"><table><thead><tr>${(t.head || []).map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${(t.rows || []).map(r => `<tr>${r.map(c => `<td lang="en">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><ul class="gram-tips">${(l.tips || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
}
function markSub(text, sub, cls) {
  const t = String(text || ''), i = sub ? t.indexOf(sub) : -1;
  return i < 0 ? esc(t) : esc(t.slice(0, i)) + `<span class="${cls}">${esc(sub)}</span>` + esc(t.slice(i + sub.length));
}
function showGuide(on) {
  G.guide = on; stopAuto();
  $('gramGuide').hidden = !on; $('gramCard').hidden = on; $('gramHint').hidden = on;
  $('gramGuideBtn').textContent = on ? '✏️ 연습하기' : '📖 설명 보기';
  const sel = gramSelected(); if (!sel.length) return;
  if (on) {
    const n = sel.reduce((a, l) => a + l.cards.length, 0);
    const head = gramMulti() ? $('gramLesson').selectedOptions[0]?.textContent.replace(/\s*\(\d+\)$/, '').replace(/^▸ /, '') : sel[0].title;
    $('gramGuide').innerHTML = `<div class="card-top"><span>${esc(head)}</span><span>${n}문장</span></div>` +
      (gramMulti() ? `<p class="muted small">레슨 ${sel.length}개를 ${G.lesson === 'mix' ? '섞어서' : '순서대로'} 연습해요. 카드마다 📖를 누르면 그 레슨 설명을 바로 볼 수 있어요.</p><ol class="gram-list">${sel.map(l => `<li><b>${esc(l.title)}</b> <span class="muted">${esc(l.goal || '')} · ${l.cards.length}문장</span></li>`).join('')}</ol>` : gramTableHtml(sel[0])) +
      `<button id="gramStart" class="primary wide">${gramMulti() ? '연습 시작' : '이 레슨 연습 시작'} <span>Space</span></button>`;
    $('gramStart').onclick = () => showGuide(false);
  } else if (!G.current || !sel.some(l => l.id === G.current.lesson)) gramNext();
}
function gramPool() {
  const ids = new Set(gramSelected().map(l => l.id));
  let a = GRAM_CARDS.filter(c => ids.has(c.lesson));
  const o = $('gramOrder').value;
  if (o === 'wrong') a = a.filter(c => { const s = gramStat(c.id); return s.wrong && !s.stable; });
  if (o === 'new') a = a.filter(c => !gramStat(c.id).tries);
  return a;
}
function gramNext() {
  const pool = gramPool(); G.shown = false;
  $('gramAnswer').hidden = true; $('gramGrading').hidden = true; $('gramReveal').hidden = false;
  const order = G.lesson === 'mix' && $('gramOrder').value === 'sequence' ? 'smart' : $('gramOrder').value;
  const c = G.current = pickNext(pool, order, G.state, gramStat);
  const l = c ? gramLessonData(c.lesson) : null;
  $('gramTag').textContent = l ? l.title : '';
  $('gramMini').hidden = true;
  if (!c) { $('gramKo').textContent = $('gramOrder').value === 'new' ? '이 레슨의 새 카드를 모두 해봤어요!' : '이 조건에 맞는 카드가 없어요.'; $('gramForm').textContent = ''; $('gramPos').textContent = ''; return; }
  $('gramPos').textContent = (pool.indexOf(c) + 1) + ' / ' + pool.length;
  $('gramForm').textContent = c.form || '';
  $('gramKo').innerHTML = markSub(c.ko, c.ko_hl, 'gram-kohl');
  $('gramEn').innerHTML = markSub(c.en, c.hl, 'gram-hl');
  $('gramNote').textContent = c.note || '';
  $('gramAlt').hidden = !(c.alt || []).length;
  $('gramAlt').innerHTML = (c.alt || []).length ? `<p><b>같이 정답</b> <span lang="en">${esc(c.alt.join(' / '))}</span></p>` : '';
  G.started = performance.now();
}
function gramReveal(sound = true) {
  if (!G.current || G.shown) return; G.shown = true; G.ms = performance.now() - G.started;
  $('gramAnswer').hidden = false; $('gramGrading').hidden = false; $('gramReveal').hidden = true;
  if (sound) playText(G.current.en);
}
async function gramGrade(ok) {
  if (!G.current || !G.shown) return;
  const c = G.current; G.current = null;
  await logResult(c.id, ok, G.ms, 'gram');
  gramNext();
}
$('gramLesson').onchange = () => { G.lesson = $('gramLesson').value; G.state = { seq: 0, recent: [] }; G.current = null; try { localStorage.setItem('loop-gram-lesson', G.lesson); } catch {} showGuide(true); };
$('gramOrder').onchange = () => { G.state = { seq: 0, recent: [] }; stopAuto(); if (!G.guide) gramNext(); };
$('gramGuideBtn').onclick = () => showGuide(!G.guide);
$('gramMiniBtn').onclick = () => { const l = G.current && gramLessonData(G.current.lesson); if (!l) return; const m = $('gramMini'); if (m.hidden) m.innerHTML = gramTableHtml(l); m.hidden = !m.hidden; };
$('gramReveal').onclick = () => gramReveal();
$('gramRight').onclick = () => gramGrade(true);
$('gramWrong').onclick = () => gramGrade(false);
$('gramSkip').onclick = gramNext;
$('gramListen').onclick = () => G.current && playText(G.current.en);
$('gramSlow').onclick = () => G.current && playText(G.current.en, 0.75);
$('autoGram').onclick = () => { if (G.guide) showGuide(false); runAuto('gram', async alive => {
  if (!G.current || G.shown) gramNext();
  if (!G.current) return stopAuto();
  await sleep(+$('autoGramGap').value * 1000); if (!alive()) return;
  gramReveal(false); await playText(G.current.en); if (!alive()) return;
  await sleep(1300); if (!alive()) return;
  gramNext();
}); };
document.addEventListener('keydown', e => {
  if ($('practice').hidden || $('gramWorkspace').hidden || /INPUT|TEXTAREA|SELECT|AUDIO|SUMMARY/.test(e.target.tagName) || e.isComposing || e.keyCode === 229 || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.code;
  if (!['Space', 'Digit1', 'Numpad1', 'Digit2', 'Numpad2', 'KeyX', 'KeyO', 'KeyR', 'ArrowRight'].includes(k)) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (G.guide) { if (k === 'Space') showGuide(false); return; }
  if (k === 'Space') gramReveal(); else if (/1$|KeyX/.test(k)) gramGrade(false); else if (/2$|KeyO/.test(k)) gramGrade(true);
  else if (k === 'KeyR' && G.current) playText(G.current.en); else if (k === 'ArrowRight') gramNext();
}, true);
// 탭에 다시 돌아오면 반응 시간을 다시 잰다
setTab = (orig => name => { orig(name); if (G.current && !G.shown) G.started = performance.now(); })(setTab);
// 기록 탭 진행 막대에 '문법' 줄
(window.EXTRA_PROGRESS = window.EXTRA_PROGRESS || []).push(() => progressRow('문법 뼈대', GRAM_CARDS, gramStat, '장', () => startNewIn('practice', 'gramOrder', () => { setSpeakMode('gram'); showGuide(false); })));

// ---------- 문장 목록 탭: 문법 레슨 (단원별로 접어서) ----------
(() => {
  const sec = document.createElement('section'); sec.id = 'gramDecks';
  sec.innerHTML = '<h2 class="wl-title" style="margin:28px 0 4px">문법 레슨</h2><p class="muted" style="margin:0 0 8px">단원별로 모았어요. 설명·문장 보기를 누르면 설명 표와 전체 문장을 한눈에 보고 ▷로 들을 수 있어요.</p><div id="gramDeckGroups"></div>';
  $('decks').after(sec);
})();
function renderGramDecks() {
  if (!$('gramDeckGroups')) return;
  let open = new Set(); try { open = new Set(JSON.parse(localStorage.getItem('loop-gram-open') || '["기초 뼈대"]')); } catch {}
  $('gramDeckGroups').innerHTML = gramGroups().map(([gname, ls]) => {
    const all = GRAM_CARDS.filter(c => ls.some(l => l.id === c.lesson)), lvAll = levelCounts(all, gramStat);
    return `<details data-ggroup="${esc(gname)}" ${open.has(gname) ? 'open' : ''}><summary>${esc(gname)} <small class="muted">레슨 ${ls.length}개 · ${all.length}문장 · ${levelLine(lvAll).replace(/<[^>]+>/g, ' ')}</small></summary><div class="deck-grid">${ls.map(l => {
      const cs = GRAM_CARDS.filter(c => c.lesson === l.id), lv = levelCounts(cs, gramStat);
      return `<article class="deck-item"><small>${cs.length}문장</small>${levelBar(lv, cs.length)}<span class="lvline">${levelLine(lv)}</span><h2>${esc(l.title)}</h2><p>${esc(l.goal || '')}</p><div class="deck-actions"><button data-gview="${esc(l.id)}">설명·문장 보기</button><button data-gstart="${esc(l.id)}">이 레슨 연습</button></div></article>`;
    }).join('')}</div></details>`;
  }).join('');
}
document.addEventListener('toggle', e => {
  const d = e.target.closest?.('[data-ggroup]'); if (!d) return;
  const open = [...document.querySelectorAll('[data-ggroup][open]')].map(x => x.dataset.ggroup);
  try { localStorage.setItem('loop-gram-open', JSON.stringify(open)); } catch {}
}, true);
function viewGram(id) {
  const l = gramLessonData(id); if (!l) return;
  const box = $('deckView'); box.hidden = false; box.dataset.deck = '';
  $('deckViewTitle').textContent = l.title;
  $('deckViewMeta').textContent = `${l.cards.length}문장 · ${l.group || '기초 뼈대'}`;
  const start = $('deckViewStart'); start.removeAttribute('data-start'); start.removeAttribute('data-wstart'); start.dataset.gstart = l.id; start.textContent = '이 레슨 연습';
  const cs = GRAM_CARDS.filter(c => c.lesson === l.id);
  $('deckViewList').innerHTML = `<div class="gram-sheet-guide">${gramTableHtml(l)}</div>` + cs.map((c, i) => {
    const s = gramStat(c.id), lv = level(s);
    return `<div class="phrase"><div><p>${markSub(c.ko, c.ko_hl, 'gram-kohl')}</p><p lang="en"><strong>${markSub(c.en, c.hl, 'gram-hl')}</strong></p>${c.note ? `<small>${esc(c.note)}</small>` : ''}</div><div class="phrase-side"><small>${LEVELS[lv].dot} ${esc(c.form || '')}</small><button data-gplay="${esc(c.id)}" aria-label="${esc(c.en)} 듣기">▷</button></div></div>`;
  }).join('');
  $('deckViewList').scrollTop = 0;
}
function startGram(id) {
  $('deckView').hidden = true;
  G.lesson = id; G.state = { seq: 0, recent: [] }; G.current = null; $('gramLesson').value = id;
  try { localStorage.setItem('loop-gram-lesson', id); } catch {}
  setTab('practice'); setSpeakMode('gram'); showGuide(false);
}
viewDeck = (orig => (id, scroll) => { $('deckViewStart').removeAttribute('data-gstart'); orig(id, scroll); })(viewDeck);
if (typeof viewWords === 'function') viewWords = (orig => id => { $('deckViewStart').removeAttribute('data-gstart'); orig(id); })(viewWords);
renderLibrary = (orig => () => { orig(); renderGramDecks(); })(renderLibrary);
document.addEventListener('click', e => {
  const v = e.target.closest('[data-gview]'); if (v) viewGram(v.dataset.gview);
  const s = e.target.closest('[data-gstart]'); if (s) startGram(s.dataset.gstart);
  const p = e.target.closest('[data-gplay]'); if (p) { const c = GRAM_CARDS.find(x => x.id === p.dataset.gplay); if (c) playText(c.en); }
});
// 검색창에서 문법 문장도 찾기
if (typeof searchIndex === 'function') searchIndex = (orig => () => { const r = orig(); r.splice(1, 0, { key: 'gram', title: '문법 뼈대', items: GRAM_CARDS.map(c => ({ ko: c.ko, en: c.en, tag: gramLessonData(c.lesson)?.title || '', extra: [...(c.alt || []), c.note, c.form] })) }); return r; })(searchIndex);
