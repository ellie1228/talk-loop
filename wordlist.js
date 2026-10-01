// 문장 목록 탭의 '단어 목록': 장면별 단어 카드 + 단어 보기(아래에서 올라오는 창) + 이 장면 연습.
// 영어판 전용(일본어판 빌드는 이 파일을 가져가지 않는다). 화면 요소와 스타일을 이 파일 안에서 만든다.
'use strict';
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #wordDecks h2.wl-title{margin:28px 0 4px}
    #wordDecks .wl-sub{margin:0 0 12px}
    #wordDecks .deck-item h2{font-size:20px}
    #deckViewList .wl-emoji{font-size:30px;line-height:1;min-width:42px;text-align:center}
    #deckViewList .wl-row{display:flex;align-items:center;gap:12px;min-width:0}`;
  document.head.appendChild(style);
  const sec = document.createElement('section');
  sec.id = 'wordDecks';
  sec.innerHTML = '<h2 class="wl-title">단어 목록</h2><p class="muted wl-sub">장면별로 모아 봤어요. 단어 보기를 누르면 그림·뜻·영어를 한눈에 보고 ▷로 들을 수 있어요.</p><div id="wordDeckGrid" class="deck-grid"></div>';
  $('decks').after(sec);
})();

function wordCats() { return (window.WORD_CATS || []).map(c => ({ ...c, words: WORD_LIST.filter(w => w.cat === c.id) })).filter(c => c.words.length); }
function renderWordDecks() {
  $('wordDeckGrid').innerHTML = wordCats().map(c => {
    const lv = levelCounts(c.words, wordStat);
    return `<article class="deck-item"><small>${c.words.length}개 단어</small>${levelBar(lv, c.words.length)}<span class="lvline">${levelLine(lv)}</span><h2>${esc(c.emoji + ' ' + c.title)}</h2><p>${esc(c.words.slice(0, 4).map(w => w.en).join(' · '))} …</p><div class="deck-actions"><button data-wview="${esc(c.id)}">단어 보기</button><button data-wstart="${esc(c.id)}">이 장면 연습</button></div></article>`;
  }).join('');
}
function viewWords(catId) {
  const c = wordCats().find(x => x.id === catId); if (!c) return;
  const box = $('deckView'); box.hidden = false; box.dataset.deck = '';
  $('deckViewTitle').textContent = c.emoji + ' ' + c.title;
  $('deckViewMeta').textContent = c.words.length + '개 단어';
  const start = $('deckViewStart'); start.removeAttribute('data-start'); start.dataset.wstart = c.id; start.textContent = '이 장면 연습';
  $('deckViewList').innerHTML = c.words.map((w, i) => {
    const s = wordStat(w.id), lv = level(s);
    const rec = `${LEVELS[lv].dot} ` + (s.tries ? `○${s.tries - s.wrong} ✕${s.wrong}` : '새 단어');
    return `<div class="phrase"><div class="wl-row"><span class="wl-emoji" aria-hidden="true">${esc(w.emoji)}</span><div><p>${esc(w.ko)}</p><p lang="en"><strong>${esc(w.en)}</strong></p>${w.sentence?.en ? `<small lang="en">${esc(w.sentence.en)}</small>` : ''}</div></div><div class="phrase-side"><small>${rec}</small><button data-wplay="${i}" data-wcat="${esc(c.id)}" aria-label="${esc(w.en)} 듣기">▷</button></div></div>`;
  }).join('');
  $('deckViewList').scrollTop = 0;
}
function startWords(catId) {
  $('deckView').hidden = true;
  $('wordCat').value = catId; $('wordKind').value = 'all';
  setTab('words'); $('wordCat').dispatchEvent(new Event('change'));
}
// 문장 묶음 시트를 열 때는 단어용 표시를 지운다.
viewDeck = (orig => (id, scroll) => { $('deckViewStart').removeAttribute('data-wstart'); $('deckViewStart').textContent = '이 묶음 연습'; orig(id, scroll); })(viewDeck);
renderLibrary = (orig => () => { orig(); renderWordDecks(); })(renderLibrary);
document.addEventListener('click', e => {
  const v = e.target.closest('[data-wview]'); if (v) viewWords(v.dataset.wview);
  const s = e.target.closest('[data-wstart]'); if (s) startWords(s.dataset.wstart);
  const p = e.target.closest('[data-wplay]'); if (p) { const c = wordCats().find(x => x.id === p.dataset.wcat); const w = c?.words[+p.dataset.wplay]; if (w) playText(w.en); }
});
