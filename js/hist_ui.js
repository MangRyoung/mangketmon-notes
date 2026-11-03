/* ---------- 변경 이력 · 휴지통 (2026-11-03 감우) ----------
   supabase/patch_2026-11-03_노트.sql 의 nt_docs_history(지움은 언제나 · 고침은 5분에 한 판) 를 nt_history / nt_deleted 로 읽는다.
   「🕘 이력」(항목 · 장소 · 루트 · 시트 · 세션): 옛 판을 보고, 그 판으로 되돌린다(= 그 내용을 지금 판으로 다시 저장 — 되돌린 것도 이력에 남는다).
   「🗑 최근 지운 것」(설정 탭): 30일 안에 지운 문서를 지워지기 직전 내용으로 되살린다. nt_del 은 바로 지우되, 여기서 되살릴 수 있다고 안내한다.
   함수가 아직 없는 DB(패치 전)면 그렇게 말한다. GM 은 무엇이든, PL 은 제 PC 시트만. */
"use strict";
window.NT_HIST=(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const KL={ents:'항목',spots:'장소',maps:'지도',links:'이음선',routes:'루트',rels:'관계',pc:'PC 시트',npc:'NPC 시트',pcp:'PC 비밀 칸',plan:'일정',avail:'일정 투표',sec:'GM 메모',logs:'기록',dgs:'던전',shelf:'서가'};
 const nameOf=(kind,d)=>{d=d||{};if(kind==='ents')return d.title;if(kind==='rels')return (N().data('ents',d.a)||{}).title+' → '+(N().data('ents',d.b)||{}).title;if(kind==='plan')return d.t==='sess'?'세션 '+(d.label||'')+' '+(d.what||''):d.t==='note'?'메모 · '+(d.k||''):d.t==='part'?'부 · '+(d.title||''):d.t==='cand'?'후보 '+(d.date||''):d.t||'';if(kind==='logs')return d.title;if(kind==='dgs')return d.n;return d.name||d.title||''};
 const when=t=>{const d=new Date(t);return isNaN(d)?String(t||''):d.toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})};
 const NOSQL='이력 함수가 아직 없어요 — Supabase 에 supabase/patch_2026-11-03_노트.sql 을 넣어 주세요';
 const jeq=(a,b)=>{try{return JSON.stringify(a)===JSON.stringify(b)}catch(e){return false}};
 /* 두 판의 다른 칸 이름 (1단계 키) */
 const diffKeys=(a,b)=>{a=a||{};b=b||{};const K=new Set(Object.keys(a).concat(Object.keys(b)));return [...K].filter(k=>!jeq(a[k],b[k]))};
 const short=v=>{if(v==null)return '(없음)';const s=typeof v==='string'?v:JSON.stringify(v);return s.length>80?s.slice(0,80)+'…':s};
 const btn=(kind,id)=>N().canEdit(kind,id)?`<button type="button" class="btn xs ghost histb" data-hist="${esc(kind)}|${esc(id)}" title="이 문서의 옛 판 보기 · 되돌리기">🕘 이력</button>`:'';
 async function open(kind,id){if(!N().canEdit(kind,id))return;const cur=N().doc(kind,id);const label=(cur&&nameOf(kind,cur.data))||id;
  const md=N().openModal(`<div class="mhead"><h2>🕘 이력 <small class="dim" style="font-size:12px;margin-left:6px">${esc(KL[kind]||kind)} · ${esc(label)}</small></h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div id="histBox" class="histbox"><div class="small dim">읽는 중…</div></div>`,'wide histmodal',{stack:true});
  const box=$('#histBox',md);let L;try{L=await N().DBS().history(N().ST.camp,N().ST.secret,kind,id,30)}catch(e){box.innerHTML=`<div class="small" style="color:var(--red2)">${esc(e.message)}</div>`;return}
  if(L===null){box.innerHTML=`<div class="small dim">${esc(NOSQL)}</div>`;return}
  if(!L.length){box.innerHTML='<div class="small dim">아직 남은 옛 판이 없어요. 고치면(5분에 한 판) · 지우면 여기 쌓여요. 30일 지난 것은 지워져요.</div>';return}
  const now=cur?cur.data:null;
  box.innerHTML=`<p class="small dim" style="margin:0 0 8px">최신부터. 「되돌리기」는 그 판의 내용을 지금 판으로 다시 저장해요(되돌린 것도 이력에 남아요). 고침은 5분에 한 판씩만 남아요.</p>
   ${L.map((h,i)=>{const nx=i===0?now:L[i-1].data;const ks=diffKeys(h.data,nx);return `<div class="histrow" data-i="${i}"><div class="histh"><b>${esc(when(h.at))}</b> <span class="chip xs static">${h.op==='DELETE'?'지우기 직전':'고치기 직전'}</span>${h.vis&&cur&&h.vis!==cur.vis?`<span class="chip xs static">${esc(N().visLabel(h.vis))}</span>`:''}<span class="sp"></span><button type="button" class="btn xs ghost" data-hv="${i}">내용</button>${N().canEdit(kind,id)?`<button type="button" class="btn xs" data-hr="${i}">이 판으로 되돌리기</button>`:''}</div>
    <div class="small dim">${ks.length?`다음 판과 다른 칸: ${ks.map(k=>`<code>${esc(k)}</code>`).join(' ')}`:'다음 판과 같은 내용'}</div><pre class="histpre" hidden>${esc(JSON.stringify(h.data,null,1))}</pre></div>`}).join('')}`;
  box.addEventListener('click',async e=>{const v=e.target.closest('[data-hv]');if(v){const p=box.querySelector(`.histrow[data-i="${v.dataset.hv}"] .histpre`);if(p)p.hidden=!p.hidden;return}
   const r=e.target.closest('[data-hr]');if(!r)return;const h=L[+r.dataset.hr];if(!h)return;const ks=now?diffKeys(h.data,now):[];
   if(!await N().confirmBox(`${when(h.at)} 판으로 되돌릴까요?${ks.length?`\n바뀌는 칸: ${ks.join(', ')}`:'\n(지금 판과 같은 내용이에요)'}`,'되돌리기'))return;
   const ok=await N().put(kind,id,N().clone(h.data),h.vis||(cur&&cur.vis)||'pub',{force:true});if(ok){N().toast('되돌렸어요');N().closeModal()}})}
 /* 설정 탭: 최근 지운 것 */
 async function trash(){if(!N().gm())return;const md=N().openModal(`<div class="mhead"><h2>🗑 최근 지운 것</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div id="trashBox" class="histbox"><div class="small dim">읽는 중…</div></div>`,'wide histmodal');
  const box=$('#trashBox',md);let L;try{L=await N().DBS().deleted(N().ST.camp,N().ST.secret,null)}catch(e){box.innerHTML=`<div class="small" style="color:var(--red2)">${esc(e.message)}</div>`;return}
  if(L===null){box.innerHTML=`<div class="small dim">${esc(NOSQL)}</div>`;return}
  const draw=()=>{if(!L.length){box.innerHTML='<div class="small dim">최근 30일 안에 지운 문서가 없어요 (또는 모두 되살렸어요).</div>';return}
   box.innerHTML=`<p class="small dim" style="margin:0 0 8px">지워지기 직전 내용으로 되살려요. 공개 범위도 그때 것으로. 30일 지난 것은 사라져요.</p>${L.map((h,i)=>`<div class="histrow"><div class="histh"><span class="chip xs static">${esc(KL[h.kind]||h.kind)}</span><b>${esc(nameOf(h.kind,h.data)||h.id)}</b><small class="dim">${esc(when(h.at))} 지움 · ${esc(N().visLabel(h.vis||'pub'))}</small><span class="sp"></span><button type="button" class="btn xs" data-tr="${i}">되살리기</button></div></div>`).join('')}`};
  draw();box.addEventListener('click',async e=>{const b=e.target.closest('[data-tr]');if(!b)return;const h=L[+b.dataset.tr];if(!h)return;b.disabled=true;
   const ok=await N().put(h.kind,h.id,N().clone(h.data||{}),h.vis||'pub',{force:true});if(ok){N().toast(`「${nameOf(h.kind,h.data)||h.id}」 을(를) 되살렸어요`);L.splice(+b.dataset.tr,1);draw()}else b.disabled=false})}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-hist]');if(!b)return;e.preventDefault();e.stopPropagation();const [k,id]=b.dataset.hist.split('|');open(k,id)},true);
 return {open,trash,btn};
})();
