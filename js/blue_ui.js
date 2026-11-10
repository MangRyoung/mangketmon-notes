/* ---------- 시나리오 도안 (11-10 망령 「시나리오 탭 사실 미사용이라 허술할 테니 전격 개조」) ----------
   캠페인 뼈대: 큰 사건(사이클) 3~4개 × 단계 [커뮤 ① → 던전 → 커뮤 ② → 하이라이트 배틀]. 한 사이클 ≈ 5화.
   · kind 'arcs' — 큰 사건 하나 = 문서 하나 (GM만)
     {order, name, color, line(한 줄), theme(주제 · 물음), st('' | now | done), pc(스포트라이트 PC id), boss[npc id], bossTxt, cast[npc id], castTxt,
      spots[무대 spot id], dg(던전 dgs id), ents[항목 id], clues:[{id, t, d(설명), img(그림 주소), ok}], note,
      eps:[{id, ph(c1 | dg | c2 | hl), title, goal, beats, st, npcs[npc id], npcTxt, pcs[pc id], spots[spot id], dg, ents[항목 id], route(세부 루트 id)}]}
   · kind 'blue' id 'main' — 캠페인 설정 (GM만) {logline, target(목표 화수), black(흑막 · 큰 그림), end(결말), extra:[ep…] (여유 · 최종장 칸)}
   화 번호는 사건 순서 → 단계 순서 → 칸 안 순서로 저절로 매긴다(여유 칸은 맨 뒤). 객원은 구성 단계에 넣지 않는다(11-10 망령).
   세부 진행(낭독문 · 장소 · 웹툴로 보내기)은 옆 탭 「루트」(scen_ui) 그대로 — 화마다 루트 하나를 이어 둘 수 있다.
   11-10 21:35 「인물 배치 · 주제 · 던전 · 지도 · NPC 시트 — 노트의 기능을 복합적으로」: 서랍에서 끌어 놓기 · 칩을 누르면 그 자리로.
   11-10 21:57 「클릭했을 때 짜치고 · 추가는 되는데 삭제가 안 되고 · 단서도 웹툴이랑 연계」:
     - 고치기는 가운데 창 대신 오른쪽 「옆 창」(#bpPanel) — 칸을 고치면 바로 저장되고 판에 바로 보인다. 저장 단추 없음.
     - 어디서든 지울 수 있게: 칩의 ×(판 · 옆 창) · 화 카드의 ✕ · 사건 발의 🗑 · 옆 창의 「지우기」.
     - 단서 {t, d, img}: 🔍 = 웹툴 방에 지금 공개(rp.clue · 공개 기록) + 찾음 표시 / 「웹툴 목록에」 = 웹툴 단서 보관 목록에 넣기 / 웹툴에서 공개한 도안 단서는 도안을 열 때 찾음으로 맞춘다 (NT_PHONE.clue*). */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const PH=[['c1','커뮤 ①','일상 · 자유 행동 — 사건의 전조와 단서를 흘린다'],['dg','던전','사건 현장 탐사 — 커뮤에서 모은 단서 수로 난이도 · 보상이 갈린다'],['c2','커뮤 ②','정리 · 선택 · 관계 — 하이라이트 전에 누구 편에 설지 정한다'],['hl','하이라이트','사건 결착 배틀 — 그 사건의 주역과 붙는다']];
 const PHK=Object.fromEntries(PH.map(p=>[p[0],p[1]]));const PHE={c1:'COMMU',dg:'DUNGEON',c2:'COMMU',hl:'BATTLE'};
 const PAL=['#e11d48','#1e88e5','#00a676','#8e44ad','#f08a00','#26c6da','#8d6e63','#d4a017'];
 const AST={'':'준비',now:'진행 중',done:'끝'};const EST={'':'예정',now:'이번 화',done:'끝'};
 const clone=o=>JSON.parse(JSON.stringify(o==null?null:o));
 const arcs=()=>N().list('arcs').sort((a,b)=>(a.order||0)-(b.order||0));
 const meta=()=>N().data('blue','main')||{};
 const npcs=()=>N().list('npc').filter(x=>x&&x.name).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko'));
 const pcs=()=>N().list('pc').filter(x=>x&&x.name&&x.cls!=='guest');   /* 객원(cls guest) 시트는 스포트라이트 · 서랍 · 점검에서 뺀다 */
 const nm=(kind,id)=>{const d=N().data(kind,id);return d?(d.name||d.title||''):''};
 const KN={npc:['npc','🎭','인물'],pc:['pc','🧑','PC'],spots:['spots','📍','장소'],dgs:['dgs','⛩','던전'],ents:['ents','📇','항목'],routes:['routes','🧭','루트']};
 const nmS=id=>{const d=N().data('spots',id);return d?(d.num?d.num+'. ':'')+(d.name||''):''};
 const nmK=(k,id)=>k==='spots'?nmS(id):k==='dgs'?((N().data('dgs',id)||{}).n||''):nm(k,id);
 const txtNames=s=>String(s||'').split(/[,·\n]/).map(x=>x.trim()).filter(Boolean);
 function goTo(k,id){panelClose();if(k==='dgs'){if(window.NT_DG&&NT_DG.openEd)return NT_DG.openEd(id);return N().go('map')}if(k==='routes'){N().go('scen');setTimeout(()=>{if(window.NT_SCEN&&NT_SCEN.write)NT_SCEN.write(id)},60);return}if(window.NT_FAV)NT_FAV.go({kind:k,id})}
 /* 화 번호 */
 function numbering(A,M){const no={};let n=0;for(const a of A)for(const [k] of PH)for(const e of (a.eps||[]))if(e.ph===k)no[e.id]=++n;for(const e of (M.extra||[]))no[e.id]=++n;return no}
 const newEp=ph=>({id:N().uid('e'),ph,title:'',goal:'',beats:'',st:'',npcs:[],npcTxt:'',pcs:[],spots:[],dg:'',ents:[],route:''});
 const clueFix=x=>{(x.clues||[]).forEach(c=>{if(!c.id)c.id=N().uid('q')});return x};

 /* ---- 저장 (모두 여기를 지난다) ---- */
 const epList=aid=>aid==='_x'?(meta().extra||[]):((N().data('arcs',aid)||{}).eps||[]);
 const epOf=(aid,eid)=>epList(aid).find(e=>e.id===eid)||null;
 function arcSave(aid,fn){return N().patch('arcs',aid,x=>{clueFix(x);return fn(x)})}
 function metaSave(fn){const M=clone(meta())||{};if(fn(M)===false)return false;return N().put('blue','main',M,'gm')}
 function epSave(aid,eid,fn){if(aid==='_x')return metaSave(M=>{const e=(M.extra||[]).find(y=>y.id===eid);if(!e)return false;return fn(e)});return arcSave(aid,x=>{const e=(x.eps||[]).find(y=>y.id===eid);if(!e)return false;return fn(e)})}
 function epPut(aid,ep){if(aid==='_x')return metaSave(M=>{M.extra=(M.extra||[]).slice();const i=M.extra.findIndex(x=>x.id===ep.id);if(i>=0)M.extra[i]=ep;else M.extra.push(ep)});return arcSave(aid,x=>{x.eps=(x.eps||[]).slice();const i=x.eps.findIndex(y=>y.id===ep.id);if(i>=0)x.eps[i]=ep;else x.eps.push(ep)})}
 function epDrop(aid,eid){if(aid==='_x')return metaSave(M=>{M.extra=(M.extra||[]).filter(x=>x.id!==eid)});return arcSave(aid,x=>{x.eps=(x.eps||[]).filter(y=>y.id!==eid)})}
 /* 이어 붙인 것 넣기 · 빼기 — field: npcs pcs spots ents boss cast (배열) · dg pc route (하나) · bossTxt castTxt npcTxt (이름 글) */
 const ONE=new Set(['dg','pc','route']);const TXT=new Set(['bossTxt','castTxt','npcTxt']);
 const addTo=(o,f,v)=>{if(ONE.has(f))o[f]=v;else if(TXT.has(f)){const L=txtNames(o[f]);if(!L.includes(v))L.push(v);o[f]=L.join(', ')}else o[f]=[...new Set([...(o[f]||[]),v])]};
 const rmFrom=(o,f,v)=>{if(ONE.has(f))o[f]='';else if(TXT.has(f))o[f]=txtNames(o[f]).filter(x=>x!==v).join(', ');else o[f]=(o[f]||[]).filter(x=>x!==v)};
 const link=(t,f,v,add)=>t.kind==='ep'?epSave(t.aid,t.eid,e=>{(add?addTo:rmFrom)(e,f,v)}):arcSave(t.aid,x=>{(add?addTo:rmFrom)(x,f,v)});

 /* ---- 판 ---- */
 const chip=(t,cls,title)=>`<span class="bp-chip ${cls||''}" ${title?`title="${esc(title)}"`:''}>${esc(t)}</span>`;
 /* 바로 가는 칩 (+ ×: sc = 'arc|aid' 또는 'ep|aid|eid') */
 const goChip=(k,id,cls,sc,f)=>{const t=nmK(k,id);return t?`<span class="bp-chip go ${cls||''}" data-go="${k}|${esc(id)}" title="눌러서 열기">${KN[k]?KN[k][1]+' ':''}${esc(t)}${sc?`<i class="bp-x" data-rm="${esc(sc)}|${f}|${esc(id)}" title="빼기">×</i>`:''}</span>`:''};
 const txChip=(t,cls,sc,f,title)=>`<span class="bp-chip ${cls||''}" title="${esc(title||'')}">${esc(t)}${sc?`<i class="bp-x" data-rm="${esc(sc)}|${f}|${esc(t)}" title="빼기">×</i>`:''}</span>`;

 function render(el){const G=N().gm();
  if(!G){panelClose();el.innerHTML=`<div class="toolbar"><h2>도안</h2></div><div class="empty">시나리오 도안은 GM만 봐요.</div>`;return}
  const A=arcs(),M=meta(),no=numbering(A,M),tot=Object.keys(no).length,tgt=+M.target||16;
  el.innerHTML=`<div class="toolbar"><h2>도안</h2><span class="note">큰 사건 ${A.length}개 · ${tot}화 / 목표 ${tgt}화</span><span class="sp"></span>${A.length?`<button class="btn sm" data-b="arcnew">＋ 큰 사건</button>`:''}<button class="btn sm ghost" data-b="meta">캠페인 설정</button></div>
   ${metaHtml(M,tot,tgt,A,no)}
   ${A.length?drawerHtml():''}
   ${A.length?`<div class="bp-wrap"><div class="bp-board" style="--n:${A.length}">${A.map((a,i)=>arcCol(a,i,A.length,no)).join('')}</div></div>${extraHtml(M,no)}${checkHtml(A,M,tot,tgt)}`:emptyHtml()}`;
  bind(el);panelSync();clueSync()}

 function ribbon(A,M,no,tgt){const R=[];A.forEach((a,i)=>{const col=a.color||PAL[i%PAL.length];for(const [k] of PH)for(const e of (a.eps||[]))if(e.ph===k)R.push({e,col,k,a:i+1,aid:a.id})});for(const e of (M.extra||[]))R.push({e,col:'#8a8a8a',k:'x',a:0,aid:'_x'});
  const pad=Math.max(0,tgt-R.length);return `<div class="bp-rib" title="화 흐름 — 사건 색 · 빗금 = 던전 · 높은 칸 = 하이라이트 (눌러서 그 화 열기)">${R.map(x=>`<span class="bp-rs k-${x.k} est-${x.e.st||'none'} ${sel('ep',x.aid,x.e.id)}" style="--ac:${esc(x.col)}" data-b="ep" data-id="${esc(x.aid)}" data-ep="${esc(x.e.id)}" title="${no[x.e.id]}화 · ${x.a?'사건 '+x.a+' · ':''}${esc(PHK[x.k]||'여유')}${x.e.title?' · '+esc(x.e.title):''}"><b>${no[x.e.id]}</b></span>`).join('')}${'<span class="bp-rs pad"></span>'.repeat(pad)}</div>`}
 function metaHtml(M,tot,tgt,A,no){const pct=Math.min(100,Math.round(tot/Math.max(1,tgt)*100));
  return `<div class="bp-meta ${sel('meta')}">
   <div class="bp-log" data-b="meta" title="눌러서 고친다">${M.logline?esc(M.logline):'<span class="dim">캠페인 한 줄을 적어 두세요 (눌러서)</span>'}</div>
   ${A&&A.length?ribbon(A,M,no,tgt):`<div class="bp-bar" title="${tot}화 / ${tgt}화"><i style="width:${pct}%"></i><b>${tot} / ${tgt}화</b></div>`}
   ${M.black||M.end?`<div class="bp-mrow" data-b="meta">${M.black?`<div><small>흑막 · 큰 그림</small><p>${esc(M.black)}</p></div>`:''}${M.end?`<div><small>결말</small><p>${esc(M.end)}</p></div>`:''}</div>`:''}</div>`}

 /* 서랍: 노트의 인물 · PC · 장소 · 던전 · 항목을 끌어 화 카드 · 사건 머리에 놓는다 (휴대폰은 옆 창의 ＋ 로) */
 const DKEY='nt_bp_drawer';const dGet=()=>{try{return localStorage.getItem(DKEY)||'npc'}catch(e){return 'npc'}};const dSet=v=>{try{localStorage.setItem(DKEY,v)}catch(e){}};
 const DTAB=[['npc','인물'],['pc','PC'],['spots','장소'],['dgs','던전'],['ents','항목'],['off','접기']];
 function items(k){if(k==='npc')return npcs().map(x=>[x.id,x.name]);if(k==='pc')return pcs().map(x=>[x.id,x.name]);
  if(k==='spots')return N().list('spots').filter(x=>x&&x.name).sort((a,b)=>(+a.num||0)-(+b.num||0)).map(x=>[x.id,(x.num?x.num+'. ':'')+x.name]);
  if(k==='dgs')return N().list('dgs').map(x=>[x.id,(x.n||'(던전)')+(x.spot&&nmS(x.spot)?' · '+nmS(x.spot):'')]);
  if(k==='ents')return N().list('ents').filter(x=>x&&x.title).sort((a,b)=>String(a.title).localeCompare(String(b.title),'ko')).map(x=>[x.id,x.title]);
  if(k==='routes')return (window.NT_SCEN?NT_SCEN.routes():N().list('routes')).map(x=>[x.id,x.name||'(루트)']);return []}
 const NONE={npc:'인물이 없어요',pc:'PC 시트가 없어요 (객원은 빼요)',spots:'지도에 장소가 없어요',dgs:'던전이 없어요 — 지도의 장소에서 붙여요',ents:'항목이 없어요',routes:'루트가 없어요'};
 /* 서랍 목록: 인물 = NPC 시트 + 「인물」 항목 (이 캠페인은 NPC 시트가 없어 인물을 항목으로 둔다) · 항목 = 인물이 아닌 항목. [id, 이름, 종류] */
 const isChar=x=>String(x.type||'')==='인물';
 function drawerItems(k){if(k==='npc')return [...npcs().map(x=>[x.id,x.name,'npc']),...N().list('ents').filter(x=>x&&x.title&&isChar(x)).sort((a,b)=>String(a.title).localeCompare(String(b.title),'ko')).map(x=>[x.id,x.title,'ents'])];
  if(k==='ents')return N().list('ents').filter(x=>x&&x.title&&!isChar(x)).sort((a,b)=>String(a.title).localeCompare(String(b.title),'ko')).map(x=>[x.id,x.title,'ents']);return items(k).map(x=>[x[0],x[1],k])}
 /* 11-10 망령 「(서랍) 여기서도 만들 수 있게」: 인물 · 항목은 이름만 받아 항목으로 바로 만든다 · 장소 · 던전은 지도에서 (자리를 찍어야 해서) */
 const DNEW={npc:'＋ 새 인물',ents:'＋ 새 항목',spots:'지도에서 장소 찍기 →',dgs:'지도에서 던전 붙이기 →'};
 async function drawerNew(k){if(k==='spots'||k==='dgs'){panelClose();N().toast(k==='spots'?'지도에서 「＋ 장소 찍기」로 만들어요':'지도의 장소를 눌러 「던전 붙이기」로 만들어요');return N().go('map')}
  const ty=k==='npc'?'인물':'설정';const name=await N().promptBox(k==='npc'?'새 인물 이름':'새 항목 이름','',k==='npc'?'예: 관리인 할아버지':'예: 봉인의 열쇠');if(!name||!String(name).trim())return;const T={'인물':['정체','외모','성격 · 말투','원하는 것','비밀'],'설정':['요약','규칙','예외 · 주의']};
  const id=N().uid('e');await N().put('ents',id,{type:ty,title:String(name).trim(),sub:'',body:'',rows:T[ty].map(q=>({k:q,v:''})),tags:[],teams:[],face:'',photo:'',at:[],created:Date.now(),order:N().list('ents').length},'gm');N().toast(`「${String(name).trim()}」 만들었어요 — 끌어다 놓고, 누르면 항목에서 자세히 적어요`)}
 function drawerHtml(){const k=dGet();const L=k==='off'?[]:drawerItems(k);
  return `<div class="bp-drawer ${k==='off'?'off':''}"><div class="bp-dtab">${DTAB.map(([v,l])=>`<button type="button" data-dt="${v}" class="${v===k?'on':''}">${l}</button>`).join('')}<small class="dim">${k==='off'?'':'끌어서 화 카드나 사건 머리에 놓아요 · 누르면 열기'}</small></div>
   ${k==='off'?'':`<div class="bp-dl">${L.length?L.map(([id,t,kk])=>`<span class="bp-dr" draggable="true" data-dk="${kk}" data-did="${esc(id)}" title="끌어서 놓기 · 누르면 열기">${KN[k][1]} ${esc(t)}</span>`).join(''):`<span class="dim small">${NONE[k]}</span>`}${DNEW[k]?`<button type="button" class="bp-dnew" data-dnew="${k}">${DNEW[k]}</button>`:''}</div>`}</div>`}
 const DROPF={npc:'npcs',pc:'pcs',spots:'spots',dgs:'dg',ents:'ents'};
 async function dropOn(t,k,id){if(!DROPF[k])return;
  if(t.kind==='ep'){const e=epOf(t.aid,t.eid);if(!e)return;await link(t,DROPF[k],id,true);N().toast(`「${e.title||'화'}」에 ${nmK(k,id)} 넣었어요`);return}
  const f=k==='npc'?'cast':k==='pc'?'pc':DROPF[k];const a=N().data('arcs',t.aid);if(!a)return;if(k==='npc'&&(a.boss||[]).includes(id))return N().toast('이미 주역이에요');
  await link(t,f,id,true);N().toast(k==='pc'?`스포트라이트 PC — ${nmK(k,id)}`:k==='npc'?`연결 인물에 ${nmK(k,id)} (주역은 옆 창에서)`:`사건에 ${nmK(k,id)} 넣었어요`)}

 function emptyHtml(){return `<div class="empty bp-empty"><b>아직 도안이 없어요.</b><p class="small">커뮤 ① → 던전 → 커뮤 ② → 하이라이트 배틀을 한 사이클로, 큰 사건 3개를 돌리는 틀을 만들어요.<br>한 사이클 5화(커뮤 ① 2화 · 던전 1 · 커뮤 ② 1 · 하이라이트 1) × 3 = 15화 + 여유 1화.</p>
   <div class="row" style="justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn pri" data-b="tmpl" data-n="3">큰 사건 3개 틀 만들기</button><button class="btn" data-b="tmpl" data-n="4">4개 (3 + 최종장)</button><button class="btn ghost" data-b="arcnew">빈 사건 하나</button></div></div>`}

 /* 사건 칸 — 줄(머리 · 단서 · 단계 4 · 발)을 사건끼리 맞춰 그리드에 놓는다 (휴대폰은 사건마다 차례로 쌓음) */
 function arcCol(a,i,n,no){const col=a.color||PAL[i%PAL.length];const eps=a.eps||[];const cl=a.clues||[];const ok=cl.filter(c=>c.ok).length;const c=i+1;const sc='arc|'+a.id;
  const cell=(r,cls,inner,attr)=>`<div class="bp-cell ${cls}" style="--ac:${esc(col)};grid-column:${c};grid-row:${r};--o:${i*10+r}" ${attr||''}>${inner}</div>`;
  const tags=[a.pc&&nm('pc',a.pc)?goChip('pc',a.pc,'pc',sc,'pc'):chip('스포트라이트 PC 없음','warn'),...(a.boss||[]).map(id=>goChip('npc',id,'boss',sc,'boss')),...txtNames(a.bossTxt).map(x=>txChip(x,'boss',sc,'bossTxt','주역')),...(a.cast||[]).map(id=>goChip('npc',id,'',sc,'cast')),...txtNames(a.castTxt).map(x=>txChip(x,'',sc,'castTxt','연결 인물'))].filter(Boolean);
  const stage=[...(a.spots||[]).map(id=>goChip('spots',id,'',sc,'spots')),a.dg?goChip('dgs',a.dg,'dg',sc,'dg'):'',...(a.ents||[]).map(id=>goChip('ents',id,'',sc,'ents'))].filter(Boolean);
  const head=`<div class="bp-ah ${sel('arc',a.id)}" data-b="arc" data-id="${esc(a.id)}" title="눌러서 사건을 고친다 · 서랍에서 끌어 놓으면 사건에 이어진다">
    <div class="bp-ahk"><span class="bp-no">${String(c).padStart(2,'0')}</span><span class="bp-ahm"><small>CASE ${c}</small><em class="bp-st st-${a.st||'none'}">${AST[a.st||'']}</em></span></div>
    <b class="bp-an">${esc(a.name||'(이름 없음)')}</b>${a.line?`<p class="bp-al">${esc(a.line)}</p>`:''}
    ${a.theme?`<div class="bp-theme"><small>주제</small>${esc(a.theme)}</div>`:''}
    <div class="bp-tags">${tags.join('')}</div>${stage.length?`<div class="bp-tags bp-stage">${stage.join('')}</div>`:''}${forksHtml(a.forks,no)}</div>`;
  const clues=cl.length?`<div class="bp-clues"><div class="bp-ch"><small>단서</small><span class="bp-cbar"><i style="width:${Math.round(ok/cl.length*100)}%"></i></span><small>${ok} / ${cl.length}</small></div>${cl.map((x,j)=>`<div class="bp-clue ${x.ok?'ok':''}"><label><input type="checkbox" data-clue="${esc(a.id)}|${j}" ${x.ok?'checked':''}><span title="${esc(x.d||'')}">${esc(x.t||'(단서)')}${x.d||x.img?' <em>⋯</em>':''}</span></label><button type="button" class="bp-mini" data-b="cshow" data-id="${esc(a.id)}" data-j="${j}" title="웹툴 방에 지금 공개 (모두의 화면에 단서 카드)">🔍</button></div>`).join('')}</div>`:`<div class="bp-clues none" data-b="arc" data-id="${esc(a.id)}"><small>단서 없음 — 눌러서 적어요</small></div>`;
  return cell(1,'bp-t',head,`data-drop="arc" data-id="${esc(a.id)}"`)+cell(2,'bp-m',clues)
   +PH.map(([k,lab,tip],pi)=>{const L=eps.filter(e=>e.ph===k);return cell(3+pi,'bp-m bp-p ph-'+k,`<div class="bp-phh" title="${esc(tip)}"><span class="bp-phl">${lab}<small>${PHE[k]}</small></span><button type="button" class="bp-add" data-b="epnew" data-id="${esc(a.id)}" data-ph="${k}" title="${lab}에 화 더하기">＋</button></div>${L.map(e=>epCard(a.id,e,no)).join('')||'<div class="bp-none">비어 있음</div>'}`)}).join('')
   +cell(7,'bp-b',`<div class="bp-af"><button class="btn xs ghost" data-b="mv" data-id="${esc(a.id)}" data-d="-1" ${i?'':'disabled'} title="사건을 앞으로">◀</button><span class="dim small">${eps.length}화</span><span class="sp"></span><button class="btn xs ghost danger" data-b="arcdel" data-id="${esc(a.id)}" title="이 사건 지우기">🗑</button><button class="btn xs ghost" data-b="mv" data-id="${esc(a.id)}" data-d="1" ${i<n-1?'':'disabled'} title="사건을 뒤로">▶</button></div>`)}

 function epCard(aid,e,no){const sc='ep|'+aid+'|'+e.id;const L=[...(e.pcs||[]).map(id=>goChip('pc',id,'pc',sc,'pcs')),...(e.npcs||[]).map(id=>goChip('npc',id,'',sc,'npcs')),...txtNames(e.npcTxt).map(x=>txChip(x,'',sc,'npcTxt','나오는 인물')),...(e.spots||[]).map(id=>goChip('spots',id,'',sc,'spots')),e.dg?goChip('dgs',e.dg,'dg',sc,'dg'):'',...(e.ents||[]).map(id=>goChip('ents',id,'',sc,'ents')),e.route?goChip('routes',e.route,'',sc,'route'):''].filter(Boolean);
  return `<div role="button" tabindex="0" class="bp-ep est-${e.st||'none'} ${sel('ep',aid,e.id)}" data-b="ep" data-id="${esc(aid)}" data-ep="${esc(e.id)}" data-drop="ep"><i>${no[e.id]||'?'}화</i>${e.title?`<span>${esc(e.title)}</span>`:'<span class="bp-ph0">빈 화 — 눌러서 채우기</span>'}${e.st?`<b class="bp-est">${EST[e.st]}</b>`:''}<button type="button" class="bp-del" data-b="epdel" data-id="${esc(aid)}" data-ep="${esc(e.id)}" title="이 화 지우기">✕</button>${e.goal?`<small>${esc(e.goal)}</small>`:''}${forksHtml(e.forks,no)}${L.length?`<div class="bp-tags">${L.join('')}</div>`:''}</div>`}

 function extraHtml(M,no){const L=M.extra||[];
  return `<div class="bp-extra"><div class="bp-phh"><span>여유 · 최종장</span><small class="dim">추가플 · 밀린 진행 · 짧은 최종장</small><button type="button" class="bp-add" data-b="epnew" data-id="_x" data-ph="x" title="여유 칸에 화 더하기">＋</button></div><div class="bp-exl">${L.map(e=>epCard('_x',e,no)).join('')||'<div class="bp-none">비어 있음</div>'}</div></div>`}

 function checkHtml(A,M,tot,tgt){const W=[];
  if(tot!==tgt)W.push(tot>tgt?`목표보다 ${tot-tgt}화 많아요`:`목표까지 ${tgt-tot}화 남았어요`);
  A.forEach((a,i)=>{const e=a.eps||[];const t=`사건 ${i+1}「${a.name||''}」`;if(!e.some(x=>x.ph==='hl'))W.push(`${t} — 하이라이트 화가 없어요`);if(!(a.boss||[]).length&&!txtNames(a.bossTxt).length)W.push(`${t} — 주역이 없어요`);if(!(a.clues||[]).length)W.push(`${t} — 단서가 없어요 (던전 난이도를 가를 거리)`)});
  const P=pcs();const sp={};A.forEach(a=>{if(a.pc)sp[a.pc]=(sp[a.pc]||0)+1});const none=P.filter(p=>!sp[p.id]).map(p=>p.name),dup=P.filter(p=>sp[p.id]>1).map(p=>p.name);
  if(P.length&&none.length)W.push(`스포트라이트가 없는 PC: ${none.join(' · ')}`);if(dup.length)W.push(`스포트라이트가 두 번 이상: ${dup.join(' · ')}`);
  return W.length?`<div class="bp-check"><b>점검</b><ul>${W.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>`:`<div class="bp-check ok"><b>점검</b> 빠진 곳이 없어요.</div>`}

 /* ---- 만들기 · 옮기기 · 지우기 ---- */
 async function tmpl(n){if(arcs().length&&!await N().confirmBox('틀을 더 만들까요? 지금 사건은 그대로 두고 뒤에 붙여요.','더 만들기'))return;const base=arcs().length;
  for(let i=0;i<3;i++){const eps=[newEp('c1'),newEp('c1'),newEp('dg'),newEp('c2'),newEp('hl')];eps[0].title=i===0?'도입':'';await N().put('arcs',N().uid('a'),{order:base+i,name:'사건 '+(base+i+1),color:PAL[(base+i)%PAL.length],line:'',theme:'',st:'',pc:'',boss:[],cast:[],spots:[],dg:'',ents:[],clues:[],note:'',eps},'gm')}
  const M=meta();const ex=(M.extra||[]).slice();if(n===4){const a=newEp('x');a.title='최종장 — 던전';const b=newEp('x');b.title='최종장 — 결전';ex.push(a,b)}else if(!ex.length){const a=newEp('x');a.title='여유';ex.push(a)}
  await N().put('blue','main',Object.assign({target:16},M,{extra:ex}),'gm');N().toast('틀을 만들었어요 — 사건 머리나 화 카드를 눌러 채워요')}
 async function arcNew(){const A=arcs();const i=A.length;const id=N().uid('a');await N().put('arcs',id,{order:(A.length?(A[A.length-1].order||0)+1:0),name:'사건 '+(i+1),color:PAL[i%PAL.length],line:'',theme:'',st:'',pc:'',boss:[],cast:[],spots:[],dg:'',ents:[],clues:[],note:'',eps:[newEp('c1'),newEp('dg'),newEp('c2'),newEp('hl')]},'gm');panelOpen({kind:'arc',aid:id})}
 async function arcDel(id){const a=N().data('arcs',id);if(!a)return;if(!await N().confirmBox(`사건 「${a.name||'사건'}」과 그 안의 화 ${(a.eps||[]).length}개를 지울까요?`,'지우기'))return;if(P&&P.aid===id)panelClose();const ok=await N().del('arcs',id);if(ok!==false){if(N().toastUndo)N().toastUndo('사건을 지웠어요');else N().toast('사건을 지웠어요')}}
 async function epDel(aid,eid){const e=epOf(aid,eid);if(!e)return;const filled=e.title||e.goal||e.beats||(e.npcs||[]).length||(e.spots||[]).length||e.dg||e.route;if(filled&&!await N().confirmBox(`「${e.title||'이 화'}」를 지울까요?`,'지우기'))return;if(P&&P.kind==='ep'&&P.eid===eid)panelClose();await epDrop(aid,eid);N().toast('화를 지웠어요')}
 async function mv(id,d){const A=arcs();const i=A.findIndex(a=>a.id===id),j=i+d;if(i<0||j<0||j>=A.length)return;const o1=A[i].order||0,o2=A[j].order||0;const s1=o1===o2?j:o2,s2=o1===o2?i:o1;await N().patch('arcs',A[i].id,x=>{x.order=s1});await N().patch('arcs',A[j].id,x=>{x.order=s2})}
 /* 화를 같은 칸 안에서 앞 · 뒤로 */
 function epMove(aid,eid,d){const sw=L=>{const e=L.find(x=>x.id===eid);if(!e)return false;const S=L.filter(x=>aid==='_x'||x.ph===e.ph);const k=S.indexOf(e),o=S[k+d];if(!o)return false;const a=L.indexOf(e),b=L.indexOf(o);L[a]=o;L[b]=e};
  return aid==='_x'?metaSave(M=>sw(M.extra||[])):arcSave(aid,x=>sw(x.eps||[]))}
 /* 화를 다른 사건 · 단계로 */
 async function epTo(aid,eid,to,ph){const e=clone(epOf(aid,eid));if(!e)return;e.ph=to==='_x'?'x':(ph&&ph!=='x'?ph:(e.ph==='x'?'c1':e.ph));if(to===aid)return epPut(aid,e);await epDrop(aid,eid);await epPut(to,e);if(P&&P.kind==='ep'&&P.eid===eid){P.aid=to}}
 /* ---- 단서 ↔ 웹툴 ---- */
 const clueOf=(aid,j)=>((N().data('arcs',aid)||{}).clues||[])[j]||null;
 async function clueShow(aid,j){const c0=clueOf(aid,j);if(!c0)return;if(!window.NT_PHONE||!NT_PHONE.clueShow)return N().toast('웹툴 연결을 불러오지 못했어요');
  if(!c0.id){await arcSave(aid,()=>{})}const c=clueOf(aid,j);if(!await N().confirmBox(`단서 「${c.t||'단서'}」를 웹툴 방의 모두에게 지금 공개할까요?`,'공개'))return;
  if(await NT_PHONE.clueShow(c)){await arcSave(aid,x=>{if(!x.clues[j])return false;x.clues[j].ok=true});N().toast('웹툴에 단서를 공개했어요');panelDraw()}}
 async function clueLibAll(aid){const a=N().data('arcs',aid);if(!a||!(a.clues||[]).length)return N().toast('보낼 단서가 없어요');if(!window.NT_PHONE||!NT_PHONE.clueLib)return;await arcSave(aid,()=>{});const b=N().data('arcs',aid);const n=await NT_PHONE.clueLib(b.clues,b.name);if(n>=0)N().toast(`웹툴 단서 목록에 ${n}개 넣었어요 — 웹툴 GM 창 「연출 → 단서 카드」에서 꺼내 써요`)}
 /* 웹툴에서 공개한 도안 단서를 찾음으로 (도안을 열 때 · 1분에 한 번) */
 let CS={at:0,busy:false};
 async function clueSync(force){if(CS.busy||(!force&&Date.now()-CS.at<60000))return;if(!window.NT_PHONE||!NT_PHONE.clueShown)return;CS.busy=true;CS.at=Date.now();
  try{const S=await NT_PHONE.clueShown();if(!S||!S.size){if(force)N().toast(S?'웹툴에서 공개한 도안 단서가 없어요':'웹툴 방을 읽지 못했어요');return}let n=0;
   for(const a of arcs()){const hit=(a.clues||[]).filter(c=>c.id&&!c.ok&&S.has(c.id));if(!hit.length)continue;n+=hit.length;await arcSave(a.id,x=>{x.clues.forEach(c=>{if(c.id&&S.has(c.id))c.ok=true})})}
   if(n)N().toast(`웹툴에서 공개한 단서 ${n}개를 찾음으로 맞췄어요`);else if(force)N().toast('맞출 것이 없어요');if(n)panelDraw()}finally{CS.busy=false}}

 /* 11-10 망령 「던전이나 사건 같은 건 분기 설정도 필요하지 않을까」: 분기 forks:[{id, c(조건), r(결과), to(이어질 화 id)}] — 화(던전 결과 · 선택)와 사건(결말 갈래) 둘 다.
    판에는 「⑂ 조건 → 결과 (→ N화)」 줄로, 옆 창에서 줄마다 고친다 */
 const forkLine=(f,no)=>`<div class="bp-fk"><b>⑂</b> ${esc(f.c||'(조건)')}${f.r?` <i>→</i> ${esc(f.r)}`:''}${f.to&&no&&no[f.to]?` <em>→ ${no[f.to]}화</em>`:''}</div>`;
 const forksHtml=(L,no)=>(L||[]).length?`<div class="bp-fks">${L.map(f=>forkLine(f,no)).join('')}</div>`:'';
 function forkSec(o,hint){const A=arcs(),M=meta(),no=numbering(A,M);const all=[];A.forEach((a,i)=>(a.eps||[]).forEach(e=>all.push([e.id,`${no[e.id]}화 · ${e.title||PHK[e.ph]||''}`])));(M.extra||[]).forEach(e=>all.push([e.id,`${no[e.id]}화 · ${e.title||'여유'}`]));all.sort((x,y)=>(no[x[0]]||0)-(no[y[0]]||0));
  return `<div class="bp-f bp-fo"><label>분기<small>${hint}</small></label>${(o.forks||[]).map((f,j)=>`<div class="bp-fr"><input type="text" data-ff="c|${j}" value="${esc(f.c||'')}" placeholder="조건 — 예: 단서 2개 이상"><span>→</span><input type="text" data-ff="r|${j}" value="${esc(f.r||'')}" placeholder="결과 — 예: 숨은 방이 열린다"><select data-ff="to|${j}" title="이어질 화"><option value="">화 잇기 없음</option>${all.map(([id,t])=>`<option value="${esc(id)}" ${f.to===id?'selected':''}>${esc(t)}</option>`).join('')}</select><button type="button" class="bp-mini x" data-fdel="${j}" title="분기 지우기">×</button></div>`).join('')}<button type="button" class="btn xs ghost" data-fnew>＋ 분기</button></div>`}
 const forkSave=fn=>P.kind==='ep'?epSave(P.aid,P.eid,e=>{e.forks=e.forks||[];return fn(e.forks)}):arcSave(P.aid,x=>{x.forks=x.forks||[];return fn(x.forks)});

 /* ---- 옆 창 (고치기) ---- */
 let P=null;   /* {kind:'ep'|'arc'|'meta', aid, eid, pick:'' (열린 고르기 칸), open:{단서 펼침}} */
 const sel=(kind,aid,eid)=>P&&P.kind===kind&&(kind==='meta'||(P.aid===aid&&(kind==='arc'||P.eid===eid)))?'bp-sel':'';
 const panelEl=()=>document.getElementById('bpPanel');
 function panelClose(){const el=panelEl();if(el){const f=el.querySelector(':focus');if(f&&f.blur)f.blur();el.classList.remove('on');setTimeout(()=>{if(!P&&el.parentNode)el.remove()},180)}const had=!!P;P=null;document.body.classList.remove('bp-panel-on');if(had)$$('.bp-sel').forEach(x=>x.classList.remove('bp-sel'))}
 function panelOpen(t){const f=document.activeElement;if(f&&panelEl()&&panelEl().contains(f)&&f.blur)f.blur();P=Object.assign({pick:'',open:{}},t);let el=panelEl();if(!el){el=document.createElement('aside');el.id='bpPanel';el.className='bp-panel';document.body.appendChild(el);panelBind(el);requestAnimationFrame(()=>el.classList.add('on'))}else el.classList.add('on');
  document.body.classList.add('bp-panel-on');panelDraw();$$('.bp-sel').forEach(x=>x.classList.remove('bp-sel'));markSel();el.scrollTop=0}
 function markSel(){if(!P)return;const q=P.kind==='ep'?`[data-b="ep"][data-ep="${CSS.escape(P.eid)}"]`:P.kind==='arc'?`.bp-ah[data-id="${CSS.escape(P.aid)}"]`:'.bp-meta';$$(q).forEach(x=>x.classList.add('bp-sel'))}
 /* 판이 다시 그려질 때: 대상이 사라졌으면 닫고, 글 칸을 쓰는 중이 아니면 다시 그린다 */
 function panelSync(){if(!P)return;if(P.kind==='ep'&&!epOf(P.aid,P.eid))return panelClose();if(P.kind==='arc'&&!N().data('arcs',P.aid))return panelClose();const el=panelEl();if(!el)return;const f=document.activeElement;if(f&&el.contains(f)&&/^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName))return panelHead();panelDraw()}
 function panelHead(){const el=panelEl();if(!el||!P)return;const h=el.querySelector('.bp-pk');if(h)h.innerHTML=kicker()}
 function kicker(){if(!P)return '';if(P.kind==='meta')return '<b>캠페인 설정</b>';const A=arcs();if(P.kind==='arc'){const i=A.findIndex(a=>a.id===P.aid);return `<b>CASE ${i+1}</b><span>큰 사건</span>`}
  const no=numbering(A,meta());const e=epOf(P.aid,P.eid)||{};const i=A.findIndex(a=>a.id===P.aid);return `<b>${no[e.id]||'?'}화</b><span>${P.aid==='_x'?'여유 · 최종장':'사건 '+(i+1)+' · '+esc(PHK[e.ph]||'')}</span>`}
 const fld=(lab,inner,hint)=>`<div class="bp-f"><label>${lab}${hint?`<small>${hint}</small>`:''}</label>${inner}</div>`;
 const inp=(f,v,ph)=>`<input type="text" data-f="${f}" value="${esc(v||'')}" placeholder="${esc(ph||'')}">`;
 const txa=(f,v,rows,ph)=>`<textarea data-f="${f}" rows="${rows||3}" placeholder="${esc(ph||'')}">${esc(v||'')}</textarea>`;
 const seg=(f,opts,cur)=>`<div class="bp-seg" data-seg="${f}">${opts.map(([k,l])=>`<button type="button" data-v="${esc(k)}" class="${(cur||'')===k?'on':''}">${esc(l)}</button>`).join('')}</div>`;
 /* 이어 붙이는 칸: 칩(×) + ＋ → 고르기(찾기 · 누르면 넣기 · 이름 글도) */
 function linkSec(lab,f,k,o,opt){opt=opt||{};const one=ONE.has(f);const ids=one?(o[f]?[o[f]]:[]):(o[f]||[]);const tf=opt.txt;const tx=tf?txtNames(o[tf]):[];const open=P.pick===f;
  const chips=[...ids.map(id=>{const t=nmK(k,id);return t?`<span class="bp-chip go ${opt.cls||''}" data-go="${k}|${esc(id)}" title="눌러서 열기">${KN[k][1]} ${esc(t)}<i class="bp-x" data-prm="${f}|${esc(id)}" title="빼기">×</i></span>`:`<span class="bp-chip warn">(없어진 것)<i class="bp-x" data-prm="${f}|${esc(id)}">×</i></span>`}),...tx.map(t=>`<span class="bp-chip ${opt.cls||''}">${esc(t)}<i class="bp-x" data-prm="${tf}|${esc(t)}" title="빼기">×</i></span>`)];
  let pick='';if(open){const L=items(k).filter(([id])=>!ids.includes(id)).map(x=>[x[0],x[1],f]);if(opt.chars)for(const x of N().list('ents').filter(x=>x&&x.title&&isChar(x)&&!(o.ents||[]).includes(x.id)))L.push([x.id,x.title,'ents']);pick=`<div class="bp-pick2"><input type="text" class="bp-q" data-nosave placeholder="${tf?'찾기 · 없는 이름은 적고 Enter':'찾기'}" data-pf="${f}" data-tf="${tf||''}"><div class="bp-pl">${L.length?L.map(([id,t,ff])=>`<button type="button" data-padd="${ff}|${esc(id)}">${KN[k][1]} ${esc(t)}</button>`).join(''):`<span class="dim small">${ids.length?'더 넣을 것이 없어요':NONE[k]}</span>`}</div></div>`}
  return `<div class="bp-f bp-lk"><label>${lab}${opt.hint?`<small>${opt.hint}</small>`:''}<button type="button" class="bp-plus ${open?'on':''}" data-pick="${f}" title="${open?'닫기':'넣기'}">${open?'닫기':'＋'}</button></label><div class="bp-tags">${chips.join('')||'<span class="bp-nil">없음</span>'}</div>${pick}</div>`}

 function panelDraw(){const el=panelEl();if(!el||!P)return;const keep=el.scrollTop;let body='',foot='',col='var(--red)';
  if(P.kind==='meta'){const M=meta();
   body=fld('캠페인 한 줄',inp('logline',M.logline,'예: 미사그 대학 1학기, 학교 밑의 봉인서고가 깨어난다'))
    +fld('목표 화수',`<input type="number" class="bp-n" min="1" data-f="target" value="${+M.target||16}">`)
    +fld('흑막 · 큰 그림','',)+txa('black',M.black,5,'사건 셋을 하나로 꿰는 것 — 누가, 무엇을 위해')
    +fld('결말','', '여러 갈래면 줄마다')+txa('end',M.end,4,'')}
  else if(P.kind==='arc'){const a=clueFix(clone(N().data('arcs',P.aid)));if(!a)return panelClose();const A=arcs();const i=A.findIndex(x=>x.id===a.id);col=a.color||PAL[i%PAL.length];const cl=a.clues||[];
   body=`<input type="text" class="bp-title" data-f="name" value="${esc(a.name||'')}" placeholder="사건 이름">`
    +fld('상태',seg('st',Object.entries(AST),a.st))
    +fld('색',`<div class="bp-sw" data-seg="color">${PAL.map(c=>`<button type="button" data-v="${c}" class="${(a.color||'')===c?'on':''}" style="--c:${c}" title="${c}"></button>`).join('')}</div>`)
    +fld('한 줄',inp('line',a.line,'무슨 사건인지'))
    +fld('주제 · 물음','')+txa('theme',a.theme,3,'이 사건이 PC에게 묻는 것')
    +linkSec('스포트라이트 PC','pc','pc',a,{cls:'pc',hint:'이 사이클의 커뮤에서 비출 사람'})
    +linkSec('주역','boss','npc',a,{cls:'boss',txt:'bossTxt',hint:'하이라이트에서 붙는 쪽 · 이름만 적어도 돼요'})
    +linkSec('연결 인물','cast','npc',a,{txt:'castTxt',chars:1,hint:'「인물」 항목은 관련 항목에 들어가요'})
    +linkSec('무대','spots','spots',a)
    +linkSec('던전','dg','dgs',a,{cls:'dg'})
    +linkSec('관련 항목','ents','ents',a)
    +`<div class="bp-f bp-cl"><label>단서<small>${cl.filter(c=>c.ok).length} / ${cl.length} 찾음</small></label>
      ${cl.map((c,j)=>{const op=P.open[c.id];return `<div class="bp-cr ${c.ok?'ok':''}"><div class="bp-cr1"><input type="checkbox" data-pclue="${j}" ${c.ok?'checked':''} title="찾음"><input type="text" data-cf="t|${j}" value="${esc(c.t||'')}" placeholder="단서 이름"><button type="button" class="bp-mini ${op?'on':''}" data-cop="${esc(c.id)}" title="설명 · 그림">${c.d||c.img?'⋯':'＋'}</button><button type="button" class="bp-mini" data-cshow="${j}" title="웹툴 방에 지금 공개">🔍</button><button type="button" class="bp-mini x" data-cdel="${j}" title="단서 지우기">×</button></div>${op?`<div class="bp-cr2"><textarea data-cf="d|${j}" rows="3" placeholder="설명 — 공개하면 모두의 화면에 뜬다">${esc(c.d||'')}</textarea><input type="text" data-cf="img|${j}" value="${esc(c.img||'')}" placeholder="그림 주소 (https://…)"></div>`:''}</div>`}).join('')}
      <input type="text" class="bp-cnew" data-nosave data-cnew placeholder="＋ 단서 적고 Enter">
      <div class="bp-clb"><button type="button" class="btn xs" data-clib title="이 사건의 단서를 웹툴 단서 보관 목록에 넣는다 (같은 것은 고쳐 넣음)">📥 웹툴 목록에</button><button type="button" class="btn xs ghost" data-csync title="웹툴에서 공개한 단서를 찾음으로 맞춘다">↻ 웹툴과 맞추기</button></div></div>`
    +forkSec(a,'결말 갈래 — 하이라이트 결과에 따라')
    +fld('메모','')+txa('note',a.note,4,'');
   foot=`<button type="button" class="btn sm ghost danger" data-pdel>🗑 사건 지우기</button>`}
  else{const e=epOf(P.aid,P.eid);if(!e)return panelClose();const A=arcs();const i=A.findIndex(x=>x.id===P.aid);col=P.aid==='_x'?'#8a8a8a':((A[i]||{}).color||PAL[i%PAL.length]);
   const where=[...A.map((a,k)=>[a.id,`사건 ${k+1} · ${a.name||''}`]),['_x','여유 · 최종장']];
   body=`<input type="text" class="bp-title" data-f="title" value="${esc(e.title||'')}" placeholder="화 제목">`
    +fld('상태',seg('st',Object.entries(EST),e.st))
    +(P.aid==='_x'?'':fld('단계',seg('ph',PH.map(p=>[p[0],p[1]]),e.ph)))
    +fld('사건',`<select data-to>${where.map(([k,v])=>`<option value="${esc(k)}" ${k===P.aid?'selected':''}>${esc(v)}</option>`).join('')}</select>`)
    +fld('이 화의 목표',inp('goal',e.goal,'끝났을 때 무엇이 남는지'))
    +fld('진행 메모','')+txa('beats',e.beats,7,'장면 · 비트 · 던질 단서')
    +forkSec(e,e.ph==='dg'?'던전 결과 · 갈림길':'선택 · 결과에 따라')
    +linkSec('나오는 인물','npcs','npc',e,{txt:'npcTxt',chars:1})
    +linkSec('비추는 PC','pcs','pc',e,{cls:'pc'})
    +linkSec('장소','spots','spots',e)
    +linkSec('던전','dg','dgs',e,{cls:'dg'})
    +linkSec('관련 항목','ents','ents',e)
    +linkSec('세부 루트','route','routes',e,{hint:'낭독문 · 웹툴로 보내기는 「루트」 탭'})
    +`<div class="bp-f"><button type="button" class="btn xs ghost" data-rnew title="이 화 이름으로 루트를 만들어 잇는다">＋ 이 화의 새 루트 만들기</button></div>`;
   foot=`<button type="button" class="btn sm ghost" data-pmv="-1" title="같은 칸에서 앞으로">▲</button><button type="button" class="btn sm ghost" data-pmv="1" title="같은 칸에서 뒤로">▼</button><span class="sp"></span><button type="button" class="btn sm ghost danger" data-pdel>🗑 화 지우기</button>`}
  el.style.setProperty('--ac',col);
  el.innerHTML=`<div class="bp-ph"><div class="bp-pk">${kicker()}</div><span class="sp"></span><small class="bp-saved" id="bpSaved"></small><button type="button" class="bp-pclose" data-pclose title="닫기 (Esc)">✕</button></div><div class="bp-pb">${body}</div>${foot?`<div class="bp-pf">${foot}</div>`:''}`;
  el.scrollTop=keep;const q=el.querySelector('.bp-q');if(q)q.focus()}
 let savedT=null;const saved=()=>{const s=document.getElementById('bpSaved');if(!s)return;s.textContent='저장됨';s.classList.add('on');clearTimeout(savedT);savedT=setTimeout(()=>s.classList.remove('on'),1200)};
 const tgtP=()=>P.kind==='ep'?{kind:'ep',aid:P.aid,eid:P.eid}:{kind:'arc',aid:P.aid};
 async function setF(f,v){if(!P)return;let r;if(P.kind==='meta')r=await metaSave(M=>{M[f]=f==='target'?Math.max(1,+v||16):v});else if(P.kind==='arc')r=await arcSave(P.aid,x=>{x[f]=v});else r=await epSave(P.aid,P.eid,e=>{e[f]=v});if(r!==false)saved()}
 function panelBind(el){
  el.addEventListener('change',async e=>{const t=e.target;if(!P)return;
   if(t.dataset.f)return setF(t.dataset.f,t.type==='number'?t.value:t.value.trim&&t.tagName!=='TEXTAREA'?t.value.trim():t.value);
   if(t.dataset.cf){const [k,j]=t.dataset.cf.split('|');const v=k==='d'?t.value:t.value.trim();const r=await arcSave(P.aid,x=>{if(!x.clues[+j])return false;x.clues[+j][k]=v});if(r!==false)saved();return}
   if(t.dataset.ff){const [k,j]=t.dataset.ff.split('|');const v=t.value.trim();const r=await forkSave(L=>{if(!L[+j])return false;L[+j][k]=v});if(r!==false)saved();return}
   if(t.dataset.pclue!=null){const j=+t.dataset.pclue;await arcSave(P.aid,x=>{if(!x.clues[j])return false;x.clues[j].ok=t.checked});saved();return}
   if(t.hasAttribute('data-to')){await epTo(P.aid,P.eid,t.value);saved();panelDraw();return}});
  el.addEventListener('keydown',async e=>{const t=e.target;if(e.key==='Escape'){if(P&&P.pick){P.pick='';return panelDraw()}return panelClose()}
   if(e.key!=='Enter'||e.isComposing)return;
   if(t.hasAttribute('data-cnew')){const v=t.value.trim();if(!v)return;e.preventDefault();t.value='';await arcSave(P.aid,x=>{x.clues=(x.clues||[]).concat([{id:N().uid('q'),t:v,d:'',img:'',ok:false}])});saved();panelDraw();const n=panelEl().querySelector('[data-cnew]');if(n)n.focus();return}
   if(t.classList.contains('bp-q')){e.preventDefault();const f=t.dataset.pf,tf=t.dataset.tf,v=t.value.trim();const first=[...panelEl().querySelectorAll('.bp-pl button')].find(b=>!b.hidden);
    if(first){const [ff,id]=first.dataset.padd.split('|');await link(tgtP(),ff,id,true)}else if(tf&&v){await link(tgtP(),tf,v,true)}else return;saved();if(ONE.has(f))P.pick='';panelDraw();return}
   if(t.tagName==='INPUT'&&t.dataset.f){t.blur()}});
  el.addEventListener('input',e=>{const t=e.target;if(!t.classList.contains('bp-q'))return;const q=t.value.trim().toLowerCase();panelEl().querySelectorAll('.bp-pl button').forEach(b=>{b.hidden=!!q&&!b.textContent.toLowerCase().includes(q)})});
  el.addEventListener('click',async e=>{if(!P)return;const t=e.target;const c=s=>t.closest(s);let b;
   if(c('[data-pclose]'))return panelClose();
   if((b=c('[data-prm]'))){e.stopPropagation();const [f,v]=b.dataset.prm.split('|');await link(tgtP(),f,v,false);saved();return panelDraw()}
   if((b=c('[data-go]'))){const [k,id]=b.dataset.go.split('|');return goTo(k,id)}
   if((b=c('[data-pick]'))){P.pick=P.pick===b.dataset.pick?'':b.dataset.pick;return panelDraw()}
   if((b=c('[data-padd]'))){const [f,id]=b.dataset.padd.split('|');await link(tgtP(),f,id,true);saved();if(ONE.has(f))P.pick='';return panelDraw()}
   if((b=c('[data-seg] [data-v]'))){const f=b.parentElement.dataset.seg;const v=b.dataset.v;if(f==='ph'){await epTo(P.aid,P.eid,P.aid,v)}else await setF(f,v);saved();return panelDraw()}
   if((b=c('[data-cop]'))){P.open[b.dataset.cop]=!P.open[b.dataset.cop];return panelDraw()}
   if((b=c('[data-cdel]'))){const j=+b.dataset.cdel;await arcSave(P.aid,x=>{x.clues.splice(j,1)});saved();return panelDraw()}
   if((b=c('[data-cshow]')))return clueShow(P.aid,+b.dataset.cshow);
   if(c('[data-fnew]')){await forkSave(L=>{L.push({id:N().uid('f'),c:'',r:'',to:''})});panelDraw();const q=[...panelEl().querySelectorAll('[data-ff^="c|"]')].pop();if(q)q.focus();return}
   if((b=c('[data-fdel]'))){const j=+b.dataset.fdel;await forkSave(L=>{L.splice(j,1)});saved();return panelDraw()}
   if(c('[data-clib]'))return clueLibAll(P.aid);
   if(c('[data-csync]'))return clueSync(true);
   if((b=c('[data-pmv]'))){await epMove(P.aid,P.eid,+b.dataset.pmv);return}
   if(c('[data-rnew]')){const e0=epOf(P.aid,P.eid);if(!e0)return;const rid=N().uid('r');const R0=N().list('routes');await N().put('routes',rid,{name:e0.title||'새 루트',group:'',color:(N().data('arcs',P.aid)||{}).color||'#1e88e5',entry:'',goal:e0.goal||'',note:'',next:[],order:R0.length,visible:true,links:[],steps:[]},'gm');await epSave(P.aid,P.eid,x=>{x.route=rid});N().toast('루트를 만들어 이었어요 — 칩을 누르면 「루트」 탭에서 단계를 채워요');return panelDraw()}
   if(c('[data-pdel]')){if(P.kind==='arc')return arcDel(P.aid);if(P.kind==='ep')return epDel(P.aid,P.eid)}})}
 /* 다른 화면으로 가면 옆 창을 닫는다 */
 setInterval(()=>{try{if(P&&(N().ST.view!=='blue'||!N().gm()))panelClose()}catch(e){}},700);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&P&&!document.querySelector('.modalbg')){const el=panelEl();if(el&&!el.contains(document.activeElement))panelClose()}});

 /* ---- 판의 단추 ---- */
 function bind(el){el.addEventListener('click',async e=>{const t=e.target;
   const rm=t.closest('[data-rm]');if(rm&&el.contains(rm)){e.stopPropagation();const p=rm.dataset.rm.split('|');const tg=p[0]==='ep'?{kind:'ep',aid:p[1],eid:p[2]}:{kind:'arc',aid:p[1]};const f=p[p.length-2],v=p[p.length-1];await link(tg,f,v,false);if(P)panelDraw();return}
   const g=t.closest('[data-go],.bp-dr');if(g&&el.contains(g)){e.stopPropagation();const [k,id]=g.dataset.go?g.dataset.go.split('|'):[g.dataset.dk,g.dataset.did];return goTo(k,id)}
   const dt=t.closest('[data-dt]');if(dt){dSet(dt.dataset.dt);return N().render()}
   const dn=t.closest('[data-dnew]');if(dn)return drawerNew(dn.dataset.dnew);
   if(t.closest('.bp-clue label'))return;
   const b=t.closest('[data-b]');if(!b||!el.contains(b))return;const k=b.dataset.b,id=b.dataset.id;
   if(k==='tmpl')return tmpl(+b.dataset.n||3);if(k==='arcnew')return arcNew();if(k==='meta')return panelOpen({kind:'meta'});if(k==='arc')return panelOpen({kind:'arc',aid:id});
   if(k==='arcdel'){e.stopPropagation();return arcDel(id)}if(k==='epdel'){e.stopPropagation();return epDel(id,b.dataset.ep)}
   if(k==='cshow'){e.stopPropagation();return clueShow(id,+b.dataset.j)}
   if(k==='mv')return mv(id,+b.dataset.d);
   if(k==='epnew'){e.stopPropagation();const ne=newEp(b.dataset.ph);await epPut(id,ne);return panelOpen({kind:'ep',aid:id,eid:ne.id})}
   if(k==='ep')return panelOpen({kind:'ep',aid:id,eid:b.dataset.ep})});
  el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.bp-ep')){e.preventDefault();e.target.click()}});
  el.addEventListener('dragstart',e=>{const d=e.target.closest&&e.target.closest('.bp-dr');if(!d)return;e.dataTransfer.setData('text/plain',d.dataset.dk+'|'+d.dataset.did);e.dataTransfer.effectAllowed='copy';el.classList.add('bp-dragging')});
  el.addEventListener('dragend',()=>{el.classList.remove('bp-dragging');$$('.bp-over',el).forEach(x=>x.classList.remove('bp-over'))});
  const tgt=e=>{const ep=e.target.closest&&e.target.closest('[data-drop="ep"]');if(ep)return ep;return e.target.closest&&e.target.closest('[data-drop="arc"]')};
  el.addEventListener('dragover',e=>{const t=tgt(e);if(!t)return;e.preventDefault();e.dataTransfer.dropEffect='copy';$$('.bp-over',el).forEach(x=>{if(x!==t)x.classList.remove('bp-over')});t.classList.add('bp-over')});
  el.addEventListener('drop',async e=>{const t=tgt(e);if(!t)return;e.preventDefault();t.classList.remove('bp-over');const [k,id]=String(e.dataTransfer.getData('text/plain')||'').split('|');if(!k||!id||!KN[k])return;
   if(t.dataset.drop==='ep')await dropOn({kind:'ep',aid:t.dataset.id,eid:t.dataset.ep},k,id);else await dropOn({kind:'arc',aid:t.dataset.id},k,id);if(P)panelDraw()});
  el.addEventListener('change',e=>{const c=e.target.closest('[data-clue]');if(!c)return;const [aid,j]=c.dataset.clue.split('|');arcSave(aid,x=>{if(!(x.clues||[])[+j])return false;x.clues[+j].ok=c.checked}).then(()=>{if(P)panelDraw()})})}

 N().MOD.blue={render};
 window.NT_BLUE={arcs,meta,numbering,open:panelOpen,close:panelClose};
})();
