/* ---------- 제작기 문서 읽기 (같은 Supabase 의 docs 표: trainers · pokemon) ----------
   PC 시트는 여기서 트레이너 · 포켓몬을 읽어 보여 주고(읽기 전용), RP 칸만 노트에 쓴다. 비공개(priv) 트레이너는 GM 에게만. */
"use strict";
window.NT_MAKER=(()=>{
 const N=()=>window.NT;
 const M={trainers:[],pokemon:[],folders:[],at:0,loading:null};
 const unwrap=doc=>{const d=(doc.data&&doc.data.data)||doc.data||{};return Object.assign({id:doc.id,_ord:doc.data&&doc.data.ord!=null?+doc.data.ord:null},d)};
 /* 10-29 망령 「변동 사항만」: 받은 제작기 문서를 이 브라우저에 두고, 다음에는 그 뒤에 바뀐 것(updated_at)만 받는다. 지워진 건 id 목록으로 걸러 낸다 */
 const MKC='nt_mk_cache',KS=['trainers','pokemon','folders','pcond'];   /* pcond (11-06): 웹툴 결과 정리가 남긴 포켓몬의 지금 HP · 상태 */
 async function pull(){const DB=N().DBS();if(!DB.makerSince||!DB.makerIds){const [t,p,f,c]=await Promise.all([DB.makerDocs('trainers'),DB.makerDocs('pokemon'),DB.makerDocs('folders').catch(()=>[]),DB.makerDocs('pcond').catch(()=>[])]);return {trainers:t,pokemon:p,folders:f,pcond:c}}
  let c=null;try{c=JSON.parse(localStorage.getItem(MKC)||'null')}catch(e){}if(!c||c.v!==1||Date.now()-c.t>7*864e5)c={v:1,t:Date.now(),since:{},docs:{}};
  /* 11-02 망령 「제작기엔 있는데 노트엔 없다」: 같은 때 저장된 문서는 수정 시각 순서와 들어온 순서가 어긋날 수 있다 → 1분 앞부터 받고,
     id 목록에 있는데 사본에 없는 문서가 있으면 그 종류는 전부 다시 받는다 */
  const back=t=>{const ms=Date.parse(t||'');return ms?new Date(ms-60000).toISOString():null};
  let got=0;await Promise.all(KS.map(async k=>{let D=c.docs[k]=c.docs[k]||{};const had=Object.keys(D).length;const [ids,rows]=await Promise.all([had?DB.makerIds(k):null,DB.makerSince(k,had?back(c.since[k]):null)]);
   for(const r of rows){D[r.id]={id:r.id,data:r.data};if(!c.since[k]||r.updated_at>c.since[k])c.since[k]=r.updated_at}got+=rows.length;
   if(ids){const have=new Set(ids.concat(rows.map(r=>r.id)));for(const id of Object.keys(D))if(!have.has(id))delete D[id];
    if(ids.some(id=>!D[id])){const all=await DB.makerSince(k,null);D=c.docs[k]={};c.since[k]=null;for(const r of all){D[r.id]={id:r.id,data:r.data};if(!c.since[k]||r.updated_at>c.since[k])c.since[k]=r.updated_at}got+=all.length}}}));
  M.got=got;try{const s=JSON.stringify(c);if(s.length<4e6)localStorage.setItem(MKC,s);else localStorage.removeItem(MKC)}catch(e){try{localStorage.removeItem(MKC)}catch(e2){}}
  return Object.fromEntries(KS.map(k=>[k,Object.values(c.docs[k]||{})]))}
 async function load(force){if(M.loading)return M.loading;if(!force&&M.at&&Date.now()-M.at<600000)return M;
  M.loading=(async()=>{try{try{db()}catch(e){}   /* 11-10 「파티 처음 누르면 기술이 다 『표에 없는 이름』」: 기술 표(db.js · dbedit)를 제작기 문서와 함께 미리 받기 시작 */
   const x=await pull();M.trainers=x.trainers.map(unwrap);M.pokemon=x.pokemon.map(unwrap);M.folders=x.folders.map(unwrap);M.pc={};for(const r of x.pcond||[])M.pc[r.id]=r.data||{};M.at=Date.now();heal()}catch(e){console.warn('maker',e)}finally{M.loading=null}return M})();return M.loading}
 /* 10-29 망령 「제작기에서 이름을 바꿔도 노트엔 처음 이름」: GM 이 열 때 노트 칸의 이름 · 초상 사본을 제작기 값으로 맞춘다 (바뀐 것만) */
 /* 10-31 망령 「대학에서 포트 바꾸면 제작기 원본에 반영이 안 돼서 어느 순간 다시 불려 온다」「이름 · 메모 같은 트레이너 변경 사항도 다 점검」:
    노트에서 바꾼 이름 · 초상 · 상세에는 바꾼 시각(nameAt · imageAt · bioAt)이 남는다. 제작기 트레이너의 그 시각이 다르면 = 제작기에 안 들어갔다 → 노트를 덮지 않고, 제작기를 노트 값으로 고친다(GM · 그 PL).
    시각이 같으면 그 뒤 제작기에서 바꾼 것 → 예전처럼 노트 사본(이름 · 초상)을 제작기에 맞춘다 */
 const pendF=(p,t,f)=>!!p[f+'At']&&t[f+'At']!==p[f+'At'];
 const bioOver=(A,B)=>{const L=(Array.isArray(A)?A:[]).map(x=>({k:x.k,v:x.v}));for(const b of B||[]){if(!b||!b.k)continue;const e=L.find(x=>x.k===b.k);if(e)e.v=b.v;else L.push({k:b.k,v:b.v})}return L};
 function heal(){try{const G=N().gm(),me=N().me();const rows=[],fix=[];for(const k of ['pc','npc'])for(const d of N().list(k)){const t=M.trainers.find(x=>x.id===d.id);if(!t)continue;const p=N().data(k,d.id)||{};
   const kn=pendF(p,t,'name'),ki=pendF(p,t,'image'),kb=pendF(p,t,'bio')&&Array.isArray(p.bio);if((kn||ki||kb)&&(G||me===d.id))fix.push({id:d.id,p,kn,ki,kb});if(!G)continue;
   const nm=kn?(p.name||t.name||''):(t.name||p.name||''),im=ki?(p.image||''):(t.image||p.image||'');if(nm!==(p.name||'')||im!==(p.image||''))rows.push({kind:k,id:d.id,data:Object.assign({},p,{name:nm,image:im}),vis:(N().doc(k,d.id)||{}).vis})}
  if(rows.length)(async()=>{const out=[];for(const r of rows){let d=r.data;try{const fr=await N().DBS().get(N().ST.camp,N().ST.secret,r.kind,r.id);if(fr&&fr.data){if((fr.data.imageAt||'')!==(r.data.imageAt||'')||(fr.data.nameAt||'')!==(r.data.nameAt||''))continue;d=Object.assign({},fr.data,{name:r.data.name,image:r.data.image})}}catch(e){}out.push(Object.assign({},r,{data:d}))}if(out.length)N().putMany(out)})();   /* 최신 노트 문서 위에 이름 · 초상만 (옛 사본으로 다른 칸을 되돌리지 않게) */
  for(const f of fix)edit('trainers',f.id,x=>{let ch=false;const p=f.p;if(f.kn&&x.nameAt!==p.nameAt){if(p.name)x.name=p.name;x.nameAt=p.nameAt;ch=true}if(f.ki&&x.imageAt!==p.imageAt){x.image=p.image||'';x.imageAt=p.imageAt;ch=true}
   if(f.kb&&x.bioAt!==p.bioAt){x.bio=bioOver(x.bio,p.bio).filter(q=>String(q.v||'').trim());x.bioAt=p.bioAt;ch=true}return ch?undefined:false}).catch(e=>console.warn('heal fix',e))}catch(e){console.warn('heal',e)}}
 const visible=t=>!t.priv||N().gm()||t.id===N().me();
 const trainers=()=>M.trainers.filter(visible).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ko'));
 const trainer=id=>M.trainers.find(t=>t.id===id)||null;
 const mons=tid=>{const t=trainer(tid);if(!t)return [];const ids=new Set(t.pids||[]);const out=M.pokemon.filter(p=>ids.has(p.id)||p.tid===tid);out.sort((a,b)=>[...ids].indexOf(a.id)-[...ids].indexOf(b.id));return out};
 const img=m=>m&&(m.image||m.img||'')||'';
 const folderName=id=>{const f=M.folders.find(x=>x.id===id);return f?f.name:(id||'')};
 /* 10-26 망령: 파티를 제작기 값 그대로 — 기술 표(타입 · 분류 · 위력)와 육성 기본 레벨은 제작기 기본 DB(data/db.js) + 공유 DB 의 기술 수정(dbedit)에서.
    특성 · 소지품 · 포텐셜 효과 글은 포켓몬 문서의 effTxt(제작기가 저장할 때 같이 적는 사본)를 쓴다 */
 const DBX={p:null,moves:null,lvl:[],items:new Map(),cards:new Map(),abil:new Map(),pots:new Map()};
 /* 10-29 망령: 소지품(items, 이름 = 1번 칸) · 카드(cards, 제작기 「카드 DB」 — 공유 DB 수정 행에만 있다)도 같이 읽는다. 대학 시트의 소지품 고치기 · 덱에서 쓴다 */
 /* 10-30 망령 「용량 줄이기」: 제작기 DB 수정분(dbedit)도 이 브라우저에 두고 바뀐 것만 (트레이너 · 포켓몬과 같은 방식, 7일마다 전부) */
 async function dbedit(){const DB=N().DBS();if(!DB.makerSince||!DB.makerIds)return DB.makerDocs('dbedit');const K='nt_mk_dbedit';let c=null;try{c=JSON.parse(localStorage.getItem(K)||'null')}catch(e){}if(!c||c.v!==1||Date.now()-c.t>7*864e5)c={v:1,t:Date.now(),since:'',docs:{}};
  const had=Object.keys(c.docs).length;const [ids,rows]=await Promise.all([had?DB.makerIds('dbedit'):null,DB.makerSince('dbedit',had?c.since:null)]);
  for(const r of rows){c.docs[r.id]={id:r.id,data:r.data};if(!c.since||r.updated_at>c.since)c.since=r.updated_at}
  if(ids){const have=new Set(ids.concat(rows.map(r=>r.id)));for(const id of Object.keys(c.docs))if(!have.has(id))delete c.docs[id]}
  try{const s=JSON.stringify(c);if(s.length<2e6)localStorage.setItem(K,s)}catch(e){}return Object.values(c.docs)}
 function db(){if(DBX.p)return DBX.p;DBX.p=new Promise(res=>{const fin=()=>{const D=window.MKM_DB||{};const mv=new Map(),it=new Map(),cd=new Map(),ab=new Map(),pt=new Map();for(const r of D.abil||[])if(r&&r[1])ab.set(r[1],r);for(const r of D.pots||[])if(r&&r[1])pt.set(r[1],r);for(const r of D.moves||[])if(r&&r[2])mv.set(r[2],r);for(const r of D.items||[])if(r&&r[1])it.set(r[1],r);for(const r of D.cards||[])if(r&&r[1])cd.set(r[1],r);DBX.lvl=D.lvl||[];
    const MP={moves:mv,items:it,cards:cd,abil:ab,pots:pt};
    dbedit().then(L=>{for(const x of L||[]){const d=x.data||{};const m=MP[d.kind];if(!m)continue;if(d.deleted)m.delete(d.key);else if(Array.isArray(d.row))m.set(d.key,d.row)}}).catch(()=>{}).finally(()=>{DBX.moves=mv;DBX.items=it;DBX.cards=cd;DBX.abil=ab;DBX.pots=pt;res(DBX)})};
   if(window.MKM_DB)return fin();const sc=document.createElement('script');sc.src=String((window.NT_CONFIG||{}).makerUrl||'').replace(/\/?$/,'/')+'data/db.js';sc.onload=fin;sc.onerror=()=>{DBX.moves=new Map();res(DBX)};document.head.appendChild(sc)});return DBX.p}
 const item=n=>(n&&DBX.items.get(n))||null;const card=n=>(n&&DBX.cards.get(n))||null;
 /* 10-29 망령: 노트에서 포켓몬 고치기 — 특성(abil, 이름 = 1번 칸) · 포텐셜(pots, 이름 = 1번 칸) · 기술 목록 */
 const abil=n=>(n&&DBX.abil.get(n))||null;const pot=n=>(n&&DBX.pots.get(String(n).replace(/[『』]/g,'').trim()))||null;const abilList=()=>[...DBX.abil.values()];const potList=()=>[...DBX.pots.values()];const moveList=()=>DBX.moves?[...DBX.moves.values()]:[];
 const itemList=()=>[...DBX.items.values()];const cardList=()=>[...DBX.cards.values()];const dbSet=(k,key,row)=>{const m=DBX[k];if(m&&m.set)m.set(key,row)};
 /* 10-29 망령: 노트에서 제작기 문서 한 장 고치기 (트레이너 · 포켓몬). fn(안쪽 data) 를 부르고 올린 뒤, 이 브라우저의 사본도 바로 바꾼다 */
 async function edit(kind,id,fn){const DB=N().DBS();if(!DB.makerPut||!DB.makerGet)throw new Error('이 화면에서는 제작기에 쓸 수 없어요');if(N().ST.plView)throw new Error('「PL 눈으로 보기」 중에는 저장하지 않아요');const cur=await DB.makerGet(kind,id);if(!cur)throw new Error('제작기 문서를 찾지 못했어요');
  const doc=JSON.parse(JSON.stringify(cur.data||{}));const d=doc.data||doc;const r=await fn(d,doc);if(r===false)return false;await DB.makerPut(kind,id,doc);
  const L=kind==='trainers'?M.trainers:kind==='pokemon'?M.pokemon:null;if(L){const i=L.findIndex(x=>x.id===id);const o=unwrap({id,data:doc});if(i>=0)L[i]=o;else L.push(o)}
  try{const c=JSON.parse(localStorage.getItem(MKC)||'null');if(c&&c.docs&&c.docs[kind]){c.docs[kind][id]={id,data:doc};localStorage.setItem(MKC,JSON.stringify(c))}}catch(e){}
  try{N().DBS().ping(N().ST.camp,{t:'mk',kind,id})}catch(e){}   /* 10-31: 같은 캠페인을 연 다른 사람도 제작기 사본을 다시 받게 */
  return true}
 /* 10-31: 창으로 돌아오면(1분 넘게 지났으면) 제작기 사본을 다시 맞춘다 — 제작기 앱에서 고친 것도 새로고침 없이 */
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&M.at&&Date.now()-M.at>60000)load(true).then(()=>{try{N().render()}catch(e){}})});
 const dbReady=()=>!!DBX.moves;
 const move=n=>(DBX.moves&&DBX.moves.get(n))||null;
 const baseLv=rank=>{const L=DBX.lvl||[];const r=L.find(x=>x[0]===rank)||L.find(x=>x[0]===String(rank||'').replace(/[+-]+$/,''));return r?+r[2]:100};
 /* 10-29 망령: 캠페인 ↔ 제작기 폴더. camp.data.mk.folders = [폴더 id] (하위 폴더 포함). 그 폴더의 트레이너는 PC/NPC 시트 탭에 「아직 안 넣은 트레이너」로 뜬다 */
 const camp=()=>(N().ST.campInfo||{}).data||{};
 const linked=()=>((camp().mk||{}).folders||[]).filter(Boolean);
 const kids=id=>M.folders.filter(f=>f.parent===id).map(f=>f.id);
 function under(ids){const S=new Set(),q=[...ids];while(q.length){const x=q.shift();if(S.has(x))continue;S.add(x);q.push(...kids(x))}return S}
 const fpath=id=>{const L=[];let c=M.folders.find(x=>x.id===id),n=0;while(c&&n++<6){L.unshift(c.name);c=c.parent?M.folders.find(x=>x.id===c.parent):null}return L.join(' / ')};
 /* 11-05 23:52 망령 「불러오는 건 캠페인마다 지원용 폴더를 따로 만들어서 거기에 연동」: camp.data.mk.support = 제작기 폴더 id. 웹툴 배틀 「+ 포켓몬」이 그 폴더(아래 폴더 포함) 트레이너의 포켓몬을 도중에 부른다. 이어 둔 폴더 안에 있어도 PC/NPC 시트 「아직 안 넣은」에서는 뺀다 */
 const support=()=>String((camp().mk||{}).support||'');
 const linkedTrainers=()=>{const L=linked();if(!L.length)return [];const S=under(L);const X=support()?under([support()]):new Set();return trainers().filter(t=>t.folder&&S.has(t.folder)&&!X.has(t.folder))};
 /* 10-30 망령 「미사그 캠퍼스 폴더 안에 NPC 폴더」: 이어진 폴더 아래의 NPC 폴더(제작기 고정 id misag-npc, 또는 이름에 NPC)에 든 트레이너는 NPC 표시가 없어도 NPC 시트(GM만)로 */
 const npcFolders=()=>{const S=under(linked());return under(M.folders.filter(f=>S.has(f.id)&&(f.id==='misag-npc'||/npc/i.test(f.name||''))).map(f=>f.id))};
 const isNpc=t=>!!t&&(t.kind==='npc'||(!!t.folder&&npcFolders().has(t.folder)));
 const missing=()=>linkedTrainers().filter(t=>!N().data('pc',t.id)&&!N().data('npc',t.id));
 async function saveLinked(ids){await N().campPatch({mk:{folders:ids}})}
 async function pickSupport(){await load(true);const cur=support();const roots=M.folders.filter(f=>!f.parent||!M.folders.some(x=>x.id===f.parent)).sort((a,b)=>(a.ord||0)-(b.ord||0));
  const cnt=id=>{const S=under([id]);const ts=M.trainers.filter(t=>t.folder&&S.has(t.folder));return `${ts.length}명 · 포켓몬 ${ts.reduce((n,t)=>n+mons(t.id).length,0)}체`};
  const row=(f,dep)=>`<label class="mkf" style="padding-left:${8+dep*20}px"><input type="radio" name="mksup" value="${N().esc(f.id)}" ${cur===f.id?'checked':''}><span>${dep?'└ ':''}📁 ${N().esc(f.name||f.id)}${f.priv?' 🔒':''}</span><small class="dim">${cnt(f.id)}</small></label>`+M.folders.filter(x=>x.parent===f.id).sort((a,b)=>(a.ord||0)-(b.ord||0)).map(x=>row(x,dep+1)).join('');
  return new Promise(res=>{const md=N().openModal(`<div class="mhead"><h2>🛟 지원 폴더 (배틀 도중 부르기)</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">웹툴 배틀 벤치의 「+ 포켓몬」이 이 폴더(아래 폴더 포함)에 있는 트레이너의 포켓몬을 한 마리씩 골라 진영에 부를 수 있어요. 캠페인마다 제작기에 지원용 폴더를 하나 만들어 두고 여기서 골라요. 이 폴더의 트레이너는 PC/NPC 시트의 「아직 안 넣은 트레이너」에는 뜨지 않아요.</p>
   <div class="mkflist">${roots.map(f=>row(f,0)).join('')||'<div class="small dim">제작기에 폴더가 없어요</div>'}</div>
   <div class="mfoot"><button class="btn ghost" id="mksNone">잇지 않기</button><span class="sp"></span><button class="btn pri" id="mksOk">저장</button></div>`);
   const done=async id=>{try{await N().campPatch({mk:{support:id||null}});N().closeModal();N().toast(id?'지원 폴더를 이었어요':'지원 폴더 잇기를 풀었어요');N().render();res(id)}catch(e){N().toast('저장 실패: '+e.message)}};
   N().$('#mksOk',md).onclick=()=>{const x=N().$('.mkflist input:checked',md);done(x?x.value:'')};N().$('#mksNone',md).onclick=()=>done('')})}   /* 11-03: 칸 단위 patch */
 /* 폴더 고르기 — 위 폴더를 고르면 아래 폴더도 같이 이어진다 */
 async function pickLinked(){await load(true);const cur=new Set(linked());const roots=M.folders.filter(f=>!f.parent||!M.folders.some(x=>x.id===f.parent)).sort((a,b)=>(a.ord||0)-(b.ord||0));
  const cnt=id=>{const S=under([id]);return M.trainers.filter(t=>t.folder&&S.has(t.folder)).length};
  const row=(f,dep)=>`<label class="mkf" style="padding-left:${8+dep*20}px"><input type="checkbox" value="${N().esc(f.id)}" ${cur.has(f.id)?'checked':''}><span>${dep?'└ ':''}📁 ${N().esc(f.name||f.id)}${f.priv?' 🔒':''}</span><small class="dim">${cnt(f.id)}명</small></label>`+M.folders.filter(x=>x.parent===f.id).sort((a,b)=>(a.ord||0)-(b.ord||0)).map(x=>row(x,dep+1)).join('');
  return new Promise(res=>{const md=N().openModal(`<div class="mhead"><h2>📁 제작기 폴더 잇기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">이 캠페인에 쓰는 제작기 폴더를 골라요. 그 폴더(아래 폴더 포함)에 트레이너를 새로 만들면 시트 탭에 「아직 안 넣은 트레이너」로 바로 떠요. NPC 로 표시된 트레이너와 NPC 폴더(이름에 NPC)의 트레이너는 NPC 시트(GM만)로 들어가요.</p>
   <div class="mkflist">${roots.map(f=>row(f,0)).join('')||'<div class="small dim">제작기에 폴더가 없어요</div>'}</div>
   <div class="mfoot"><button class="btn ghost" id="mkfNone">잇지 않기</button><span class="sp"></span><button class="btn pri" id="mkfOk">저장</button></div>`);
   const done=async ids=>{try{await saveLinked(ids);N().closeModal();N().toast(ids.length?'제작기 폴더를 이었어요':'폴더 잇기를 풀었어요');N().render();res(ids)}catch(e){N().toast('저장 실패: '+e.message)}};
   N().$('#mkfOk',md).onclick=()=>{let ids=N().$$('.mkflist input:checked',md).map(x=>x.value);const S=new Set(ids);ids=ids.filter(id=>{let c=M.folders.find(x=>x.id===id),n=0;while(c&&c.parent&&n++<8){if(S.has(c.parent))return false;c=M.folders.find(x=>x.id===c.parent)}return true});done(ids)};
   N().$('#mkfNone',md).onclick=()=>done([])})}
 /* 11-06 망령 「결과 정리로 보낸 HP · 상태를 카드에 · 옆에 회복」: 웹툴이 결과 정리 때 docs kind 'pcond' 에 남긴다. 회복하면 src 'maker' 로 덮고, 웹툴 GM 화면이 방 시트에 받아 간다 */
 const cond=id=>(M.pc||{})[id]||null;
 async function heal1(m){const c=cond(m.id)||{};const d={hp:null,max:c.max||null,st:null,at:Date.now(),src:'maker',by:'notes'};await N().DBS().makerPut('pcond',m.id,d);M.pc=M.pc||{};M.pc[m.id]=d;return d}
 return {cond,heal1,load,trainers,trainer,mons,img,folderName,M,db,dbReady,move,baseLv,item,card,itemList,cardList,abil,pot,abilList,potList,moveList,dbSet,edit,linked,linkedTrainers,missing,isNpc,pickLinked,support,pickSupport,fpath,under};
})();
