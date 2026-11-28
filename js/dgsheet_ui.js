/* ---------- 시트 「던전」 탭 (11-28 망령 「시트 칸에 던전 탭도 만들어놔 거기 애들 데이터 보기 편하게」) ----------
   시트 탭 작은 탭 「던전」 — GM 만. 위 칩으로 노트 던전(kind 'dgs')을 고르면, 그 던전의 조우 방마다 야생 포켓몬 카드를 늘어놓는다.
   카드는 던전 한 장 요약 「⚔ 조우」 탭과 같은 것(NT_DG.encHTML) — 제작기에서 받은 던전이면 방에 이어 둔 제작기 트레이너의 시트 카드로.
   고른 던전은 이 브라우저에 기억(nt_dgsh_sel). 11-28 망령 「던전 탭에서 왜 편집은 못함?」: 카드 칸을 누르면 고치기(시트와 같은 mon_ed) · ✎ 고치기 · 소지품 단추. */
'use strict';
(() => {
  const N = () => window.NT;
  const { esc } = window.NT;
  const SEL_KEY = 'nt_dgsh_sel';
  const mkrOf = {}; /* 던전 id → 방 id · 제작기 트레이너 id 표 (한 번 받으면 이 화면을 다시 그려도 그대로) */
  let loading = '';
  const encRooms = d => Object.values((d && d.r) || {}).filter(r => r && r.w && Array.isArray(r.w.mons) && r.w.mons.length);
  const monCount = d => encRooms(d).reduce((a, r) => a + r.w.mons.length, 0);
  function selected(D) {
    let s = '';
    try {
      s = localStorage.getItem(SEL_KEY) || '';
    } catch (e) {}
    return D.find(d => d.id === s) || D.find(d => monCount(d)) || D[0] || null;
  }
  function chips(D, cur) {
    return `<div class="dgsh-chips">${D.map(d => {
      const n = monCount(d);
      return `<button type="button" class="btn sm${cur && d.id === cur.id ? ' on' : ''}" data-dgsh="${esc(d.id)}" title="${esc(d.a || '')}">⛩ ${esc(d.n || '(던전)')} <small class="dim">${n ? n + '체' : '조우 없음'}</small></button>`;
    }).join('')}</div>`;
  }
  function render(el) {
    if (!N().gm()) {
      el.innerHTML = `<div class="toolbar"><h2>던전</h2></div><div class="empty">던전 포켓몬 시트는 GM만 봐요.</div>`;
      return;
    }
    const D = N()
      .list('dgs')
      .slice()
      .sort((a, b) => String(a.n || '').localeCompare(String(b.n || ''), 'ko'));
    const cur = selected(D);
    const wait = cur && !mkrOf[cur.id] && cur.src && cur.src.from === 'maker';
    el.innerHTML = `<div class="toolbar"><h2>던전</h2><span class="note">노트 던전 ${D.length}개${cur ? ` · 조우 방 ${encRooms(cur).length} · 포켓몬 ${monCount(cur)}체` : ''}</span><span class="sp"></span>${cur ? `<button class="btn sm" data-dgsh-card title="던전 한 장 요약 창 (PNG · 디스코드로 보내기)">▤ 한 장 요약</button>` : ''}</div>
   ${D.length ? chips(D, cur) : ''}
   <div class="dgsh-wrap" data-dgsh-wrap>${
     cur
       ? (wait ? '<div class="dim small" style="padding:6px 2px">제작기 시트를 불러오는 중…</div>' : '') +
         NT_DG.encHTML(cur, true, mkrOf[cur.id] || {}, { ed: 1 })
       : '<div class="empty">노트에 던전이 없어요 — 지도 장소 · 시나리오 「던전」에서 먼저 만들어요.</div>'
   }</div>`;
    bind(el, cur);
    if (cur && !mkrOf[cur.id] && loading !== cur.id) loadMkr(el, cur);
  }
  async function loadMkr(el, d) {
    loading = d.id;
    try {
      mkrOf[d.id] = await NT_DG.encMkr(d);
    } catch (e) {
      mkrOf[d.id] = {};
    }
    loading = '';
    if (el.isConnected && el.querySelector('[data-dgsh-wrap]')) render(el);
  }
  function bind(el, cur) {
    el.querySelectorAll('[data-dgsh]').forEach(
      b =>
        (b.onclick = () => {
          try {
            localStorage.setItem(SEL_KEY, b.dataset.dgsh);
          } catch (e) {}
          render(el);
        })
    );
    const cb = el.querySelector('[data-dgsh-card]');
    if (cb && cur) cb.onclick = () => NT_DG.openCard(cur.id);
  }
  N().MOD.dgsh = { render };
})();
