/* ---------- 즐겨찾기 레일 ----------
   넓은 화면의 빈 왼쪽 여백에 「즐겨찾기」 레일을 둔다. 장소 · 항목 · 루트 · PC/NPC 시트 · 세션 · 로그에 ★ 를 누르면 여기 모이고, 누르면 그 탭의 그 항목으로 바로 간다.
   저장: 이 브라우저(localStorage nt_fav_<캠페인>) — 사람마다 제 즐겨찾기. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const KEY=()=>'nt_fav_'+N().ST.camp;
 const get=()=>{try{return JSON.parse(localStorage.getItem(KEY())||'[]')||[]}catch(e){return []}};
 const set=v=>{try{localStorage.setItem(KEY(),JSON.stringify(v))}catch(e){}};
 const has=(kind,id)=>get().some(f=>f.kind===kind&&f.id===id);
 function toggle(kind,id,label){const L=get();const i=L.findIndex(f=>f.kind===kind&&f.id===id);if(i>=0)L.splice(i,1);else L.push({kind,id,label:label||''});set(L);N().toast(i>=0?'즐겨찾기에서 뺐어요':'즐겨찾기에 넣었어요 ★');N().render()}
 const ICON={spots:'📍',ents:'📇',routes:'🧭',pc:'🧑',npc:'🎭',sess:'📅',logs:'📜',map:'🗺'};
 /* 지금 이름(문서가 바뀌었을 수 있으니 저장된 label 보다 문서 우선) */
 function labelOf(f){const d=f.kind==='sess'?N().data('plan',f.id):f.kind==='logs'?null:N().data(f.kind,f.id);
  if(f.kind==='spots'&&d)return (d.num?d.num+'. ':'')+d.name;if(f.kind==='ents'&&d)return d.title;if(f.kind==='routes'&&d)return d.name;if((f.kind==='pc'||f.kind==='npc')&&d)return d.name||f.id;if(f.kind==='sess'&&d)return (d.label?d.label+' ':'')+(d.what||'세션');if(f.kind==='map'&&d)return d.name;return f.label||f.id}
 const alive=f=>f.kind==='logs'||!!(f.kind==='sess'?N().data('plan',f.id):N().data(f.kind,f.id));
 function go(f){const L=N().MOD;
  if(f.kind==='spots'){N().go('map');setTimeout(()=>{window.NT_MAP.select(f.id);N().render()},0);return}
  if(f.kind==='map'){N().go('map');setTimeout(()=>{window.NT_MAP.selectMap&&NT_MAP.selectMap(f.id);N().render()},0);return}
  if(f.kind==='ents'){N().go('ents');setTimeout(()=>window.NT_ENTS&&NT_ENTS.select(f.id),0);return}
  if(f.kind==='routes'){N().go('scen');setTimeout(()=>{const c=document.querySelector(`.fcard[data-route="${CSS.escape(f.id)}"],.lane[data-route="${CSS.escape(f.id)}"]`);if(c){c.scrollIntoView({behavior:'smooth',block:'center'});c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),1200)}},50);return}
  if(f.kind==='pc'||f.kind==='npc'){if(L.pc&&L.pc.mode)L.pc.mode(f.kind);if(L.pc&&L.pc.select)L.pc.select(f.id);N().go('pc');return}
  if(f.kind==='sess'){N().go('plan');setTimeout(()=>{const r=document.querySelector(`[data-sess="${CSS.escape(f.id)}"]`);if(r){r.scrollIntoView({behavior:'smooth',block:'center'});r.classList.add('flash');setTimeout(()=>r.classList.remove('flash'),1200)}},50);return}
  if(f.kind==='logs'){if(L.logs)window.open(L.logs.viewUrl(f.id),'_blank','noopener');return}}
 const btn=(kind,id,label)=>`<button type="button" class="favb ${has(kind,id)?'on':''}" data-fav="${esc(kind)}|${esc(id)}" data-favl="${esc(label||'')}" title="${has(kind,id)?'즐겨찾기에서 빼기':'즐겨찾기에 넣기'}">${has(kind,id)?'★':'☆'}</button>`;
 function rail(){const L=get().filter(alive);const open=(()=>{try{return localStorage.getItem('nt_fav_open')!=='0'}catch(e){return true}})();
  return `<aside id="ntFav" class="${open?'':'closed'}"><button type="button" class="favh" data-favtoggle title="즐겨찾기 접기 · 펴기">★ 즐겨찾기 <small>${L.length}</small></button>
   ${open?`<div class="favl">${L.map((f,i)=>`<button type="button" class="favi" data-favgo="${i}"><i>${ICON[f.kind]||'•'}</i><span>${esc(labelOf(f))}</span><em data-favx="${i}" title="빼기">×</em></button>`).join('')||'<div class="small dim" style="padding:8px 10px;line-height:1.5">장소 · 항목 · 루트 · 시트 · 세션 · 로그의 ☆ 를 누르면 여기 모여요. 누르면 바로 가요.</div>'}</div>`:''}</aside>`}
 document.addEventListener('click',e=>{const t=e.target;const b=t.closest('[data-fav]');if(b){e.stopPropagation();const [k,id]=b.dataset.fav.split('|');toggle(k,id,b.dataset.favl);return}
  const x=t.closest('[data-favx]');if(x){e.stopPropagation();const L=get();L.splice(+x.dataset.favx,1);set(L);N().render();return}
  const g=t.closest('[data-favgo]');if(g){const L=get().filter(alive);const f=L[+g.dataset.favgo];if(f)go(f);return}
  const tg=t.closest('[data-favtoggle]');if(tg){try{localStorage.setItem('nt_fav_open',localStorage.getItem('nt_fav_open')==='0'?'1':'0')}catch(e){}N().render()}});
 window.NT_FAV={get,has,toggle,btn,rail,go};
})();
