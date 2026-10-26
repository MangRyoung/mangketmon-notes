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
 return {load,trainers,trainer,mons,img,folderName,M};
})();
