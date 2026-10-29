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
  M.loading=(async()=>{try{const x=await pull();M.trainers=x.trainers.map(unwrap);M.pokemon=x.pokemon.map(unwrap);M.folders=x.folders.map(unwrap);M.at=Date.now()}catch(e){console.warn('maker',e)}finally{M.loading=null}return M})();return M.loading}
 const visible=t=>!t.priv||N().gm()||t.id===N().me();
 const trainers=()=>M.trainers.filter(visible).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ko'));
 const trainer=id=>M.trainers.find(t=>t.id===id)||null;
 const mons=tid=>{const t=trainer(tid);if(!t)return [];const ids=new Set(t.pids||[]);const out=M.pokemon.filter(p=>ids.has(p.id)||p.tid===tid);out.sort((a,b)=>[...ids].indexOf(a.id)-[...ids].indexOf(b.id));return out};
 const img=m=>m&&(m.image||m.img||'')||'';
 const folderName=id=>{const f=M.folders.find(x=>x.id===id);return f?f.name:(id||'')};
 /* 10-26 망령: 파티를 제작기 값 그대로 — 기술 표(타입 · 분류 · 위력)와 육성 기본 레벨은 제작기 기본 DB(data/db.js) + 공유 DB 의 기술 수정(dbedit)에서.
    특성 · 소지품 · 포텐셜 효과 글은 포켓몬 문서의 effTxt(제작기가 저장할 때 같이 적는 사본)를 쓴다 */
 const DBX={p:null,moves:null,lvl:[]};
 function db(){if(DBX.p)return DBX.p;DBX.p=new Promise(res=>{const fin=()=>{const D=window.MKM_DB||{};const mv=new Map();for(const r of D.moves||[])if(r&&r[2])mv.set(r[2],r);DBX.lvl=D.lvl||[];
    N().DBS().makerDocs('dbedit').then(L=>{for(const x of L||[]){const d=x.data||{};if(d.kind!=='moves')continue;if(d.deleted)mv.delete(d.key);else if(Array.isArray(d.row))mv.set(d.key,d.row)}}).catch(()=>{}).finally(()=>{DBX.moves=mv;res(DBX)})};
   if(window.MKM_DB)return fin();const sc=document.createElement('script');sc.src=String((window.NT_CONFIG||{}).makerUrl||'').replace(/\/?$/,'/')+'data/db.js';sc.onload=fin;sc.onerror=()=>{DBX.moves=new Map();res(DBX)};document.head.appendChild(sc)});return DBX.p}
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
 const missing=()=>linkedTrainers().filter(t=>!N().data('pc',t.id)&&!N().data('npc',t.id));
 async function saveLinked(ids){const S=N().ST;const c=S.campInfo||{};const d=Object.assign({},c.data||{});d.mk=Object.assign({},d.mk||{},{folders:ids});await N().DBS().campUpdate(S.camp,S.secret,null,d);if(S.campInfo)S.campInfo.data=d;await N().refreshCamp()}
 /* 폴더 고르기 — 위 폴더를 고르면 아래 폴더도 같이 이어진다 */
 async function pickLinked(){await load(true);const cur=new Set(linked());const roots=M.folders.filter(f=>!f.parent||!M.folders.some(x=>x.id===f.parent)).sort((a,b)=>(a.ord||0)-(b.ord||0));
  const cnt=id=>{const S=under([id]);return M.trainers.filter(t=>t.folder&&S.has(t.folder)).length};
  const row=(f,dep)=>`<label class="mkf" style="padding-left:${8+dep*20}px"><input type="checkbox" value="${N().esc(f.id)}" ${cur.has(f.id)?'checked':''}><span>${dep?'└ ':''}📁 ${N().esc(f.name||f.id)}${f.priv?' 🔒':''}</span><small class="dim">${cnt(f.id)}명</small></label>`+M.folders.filter(x=>x.parent===f.id).sort((a,b)=>(a.ord||0)-(b.ord||0)).map(x=>row(x,dep+1)).join('');
  return new Promise(res=>{const md=N().openModal(`<div class="mhead"><h2>📁 제작기 폴더 잇기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">이 캠페인에 쓰는 제작기 폴더를 골라요. 그 폴더(아래 폴더 포함)에 트레이너를 새로 만들면 시트 탭에 「아직 안 넣은 트레이너」로 바로 떠요. NPC 로 표시된 트레이너는 NPC 시트로 들어가요.</p>
   <div class="mkflist">${roots.map(f=>row(f,0)).join('')||'<div class="small dim">제작기에 폴더가 없어요</div>'}</div>
   <div class="mfoot"><button class="btn ghost" id="mkfNone">잇지 않기</button><span class="sp"></span><button class="btn pri" id="mkfOk">저장</button></div>`);
   const done=async ids=>{try{await saveLinked(ids);N().closeModal();N().toast(ids.length?'제작기 폴더를 이었어요':'폴더 잇기를 풀었어요');N().render();res(ids)}catch(e){N().toast('저장 실패: '+e.message)}};
   N().$('#mkfOk',md).onclick=()=>{let ids=N().$$('.mkflist input:checked',md).map(x=>x.value);const S=new Set(ids);ids=ids.filter(id=>{let c=M.folders.find(x=>x.id===id),n=0;while(c&&c.parent&&n++<8){if(S.has(c.parent))return false;c=M.folders.find(x=>x.id===c.parent)}return true});done(ids)};
   N().$('#mkfNone',md).onclick=()=>done([])})}
 return {load,trainers,trainer,mons,img,folderName,M,db,dbReady,move,baseLv,linked,linkedTrainers,missing,pickLinked,fpath,under};
})();
