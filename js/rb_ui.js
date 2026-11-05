/* ---------- 룰북 탭 (11-04 21:52 망령 「미사그 대학에 전체 룰북 탭 옮겨 달래 — 자료 왼쪽에 첨부 · 테마에 맞게 꾸며」) ----------
   위 탭 「룰북」(자료 왼쪽, 꾸밈 「대학」 캠페인에만 — app.js rbOn). 제작기 룰북 전체를 장(章)별로 읽는다.
   · 읽기는 rulebook.js(NT_RB) 그대로: 공유 DB 의 제작기 문서 rulebook/main → 없으면 제작기 rulebook.html. 사본 없음 — 룰북을 고치면 여기도 바뀐다.
   · 꾸밈은 서가 책 읽기 창(css/shelf.css 의 .shelfm · .shr-*)과 같은 뼈빛 종이 · 먹 글씨 · 휘장. 왼쪽 차례(묶음 → 장), 오른쪽 종이(장 안 ## 절 칩 · 본문 · 앞뒤 장).
   · 찾기: 장 이름 · 설명 · 본문에서. 찾은 장만 차례에 남고, 본문의 찾은 글자에 형광펜.
   · 고른 장은 이 브라우저에 기억(nt_rb_ch). 휴대폰(760px 이하)에서는 차례가 「장 고르기」 칸으로 바뀐다. */
