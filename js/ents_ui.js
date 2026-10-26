/* ---------- 항목 탭 (인물 · 설정 · 이벤트 · 아이템 · 조직) ----------
   ents: {type, title, sub, body, rows[{k,v}], tags[], teams[], face, photo, at[장소 id], gx, gy, color, created}
   sec 'ent:<id>' = {t} GM 메모(GM만). 관계(rels)는 graph_ui. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const TYPES=[['인물','person','#1e88e5'],['조직','org','#8e44ad'],['설정','lore','#00a676'],['이벤트','event','#f08a00'],['아이템','item','#ffd23f'],['기타','etc','#8e8e8e']];
 const tc=t=>TYPES.find(x=>x[0]===t)||TYPES[TYPES.length-1];
 const U={sel:'',type:'',tag:'',q:'',tagsOpen:false,fold:{}};
 const TAGMAX=10;
 const ents=()=>N().list('ents').sort((a,b)=>(a.order||0)-(b.order||0)||String(a.title||'').localeCompare(String(b.title||''),'ko'));
 const tags=()=>[...new Set(ents().flatMap(e=>e.tags||[]))].sort((a,b)=>a.localeCompare(b,'ko'));
 const spotName=id=>{const s=N().data('spots',id);return s?(s.num?s.num+'. ':'')+s.name:''};

 function render(el){const G=N().gm();const all=ents();const q=U.q.trim().toLowerCase();
  const L=all.filter(e=>(!U.type||e.type===U.type)&&(!U.tag||(e.tags||[]).includes(U.tag))&&(!q||[e.title,e.sub,e.body,(e.tags||[]).join(' '),(e.rows||[]).map(r=>r.k+' '+r.v).join(' ')].join(' ').toLowerCase().includes(q)));
  const sel=U.sel&&N().data('ents',U.sel)?Object.assign({id:U.sel,_vis:(N().doc('ents',U.sel)||{}).vis},N().data('ents',U.sel)):null;
  el.innerHTML=`<div class="toolbar"><h2>항목</h2><div class="seg" id="enTypes"><button data-t="" class="${!U.type?'on':''}">전체 ${all.length}</button>${TYPES.map(([t,,c])=>{const n=all.filter(e=>e.type===t).length;return n||G?`<button data-t="${t}" class="${U.type===t?'on':''}" style="--c:${c}"><i class="kdot"></i>${t} ${n}</button>`:''}).join('')}</div>
   <input type="search" id="enQ" placeholder="찾기" value="${esc(U.q)}" style="width:150px"><span class="sp"></span>${N().bulkBtns('ents',null,'항목')}${G?'<button class="btn sm pri" data-e="new">＋ 항목</button>':''}</div>
   ${(()=>{const T=tags();if(!T.length)return '';const cnt=t=>all.filter(e=>(e.tags||[]).includes(t)).length;const sorted=[...T].sort((a,b)=>cnt(b)-cnt(a)||a.localeCompare(b,'ko'));const show=U.tagsOpen||U.tag?sorted:sorted.slice(0,TAGMAX);
    return `<div class="tagbar">${U.tag?`<button class="chip on" data-tag="">${esc(U.tag)} ×</button>`:''}${show.filter(t=>t!==U.tag).map(t=>`<button class="chip" data-tag="${esc(t)}">${esc(t)}<small>${cnt(t)}</small></button>`).join('')}${sorted.length>TAGMAX&&!U.tag?`<button class="chip ghost" data-tagmore>${U.tagsOpen?'접기':'+'+(sorted.length-TAGMAX)+' 태그'}</button>`:''}</div>`})()}
   <div class="split wideR"><div class="entcol">${U.type||q||U.tag?`<div class="entgrid">${L.map(card).join('')||emptyBox(G)}</div>`:TYPES.map(([t,,c])=>{const g=L.filter(e=>e.type===t);if(!g.length)return '';const fold=U.fold[t];return `<section class="entsec ${fold?'fold':''}" style="--c:${c}"><h3 data-fold="${t}"><i class="kdot"></i>${t}<small>${g.length}</small><span class="sp"></span><em>${fold?'펼치기 ▾':'접기 ▴'}</em></h3>${fold?'':`<div class="entgrid">${g.map(card).join('')}</div>`}</section>`}).join('')||emptyBox(G)}</div><aside class="side" id="entSide">${sel?detail(sel):'<div class="card dim small">항목을 누르면 여기에 자세히 나와요.</div>'}</aside></div>`;
  const qi=$('#enQ',el);qi.oncompositionend=()=>qi.oninput({isComposing:false});qi.oninput=e=>{if(e.isComposing)return;U.q=qi.value;const v=qi.value;N().render();const q2=$('#enQ');if(q2){q2.focus();q2.setSelectionRange(v.length,v.length)}};
  el.addEventListener('click',e=>{const t=e.target;const tb=t.closest('#enTypes button');if(tb){U.type=tb.dataset.t;N().render();return}
   const tm=t.closest('[data-tagmore]');if(tm){U.tagsOpen=!U.tagsOpen;N().render();return}
   const fd=t.closest('[data-fold]');if(fd){U.fold[fd.dataset.fold]=!U.fold[fd.dataset.fold];N().render();return}
   const tg=t.closest('[data-tag]');if(tg){U.tag=tg.dataset.tag===U.tag?'':tg.dataset.tag;N().render();return}
   const c=t.closest('[data-sel]');if(c&&!t.closest('button.btn')){U.sel=c.dataset.sel;N().render();const s=$('#entSide');if(s&&innerWidth<1000)s.scrollIntoView({behavior:'smooth',block:'start'});return}
   const go=t.closest('[data-spot]');if(go){N().go('map');setTimeout(()=>{window.NT_MAP.select(go.dataset.spot);N().render()},0);return}
   const big=t.closest('img[data-big]');if(big){N().openModal(`<img src="${esc(big.dataset.big)}" style="max-width:100%;max-height:80vh;display:block;margin:auto">`,'wide');return}
   const b=t.closest('[data-e]');if(b)act(b.dataset.e,b)});
  /* 10-26 망령: 끌어서 순서 바꾸기(GM) · 우클릭 · 길게 누르기 메뉴 */
  if(G)$$('.entgrid',el).forEach(g=>N().sortable(g,'.entcard',ids=>N().reorder('ents',ids)));
  N().bindCtx(el,'.entcard',c=>ctxItems(c.dataset.id))}
 const emptyBox=G=>`<div class="empty">항목이 없어요.${G?' <button type="button" class="btn sm pri" data-e="new" style="margin-left:8px">＋ 항목</button>':''}</div>`;
 function ctxItems(id){const d=N().doc('ents',id);if(!d)return null;const e=d.data;const G=N().gm();const it=[];const cur=d.vis||'pub';
  if(G){const vis=[['pub','👥 모두에게'],['gm','🔒 GM만']].concat((N().ST.seats||[]).map(s=>['pl:'+s.seat,'👤 '+(N().seatName(s.seat)||s.seat)+' 에게만']));
   vis.forEach(([v,l])=>it.push({t:l+(v===cur?' ✓':''),on:async()=>{if(v===cur)return;await N().put('ents',id,N().clone(e),v);N().toast('공개 범위: '+N().visLabel(v))}}));it.push('-');
   it.push({t:'✎ 고치기',on:()=>edit(id)})}
  if(window.NT_FAV)it.push({t:(NT_FAV.has('ents',id)?'★ 즐겨찾기에서 빼기':'☆ 즐겨찾기'),on:()=>NT_FAV.toggle('ents',id,e.title)});
  it.push({t:'🕸 관계도에서 보기',on:()=>{N().go('graph');setTimeout(()=>window.NT_GRAPH&&NT_GRAPH.focus&&NT_GRAPH.focus(id),0)}});
  if(G){it.push('-');it.push({t:'🗑 지우기',danger:true,on:()=>act('del',{dataset:{id}})})}
  return it}
 function card(e){const t=tc(e.type);return `<button type="button" class="entcard ${e.id===U.sel?'on':''}" data-sel="${esc(e.id)}" data-id="${esc(e.id)}" data-drag style="--c:${e.color||t[2]}"><span class="face" style="${e.face?`background-image:url('${cssu(e.face)}')`:''}">${e.face?'':t[0][0]}</span><span class="eb"><b>${esc(e.title||'(제목 없음)')}</b><small>${esc(e.sub||'')}</small><span class="etags">${(e.tags||[]).slice(0,3).map(x=>`<em>${esc(x)}</em>`).join('')}${(e.tags||[]).length>3?`<em class="more">+${e.tags.length-3}</em>`:''}${N().visBadge(e._vis,'ents',e.id)}</span></span></button>`}
 function detail(e){const G=N().gm(),t=tc(e.type);const sec=N().data('sec','ent:'+e.id);const rels=N().list('rels').filter(r=>r.a===e.id||r.b===e.id);
  return `<div class="card entd" style="--c:${e.color||t[2]}"><div class="row" style="gap:6px"><span class="chip static" style="border-color:var(--c);color:var(--c)">${esc(e.type||'')}</span>${window.NT_FAV?NT_FAV.btn('ents',e.id,e.title):''}${N().visBadge(e._vis,'ents',e.id)}<span class="sp"></span>${G?`<button class="btn xs" data-e="edit" data-id="${esc(e.id)}">고치기</button><button class="btn xs ghost danger" data-e="del" data-id="${esc(e.id)}">지우기</button>`:''}</div>
   <div class="enthead">${e.face?`<img class="face" src="${esc(e.face)}" alt="" data-big="${esc(e.face)}">`:''}<div><h3>${esc(e.title||'')}</h3>${e.sub?`<div class="dim">${esc(e.sub)}</div>`:''}${(e.tags||[]).length?`<div class="etags">${e.tags.map(x=>`<em>${esc(x)}</em>`).join('')}</div>`:''}</div></div>
   ${e.photo?`<img class="photo" src="${esc(e.photo)}" alt="" data-big="${esc(e.photo)}" loading="lazy">`:''}
   ${e.body?`<p class="pre">${esc(e.body)}</p>`:''}
   ${(e.rows||[]).length?`<div class="kv">${e.rows.map(r=>`<b>${esc(r.k)}</b><span class="pre">${esc(r.v)}</span>`).join('')}</div>`:''}
   ${(e.at||[]).length?`<div class="sec">장소</div><div class="row">${e.at.map(id=>`<button class="chip" data-spot="${esc(id)}">📍 ${esc(spotName(id)||id)}</button>`).join('')}</div>`:''}
   ${(e.teams||[]).length?`<div class="sec">소속 · 편</div><div class="row">${e.teams.map(x=>`<span class="chip static">${esc(x)}</span>`).join('')}</div>`:''}
   ${rels.length?`<div class="sec">관계</div><ul class="lnk">${rels.map(r=>{const oid=r.a===e.id?r.b:r.a;const o=N().data('ents',oid);return `<li><button class="linkbtn" data-sel="${esc(oid)}">${esc(o?o.title:'?')}</button> <span class="small dim">${r.a===e.id?'→':'←'} ${esc(r.label||'')}</span></li>`}).join('')}</ul><button class="btn xs ghost" data-e="graph" data-id="${esc(e.id)}">관계도에서 보기</button>`:''}
   ${G&&sec&&sec.t?`<div class="gmnote"><b>GM 메모</b><div class="pre">${esc(sec.t)}</div></div>`:''}</div>`}

 async function act(k,b){const id=b.dataset.id||U.sel;
  if(k==='new'){const nid=N().uid('e');await N().put('ents',nid,{type:U.type||'인물',title:'새 항목',sub:'',body:'',rows:[],tags:U.tag?[U.tag]:[],teams:[],face:'',photo:'',at:[],created:Date.now(),order:ents().length},'gm');U.sel=nid;edit(nid);N().armDraft('ents',nid);return}
  if(k==='edit')return edit(id);
  if(k==='graph'){const id=U.sel;N().go('graph');setTimeout(()=>window.NT_GRAPH&&NT_GRAPH.focus&&NT_GRAPH.focus(id),0);return}
  if(k==='del'){const e=N().data('ents',id);if(!e||!await N().confirmBox(`「${e.title}」 항목을 지울까요? 관계선도 같이 지워져요.`,'지우기'))return;for(const r of N().list('rels').filter(r=>r.a===id||r.b===id))await N().del('rels',r.id);await N().del('ents',id);if(N().doc('sec','ent:'+id))await N().del('sec','ent:'+id);U.sel='';return}}
 function edit(id){const e=N().data('ents',id);if(!e)return;const sec=N().data('sec','ent:'+id)||{};const spots=N().list('spots');
  const rows=N().clone(e.rows||[]);let face=e.face||'',photo=e.photo||'';
  const md=N().openModal(`<div class="mhead" style="border-color:${esc(e.color||tc(e.type)[2])}"><h2>항목 고치기 <small class="dim" style="font-size:13px;font-family:var(--body)">${esc(e.title||'')}</small></h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="ed2">
    <div class="edL">
     <div class="updz face" id="etFace"><div class="pv" style="${face?`background-image:url('${cssu(face)}')`:''}"></div><b>얼굴</b><span>카드 · 관계도 · 지도 핀 옆</span></div>
     <div class="updz" id="etPhoto"><div class="pv" style="${photo?`background-image:url('${cssu(photo)}')`:''}"></div><b>큰 그림</b><span>끌어 놓기 · 클릭 · Ctrl+V</span></div>
     <div class="row small" style="gap:4px"><button class="btn xs ghost" id="etFaceX">얼굴 빼기</button><button class="btn xs ghost" id="etPhotoX">큰 그림 빼기</button></div>
     <label class="lbl">종류<select id="etType">${TYPES.map(([t])=>`<option ${t===e.type?'selected':''}>${t}</option>`).join('')}</select></label>
     <label class="lbl">공개${N().visSelect(N().doc('ents',id).vis,'etVis')}</label>
     <label class="lbl">색<input id="etColor" type="color" value="${esc(e.color||tc(e.type)[2])}"></label>
    </div>
    <div class="edR">
     <label class="lbl">제목<input id="etTitle" type="text" value="${esc(e.title||'')}" class="big"></label>
     <label class="lbl">한 줄 소개<input id="etSub" type="text" value="${esc(e.sub||'')}"></label>
     <label class="lbl">본문<textarea id="etBody" rows="5">${esc(e.body||'')}</textarea></label>
     <div class="sec">상세 칸 <small class="dim">정체 · 외모 · 원하는 것 …</small><span class="sp"></span><button class="btn xs" id="etRowAdd">＋ 칸</button></div><div id="etRows" class="rowsed"></div>
     <div class="sec">태그 · 소속</div>
     <div class="mrow"><label class="lbl">태그 (쉼표로)<input id="etTags" type="text" value="${esc((e.tags||[]).join(', '))}"></label><label class="lbl">소속 · 편 (쉼표로)<input id="etTeams" type="text" value="${esc((e.teams||[]).join(', '))}"></label></div>
     <div class="row" style="gap:4px;flex-wrap:wrap">${tags().slice(0,24).map(t=>`<button type="button" class="chip xs" data-addtag="${esc(t)}">${esc(t)}</button>`).join('')}</div>
     <div class="sec">장소</div><div class="row" id="etAt" style="flex-wrap:wrap;gap:4px">${spots.sort((a,b)=>String(a.num||'').localeCompare(String(b.num||''),'ko',{numeric:true})).map(s=>`<label class="chk chip ${(e.at||[]).includes(s.id)?'on':''}"><input type="checkbox" value="${esc(s.id)}" ${(e.at||[]).includes(s.id)?'checked':''} hidden>${esc((s.num?s.num+'. ':'')+s.name)}</label>`).join('')||'<span class="small dim">지도에 장소를 먼저 찍어요</span>'}</div>
     <div class="sec">GM 메모 <span class="dim">(GM 에게만 보여요)</span></div><textarea id="etSec" rows="3">${esc(sec.t||'')}</textarea>
    </div>
   </div>
   <div class="mfoot"><button class="btn ghost" data-x>취소</button><span class="sp"></span><button class="btn pri" id="etOk">저장</button></div>`,'wide');
  $$('[data-addtag]',md).forEach(b=>b.onclick=()=>{const i=$('#etTags',md);const cur=i.value.split(',').map(x=>x.trim()).filter(Boolean);if(!cur.includes(b.dataset.addtag))cur.push(b.dataset.addtag);i.value=cur.join(', ')});
  const drawRows=()=>{$('#etRows',md).innerHTML=rows.map((r,i)=>`<div class="etrow" data-i="${i}"><input type="text" data-k value="${esc(r.k)}" placeholder="칸 이름"><textarea data-v rows="1" placeholder="내용">${esc(r.v)}</textarea><button class="btn xs ghost danger" data-del title="칸 빼기">×</button></div>`).join('');$$('#etRows textarea',md).forEach(t=>{const g=()=>{t.style.height='auto';t.style.height=Math.min(160,t.scrollHeight+2)+'px'};t.oninput=g;g()});
   $$('.etrow',md).forEach(r=>{const i=+r.dataset.i;r.querySelector('[data-k]').oninput=ev=>rows[i].k=ev.target.value;r.querySelector('[data-v]').oninput=ev=>rows[i].v=ev.target.value;r.querySelector('[data-del]').onclick=()=>{rows.splice(i,1);drawRows()}})};
  drawRows();$('#etRowAdd',md).onclick=()=>{rows.push({k:'',v:''});drawRows();const last=$$('.etrow [data-k]',md).pop();if(last)last.focus()};
  $$('#etAt input',md).forEach(c=>c.onchange=()=>c.closest('label').classList.toggle('on',c.checked));
  N().bindDrop($('#etFace',md),async fs=>{try{face=await N().upload(fs[0],'face','face');$('#etFace .pv',md).style.backgroundImage=`url('${cssu(face)}')`}catch(x){N().toast('올리기 실패: '+x.message)}});
  N().bindDrop($('#etPhoto',md),async fs=>{try{photo=await N().upload(fs[0],'photo','photo');$('#etPhoto .pv',md).style.backgroundImage=`url('${cssu(photo)}')`}catch(x){N().toast('올리기 실패: '+x.message)}});
  $('#etFaceX',md).onclick=()=>{face='';$('#etFace .pv',md).style.backgroundImage=''};$('#etPhotoX',md).onclick=()=>{photo='';$('#etPhoto .pv',md).style.backgroundImage=''};
  $('#etOk',md).onclick=async()=>{const split=v=>v.split(',').map(x=>x.trim()).filter(Boolean);
   const n=Object.assign({},e,{type:$('#etType',md).value,title:$('#etTitle',md).value.trim()||'항목',sub:$('#etSub',md).value.trim(),body:$('#etBody',md).value.trim(),rows:rows.filter(r=>r.k||r.v),tags:split($('#etTags',md).value),teams:split($('#etTeams',md).value),color:$('#etColor',md).value,at:$$('#etAt input:checked',md).map(c=>c.value),face,photo});
   await N().put('ents',id,n,$('#etVis',md).value);const t=$('#etSec',md).value.trim();if(t)await N().put('sec','ent:'+id,{t},'gm');else if(N().doc('sec','ent:'+id))await N().del('sec','ent:'+id);N().closeModal()}}

 N().MOD.ents={render};
 window.NT_ENTS={TYPES,tc,select:id=>{U.sel=id;N().render()},edit};
})();
