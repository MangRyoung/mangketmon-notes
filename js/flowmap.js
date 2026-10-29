/* ---------- 시나리오 흐름도 (10-29 망령 「쓰기에서 쓰고, 흐름도에선 자유롭게 끌어 배치하고 선끼리 잇는 느낌」) ----------
   단계 하나 = 카드 하나. 같은 루트의 이웃 단계는 루트 색 선, 루트의 next[] 는 마지막 단계 → 다음 루트 첫 단계 점선.
   GM: 카드를 끌어 옮기면 단계의 fx · fy 에 저장. 카드 오른쪽 점을 끌어 다른 카드에 놓으면 「갈림길 선」 — 출발 단계의 루트 links[{a,b,label}] (a · b = 단계 sid).
   단계 sid 는 처음 흐름도를 연 GM 이 없는 단계에만 붙인다. 판 옮기기 = 빈 곳 끌기, 확대 = 휠 · 단추. */
"use strict";
window.NT_FLOWMAP=(()=>{
 const N=()=>window.NT;const esc=s=>N().esc(s);
 const W=200,GX=250,GY=150,X0=60,Y0=70;
 const V={};   /* 캠페인마다 판 위치 {x,y,z} */
 const vKey=()=>'nt_fm_'+N().ST.camp;
 const view=()=>{const k=N().ST.camp;if(!V[k]){try{V[k]=JSON.parse(localStorage.getItem(vKey())||'null')}catch(e){}if(!V[k])V[k]={x:0,y:0,z:1,fit:1}}return V[k]};
 const saveV=()=>{try{localStorage.setItem(vKey(),JSON.stringify(view()))}catch(e){}};
 const STL={'':'',now:'진행 중',done:'끝',skip:'건너뜀',fail:'실패'};
 const spotName=id=>{const s=N().data('spots',id);return s?(s.num?s.num+'. ':'')+s.name:''};
 const keyOf=(r,s,i)=>s.sid||(r.id+'#'+i);
 /* 노드 목록과 기본 자리: 부(group) 순서대로 루트마다 한 줄 */
 function nodes(R){const out=[];let row=0;
  for(const r of R){(r.steps||[]).forEach((s,i)=>{const fx=Number.isFinite(+s.fx)&&s.fx!==''&&s.fx!=null,fy=Number.isFinite(+s.fy)&&s.fy!==''&&s.fy!=null;
    out.push({k:keyOf(r,s,i),r,s,i,x:fx?+s.fx:X0+i*GX,y:fy?+s.fy:Y0+row*GY,auto:!(fx&&fy)})});if((r.steps||[]).length)row++}
  return out}
 const ensuring=new Set();
 async function ensureSids(R){if(!N().gm())return;for(const r of R){if(!(r.steps||[]).some(s=>!s.sid)||ensuring.has(r.id))continue;ensuring.add(r.id);
  try{await N().patch('routes',r.id,x=>{(x.steps||[]).forEach(s=>{if(!s.sid)s.sid=N().uid('s')})})}finally{ensuring.delete(r.id)}}}
 function html(){return `<div class="fm" id="fm"><div class="fm-world"><svg class="fm-svg" width="10" height="10"><defs>
   <marker id="fmA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs><g class="fm-edges"></g><path class="fm-temp" d=""/></svg><div class="fm-nodes"></div></div>
  <div class="fm-tools"><button type="button" class="btn xs" data-fm="out" title="작게">−</button><button type="button" class="btn xs" data-fm="fit" title="한눈에">맞춤</button><button type="button" class="btn xs" data-fm="in" title="크게">＋</button>${N().gm()?'<button type="button" class="btn xs ghost" data-fm="auto" title="모든 카드를 루트마다 한 줄로 다시 놓아요">다시 줄 세우기</button>':''}</div>
  <div class="fm-help small dim">${N().gm()?'카드 끌기 = 옮기기 · 카드 오른쪽 점을 끌어 다른 카드에 놓기 = 갈림길 선 · 선 누르기 = 이름 · 지우기 · 빈 곳 끌기 = 판 옮기기 · 휠 = 확대':'빈 곳 끌기 = 판 옮기기 · 휠 = 확대 · 카드 누르기 = 읽기'}</div></div>`}
 function nodeHtml(n,G){const r=n.r,s=n.s,c=r.color||'#888';const sp=s.spot?spotName(s.spot):'';const ne=(s.ents||[]).length;
  return `<div class="fm-n st-${s.st||'none'}" data-k="${esc(n.k)}" style="left:${n.x}px;top:${n.y}px;--c:${esc(c)}"><div class="fm-h"><i></i><span>${esc(r.name||'루트')}</span><b>${n.i+1}</b></div>
   <div class="fm-t">${esc(s.title||sp||'(단계)')}</div>
   <div class="fm-m">${sp&&s.title?`<span>📍 ${esc(sp)}</span>`:''}${s.read?'<span title="낭독 · 묘사가 있어요">❝</span>':''}${ne?`<span title="등장 항목">👤${ne}</span>`:''}${s.st?`<em>${STL[s.st]||''}</em>`:''}</div>
   ${G?'<span class="fm-port" title="끌어서 다른 카드에 놓으면 선이 이어져요"></span>':''}</div>`}
 function mount(root){const fm=root.querySelector('#fm');if(!fm)return;const G=N().gm();const R=window.NT_SCEN.routes();
  ensureSids(R);
  const world=fm.querySelector('.fm-world'),svg=fm.querySelector('.fm-svg'),eg=fm.querySelector('.fm-edges'),temp=fm.querySelector('.fm-temp'),nl=fm.querySelector('.fm-nodes');
  const NS=nodes(R);const byK={};NS.forEach(n=>byK[n.k]=n);const bySid={};NS.forEach(n=>{if(n.s.sid)bySid[n.s.sid]=n});
  nl.innerHTML=NS.map(n=>nodeHtml(n,G)).join('')||'<div class="fm-empty small dim">단계가 없어요. 「쓰기」에서 루트에 단계를 넣어요.</div>';
  const el=k=>nl.querySelector(`.fm-n[data-k="${CSS.escape(k)}"]`);
  const box=n=>{const e=el(n.k);return {x:n.x,y:n.y,w:e?e.offsetWidth:W,h:e?e.offsetHeight:70}};
  const v=view();const apply=()=>{world.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.z})`};
  /* 선 */
  function path(a,b){const A=box(a),B=box(b);const ac={x:A.x+A.w/2,y:A.y+A.h/2},bc={x:B.x+B.w/2,y:B.y+B.h/2};const dx=bc.x-ac.x,dy=bc.y-ac.y;
   let p1,p2,c1,c2;if(Math.abs(dx)>=Math.abs(dy)*.8){const sg=dx>=0?1:-1;p1={x:sg>0?A.x+A.w:A.x,y:ac.y};p2={x:sg>0?B.x:B.x+B.w,y:bc.y};const m=Math.max(40,Math.abs(p2.x-p1.x)/2);c1={x:p1.x+sg*m,y:p1.y};c2={x:p2.x-sg*m,y:p2.y}}
   else{const sg=dy>=0?1:-1;p1={x:ac.x,y:sg>0?A.y+A.h:A.y};p2={x:bc.x,y:sg>0?B.y:B.y+B.h};const m=Math.max(30,Math.abs(p2.y-p1.y)/2);c1={x:p1.x,y:p1.y+sg*m};c2={x:p2.x,y:p2.y-sg*m}}
   return {d:`M${p1.x} ${p1.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`,mx:(p1.x+3*c1.x+3*c2.x+p2.x)/8,my:(p1.y+3*c1.y+3*c2.y+p2.y)/8}}
  function draw(){let h='';let maxX=400,maxY=300;NS.forEach(n=>{const b=box(n);maxX=Math.max(maxX,b.x+b.w+80);maxY=Math.max(maxY,b.y+b.h+80)});svg.setAttribute('width',maxX);svg.setAttribute('height',maxY);
   for(const r of R){const S=(r.steps||[]);const c=r.color||'#888';
    for(let i=0;i+1<S.length;i++){const a=byK[keyOf(r,S[i],i)],b=byK[keyOf(r,S[i+1],i+1)];if(a&&b)h+=`<path class="fm-e seq" d="${path(a,b).d}" stroke="${esc(c)}" marker-end="url(#fmA)"/>`}
    const last=S.length?byK[keyOf(r,S[S.length-1],S.length-1)]:null;
    for(const nid of r.next||[]){const nr=R.find(x=>x.id===nid);const f=nr&&(nr.steps||[])[0];const b=f&&byK[keyOf(nr,f,0)];if(last&&b)h+=`<path class="fm-e nxt" d="${path(last,b).d}" marker-end="url(#fmA)"/>`}
    (r.links||[]).forEach((L,li)=>{const a=bySid[L.a],b=bySid[L.b];if(!a||!b)return;const p=path(a,b);h+=`<g class="fm-lk" data-lk="${esc(r.id)}|${li}"><path class="fm-e hit" d="${p.d}"/><path class="fm-e link" d="${p.d}" marker-end="url(#fmA)"/>${L.label?`<text x="${p.mx}" y="${p.my-6}" text-anchor="middle">${esc(L.label)}</text>`:''}</g>`})}
   eg.innerHTML=h}
  function fit(){if(!fm.isConnected||!fm.clientWidth)return;const B=NS.map(box);if(!B.length){v.x=20;v.y=20;v.z=1;apply();return}const x0=Math.min(...B.map(b=>b.x))-40,y0=Math.min(...B.map(b=>b.y))-40,x1=Math.max(...B.map(b=>b.x+b.w))+40,y1=Math.max(...B.map(b=>b.y+b.h))+40;
   const z=Math.max(.25,Math.min(1.2,fm.clientWidth/(x1-x0),fm.clientHeight/(y1-y0)));v.z=z;v.x=(fm.clientWidth-(x1-x0)*z)/2-x0*z;v.y=Math.max(10,(fm.clientHeight-(y1-y0)*z)/2)-y0*z;v.fit=0;apply();saveV()}
  const zoomAt=(z,cx,cy)=>{const z2=Math.max(.25,Math.min(2,z));v.x=cx-(cx-v.x)*z2/v.z;v.y=cy-(cy-v.y)*z2/v.z;v.z=z2;v.fit=0;apply();saveV()};
  apply();requestAnimationFrame(()=>{if(!fm.isConnected)return;draw();if(v.fit)fit()});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(fm.isConnected)draw()}).catch(()=>{});
  fm.addEventListener('wheel',e=>{e.preventDefault();const r=fm.getBoundingClientRect();zoomAt(v.z*(e.deltaY<0?1.12:1/1.12),e.clientX-r.left,e.clientY-r.top)},{passive:false});
  fm.querySelector('.fm-tools').addEventListener('click',async e=>{const b=e.target.closest('[data-fm]');if(!b)return;e.stopPropagation();const k=b.dataset.fm;const c=[fm.clientWidth/2,fm.clientHeight/2];
   if(k==='in')zoomAt(v.z*1.2,...c);else if(k==='out')zoomAt(v.z/1.2,...c);else if(k==='fit')fit();
   else if(k==='auto'){if(!await N().confirmBox('모든 카드를 루트마다 한 줄로 다시 놓을까요? 옮겨 둔 자리는 사라져요.','다시 놓기'))return;for(const r of R)if((r.steps||[]).some(s=>s.fx!=null||s.fy!=null))await N().patch('routes',r.id,x=>{(x.steps||[]).forEach(s=>{delete s.fx;delete s.fy})});v.fit=1;saveV();N().render()}});
  /* 끌기: 빈 곳 = 판, 카드 = 옮기기(GM), 점 = 선 잇기(GM) */
  const toWorld=(cx,cy)=>{const r=fm.getBoundingClientRect();return {x:(cx-r.left-v.x)/v.z,y:(cy-r.top-v.y)/v.z}};
  let drag=null;
  fm.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.fm-tools'))return;const port=e.target.closest('.fm-port'),node=e.target.closest('.fm-n'),lk=e.target.closest('.fm-lk');
   if(lk)return;
   if(port&&G){const n=byK[port.closest('.fm-n').dataset.k];drag={t:'link',n};fm.classList.add('linking')}
   else if(node){const n=byK[node.dataset.k];drag={t:'node',n,el:node,ox:n.x,oy:n.y,sx:e.clientX,sy:e.clientY,moved:false}}
   else drag={t:'pan',sx:e.clientX,sy:e.clientY,ox:v.x,oy:v.y};
   fm.setPointerCapture(e.pointerId);e.preventDefault()});
  fm.addEventListener('pointermove',e=>{if(!drag)return;
   if(drag.t==='pan'){v.x=drag.ox+e.clientX-drag.sx;v.y=drag.oy+e.clientY-drag.sy;apply();return}
   if(drag.t==='node'){const dx=(e.clientX-drag.sx)/v.z,dy=(e.clientY-drag.sy)/v.z;if(!drag.moved&&Math.hypot(dx,dy)<4)return;if(!G)return;drag.moved=true;drag.el.classList.add('drag');drag.n.x=Math.round(drag.ox+dx);drag.n.y=Math.round(drag.oy+dy);drag.el.style.left=drag.n.x+'px';drag.el.style.top=drag.n.y+'px';draw();return}
   if(drag.t==='link'){const A=box(drag.n);const p=toWorld(e.clientX,e.clientY);const x1=A.x+A.w,y1=A.y+A.h/2;temp.setAttribute('d',`M${x1} ${y1} C${x1+60} ${y1} ${p.x-60} ${p.y} ${p.x} ${p.y}`);
    nl.querySelectorAll('.fm-n.target').forEach(x=>x.classList.remove('target'));const over=document.elementFromPoint(e.clientX,e.clientY);const t=over&&over.closest&&over.closest('.fm-n');if(t&&t.dataset.k!==drag.n.k)t.classList.add('target')}});
  const end=async e=>{const d=drag;drag=null;if(!d)return;fm.classList.remove('linking');temp.setAttribute('d','');
   if(d.t==='pan'){saveV();return}
   if(d.t==='node'){d.el.classList.remove('drag');if(!d.moved){const S=window.NT_SCEN;if(G&&(e.shiftKey||e.altKey))return S.cycleStep(d.n.r.id,d.n.i);return G?S.stepMenu(d.n.r.id,d.n.i):S.stepRead(d.n.r.id,d.n.i)}
    /* 같은 루트의 자리 잡히지 않은 카드도 지금 보이는 자리로 같이 적어 둔다 (한 장만 옮겨도 나머지가 튀지 않게) */
    const r=d.n.r;const pos={};NS.filter(n=>n.r.id===r.id).forEach(n=>pos[n.i]=[n.x,n.y]);await N().patch('routes',r.id,x=>{(x.steps||[]).forEach((s,i)=>{if(pos[i]){s.fx=pos[i][0];s.fy=pos[i][1]}})});return}
   if(d.t==='link'){const over=document.elementFromPoint(e.clientX,e.clientY);const t=over&&over.closest&&over.closest('.fm-n');nl.querySelectorAll('.fm-n.target').forEach(x=>x.classList.remove('target'));if(!t)return;const b=byK[t.dataset.k];if(!b||b===d.n)return;
    if(!d.n.s.sid||!b.s.sid)return N().toast('단계 이름표를 붙이는 중이에요 — 잠시 뒤 다시');
    if((d.n.r.links||[]).some(L=>L.a===d.n.s.sid&&L.b===b.s.sid))return N().toast('이미 이어져 있어요');
    await N().patch('routes',d.n.r.id,x=>{x.links=(x.links||[]).concat([{a:d.n.s.sid,b:b.s.sid,label:''}])});N().toast('선을 이었어요 — 선을 누르면 이름을 붙일 수 있어요')}};
  fm.addEventListener('pointerup',end);fm.addEventListener('pointercancel',()=>{drag=null;fm.classList.remove('linking');temp.setAttribute('d','')});
  /* 갈림길 선 누르기 */
  eg.addEventListener('click',async e=>{const g=e.target.closest('.fm-lk');if(!g)return;const [rid,li]=g.dataset.lk.split('|');const r=N().data('routes',rid);const L=r&&(r.links||[])[+li];if(!L)return;
   if(!G){if(L.label)N().toast(L.label);return}
   const md=N().openModal(`<div class="mhead"><h2>갈림길 선</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><label class="lbl">이름 (조건 · 선택지)<input type="text" id="fmL" value="${esc(L.label||'')}" placeholder="예: 열쇠가 있으면 · 학장을 믿으면"></label>
    <div class="mfoot"><button class="btn ghost danger" id="fmDel">선 지우기</button><span class="sp"></span><button class="btn pri" id="fmOk">저장</button></div>`);
   md.querySelector('#fmOk').onclick=async()=>{const v2=md.querySelector('#fmL').value.trim();N().closeModal();await N().patch('routes',rid,x=>{const y=(x.links||[]).find(z=>z.a===L.a&&z.b===L.b);if(y)y.label=v2})};
   md.querySelector('#fmDel').onclick=async()=>{N().closeModal();await N().patch('routes',rid,x=>{x.links=(x.links||[]).filter(z=>!(z.a===L.a&&z.b===L.b))})};
   setTimeout(()=>{const i=md.querySelector('#fmL');if(i)i.focus()},30)})}
 return {html,mount};
})();
