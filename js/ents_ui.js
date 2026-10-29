/* ---------- 항목 탭 (인물 · 설정 · 이벤트 · 아이템 · 조직) ----------
   ents: {type, title, sub, body, rows[{k,v}], tags[], teams[], face, photo, at[장소 id], gx, gy, color, created}
   10-29 망령: rb {ch, h[]} = 제작기 룰북 장(절) 잇기 · mk = 제작기 트레이너 id · files [{n, k:img|txt|link, u, x(글 파일 내용), s}] = 첨부
   sec 'ent:<id>' = {t} GM 메모(GM만). 관계(rels)는 graph_ui. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const TYPES=[['인물','person','#1e88e5'],['조직','org','#8e44ad'],['설정','lore','#00a676'],['이벤트','event','#f08a00'],['아이템','item','#ffd23f'],['기타','etc','#8e8e8e']];
 const tc=t=>TYPES.find(x=>x[0]===t)||TYPES[TYPES.length-1];
 const VK='nt_ent_view';
 const U={sel:'',type:'',tag:'',q:'',tagsOpen:false,fold:{},dense:(()=>{try{return localStorage.getItem(VK)==='list'}catch(e){return false}})(),ids:[]};
 /* 10-29: 종류마다 기본 칸 (새 항목에 미리 깔고, 고치기 창의 「칸 틀」 로 빠진 것만 더한다. 빈 칸은 저장하지 않는다) */
 const TPL={'인물':['정체','외모','성격 · 말투','원하는 것','비밀'],'조직':['목적','구성원','거점','가진 것','숨긴 것'],'설정':['요약','규칙','예외 · 주의'],'이벤트':['언제','어디서','무슨 일','결과'],'아이템':['효과','출처','값 · 구하는 법'],'기타':[]};
 const TAGMAX=10;
 const ents=()=>N().list('ents').sort((a,b)=>(a.order||0)-(b.order||0)||String(a.title||'').localeCompare(String(b.title||''),'ko'));
 const tags=()=>[...new Set(ents().flatMap(e=>e.tags||[]))].sort((a,b)=>a.localeCompare(b,'ko'));
 const spotName=id=>{const s=N().data('spots',id);return s?(s.num?s.num+'. ':'')+s.name:''};

 function render(el){const G=N().gm();const all=ents();const q=U.q.trim().toLowerCase();
  const L=all.filter(e=>(!U.type||e.type===U.type)&&(!U.tag||(e.tags||[]).includes(U.tag))&&(!q||[e.title,e.sub,e.body,(e.tags||[]).join(' '),(e.rows||[]).map(r=>r.k+' '+r.v).join(' ')].join(' ').toLowerCase().includes(q)));
  U.ids=(U.type||q||U.tag?L:TYPES.flatMap(([t])=>U.fold[t]?[]:L.filter(e=>e.type===t))).map(e=>e.id);
  const sel=U.sel&&N().data('ents',U.sel)?Object.assign({id:U.sel,_vis:(N().doc('ents',U.sel)||{}).vis},N().data('ents',U.sel)):null;
  el.innerHTML=`<div class="toolbar"><h2>항목</h2><div class="seg" id="enTypes"><button data-t="" class="${!U.type?'on':''}">전체 ${all.length}</button>${TYPES.map(([t,,c])=>{const n=all.filter(e=>e.type===t).length;return n||G?`<button data-t="${t}" class="${U.type===t?'on':''}" style="--c:${c}"><i class="kdot"></i>${t} ${n}</button>`:''}).join('')}</div>
   <input type="search" id="enQ" placeholder="찾기" title="제목 · 한 줄 · 본문 · 상세 칸 · 태그에서 찾아요" value="${esc(U.q)}" style="width:160px"><div class="entview" title="카드로 보기 · 한 줄씩 보기"><button type="button" data-ev="card" class="${U.dense?'':'on'}">카드</button><button type="button" data-ev="list" class="${U.dense?'on':''}">목록</button></div><span class="sp"></span>${N().bulkBtns('ents',null,'항목')}${G?'<button class="btn sm pri" data-e="new">＋ 항목</button>':''}</div>
   ${(()=>{const T=tags();if(!T.length)return '';const cnt=t=>all.filter(e=>(e.tags||[]).includes(t)).length;const sorted=[...T].sort((a,b)=>cnt(b)-cnt(a)||a.localeCompare(b,'ko'));const show=U.tagsOpen||U.tag?sorted:sorted.slice(0,TAGMAX);
    return `<div class="tagbar">${U.tag?`<button class="chip on" data-tag="">${esc(U.tag)} ×</button>`:''}${show.filter(t=>t!==U.tag).map(t=>`<button class="chip" data-tag="${esc(t)}">${esc(t)}<small>${cnt(t)}</small></button>`).join('')}${sorted.length>TAGMAX&&!U.tag?`<button class="chip ghost" data-tagmore>${U.tagsOpen?'접기':'+'+(sorted.length-TAGMAX)+' 태그'}</button>`:''}</div>`})()}
   <div class="split wideR"><div class="entcol">${U.type||q||U.tag?`<div class="entgrid ${U.dense?'dense':''}">${L.map(card).join('')||emptyBox(G)}</div>`:TYPES.map(([t,,c])=>{const g=L.filter(e=>e.type===t);if(!g.length)return '';const fold=U.fold[t];return `<section class="entsec ${fold?'fold':''}" style="--c:${c}"><h3 data-fold="${t}"><i class="kdot"></i>${t}<small>${g.length}</small><span class="sp"></span><em>${fold?'펼치기 ▾':'접기 ▴'}</em></h3>${fold?'':`<div class="entgrid ${U.dense?'dense':''}">${g.map(card).join('')}</div>`}</section>`}).join('')||emptyBox(G)}</div><aside class="side" id="entSide">${sel?detail(sel):'<div class="card dim small">항목을 누르면 여기에 자세히 나와요.</div>'}</aside></div>`;
  const qi=$('#enQ',el);qi.oncompositionend=()=>qi.oninput({isComposing:false});qi.oninput=e=>{if(e.isComposing)return;U.q=qi.value;const v=qi.value;N().render();const q2=$('#enQ');if(q2){q2.focus();q2.setSelectionRange(v.length,v.length)}};
  el.addEventListener('click',e=>{const t=e.target;const tb=t.closest('#enTypes button');if(tb){U.type=tb.dataset.t;N().render();return}
   const ev=t.closest('[data-ev]');if(ev){U.dense=ev.dataset.ev==='list';try{localStorage.setItem(VK,U.dense?'list':'card')}catch(x){}N().render();return}
   const nv=t.closest('[data-enav]');if(nv){const k=U.ids.indexOf(U.sel);const j=k+(+nv.dataset.enav);if(j>=0&&j<U.ids.length){U.sel=U.ids[j];N().render();const c=document.querySelector(`.entcard[data-sel="${CSS.escape(U.sel)}"]`);if(c)c.scrollIntoView({block:'nearest'})}return}
   const ap=t.closest('[data-appear]');if(ap){const [rid,i]=ap.dataset.appear.split('|');if(window.NT_SCEN){if(N().gm())NT_SCEN.write(rid,'ws'+i+'n');else N().go('scen')}return}
   const tm=t.closest('[data-tagmore]');if(tm){U.tagsOpen=!U.tagsOpen;N().render();return}
   const fd=t.closest('[data-fold]');if(fd){U.fold[fd.dataset.fold]=!U.fold[fd.dataset.fold];N().render();return}
   const tg=t.closest('[data-tag]');if(tg){U.tag=tg.dataset.tag===U.tag?'':tg.dataset.tag;N().render();return}
   const c=t.closest('[data-sel]');if(c&&!t.closest('button.btn')){U.sel=c.dataset.sel;N().render();const s=$('#entSide');if(s&&innerWidth<1000)s.scrollIntoView({behavior:'smooth',block:'start'});return}
   const go=t.closest('[data-spot]');if(go){N().go('map');setTimeout(()=>{window.NT_MAP.select(go.dataset.spot);N().render()},0);return}
   const gs=t.closest('[data-gosheet]');if(gs){const [k,id]=gs.dataset.gosheet.split('|');const M=N().MOD.pc;if(M&&M.mode){M.mode(k);M.select(id)}N().go('pc');return}
   const ma=t.closest('[data-mkadd]');if(ma){mkAdd(ma.dataset.mkadd);return}
   const fo=t.closest('[data-fopen]');if(fo){const [id,i]=fo.dataset.fopen.split('|');openText(id,+i);return}
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
 function card(e){const t=tc(e.type);return `<button type="button" class="entcard ${e.id===U.sel?'on':''}" data-sel="${esc(e.id)}" data-id="${esc(e.id)}" data-drag style="--c:${e.color||t[2]}"><span class="face" style="${e.face?`background-image:url('${cssu(e.face)}')`:''}">${e.face?'':t[0][0]}</span><span class="eb"><b>${esc(e.title||'(제목 없음)')}</b><small>${esc(e.sub||'')}</small><span class="etags">${(e.tags||[]).slice(0,3).map(x=>`<em>${esc(x)}</em>`).join('')}${(e.tags||[]).length>3?`<em class="more">+${e.tags.length-3}</em>`:''}${N().visBadge(e._vis,'ents',e.id)}${linkIcons(e)}</span></span></button>`}
 const linkIcons=e=>(e.rb&&e.rb.ch?'<i class="lki" title="룰북과 이어져 있어요">📖</i>':'')+(e.mk?'<i class="lki" title="제작기 트레이너와 이어져 있어요">🎴</i>':'')+((e.files||[]).length?`<i class="lki" title="첨부 ${e.files.length}개">📎${e.files.length}</i>`:'');
 function detail(e){const G=N().gm(),t=tc(e.type);const sec=N().data('sec','ent:'+e.id);const rels=N().list('rels').filter(r=>r.a===e.id||r.b===e.id);
  return `<div class="card entd" style="--c:${e.color||t[2]}"><div class="row" style="gap:6px"><span class="chip static" style="border-color:var(--c);color:var(--c)">${esc(e.type||'')}</span>${window.NT_FAV?NT_FAV.btn('ents',e.id,e.title):''}${N().visBadge(e._vis,'ents',e.id)}<span class="sp"></span>${U.ids.length>1&&U.ids.includes(e.id)?`<span class="entnav"><button class="btn xs ghost" data-enav="-1" ${U.ids[0]===e.id?'disabled':''} title="앞 항목">◀</button><button class="btn xs ghost" data-enav="1" ${U.ids[U.ids.length-1]===e.id?'disabled':''} title="다음 항목">▶</button></span>`:''}${G?`<button class="btn xs" data-e="edit" data-id="${esc(e.id)}">고치기</button><button class="btn xs ghost danger" data-e="del" data-id="${esc(e.id)}">지우기</button>`:''}</div>
   <div class="enthead">${e.face?`<img class="face" src="${esc(e.face)}" alt="" data-big="${esc(e.face)}">`:''}<div><h3>${esc(e.title||'')}</h3>${e.sub?`<div class="dim">${esc(e.sub)}</div>`:''}${(e.tags||[]).length?`<div class="etags">${e.tags.map(x=>`<em>${esc(x)}</em>`).join('')}</div>`:''}</div></div>
   ${e.photo?`<img class="photo" src="${esc(e.photo)}" alt="" data-big="${esc(e.photo)}" loading="lazy">`:''}
   ${e.body?`<p class="pre">${esc(e.body)}</p>`:''}
   ${e.mk?mkBox(e.mk):''}${e.rb&&e.rb.ch&&window.NT_RB?NT_RB.box(e.rb):''}${(e.files||[]).length?filesBox(e):''}
   ${(e.rows||[]).some(r=>r.v)?`<div class="kv">${e.rows.filter(r=>r.v).map(r=>`<b>${esc(r.k)}</b><span class="pre">${esc(r.v)}</span>`).join('')}</div>`:''}
   ${(e.at||[]).length?`<div class="sec">장소</div><div class="row">${e.at.map(id=>`<button class="chip" data-spot="${esc(id)}">📍 ${esc(spotName(id)||id)}</button>`).join('')}</div>`:''}
   ${(e.teams||[]).length?`<div class="sec">소속 · 편</div><div class="row">${e.teams.map(x=>`<span class="chip static">${esc(x)}</span>`).join('')}</div>`:''}
   ${rels.length?`<div class="sec">관계</div><ul class="lnk">${rels.map(r=>{const oid=r.a===e.id?r.b:r.a;const o=N().data('ents',oid);return `<li><button class="linkbtn" data-sel="${esc(oid)}">${esc(o?o.title:'?')}</button> <span class="small dim">${r.a===e.id?'→':'←'} ${esc(r.label||'')}</span></li>`}).join('')}</ul><button class="btn xs ghost" data-e="graph" data-id="${esc(e.id)}">관계도에서 보기</button>`:''}
   ${(()=>{const A=appears(e);return A.length?`<div class="sec">시나리오에 나오는 곳</div><ul class="appear">${A.map(a=>`<li style="--c:${esc(a.c)}"><i class="dot"></i><button class="linkbtn" data-appear="${esc(a.rid)}|${a.i}">${esc(a.route)} · ${a.i+1}. ${esc(a.title)}</button><span class="small dim">${a.why}</span></li>`).join('')}</ul>`:''})()}
   ${G&&sec&&sec.t?`<div class="gmnote"><b>GM 메모</b><div class="pre">${esc(sec.t)}</div></div>`:''}</div>`}
 /* 10-29 망령: 제작기 트레이너 상자 — 랭크 · 파티 · 시트로 가기 */
 function mkBox(tid){const MK=window.NT_MAKER;if(!MK)return '';const t=MK.trainer(tid);const G=N().gm();
  if(!t)return `<div class="mkx"><span class="small dim">🎴 ${MK.M.at?'제작기에서 이 트레이너를 찾지 못했어요 ('+esc(tid)+')':'제작기 트레이너를 읽는 중이에요…'}</span></div>`;
  if(t.priv&&!G&&t.id!==N().me())return '';
  const ms=MK.mons(tid),rk=t.ranks||{};const sheet=N().data('pc',tid)?'pc':N().data('npc',tid)?'npc':'';
  return `<div class="mkx"><span class="por" style="${t.image?`background-image:url('${cssu(t.image)}')`:''}"></span><div class="mb"><div class="row" style="gap:6px"><b>🎴 ${esc(t.name||tid)}</b><small class="dim">제작기 ${t.kind==='npc'?'NPC':'PC'}${t.folder?' · '+esc(MK.folderName(t.folder)):''}</small></div>
   <div class="rk">${['지시','육성','통솔','능력'].map(k=>`<span>${k} <b>${esc(rk[k]||'-')}</b></span>`).join('')}</div>${ms.length?`<div class="mons">${ms.slice(0,6).map(m=>`<i title="${esc(m.name||'')}" style="${MK.img(m)?`background-image:url('${cssu(MK.img(m))}')`:''}">${MK.img(m)?'':esc((m.name||'?')[0])}</i>`).join('')}</div>`:''}</div>
   <div class="acts">${sheet?`<button class="btn xs" data-gosheet="${sheet}|${esc(tid)}">시트 보기</button>`:G?`<button class="btn xs" data-mkadd="${esc(tid)}">시트로 넣기</button>`:''}<a class="btn xs ghost" href="${esc((window.NT_CONFIG||{}).makerUrl||'#')}" target="_blank" rel="noopener">제작기 ↗</a></div></div>`}
 const fsize=n=>!n?'':n>1048576?(n/1048576).toFixed(1)+'MB':n>1024?Math.round(n/1024)+'KB':(n||0)+'B';
 function filesBox(e){const F=e.files||[];const im=F.map((f,i)=>[f,i]).filter(([f])=>f.k==='img'),ot=F.map((f,i)=>[f,i]).filter(([f])=>f.k!=='img');
  return `<div class="sec">첨부 <small class="dim">${F.length}</small></div>${im.length?`<div class="fgrid">${im.map(([f])=>`<figure><img src="${esc(f.u)}" alt="" loading="lazy" data-big="${esc(f.u)}"><figcaption>${esc(f.n||'')}</figcaption></figure>`).join('')}</div>`:''}
   ${ot.length?`<ul class="flist">${ot.map(([f,i])=>f.k==='link'?`<li><a href="${esc(f.u)}" target="_blank" rel="noopener">🔗 ${esc(f.n||f.u)}</a><small class="dim">${esc((()=>{try{return new URL(f.u).host}catch(x){return ''}})())}</small></li>`:`<li><button class="linkbtn" data-fopen="${esc(e.id)}|${i}">📄 ${esc(f.n||'글')}</button><small class="dim">${fsize(f.s||(f.x||'').length)}</small></li>`).join('')}</ul>`:''}`}
 function openText(id,i){const e=N().data('ents',id);const f=e&&(e.files||[])[i];if(!f)return;const md=/\.md$/i.test(f.n||'')&&window.NT_RB;
  N().openModal(`<div class="mhead"><h2>📄 ${esc(f.n||'글')}</h2><span class="sp"></span><button class="btn xs ghost" id="ftDl">내려받기</button><button class="btn ghost" data-x>닫기</button></div><div class="ftxt ${md?'rbx':''}">${md?`<div class="rbbody">${NT_RB.render(f.x||'')}</div>`:`<pre>${esc(f.x||'')}</pre>`}</div>`,'wide');
  $('#ftDl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([f.x||''],{type:'text/plain;charset=utf-8'}));a.download=f.n||'note.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}}
 /* 이 항목이 나오는 시나리오 단계: 단계의 「등장 항목」 이거나, 항목의 장소에서 일어나는 단계 */
 function appears(e){const out=[];const at=new Set(e.at||[]);const R=window.NT_SCEN?NT_SCEN.routes():[];
  for(const r of R)(r.steps||[]).forEach((s,i)=>{const a=(s.ents||[]).includes(e.id),b=s.spot&&at.has(s.spot);if(!a&&!b)return;const sp=s.spot&&N().data('spots',s.spot);out.push({rid:r.id,i,route:r.name||'루트',c:r.color||'#888',title:s.title||(sp?sp.name:'(단계)'),why:a?'등장':'장소'})});
  return out.slice(0,30)}

 const TXTMAX=200*1024;
 async function attach(f){const nm=f.name||'파일';
  if(/^image\//.test(f.type)){const u=await N().upload(f,'photo','file');return {k:'img',u,n:nm.replace(/\.[^.]+$/,''),s:f.size}}
  if(/^text\//.test(f.type)||/\.(txt|md|markdown|csv)$/i.test(nm)){if(f.size>TXTMAX)throw new Error(`「${nm}」 이 너무 커요 (글 파일은 ${TXTMAX/1024}KB 까지)`);return {k:'txt',n:nm,x:await f.text(),s:f.size}}
  throw new Error(`「${nm}」 은 아직 못 올려요 — 그림 · .txt · .md 만 돼요. PDF 는 드라이브 같은 곳에 올리고 「＋ 링크」로 붙여 주세요`)}
 async function mkAdd(tid){const t=window.NT_MAKER&&NT_MAKER.trainer(tid);if(!t)return;const k=t.kind==='npc'?'npc':'pc';await N().put(k,tid,{name:t.name||'',image:t.image||'',player:'',sub:'',log:[],order:N().list(k).length},k==='npc'?'gm':'pub');N().toast((k==='npc'?'NPC':'PC')+' 시트에 넣었어요');N().render()}
 async function act(k,b){const id=b.dataset.id||U.sel;
  if(k==='new'){const nid=N().uid('e');await N().put('ents',nid,{type:U.type||'인물',title:'새 항목',sub:'',body:'',rows:(TPL[U.type||'인물']||[]).map(k=>({k,v:''})),tags:U.tag?[U.tag]:[],teams:[],face:'',photo:'',at:[],created:Date.now(),order:ents().length},'gm');U.sel=nid;edit(nid);N().armDraft('ents',nid);return}
  if(k==='edit')return edit(id);
  if(k==='graph'){const id=U.sel;N().go('graph');setTimeout(()=>window.NT_GRAPH&&NT_GRAPH.focus&&NT_GRAPH.focus(id),0);return}
  if(k==='del'){const e=N().data('ents',id);if(!e||!await N().confirmBox(`「${e.title}」 항목을 지울까요? 관계선도 같이 지워져요.`,'지우기'))return;for(const r of N().list('rels').filter(r=>r.a===id||r.b===id))await N().del('rels',r.id);await N().del('ents',id);if(N().doc('sec','ent:'+id))await N().del('sec','ent:'+id);U.sel='';return}}
 function edit(id){const e=N().data('ents',id);if(!e)return;const sec=N().data('sec','ent:'+id)||{};const spots=N().list('spots');
  const rows=N().clone(e.rows||[]);let face=e.face||'',photo=e.photo||'';let files=N().clone(e.files||[]),rb=e.rb&&e.rb.ch?N().clone(e.rb):null;
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
     <div class="sec">상세 칸 <small class="dim">내용이 빈 칸은 저장하지 않아요</small><span class="sp"></span><button class="btn xs ghost" id="etTpl" title="이 종류의 기본 칸 중 빠진 것을 더해요">칸 틀</button><button class="btn xs" id="etRowAdd">＋ 칸</button></div><div id="etRows" class="rowsed"></div>
     <div class="sec">태그 · 소속</div>
     <div class="mrow"><label class="lbl">태그 (쉼표로)<input id="etTags" type="text" value="${esc((e.tags||[]).join(', '))}"></label><label class="lbl">소속 · 편 (쉼표로)<input id="etTeams" type="text" value="${esc((e.teams||[]).join(', '))}"></label></div>
     <div class="row" style="gap:4px;flex-wrap:wrap">${tags().slice(0,24).map(t=>`<button type="button" class="chip xs" data-addtag="${esc(t)}">${esc(t)}</button>`).join('')}</div>
     <div class="sec">장소</div><div class="row" id="etAt" style="flex-wrap:wrap;gap:4px">${spots.sort((a,b)=>String(a.num||'').localeCompare(String(b.num||''),'ko',{numeric:true})).map(s=>`<label class="chk chip ${(e.at||[]).includes(s.id)?'on':''}"><input type="checkbox" value="${esc(s.id)}" ${(e.at||[]).includes(s.id)?'checked':''} hidden>${esc((s.num?s.num+'. ':'')+s.name)}</label>`).join('')||'<span class="small dim">지도에 장소를 먼저 찍어요</span>'}</div>
     <div class="sec">잇기 <small class="dim">고르면 항목 상세에 바로 보여요 · 사본이 아니라 원본을 읽어요</small></div>
     <div class="mrow"><label class="lbl">📖 제작기 룰북 장<select id="etRb"><option value="">— 잇지 않음 —</option></select></label><label class="lbl">🎴 제작기 트레이너<select id="etMk"><option value="">— 잇지 않음 —</option></select></label></div>
     <div id="etRbH" class="rbpick"></div>
     <div class="sec">첨부 <small class="dim">그림 · .txt · .md · 링크</small><span class="sp"></span><button type="button" class="btn xs" id="etLinkAdd">＋ 링크</button></div>
     <div class="updz files" id="etFiles"><b>＋ 파일</b><span>끌어 놓기 · 클릭 · Ctrl+V — 그림은 줄여서 올리고, 글 파일은 항목 안에 넣어요</span></div>
     <ul class="flist ed" id="etFileList"></ul>
     <div class="sec">GM 메모 <span class="dim">(GM 에게만 보여요)</span></div><textarea id="etSec" rows="3">${esc(sec.t||'')}</textarea>
    </div>
   </div>
   <div class="mfoot"><button class="btn ghost" data-x>취소</button><span class="sp"></span><button class="btn pri" id="etOk">저장</button></div>`,'wide');
  $$('[data-addtag]',md).forEach(b=>b.onclick=()=>{const i=$('#etTags',md);const cur=i.value.split(',').map(x=>x.trim()).filter(Boolean);if(!cur.includes(b.dataset.addtag))cur.push(b.dataset.addtag);i.value=cur.join(', ')});
  const drawRows=()=>{$('#etRows',md).innerHTML=rows.map((r,i)=>`<div class="etrow" data-i="${i}"><input type="text" data-k value="${esc(r.k)}" placeholder="칸 이름"><textarea data-v rows="1" placeholder="내용">${esc(r.v)}</textarea><button class="btn xs ghost danger" data-del title="칸 빼기">×</button></div>`).join('');$$('#etRows textarea',md).forEach(t=>{const g=()=>{t.style.height='auto';t.style.height=Math.min(160,t.scrollHeight+2)+'px'};t.oninput=g;g()});
   $$('.etrow',md).forEach(r=>{const i=+r.dataset.i;r.querySelector('[data-k]').oninput=ev=>rows[i].k=ev.target.value;r.querySelector('[data-v]').oninput=ev=>rows[i].v=ev.target.value;r.querySelector('[data-del]').onclick=()=>{rows.splice(i,1);drawRows()}})};
  $('#etTpl',md).onclick=()=>{const have=new Set(rows.map(r=>r.k.trim()));const add=(TPL[$('#etType',md).value]||[]).filter(k=>!have.has(k));if(!add.length)return N().toast('기본 칸이 이미 다 있어요');add.forEach(k=>rows.push({k,v:''}));drawRows()};
  drawRows();$('#etRowAdd',md).onclick=()=>{rows.push({k:'',v:''});drawRows();const last=$$('.etrow [data-k]',md).pop();if(last)last.focus()};
  $$('#etAt input',md).forEach(c=>c.onchange=()=>c.closest('label').classList.toggle('on',c.checked));
  N().bindDrop($('#etFace',md),async fs=>{try{face=await N().upload(fs[0],'face','face');$('#etFace .pv',md).style.backgroundImage=`url('${cssu(face)}')`}catch(x){N().toast('올리기 실패: '+x.message)}});
  N().bindDrop($('#etPhoto',md),async fs=>{try{photo=await N().upload(fs[0],'photo','photo');$('#etPhoto .pv',md).style.backgroundImage=`url('${cssu(photo)}')`}catch(x){N().toast('올리기 실패: '+x.message)}});
  $('#etFaceX',md).onclick=()=>{face='';$('#etFace .pv',md).style.backgroundImage=''};$('#etPhotoX',md).onclick=()=>{photo='';$('#etPhoto .pv',md).style.backgroundImage=''};
   /* 10-29 망령: 룰북 장 · 제작기 트레이너 · 첨부 */
   const drawRbH=()=>{const box=$('#etRbH',md);if(!rb||!rb.ch||!window.NT_RB){box.innerHTML='';return}const S=NT_RB.sections(rb.ch).filter(x=>x.h);const on=h=>(rb.h||[]).includes(h);
    box.innerHTML=S.length?`<span class="small dim">이 절만 보이기 (안 고르면 장 전체)</span>`+S.map(x=>`<label class="chk chip ${on(x.h)?'on':''}"><input type="checkbox" value="${esc(x.h)}" ${on(x.h)?'checked':''}>${esc(x.h)}</label>`).join(''):'';
    $$('input',box).forEach(c=>c.onchange=()=>{c.closest('label').classList.toggle('on',c.checked);rb.h=$$('input:checked',box).map(x=>x.value)})};
   const fillRb=()=>{const C=NT_RB.chapters();$('#etRb',md).innerHTML='<option value="">— 잇지 않음 —</option>'+C.map(c=>`<option value="${esc(c.id)}" ${rb&&rb.ch===c.id?'selected':''}>${esc(c.title||c.id)}</option>`).join('')+(rb&&!C.some(c=>c.id===rb.ch)?`<option value="${esc(rb.ch)}" selected>${esc(rb.ch)} (룰북에 없음)</option>`:'');drawRbH()};
   if(window.NT_RB){if(NT_RB.R.book)fillRb();else NT_RB.load().then(fillRb)}
   $('#etRb',md).onchange=ev=>{rb=ev.target.value?{ch:ev.target.value,h:[]}:null;drawRbH()};
   const fillMk=()=>{const MK=window.NT_MAKER;if(!MK)return;const cur=$('#etMk',md).value||e.mk||'';const T=MK.trainers();const L=new Set(MK.linkedTrainers().map(t=>t.id));const nm=$('#etTitle',md).value.trim();
    const S=[...T].sort((a,b)=>(b.name===nm)-(a.name===nm)||L.has(b.id)-L.has(a.id)||String(a.name||'').localeCompare(String(b.name||''),'ko'));
    $('#etMk',md).innerHTML='<option value="">— 잇지 않음 —</option>'+S.map(t=>`<option value="${esc(t.id)}" ${cur===t.id?'selected':''}>${esc(t.name||t.id)}${t.kind==='npc'?' · NPC':''}${t.folder?' · '+esc(MK.folderName(t.folder)):''}</option>`).join('')+(cur&&!T.some(t=>t.id===cur)?`<option value="${esc(cur)}" selected>${esc(cur)} (찾지 못함)</option>`:'')};
   fillMk();if(window.NT_MAKER&&!NT_MAKER.M.at)NT_MAKER.load().then(fillMk);
   const drawFiles=()=>{$('#etFileList',md).innerHTML=files.map((f,i)=>`<li data-i="${i}">${f.k==='img'?`<i class="th" style="background-image:url('${cssu(f.u)}')"></i>`:`<i class="th">${f.k==='link'?'🔗':'📄'}</i>`}<input type="text" data-fn value="${esc(f.n||'')}" placeholder="이름"><small class="dim">${f.k==='link'?esc(f.u):fsize(f.s||(f.x||'').length)}</small><button type="button" class="btn xs ghost danger" data-fdel title="빼기">×</button></li>`).join('');
    $$('#etFileList li',md).forEach(li=>{const i=+li.dataset.i;li.querySelector('[data-fn]').oninput=ev=>{files[i].n=ev.target.value};li.querySelector('[data-fdel]').onclick=()=>{files.splice(i,1);drawFiles()}})};
   drawFiles();
   N().bindDrop($('#etFiles',md),async fs=>{for(const f of fs){try{files.push(await attach(f))}catch(x){N().toast(x.message)}drawFiles()}},true,'image/*,.txt,.md,.markdown,.csv,text/plain,text/markdown');
   $('#etLinkAdd',md).onclick=async()=>{const u=((await N().promptBox('링크 주소','','https://…'))||'').trim();if(!u)return;if(!/^https?:\/\/\S+$/i.test(u))return N().toast('https:// 로 시작하는 주소를 적어 주세요');
    const n=await N().promptBox('보일 이름',(()=>{try{return new URL(u).host}catch(x){return ''}})(),'');files.push({k:'link',u,n:(n||'').trim()||u});drawFiles()};
  $('#etOk',md).onclick=async()=>{const split=v=>v.split(',').map(x=>x.trim()).filter(Boolean);
   const n=Object.assign({},e,{type:$('#etType',md).value,title:$('#etTitle',md).value.trim()||'항목',sub:$('#etSub',md).value.trim(),body:$('#etBody',md).value.trim(),rows:rows.map(r=>({k:r.k.trim(),v:r.v.trim()})).filter(r=>r.v),tags:split($('#etTags',md).value),teams:split($('#etTeams',md).value),color:$('#etColor',md).value,at:$$('#etAt input:checked',md).map(c=>c.value),face,photo,rb:rb&&rb.ch?{ch:rb.ch,h:rb.h||[]}:null,mk:$('#etMk',md).value||'',files});
   await N().put('ents',id,n,$('#etVis',md).value);const t=$('#etSec',md).value.trim();if(t)await N().put('sec','ent:'+id,{t},'gm');else if(N().doc('sec','ent:'+id))await N().del('sec','ent:'+id);N().closeModal()}}

 N().MOD.ents={render};
 window.NT_ENTS={TYPES,tc,select:id=>{U.sel=id;N().render()},edit};
})();
