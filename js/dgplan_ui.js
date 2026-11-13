/* ---------- 시나리오 「던전」 (11-13 망령 「세션 노트 시나리오에 시트/던전 기능 연계해서 데이터 넣고 짜둔 던전 보고 관리 · 던전 스케일링도 우리 논의한 대로 맞춰 두되 수정하기 편하게」) ----------
   도안의 큰 사건마다 한 열: ① 스케일링 목표(고치기 쉬운 표) ② 이어 둔 던전(미니맵 · 배틀 방 · 몹 수 · 목표와 비교 · 열기) ③ 하이라이트 보스 시트(NPC 시트 · 목표 통솔점).
   · 스케일링 = 도안 캠페인 설정(blue main)의 scale[사건 id] — 비우면 사건 차례의 기본값(11-11 노트 65 · 66 확정 스펙):
     사건 1 2+2+4 · 보스 A · 몹 7체 통솔점 합 8 · 계제 포텐셜 사전 0 · 졸개 1 · 보스 2 · 미궁 1 · 야생 1 · 레이드 2 · 야생 Lv −5 · 하이라이트 통솔 8
     사건 2 4+4 · 9 · 0/1/2 · 미궁 1 · 야생 2 · 레이드 3 · Lv +0 · 하이라이트 10
     사건 3 2+6 · 10 · 1/2/3 · 미궁 2 · 야생 3 · 레이드 3 · Lv +0 · 하이라이트 12 + 제7체
   · 던전 = 노트 문서 kind 'dgs'(지도 장소의 던전, dungeon.js). 사건에 잇기: arc.dg(대표) + arc.dgx[](더). 열기 = 던전 편집기(웹툴로 보내기도 거기서).
   · 「미사그 생성 던전 넣기」: 시뮬레이터 sim/data/dungeons/ld1~ld5(11-11 생성)를 노트 던전으로 가져와 장소에 붙이고, 지금 줄기대로 잇는다
     (사건 1 = 서고 · 사건 2 = 공장 + 수로 · 묘지 · 요양원은 사건 3 후보로 둠). 이미 같은 던전이 있으면 건너뜀.
   · 하이라이트 시트 = arc.boss(NPC 시트 id). 주역 이름 글(bossTxt)마다 「빈 NPC 시트 만들기」. */
