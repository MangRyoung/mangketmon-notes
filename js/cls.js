/* ---------- 시트 분류 (PC · 객원 · NPC) ----------
   10-30 망령 「시트를 PC · 객원 · NPC 로 분류 — 폴더 접기, 지도 · 관계도에서 거르기」.
   시트 문서(pc · npc)의 cls = 'pc' | 'guest' | 'npc'. 비어 있으면 문서 종류를 따른다 (pc 문서 → PC, npc 문서 → NPC).
   cls 는 분류 이름표일 뿐이라 문서 종류 · 공개 범위 · 웹툴 연동은 그대로다 (웹툴은 문서 종류로 읽는다).
   지도 · 관계도의 거르기 단추는 여기에 「항목」(항목 탭의 인물 · 조직)을 더한 넷. 끈 것은 이 브라우저에 캠페인마다 기억한다. */
"use strict";
(()=>{
 const L=[['pc','PC','#d22a2a'],['guest','객원','#d9891c'],['npc','NPC','#2f6fd0']];
 const F=L.concat([['ent','항목','#8e8e8e']]);
 const ok=c=>L.some(x=>x[0]===c);
 /* k = 문서 종류 ('pc' | 'npc' | 'ents'), p = 문서 내용 */
 const of=(k,p)=>k==='ents'?'ent':(p&&ok(p.cls)?p.cls:(k==='npc'?'npc':'pc'));
 const row=c=>F.find(x=>x[0]===c)||F[0];
 const camp=()=>(window.NT&&NT.ST&&NT.ST.camp)||'';
 const key=t=>'nt-clsf:'+t+':'+camp();
 function hid(t){try{const o=JSON.parse(localStorage.getItem(key(t))||'{}');return o&&typeof o==='object'?o:{}}catch(e){return {}}}
 function setHid(t,h){try{localStorage.setItem(key(t),JSON.stringify(h))}catch(e){}}
 const shown=(t,c)=>!hid(t)[c];
 /* 거르기 단추 줄. counts = {pc:3, …} 이면 숫자도 */
 function chips(t,counts){const h=hid(t);const esc=window.NT?NT.esc:(s=>String(s));
  return `<div class="seg clsf" data-clsf="${esc(t)}" title="누르면 그 분류를 숨기거나 다시 보여요">${F.map(([c,n,col])=>`<button type="button" data-clsc="${c}" class="${h[c]?'':'on'}" style="--c:${col}" aria-pressed="${h[c]?'false':'true'}"><i class="kdot"></i>${n}${counts&&counts[c]!=null?` <small>${counts[c]}</small>`:''}</button>`).join('')}</div>`}
 function bindChips(el,t,after){el.querySelectorAll(`[data-clsf="${t}"] [data-clsc]`).forEach(b=>b.onclick=e=>{e.preventDefault();const h=hid(t);const c=b.dataset.clsc;if(h[c])delete h[c];else h[c]=1;setHid(t,h);after()})}
 window.NT_CLS={L,F,of,ok,name:c=>row(c)[1],color:c=>row(c)[2],hid,shown,chips,bindChips};
})();
