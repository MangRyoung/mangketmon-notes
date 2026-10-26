/* ---------- 제작기 문서 읽기 (같은 Supabase 의 docs 표: trainers · pokemon) ----------
   PC 시트는 여기서 트레이너 · 포켓몬을 읽어 보여 주고(읽기 전용), RP 칸만 노트에 쓴다. 비공개(priv) 트레이너는 GM 에게만. */
"use strict";
window.NT_MAKER=(()=>{
 const N=()=>window.NT;
 const M={trainers:[],pokemon:[],folders:[],at:0,loading:null};
 const unwrap=doc=>{const d=(doc.data&&doc.data.data)||doc.data||{};return Object.assign({id:doc.id,_ord:doc.data&&doc.data.ord!=null?+doc.data.ord:null},d)};
 async function load(force){if(M.loading)return M.loading;if(!force&&M.at&&Date.now()-M.at<600000)return M;
  M.loading=(async()=>{try{const [t,p,f]=await Promise.all([N().DBS().makerDocs('trainers'),N().DBS().makerDocs('pokemon'),N().DBS().makerDocs('folders').catch(()=>[])]);M.trainers=t.map(unwrap);M.pokemon=p.map(unwrap);M.folders=f.map(unwrap);M.at=Date.now()}catch(e){console.warn('maker',e)}finally{M.loading=null}return M})();return M.loading}
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
 return {load,trainers,trainer,mons,img,folderName,M,db,dbReady,move,baseLv};
})();
