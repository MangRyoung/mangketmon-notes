/* ---------- 관계도 탭 ----------
   노드 = ents (인물 · 조직 …, gx · gy 가 자리). 선 = rels {a, b, label, kind(ally|rival|neutral|''), two(양방향)}.
   GM: 노드 끌어 옮기기 · 빈 곳 더블클릭 = 새 인물 · 「선 잇기」 모드에서 노드 둘 차례로 → 관계 추가 · 선 클릭 = 고치기.
   필터: 종류 · 태그 · 편. 보이는 것만(공개) 그린다. 자리가 없는 노드는 원형으로 펼친다. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const U={zoom:1,px:0,py:0,mode:'move',from:'',sel:'',tag:'',type:'',team:'',hl:''};
 const RK=[['','보통','#9aa0a6'],['ally','우호 · 협력','#3ddc84'],['rival','적대 · 긴장','#ff4d5e'],['love','애정 · 유대','#ff7fa3'],['secret','비밀 · 의혹','#c58bff']];
 const rk=k=>RK.find(x=>x[0]===(k||''))||RK[0];
 const plView=()=>!N().gm()||U.view==='pl';
 const nodes=()=>N().list('ents').filter(e=>(!plView()||e._vis==='pub')&&(!U.type||e.type===U.type)&&(!U.tag||(e.tags||[]).includes(U.tag))&&(!U.team||(e.teams||[]).includes(U.team)));
 const rels=()=>N().list('rels').filter(r=>!plView()||r._vis==='pub');
 const W=1600,H=1000;const BW=2200,BH=1400;const BK=k=>k==='rival'?'doubt':k==='secret'?'secret':'tie';
 let BOARD=null;
 function layout(list){const miss=list.filter(e=>e.gx==null||e.gy==null);if(!miss.length)return;const R=Math.min(W,H)*.38;miss.forEach((e,i)=>{const a=i/miss.length*Math.PI*2-Math.PI/2;e.gx=Math.round(W/2+Math.cos(a)*R);e.gy=Math.round(H/2+Math.sin(a)*R)})}
 function render(el){if(U.gview!=='svg')return renderBoard(el);const G=N().gm();const all=N().list('ents');const list=nodes();layout(list);const ids=new Set(list.map(e=>e.id));const rs=rels().filter(r=>ids.has(r.a)&&ids.has(r.b));
  const tags=[...new Set(all.flatMap(e=>e.tags||[]))].sort((a,b)=>a.localeCompare(b,'ko')),teams=[...new Set(all.flatMap(e=>e.teams||[]))].sort((a,b)=>a.localeCompare(b,'ko'));
  const types=window.NT_ENTS?NT_ENTS.TYPES:[];
  const byId=Object.fromEntries(list.map(e=>[e.id,e]));
  const sel=U.sel?N().data('rels',U.sel):null;
  const nAll=N().list('ents').filter(e=>['인물','조직'].includes(e.type)||true).length,nPub=N().list('ents').filter(e=>e._vis==='pub').length,rPub=N().list('rels').filter(r=>r._vis==='pub').length,rAll=N().list('rels').length;
  el.innerHTML=`<div class="toolbar"><h2>관계도</h2><div class="seg"><button data-gview="board" class="${U.gview!=='svg'?'on':''}">보드</button><button data-gview="svg" class="${U.gview==='svg'?'on':''}">선도</button></div>${G?`<div class="seg"><button data-gv="gm" class="${U.view!=='pl'?'on':''}" title="GM 참고용 — 비공개 인물 · 관계까지 (점선)">🔒 GM 전체 ${nAll}·${rAll}</button><button data-gv="pl" class="${U.view==='pl'?'on':''}" title="PL 에게 보이는 그대로 — 오레마스가 가져가는 것도 이것">👥 PL 공개 ${nPub}·${rPub}</button></div>`:''}
   <select id="grType"><option value="">모든 종류</option>${types.map(([t])=>`<option ${U.type===t?'selected':''}>${t}</option>`).join('')}</select>
   ${tags.length?`<select id="grTag"><option value="">모든 태그</option>${tags.map(t=>`<option ${U.tag===t?'selected':''}>${esc(t)}</option>`).join('')}</select>`:''}
   ${teams.length?`<select id="grTeam"><option value="">모든 편</option>${teams.map(t=>`<option ${U.team===t?'selected':''}>${esc(t)}</option>`).join('')}</select>`:''}
   ${G?`<div class="seg"><button data-gm="move" class="${U.mode==='move'?'on':''}">끌기</button><button data-gm="link" class="${U.mode==='link'?'on':''}">선 잇기${U.from?' · 두 번째 고르기':''}</button></div><button class="btn xs" data-g="newnode">＋ 인물</button><button class="btn xs ghost" data-g="auto">자동 배치</button>`:''}
   <span class="sp"></span>${N().bulkBtns('rels',null,'관계선')}<span class="note">${list.length}명 · ${rs.length}선 · 휠 확대${G&&U.view==='pl'?' · <b style="color:var(--yel)">PL 이 보는 그대로</b>':''}</span><div class="legend">${RK.map(([k,l,c])=>`<span><i style="background:${c}"></i>${l}</span>`).join('')}</div></div>
   <div class="split"><div class="graphwrap" id="grWrap"><svg id="grSvg" viewBox="0 0 ${W} ${H}" style="transform:translate(${U.px}px,${U.py}px) scale(${U.zoom})">
    <defs>${RK.map(([k,,c])=>`<marker id="ar_${k||'n'}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5 0 10z" fill="${c}"/></marker>`).join('')}</defs>
    ${rs.map(r=>{const a=byId[r.a],b=byId[r.b];const k=rk(r.kind);const dx=b.gx-a.gx,dy=b.gy-a.gy,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;const x1=a.gx+ux*46,y1=a.gy+uy*46,x2=b.gx-ux*46,y2=b.gy-uy*46;const mx=(x1+x2)/2,my=(y1+y2)/2;const hl=U.hl&&(r.a===U.hl||r.b===U.hl);
     return `<g class="rel ${r.id===U.sel?'on':''} ${U.hl&&!hl?'dimd':''}" data-rel="${esc(r.id)}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${k[2]}" stroke-width="${hl?5:3}" marker-end="url(#ar_${k[0]||'n'})" ${r.two?`marker-start="url(#ar_${k[0]||'n'})"`:''} ${r.kind==='secret'||r._vis!=='pub'?'stroke-dasharray="10 8"':''} opacity="${r._vis!=='pub'?.75:1}"/><line class="hit" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${r._vis!=='pub'?`<text x="${mx}" y="${my+16}" text-anchor="middle" class="lock">🔒</text>`:''}${r.label?`<text x="${mx}" y="${my-8}" text-anchor="middle" transform="rotate(${(Math.atan2(dy,dx)*180/Math.PI+360)%360>90&&(Math.atan2(dy,dx)*180/Math.PI+360)%360<270?Math.atan2(dy,dx)*180/Math.PI+180:Math.atan2(dy,dx)*180/Math.PI} ${mx} ${my})">${esc(r.label)}</text>`:''}</g>`}).join('')}
    ${list.map(e=>{const t=NT_ENTS.tc(e.type);const c=e.color||t[2];const hl=!U.hl||U.hl===e.id||rs.some(r=>(r.a===U.hl&&r.b===e.id)||(r.b===U.hl&&r.a===e.id));
     return `<g class="node ${U.from===e.id?'from':''} ${hl?'':'dimd'}" data-node="${esc(e.id)}" transform="translate(${e.gx} ${e.gy})"><circle r="44" fill="#0b0b0d" stroke="${c}" stroke-width="${e._vis!=='pub'?3:4}" ${e._vis!=='pub'?'stroke-dasharray="6 5"':''}/>${e.face?`<clipPath id="cp_${esc(e.id)}"><circle r="40"/></clipPath><image href="${esc(e.face)}" x="-40" y="-40" width="80" height="80" preserveAspectRatio="xMidYMid slice" clip-path="url(#cp_${esc(e.id)})"/>`:`<text class="ini" y="8">${esc((e.title||'?')[0])}</text>`}${e._vis!=='pub'?'<text class="lock" x="30" y="-30">🔒</text>':''}<text class="nm" y="66">${esc(e.title||'')}</text>${e.sub?`<text class="sb" y="84">${esc(e.sub.length>18?e.sub.slice(0,17)+'…':e.sub)}</text>`:''}</g>`}).join('')}
   </svg>${!list.length?'<div class="empty" style="position:absolute;inset:40%">항목 탭에서 인물을 만들면 여기에 나와요.</div>':''}</div>
   <aside class="side" id="grSide">${sel?relPanel(sel):(U.hl&&N().data('ents',U.hl)?nodePanel(N().data('ents',U.hl)):`<div class="card dim small">인물을 누르면 그 사람의 관계만 밝게 보여요.${G?' 선을 누르면 고칠 수 있어요. 「선 잇기」에서 두 사람을 차례로 누르면 새 관계가 생겨요.':''}</div>`)}</aside></div>`;
  bind(el,byId)}
 function nodePanel(e){const rs=rels().filter(r=>r.a===e.id||r.b===e.id);return `<div class="card"><div class="row"><h3>${esc(e.title)}</h3>${N().visBadge(e._vis)}<span class="sp"></span>${N().gm()?`<button class="btn xs ${e._vis==='pub'?'':'ghost'}" data-g="visent" data-id="${esc(e.id)}" title="누르면 ${e._vis==='pub'?'GM만':'모두'}">${e._vis==='pub'?'👁 공개':'🔒 비공개'}</button>`:''}<button class="btn xs" data-g="toent" data-id="${esc(e.id)}">항목 보기</button><button class="btn xs ghost" data-g="unhl">닫기</button></div>${e.sub?`<div class="dim small">${esc(e.sub)}</div>`:''}
  <ul class="lnk" style="margin-top:8px">${rs.map(r=>{const oid=r.a===e.id?r.b:r.a;const o=N().data('ents',oid);const k=rk(r.kind);return `<li><i class="kdot" style="background:${k[2]}"></i><button class="linkbtn" data-g="hl" data-id="${esc(oid)}">${esc(o?o.title:'?')}</button> <span class="small dim">${r.a===e.id?'→':'←'} ${esc(r.label||'')}</span>${r._vis!=='pub'?' 🔒':''}${N().gm()?` <button class="linkbtn small" data-g="editrel" data-id="${esc(r.id)}">고치기</button>`:''}</li>`}).join('')||'<li class="dim small">관계가 없어요</li>'}</ul>${N().gm()&&rs.length?`<div class="row" style="gap:4px;margin-top:8px"><button class="btn xs ghost" data-g="relsall" data-id="${esc(e.id)}" data-v="pub">이 사람 관계 모두 공개</button><button class="btn xs ghost" data-g="relsall" data-id="${esc(e.id)}" data-v="gm">모두 비공개</button></div>`:''}</div>`}
 function relPanel(r){const a=N().data('ents',r.a),b=N().data('ents',r.b);const k=rk(r.kind);return `<div class="card"><div class="row"><h3>관계</h3><span class="sp"></span>${N().gm()?`<button class="btn xs ${r._vis==='pub'?'':'ghost'}" data-g="visrel" data-id="${esc(r.id)}">${r._vis==='pub'?'👁 공개':'🔒 비공개'}</button><button class="btn xs" data-g="editrel" data-id="${esc(r.id)}">고치기</button>`:''}<button class="btn xs ghost" data-g="unsel">닫기</button></div>
  <div class="relline"><b>${esc(a?a.title:'?')}</b> <span style="color:${k[2]}">${r.two?'↔':'→'}</span> <b>${esc(b?b.title:'?')}</b></div><div><span class="chip static" style="border-color:${k[2]};color:${k[2]}">${k[1]}</span> ${esc(r.label||'')}</div>${r.note?`<p class="pre small" style="margin-top:6px">${esc(r.note)}</p>`:''}${N().visBadge(r._vis)}</div>`}
 function bind(el,byId){const svg=$('#grSvg',el),wrap=$('#grWrap',el);if(!svg)return;
  const apply=()=>svg.style.transform=`translate(${U.px}px,${U.py}px) scale(${U.zoom})`;
  ['grType','grTag','grTeam'].forEach(id=>{const s=$('#'+id,el);if(s)s.onchange=()=>{U[id==='grType'?'type':id==='grTag'?'tag':'team']=s.value;N().render()}});
  $$('[data-gm]',el).forEach(b=>b.onclick=()=>{U.mode=b.dataset.gm;U.from='';N().render()});
  $$('[data-gv]',el).forEach(b=>b.onclick=()=>{U.view=b.dataset.gv;U.sel='';N().render()});
  $$('[data-gview]',el).forEach(b=>b.onclick=()=>{U.gview=b.dataset.gview;N().render()});
  el.addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b)return;const k=b.dataset.g,id=b.dataset.id;
   if(k==='newnode')return newNode();if(k==='auto')return autoLayout();
   if(k==='visent'){const d=N().doc('ents',id);if(d)N().put('ents',id,d.data,d.vis==='pub'?'gm':'pub');return}
   if(k==='visrel'){const d=N().doc('rels',id);if(d)N().put('rels',id,d.data,d.vis==='pub'?'gm':'pub');return}
   if(k==='relsall'){const v=b.dataset.v;const rows=N().list('rels').filter(r=>(r.a===id||r.b===id)&&r._vis!==v).map(r=>({kind:'rels',id:r.id,data:N().doc('rels',r.id).data,vis:v}));if(rows.length)N().putMany(rows);return}if(k==='toent'){N().go('ents');setTimeout(()=>NT_ENTS.select(id),0);return}
   if(k==='unhl'){U.hl='';N().render();return}if(k==='hl'){U.hl=id;U.sel='';N().render();return}if(k==='unsel'){U.sel='';N().render();return}if(k==='editrel')return editRel(id)});
  wrap.addEventListener('wheel',e=>{e.preventDefault();const r=wrap.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;const z0=U.zoom,z=Math.max(.3,Math.min(4,z0*(e.deltaY<0?1.15:1/1.15)));U.px=mx-(mx-U.px)*z/z0;U.py=my-(my-U.py)*z/z0;U.zoom=z;apply()},{passive:false});
  let pd=null;const toSvg=(x,y)=>{const p=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM().inverse());return {x:p.x,y:p.y}};
  wrap.addEventListener('pointerdown',e=>{if(e.button!==0)return;const nd=e.target.closest('.node');pd={x:e.clientX,y:e.clientY,px:U.px,py:U.py,node:nd&&N().gm()&&U.mode==='move'?nd:null,nodeAny:nd,moved:false,id:e.pointerId};wrap.setPointerCapture(e.pointerId)});
  wrap.addEventListener('pointermove',e=>{if(!pd)return;const dx=e.clientX-pd.x,dy=e.clientY-pd.y;if(!pd.moved&&Math.hypot(dx,dy)<4)return;pd.moved=true;
   if(pd.node){const p=toSvg(e.clientX,e.clientY);pd.node.setAttribute('transform',`translate(${p.x} ${p.y})`);pd.pt=p}else{U.px=pd.px+dx;U.py=pd.py+dy;apply()}});
  const up=async e=>{if(!pd)return;const p=pd;pd=null;try{wrap.releasePointerCapture(p.id)}catch(x){}
   if(p.node&&p.moved&&p.pt){await N().patch('ents',p.node.dataset.node,o=>{o.gx=Math.round(p.pt.x);o.gy=Math.round(p.pt.y)});return}
   if(p.moved)return;
   const nd=e.target.closest('.node');if(nd){const id=nd.dataset.node;if(N().gm()&&U.mode==='link'){if(!U.from){U.from=id;N().render();return}if(U.from===id){U.from='';N().render();return}const from=U.from;U.from='';return newRel(from,id)}U.hl=U.hl===id?'':id;U.sel='';N().render();return}
   const rl=e.target.closest('.rel');if(rl){U.sel=rl.dataset.rel;U.hl='';N().render();return}
   if(U.hl||U.sel){U.hl='';U.sel='';N().render()}};
  wrap.addEventListener('pointerup',up);wrap.addEventListener('pointercancel',()=>{pd=null});
  wrap.addEventListener('dblclick',e=>{if(!N().gm()||e.target.closest('.node,.rel'))return;const p=toSvg(e.clientX,e.clientY);newNode(p)})}
 async function newNode(p){const id=N().uid('e');const pt=p||{x:W/2+Math.random()*200-100,y:H/2+Math.random()*200-100};await N().put('ents',id,{type:'인물',title:'새 인물',sub:'',body:'',rows:[],tags:[],teams:[],face:'',photo:'',at:[],gx:Math.round(pt.x),gy:Math.round(pt.y),created:Date.now()},'gm');NT_ENTS.edit(id)}
 async function autoLayout(){const list=nodes();if(!list.length)return;if(!await N().confirmBox('보이는 인물을 원형으로 다시 배치할까요? (지금 자리는 사라져요)','배치'))return;const R=Math.min(W,H)*.4;const rows=list.map((e,i)=>{const a=i/list.length*Math.PI*2-Math.PI/2;const d=N().clone(N().data('ents',e.id));d.gx=Math.round(W/2+Math.cos(a)*R);d.gy=Math.round(H/2+Math.sin(a)*R);return {kind:'ents',id:e.id,data:d,vis:e._vis}});await N().putMany(rows)}
 async function newRel(a,b){const id=N().uid('r');await N().put('rels',id,{a,b,label:'',kind:'',two:false,note:''},'gm');editRel(id)}
 function editRel(id){const r=N().data('rels',id);if(!r)return;const a=N().data('ents',r.a),b=N().data('ents',r.b);
  const md=N().openModal(`<div class="mhead"><h2>관계 고치기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="relline"><b>${esc(a?a.title:'?')}</b> → <b>${esc(b?b.title:'?')}</b> <button class="btn xs ghost" id="rlSwap">↔ 방향 바꾸기</button></div>
   <div class="mrow"><label class="lbl">관계 (선 위 글)<input id="rlLabel" type="text" value="${esc(r.label||'')}" placeholder="예: 예언에 의지해 마을을 지킨다"></label><label class="lbl">종류<select id="rlKind">${RK.map(([k,l])=>`<option value="${k}" ${k===(r.kind||'')?'selected':''}>${l}</option>`).join('')}</select></label><label class="lbl">공개${N().visSelect(N().doc('rels',id).vis,'rlVis',{noPl:true})}</label></div>
   <label class="chk"><input type="checkbox" id="rlTwo" ${r.two?'checked':''}> 양방향 (↔)</label>
   <label class="lbl" style="margin-top:6px">메모<textarea id="rlNote" rows="3">${esc(r.note||'')}</textarea></label>
   <div class="row" style="margin-top:14px"><button class="btn danger ghost sm" id="rlDel">관계 지우기</button><span class="sp"></span><button class="btn pri" id="rlOk">저장</button></div>`);
  let A=r.a,B=r.b;$('#rlSwap',md).onclick=()=>{[A,B]=[B,A];$('.relline b:first-child',md).textContent=(N().data('ents',A)||{}).title||'?';$('.relline b:nth-of-type(2)',md).textContent=(N().data('ents',B)||{}).title||'?'};
  $('#rlOk',md).onclick=async()=>{await N().put('rels',id,{a:A,b:B,label:$('#rlLabel',md).value.trim(),kind:$('#rlKind',md).value,two:$('#rlTwo',md).checked,note:$('#rlNote',md).value.trim()},$('#rlVis',md).value);U.sel=id;N().closeModal()};
  $('#rlDel',md).onclick=async()=>{await N().del('rels',id);U.sel='';N().closeModal()}}
 /* ---- 코르크보드 ---- */
 function renderBoard(el){const G=N().gm();const all=N().list('ents');const list=nodes().filter(e=>['인물','조직','기타','이벤트'].includes(e.type)||e.face);const types=window.NT_ENTS?NT_ENTS.TYPES:[];
  const tags=[...new Set(all.flatMap(e=>e.tags||[]))].sort((a,b)=>a.localeCompare(b,'ko')),teams=[...new Set(all.flatMap(e=>e.teams||[]))].sort((a,b)=>a.localeCompare(b,'ko'));
  const nAll=all.length,nPub=all.filter(e=>e._vis==='pub').length,rPub=N().list('rels').filter(r=>r._vis==='pub').length,rAll=N().list('rels').length;
  el.innerHTML=`<div class="toolbar"><h2>관계도</h2><div class="seg"><button data-gview="board" class="on">보드</button><button data-gview="svg">선도</button></div>${G?`<div class="seg"><button data-gv="gm" class="${U.view!=='pl'?'on':''}" title="GM 참고용 — 비공개 인물 · 관계까지">🔒 GM 전체 ${nAll}·${rAll}</button><button data-gv="pl" class="${U.view==='pl'?'on':''}" title="PL 에게 보이는 그대로">👥 PL 공개 ${nPub}·${rPub}</button></div>`:''}
   <select id="grType"><option value="">모든 종류</option>${types.map(([t])=>`<option ${U.type===t?'selected':''}>${t}</option>`).join('')}</select>${tags.length?`<select id="grTag"><option value="">모든 태그</option>${tags.map(t=>`<option ${U.tag===t?'selected':''}>${esc(t)}</option>`).join('')}</select>`:''}${teams.length?`<select id="grTeam"><option value="">모든 편</option>${teams.map(t=>`<option ${U.team===t?'selected':''}>${esc(t)}</option>`).join('')}</select>`:''}
   <span class="sp"></span>${N().bulkBtns('rels',null,'관계선')}${G&&U.view==='pl'?'<span class="note"><b style="color:var(--yel)">PL 이 보는 그대로</b></span>':''}</div><div class="cb" id="cbRoot"></div>`;
  $$('#grType,#grTag,#grTeam',el).forEach(sl=>sl.onchange=()=>{U[sl.id==='grType'?'type':sl.id==='grTag'?'tag':'team']=sl.value;N().render()});
  $$('[data-gv]',el).forEach(b=>b.onclick=()=>{U.view=b.dataset.gv;U.sel='';N().render()});$$('[data-gview]',el).forEach(b=>b.onclick=()=>{U.gview=b.dataset.gview;N().render()});
  const groups={};const gOf=e=>(e.teams&&e.teams[0])||e.type||'';list.forEach(e=>{const g=gOf(e);if(!groups[g])groups[g]={name:g||'기타',color:e.color&&!(e.teams&&e.teams[0])?e.color:undefined}});
  const ids=new Set(list.map(e=>e.id));
  const nodesB=list.map(e=>({id:e.id,name:e.title||'?',short:e.title,role:e.sub||e.type||'',img:e.face||e.photo||'',group:gOf(e),x:e.gx!=null?e.gx*BW/W:null,y:e.gy!=null?e.gy*BH/H:null,gmOnly:e._vis!=='pub'}));
  /* 자리 없는 노드: 원형 */
  const miss=nodesB.filter(n=>n.x==null);miss.forEach((n,i)=>{const a=i/miss.length*Math.PI*2-Math.PI/2;n.x=BW/2+Math.cos(a)*BW*.36;n.y=BH/2+Math.sin(a)*BH*.36});
  const edges=rels().filter(r=>ids.has(r.a)&&ids.has(r.b)).map(r=>({id:r.id,a:r.a,b:r.b,kind:BK(r.kind),label:r.label||'',gmOnly:r._vis!=='pub'}));
  if(BOARD)BOARD.destroy();
  BOARD=NT_BOARD.mount($('#cbRoot',el),{nodes:nodesB,edges,groups,W:BW,H:BH,key:'nt-board-'+N().ST.camp,canEdit:G,
   onMove:(id,x,y)=>N().patch('ents',id,d=>{d.gx=Math.round(x*W/BW);d.gy=Math.round(y*H/BH)}),
   onLink:(a,b)=>newRel(a,b),onEdge:id=>{if(G)editRel(id);else{const r=N().data('rels',id);if(r)N().toast((N().data('ents',r.a)||{}).title+' → '+(N().data('ents',r.b)||{}).title+' : '+(r.label||''))}},
   onNew:(x,y)=>newNode({x:x*W/BW,y:y*H/BH}),
   onEmpty:()=>`<p class="empty">보드에서 인물 한 명을 골라 주세요.<br>이어진 실을 정리해 드릴게요.${G?'<br><small style="font-family:var(--font);font-size:12px">끌어서 옮기기 · 빈 곳 두 번 누르면 새 인물 · 「실 잇기」로 관계 추가 · 실을 누르면 고치기</small>':''}</p>`,
   dossier:(id,ctx)=>{const e=N().data('ents',id)||{};const d=N().doc('ents',id)||{};const sec=G?N().data('sec','ent:'+id):null;const rows=(e.rows||[]).filter(r=>r.k||r.v);
    let h=`<h2>${esc(e.title||'?')}${d.vis!=='pub'?'<span class="lock">GM만</span>':''}</h2><p class="rl">${esc([e.type,e.sub].filter(Boolean).join(' · '))}${(e.teams||[]).length?' · '+esc(e.teams.join(' · ')):''}</p>`;
    if(e.body)h+=`<h3>관찰 기록</h3><p>${esc(e.body)}</p>`;
    if(rows.length)h+=`<div class="kv">${rows.map(r=>`<b>${esc(r.k)}</b><span>${esc(r.v)}</span>`).join('')}</div>`;
    if(sec&&sec.t)h+=`<div class="conf"><p>${esc(sec.t)}</p></div>`;
    if(ctx.edges.length)h+=`<h3>이어진 실</h3><ul class="rels">${ctx.edges.map(ed=>{const o=ed.a===id?ed.b:ed.a;const col=ed.kind==='tie'?'var(--cb-red)':ed.kind==='doubt'?'var(--cb-gold)':'var(--cb-noir)';return `<li><i class="${ed.kind}" style="border-color:${col}"></i><button type="button" data-go="${esc(o)}">${esc((ctx.byId[o]||{}).name||'?')}</button><span>${ed.a===id?'→':'←'} ${esc(ed.label||'')}${ed.gmOnly?' 🔒':''}</span>${G?` <button type="button" class="cb-mini" data-ge="${esc(ed.id)}">✎</button>`:''}</li>`}).join('')}</ul>`;
    h+=`<div class="acts"><button type="button" data-g="toent" data-id="${esc(id)}">📇 항목 보기</button>${G?`<button type="button" data-g="visent" data-id="${esc(id)}">${d.vis==='pub'?'🔒 비공개로':'👁 공개로'}</button><button type="button" data-g="relsall" data-id="${esc(id)}" data-v="pub">실 모두 공개</button><button type="button" data-g="relsall" data-id="${esc(id)}" data-v="gm">실 모두 비공개</button><button type="button" data-g="editent" data-id="${esc(id)}">✎ 고치기</button><button type="button" class="del" data-g="delent" data-id="${esc(id)}">🗑 지우기</button>`:''}</div>`;
    return h}});
  el.addEventListener('click',e=>{const ge=e.target.closest('[data-ge]');if(ge){editRel(ge.dataset.ge);return}const b=e.target.closest('[data-g]');if(!b)return;const k=b.dataset.g,id=b.dataset.id;
   if(k==='toent'){N().go('ents');setTimeout(()=>NT_ENTS.select(id),0);return}
   if(k==='editent'){NT_ENTS.edit(id);return}
   if(k==='delent'){(async()=>{const e2=N().data('ents',id)||{};const rs=N().list('rels').filter(r=>r.a===id||r.b===id);if(!await N().confirmBox(`「${e2.title||'?'}」 을(를) 지울까요?${rs.length?` 이어진 실 ${rs.length}개도 같이 지워져요.`:''} 항목 탭에서도 사라져요.`,'지우기'))return;for(const r of rs)await N().del('rels',r.id);if(N().doc('sec','ent:'+id))await N().del('sec','ent:'+id);await N().del('ents',id);N().toast('지웠어요')})();return}
   if(k==='visent'){const d=N().doc('ents',id);if(d)N().put('ents',id,d.data,d.vis==='pub'?'gm':'pub');return}
   if(k==='relsall'){const v=b.dataset.v;const rows=N().list('rels').filter(r=>(r.a===id||r.b===id)&&r._vis!==v).map(r=>({kind:'rels',id:r.id,data:N().doc('rels',r.id).data,vis:v}));if(rows.length)N().putMany(rows)}});
  if(U.hl)BOARD.select(U.hl)}
 N().MOD.graph={render};
 window.NT_GRAPH={RK};
})();
