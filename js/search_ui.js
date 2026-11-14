/* ---------- 전체 검색 (2026-11-03 감우) ----------
   위 띠 🔍 · 단축키 / : 항목 · 장소 · 루트 단계 · PC/NPC 시트 · 기록 · 세션 · 설계 메모 · 던전 · GM 메모를 한꺼번에 찾는다.
   이 브라우저에 받아 둔 D(권한대로 내려온 것)만 뒤지므로 PL 은 자기가 볼 수 있는 것만 나온다. 결과를 누르면 그 탭 · 그 항목으로(NT_FAV.go 와 같은 길).
   띄어쓰기로 나눈 낱말을 모두 담은 것만 · 제목 맞으면 먼저. */
"use strict";
window.NT_SEARCH=(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const KL={ents:'항목',spots:'장소',routes:'루트',step:'단계',pc:'PC 시트',npc:'NPC 시트',logs:'기록',sess:'세션',note:'설계 메모',dgs:'던전',sec:'GM 메모',maps:'지도'};
 const ICON={ents:'📇',spots:'📍',routes:'🧭',step:'▸',pc:'🪪',npc:'🎭',logs:'📜',sess:'📅',note:'📝',dgs:'⛩',sec:'🔒',maps:'🗺'};
 const S={q:'',sel:0,res:[]};
 const txt=v=>v==null?'':Array.isArray(v)?v.map(txt).join(' '):typeof v==='object'?Object.values(v).map(txt).join(' '):String(v);
 const rowsTxt=r=>(r||[]).map(x=>(x.k||'')+' '+(x.v||'')).join(' ');
 /* 색인: {kind, id, title, sub, body, go} */
 function index(){const L=[];const G=N().gm();
  for(const e of N().list('ents'))L.push({kind:'ents',id:e.id,title:e.title||'',sub:[e.type,e.sub].filter(Boolean).join(' · '),body:[e.body,rowsTxt(N().gm()&&window.NT_ENTS&&NT_ENTS.rowsAll?NT_ENTS.rowsAll(e):e.rows),txt(e.tags),txt(e.teams)].join(' ')});
  for(const s of N().list('spots'))L.push({kind:'spots',id:s.id,title:(s.num?s.num+'. ':'')+(s.name||''),sub:[s.area,s.kind].filter(Boolean).join(' · '),body:[s.summary,s.items,txt((s.imgs||[]).map(x=>x.t))].join(' ')});
  for(const m of N().list('maps'))L.push({kind:'maps',id:m.id,title:m.name||'지도',sub:'',body:m.d||''});
  for(const r of N().list('routes')){L.push({kind:'routes',id:r.id,title:r.name||'루트',sub:r.group||'',body:[r.entry,r.goal,r.note].join(' ')});
   (r.steps||[]).forEach((st,i)=>{const sp=st.spot&&N().data('spots',st.spot);L.push({kind:'step',id:r.id+'|'+i,rid:r.id,i,title:st.title||(sp?(sp.num?sp.num+'. ':'')+sp.name:'')||'(단계)',sub:(r.name||'')+' · '+(i+1)+'/'+(r.steps||[]).length,body:[st.note,st.read].join(' ')})})}
  for(const k of ['pc','npc'])for(const p of N().list(k)){const t=window.NT_MAKER&&NT_MAKER.trainer(p.id);const priv=k==='pc'?N().data('pcp',p.id):null;L.push({kind:k,id:p.id,title:(t&&t.name)||p.name||p.id,sub:p.cls||'',body:[p.bg,p.goal,p.bond,p.style,p.note,rowsTxt(p.rows),priv?txt(priv):'',t?txt(t.rp):''].join(' ')})}
  for(const l of N().list('logs')){if(String(l.id).startsWith('mt_'))continue;L.push({kind:'logs',id:l.id,title:l.title||'기록',sub:[l.ep,l.date,l.players].filter(Boolean).join(' · '),body:[l.summary,l.body,txt(l.tags)].join(' ')})}
  for(const p of N().list('plan')){if(p.t==='sess')L.push({kind:'sess',id:p.id,title:'세션 '+(p.label||'')+(p.what?' · '+p.what:''),sub:[p.date,p.kind].filter(Boolean).join(' · '),body:[p.memo,p.where].join(' ')});
   else if(p.t==='note')L.push({kind:'note',id:p.id,title:p.k||'메모',sub:{done:'확정',todo:'정해야 할 것',rule:'규칙'}[p.list]||'메모',body:p.v||''})}
  for(const d of N().list('dgs')){const sp=d.spot&&N().data('spots',d.spot);L.push({kind:'dgs',id:d.id,title:d.n||'던전',sub:sp?sp.name:'',body:Object.values(d.r||{}).map(r=>(r.n||'')+' '+(r.t||'')+' '+(r.m||'')).join(' ')})}
  if(G)for(const x of N().list('sec')){const [k,i]=String(x.id).split(':');const own=k==='sess'?N().data('plan',i):N().data({spot:'spots',ent:'ents',route:'routes',pc:'pc',npc:'npc'}[k]||k,i);const nm=own?(own.title||own.name||(own.label?'세션 '+own.label:'')||i):i;
   L.push({kind:'sec',id:x.id,title:'GM 메모 · '+nm,sub:{spot:'장소',ent:'항목',route:'루트',pc:'PC',npc:'NPC',sess:'세션'}[k]||k,body:[x.t,x.prep,x.retro,txt(x.use)].join(' ')})}
  return L}
 const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ');
 function search(q){const words=norm(q).split(' ').filter(Boolean);if(!words.length)return [];const out=[];
  for(const it of index()){const t=norm(it.title),s=norm(it.sub),b=norm(it.body);const all=t+' '+s+' '+b;if(!words.every(w=>all.includes(w)))continue;
   let sc=0;for(const w of words){if(t.includes(w))sc+=t===w?30:t.startsWith(w)?20:10;else if(s.includes(w))sc+=5;else sc+=1}
   const w0=words.find(w=>b.includes(w));let snip='';if(w0){const i=b.indexOf(w0);const raw=String(it.body||'').replace(/\s+/g,' ');const j=raw.toLowerCase().indexOf(w0);const st=Math.max(0,(j>=0?j:i)-28);snip=(st?'…':'')+raw.slice(st,st+90)+(raw.length>st+90?'…':'')}
   out.push(Object.assign({sc,snip},it))}
  return out.sort((a,b)=>b.sc-a.sc||a.title.localeCompare(b.title,'ko')).slice(0,60)}
 function mark(s,words){let h=esc(s);for(const w of words){if(!w)continue;const re=new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig');h=h.replace(re,m=>`<mark>${m}</mark>`)}return h}
 function open(q){if(!N().ST.camp)return;S.q=q||'';S.sel=0;
  const md=N().openModal(`<div class="srch"><div class="srchin"><span aria-hidden="true">🔍</span><input type="search" id="srchQ" data-nodirty placeholder="항목 · 장소 · 루트 단계 · 시트 · 기록 · 세션 · 던전 찾기 (띄어쓰기 = 모두 담은 것)" value="${esc(S.q)}" autocomplete="off"><button class="btn ghost xs" data-x>닫기</button></div><div class="srchres" id="srchR"></div><div class="small dim srchhint">↑↓ 고르기 · Enter 열기 · Esc 닫기 · 어느 탭에서든 <kbd>/</kbd></div></div>`,'srchmodal');
  const inp=$('#srchQ',md),box=$('#srchR',md);let T=0;
  const draw=()=>{const words=norm(S.q).split(' ').filter(Boolean);S.res=search(S.q);if(S.sel>=S.res.length)S.sel=0;
   if(!words.length){box.innerHTML='<div class="small dim" style="padding:14px 10px">찾을 말을 적어요. 이름 · 본문 · 메모 · 낭독문 · 태그를 다 뒤져요.</div>';return}
   if(!S.res.length){box.innerHTML=`<div class="small dim" style="padding:14px 10px">「${esc(S.q)}」 — 찾은 게 없어요${N().ST.plView?' (PL 눈으로 보는 중)':''}</div>`;return}
   const G={};for(const r of S.res)(G[r.kind]=G[r.kind]||[]).push(r);let i=0;
   box.innerHTML=Object.entries(G).map(([k,L])=>`<div class="srchg"><div class="srchgh">${ICON[k]||'•'} ${esc(KL[k]||k)} <small>${L.length}</small></div>${L.map(r=>{const n=i++;return `<button type="button" class="srchi ${n===S.sel?'on':''}" data-i="${n}"><b>${mark(r.title,words)}</b>${r.sub?`<small>${esc(r.sub)}</small>`:''}${r.snip?`<span>${mark(r.snip,words)}</span>`:''}</button>`}).join('')}</div>`).join('');
   const on=box.querySelector('.srchi.on');if(on)on.scrollIntoView({block:'nearest'})};
  inp.oninput=()=>{S.q=inp.value;clearTimeout(T);T=setTimeout(draw,120)};
  inp.onkeydown=e=>{if(e.isComposing)return;if(e.key==='ArrowDown'){e.preventDefault();S.sel=Math.min(S.res.length-1,S.sel+1);draw()}else if(e.key==='ArrowUp'){e.preventDefault();S.sel=Math.max(0,S.sel-1);draw()}else if(e.key==='Enter'){e.preventDefault();const r=S.res[S.sel];if(r)go(r)}};
  box.addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(!b)return;const r=S.res[+b.dataset.i];if(r)go(r)});
  draw();setTimeout(()=>{inp.focus();inp.select()},0)}
 function go(r){N().closeModal(true);const F=window.NT_FAV;const G=N().gm();
  if(r.kind==='step'){const rid=r.rid,i=r.i;N().go('scen');setTimeout(()=>{if(G&&window.NT_SCEN&&NT_SCEN.write)NT_SCEN.write(rid,'ws'+i+'n');else if(window.NT_SCEN)NT_SCEN.stepRead(rid,i)},60);return}
  if(r.kind==='sec'){const [k,i]=String(r.id).split(':');if(k==='sess')return go({kind:'sess',id:i});return go({kind:{spot:'spots',ent:'ents',route:'routes',pc:'pc',npc:'npc'}[k]||k,id:i})}
  if(r.kind==='note'){N().go('plan');setTimeout(()=>{const b=document.querySelector('[data-pt="note"]');if(b)b.click();setTimeout(()=>{const n=document.querySelector(`[data-note="${CSS.escape(r.id)}"]`);if(n){n.scrollIntoView({behavior:'smooth',block:'center'});n.classList.add('flash');setTimeout(()=>n.classList.remove('flash'),1200)}},80)},40);return}
  if(r.kind==='dgs'){if(window.NT_DG&&NT_DG.openEd)return NT_DG.openEd(r.id);return N().go('map')}
  if(r.kind==='maps'){if(F)return F.go({kind:'map',id:r.id});return N().go('map')}
  if(F)return F.go({kind:r.kind,id:r.id});N().go(r.kind==='spots'?'map':r.kind==='ents'?'ents':r.kind==='routes'?'scen':r.kind==='sess'?'plan':r.kind)}
 return {open,search,index};
})();
