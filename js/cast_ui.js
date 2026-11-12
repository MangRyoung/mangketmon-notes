/* ---------- 시나리오 「조직」 (11-13 망령 「세션 노트 시나리오 쪽에 그룹들을 시각적으로 정리하고 이미지를 넣어서 배치」) ----------
   NPC 를 세 명씩 한 그룹(조직)으로 묶어 사건마다 놓는다 — 사건 1 = 학교 · 사건 2 · 3 = 조직 둘씩 (망령 11-13 07:56 · 07:59).
   그림을 넣고 간단한 설정을 먼저 적어 보는 스케치 판. 학장 · 선생들은 따로(여기 넣지 않아도 된다).
   · kind 'grp' — 그룹 하나 = 문서 하나 (GM만)
     {order, arc(사건 arcs id | ''), name, color, line(한 줄), desc(간단 설정), place(커뮤 장소), note,
      mem:[{id, name, role(face | info | con | ''), img(그림 주소), line(한 줄), note(설정), ent(인물 항목 id)}]}
   · 판: 사건(도안의 큰 사건)마다 한 열 + 「사건 미정」 열. 그룹 카드 = 머리(이름 · 한 줄) + 인물 칸(최소 3) + 설정.
   · 그림: 인물 칸에 그림 파일을 끌어 놓거나, 옆 창의 그림 칸을 눌러 올린다(Supabase 저장소 · webp 로 줄임 · 투명 유지).
   · 끌어 옮기기: 그룹 머리 → 다른 사건 열 · 인물 → 다른 그룹(그 칸 앞에).
   · 고치기는 오른쪽 옆 창(도안과 같은 모양) — 칸을 고치면 바로 저장. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$$,esc}=window.NT;
 const PAL=['#e11d48','#1e88e5','#00a676','#8e44ad','#f08a00','#26c6da','#8d6e63','#d4a017'];
 const ROLE=[['face','얼굴','말을 걸어오는 쪽 — 그룹의 첫인상'],['info','정보통','단서 · 사정을 쥔 쪽'],['con','갈등','그룹 안에서 마찰을 만드는 쪽'],['','없음','']];
 const RL=Object.fromEntries(ROLE.map(r=>[r[0],r[1]]));
 const MIN=3;
 const clone=o=>JSON.parse(JSON.stringify(o==null?null:o));
 const cssu=u=>N().cssu?N().cssu(u):String(u).replace(/'/g,'%27');
 const arcs=()=>window.NT_BLUE?NT_BLUE.arcs():N().list('arcs').sort((a,b)=>(a.order||0)-(b.order||0));
 const grps=()=>N().list('grp').filter(Boolean).sort((a,b)=>(a.order||0)-(b.order||0));
 const arcCol=(a,i)=>(a&&a.color)||PAL[i%PAL.length];
 const grpCol=(g,i)=>g.color||PAL[(i||0)%PAL.length];
 const ent=id=>id?N().data('ents',id):null;
 const imgOf=m=>m.img||((ent(m.ent)||{}).face)||((ent(m.ent)||{}).photo)||'';
 const chars=()=>N().list('ents').filter(x=>x&&x.title&&String(x.type||'')==='인물').sort((a,b)=>String(a.title).localeCompare(String(b.title),'ko'));
 const newMem=o=>Object.assign({id:N().uid('m'),name:'',role:'',img:'',line:'',note:'',ent:''},o||{});

 /* ---- 저장 ---- */
 const gSave=(gid,fn)=>N().patch('grp',gid,x=>{x.mem=x.mem||[];return fn(x)});
 const mOf=(gid,mid)=>((N().data('grp',gid)||{}).mem||[]).find(m=>m.id===mid)||null;
 const mSave=(gid,mid,fn)=>gSave(gid,x=>{const m=x.mem.find(y=>y.id===mid);if(!m)return false;return fn(m)});
 async function grpNew(arc,o){const L=grps();const id=N().uid('g');const n=L.length;
  await N().put('grp',id,Object.assign({order:L.length?(L[L.length-1].order||0)+1:0,arc:arc||'',name:'새 그룹',color:PAL[n%PAL.length],line:'',desc:'',place:'',note:'',mem:[]},o||{}),'gm');return id}
 async function grpDel(gid){const g=N().data('grp',gid);if(!g)return;const n=(g.mem||[]).filter(m=>m.name||m.img).length;
  if(!await N().confirmBox(`그룹 「${g.name||'그룹'}」${n?`과 인물 ${n}명`:''}을 지울까요?`,'지우기'))return;if(P&&P.gid===gid)panelClose();const ok=await N().del('grp',gid);if(ok!==false){if(N().toastUndo)N().toastUndo('그룹을 지웠어요');else N().toast('그룹을 지웠어요')}}
 async function memDel(gid,mid){const g=N().data('grp',gid);const m=mOf(gid,mid);if(!g||!m)return;if((m.name||m.img||m.note)&&!await N().confirmBox(`「${m.name||'이 인물'}」을 그룹에서 지울까요?`,'지우기'))return;
  const idx=g.mem.findIndex(x=>x.id===mid);const keep=clone(m);if(P&&P.mid===mid)panelClose();await gSave(gid,x=>{x.mem=x.mem.filter(y=>y.id!==mid)});
  N().toast('인물을 지웠어요',{undo:()=>gSave(gid,x=>{x.mem.splice(Math.min(idx,x.mem.length),0,keep)})})}
 /* 인물 옮기기: to 그룹의 before 인물 앞에 (before 없으면 끝) */
 async function memMove(gid,mid,to,before){if(before===mid)return;const m=clone(mOf(gid,mid));if(!m||!N().data('grp',to))return;
  const ins=L=>{L=L.filter(x=>x.id!==mid);const i=before?L.findIndex(x=>x.id===before):-1;if(i>=0)L.splice(i,0,m);else L.push(m);return L};
  if(to!==gid)await gSave(gid,x=>{x.mem=x.mem.filter(y=>y.id!==mid)});await gSave(to,x=>{x.mem=ins(x.mem)});if(P&&P.mid===mid){P.gid=to;panelDraw()}}
 async function memStep(gid,mid,d){await gSave(gid,x=>{const i=x.mem.findIndex(y=>y.id===mid),j=i+d;if(i<0||j<0||j>=x.mem.length)return false;const t=x.mem[i];x.mem[i]=x.mem[j];x.mem[j]=t})}
 /* 그룹을 다른 사건 열로 (before 그룹 앞에) */
 async function grpPlace(gid,arc,before){const L=grps();const g=L.find(x=>x.id===gid);if(!g||before===gid)return;const col=L.filter(x=>(x.arc||'')===arc&&x.id!==gid);const i=before?col.findIndex(x=>x.id===before):-1;if(i>=0)col.splice(i,0,g);else col.push(g);
  const base=Math.max(0,...L.map(x=>x.order||0))+1;const rows=[];col.forEach((x,k)=>{const nx=Object.assign(clone(x),{order:base+k},x.id===gid?{arc}:{});rows.push({kind:'grp',id:x.id,data:nx,vis:'gm'})});
  if(N().putMany)await N().putMany(rows);else for(const r of rows)await N().put('grp',r.id,r.data,'gm')}
 /* 그림 올리기 */
 async function upImg(gid,mid,f){if(!f)return;let u;try{u=await N().upload(f,'thumb','grp')}catch(e){return N().toast('그림을 올리지 못했어요')}if(!u)return;
  if(mid)await mSave(gid,mid,m=>{m.img=u});else{const id=N().uid('m');await gSave(gid,x=>{x.mem.push(newMem({id,img:u}))});mid=id}
  if(P&&P.gid===gid&&(P.mid===mid||!P.mid))panelDraw();return mid}

 /* 11-13 망령 확정 구조(사건 1 학교 · 사건 2 · 3 조직 둘씩) + 감우 배치 안 — 이름 · 역할만, 설정은 비워 둔다 */
 const SEED=[[0,'학교','대서고 청소 의뢰부터 교내 생활까지',[['학생회장','face'],['사서','info'],['경비원·사감','con']]],
  [1,'시청·경관','공식 수사 쪽 — 사건 1 도시 폭주 사고의 뒷조사',[['순경','face'],['서기','info'],['경위','con']]],
  [1,'뒷골목','비공식 정보 쪽 — 공장 지대 뒷사정',[['뒷골목 청년','face'],['뒷골목 정보상','info'],['운하 뱃사공','con']]],
  [2,'대성당','마지막 사건의 큰 이야기',[['대성당 수녀','face'],['대성당 사제','info'],['대성당 교주','con']]],
  [2,'병원·구빈원','도시의 울적한 쪽 — 사람 냄새 나는 동기',[['구빈원 소녀','face'],['시립 병원 의사','info'],['구빈원 관리인','con']]]];
 async function seed(){const A=arcs();if(grps().length&&!await N().confirmBox('지금 그룹은 그대로 두고 뒤에 더할까요?','더하기'))return;
  const base=Math.max(-1,...grps().map(x=>x.order||0))+1;const rows=SEED.map(([ai,name,line,mm],k)=>{const a=A[ai];return {kind:'grp',id:N().uid('g'),vis:'gm',data:{order:base+k,arc:a?a.id:'',name,color:a?arcCol(a,ai):PAL[k%PAL.length],line,desc:'',place:'',note:'',mem:mm.map(([n,r])=>{const e=chars().find(x=>x.title===n);return newMem({name:n,role:r,ent:e?e.id:''})})}}});
  if(N().putMany)await N().putMany(rows);else for(const r of rows)await N().put('grp',r.id,r.data,'gm');
  N().toast(A.length>=3?'그룹 5개를 넣었어요 — 인물 칸에 그림을 끌어 놓아요':'그룹 5개를 넣었어요 (도안의 사건이 모자라 일부는 「사건 미정」에)')}

 /* ---- 판 ---- */
 function render(el){if(window.NT_BLUE&&NT_BLUE.close)NT_BLUE.close();const G=N().gm();
  if(!G){panelClose();el.innerHTML=`<div class="toolbar"><h2>조직</h2></div><div class="empty">조직 판은 GM만 봐요.</div>`;return}
  const A=arcs(),L=grps();const nm=L.reduce((s,g)=>s+(g.mem||[]).filter(m=>m.name||imgOf(m)).length,0);const ni=L.reduce((s,g)=>s+(g.mem||[]).filter(m=>imgOf(m)).length,0);
  const cols=[...A.map((a,i)=>({id:a.id,a,i})),{id:'',a:null,i:A.length}];const showNone=!A.length||L.some(g=>!A.some(a=>a.id===g.arc));const C=showNone?cols:cols.slice(0,-1);
  el.innerHTML=`<div class="toolbar"><h2>조직</h2><span class="note">그룹 ${L.length}개 · 인물 ${nm}명 · 그림 ${ni}장</span><span class="sp"></span>${L.length?`<button class="btn sm" data-c="gnew" data-arc="">＋ 그룹</button><button class="btn sm ghost" data-c="copy" title="조직 판 전체를 글(마크다운)로 복사">⧉ 글로 복사</button>`:''}</div>
   <div class="cg-tip small dim">NPC 를 세 명씩 한 그룹으로 — 그룹 하나가 커뮤 장소 하나 · 관계 칸 하나. 인물 칸에 <b>그림 파일을 끌어 놓거나</b> 칸을 눌러 이름 · 한 줄 · 설정을 적어요. 그룹 머리를 끌면 다른 사건으로, 인물을 끌면 다른 그룹으로 옮겨요.</div>
   ${L.length?`<div class="cg-wrap"><div class="cg-board" style="--n:${C.length}">${C.map(c=>colHtml(c,L)).join('')}</div></div>`:emptyHtml(A)}`;
  bind(el);panelSync()}
 function emptyHtml(A){return `<div class="empty cg-empty"><b>아직 그룹이 없어요.</b><p class="small">사건 1 = 학교 · 사건 2 · 3 = 조직 둘씩 (11-13 정한 틀).${A.length?'':'<br>도안에 큰 사건이 아직 없어 「사건 미정」 열에 놓여요.'}</p>
  <div class="row" style="justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn pri" data-c="seed" title="학교 · 시청·경관 · 뒷골목 · 대성당 · 병원·구빈원 — 이름과 역할만 넣고 설정은 비워 둬요">11-13 배치 안으로 5개 넣기</button><button class="btn ghost" data-c="gnew" data-arc="">빈 그룹 하나</button></div></div>`}
 function colHtml(c,L){const a=c.a;const col=a?arcCol(a,c.i):'#8a8a8a';const G=L.filter(g=>a?g.arc===a.id:!arcs().some(x=>x.id===g.arc));
  return `<section class="cg-col" style="--ac:${esc(col)}" data-col="${esc(c.id)}">
   <header class="cg-ch">${a?`<span class="cg-no">${String(c.i+1).padStart(2,'0')}</span><span class="cg-cm"><small>CASE ${c.i+1}</small><b>${esc(a.name||'(이름 없음)')}</b></span>`:`<span class="cg-cm"><small>UNSORTED</small><b>사건 미정</b></span>`}<span class="cg-cn">${G.length}개</span></header>
   ${G.map(g=>grpHtml(g,L.indexOf(g))).join('')}
   <button type="button" class="cg-add" data-c="gnew" data-arc="${esc(c.id)}">＋ 그룹</button></section>`}
 function grpHtml(g,i){const col=grpCol(g,i);const M=g.mem||[];const slots=M.map(m=>memHtml(g,m)).concat(Array.from({length:Math.max(0,MIN-M.length)},(_,k)=>emptySlot(g,k)));
  const sel=P&&P.gid===g.id&&!P.mid?'cg-sel':'';
  return `<article class="cg-grp ${sel}" style="--gc:${esc(col)}" data-g="${esc(g.id)}">
   <div class="cg-gh" draggable="true" data-c="grp" data-id="${esc(g.id)}" title="눌러서 그룹 고치기 · 끌어서 다른 사건으로">${M.length>=MIN?`<button type="button" class="cg-mplus" data-c="mnew" data-id="${esc(g.id)}" title="인물 더하기 (세 명보다 많이)">＋ 인물</button>`:''}<b>${esc(g.name||'(이름 없음)')}</b>${g.place?`<em>📍 ${esc(g.place)}</em>`:''}${g.line?`<p>${esc(g.line)}</p>`:''}</div>
   <div class="cg-ms">${slots.join('')}</div>
   ${g.desc?`<div class="cg-desc" data-c="grp" data-id="${esc(g.id)}">${esc(g.desc)}</div>`:`<div class="cg-desc none" data-c="grp" data-id="${esc(g.id)}">간단한 설정 — 눌러서 적어요</div>`}</article>`}
 function memHtml(g,m){const u=imgOf(m);const sel=P&&P.mid===m.id?'cg-sel':'';
  return `<div role="button" tabindex="0" class="cg-m ${u?'has':''} r-${m.role||'none'} ${sel}" draggable="true" data-c="mem" data-id="${esc(g.id)}" data-m="${esc(m.id)}" title="눌러서 고치기 · 그림 파일을 끌어 놓으면 그림 · 끌어서 다른 그룹으로">
   <div class="cg-pt" ${u?`style="--im:url('${esc(cssu(u))}')"`:''}>${u?'':'<span class="cg-ph">그림<br><small>끌어 놓기</small></span>'}${m.role?`<i class="cg-role">${esc(RL[m.role]||'')}</i>`:''}</div>
   <b class="cg-mn">${m.name?esc(m.name):'<span class="dim">(이름)</span>'}</b>${m.line?`<span class="cg-ml">${esc(m.line)}</span>`:''}</div>`}
 const emptySlot=(g,k)=>`<div role="button" tabindex="0" class="cg-m empty" data-c="mnew" data-id="${esc(g.id)}" data-slot="${k}" title="눌러서 인물 더하기 · 그림 파일을 끌어 놓아도 돼요"><div class="cg-pt"><span class="cg-ph">＋<br><small>인물</small></span></div><b class="cg-mn dim">빈 칸</b></div>`;

 /* 글로 복사 */
 function outline(){const A=arcs(),L=grps();const out=['# 조직 (NPC 그룹)'];const sec=(t,G)=>{if(!G.length)return;out.push('',`## ${t}`);G.forEach(g=>{out.push('',`### ${g.name||'(그룹)'}${g.place?` — 📍 ${g.place}`:''}`);if(g.line)out.push(g.line);if(g.desc)out.push('','설정: '+String(g.desc).replace(/\n/g,'\n  '));
  (g.mem||[]).forEach(m=>{out.push(`- ${m.name||'(이름)'}${m.role?` [${RL[m.role]}]`:''}${m.line?' — '+m.line:''}`);if(m.note)out.push('  '+String(m.note).replace(/\n/g,'\n  '))});if(g.note)out.push('','메모: '+g.note)})};
  A.forEach((a,i)=>sec(`사건 ${i+1}. ${a.name||''}`,L.filter(g=>g.arc===a.id)));sec('사건 미정',L.filter(g=>!A.some(a=>a.id===g.arc)));return out.join('\n')}
 async function copyOut(){const t=outline();try{await navigator.clipboard.writeText(t);N().toast('조직 판을 글로 복사했어요')}catch(e){N().openModal(`<div class="mhead"><h2>조직 (글)</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><textarea rows="18" style="width:100%" readonly>${esc(t)}</textarea>`)}}

 /* ---- 판 단추 · 끌기 ---- */
 let DRAG=null;   /* {t:'grp', gid} | {t:'mem', gid, mid} */
 function bind(el){
  el.addEventListener('click',async e=>{const b=e.target.closest('[data-c]');if(!b||!el.contains(b))return;const k=b.dataset.c,id=b.dataset.id;
   if(k==='seed')return seed();if(k==='copy')return copyOut();
   if(k==='gnew'){const gid=await grpNew(b.dataset.arc||'');return panelOpen({gid})}
   if(k==='grp')return panelOpen({gid:id});
   if(k==='mem')return panelOpen({gid:id,mid:b.dataset.m});
   if(k==='mnew'){e.stopPropagation();const mid=N().uid('m');await gSave(id,x=>{x.mem.push(newMem({id:mid}))});return panelOpen({gid:id,mid,focus:'name'})}});
  el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.cg-m')){e.preventDefault();e.target.click()}});
  el.addEventListener('dragstart',e=>{const m=e.target.closest&&e.target.closest('.cg-m[data-m]');if(m){DRAG={t:'mem',gid:m.dataset.id,mid:m.dataset.m};e.dataTransfer.setData('text/plain','mem|'+m.dataset.m);e.dataTransfer.effectAllowed='move';el.classList.add('cg-mdrag');return}
   const h=e.target.closest&&e.target.closest('.cg-gh');if(h){DRAG={t:'grp',gid:h.dataset.id};e.dataTransfer.setData('text/plain','grp|'+h.dataset.id);e.dataTransfer.effectAllowed='move';el.classList.add('cg-gdrag')}});
  el.addEventListener('dragend',()=>{DRAG=null;el.classList.remove('cg-mdrag','cg-gdrag');$$('.cg-over',el).forEach(x=>x.classList.remove('cg-over'))});
  const isFile=e=>!DRAG&&e.dataTransfer&&[...(e.dataTransfer.types||[])].includes('Files');
  const tgt=e=>{const c=s=>e.target.closest&&e.target.closest(s);if(isFile(e))return c('.cg-m');if(!DRAG)return null;if(DRAG.t==='mem')return c('.cg-m')||c('.cg-grp');return c('.cg-grp')||c('.cg-col')};
  el.addEventListener('dragover',e=>{const t=tgt(e);if(!t)return;e.preventDefault();e.dataTransfer.dropEffect=isFile(e)?'copy':'move';$$('.cg-over',el).forEach(x=>{if(x!==t)x.classList.remove('cg-over')});t.classList.add('cg-over')});
  el.addEventListener('dragleave',e=>{const t=e.target.closest&&e.target.closest('.cg-over');if(t&&!t.contains(e.relatedTarget))t.classList.remove('cg-over')});
  el.addEventListener('drop',async e=>{const t=tgt(e);if(!t)return;e.preventDefault();t.classList.remove('cg-over');
   if(isFile(e)){const f=[...e.dataTransfer.files].find(x=>/^image\//.test(x.type));if(!f)return N().toast('그림 파일만 넣을 수 있어요');const mid=await upImg(t.dataset.id,t.dataset.m||'',f);if(mid&&!t.dataset.m)N().toast('새 인물 칸에 그림을 넣었어요 — 눌러서 이름을 적어요');return}
   const D=DRAG;DRAG=null;if(!D)return;
   if(D.t==='mem'){if(t.classList.contains('cg-m')){if(t.dataset.m)return memMove(D.gid,D.mid,t.dataset.id,t.dataset.m);return memMove(D.gid,D.mid,t.dataset.id,'')}const g=t.dataset.g;if(g)return memMove(D.gid,D.mid,g,'');return}
   if(t.classList.contains('cg-grp')){const g=N().data('grp',t.dataset.g);if(g)return grpPlace(D.gid,g.arc&&arcs().some(a=>a.id===g.arc)?g.arc:'',t.dataset.g);return}
   if(t.classList.contains('cg-col'))return grpPlace(D.gid,t.dataset.col,'')})}

 /* ---- 옆 창 (도안과 같은 모양 · .bp-panel 을 같이 쓴다) ---- */
 let P=null;   /* {gid, mid('' = 그룹), focus} */
 const panelEl=()=>document.getElementById('cgPanel');
 function panelClose(){const el=panelEl();if(el){const f=el.querySelector(':focus');if(f&&f.blur)f.blur();el.classList.remove('on');setTimeout(()=>{if(!P&&el.parentNode)el.remove()},180)}const had=!!P;P=null;document.body.classList.remove('cg-panel-on');if(had)$$('.cg-sel').forEach(x=>x.classList.remove('cg-sel'))}
 function panelOpen(t){P=Object.assign({mid:'',focus:''},t);let el=panelEl();if(!el){el=document.createElement('aside');el.id='cgPanel';el.className='bp-panel cg-panel';document.body.appendChild(el);panelBind(el);requestAnimationFrame(()=>el.classList.add('on'))}else el.classList.add('on');
  document.body.classList.add('cg-panel-on');panelDraw();$$('.cg-sel').forEach(x=>x.classList.remove('cg-sel'));const q=P.mid?`.cg-m[data-m="${CSS.escape(P.mid)}"]`:`.cg-grp[data-g="${CSS.escape(P.gid)}"]`;$$(q).forEach(x=>x.classList.add('cg-sel'));el.scrollTop=0}
 function panelSync(){if(!P)return;if(!N().data('grp',P.gid)||(P.mid&&!mOf(P.gid,P.mid)))return panelClose();const el=panelEl();if(!el)return;const f=document.activeElement;if(f&&el.contains(f)&&/^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName))return;panelDraw()}
 const fld=(lab,inner,hint)=>`<div class="bp-f"><label>${lab}${hint?`<small>${hint}</small>`:''}</label>${inner}</div>`;
 const inp=(f,v,ph)=>`<input type="text" data-f="${f}" value="${esc(v||'')}" placeholder="${esc(ph||'')}">`;
 const txa=(f,v,rows,ph)=>`<textarea data-f="${f}" rows="${rows||3}" placeholder="${esc(ph||'')}">${esc(v||'')}</textarea>`;
 function panelDraw(){const el=panelEl();if(!el||!P)return;const g=N().data('grp',P.gid);if(!g)return panelClose();const L=grps();const gi=L.findIndex(x=>x.id===g.id);const col=grpCol(g,gi);const keep=el.scrollTop;let body='',foot='',kick='';const A=arcs();
  if(!P.mid){kick=`<b>GROUP</b><span>그룹 · 조직</span>`;
   body=`<input type="text" class="bp-title" data-f="name" value="${esc(g.name||'')}" placeholder="그룹 이름 — 예: 대성당">`
    +fld('사건',`<select data-f="arc"><option value="">사건 미정</option>${A.map((a,i)=>`<option value="${esc(a.id)}" ${g.arc===a.id?'selected':''}>사건 ${i+1} · ${esc(a.name||'')}</option>`).join('')}</select>`,'도안의 큰 사건')
    +fld('색',`<div class="bp-sw" data-seg="color">${PAL.map(c=>`<button type="button" data-v="${c}" class="${(g.color||'')===c?'on':''}" style="--c:${c}" title="${c}"></button>`).join('')}</div>`)
    +fld('한 줄',inp('line',g.line,'이 그룹이 이야기에서 맡는 것'))
    +fld('커뮤 장소',inp('place',g.place,'PL 이 이 그룹을 만나러 가는 곳 — 예: 대성당 회랑'))
    +fld('간단한 설정','','분위기 · 목적 · 세 사람의 관계')+txa('desc',g.desc,6,'예: 겉으로는 자선 · 안에서는 교리 싸움. 수녀는 교주를 존경하지만 사제는 …')
    +`<div class="bp-f"><label>인물<small>${(g.mem||[]).length}명 · 눌러서 고치기</small><button type="button" class="bp-plus" data-p="mnew">＋ 인물</button></label><div class="cg-pml">${(g.mem||[]).map((m,j)=>{const u=imgOf(m);return `<div class="cg-pmr"><i class="cg-pav" ${u?`style="background-image:url('${esc(cssu(u))}')"`:''}></i><button type="button" class="linkbtn" data-p="mopen" data-m="${esc(m.id)}">${m.name?esc(m.name):'(이름)'}</button>${m.role?`<small class="cg-prl r-${m.role}">${RL[m.role]}</small>`:''}<span class="sp"></span><button type="button" class="bp-pclose" data-p="mup" data-m="${esc(m.id)}" ${j?'':'disabled'} title="앞으로">▲</button><button type="button" class="bp-pclose" data-p="mdn" data-m="${esc(m.id)}" ${j<g.mem.length-1?'':'disabled'} title="뒤로">▼</button></div>`}).join('')||'<span class="bp-nil">없음</span>'}</div></div>`
    +fld('메모','')+txa('note',g.note,3,'');
   foot=`<span class="sp"></span><button type="button" class="btn sm ghost danger" data-p="gdel">🗑 그룹 지우기</button>`}
  else{const m=mOf(P.gid,P.mid);if(!m)return panelClose();const u=imgOf(m);const own=!!m.img;const j=g.mem.findIndex(x=>x.id===m.id);
   kick=`<b>${esc(g.name||'그룹')}</b><span>인물 ${j+1} / ${g.mem.length}</span>`;
   body=`<div class="cg-pimg ${u?'has':''}" data-p="img" title="눌러서 그림 고르기 · 그림 파일을 끌어 놓거나 붙여 넣기(Ctrl+V)" tabindex="0">${u?`<img src="${esc(u)}" alt="">`:'<span>그림 넣기<br><small>눌러서 고르기 · 끌어 놓기 · 붙여 넣기</small></span>'}<input type="file" accept="image/*" hidden data-nosave></div>
     ${u&&!own?'<div class="small dim">이은 인물 항목의 얼굴 그림을 보여 주는 중이에요.</div>':''}
     ${fld('그림 주소',`<div class="cg-urow"><input type="text" data-f="img" value="${esc(m.img||'')}" placeholder="https://… (올리면 저절로 채워져요)">${own?'<button type="button" class="btn xs ghost" data-p="imgx" title="그림 빼기">빼기</button>':''}</div>`)}`
    +`<input type="text" class="bp-title" data-f="name" value="${esc(m.name||'')}" placeholder="이름 — 예: 대성당 수녀">`
    +fld('역할',`<div class="bp-seg" data-seg="role">${ROLE.map(([k,l,t])=>`<button type="button" data-v="${k}" class="${(m.role||'')===k?'on':''}" title="${esc(t)}">${l}</button>`).join('')}</div>`,(ROLE.find(r=>r[0]===(m.role||''))||[])[2]||'')
    +fld('한 줄',inp('line',m.line,'첫인상 · 말버릇 — 예: 늘 웃지만 눈은 안 웃는다'))
    +fld('설정','','외모 · 성격 · 원하는 것 · 그룹 안의 자리')+txa('note',m.note,8,'')
    +fld('인물 항목 잇기',`<div class="cg-urow"><select data-f="ent"><option value="">잇지 않음</option>${chars().map(x=>`<option value="${esc(x.id)}" ${m.ent===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select>${m.ent&&ent(m.ent)?`<button type="button" class="btn xs ghost" data-p="entgo" title="항목 열기">📇 열기</button>`:''}</div>`,'자료 탭의 「인물」 항목 — 자세한 시트는 거기서')
    +fld('그룹 옮기기',`<select data-p="mto">${L.map(x=>`<option value="${esc(x.id)}" ${x.id===g.id?'selected':''}>${esc(x.name||'(그룹)')}</option>`).join('')}</select>`);
   foot=`<button type="button" class="btn sm ghost" data-p="mprev" title="앞 인물">‹</button><button type="button" class="btn sm ghost" data-p="mnext" title="다음 인물">›</button><button type="button" class="btn sm ghost" data-p="ggo" title="그룹 고치기">그룹</button><span class="sp"></span><button type="button" class="btn sm ghost danger" data-p="mdel">🗑 인물 지우기</button>`}
  el.style.setProperty('--ac',col);
  el.innerHTML=`<div class="bp-ph"><div class="bp-pk">${kick}</div><span class="sp"></span><small class="bp-saved" id="cgSaved"></small><button type="button" class="bp-pclose" data-p="close" title="닫기 (Esc)">✕</button></div><div class="bp-pb">${body}</div>${foot?`<div class="bp-pf">${foot}</div>`:''}`;
  el.scrollTop=keep;if(P.focus){const q=el.querySelector(`[data-f="${P.focus}"]`);P.focus='';if(q)q.focus()}}
 let savedT=null;const saved=()=>{const s=document.getElementById('cgSaved');if(!s)return;s.textContent='저장됨';s.classList.add('on');clearTimeout(savedT);savedT=setTimeout(()=>s.classList.remove('on'),1200)};
 async function setF(f,v){if(!P)return;const r=P.mid?await mSave(P.gid,P.mid,m=>{m[f]=v}):await gSave(P.gid,g=>{g[f]=v});if(r!==false)saved()}
 async function pickFile(f){if(!P||!f)return;const gid=P.gid,mid=P.mid;await upImg(gid,mid,f);saved()}
 function panelBind(el){
  el.addEventListener('change',async e=>{const t=e.target;if(!P)return;
   if(t.type==='file'){const f=t.files&&t.files[0];t.value='';return pickFile(f)}
   if(t.dataset.p==='mto'){if(t.value!==P.gid)await memMove(P.gid,P.mid,t.value,'');saved();return}
   if(t.dataset.f){const v=t.tagName==='TEXTAREA'?t.value:t.value.trim();await setF(t.dataset.f,v);if(t.dataset.f==='ent'||t.dataset.f==='img')panelDraw()}});
  el.addEventListener('keydown',e=>{const t=e.target;if(e.key==='Escape')return panelClose();if(e.key==='Enter'&&!e.isComposing&&t.tagName==='INPUT'&&t.dataset.f)t.blur();if((e.key==='Enter'||e.key===' ')&&t.matches&&t.matches('.cg-pimg')){e.preventDefault();const fi=t.querySelector('input[type=file]');if(fi)fi.click()}});
  el.addEventListener('paste',e=>{if(!P||!P.mid)return;const fs=[...((e.clipboardData||{}).files||[])].filter(f=>/^image\//.test(f.type));if(!fs.length)return;e.preventDefault();pickFile(fs[0])});
  el.addEventListener('dragover',e=>{const z=e.target.closest&&e.target.closest('.cg-pimg');if(!z)return;e.preventDefault();z.classList.add('over')});
  el.addEventListener('dragleave',e=>{const z=e.target.closest&&e.target.closest('.cg-pimg');if(z&&!z.contains(e.relatedTarget))z.classList.remove('over')});
  el.addEventListener('drop',e=>{const z=e.target.closest&&e.target.closest('.cg-pimg');if(!z)return;e.preventDefault();z.classList.remove('over');const f=[...(e.dataTransfer.files||[])].find(x=>/^image\//.test(x.type));if(f)pickFile(f)});
  el.addEventListener('click',async e=>{if(!P)return;const t=e.target;
   const sw=t.closest('[data-seg] [data-v]');if(sw){await setF(sw.parentElement.dataset.seg,sw.dataset.v);return panelDraw()}
   const b=t.closest('[data-p]');if(!b||b.tagName==='SELECT')return;const k=b.dataset.p;
   if(k==='close')return panelClose();
   if(k==='img'){if(t.closest('input'))return;const fi=b.querySelector('input[type=file]');if(fi)fi.click();return}
   if(k==='imgx'){await setF('img','');return panelDraw()}
   if(k==='mnew'){const mid=N().uid('m');await gSave(P.gid,x=>{x.mem.push(newMem({id:mid}))});return panelOpen({gid:P.gid,mid,focus:'name'})}
   if(k==='mopen')return panelOpen({gid:P.gid,mid:b.dataset.m});
   if(k==='mup'||k==='mdn'){await memStep(P.gid,b.dataset.m,k==='mup'?-1:1);return panelDraw()}
   if(k==='gdel')return grpDel(P.gid);
   if(k==='mdel')return memDel(P.gid,P.mid);
   if(k==='ggo')return panelOpen({gid:P.gid});
   if(k==='entgo'){const m=mOf(P.gid,P.mid);if(m&&m.ent&&window.NT_FAV){panelClose();NT_FAV.go({kind:'ents',id:m.ent})}return}
   if(k==='mprev'||k==='mnext'){const g=N().data('grp',P.gid);const i=g.mem.findIndex(x=>x.id===P.mid);const nx=g.mem[i+(k==='mprev'?-1:1)];if(!nx)return N().toast(k==='mprev'?'첫 인물이에요':'마지막 인물이에요');return panelOpen({gid:P.gid,mid:nx.id})}})}

 N().MOD.cast={render};
 window.NT_CAST={grps,outline,open:panelOpen,close:panelClose};
})();
