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
 function segs(mid){const out=[];const S=N().data.bind(N());
  for(const l of links()){const a=S('spots',l.a),b=S('spots',l.b);if(a&&b&&a.map===mid&&b.map===mid)out.push({a,b,color:(routeOf(l.route)||{}).color||'#9aa'})}
  return out}
 /* 루트 한 줄 = 그 지도의 단계 장소를 차례로 이은 폴리라인 (픽셀 좌표). 다른 지도의 단계는 건너뛴다 */
 function routePaths(m){const S=N().data.bind(N());const G=N().gm();const W=+m.w||1000,H=+m.h||700;const out=[];
  for(const r of N().list('routes').sort((a,b)=>(a.order||0)-(b.order||0))){if(r.visible===false&&!G)continue;if(U.hideR&&U.hideR[r.id])continue;
   const pts=(r.steps||[]).map((st,i)=>{const sp=st.spot&&S('spots',st.spot);return sp&&sp.map===m.id?{x:sp.x/100*W,y:sp.y/100*H,st:st.st||'',i}:null}).filter(Boolean);if(pts.length<1)continue;
   out.push({r,pts,hidden:r.visible===false||r._vis!=='pub'})}
  return out}
 function routeSvg(m){const W=+m.w||1000,H=+m.h||700;const k=Math.max(W,H)/1000;/* 지도 크기에 맞춘 굵기 */
  const seg=segs(m.id).map(g=>`<line x1="${g.a.x/100*W}" y1="${g.a.y/100*H}" x2="${g.b.x/100*W}" y2="${g.b.y/100*H}" stroke="${esc(g.color)}" stroke-width="${4*k}" stroke-dasharray="${8*k} ${8*k}" opacity=".7"/>`).join('');
  const rp=routePaths(m).map(({r,pts,hidden})=>{const c=esc(r.color||'#e4002b');const d=pts.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
   const nowI=pts.findIndex(p=>p.st==='now');
   const lab=pts.length>1?{x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2}:{x:pts[0].x,y:pts[0].y-30*k};
   return `<g class="rt ${hidden?'hid':''}" data-rid="${esc(r.id)}">${pts.length>1?`<path d="${d}" stroke="#000" stroke-width="${11*k}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/><path d="${d}" stroke="${c}" stroke-width="${7*k}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${hidden?.5:.9}" ${hidden?`stroke-dasharray="${18*k} ${14*k}"`:''}/>`:''}
    ${pts.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="${(p.st==='now'?15:11)*k}" fill="${['done','skip','fail'].includes(p.st)?'#222':c}" stroke="${p.st==='now'?'#fff':'#fff'}" stroke-width="${3*k}" opacity="${['done','skip','fail'].includes(p.st)?.9:1}"/><text x="${p.x}" y="${p.y+4.5*k}" font-size="${12*k}" text-anchor="middle" fill="#fff" font-weight="bold" paint-order="stroke" stroke="#000" stroke-width="${2*k}">${p.i+1}</text>`).join('')}
    <text x="${lab.x+14*k}" y="${lab.y-10*k}" font-size="${15*k}" fill="${c}" stroke="#000" stroke-width="${4*k}" paint-order="stroke" font-weight="bold">${esc(r.name||'')}${nowI>=0?' ▶':''}</text></g>`}).join('');
  return `<svg class="maplinks" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${seg}${rp}</svg>`}
 /* 장소에 있는 인물(얼굴 있는 항목)을 핀 옆에 둥근 초상으로 */
 function npcLayer(m,sp){const ents=N().list('ents').filter(e=>e.face&&(e.at||[]).length);const out=[];
  for(const s of sp){const es=ents.filter(e=>e.at.includes(s.id));es.forEach((e,i)=>out.push(`<button type="button" class="mnpc ${e._vis!=='pub'?'hid':''}" data-ent="${esc(e.id)}" style="left:calc(${s.x}% + ${14+i*26}px);top:${s.y}%;background-image:url('${cssu(e.face)}')" title="${esc(e.title)}"><i>${esc(e.title)}</i></button>`))}
  return out.join('')}

 function mapSelHtml(m){const G=N().gm();return maps().length>1||G?`<select id="mapSel">${maps().map(x=>`<option value="${esc(x.id)}" ${x.id===m.id?'selected':''}>${esc(x.name||'지도')}${x.kind==='globe'?' (지구본)':''}</option>`).join('')}</select>`:''}
 window.NT.BULKF.spots=()=>{const m=curMap();return (id,d)=>m&&d.data.map===m.id};
 function render(el){const m=curMap(),G=N().gm();
  if(m&&m.kind==='globe'&&window.NT_GLOBE){NT_GLOBE.render(el,m);bind(el);return}
  if(!m){el.innerHTML=`<div class="toolbar"><h2>지도</h2></div><div class="empty">아직 지도가 없어요.${G?'<br><button class="btn sm pri" data-m="newmap" style="margin-top:10px">＋ 지도 만들기 (그림 올리기)</button>':''}</div>`;bind(el);return}
  const sp=spots(m.id).filter(s=>!U.filter||s.kind===U.filter);
  const sel=U.sel&&N().data('spots',U.sel)?Object.assign({id:U.sel},N().data('spots',U.sel)):null;
  el.innerHTML=`<div class="toolbar"><h2>지도</h2>${maps().length>1||G?`<select id="mapSel">${maps().map(x=>`<option value="${esc(x.id)}" ${x.id===m.id?'selected':''}>${esc(x.name||'지도')}</option>`).join('')}</select>`:''}
   <div class="seg" id="mapKinds"><button data-k="" class="${!U.filter?'on':''}">전체</button>${KINDS.map(([k,,c])=>`<button data-k="${k}" class="${U.filter===k?'on':''}" style="--c:${c}"><i class="kdot"></i>${k}</button>`).join('')}</div>
   ${G?`<div class="seg"><button data-mode="sel" class="${U.mode==='sel'?'on':''}">고르기 · 끌기</button><button data-mode="add" class="${U.mode==='add'?'on':''}">＋ 장소 찍기</button></div>`:''}
   <span class="sp"></span>${N().bulkBtns('spots',null,'이 지도의 장소')}<span class="note">${sp.length}곳${G?' · 휠 확대 · 빈 곳 끌어 이동':' · 휠 확대'}</span>
   ${G?`<button class="btn xs" data-m="mapedit">지도 설정</button><button class="btn xs ghost" data-m="newmap">＋ 지도</button>`:''}</div>
   <div class="split">
    <div class="mapwrap" id="mapWrap" data-mode="${U.mode}" style="--ar:${m.w&&m.h?(m.h/m.w).toFixed(4):0.66}"><div class="mapinner" id="mapInner" style="transform:translate(${U.px}px,${U.py}px) scale(${U.zoom});${m.w?`aspect-ratio:${m.w}/${m.h}`:''}">
     ${m.img?`<img class="mapimg" src="${esc(m.img)}" alt="${esc(m.name)}" draggable="false">`:'<div class="mapimg blank"></div>'}
     ${routeSvg(m)}
     ${sp.map(s=>{const k=kc(s.kind);const party=m.party===s.id;return `<button type="button" class="pin ${s.id===U.sel?'on':''} ${s._vis!=='pub'?'hid':''} ${party?'party':''}" data-pin="${esc(s.id)}" style="left:${s.x}%;top:${s.y}%;--c:${k[2]}" title="${esc(s.name)}${s._vis!=='pub'?' ('+N().visLabel(s._vis)+')':''}"><i></i><b>${esc(s.num||'')}</b><span>${esc(s.name)}</span>${party?'<em>PC</em>':''}</button>`}).join('')}
     ${npcLayer(m,sp)}
    </div></div>
    <aside class="side" id="mapSide">${sel?spotPanel(sel,m):mapPanel(m,sp)}</aside></div>`;
  bind(el);fit(el,m)}
 function legendHtml(){return `<div class="legend">${KINDS.map(([k,,c])=>`<span><i style="background:${c}"></i>${k}</span>`).join('')}<span><i class="pc"></i>PC 위치</span></div>`}
 function routeLegend(mid){const G=N().gm();const S=N().data.bind(N());const rs=N().list('routes').filter(r=>(r.visible!==false||G)&&(r.steps||[]).some(x=>x.spot&&S('spots',x.spot)&&S('spots',x.spot).map===mid)).sort((a,b)=>(a.order||0)-(b.order||0));if(!rs.length)return '';
  return `<div class="sec">루트 <small class="dim">이름을 누르면 지도에서 감추기 · 보이기</small></div><div class="rlegend">${rs.map(r=>`<div class="rl ${U.hideR&&U.hideR[r.id]?'off':''}"><button type="button" class="rlname" data-rt="${esc(r.id)}"><i style="background:${esc(r.color||'#888')}"></i><span>${esc(r.name||'')}</span></button>${r._vis!=='pub'?'<em class="visb gm">🔒 GM</em>':''}${G?`<button type="button" class="btn xs ${r._vis==='pub'?'':'ghost'}" data-rvis="${esc(r.id)}" title="${r._vis==='pub'?'누르면 PL 에게 감춤 (GM만)':'누르면 PL 에게 공개'}">${r._vis==='pub'?'👁 공개':'🔒 비공개'}</button>`:''}</div>`).join('')}</div>`}
 function mapPanel(m,sp){const G=N().gm();return `<div class="card"><h3>${esc(m.name||'지도')} ${N().visBadge(m._vis)}</h3>${m.d?`<p class="pre small">${esc(m.d)}</p>`:''}${legendHtml()}${routeLegend(m.id)}
   <div class="splist">${sp.sort((a,b)=>String(a.num||'').localeCompare(String(b.num||''),'ko',{numeric:true})).map(s=>`<button type="button" class="sprow" data-go="${esc(s.id)}"><i style="background:${kc(s.kind)[2]}"></i><b>${esc(s.num||'')}</b><span>${esc(s.name)}</span><small>${esc(s.area||'')}</small>${N().visBadge(s._vis)}</button>`).join('')||'<div class="small dim">장소가 없어요. '+(G?'「＋ 장소 찍기」로 지도 위를 눌러요.':'')+'</div>'}</div></div>`}
 function spotPanel(s,m){const G=N().gm(),k=kc(s.kind);const ents=entsAt(s.id);const ls=links().filter(l=>l.a===s.id||l.b===s.id);
  const head=`<div class="card spot" style="--c:${k[2]}"><div class="row" style="gap:6px"><button class="linkbtn" data-go="">← 목록</button>${window.NT_FAV?NT_FAV.btn('spots',s.id,s.name):''}<span class="sp"></span>${G?`<button class="btn xs" data-m="edit">고치기</button><button class="btn xs ${m.party===s.id?'pri':'ghost'}" data-m="party" title="PC 들이 지금 있는 곳">PC 위치</button>`:''}</div>
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
   const rt=t.closest('[data-rt]');if(rt){U.hideR=U.hideR||{};U.hideR[rt.dataset.rt]=!U.hideR[rt.dataset.rt];N().render();return}
   const rv=t.closest('[data-rvis]');if(rv){const r=N().doc('routes',rv.dataset.rvis);if(r)N().put('routes',rv.dataset.rvis,r.data,r.vis==='pub'?'gm':'pub');return}
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
   <div class="mrow"><label class="lbl">종류<select id="mpKind"><option value="" ${m.kind!=='globe'?'selected':''}>그림 지도 (핀 · 루트)</option><option value="globe" ${m.kind==='globe'?'selected':''}>지구본 · 관측실 (위도 · 경도 특이점)</option></select></label><label class="lbl" style="grid-column:span 2">특이점 번호 목록 <small class="dim">(지구본용 · 쉼표로 · 빈 번호는 「미관측」 가림막)</small><input id="mpSlots" type="text" value="${esc((m.slots||[]).join(', '))}" placeholder="예: 序, I, II, III, IV, V, VI, VII, EX"></label></div>
   <div class="sec">지도 그림 <small class="dim">(지구본이면 안 써요)</small></div><div class="updz" id="mpDz"><div class="pv" style="${m.img?`background-image:url('${cssu(m.img)}')`:''}"></div><b>＋ 그림 올리기</b><span>끌어 놓기 · 클릭 · Ctrl+V — 올릴 때 3200px 안으로 줄여요</span></div>
   <div class="row" style="margin-top:8px"><input type="text" id="mpImg" placeholder="또는 그림 주소 https://…" value="${esc(m.img||'')}" style="flex:1"></div>
   <div class="row" style="margin-top:14px"><button class="btn danger ghost sm" id="mpDel">지도 지우기</button><span class="sp"></span><button class="btn pri" id="mpOk">저장</button></div>`);
  N().bindDrop($('#mpDz',md),async fs=>{try{const u=await N().upload(fs[0],'map','map');$('#mpImg',md).value=u;$('#mpDz .pv',md).style.backgroundImage=`url('${cssu(u)}')`}catch(e){N().toast('올리기 실패: '+e.message)}});
  $('#mpOk',md).onclick=async()=>{const img=$('#mpImg',md).value.trim();let w=m.w||0,h=m.h||0;if(img&&img!==m.img){try{const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=img});w=im.naturalWidth;h=im.naturalHeight}catch(e){}}
   await N().put('maps',id,Object.assign({},m,{name:$('#mpName',md).value.trim()||'지도',order:+$('#mpOrd',md).value||0,d:$('#mpD',md).value.trim(),img,w,h,kind:$('#mpKind',md).value,slots:$('#mpSlots',md).value.split(/[,，]/).map(x=>x.trim()).filter(Boolean)}),$('#mpVis',md).value);N().closeModal();U.fitDone=false;N().render()};
  $('#mpDel',md).onclick=async()=>{if(!await N().confirmBox(`「${m.name}」 지도를 지울까요? 이 지도의 장소 ${spots(id).length}곳도 같이 지워져요.`,'지우기'))return;for(const s of spots(id))await N().del('spots',s.id);await N().del('maps',id);N().closeModal();U.map='';U.sel='';N().render()}}
 function editSpot(id){const s=N().data('spots',id);if(!s)return;const sec=N().data('sec','spot:'+id)||{};const GL=(N().data('maps',s.map)||{}).kind==='globe';const LF=(N().MOD.logs&&N().MOD.logs.folders())||[];
  const md=N().openModal(`<div class="mhead"><h2>${GL?'특이점 고치기':'장소 고치기'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="mrow"><label class="lbl">${GL?'특이점 번호':'번호'}<input id="spNum" type="text" value="${esc(s.num||'')}" style="width:70px"></label><label class="lbl" style="grid-column:span 2">이름<input id="spName" type="text" value="${esc(s.name||'')}"></label>
    ${GL?`<label class="lbl">상태<select id="spStatus">${[['active','진행 중'],['cleared','수복 완료'],['unobserved','미관측']].map(([v,l])=>`<option value="${v}" ${(s.status||'active')===v?'selected':''}>${l}</option>`).join('')}</select></label><label class="lbl">장소<input id="spArea" type="text" value="${esc(s.area||'')}" placeholder="예: 해양유전기지 세라픽스"></label><label class="lbl">연대<input id="spYear" type="text" value="${esc(s.year||'')}" placeholder="예: 2015"></label><label class="lbl">위도<input id="spLat" type="number" step="0.1" min="-90" max="90" value="${esc(s.y)}"></label><label class="lbl">경도<input id="spLon" type="number" step="0.1" min="-180" max="180" value="${esc(s.x)}"></label><label class="lbl">기록 폴더 <small class="dim">(정리기 보관소)</small><select id="spLogf"><option value="">— 없음 —</option>${LF.map(f=>`<option value="${esc(f.id)}" ${f.id===s.logf?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label>`:`<label class="lbl">종류<select id="spKind">${KINDS.map(([k])=>`<option ${k===s.kind?'selected':''}>${k}</option>`).join('')}</select></label><label class="lbl">구역<input id="spArea" type="text" value="${esc(s.area||'')}" placeholder="예: 마을 북서쪽"></label>`}<label class="lbl">공개${N().visSelect(N().doc('spots',id).vis,'spVis',{noPl:true})}</label></div>
   <label class="lbl">${GL?'공개 기록 <small class="dim">(줄마다 한 항목으로 보여요)</small>':'요약'}<textarea id="spSum" rows="4">${esc(s.summary||'')}</textarea></label>
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
  $('#spOk',md).onclick=async()=>{const n=Object.assign({},s,{num:$('#spNum',md).value.trim(),name:$('#spName',md).value.trim()||'장소',kind:GL?(s.kind||'사건'):$('#spKind',md).value,area:$('#spArea',md).value.trim(),summary:$('#spSum',md).value.trim(),items:$('#spItems',md).value.trim(),img,imgs});if(GL){n.status=$('#spStatus',md).value;n.year=$('#spYear',md).value.trim();n.y=+$('#spLat',md).value||0;n.x=+$('#spLon',md).value||0;n.logf=$('#spLogf',md).value}
   await N().put('spots',id,n,$('#spVis',md).value);const t=$('#spSec',md).value.trim();if(t)await N().put('sec','spot:'+id,{t},'gm');else if(N().doc('sec','spot:'+id))await N().del('sec','spot:'+id);N().closeModal()};
  $('#spDel',md).onclick=async()=>{if(!await N().confirmBox(`「${s.name}」 를 지울까요? 이어진 선도 같이 지워져요.`,'지우기'))return;for(const l of links().filter(l=>l.a===id||l.b===id))await N().del('links',l.id);await N().del('spots',id);if(N().doc('sec','spot:'+id))await N().del('sec','spot:'+id);U.sel='';N().closeModal()}}

 N().MOD.map={render};
 window.NT_MAP={KINDS,selectMap:id=>{U.map=id;U.sel='';U.fitDone=false},select:id=>{const s=N().data('spots',id);if(s){U.map=s.map;U.sel=id;U.fitDone=false;if(window.NT_GLOBE)NT_GLOBE.select&&(NT_GLOBE.st||0)}},curMap,spots};
 N().MOD.map=Object.assign(N().MOD.map||{},{editSpot,editMap,curMap,mapSelHtml});
})();