"use strict";
(()=>{
 const N=()=>window.NT;const {esc}=window.NT;
 const PAL=['#e11d48','#1e88e5','#00a676','#8e44ad','#f08a00','#26c6da','#8d6e63','#d4a017'];
 const arcs=()=>window.NT_BLUE?NT_BLUE.arcs():N().list('arcs').sort((a,b)=>(a.order||0)-(b.order||0));
 const meta=()=>N().data('blue','main')||{};
 const clone=o=>JSON.parse(JSON.stringify(o==null?null:o));
 const DEF=[
  {lay:'2+2+4',boss:'A',lead:8,pPre:0,pMin:1,pBoss:2,maze:1,wild:1,raid:2,lv:-5,hl:8,h7:0},
  {lay:'4+4',boss:'A',lead:9,pPre:0,pMin:1,pBoss:2,maze:1,wild:2,raid:3,lv:0,hl:10,h7:0},
  {lay:'2+6',boss:'A',lead:10,pPre:1,pMin:2,pBoss:3,maze:2,wild:3,raid:3,lv:0,hl:12,h7:1}];
 const F=[['lay','본길 구성','배틀마다 몹 수 — 마지막이 보스방(보스 + 졸개)','text'],['boss','보스 등급','','text'],['lead','몹 7체 통솔점 합','보스 뺀 나머지','num'],
  ['pPre','계제 포텐셜 · 사전 몹','','num'],['pMin','계제 포텐셜 · 보스방 졸개','','num'],['pBoss','계제 포텐셜 · 보스','','num'],
  ['maze','미궁 포텐셜','','num'],['wild','야생 포텐셜','','num'],['raid','레이드 배틀 : n','보스','num'],['lv','야생 레벨 보정','졸개 (보스는 따로)','num'],
  ['hl','하이라이트 통솔점','PC 3명 × 각성체 2체 = 6체 상대','num'],['h7','제7체','통솔점 밖 7번째','chk']];
 const scaleOf=(a,i)=>Object.assign({},DEF[Math.min(i,DEF.length-1)]||DEF[0],((meta().scale||{})[a.id])||{});
 const isDef=(a,i,k)=>!(((meta().scale||{})[a.id]||{}).hasOwnProperty(k));
 async function setScale(aid,k,v){const M=clone(meta())||{};M.scale=M.scale||{};M.scale[aid]=M.scale[aid]||{};if(v===null)delete M.scale[aid][k];else M.scale[aid][k]=v;if(!Object.keys(M.scale[aid]).length)delete M.scale[aid];return N().put('blue','main',M,'gm')}
 async function resetScale(aid){const M=clone(meta())||{};if(M.scale)delete M.scale[aid];return N().put('blue','main',M,'gm')}
 const layN=s=>String(s||'').split(/[+＋,\s]+/).map(x=>parseInt(x,10)).filter(x=>x>0);

 /* ---- 던전 읽기: 배틀 방 · 몹 수 (시뮬레이터에서 온 방은 메모 「⚔ 야생 N체 / ♛ 보스방 N체」, 웹툴에서 온 방은 e 배열) ---- */
 function battles(d){const out=[];for(const [id,r] of Object.entries(d.r||{})){if(r.t!=='battle'&&r.t!=='boss')continue;let n=0;if(Array.isArray(r.e))n=r.e.length;else if(r.e&&typeof r.e==='object')n=Object.keys(r.e).length;
   if(!n){const m=String(r.m||'').match(/(?:⚔ 야생|♛ 보스방)\s*(\d+)\s*체/);if(m)n=+m[1]}out.push({id,n:r.n||'',boss:r.t==='boss'||/♛/.test(r.m||''),cnt:n})}return out}
 const dgName=id=>(N().data('dgs',id)||{}).n||'';
 const spotName=id=>{const s=N().data('spots',id);return s?(s.num?s.num+'. ':'')+(s.name||''):''};
 const linked=a=>[a.dg,...(a.dgx||[])].filter((x,i,L)=>x&&L.indexOf(x)===i&&N().data('dgs',x));
 async function linkDg(aid,id){await N().patch('arcs',aid,x=>{if(!x.dg){x.dg=id;return}x.dgx=x.dgx||[];if(x.dg===id||x.dgx.includes(id))return false;x.dgx.push(id)})}
 async function unlinkDg(aid,id){await N().patch('arcs',aid,x=>{if(x.dg===id){x.dg=(x.dgx||[]).shift()||''}else x.dgx=(x.dgx||[]).filter(y=>y!==id)})}

 /* ---- 미사그 생성 던전 넣기 ---- */
 const LD=[['ld1_archive',/기록|서고/,0],['ld4_factory',/공장/,1],['ld3_sewer',/수로/,1],['ld2_cemetery',/묘지/,-1],['ld5_sanatorium',/요양원/,-1]];
 const omBase=()=>{const u=(window.NT_CONFIG||{}).oremasUrl||'https://mangryoung.github.io/oremas/';return u.endsWith('/')?u:u+'/'};
 async function seedLd(){if(!window.NT_DG||!NT_DG.fromSim)return N().toast('던전 모듈을 불러오지 못했어요');const A=arcs();
  if(!await N().confirmBox('11-11 에 만든 미사그 시험 던전 5개(서고 · 공장 · 수로 · 묘지 · 요양원)를 노트 던전으로 가져올까요?\n장소에 붙이고, 사건 1 = 서고 · 사건 2 = 공장 + 수로로 잇고, 묘지 · 요양원은 사건 3 후보로 둬요. (모두 GM만 · 몹은 시험용)','가져오기'))return;
  let n=0,skip=0;for(const [file,re,ai] of LD){const have=N().list('dgs').find(d=>d.src&&d.src.file===file+'.json');let id=have&&have.id;
   if(!id){let j;try{j=await (await fetch(omBase()+'sim/data/dungeons/'+file+'.json?t='+Date.now())).json()}catch(e){N().toast(file+' 을 읽지 못했어요');continue}
    const d=NT_DG.fromSim(j);d.src=Object.assign(d.src||{},{file:file+'.json'});const sp=N().list('spots').find(s=>re.test(s.name||''));id=N().uid('d');await N().put('dgs',id,Object.assign({spot:sp?sp.id:''},d),'gm');n++}else skip++;
   if(ai>=0&&A[ai])await linkDg(A[ai].id,id)}
  N().toast(`던전 ${n}개를 가져왔어요${skip?` · 이미 있던 ${skip}개는 잇기만`:''}`)}

 /* ---- 하이라이트 시트 ---- */
 const txtNames=s=>(Array.isArray(s)?s.join(','):String(s||'')).split(/[,·\n]/).map(x=>x.trim()).filter(Boolean);
 function sheetInfo(id){const d=N().data('npc',id);if(!d)return null;const t=window.NT_MAKER&&NT_MAKER.trainer&&NT_MAKER.trainer(id);const mons=t&&window.NT_MAKER.mons?(NT_MAKER.mons(id)||[]):[];return {id,name:d.name||(t&&t.name)||'(시트)',img:(t&&t.image)||d.image||'',n:mons.length,mk:!!t}}
 async function newSheet(aid,name){const nid=N().uid('n');await N().put('npc',nid,{name,image:'',player:'',sub:'하이라이트',order:N().list('npc').length,log:[]},'gm');await N().patch('arcs',aid,x=>{x.boss=[...new Set([...(x.boss||[]),nid])]});N().toast(`빈 NPC 시트 「${name}」 를 만들었어요 (GM만) — 시트 탭에서 채우거나 「⇪ 제작기로」`)}

 /* ---- 판 ---- */
 function render(el){const G=N().gm();if(!G){el.innerHTML=`<div class="toolbar"><h2>던전</h2></div><div class="empty">던전 계획은 GM만 봐요.</div>`;return}
  const A=arcs();const D=N().list('dgs');const used=new Set(A.flatMap(linked));const free=D.filter(d=>!used.has(d.id));
  el.innerHTML=`<div class="toolbar"><h2>던전</h2><span class="note">사건 ${A.length}개 · 노트 던전 ${D.length}개</span><span class="sp"></span>${!D.some(d=>d.src&&/^ld\d/.test(d.src.file||''))?`<button class="btn sm" data-g="seed" title="시뮬레이터 sim/data/dungeons/ld1~ld5 (11-11 생성)">⛩ 미사그 생성 던전 넣기</button>`:''}<button class="btn sm ghost" data-g="map" title="지도에서 장소를 눌러 던전 붙이기">지도에서 붙이기</button></div>
   <div class="cg-tip small dim">사건마다 <b>스케일링 목표</b>(칸을 고치면 바로 저장 · 「기본」은 11-11 확정 스펙) · <b>이어 둔 던전</b>(배틀 방 몹 수를 목표와 비교 · 눌러서 편집기) · <b>하이라이트 시트</b>. 몹 · 보스 데이터는 던전 편집기나 웹툴 방에서 고쳐요.</div>
   ${A.length?`<div class="cg-wrap"><div class="dp-board" style="--n:${A.length}">${A.map((a,i)=>colHtml(a,i,free)).join('')}</div></div>`:'<div class="empty">도안에 큰 사건이 없어요 — 도안에서 먼저 틀을 만들어요.</div>'}
   ${free.length?`<div class="dp-free"><b>사건에 안 이은 던전</b> ${free.map(d=>`<span class="dp-fd" data-g="open" data-id="${esc(d.id)}" title="${esc(spotName(d.spot))}">⛩ ${esc(d.n||'(던전)')}</span>`).join('')}</div>`:''}`;
  bind(el)}
 function colHtml(a,i,free){const col=a.color||PAL[i%PAL.length];const S=scaleOf(a,i);const L=layN(S.lay);const sum=L.reduce((s,x)=>s+x,0);
  const dgs=linked(a);const bossIds=(a.boss||[]).filter(id=>N().data('npc',id));const named=txtNames(a.bossTxt);
  return `<section class="dp-col" style="--ac:${esc(col)}">
   <header class="cg-ch"><span class="cg-no">${String(i+1).padStart(2,'0')}</span><span class="cg-cm"><small>CASE ${i+1}</small><b>${esc(a.name||'')}</b></span></header>
   <div class="dp-sec"><div class="dp-h"><b>스케일링 목표</b><small>${sum?`본길 ${L.join(' + ')} = ${sum}체`:''}</small><button type="button" class="btn xs ghost" data-g="reset" data-id="${esc(a.id)}" title="이 사건을 기본값(11-11 스펙)으로">기본값</button></div>
    <div class="dp-grid">${F.map(([k,lab,hint,ty])=>{const v=S[k];const d=isDef(a,i,k);return `<label class="dp-f ${d?'':'chg'}" title="${esc(hint||'')}${d?' · 기본값':' · 고친 값'}"><span>${lab}</span>${ty==='chk'?`<input type="checkbox" data-sc="${esc(a.id)}|${k}" ${v?'checked':''}>`:`<input type="${ty==='num'?'number':'text'}" data-sc="${esc(a.id)}|${k}" value="${esc(v)}" ${ty==='num'?'step="1"':''}>`}</label>`}).join('')}</div></div>
   <div class="dp-sec"><div class="dp-h"><b>⛩ 던전</b><small>${dgs.length}개</small>${free.length?`<select data-g="link" data-id="${esc(a.id)}"><option value="">＋ 던전 잇기</option>${free.map(d=>`<option value="${esc(d.id)}">${esc(d.n||'(던전)')}</option>`).join('')}</select>`:''}</div>
    ${dgs.map(id=>dgCard(a,id,S,L)).join('')||'<div class="dp-none">이은 던전이 없어요</div>'}</div>
   <div class="dp-sec"><div class="dp-h"><b>⚔ 하이라이트</b><small>목표 통솔점 ${S.hl}${S.h7?' + 제7체':''}</small></div>
    ${bossIds.map(id=>{const s=sheetInfo(id);return `<div class="dp-sh" data-g="sheet" data-id="${esc(id)}" title="NPC 시트 열기"><i style="${s.img?`background-image:url('${esc(N().cssu?N().cssu(s.img):s.img)}')`:''}"></i><b>${esc(s.name)}</b><small>${s.mk?`제작기 시트 · 포켓몬 ${s.n}체`:'노트 시트 (제작기 없음)'}</small><button type="button" class="bp-x" data-g="unboss" data-id="${esc(a.id)}" data-n="${esc(id)}" title="하이라이트에서 빼기">×</button></div>`}).join('')}
    ${named.filter(n=>!bossIds.some(id=>((N().data('npc',id)||{}).name||'').replace(/\s*\(.*\)$/,'')===n.replace(/\s*\(.*\)$/,''))).map(n=>`<div class="dp-sh none"><b>${esc(n)}</b><small>시트 없음</small><button type="button" class="btn xs" data-g="newsheet" data-id="${esc(a.id)}" data-n="${esc(n.replace(/\s*\(.*\)$/,''))}">＋ 빈 NPC 시트</button></div>`).join('')}
    <select data-g="addboss" data-id="${esc(a.id)}"><option value="">＋ NPC 시트 잇기</option>${N().list('npc').filter(x=>!(a.boss||[]).includes(x.id)).map(x=>`<option value="${esc(x.id)}">${esc(x.name||'(시트)')}</option>`).join('')}</select></div>
  </section>`}
 function dgCard(a,id,S,L){const d=N().data('dgs',id);const B=battles(d);const bossR=B.filter(b=>b.boss),pre=B.filter(b=>!b.boss);const tot=B.reduce((s,b)=>s+b.cnt,0);const want=L.reduce((s,x)=>s+x,0);const wantBoss=L.length?L[L.length-1]:0;
  const okBoss=!bossR.length||!wantBoss||bossR[0].cnt===wantBoss;const preSeq=pre.map(b=>b.cnt).join(' + ');
  return `<div class="dp-dg"><div class="dp-mini" data-g="open" data-id="${esc(id)}" title="던전 편집기 열기">${window.NT_DG&&NT_DG.mini?NT_DG.mini(d):''}</div>
   <div class="dp-dgb"><b data-g="open" data-id="${esc(id)}">${esc(d.n||'(던전)')}</b><small>${esc(spotName(d.spot))}${d.src&&d.src.file?' · '+esc(d.src.file):''}</small>
    <div class="dp-bt">${B.length?`배틀 방 ${B.length} · 사전 ${preSeq||'—'} · 보스방 ${bossR.map(b=>b.cnt).join('/')||'—'} · 합 ${tot}체`:'배틀 방이 없어요'}</div>
    <div class="dp-chk"><span class="${okBoss?'ok':'warn'}">보스방 ${bossR[0]?bossR[0].cnt:'?'} / 목표 ${wantBoss||'?'}</span><span class="${tot>=want?'ok':'warn'}" title="갈림길 방까지 센 합이라 본길보다 많을 수 있어요">몹 합 ${tot} / 본길 목표 ${want}</span></div>
    <div class="dp-acts"><button type="button" class="btn xs" data-g="open" data-id="${esc(id)}">열기 · 고치기</button>${N().data('dgs',id)&&linked(a).includes(id)?`<button type="button" class="btn xs ghost" data-g="unlink" data-id="${esc(a.id)}" data-d="${esc(id)}">사건에서 빼기</button>`:''}</div></div></div>`}
 function bind(el){
  el.addEventListener('change',async e=>{const t=e.target;
   if(t.dataset.sc){const [aid,k]=t.dataset.sc.split('|');const f=F.find(x=>x[0]===k);let v=f[3]==='chk'?(t.checked?1:0):f[3]==='num'?(t.value===''?null:+t.value):t.value.trim();
    const i=arcs().findIndex(x=>x.id===aid);const def=(DEF[Math.min(i,DEF.length-1)]||{})[k];if(v===def)v=null;await setScale(aid,k,v);N().toast('저장했어요');return}
   const g=t.dataset.g;if(g==='link'&&t.value){await linkDg(t.dataset.id,t.value);return}if(g==='addboss'&&t.value){await N().patch('arcs',t.dataset.id,x=>{x.boss=[...new Set([...(x.boss||[]),t.value])]});return}});
  el.addEventListener('click',async e=>{const b=e.target.closest('[data-g]');if(!b||b.tagName==='SELECT'||b.tagName==='INPUT')return;const g=b.dataset.g,id=b.dataset.id;
   if(g==='seed')return seedLd();if(g==='map')return N().go('map');
   if(g==='reset'){if(await N().confirmBox('이 사건의 스케일링을 기본값(11-11 스펙)으로 되돌릴까요?','되돌리기'))await resetScale(id);return}
   if(g==='open'){if(window.NT_DG)NT_DG.openEd(id);return}
   if(g==='unlink'){e.stopPropagation();return unlinkDg(id,b.dataset.d)}
   if(g==='sheet'){if(e.target.closest('.bp-x'))return;if(window.NT_FAV)NT_FAV.go({kind:'npc',id});return}
   if(g==='unboss'){e.stopPropagation();return N().patch('arcs',id,x=>{x.boss=(x.boss||[]).filter(y=>y!==b.dataset.n)})}
   if(g==='newsheet')return newSheet(id,b.dataset.n)})}

 N().MOD.dgp={render};
 window.NT_DGP={scaleOf,DEF,battles};
})();