"use strict";
(()=>{
 const N=()=>window.NT;const esc=s=>N().esc(s);const RB=()=>window.NT_RB;
 const LK='nt_rb_ch';const U={q:''};
 const cur=()=>{try{return localStorage.getItem(LK)||''}catch(e){return ''}};
 const setCur=id=>{try{localStorage.setItem(LK,id)}catch(e){}};
 const crest=()=>(window.NT_SHELF&&NT_SHELF.CREST)||'';
 const norm=s=>String(s||'').toLowerCase();
 function hits(c,q){if(!q)return 0;const b=norm(c.body);let n=0,i=0;while((i=b.indexOf(q,i))>=0&&n<999){n++;i+=q.length}return n+(norm(c.title).includes(q)||norm(c.desc).includes(q)?1:0)}
 /* 본문 글자에 형광펜 (태그 안 · 이미 칠한 곳 제외) */
 function mark(root,q){if(!q)return 0;const W=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue&&norm(n.nodeValue).includes(q)&&!n.parentElement.closest('mark,script,style')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
  const L=[];let n;while((n=W.nextNode()))L.push(n);let k=0;
  for(const t of L){const v=t.nodeValue,lv=norm(v);const f=document.createDocumentFragment();let i=0,j;while((j=lv.indexOf(q,i))>=0){if(j>i)f.appendChild(document.createTextNode(v.slice(i,j)));const m=document.createElement('mark');m.className='rbt-hl';m.textContent=v.slice(j,j+q.length);f.appendChild(m);k++;i=j+q.length}if(i<v.length)f.appendChild(document.createTextNode(v.slice(i)));t.replaceWith(f)}
  return k}
 /* 11-05 망령 「미사그 대학에 카드 룰북도 추가」: 은열쇠 장 끝에 시작 카드 그림 모음 (제작기 카드 DB — 덱 「은열쇠 · 공통」 · 분류 「시작」. 카드 DB 를 고치면 따라온다) */
 function cardWall(){const MK=window.NT_MAKER,UX=window.NT_UNIV;if(!MK||!UX||!UX.skc)return '';if(!MK.dbReady()){MK.db().then(()=>{if(N().ST.view==='rb')N().render()});return '<p class="rbt-cw-wait">카드를 펴는 중이에요…</p>'}
  const L=MK.cardList().filter(r=>r&&r[0]==='은열쇠 · 공통'&&String(r[12]||'').trim()==='시작');if(!L.length)return '';
  const G=[['스킬',/체크|스킬/],['던전',/던전/],['배틀',/배틀/]];
  return `<section class="rbt-cw" aria-label="시작 카드 그림"><h4 id="rbt-cw">시작 카드 ${L.length}장 · 그림으로</h4>${G.map(([lab,re])=>{const g=L.filter(r=>re.test(String(r[2]||''))&&!G.slice(0,G.findIndex(x=>x[0]===lab)).some(([,r0])=>r0.test(String(r[2]||''))));return g.length?`<div class="rbt-cwg"><b>${lab} <small>${g.length}</small></b><div class="rbt-cwl">${g.map(r=>`<div class="rbt-cwc" title="${esc(r[1])}">${UX.skc(r[1])}</div>`).join('')}</div></div>`:''}).join('')}</section>`}
 function render(el){const R=RB();
  if(!R){el.innerHTML='<div class="empty">룰북 읽기 도구가 없어요. 새로 고쳐 주세요.</div>';return}
  if(!R.R.book){el.innerHTML=`<section class="rbtab shelfm c-crim"><header class="shr-cover"><span class="shr-crest">${crest()}</span><div class="shr-ct"><span class="shr-no">MISAG LIB · RULEBOOK</span><h2>망켓몬 룰북</h2><p>${R.R.fail?'룰북을 읽지 못했어요. 인터넷 연결을 확인하고 새로 고쳐 주세요.':'룰북을 펴는 중이에요…'}</p></div></header></section>`;
   if(!R.R.fail)R.load().then(()=>{if(N().ST.view==='rb')N().render()});return}
  const book=R.R.book;const all=R.chapters();const q=norm(U.q.trim());
  const L=q?all.filter(c=>hits(c,q)>0):all;
  let id=cur();if(!all.some(c=>c.id===id))id=(all[0]||{}).id||'';if(q&&L.length&&!L.some(c=>c.id===id))id=L[0].id;
  const c=all.find(x=>x.id===id);
  const groups=[];for(const x of L){const g=x.group||'기타';let G=groups.find(y=>y.g===g);if(!G)groups.push(G={g,L:[]});G.L.push(x)}
  const ord=[];{const G0=[];for(const x of all){const g=x.group||'기타';let G=G0.find(y=>y.g===g);if(!G)G0.push(G={g,L:[]});G.L.push(x)}for(const G of G0)ord.push(...G.L)}   /* 차례 번호 = 묶음으로 모은 순서 */
  const no=x=>String(ord.indexOf(x)+1).padStart(2,'0');
  const ix=ord.indexOf(c);const prev=ord[ix-1],next=ord[ix+1];   /* 앞뒤 장도 차례 순서로 */
  const secs=c?R.sections(c).filter(s=>s.h):[];
  el.innerHTML=`<section class="rbtab shelfm c-crim" aria-label="룰북">
   <header class="shr-cover rbt-cover"><span class="shr-crest">${crest()}</span><div class="shr-ct"><span class="shr-no">MISAG LIB · RULEBOOK · ${all.length} CHAPTERS</span><h2>${esc(book.title||'망켓몬 룰북')}</h2><p>${esc(book.subtitle||'')}${book.updated?` <span class="rbt-up">· ${esc(book.updated)} 판</span>`:''}</p></div>
    <label class="rbt-q"><span aria-hidden="true">⌕</span><input id="rbtQ" data-live type="search" placeholder="룰북에서 찾기" value="${esc(U.q)}" autocomplete="off"></label><span class="shr-ribbon" aria-hidden="true"></span></header>
   <div class="rbt-body">
    <nav class="rbt-nav" data-keep aria-label="룰북 차례">${q?`<div class="rbt-qn">「${esc(U.q.trim())}」 — ${L.length}장${L.length?'':' · 찾은 곳이 없어요'}</div>`:''}
     ${groups.map(G=>`<div class="rbt-g"><b>${esc(G.g)}</b>${G.L.map(x=>`<a href="#" data-rbch="${esc(x.id)}" class="${x.id===id?'on':''}" title="${esc(x.desc||'')}"><i>${no(x)}</i><span>${esc(x.title||x.id)}</span>${q?`<em>${hits(x,q)}</em>`:''}</a>`).join('')}</div>`).join('')}</nav>
    <select class="rbt-sel" aria-label="장 고르기">${groups.map(G=>`<optgroup label="${esc(G.g)}">${G.L.map(x=>`<option value="${esc(x.id)}" ${x.id===id?'selected':''}>${no(x)} · ${esc(x.title||x.id)}</option>`).join('')}</optgroup>`).join('')}</select>
    <article class="shr-page rbbody rbt-page">${c?`<div class="rbt-ch"><span class="rbt-chno">CHAPTER ${no(c)} · ${esc(c.group||'')}</span><h3>${esc(c.title||c.id)}</h3>${c.desc?`<p class="rbt-desc">${esc(c.desc)}</p>`:''}${c.added?`<span class="rbt-add">${esc(c.added)} 추가</span>`:''}</div>
     ${secs.length>1?`<div class="rbt-secs">${secs.map((s,i)=>`<a href="#" data-rbsec="${i}">${esc(s.h.replace(/\s*\(\d{4}-\d\d-\d\d\)\s*$/,''))}</a>`).join('')}</div>`:''}
     <div class="rbt-live">${R.render(c.body||'')}</div>${c.id==='silverkey'?cardWall():''}
     <footer class="rbt-foot">${prev?`<a href="#" data-rbch="${esc(prev.id)}" class="rbt-pv">← ${esc(prev.title)}</a>`:'<span></span>'}<a class="rbt-src" href="${esc(R.link(c.id))}" target="_blank" rel="noopener">제작기 룰북에서 열기 ↗</a>${next?`<a href="#" data-rbch="${esc(next.id)}" class="rbt-nx">${esc(next.title)} →</a>`:'<span></span>'}</footer>`:'<p class="shr-wait">룰북에 장이 없어요.</p>'}</article>
   </div></section>`;
  const page=el.querySelector('.rbt-page');const H=[...el.querySelectorAll('.rbt-live h4')];H.forEach((h,i)=>h.id='rbt-h'+i);
  if(q&&page){const k=mark(el.querySelector('.rbt-live'),q);const f=el.querySelector('.rbt-hl');if(f&&U.jump){U.jump=false;setTimeout(()=>f.scrollIntoView({block:'center'}),30)}if(!k)U.jump=false}
  const pick=nid=>{setCur(nid);U.jump=!!q;N().render();if(!q){const s=el.ownerDocument.querySelector('#ntMain .rbtab');if(s&&s.getBoundingClientRect().top<0)s.scrollIntoView({block:'start'})}};
  el.addEventListener('click',e=>{const a=e.target.closest('[data-rbch]');if(a){e.preventDefault();pick(a.dataset.rbch);return}
   const s=e.target.closest('[data-rbsec]');if(s){e.preventDefault();const h=el.querySelector('#rbt-h'+s.dataset.rbsec);if(h)h.scrollIntoView({behavior:'smooth',block:'start'})}});
  const sel=el.querySelector('.rbt-sel');if(sel)sel.addEventListener('change',()=>pick(sel.value));
  const qi=el.querySelector('#rbtQ');let tq=0;if(qi)qi.addEventListener('input',()=>{clearTimeout(tq);tq=setTimeout(()=>{U.q=qi.value;U.jump=true;N().render()},250)});}
 N().MOD.rb={render};
})();
