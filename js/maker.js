/* ---------- 제작기 문서 읽기 (같은 Supabase 의 docs 표: trainers · pokemon) ----------
   PC 시트는 여기서 트레이너 · 포켓몬을 읽어 보여 주고(읽기 전용), RP 칸만 노트에 쓴다. 비공개(priv) 트레이너는 GM 에게만. */
"use strict";
window.NT_MAKER=(()=>{
 const N=()=>window.NT;
 const M={trainers:[],pokemon:[],folders:[],at:0,loading:null};
 const unwrap=doc=>{const d=(doc.data&&doc.data.data)||doc.data||{};return Object.assign({id:doc.id,_ord:doc.data&&doc.data.ord!=null?+doc.data.ord:null},d)};
 /* 10-29 망령 「변동 사항만」: 받은 제작기 문서를 이 브라우저에 두고, 다음에는 그 뒤에 바뀐 것(updated_at)만 받는다. 지워진 건 id 목록으로 걸러 낸다 */
 const MKC='nt_mk_cache',KS=['trainers','pokemon','folders'];
 async function pull(){const DB=N().DBS();if(!DB.makerSince||!DB.makerIds){const [t,p,f]=await Promise.all([DB.makerDocs('trainers'),DB.makerDocs('pokemon'),DB.makerDocs('folders').catch(()=>[])]);return {trainers:t,pokemon:p,folders:f}}
  let c=null;try{c=JSON.parse(localStorage.getItem(MKC)||'null')}catch(e){}if(!c||c.v!==1||Date.now()-c.t>7*864e5)c={v:1,t:Date.now(),since:{},docs:{}};
  let got=0;await Promise.all(KS.map(async k=>{const D=c.docs[k]=c.docs[k]||{};const had=Object.keys(D).length;const [ids,rows]=await Promise.all([had?DB.makerIds(k):null,DB.makerSince(k,had?c.since[k]:null)]);
   for(const r of rows){D[r.id]={id:r.id,data:r.data};if(!c.since[k]||r.updated_at>c.since[k])c.since[k]=r.updated_at}got+=rows.length;
   if(ids){const have=new Set(ids.concat(rows.map(r=>r.id)));for(const id of Object.keys(D))if(!have.has(id))delete D[id]}}));
  M.got=got;try{const s=JSON.stringify(c);if(s.length<4e6)localStorage.setItem(MKC,s);else localStorage.removeItem(MKC)}catch(e){try{localStorage.removeItem(MKC)}catch(e2){}}
  return Object.fromEntries(KS.map(k=>[k,Object.values(c.docs[k]||{})]))}
 async function load(force){if(M.loading)return M.loading;if(!force&&M.at&&Date.now()-M.at<600000)return M;
  M.loading=(async()=>{try{const x=await pull();M.trainers=x.trainers.map(unwrap);M.pokemon=x.pokemon.map(unwrap);M.folders=x.folders.map(unwrap);M.at=Date.now();heal()}catch(e){console.warn('maker',e)}finally{M.loading=null}return M})();return M.loading}
 /* 10-29 망령 「제작기에서 이름을 바꿔도 노트엔 처음 이름」: GM 이 열 때 노트 칸의 이름 · 초상 사본을 제작기 값으로 맞춘다 (바뀐 것만) */
 function heal(){try{if(!N().gm())return;const rows=[];for(const k of ['pc','npc'])for(const d of N().list(k)){const t=M.trainers.find(x=>x.id===d.id);if(!t)continue;const p=N().data(k,d.id)||{};const nm=t.name||p.name||'',im=t.image||p.image||'';if(nm!==(p.name||'')||im!==(p.image||''))rows.push({kind:k,id:d.id,data:Object.assign({},p,{name:nm,image:im}),vis:(N().doc(k,d.id)||{}).vis})}if(rows.length)N().putMany(rows)}catch(e){console.warn('heal',e)}}
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
 async function edit(kind,id,fn){const DB=N().DBS();if(!DB.makerPut||!DB.makerGet)throw new Error('이 화면에서는 제작기에 쓸 수 없어요');const cur=await DB.makerGet(kind,id);if(!cur)throw new Error('제작기 문서를 찾지 못했어요');
  const doc=JSON.parse(JSON.stringify(cur.data||{}));const d=doc.data||doc;const r=await fn(d,doc);if(r===false)return false;await DB.makerPut(kind,id,doc);
  const L=kind==='trainers'?M.trainers:kind==='pokemon'?M.pokemon:null;if(L){const i=L.findIndex(x=>x.id===id);const o=unwrap({id,data:doc});if(i>=0)L[i]=o;else L.push(o)}
  try{const c=JSON.parse(localStorage.getItem(MKC)||'null');if(c&&c.docs&&c.docs[kind]){c.docs[kind][id]={id,data:doc};localStorage.setItem(MKC,JSON.stringify(c))}}catch(e){}
  return true}
 const dbReady=()=>!!DBX.moves;
 const move=n=>(DBX.moves&&DBX.moves.get(n))||null;
 const baseLv=rank=>{const L=DBX.lvl||[];const r=L.find(x=>x[0]===rank)||L.find(x=>x[0]===String(rank||'').replace(/[+-]+$/,''));return r?+r[2]:100};
 /* 10-29 망령: 캠페인 ↔ 제작기 폴더. camp.data.mk.folders = [폴더 id] (하위 폴더 포함). 그 폴더의 트레이너는 PC/NPC 시트 탭에 「아직 안 넣은 트레이너」로 뜬다 */
 const camp=()=>(N().ST.campInfo||{}).data||{};
 const linked=()=>((camp().mk||{}).folders||[]).filter(Boolean);
 const kids=id=>M.folders.filter(f=>f.parent===id).map(f=>f.id);
 function under(ids){const S=new Set(),q=[...ids];while(q.length){const x=q.shift();if(S.has(x))continue;S.add(x);q.push(...kids(x))}return S}
 const fpath=id=>{const L=[];let c=M.folders.find(x=>x.id===id),n=0;while(c&&n++<6){L.unshift(c.name);c=c.parent?M.folders.find(x=>x.id===c.parent):null}return L.join(' / ')};
 const linkedTrainers=()=>{const L=linked();if(!L.length)return [];const S=under(L);return trainers().filter(t=>t.folder&&S.has(t.folder))};
 /* 10-30 망령 「미사그 캠퍼스 폴더 안에 NPC 폴더」: 이어진 폴더 아래의 NPC 폴더(제작기 고정 id misag-npc, 또는 이름에 NPC)에 든 트레이너는 NPC 표시가 없어도 NPC 시트(GM만)로 */
 const npcFolders=()=>{const S=under(linked());return under(M.folders.filter(f=>S.has(f.id)&&(f.id==='misag-npc'||/npc/i.test(f.name||''))).map(f=>f.id))};
 const isNpc=t=>!!t&&(t.kind==='npc'||(!!t.folder&&npcFolders().has(t.folder)));
 const missing=()=>linkedTrainers().filter(t=>!N().data('pc',t.id)&&!N().data('npc',t.id));
 async function saveLinked(ids){const S=N().ST;const c=S.campInfo||{};const d=Object.assign({},c.data||{});d.mk=Object.assign({},d.mk||{},{folders:ids});await N().DBS().campUpdate(S.camp,S.secret,null,d);if(S.campInfo)S.campInfo.data=d;await N().refreshCamp()}
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
 return {load,trainers,trainer,mons,img,folderName,M,db,dbReady,move,baseLv,item,card,itemList,cardList,abil,pot,abilList,potList,moveList,dbSet,edit,linked,linkedTrainers,missing,isNpc,pickLinked,fpath,under};
})();
