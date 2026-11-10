/* ---------- 시나리오 도안 (11-10 망령 「시나리오 탭 사실 미사용이라 허술할 테니 전격 개조」) ----------
   캠페인 뼈대: 큰 사건(사이클) 3~4개 × 단계 [커뮤 ① → 던전 → 커뮤 ② → 하이라이트 배틀]. 한 사이클 ≈ 5화.
   · kind 'arcs' — 큰 사건 하나 = 문서 하나 (GM만)
     {order, name, color, line(한 줄), st('' | now | done), pc(스포트라이트 PC id), boss[npc id], bossTxt, cast[npc id], castTxt,
      theme(주제 · 물음), spots[무대 spot id], dg(던전 dgs id), ents[항목 id],
     clues:[{t, ok}], note, eps:[{id, ph(c1 | dg | c2 | hl), title, goal, beats, st, npcs[npc id], pcs[pc id], spots[spot id], dg, ents[항목 id], route(세부 루트 id)}]}
   11-10 망령 「인물 배치 · 주제 적기 · 던전 · 지도 · NPC 시트 — 노트의 기능을 복합적으로」: 위 「서랍」(인물 · PC · 장소 · 던전 · 항목)에서 끌어 화 카드 · 사건 머리에 놓으면 이어지고,
   카드의 칩을 누르면 그 자리(NPC 시트 · 지도 장소 · 던전 편집기 · 항목 · 루트)로 간다. 사건의 주제 · 무대 · 던전도 사건 머리에.
   · kind 'blue' id 'main' — 캠페인 설정 (GM만) {logline, target(목표 화수), black(흑막 · 큰 그림), end(결말), extra:[ep…] (여유 · 최종장 칸)}
   화 번호는 사건 순서 → 단계 순서 → 칸 안 순서로 저절로 매긴다(여유 칸은 맨 뒤). 객원은 구성 단계에 넣지 않는다(11-10 망령).
   세부 진행(낭독문 · 장소 · 웹툴로 보내기)은 옆 탭 「루트」(scen_ui) 그대로 — 화마다 루트 하나를 이어 둘 수 있다. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const PH=[['c1','커뮤 ①','일상 · 자유 행동 — 사건의 전조와 단서를 흘린다'],['dg','던전','사건 현장 탐사 — 커뮤에서 모은 단서 수로 난이도 · 보상이 갈린다'],['c2','커뮤 ②','정리 · 선택 · 관계 — 하이라이트 전에 누구 편에 설지 정한다'],['hl','하이라이트','사건 결착 배틀 — 그 사건의 주역과 붙는다']];
 const PHK=Object.fromEntries(PH.map(p=>[p[0],p[1]]));
 const PAL=['#e11d48','#1e88e5','#00a676','#8e44ad','#f08a00','#26c6da','#8d6e63'];
 const AST={'':'준비',now:'진행 중',done:'끝'};const EST={'':'예정',now:'이번 화',done:'끝'};
 const arcs=()=>N().list('arcs').sort((a,b)=>(a.order||0)-(b.order||0));
 const meta=()=>N().data('blue','main')||{};
 const npcs=()=>N().list('npc').filter(x=>x&&x.name).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko'));
 const pcs=()=>N().list('pc').filter(x=>x&&x.name);
 const nm=(kind,id)=>{const d=N().data(kind,id);return d?(d.name||d.title||''):''};
 const KN={npc:['npc','🎭'],pc:['pc','🧑'],spots:['spots','📍'],dgs:['dgs','⛩'],ents:['ents','📇'],routes:['routes','🧭']};
 const nmS=id=>{const d=N().data('spots',id);return d?(d.num?d.num+'. ':'')+(d.name||''):''};
 const nmK=(k,id)=>k==='spots'?nmS(id):k==='dgs'?((N().data('dgs',id)||{}).n||''):nm(k,id);
 const goChip=(k,id,cls)=>{const t=nmK(k,id);return t?`<span class="bp-chip go ${cls||''}" data-go="${k}|${esc(id)}" title="눌러서 열기">${KN[k]?KN[k][1]+' ':''}${esc(t)}</span>`:''};
 function goTo(k,id){if(k==='dgs'){if(window.NT_DG&&NT_DG.openEd)return NT_DG.openEd(id);return N().go('map')}if(k==='routes'){N().go('scen');setTimeout(()=>{if(window.NT_SCEN&&NT_SCEN.write)NT_SCEN.write(id)},60);return}if(window.NT_FAV)NT_FAV.go({kind:k,id})}
 const txtNames=s=>String(s||'').split(/[,·\n]/).map(x=>x.trim()).filter(Boolean);
 /* 화 번호 */
 function numbering(A,M){const no={};let n=0;for(const a of A)for(const [k] of PH)for(const e of (a.eps||[]))if(e.ph===k)no[e.id]=++n;for(const e of (M.extra||[]))no[e.id]=++n;return no}
 const chip=(t,cls,title)=>`<span class="bp-chip ${cls||''}" ${title?`title="${esc(title)}"`:''}>${esc(t)}</span>`;

 function render(el){const G=N().gm();
  if(!G){el.innerHTML=`<div class="toolbar"><h2>도안</h2></div><div class="empty">시나리오 도안은 GM만 봐요.</div>`;return}
  const A=arcs(),M=meta(),no=numbering(A,M),tot=Object.keys(no).length,tgt=+M.target||16;
  el.innerHTML=`<div class="toolbar"><h2>도안</h2><span class="note">큰 사건 ${A.length}개 · ${tot}화 / 목표 ${tgt}화</span><span class="sp"></span>${A.length?`<button class="btn sm" data-b="arcnew">＋ 큰 사건</button>`:''}<button class="btn sm ghost" data-b="meta">캠페인 설정</button></div>
   ${metaHtml(M,tot,tgt)}
   ${A.length?drawerHtml():''}
   ${A.length?`<div class="bp-board">${A.map((a,i)=>arcCol(a,i,A.length,no)).join('')}</div>${extraHtml(M,no)}${checkHtml(A,M,tot,tgt)}`:emptyHtml()}`;
  bind(el)}

 function metaHtml(M,tot,tgt){const pct=Math.min(100,Math.round(tot/Math.max(1,tgt)*100));
  return `<div class="bp-meta" data-b="meta" title="눌러서 고친다">
   <div class="bp-log">${M.logline?esc(M.logline):'<span class="dim">캠페인 한 줄을 적어 두세요 (눌러서)</span>'}</div>
   <div class="bp-bar" title="${tot}화 / ${tgt}화"><i style="width:${pct}%"></i><b>${tot} / ${tgt}화</b></div>
   ${M.black||M.end?`<div class="bp-mrow">${M.black?`<div><small>흑막 · 큰 그림</small><p>${esc(M.black)}</p></div>`:''}${M.end?`<div><small>결말</small><p>${esc(M.end)}</p></div>`:''}</div>`:''}</div>`}

 /* 서랍: 노트의 인물 · PC · 장소 · 던전 · 항목을 끌어 화 카드 · 사건 머리에 놓는다 (휴대폰은 화 · 사건 창의 고르기 칸으로) */
 const DKEY='nt_bp_drawer';const dGet=()=>{try{return localStorage.getItem(DKEY)||'npc'}catch(e){return 'npc'}};const dSet=v=>{try{localStorage.setItem(DKEY,v)}catch(e){}};
 const DTAB=[['npc','인물'],['pc','PC'],['spots','장소'],['dgs','던전'],['ents','항목'],['off','접기']];
 function drawerItems(k){if(k==='npc')return npcs().map(x=>[x.id,x.name]);if(k==='pc')return pcs().map(x=>[x.id,x.name]);
  if(k==='spots')return N().list('spots').filter(x=>x&&x.name).sort((a,b)=>(+a.num||0)-(+b.num||0)).map(x=>[x.id,(x.num?x.num+'. ':'')+x.name]);
  if(k==='dgs')return N().list('dgs').map(x=>[x.id,(x.n||'(던전)')+(x.spot&&nmS(x.spot)?' · '+nmS(x.spot):'')]);
  if(k==='ents')return N().list('ents').filter(x=>x&&x.title).sort((a,b)=>String(a.title).localeCompare(String(b.title),'ko')).map(x=>[x.id,x.title]);return []}
 function drawerHtml(){const k=dGet();const L=k==='off'?[]:drawerItems(k);
  return `<div class="bp-drawer ${k==='off'?'off':''}"><div class="bp-dtab">${DTAB.map(([v,l])=>`<button type="button" data-dt="${v}" class="${v===k?'on':''}">${l}</button>`).join('')}<small class="dim">${k==='off'?'':'끌어서 화 카드나 사건 머리에 놓아요 · 누르면 열기'}</small></div>
   ${k==='off'?'':`<div class="bp-dl">${L.length?L.map(([id,t])=>`<span class="bp-dr" draggable="true" data-dk="${k}" data-did="${esc(id)}" title="끌어서 놓기 · 누르면 열기">${KN[k][1]} ${esc(t)}</span>`).join(''):`<span class="dim small">${{npc:'NPC 시트가 없어요 — 시트 탭에서 만들어요',pc:'PC 시트가 없어요',spots:'지도에 장소가 없어요',dgs:'던전이 없어요 — 지도의 장소에서 붙여요',ents:'항목이 없어요'}[k]}</span>`}</div>`}</div>`}
 /* 놓았을 때 */
 async function dropOn(t,k,id){if(t.kind==='ep'){const cur=epOf(t.aid,t.eid);if(!cur)return;const e=Object.assign({},cur);
   if(k==='npc'){e.npcs=[...new Set([...(e.npcs||[]),id])]}else if(k==='pc'){e.pcs=[...new Set([...(e.pcs||[]),id])]}else if(k==='spots'){e.spots=[...new Set([...(e.spots||[]),id])]}else if(k==='dgs'){e.dg=id}else if(k==='ents'){e.ents=[...new Set([...(e.ents||[]),id])]}else return;
   await put(t.aid,e);N().toast(`「${e.title||'화'}」에 ${nmK(k,id)} 넣었어요`);return}
  if(t.kind==='arc'){await N().patch('arcs',t.aid,x=>{if(k==='npc'){if((x.boss||[]).includes(id))return false;x.cast=[...new Set([...(x.cast||[]),id])]}else if(k==='pc')x.pc=id;else if(k==='spots')x.spots=[...new Set([...(x.spots||[]),id])];else if(k==='dgs')x.dg=id;else if(k==='ents')x.ents=[...new Set([...(x.ents||[]),id])];else return false});
   N().toast(k==='pc'?`스포트라이트 PC — ${nmK(k,id)}`:k==='npc'?`연결 인물에 ${nmK(k,id)} (주역은 사건 창에서)`:`사건에 ${nmK(k,id)} 넣었어요`)}}
 function emptyHtml(){return `<div class="empty bp-empty"><b>아직 도안이 없어요.</b><p class="small">커뮤 ① → 던전 → 커뮤 ② → 하이라이트 배틀을 한 사이클로, 큰 사건 3개를 돌리는 틀을 만들어요.<br>한 사이클 5화(커뮤 ① 2화 · 던전 1 · 커뮤 ② 1 · 하이라이트 1) × 3 = 15화 + 여유 1화.</p>
   <div class="row" style="justify-content:center;gap:8px;margin-top:10px"><button class="btn pri" data-b="tmpl" data-n="3">큰 사건 3개 틀 만들기</button><button class="btn" data-b="tmpl" data-n="4">4개 (3 + 최종장)</button><button class="btn ghost" data-b="arcnew">빈 사건 하나</button></div></div>`}

 function arcCol(a,i,n,no){const col=a.color||PAL[i%PAL.length];const eps=a.eps||[];const cl=a.clues||[];const ok=cl.filter(c=>c.ok).length;
  return `<section class="bp-arc st-${a.st||'none'}" style="--ac:${esc(col)}" data-drop="arc" data-id="${esc(a.id)}">
   <header class="bp-ah" data-b="arc" data-id="${esc(a.id)}" title="눌러서 사건을 고친다">
    <div class="bp-ahk"><small>사건 ${i+1}</small><em class="bp-st">${AST[a.st||'']}</em></div>
    <b>${esc(a.name||'(이름 없음)')}</b>${a.line?`<p>${esc(a.line)}</p>`:''}
    ${a.theme?`<div class="bp-theme">${esc(a.theme)}</div>`:''}
    <div class="bp-tags">${a.pc&&nm('pc',a.pc)?goChip('pc',a.pc,'pc'):chip('스포트라이트 PC 없음','warn')}${(a.boss||[]).map(id=>goChip('npc',id,'boss')).join('')}${txtNames(a.bossTxt).map(x=>chip(x,'boss','주역')).join('')}${(a.cast||[]).map(id=>goChip('npc',id)).join('')}${txtNames(a.castTxt).map(x=>chip(x,'','연결 인물')).join('')}</div>
    ${(a.spots||[]).length||a.dg||(a.ents||[]).length?`<div class="bp-tags">${(a.spots||[]).map(id=>goChip('spots',id)).join('')}${a.dg?goChip('dgs',a.dg,'dg'):''}${(a.ents||[]).map(id=>goChip('ents',id)).join('')}</div>`:''}
   </header>
   ${cl.length?`<div class="bp-clues"><small>단서 ${ok} / ${cl.length}</small>${cl.map((c,j)=>`<label class="bp-clue ${c.ok?'ok':''}"><input type="checkbox" data-clue="${esc(a.id)}|${j}" ${c.ok?'checked':''}><span>${esc(c.t)}</span></label>`).join('')}</div>`:''}
   ${PH.map(([k,lab,tip])=>{const L=eps.filter(e=>e.ph===k);return `<div class="bp-ph ph-${k}"><div class="bp-phh" title="${esc(tip)}"><span>${lab}</span><button type="button" class="bp-add" data-b="epnew" data-id="${esc(a.id)}" data-ph="${k}" title="${lab}에 화 더하기">＋</button></div>${L.map(e=>epCard(a.id,e,no)).join('')||'<div class="bp-none">—</div>'}</div>`}).join('')}
   <footer class="bp-af"><button class="btn xs ghost" data-b="mv" data-id="${esc(a.id)}" data-d="-1" ${i?'':'disabled'} title="앞으로">◀</button><span class="dim small">${eps.length}화</span><button class="btn xs ghost" data-b="mv" data-id="${esc(a.id)}" data-d="1" ${i<n-1?'':'disabled'} title="뒤로">▶</button></footer>
  </section>`}

 function epCard(aid,e,no){const L=[...(e.pcs||[]).map(id=>goChip('pc',id,'pc')),...(e.npcs||[]).map(id=>goChip('npc',id)),...(e.spots||[]).map(id=>goChip('spots',id)),e.dg?goChip('dgs',e.dg,'dg'):'',...(e.ents||[]).map(id=>goChip('ents',id)),e.route?goChip('routes',e.route):''].filter(Boolean);
  return `<div role="button" tabindex="0" class="bp-ep est-${e.st||'none'}" data-b="ep" data-id="${esc(aid)}" data-ep="${esc(e.id)}" data-drop="ep"><i>${no[e.id]||'?'}화</i><span>${esc(e.title||'(제목 없음)')}</span>${e.goal?`<small>${esc(e.goal)}</small>`:''}${L.length?`<div class="bp-tags">${L.join('')}</div>`:''}</div>`}

 function extraHtml(M,no){const L=M.extra||[];
  return `<div class="bp-extra"><div class="bp-phh"><span>여유 · 최종장</span><small class="dim">추가플 · 밀린 진행 · 짧은 최종장</small><button type="button" class="bp-add" data-b="epnew" data-id="_x" data-ph="x" title="여유 칸에 화 더하기">＋</button></div><div class="bp-exl">${L.map(e=>epCard('_x',e,no)).join('')||'<div class="bp-none">—</div>'}</div></div>`}

 function checkHtml(A,M,tot,tgt){const W=[];
  if(tot!==tgt)W.push(tot>tgt?`목표보다 ${tot-tgt}화 많아요`:`목표까지 ${tgt-tot}화 남았어요`);
  A.forEach((a,i)=>{const e=a.eps||[];const t=`사건 ${i+1}「${a.name||''}」`;if(!e.some(x=>x.ph==='hl'))W.push(`${t} — 하이라이트 화가 없어요`);if(!(a.boss||[]).length&&!txtNames(a.bossTxt).length)W.push(`${t} — 주역이 없어요`);if(!(a.clues||[]).length)W.push(`${t} — 단서가 없어요 (던전 난이도를 가를 거리)`)});
  const P=pcs();const sp={};A.forEach(a=>{if(a.pc)sp[a.pc]=(sp[a.pc]||0)+1});const none=P.filter(p=>!sp[p.id]).map(p=>p.name),dup=P.filter(p=>sp[p.id]>1).map(p=>p.name);
  if(P.length&&none.length)W.push(`스포트라이트가 없는 PC: ${none.join(' · ')}`);if(dup.length)W.push(`스포트라이트가 두 번 이상: ${dup.join(' · ')}`);
  return W.length?`<div class="bp-check"><b>점검</b><ul>${W.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>`:`<div class="bp-check ok"><b>점검</b> 빠진 곳이 없어요.</div>`}

 /* ---- 고치기 ---- */
 const newEp=ph=>({id:N().uid('e'),ph,title:'',goal:'',beats:'',st:'',npcs:[],pcs:[],spots:[],dg:'',ents:[],route:''});
 async function tmpl(n){if(arcs().length&&!await N().confirmBox('틀을 더 만들까요? 지금 사건은 그대로 두고 뒤에 붙여요.','더 만들기'))return;const base=arcs().length;
  for(let i=0;i<3;i++){const eps=[newEp('c1'),newEp('c1'),newEp('dg'),newEp('c2'),newEp('hl')];eps[0].title=i===0?'도입':'';await N().put('arcs',N().uid('a'),{order:base+i,name:'사건 '+(base+i+1),color:PAL[(base+i)%PAL.length],line:'',st:'',pc:'',boss:[],cast:[],clues:[],note:'',eps},'gm')}
  const M=meta();const ex=(M.extra||[]).slice();if(n===4){const a=newEp('x');a.title='최종장 — 던전';const b=newEp('x');b.title='최종장 — 결전';ex.push(a,b)}else if(!ex.length){const a=newEp('x');a.title='여유';ex.push(a)}
  await N().put('blue','main',Object.assign({target:16},M,{extra:ex}),'gm');N().toast('틀을 만들었어요 — 사건 머리를 눌러 이름 · 주역 · 단서를 채워요')}
 async function arcNew(){const A=arcs();const i=A.length;await N().put('arcs',N().uid('a'),{order:(A.length?(A[A.length-1].order||0)+1:0),name:'사건 '+(i+1),color:PAL[i%PAL.length],line:'',st:'',pc:'',boss:[],cast:[],clues:[],note:'',eps:[newEp('c1'),newEp('dg'),newEp('c2'),newEp('hl')]},'gm')}
 async function mv(id,d){const A=arcs();const i=A.findIndex(a=>a.id===id),j=i+d;if(i<0||j<0||j>=A.length)return;const o1=A[i].order||0,o2=A[j].order||0;const s1=o1===o2?j:o2,s2=o1===o2?i:o1;await N().patch('arcs',A[i].id,x=>{x.order=s1});await N().patch('arcs',A[j].id,x=>{x.order=s2})}
 async function clue(aid,j,on){await N().patch('arcs',aid,x=>{if(!(x.clues||[])[j])return false;x.clues[j].ok=!!on})}

 const npcPick=(name,sel)=>{const L=npcs();return L.length?`<div class="bp-pick">${L.map(p=>`<label class="chk"><input type="checkbox" name="${name}" value="${esc(p.id)}" ${(sel||[]).includes(p.id)?'checked':''}>${esc(p.name)}</label>`).join('')}</div>`:'<div class="small dim">NPC 시트가 없어요 — 아래 칸에 이름으로 적어요</div>'};
 const msel=(idn,list,sel,lab,size)=>list.length?`<label class="lbl">${lab}<select id="${idn}" multiple size="${Math.min(size||6,list.length)}">${list.map(([id,t])=>`<option value="${esc(id)}" ${(sel||[]).includes(id)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`:'';
 const ssel=(idn,list,cur,lab)=>list.length?`<label class="lbl">${lab}<select id="${idn}"><option value="">없음</option>${list.map(([id,t])=>`<option value="${esc(id)}" ${cur===id?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`:'';
 const mval=(md,idn,old)=>{const x=$('#'+idn,md);return x?[...x.selectedOptions].map(o=>o.value):(old||[])};const sval=(md,idn,old)=>{const x=$('#'+idn,md);return x?x.value:(old||'')};
 const picked=(md,name)=>$$(`input[name="${name}"]:checked`,md).map(x=>x.value);
 function metaEdit(){const M=meta();
  const md=N().openModal(`<div class="mhead"><h2>캠페인 설정</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="bp-form"><label class="lbl">캠페인 한 줄<input id="bmL" type="text" value="${esc(M.logline||'')}" placeholder="예: 미사그 대학 1학기, 학교 밑의 봉인서고가 깨어난다"></label>
   <label class="lbl">목표 화수<input id="bmT" type="number" class="n" min="1" value="${+M.target||16}"></label>
   <label class="lbl">흑막 · 큰 그림 (사건 셋을 꿰는 것)<textarea id="bmB" rows="4">${esc(M.black||'')}</textarea></label>
   <label class="lbl">결말 (여러 갈래면 줄마다)<textarea id="bmE" rows="3">${esc(M.end||'')}</textarea></label></div>
   <div class="row" style="margin-top:12px"><span class="sp"></span><button class="btn pri" id="bmOk">저장</button></div>`,'wide');
  $('#bmOk',md).onclick=async()=>{const M2=Object.assign({},meta(),{logline:$('#bmL',md).value.trim(),target:Math.max(1,+$('#bmT',md).value||16),black:$('#bmB',md).value.trim(),end:$('#bmE',md).value.trim()});N().closeModal();await N().put('blue','main',M2,'gm')}}
 function arcEdit(id){const a=N().data('arcs',id);if(!a)return;const P=pcs();
  const md=N().openModal(`<div class="mhead"><h2>큰 사건</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="bp-form">
    <div class="row" style="gap:8px;align-items:flex-end"><label class="lbl" style="flex:1">이름<input id="baN" type="text" value="${esc(a.name||'')}"></label><label class="lbl">색<input id="baC" type="color" value="${esc(a.color||'#e11d48')}"></label><label class="lbl">상태<select id="baS">${Object.entries(AST).map(([k,v])=>`<option value="${k}" ${(a.st||'')===k?'selected':''}>${v}</option>`).join('')}</select></label></div>
    <label class="lbl">한 줄 (무슨 사건인지)<input id="baL" type="text" value="${esc(a.line||'')}"></label>
    <label class="lbl">주제 · 물음 (이 사건이 PC에게 묻는 것)<textarea id="baTh" rows="3">${esc(a.theme||'')}</textarea></label>
    <label class="lbl">스포트라이트 PC (이 사이클의 커뮤에서 비출 사람)<select id="baP"><option value="">없음</option>${P.map(p=>`<option value="${esc(p.id)}" ${a.pc===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
    <div class="lbl">주역 (하이라이트에서 붙는 쪽)${npcPick('baB',a.boss)}<input id="baBt" type="text" value="${esc(a.bossTxt||'')}" placeholder="시트 없는 이름 (쉼표로)"></div>
    <div class="lbl">연결 인물${npcPick('baK',a.cast)}<input id="baKt" type="text" value="${esc(a.castTxt||'')}" placeholder="시트 없는 이름 (쉼표로)"></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-start"><div style="flex:1;min-width:180px">${msel('baSp',drawerItems('spots'),a.spots,'무대 장소 (Ctrl 로 여럿)')}</div><div style="flex:1;min-width:180px">${ssel('baDg',drawerItems('dgs'),a.dg,'던전')}${msel('baEn',drawerItems('ents'),a.ents,'관련 항목 (Ctrl 로 여럿)',5)}</div></div>
    <label class="lbl">단서 (한 줄에 하나 · 앞에 ✓ 를 붙이면 찾은 것)<textarea id="baQ" rows="4">${esc((a.clues||[]).map(c=>(c.ok?'✓ ':'')+c.t).join('\n'))}</textarea></label>
    <label class="lbl">메모<textarea id="baM" rows="3">${esc(a.note||'')}</textarea></label></div>
   <div class="row" style="margin-top:12px"><button class="btn ghost danger sm" id="baDel">사건 지우기</button><span class="sp"></span><button class="btn pri" id="baOk">저장</button></div>`,'wide');
  $('#baOk',md).onclick=async()=>{const v={name:$('#baN',md).value.trim(),color:$('#baC',md).value,st:$('#baS',md).value,line:$('#baL',md).value.trim(),pc:$('#baP',md).value,boss:picked(md,'baB'),bossTxt:$('#baBt',md).value.trim(),cast:picked(md,'baK'),castTxt:$('#baKt',md).value.trim(),theme:$('#baTh',md).value.trim(),spots:mval(md,'baSp',a.spots),dg:sval(md,'baDg',a.dg),ents:mval(md,'baEn',a.ents),
    clues:$('#baQ',md).value.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>({t:x.replace(/^[✓✔]\s*/,''),ok:/^[✓✔]/.test(x)})),note:$('#baM',md).value.trim()};N().closeModal();await N().patch('arcs',id,x=>{Object.assign(x,v)})};
  $('#baDel',md).onclick=async()=>{if(!await N().confirmBox(`「${a.name||'사건'}」과 그 안의 화 ${(a.eps||[]).length}개를 지울까요?`,'지우기'))return;N().closeModal();await N().del('arcs',id)}}
 /* 화: aid 가 '_x' 면 여유 칸(blue/main.extra) */
 const epOf=(aid,eid)=>{const L=aid==='_x'?(meta().extra||[]):((N().data('arcs',aid)||{}).eps||[]);return L.find(e=>e.id===eid)||null};
 function epEdit(aid,eid,ph){const cur=eid?epOf(aid,eid):null;if(eid&&!cur)return;const e=cur||newEp(ph||'c1');const A=arcs();const S=N().list('spots').filter(s=>s&&s.name).sort((a,b)=>(+a.num||0)-(+b.num||0));const R=window.NT_SCEN?NT_SCEN.routes():N().list('routes');
  const where=[...A.map((a,i)=>[a.id,`사건 ${i+1} · ${a.name||''}`]),['_x','여유 · 최종장']];
  const md=N().openModal(`<div class="mhead"><h2>${cur?'화 고치기':'화 더하기'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="bp-form">
    <div class="row" style="gap:8px;flex-wrap:wrap"><label class="lbl" style="flex:1;min-width:160px">사건<select id="beA">${where.map(([k,v])=>`<option value="${esc(k)}" ${k===aid?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label class="lbl">단계<select id="beP">${PH.map(([k,l])=>`<option value="${k}" ${e.ph===k?'selected':''}>${l}</option>`).join('')}<option value="x" ${e.ph==='x'?'selected':''}>(여유 칸)</option></select></label><label class="lbl">상태<select id="beS">${Object.entries(EST).map(([k,v])=>`<option value="${k}" ${(e.st||'')===k?'selected':''}>${v}</option>`).join('')}</select></label></div>
    <label class="lbl">제목<input id="beT" type="text" value="${esc(e.title||'')}"></label>
    <label class="lbl">이 화의 목표 (끝났을 때 무엇이 남는지)<input id="beG" type="text" value="${esc(e.goal||'')}"></label>
    <label class="lbl">진행 메모 (장면 · 비트 · 던질 단서)<textarea id="beB" rows="6">${esc(e.beats||'')}</textarea></label>
    <div class="lbl">나오는 NPC${npcPick('beN',e.npcs)}</div>
    ${pcs().length?`<div class="lbl">비추는 PC<div class="bp-pick">${pcs().map(p=>`<label class="chk"><input type="checkbox" name="beC" value="${esc(p.id)}" ${(e.pcs||[]).includes(p.id)?'checked':''}>${esc(p.name)}</label>`).join('')}</div></div>`:''}
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-start"><div style="flex:1;min-width:180px">${S.length?`<label class="lbl">장소 (Ctrl 로 여럿)<select id="beL" multiple size="${Math.min(6,S.length)}">${S.map(s=>`<option value="${esc(s.id)}" ${(e.spots||[]).includes(s.id)?'selected':''}>${esc((s.num?s.num+'. ':'')+s.name)}</option>`).join('')}</select></label>`:''}</div><div style="flex:1;min-width:180px">${ssel('beD',drawerItems('dgs'),e.dg,'던전')}${msel('beE',drawerItems('ents'),e.ents,'관련 항목 (Ctrl 로 여럿)',5)}</div></div>
    <div class="row" style="gap:8px;align-items:flex-end"><label class="lbl" style="flex:1">세부 루트 (낭독문 · 장소 · 웹툴로 보내기는 「루트」 탭)<select id="beR"><option value="">없음</option>${R.map(r=>`<option value="${esc(r.id)}" ${e.route===r.id?'selected':''}>${esc(r.name||'(루트)')}</option>`).join('')}</select></label>${e.route?`<button class="btn sm" id="beRo">루트 열기</button>`:''}<button class="btn sm ghost" id="beRn" title="이 화 이름으로 루트를 만들어 잇는다">＋ 새 루트</button></div></div>
   <div class="row" style="margin-top:12px">${cur?'<button class="btn ghost danger sm" id="beDel">화 지우기</button>':''}<span class="sp"></span><button class="btn pri" id="beOk">저장</button></div>`,'wide');
  const read=()=>({title:$('#beT',md).value.trim(),goal:$('#beG',md).value.trim(),beats:$('#beB',md).value,st:$('#beS',md).value,ph:$('#beP',md).value,npcs:picked(md,'beN'),pcs:$$('input[name="beC"]',md).length?picked(md,'beC'):(e.pcs||[]),dg:sval(md,'beD',e.dg),ents:mval(md,'beE',e.ents),spots:$('#beL',md)?[...$('#beL',md).selectedOptions].map(o=>o.value):(e.spots||[]),route:$('#beR',md).value});
  const save=async(v,to)=>{const ne=Object.assign({},e,v);if(to==='_x')ne.ph='x';else if(ne.ph==='x')ne.ph='c1';
   if(cur&&aid!==to)await drop(aid,e.id);await put(to,ne)};
  $('#beOk',md).onclick=async()=>{const v=read(),to=$('#beA',md).value;N().closeModal();await save(v,to)};
  const ro=$('#beRo',md);if(ro)ro.onclick=()=>{const rid=$('#beR',md).value;N().closeModal();N().go('scen');setTimeout(()=>{if(window.NT_SCEN&&NT_SCEN.write)NT_SCEN.write(rid)},60)};
  $('#beRn',md).onclick=async()=>{const v=read(),to=$('#beA',md).value;const rid=N().uid('r');const R0=N().list('routes');await N().put('routes',rid,{name:v.title||'새 루트',group:'',color:(N().data('arcs',to)||{}).color||'#1e88e5',entry:'',goal:v.goal||'',note:'',next:[],order:R0.length,visible:true,links:[],steps:[]},'gm');v.route=rid;N().closeModal();await save(v,to);N().toast('루트를 만들어 이었어요 — 「루트」 탭에서 단계를 채워요')};
  const dl=$('#beDel',md);if(dl)dl.onclick=async()=>{if(!await N().confirmBox(`「${e.title||'이 화'}」를 지울까요?`,'지우기'))return;N().closeModal();await drop(aid,e.id)}}
 async function put(aid,ep){if(aid==='_x'){const M=Object.assign({},meta());const L=(M.extra||[]).slice();const i=L.findIndex(x=>x.id===ep.id);if(i>=0)L[i]=ep;else L.push(ep);M.extra=L;return N().put('blue','main',M,'gm')}
  return N().patch('arcs',aid,x=>{x.eps=(x.eps||[]).slice();const i=x.eps.findIndex(y=>y.id===ep.id);if(i>=0)x.eps[i]=ep;else x.eps.push(ep)})}
 async function drop(aid,eid){if(aid==='_x'){const M=Object.assign({},meta());M.extra=(M.extra||[]).filter(x=>x.id!==eid);return N().put('blue','main',M,'gm')}return N().patch('arcs',aid,x=>{x.eps=(x.eps||[]).filter(y=>y.id!==eid)})}

 function bind(el){el.addEventListener('click',e=>{const g=e.target.closest('[data-go],.bp-dr');if(g&&el.contains(g)){e.stopPropagation();const [k,id]=g.dataset.go?g.dataset.go.split('|'):[g.dataset.dk,g.dataset.did];return goTo(k,id)}
   const dt=e.target.closest('[data-dt]');if(dt){dSet(dt.dataset.dt);return N().render()}
   const b=e.target.closest('[data-b]');if(!b||!el.contains(b))return;const k=b.dataset.b,id=b.dataset.id;
   if(k==='tmpl')return tmpl(+b.dataset.n||3);if(k==='arcnew')return arcNew();if(k==='meta')return metaEdit();if(k==='arc')return arcEdit(id);
   if(k==='mv')return mv(id,+b.dataset.d);if(k==='epnew'){e.stopPropagation();return epEdit(id,'',b.dataset.ph)}if(k==='ep')return epEdit(id,b.dataset.ep)});
  el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.bp-ep')){e.preventDefault();e.target.click()}});
  el.addEventListener('dragstart',e=>{const d=e.target.closest&&e.target.closest('.bp-dr');if(!d)return;e.dataTransfer.setData('text/plain',d.dataset.dk+'|'+d.dataset.did);e.dataTransfer.effectAllowed='copy';el.classList.add('bp-dragging')});
  el.addEventListener('dragend',()=>{el.classList.remove('bp-dragging');$$('.bp-over',el).forEach(x=>x.classList.remove('bp-over'))});
  const tgt=e=>{const ep=e.target.closest&&e.target.closest('[data-drop="ep"]');if(ep)return ep;return e.target.closest&&e.target.closest('[data-drop="arc"]')};
  el.addEventListener('dragover',e=>{const t=tgt(e);if(!t)return;e.preventDefault();e.dataTransfer.dropEffect='copy';$$('.bp-over',el).forEach(x=>{if(x!==t)x.classList.remove('bp-over')});t.classList.add('bp-over')});
  el.addEventListener('drop',e=>{const t=tgt(e);if(!t)return;e.preventDefault();t.classList.remove('bp-over');const [k,id]=String(e.dataTransfer.getData('text/plain')||'').split('|');if(!k||!id||!KN[k])return;
   if(t.dataset.drop==='ep')return dropOn({kind:'ep',aid:t.dataset.id,eid:t.dataset.ep},k,id);return dropOn({kind:'arc',aid:t.dataset.id},k,id)});
  el.addEventListener('change',e=>{const c=e.target.closest('[data-clue]');if(!c)return;const [aid,j]=c.dataset.clue.split('|');clue(aid,+j,c.checked)})}

 N().MOD.blue={render};
 window.NT_BLUE={arcs,meta,numbering};
})();
