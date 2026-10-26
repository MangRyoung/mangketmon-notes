/* ---------- 시나리오 탭 ----------
   routes: {name, group, color, entry(들어오는 조건), goal, note, next[route id], order, visible, steps:[{spot, title, note, st('' | now | done | skip | fail)}]}
   단계는 장소(지도) 또는 제목만. 지도에는 같은 루트의 이웃 단계 사이에 선이 그어진다(map_ui). vis 로 PL 에게 숨길 수 있다. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const U={group:'',sel:'',step:-1};
 const routes=()=>N().list('routes').sort((a,b)=>(a.order||0)-(b.order||0));
 const groups=()=>[...new Set(routes().map(r=>(r.group||'').trim()))].sort((a,b)=>a.localeCompare(b,'ko'));
 const prog=r=>{const s=r.steps||[];const done=s.filter(x=>['done','skip','fail'].includes(x.st)).length;const now=s.findIndex(x=>x.st==='now');return {n:s.length,done,now,pct:s.length?Math.round(done/s.length*100):0}};
 const spotName=id=>{const s=N().data('spots',id);return s?(s.num?s.num+'. ':'')+s.name:''};
 const stepTitle=st=>st.title||spotName(st.spot)||'(단계)';
 const PAL=['#1e88e5','#00a676','#8e44ad','#f08a00','#e11d48','#ffd23f','#26c6da','#8d6e63','#7cb342','#f5f5f5'];
 const U2={view:'flow'};
 function render(el){const G=N().gm();const all=routes();const gs=groups();if(U.group&&!gs.includes(U.group))U.group='';
  const tot=all.reduce((a,r)=>a+(r.steps||[]).length,0),dn=all.reduce((a,r)=>a+prog(r).done,0);
  el.innerHTML=`<div class="toolbar"><h2>시나리오</h2><span class="note">${all.length}개 루트 · 단계 ${dn} / ${tot}</span><div class="seg"><button data-sv="flow" class="${U2.view==='flow'?'on':''}">흐름도</button><button data-sv="list" class="${U2.view==='list'?'on':''}">목록</button></div>${gs.length>1&&U2.view==='list'?`<div class="seg"><button data-sg="" class="${!U.group?'on':''}">전체</button>${gs.map(g=>`<button data-sg="${esc(g)}" class="${U.group===g?'on':''}">${esc(g||'분류 없음')}</button>`).join('')}</div>`:''}<span class="sp"></span>${G?'<button class="btn sm pri" data-s="new">＋ 루트</button>':''}</div>
   ${nowStrip(all)}
   ${!all.length?`<div class="empty">시나리오 루트가 없어요.${G?' 「＋ 루트」로 만들고 단계(장소)를 차례로 넣어요.':''}</div>`:U2.view==='flow'?flowHtml(all,gs):gs.filter(g=>!U.group||U.group===g).map(g=>`<section class="sgroup"><div class="sgh"><span>${esc(g||'분류 없음')}</span><span class="small dim">${all.filter(r=>(r.group||'').trim()===g).length}개 루트</span></div>${all.filter(r=>(r.group||'').trim()===g).map(lane).join('')}</section>`).join('')}`;
  el.addEventListener('click',e=>{const t=e.target;const sv=t.closest('[data-sv]');if(sv){U2.view=sv.dataset.sv;N().render();return}
   const sg=t.closest('[data-sg]');if(sg){U.group=sg.dataset.sg;N().render();return}
   const nx=t.closest('[data-gonext]');if(nx){const c=el.querySelector(`.fcard[data-route="${CSS.escape(nx.dataset.gonext)}"]`);if(c){c.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),1200)}return}
   const st=t.closest('[data-step]');if(st){const rid=st.closest('[data-route]').dataset.route;const i=+st.dataset.step;if(G)return stepMenu(rid,i);const s=(N().data('routes',rid).steps||[])[i];if(s&&s.spot){N().go('map');setTimeout(()=>{NT_MAP.select(s.spot);N().render()},0)}return}
   const b=t.closest('[data-s]');if(b)act(b.dataset.s,b)});
  if(U2.view==='flow')requestAnimationFrame(()=>drawFlow(el))}
 /* ---- 흐름도: 부(group)마다 세로 열, 루트 카드 안에 단계 체크리스트, next[] 는 화살표 ---- */
 const STI={done:'✓',now:'▶',skip:'↷',fail:'✗','':''};
 function flowHtml(all,gs){const G=N().gm();
  return `<div class="flow" id="flow"><svg class="flowsvg"></svg>${gs.map(g=>`<div class="fcol"><div class="fcolh">${esc(g||'분류 없음')}</div>${all.filter(r=>(r.group||'').trim()===g).map(fcard).join('')}</div>`).join('')}</div>`}
 function fcard(r){const G=N().gm();const p=prog(r);const c=r.color||'#888';const nx=(r.next||[]).map(id=>N().data('routes',id)).filter(Boolean);const hid=r.visible===false||r._vis!=='pub';const S=N().data.bind(N());
  return `<article class="fcard ${hid?'hid':''} ${p.now>=0?'active':p.n&&p.done===p.n?'done':''}" data-route="${esc(r.id)}" style="--c:${c}">
   <header><b>${esc(r.name||'루트')}</b>${N().visBadge(r._vis)}${r.visible===false?'<span class="visb gm" title="지도에 선을 그리지 않음">지도 숨김</span>':''}<span class="sp"></span><span class="prog">${p.done}/${p.n}</span>${G?`<button class="btn xs ghost" data-s="edit" data-id="${esc(r.id)}" title="루트 고치기">✎</button>`:''}</header>
   <div class="bar"><i style="width:${p.pct}%"></i></div>
   ${r.entry?`<div class="entry"><span>들어오는 조건</span>${esc(r.entry)}</div>`:''}
   <ol class="fsteps">${(r.steps||[]).map((s,i)=>{const sp=s.spot?S('spots',s.spot):null;return `<li class="fstep ${s.st||''}" data-step="${i}" title="${esc(s.note||'')}"><i>${STI[s.st||'']||i+1}</i><div><b>${esc(stepTitle(s))}</b>${sp&&s.title?`<small>📍 ${esc(spotName(s.spot))}</small>`:''}${s.note?`<small>${esc(s.note)}</small>`:''}</div></li>`}).join('')}${G?`<li class="fstep add" data-s="addstep" data-id="${esc(r.id)}">＋ 단계</li>`:''}</ol>
   ${r.goal?`<div class="goal"><span>도착</span>${esc(r.goal)}</div>`:''}
   ${nx.length?`<div class="fnext">${nx.map(x=>`<button type="button" class="chip" data-gonext="${esc(x.id)}" style="border-color:${esc(x.color||'#888')}">→ ${esc(x.name)}</button>`).join('')}</div>`:''}
   ${G&&N().data('sec','route:'+r.id)?`<div class="gmnote"><b>GM 메모</b><div class="pre">${esc(N().data('sec','route:'+r.id).t||'')}</div></div>`:''}</article>`}
 function drawFlow(el){const fl=el.querySelector('#flow');const svg=fl&&fl.querySelector('.flowsvg');if(!svg)return;const R=fl.getBoundingClientRect();svg.setAttribute('width',fl.scrollWidth);svg.setAttribute('height',fl.scrollHeight);svg.setAttribute('viewBox',`0 0 ${fl.scrollWidth} ${fl.scrollHeight}`);
  const pos=id=>{const c=fl.querySelector(`.fcard[data-route="${CSS.escape(id)}"]`);if(!c)return null;const b=c.getBoundingClientRect();return {l:b.left-R.left+fl.scrollLeft,r:b.right-R.left+fl.scrollLeft,t:b.top-R.top+fl.scrollTop,b:b.bottom-R.top+fl.scrollTop,c}};
  let d='';const narrow=innerWidth<760;
  for(const r of routes()){const a=pos(r.id);if(!a)continue;for(const nid of (r.next||[])){const b=pos(nid);if(!b)continue;const col=r.color||'#888';
   let x1,y1,x2,y2,path;if(!narrow&&Math.abs(b.l-a.r)>20&&b.l>a.r){x1=a.r;y1=a.t+40;x2=b.l;y2=b.t+40;const mx=(x1+x2)/2;path=`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
   else if(!narrow&&b.r<a.l){x1=a.l;y1=a.t+40;x2=b.r;y2=b.t+40;const mx=(x1+x2)/2;path=`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
   else{x1=(a.l+a.r)/2;y1=a.b;x2=(b.l+b.r)/2;y2=b.t;if(y2<y1){x1=a.l+20;x2=b.l+20;path=`M${x1} ${a.t+40} C${x1-50} ${a.t+40} ${x2-50} ${y2+40} ${x2} ${y2+40}`}else{const my=(y1+y2)/2;path=`M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`}}
   d+=`<path d="${path}" stroke="#000" stroke-width="6" fill="none" opacity=".5"/><path d="${path}" stroke="${esc(col)}" stroke-width="3" fill="none" marker-end="url(#fa)" opacity=".95"/>`}}
  svg.innerHTML=`<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#fff"/></marker></defs>${d}`}
 function nowStrip(all){const G=N().gm();const cur=all.map(r=>({r,i:(r.steps||[]).findIndex(x=>x.st==='now')})).filter(x=>x.i>=0);
  const nx=all.filter(r=>(r.steps||[]).length&&!(r.steps||[]).some(x=>x.st==='now')&&(r.steps||[]).some(x=>!x.st)&&(r.visible!==false||G));
  if(!cur.length&&!nx.length)return '';
  return `<div class="nowstrip">${cur.map(({r,i})=>{const st=r.steps[i];const sp=st.spot?N().data('spots',st.spot):null;const after=r.steps.slice(i+1).find(x=>!x.st);return `<div class="nowcard" style="--c:${r.color||'#888'}"><small>지금 · ${esc(r.name||'')} ${i+1}/${r.steps.length}</small><b>${esc(stepTitle(st))}</b>${sp&&st.title?`<span>📍 ${esc(spotName(st.spot))}</span>`:''}${st.note?`<span>${esc(st.note)}</span>`:''}${after?`<span class="dim">다음 → ${esc(stepTitle(after))}</span>`:'<span class="dim">마지막 단계</span>'}<div class="row" style="gap:4px;margin-top:6px">${st.spot?`<button class="btn xs ghost" data-s="gomap" data-id="${esc(st.spot)}">지도</button>`:''}${G?`<button class="btn xs pri" data-s="adv" data-id="${esc(r.id)}">끝 → 다음</button>`:''}</div></div>`}).join('')}${!cur.length?`<div class="nowcard idle"><small>진행 중인 단계가 없어요</small><b>${nx.slice(0,3).map(r=>esc(r.name)).join(' · ')}${nx.length>3?' …':''}</b>${G?'<span class="dim">루트의 단계를 눌러 「진행 중」으로 두면 여기 보여요</span>':''}</div>`:''}</div>`}
 function lane(r){const G=N().gm();const p=prog(r);const c=r.color||'#888';const nx=(r.next||[]).map(id=>N().data('routes',id)).filter(Boolean);
  return `<div class="lane ${r.visible===false?'hidden-route':''}" data-route="${esc(r.id)}" style="--c:${c}"><div class="laneh"><h3>${esc(r.name||'루트')}</h3>${N().visBadge(r._vis)}${r.visible===false?'<span class="visb gm">지도에 선 숨김</span>':''}<span class="bar"><i style="width:${p.pct}%"></i></span><span class="prog">${p.done}/${p.n}</span>${G?`<button class="btn xs" data-s="edit" data-id="${esc(r.id)}">고치기</button>`:''}</div>
   ${r.entry?`<div class="entry">들어오는 조건 · ${esc(r.entry)}</div>`:''}${r.goal?`<div class="goal">${esc(r.goal)}</div>`:''}
   <div class="steps">${(r.steps||[]).map((s,i)=>`<button type="button" class="step ${s.st||''} ${U.sel===r.id&&U.step===i?'on':''}" data-step="${i}" title="${esc(s.note||'')}"><span class="sno">${i+1}</span><span class="st">${s.st==='done'?'✓':s.st==='now'?'▶':s.st==='skip'?'↷':s.st==='fail'?'✗':''}</span><b>${esc(stepTitle(s))}</b>${s.note?`<small>${esc(s.note)}</small>`:''}</button>`).join('')}${G?`<button type="button" class="stepadd" data-s="addstep" data-id="${esc(r.id)}" title="단계 더하기">＋</button>`:''}</div>
   ${r.note&&(G||true)?`<div class="small pre" style="color:var(--fg2);margin-top:4px">${esc(r.note)}</div>`:''}
   ${nx.length?`<div class="next">→ 다음: ${nx.map(x=>`<span style="color:${esc(x.color||'#fff')}">${esc(x.name)}</span>`).join(' · ')}</div>`:''}
   ${G&&N().data('sec','route:'+r.id)?`<div class="gmnote"><b>GM 메모</b><div class="pre">${esc(N().data('sec','route:'+r.id).t||'')}</div></div>`:''}</div>`}
 async function act(k,b){const id=b.dataset.id;
  if(k==='gomap'){N().go('map');setTimeout(()=>{NT_MAP.select(id);N().render()},0);return}
  if(k==='adv'){await N().patch('routes',id,r=>{const i=(r.steps||[]).findIndex(x=>x.st==='now');if(i<0)return;r.steps[i].st='done';const j=r.steps.findIndex((x,ix)=>ix>i&&!x.st);if(j>=0)r.steps[j].st='now'});return}
  if(k==='new'){const nid=N().uid('r');await N().put('routes',nid,{name:'새 루트',group:U.group||'',color:PAL[routes().length%PAL.length],entry:'',goal:'',note:'',next:[],order:routes().length,visible:true,steps:[]},'gm');edit(nid);return}
  if(k==='edit')return edit(id);
  if(k==='addstep')return addStep(id)}
 async function addStep(rid){const spots=N().list('spots').sort((a,b)=>String(a.num||'').localeCompare(String(b.num||''),'ko',{numeric:true}));
  const md=N().openModal(`<div class="mhead"><h2>단계 더하기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="mrow"><label class="lbl">장소 (지도)<select id="asSpot"><option value="">— 장소 없이 제목만 —</option>${spots.map(s=>`<option value="${esc(s.id)}">${esc((s.num?s.num+'. ':'')+s.name)}</option>`).join('')}</select></label><label class="lbl">제목 (비우면 장소 이름)<input id="asTitle" type="text"></label></div><label class="lbl">메모<input id="asNote" type="text" placeholder="예: 3세션 커뮤 ② · 편 고르기"></label><div class="row" style="margin-top:12px"><span class="sp"></span><button class="btn pri" id="asOk">넣기</button></div>`);
  $('#asOk',md).onclick=async()=>{const spot=$('#asSpot',md).value,title=$('#asTitle',md).value.trim(),note=$('#asNote',md).value.trim();if(!spot&&!title)return N().toast('장소나 제목 하나는 있어야 해요');await N().patch('routes',rid,r=>{r.steps=r.steps||[];r.steps.push({spot,title,note,st:''})});N().closeModal()}}
 function stepMenu(rid,i){const r=N().data('routes',rid);const s=(r.steps||[])[i];if(!s)return;const spots=N().list('spots').sort((a,b)=>String(a.num||'').localeCompare(String(b.num||''),'ko',{numeric:true}));
  const spotCard=sid=>{const x=sid&&N().data('spots',sid);if(!x)return '<div class="spcard empty small dim">장소를 고르면 여기 미리 보여요</div>';const ents=N().list('ents').filter(e=>(e.at||[]).includes(sid));
   return `<div class="spcard"><div class="img" style="${x.img?`background-image:url('${N().cssu(x.img)}')`:''}"></div><div class="t"><b>${esc((x.num?x.num+'. ':'')+x.name)}</b><small>${esc(x.area||'')}${x.kind?' · '+esc(x.kind):''}</small>${x.summary?`<p>${esc(x.summary)}</p>`:''}${ents.length?`<div class="row" style="gap:4px;flex-wrap:wrap">${ents.map(e=>`<span class="chip xs">${esc(e.title)}</span>`).join('')}</div>`:''}</div></div>`};
  const after=(r.steps||[]).slice(i+1).find(x=>!x.st);
  const md=N().openModal(`<div class="mhead" style="border-color:${esc(r.color||'#888')}"><h2><small class="dim" style="font-size:12px;letter-spacing:.1em;display:block">${esc(r.name||'')} · ${i+1}/${r.steps.length}</small>${esc(stepTitle(s))}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="stgrid" id="smSt">${[['','○','예정','아직'],['now','▶','진행 중','지금 여기 (한 루트에 하나)'],['done','✓','끝','지나왔다'],['skip','↷','건너뜀','안 들르고 지나감'],['fail','✗','실패','실패로 끝남']].map(([v,ic,l,h])=>`<button type="button" data-st="${v}" class="${(s.st||'')===v?'on':''}"><i>${ic}</i><b>${l}</b><small>${h}</small></button>`).join('')}</div>
   <div class="ed2 tight"><div class="edL" id="smCard">${spotCard(s.spot)}</div><div class="edR">
    <label class="lbl">장소<select id="smSpot"><option value="">— 없음 —</option>${spots.map(x=>`<option value="${esc(x.id)}" ${x.id===s.spot?'selected':''}>${esc((x.num?x.num+'. ':'')+x.name)}</option>`).join('')}</select></label>
    <label class="lbl">제목 <small class="dim">(비우면 장소 이름)</small><input id="smTitle" type="text" value="${esc(s.title||'')}"></label>
    <label class="lbl">메모 <small class="dim">(무슨 일이 일어나나 · 배틀 · 단서)</small><textarea id="smNote" rows="4">${esc(s.note||'')}</textarea></label>
    ${after?`<div class="small dim">다음 단계 → ${esc(stepTitle(after))}</div>`:''}</div></div>
   <div class="mfoot"><button class="btn xs ghost" data-mv="-1" ${i===0?'disabled':''}>◀ 앞으로</button><button class="btn xs ghost" data-mv="1" ${i>=r.steps.length-1?'disabled':''}>뒤로 ▶</button><button class="btn xs ghost danger" id="smDel">단계 빼기</button><span class="sp"></span>${s.spot?'<button class="btn xs" id="smMap">지도에서</button>':''}<button class="btn pri" id="smOk">저장</button></div>`,'wide');
  $('#smSpot',md).onchange=()=>{$('#smCard',md).innerHTML=spotCard($('#smSpot',md).value)};
  const save=(fn)=>N().patch('routes',rid,rr=>{const st=rr.steps[i];if(!st)return false;fn(rr,st)});
  $$('#smSt button',md).forEach(b=>b.onclick=async()=>{const v=b.dataset.st;await save((rr,st)=>{if(v==='now')rr.steps.forEach(x=>{if(x.st==='now')x.st=''});st.st=v});$$('#smSt button',md).forEach(x=>x.classList.toggle('on',x.dataset.st===v))});
  $('#smOk',md).onclick=async()=>{await save((rr,st)=>{st.spot=$('#smSpot',md).value;st.title=$('#smTitle',md).value.trim();st.note=$('#smNote',md).value.trim()});N().closeModal()};
  $$('[data-mv]',md).forEach(b=>b.onclick=async()=>{const d=+b.dataset.mv;await N().patch('routes',rid,rr=>{const j=i+d;if(j<0||j>=rr.steps.length)return false;[rr.steps[i],rr.steps[j]]=[rr.steps[j],rr.steps[i]]});N().closeModal()});
  $('#smDel',md).onclick=async()=>{await N().patch('routes',rid,rr=>{rr.steps.splice(i,1)});N().closeModal()};
  const mp=$('#smMap',md);if(mp)mp.onclick=()=>{N().closeModal();N().go('map');setTimeout(()=>{NT_MAP.select(s.spot);N().render()},0)}}
 function edit(id){const r=N().data('routes',id);if(!r)return;const sec=N().data('sec','route:'+id)||{};const others=routes().filter(x=>x.id!==id);
  const md=N().openModal(`<div class="mhead"><h2>루트 고치기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="mrow"><label class="lbl" style="grid-column:span 2">이름<input id="rtName" type="text" value="${esc(r.name||'')}"></label><label class="lbl">분류 (부 · 장)<input id="rtGroup" type="text" value="${esc(r.group||'')}" list="rtGL" placeholder="예: 1부 · A"><datalist id="rtGL">${groups().map(g=>`<option value="${esc(g)}">`).join('')}</datalist></label><label class="lbl">색<input id="rtColor" type="color" value="${esc(r.color||'#1e88e5')}"></label><label class="lbl">순서<input id="rtOrd" type="number" class="n" value="${r.order||0}"></label><label class="lbl">공개${N().visSelect(N().doc('routes',id).vis,'rtVis',{noPl:true})}</label></div>
   <label class="lbl">들어오는 조건<input id="rtEntry" type="text" value="${esc(r.entry||'')}"></label>
   <label class="lbl" style="margin-top:6px">목표 · 이 루트가 하는 일<textarea id="rtGoal" rows="2">${esc(r.goal||'')}</textarea></label>
   <label class="lbl" style="margin-top:6px">설명<textarea id="rtNote" rows="4">${esc(r.note||'')}</textarea></label>
   <div class="sec">이 다음에 이어질 루트</div><div class="row">${others.map(o=>`<label class="chk chip ${(r.next||[]).includes(o.id)?'on':''}"><input type="checkbox" value="${esc(o.id)}" ${(r.next||[]).includes(o.id)?'checked':''} hidden>${esc(o.name)}</label>`).join('')||'<span class="small dim">다른 루트가 없어요</span>'}</div>
   <label class="chk" style="margin-top:10px"><input type="checkbox" id="rtVisible" ${r.visible!==false?'checked':''}> 지도에 이 루트의 선을 그린다</label>
   <div class="sec">GM 메모 <span class="dim">(GM 에게만)</span></div><textarea id="rtSec" rows="3">${esc(sec.t||'')}</textarea>
   <div class="row" style="margin-top:14px"><button class="btn danger ghost sm" id="rtDel">루트 지우기</button><span class="sp"></span><button class="btn pri" id="rtOk">저장</button></div>`);
  $$('.chk input',md).forEach(c=>c.onchange=()=>c.closest('label').classList.toggle('on',c.checked));
  $('#rtOk',md).onclick=async()=>{await N().put('routes',id,Object.assign({},r,{name:$('#rtName',md).value.trim()||'루트',group:$('#rtGroup',md).value.trim(),color:$('#rtColor',md).value,order:+$('#rtOrd',md).value||0,entry:$('#rtEntry',md).value.trim(),goal:$('#rtGoal',md).value.trim(),note:$('#rtNote',md).value.trim(),next:$$('.chk input[value]:checked',md).map(c=>c.value),visible:$('#rtVisible',md).checked}),$('#rtVis',md).value);
   const t=$('#rtSec',md).value.trim();if(t)await N().put('sec','route:'+id,{t},'gm');else if(N().doc('sec','route:'+id))await N().del('sec','route:'+id);N().closeModal()};
  $('#rtDel',md).onclick=async()=>{if(!await N().confirmBox(`「${r.name}」 루트를 지울까요?`,'지우기'))return;await N().del('routes',id);if(N().doc('sec','route:'+id))await N().del('sec','route:'+id);N().closeModal()}}
 N().MOD.scen={render};
 window.NT_SCEN={routes,prog};
})();
