/* ---------- 지도 탭 ----------
   maps: {name, img, w, h, order, party(spot id), d(설명)}   spots: {map, x, y, name, num, kind, area, summary, items, img, imgs[{p,t}]}
   links: {a, b, route, note}  — 시나리오 루트가 그은 선 (scen_ui 와 공유)
   GM: 빈 곳 클릭 = 장소 추가 · 핀 끌기 = 옮기기 · 핀 클릭 = 오른쪽에 편집. 구경 · PL: 공개된 핀만, 클릭하면 정보. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const KINDS=[['대화','talk','#1e88e5'],['사건','event','#f08a00'],['조우','enc','#e11d48'],['하이라이트','high','#ffd23f'],['휴식','rest','#00a676'],['기타','etc','#8e8e8e']];
 const kc=k=>(KINDS.find(x=>x[0]===k)||KINDS[KINDS.length-1]);
 const U={map:'',sel:'',zoom:1,px:0,py:0,drag:null,mode:'sel',filter:''};
 const maps=()=>N().list('maps').sort((a,b)=>(a.order||0)-(b.order||0));
 const spots=m=>N().list('spots').filter(s=>s.map===m);
 const links=()=>N().list('links');
 const curMap=()=>{const L=maps();if(!L.length)return null;let m=L.find(x=>x.id===U.map);if(!m){m=L[0];U.map=m.id}return m};
 const spotNm=id=>{const x=N().data('spots',id);return x?x.name:''};
 const entsAt=sid=>N().list('ents').filter(e=>(e.at||[]).includes(sid));
 const routeOf=id=>N().data('routes',id);
 /* 지도 위 선: 루트의 이웃 단계(장소가 있는 것끼리) + 자유 연결(links). 지도에 선 숨김(visible=false)인 루트는 GM 에게만 점선으로 */
 function segs(mid){const out=[];const S=N().data.bind(N());const G=N().gm();
  for(const r of N().list('routes')){if(r.visible===false&&!G)continue;const st=(r.steps||[]).filter(x=>x.spot&&S('spots',x.spot)&&S('spots',x.spot).map===mid);for(let i=1;i<st.length;i++){const a=S('spots',st[i-1].spot),b=S('spots',st[i].spot);out.push({a,b,color:r.color||'#fff',dash:r.visible===false,done:['done','skip','fail'].includes(st[i].st),now:st[i].st==='now'})}}
  for(const l of links()){const a=S('spots',l.a),b=S('spots',l.b);if(a&&b&&a.map===mid&&b.map===mid)out.push({a,b,color:(routeOf(l.route)||{}).color||'#9aa',dash:false})}
  return out}

 function render(el){const m=curMap(),G=N().gm();
  if(!m){el.innerHTML=`<div class="toolbar"><h2>지도</h2></div><div class="empty">아직 지도가 없어요.${G?'<br><button class="btn sm pri" data-m="newmap" style="margin-top:10px">＋ 지도 만들기 (그림 올리기)</button>':''}</div>`;bind(el);return}
  const sp=spots(m.id).filter(s=>!U.filter||s.kind===U.filter);
  const sel=U.sel?N().data('spots',U.sel):null;
  el.innerHTML=`<div class="toolbar"><h2>지도</h2>${maps().length>1||G?`<select id="mapSel">${maps().map(x=>`<option value="${esc(x.id)}" ${x.id===m.id?'selected':''}>${esc(x.name||'지도')}</option>`).join('')}</select>`:''}
   <div class="seg" id="mapKinds"><button data-k="" class="${!U.filter?'on':''}">전체</button>${KINDS.map(([k,,c])=>`<button data-k="${k}" class="${U.filter===k?'on':''}" style="--c:${c}"><i class="kdot"></i>${k}</button>`).join('')}</div>
   ${G?`<div class="seg"><button data-mode="sel" class="${U.mode==='sel'?'on':''}">고르기 · 끌기</button><button data-mode="add" class="${U.mode==='add'?'on':''}">＋ 장소 찍기</button></div>`:''}
   <span class="sp"></span><span class="note">${sp.length}곳${G?' · 휠 확대 · 빈 곳 끌어 이동':' · 휠 확대'}</span>
   ${G?`<button class="btn xs" data-m="mapedit">지도 설정</button><button class="btn xs ghost" data-m="newmap">＋ 지도</button>`:''}</div>
   <div class="split">
    <div class="mapwrap" id="mapWrap" data-mode="${U.mode}" style="--ar:${m.w&&m.h?(m.h/m.w).toFixed(4):0.66}"><div class="mapinner" id="mapInner" style="transform:translate(${U.px}px,${U.py}px) scale(${U.zoom});${m.w?`aspect-ratio:${m.w}/${m.h}`:''}">
     ${m.img?`<img class="mapimg" src="${esc(m.img)}" alt="${esc(m.name)}" draggable="false">`:'<div class="mapimg blank"></div>'}
     <svg class="maplinks" viewBox="0 0 100 100" preserveAspectRatio="none">${segs(m.id).map(g=>`<line x1="${g.a.x}" y1="${g.a.y}" x2="${g.b.x}" y2="${g.b.y}" stroke="${esc(g.color)}" stroke-width="${g.now?3.2:2.2}" ${g.dash?'stroke-dasharray="6 5"':''} vector-effect="non-scaling-stroke" opacity="${g.done?'.95':'.7'}"/>`).join('')}</svg>
     ${sp.map(s=>{const k=kc(s.kind);const party=m.party===s.id;return `<button type="button" class="pin ${s.id===U.sel?'on':''} ${s._vis!=='pub'?'hid':''} ${party?'party':''}" data-pin="${esc(s.id)}" style="left:${s.x}%;top:${s.y}%;--c:${k[2]}" title="${esc(s.name)}${s._vis!=='pub'?' ('+N().visLabel(s._vis)+')':''}"><i></i><b>${esc(s.num||'')}</b><span>${esc(s.name)}</span>${party?'<em>PC</em>':''}</button>`}).join('')}
    </div></div>
    <aside class="side" id="mapSide">${sel?spotPanel(sel,m):mapPanel(m,sp)}</aside></div>`;
  bind(el);fit(el,m)}
 function legendHtml(){return `<div class="legend">${KINDS.map(([k,,c])=>`<span><i style="background:${c}"></i>${k}</span>`).join('')}<span><i class="pc"></i>PC 위치</span></div>`}
 function mapPanel(m,sp){const G=N().gm();return `<div class="card"><h3>${esc(m.name||'지도')} ${N().visBadge(m._vis)}</h3>${m.d?`<p class="pre small">${esc(m.d)}</p>`:''}${legendHtml()}
   <div class="splist">${sp.sort((a,b)=>String(a.num||'').localeCompare(String(b.num||''),'ko',{numeric:true})).map(s=>`<button type="button" class="sprow" data-go="${esc(s.id)}"><i style="background:${kc(s.kind)[2]}"></i><b>${esc(s.num||'')}</b><span>${esc(s.name)}</span><small>${esc(s.area||'')}</small>${N().visBadge(s._vis)}</button>`).join('')||'<div class="small dim">장소가 없어요. '+(G?'「＋ 장소 찍기」로 지도 위를 눌러요.':'')+'</div>'}</div></div>`}
 function spotPanel(s,m){const G=N().gm(),k=kc(s.kind);const ents=entsAt(s.id);const ls=links().filter(l=>l.a===s.id||l.b===s.id);
  const head=`<div class="card spot" style="--c:${k[2]}"><div class="row" style="gap:6px"><button class="linkbtn" data-go="">← 목록</button><span class="sp"></span>${G?`<button class="btn xs" data-m="edit">고치기</button><button class="btn xs ${m.party===s.id?'pri':'ghost'}" data-m="party" title="PC 들이 지금 있는 곳">PC 위치</button>`:''}</div>
   <h3><i class="kdot" style="background:${k[2]}"></i>${s.num?`<b class="num">${esc(s.num)}</b>`:''}${esc(s.name||'(이름 없음)')} <small>${esc(s.kind||'')}${s.area?' · '+esc(s.area):''}</small>${N().visBadge(s._vis)}</h3>`;
  const imgs=[s.img?{p:s.img,t:''}:null,...(s.imgs||[])].filter(Boolean);
  const body=`${imgs.length?`<div class="spimgs">${imgs.map(x=>`<figure><img src="${esc(x.p)}" alt="${esc(x.t||s.name)}" loading="lazy" data-big="${esc(x.p)}">${x.t?`<figcaption>${esc(x.t)}</figcaption>`:''}</figure>`).join('')}</div>`:''}
   ${s.summary?`<p class="pre">${esc(s.summary)}</p>`:''}${s.items?`<div class="kv"><b>얻을 것</b><span>${esc(s.items)}</span></div>`:''}
   ${ents.length?`<div class="sec">이 곳의 항목</div><div class="entchips">${ents.map(e=>`<button type="button" class="chip" data-ent="${esc(e.id)}">${esc(e.title)}</button>`).join('')}</div>`:''}
   ${(()=>{const rs=N().list('routes').filter(r=>(r.steps||[]).some(x=>x.spot===s.id));return rs.length?`<div class="sec">시나리오</div><ul class="lnk">${rs.map(r=>{const i=r.steps.findIndex(x=>x.spot===s.id);const prev=r.steps[i-1],next=r.steps[i+1];const nm=x=>x?(x.title||spotNm(x.spot)):'';return `<li><span style="color:${esc(r.color||'#fff')}">${esc(r.name)}</span> <span class="small dim">${i+1}단계${prev?' · 앞: '+esc(nm(prev)):''}${next?' · 다음: '+esc(nm(next)):''}${r.steps[i].note?' · '+esc(r.steps[i].note):''}</span></li>`}).join('')}</ul>`:''})()}
   ${ls.length?`<div class="sec">이어진 곳</div><ul class="lnk">${ls.map(l=>{const o=N().data('spots',l.a===s.id?l.b:l.a);const r=routeOf(l.route);return `<li><button class="linkbtn" data-go="${esc(l.a===s.id?l.b:l.a)}">${esc(o?o.name:'?')}</button>${r?` <span class="small" style="color:${esc(r.color||'#fff')}">${esc(r.name||'')}</span>`:''}${l.note?` <span class="small dim">${esc(l.note)}</span>`:''}</li>`}).join('')}</ul>`:''}
   ${G&&N().data('sec','spot:'+s.id)?`<div class="gmnote"><b>GM 메모</b><div class="pre">${esc(N().data('sec','spot:'+s.id).t||'')}</div></div>`:''}</div>`;
  return head+body}

 function fit(el,m){const w=$('#mapWrap',el);if(!w)return;if(!U.fitDone||U.fitMap!==m.id){U.zoom=1;U.px=0;U.py=0;U.fitDone=true;U.fitMap=m.id;const inner=$('#mapInner',el);inner.style.transform=`translate(0px,0px) scale(1)`}}
 function apply(el){const inner=$('#mapInner',el);if(inner)inner.style.transform=`translate(${U.px}px,${U.py}px) scale(${U.zoom})`;const w=$('#mapWrap',el);if(w)w.classList.toggle('lbl',U.zoom>=1.8)}
 function bind(el){
  const sel=$('#mapSel',el);if(sel)sel.onchange=()=>{U.map=sel.value;U.sel='';U.fitDone=false;N().render()};
  $$('#mapKinds button',el).forEach(b=>b.onclick=()=>{U.filter=b.dataset.k;N().render()});
  $$('[data-mode]',el).forEach(b=>b.onclick=()=>{U.mode=b.dataset.mode;N().render()});
  el.addEventListener('click',e=>{const t=e.target;const g=t.closest('[data-go]');if(g){U.sel=g.dataset.go;N().render();return}
   const en=t.closest('[data-ent]');if(en){N().go('ents');setTimeout(()=>window.NT_ENTS&&NT_ENTS.select(en.dataset.ent),0);return}
   const big=t.closest('img[data-big]');if(big){N().openModal(`<img src="${esc(big.dataset.big)}" style="max-width:100%;max-height:80vh;display:block;margin:auto">`,'wide');return}
   const mb=t.closest('[data-m]');if(mb)return act(mb.dataset.m)});
  const w=$('#mapWrap',el);if(!w)return;
  w.addEventListener('wheel',e=>{e.preventDefault();const r=w.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;const z0=U.zoom;const z=Math.max(.4,Math.min(6,z0*(e.deltaY<0?1.15:1/1.15)));U.px=mx-(mx-U.px)*z/z0;U.py=my-(my-U.py)*z/z0;U.zoom=z;apply(el)},{passive:false});
  let pd=null;const pts=new Map();let pinch=null;
  w.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:U.zoom,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,px:U.px,py:U.py};pd=null;return}if(e.button!==0)return;const pin=e.target.closest('.pin');pd={x:e.clientX,y:e.clientY,px:U.px,py:U.py,pin:pin&&N().gm()&&U.mode==='sel'?pin:null,moved:false,id:e.pointerId};w.setPointerCapture(e.pointerId)});
  w.addEventListener('pointermove',e=>{if(pts.has(e.pointerId))pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pinch&&pts.size>=2){const [a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y)||1;const z=Math.max(.4,Math.min(6,pinch.z*d/pinch.d));const r=w.getBoundingClientRect();const mx=pinch.cx-r.left,my=pinch.cy-r.top;U.px=mx-(mx-pinch.px)*z/pinch.z;U.py=my-(my-pinch.py)*z/pinch.z;U.zoom=z;apply(el);return}
   if(!pd)return;const dx=e.clientX-pd.x,dy=e.clientY-pd.y;if(!pd.moved&&Math.hypot(dx,dy)<4)return;pd.moved=true;
   if(pd.pin){const r=$('#mapInner',el).getBoundingClientRect();pd.pin.style.left=((e.clientX-r.left)/r.width*100)+'%';pd.pin.style.top=((e.clientY-r.top)/r.height*100)+'%';pd.pin.classList.add('dragging')}
   else{U.px=pd.px+dx;U.py=pd.py+dy;apply(el)}});
  const up=async e=>{pts.delete(e.pointerId);if(pinch){if(pts.size<2)pinch=null;return}if(!pd)return;const p=pd;pd=null;try{w.releasePointerCapture(p.id)}catch(x){}
   if(p.pin&&p.moved){const r=$('#mapInner',el).getBoundingClientRect();const x=+((e.clientX-r.left)/r.width*100).toFixed(2),y=+((e.clientY-r.top)/r.height*100).toFixed(2);await N().patch('spots',p.pin.dataset.pin,s=>{s.x=Math.max(0,Math.min(100,x));s.y=Math.max(0,Math.min(100,y))});return}
   if(p.moved)return;
   const pin=e.target.closest('.pin');if(pin){U.sel=pin.dataset.pin;N().render();return}
   if(N().gm()&&U.mode==='add'){const r=$('#mapInner',el).getBoundingClientRect();const x=+((e.clientX-r.left)/r.width*100).toFixed(2),y=+((e.clientY-r.top)/r.height*100).toFixed(2);if(x<0||x>100||y<0||y>100)return;addSpot(x,y)}};
  w.addEventListener('pointerup',up);w.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);pd=null;if(pts.size<2)pinch=null})}

 async function addSpot(x,y){const m=curMap();const n=spots(m.id).length+1;const id=N().uid('s');const ok=await N().put('spots',id,{map:m.id,x,y,name:'새 장소',num:String(n),kind:'대화',area:'',summary:'',items:'',img:'',imgs:[]},'gm');if(ok){U.sel=id;U.mode='sel';N().render();editSpot(id)}}
 async function act(k){const m=curMap();
  if(k==='newmap'){const name=await N().promptBox('지도 이름','','예: 무진 전체');if(name==null)return;const id=N().uid('m');await N().put('maps',id,{name:name.trim()||'지도',img:'',w:0,h:0,order:maps().length,d:''});U.map=id;U.fitDone=false;N().render();editMap(id);return}
  if(k==='mapedit')return editMap(m.id);
  if(k==='edit')return editSpot(U.sel);
  if(k==='party'){await N().patch('maps',m.id,x=>{x.party=x.party===U.sel?'':U.sel});return}}
 function editMap(id){const m=N().data('maps',id);if(!m)return;const md=N().openModal(`<div class="mhead"><h2>지도 설정</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="mrow"><label class="lbl">이름<input id="mpName" type="text" value="${esc(m.name||'')}"></label><label class="lbl">순서<input id="mpOrd" type="number" class="n" value="${m.order||0}"></label><label class="lbl">공개${N().visSelect(N().doc('maps',id).vis,'mpVis',{noPl:true})}</label></div>
   <label class="lbl">설명<textarea id="mpD" rows="2">${esc(m.d||'')}</textarea></label>
   <div class="sec">지도 그림</div><div class="updz" id="mpDz"><div class="pv" style="${m.img?`background-image:url('${cssu(m.img)}')`:''}"></div><b>＋ 그림 올리기</b><span>끌어 놓기 · 클릭 · Ctrl+V — 올릴 때 3200px 안으로 줄여요</span></div>
   <div class="row" style="margin-top:8px"><input type="text" id="mpImg" placeholder="또는 그림 주소 https://…" value="${esc(m.img||'')}" style="flex:1"></div>
   <div class="row" style="margin-top:14px"><button class="btn danger ghost sm" id="mpDel">지도 지우기</button><span class="sp"></span><button class="btn pri" id="mpOk">저장</button></div>`);
  N().bindDrop($('#mpDz',md),async fs=>{try{const u=await N().upload(fs[0],'map','map');$('#mpImg',md).value=u;$('#mpDz .pv',md).style.backgroundImage=`url('${cssu(u)}')`}catch(e){N().toast('올리기 실패: '+e.message)}});
  $('#mpOk',md).onclick=async()=>{const img=$('#mpImg',md).value.trim();let w=m.w||0,h=m.h||0;if(img&&img!==m.img){try{const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=img});w=im.naturalWidth;h=im.naturalHeight}catch(e){}}
   await N().put('maps',id,Object.assign({},m,{name:$('#mpName',md).value.trim()||'지도',order:+$('#mpOrd',md).value||0,d:$('#mpD',md).value.trim(),img,w,h}),$('#mpVis',md).value);N().closeModal();U.fitDone=false;N().render()};
  $('#mpDel',md).onclick=async()=>{if(!await N().confirmBox(`「${m.name}」 지도를 지울까요? 이 지도의 장소 ${spots(id).length}곳도 같이 지워져요.`,'지우기'))return;for(const s of spots(id))await N().del('spots',s.id);await N().del('maps',id);N().closeModal();U.map='';U.sel='';N().render()}}
 function editSpot(id){const s=N().data('spots',id);if(!s)return;const sec=N().data('sec','spot:'+id)||{};
  const md=N().openModal(`<div class="mhead"><h2>장소 고치기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="mrow"><label class="lbl">번호<input id="spNum" type="text" value="${esc(s.num||'')}" style="width:70px"></label><label class="lbl" style="grid-column:span 2">이름<input id="spName" type="text" value="${esc(s.name||'')}"></label>
    <label class="lbl">종류<select id="spKind">${KINDS.map(([k])=>`<option ${k===s.kind?'selected':''}>${k}</option>`).join('')}</select></label><label class="lbl">구역<input id="spArea" type="text" value="${esc(s.area||'')}" placeholder="예: 마을 북서쪽"></label><label class="lbl">공개${N().visSelect(N().doc('spots',id).vis,'spVis',{noPl:true})}</label></div>
   <label class="lbl">요약<textarea id="spSum" rows="4">${esc(s.summary||'')}</textarea></label>
   <label class="lbl" style="margin-top:6px">얻을 것 · 아이템<input id="spItems" type="text" value="${esc(s.items||'')}"></label>
   <div class="sec">그림</div><div class="row" style="align-items:stretch"><div class="updz" id="spDz" style="width:150px"><div class="pv" style="${s.img?`background-image:url('${cssu(s.img)}')`:''}"></div><b>대표 그림</b></div>
    <div style="flex:1;min-width:200px"><div id="spImgs">${(s.imgs||[]).map((x,i)=>`<div class="row spimgrow" data-i="${i}"><img src="${esc(x.p)}" alt=""><input type="text" data-t value="${esc(x.t||'')}" placeholder="설명" style="flex:1"><button class="btn xs ghost danger" data-del>×</button></div>`).join('')}</div><div class="updz" id="spDz2" style="min-height:44px"><b>＋ 그림 더하기</b><span>여러 장 가능</span></div></div></div>
   <div class="sec">GM 메모 <span class="dim">(GM 에게만)</span></div><textarea id="spSec" rows="3">${esc(sec.t||'')}</textarea>
   <div class="row" style="margin-top:14px"><button class="btn danger ghost sm" id="spDel">장소 지우기</button><span class="sp"></span><button class="btn pri" id="spOk">저장</button></div>`);
  const imgs=N().clone(s.imgs||[]);let img=s.img||'';
  const drawImgs=()=>{$('#spImgs',md).innerHTML=imgs.map((x,i)=>`<div class="row spimgrow" data-i="${i}"><img src="${esc(x.p)}" alt=""><input type="text" data-t value="${esc(x.t||'')}" placeholder="설명" style="flex:1"><button class="btn xs ghost danger" data-del>×</button></div>`).join('');
   $$('.spimgrow',md).forEach(r=>{r.querySelector('[data-t]').oninput=e=>imgs[+r.dataset.i].t=e.target.value;r.querySelector('[data-del]').onclick=()=>{imgs.splice(+r.dataset.i,1);drawImgs()}})};
  drawImgs();
  N().bindDrop($('#spDz',md),async fs=>{try{img=await N().upload(fs[0],'thumb','spot');$('#spDz .pv',md).style.backgroundImage=`url('${cssu(img)}')`}catch(e){N().toast('올리기 실패: '+e.message)}});
  N().bindDrop($('#spDz2',md),async fs=>{for(const f of fs){try{imgs.push({p:await N().upload(f,'photo','spot'),t:''})}catch(e){N().toast('올리기 실패: '+e.message)}}drawImgs()},true);
  $('#spOk',md).onclick=async()=>{const n=Object.assign({},s,{num:$('#spNum',md).value.trim(),name:$('#spName',md).value.trim()||'장소',kind:$('#spKind',md).value,area:$('#spArea',md).value.trim(),summary:$('#spSum',md).value.trim(),items:$('#spItems',md).value.trim(),img,imgs});
   await N().put('spots',id,n,$('#spVis',md).value);const t=$('#spSec',md).value.trim();if(t)await N().put('sec','spot:'+id,{t},'gm');else if(N().doc('sec','spot:'+id))await N().del('sec','spot:'+id);N().closeModal()};
  $('#spDel',md).onclick=async()=>{if(!await N().confirmBox(`「${s.name}」 를 지울까요? 이어진 선도 같이 지워져요.`,'지우기'))return;for(const l of links().filter(l=>l.a===id||l.b===id))await N().del('links',l.id);await N().del('spots',id);if(N().doc('sec','spot:'+id))await N().del('sec','spot:'+id);U.sel='';N().closeModal()}}

 N().MOD.map={render};
 window.NT_MAP={KINDS,select:id=>{const s=N().data('spots',id);if(s){U.map=s.map;U.sel=id;U.fitDone=false}},curMap,spots};
})();
