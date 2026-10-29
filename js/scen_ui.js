/* ---------- 시나리오 탭 ----------
   routes: {name, group, color, entry(들어오는 조건), goal, note, next[route id], order, visible, links[{a,b,label}] (흐름도 갈림길 선, 단계 sid), steps:[{sid, spot, title, note, read(낭독 · 묘사), ents[항목 id], st('' | now | done | skip | fail), fx, fy (흐름도 자리)}]}
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
 /* 10-29 망령 「시나리오가 쓰기 불편하다」: 「쓰기」 화면 추가(GM 기본). 고른 보기는 기억한다 */
 const VKEY='nt_scen_view';const vGet=()=>{try{return localStorage.getItem(VKEY)||''}catch(e){return ''}};const vSet=v=>{try{localStorage.setItem(VKEY,v)}catch(e){}};
 const U2={view:vGet(),wsel:'',open:{},focus:''};
 function render(el){const G=N().gm();const all=routes();const gs=groups();if(U.group&&!gs.includes(U.group))U.group='';
  if(!['write','flow','list'].includes(U2.view))U2.view=G?'write':'flow';if(U2.view==='write'&&!G)U2.view='flow';
  const tot=all.reduce((a,r)=>a+(r.steps||[]).length,0),dn=all.reduce((a,r)=>a+prog(r).done,0);
  el.innerHTML=`<div class="toolbar"><h2>시나리오</h2><span class="note">${all.length}개 루트 · 단계 ${dn} / ${tot}</span><div class="seg">${G?`<button data-sv="write" class="${U2.view==='write'?'on':''}" title="루트 한 장을 창 없이 바로 써요">쓰기</button>`:''}<button data-sv="flow" class="${U2.view==='flow'?'on':''}">흐름도</button><button data-sv="list" class="${U2.view==='list'?'on':''}">목록</button></div>${gs.length>1&&U2.view==='list'?`<div class="seg"><button data-sg="" class="${!U.group?'on':''}">전체</button>${gs.map(g=>`<button data-sg="${esc(g)}" class="${U.group===g?'on':''}">${esc(g||'분류 없음')}</button>`).join('')}</div>`:''}<span class="sp"></span>${N().bulkBtns('routes',null,'루트')}${G?'<button class="btn sm pri" data-s="new">＋ 루트</button>':''}</div>
   ${U2.view==='write'?'':nowStrip(all)}
   ${!all.length?`<div class="empty">시나리오 루트가 없어요.${G?' 「＋ 루트」로 만들고 단계(장소)를 차례로 넣어요.':''}</div>`:U2.view==='write'?writeHtml(all,gs):U2.view==='flow'?(window.NT_FLOWMAP?NT_FLOWMAP.html():flowHtml(all,gs)):gs.filter(g=>!U.group||U.group===g).map(g=>`<section class="sgroup"><div class="sgh"><span>${esc(g||'분류 없음')}</span><span class="small dim">${all.filter(r=>(r.group||'').trim()===g).length}개 루트</span></div>${all.filter(r=>(r.group||'').trim()===g).map(lane).join('')}</section>`).join('')}`;
  el.addEventListener('click',e=>{const t=e.target;const sv=t.closest('[data-sv]');if(sv){U2.view=sv.dataset.sv;vSet(U2.view);N().render();return}
   if(U2.view==='write'&&wClick(e,t))return;
   const sg=t.closest('[data-sg]');if(sg){U.group=sg.dataset.sg;N().render();return}
   const nx=t.closest('[data-gonext]');if(nx){const c=el.querySelector(`.fcard[data-route="${CSS.escape(nx.dataset.gonext)}"]`);if(c){c.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),1200)}return}
   const st=t.closest('[data-step]');if(st){const rid=st.closest('[data-route]').dataset.route;const i=+st.dataset.step;if(G&&(e.shiftKey||e.altKey)){e.preventDefault();return cycleStep(rid,i)}if(G)return stepMenu(rid,i);return stepRead(rid,i)}
   const b=t.closest('[data-s]');if(b)act(b.dataset.s,b)});
  /* 10-26: 우클릭 · 길게 누르기 메뉴 (루트 카드 · 단계) */
  N().bindCtx(el,'[data-route]',(t,e)=>{const rid=t.dataset.route;const st=e.target.closest&&e.target.closest('[data-step]');return st&&t.contains(st)?stepCtx(rid,+st.dataset.step):routeCtx(rid)});
  if(G){/* 끌어서 순서 바꾸기: 루트는 머리글을 잡고, 단계는 칩을 잡고 */
   $$('.fcards,.sgroup',el).forEach(c=>N().sortable(c,'[data-route]',ids=>orderRoutes(ids),{handleSel:'header,.laneh'}));
   $$('.fsteps',el).forEach(c=>{const rid=c.closest('[data-route]').dataset.route;N().sortable(c,'.fstep[data-id]',ids=>orderSteps(rid,ids))});
   $$('.steps',el).forEach(c=>{const rid=c.closest('[data-route]').dataset.route;N().sortable(c,'.step[data-id]',ids=>orderSteps(rid,ids),{horizontal:true})})}
  if(U2.view==='flow'){if(window.NT_FLOWMAP)NT_FLOWMAP.mount(el);else{requestAnimationFrame(()=>drawFlow(el));watchFlow(el)}}
  if(U2.view==='write')wireWrite(el)}
 /* ---- 10-26 공용: 단계 상태 · 루트 지우기 · 순서 · 메뉴 ---- */
 const STL={'':'예정',now:'진행 중',done:'끝',skip:'건너뜀',fail:'실패'};
 async function setStep(rid,i,v){const r=N().data('routes',rid);const s=r&&(r.steps||[])[i];if(!s)return;await N().patch('routes',rid,rr=>{const st=rr.steps[i];if(!st)return false;if(v==='now')rr.steps.forEach(x=>{if(x.st==='now')x.st=''});st.st=v});N().toast(`「${stepTitle(s)}」 → ${STL[v]||v}`)}
 function cycleStep(rid,i){const r=N().data('routes',rid);const s=r&&(r.steps||[])[i];if(!s)return;const cur=s.st||'';return setStep(rid,i,cur==='now'?'done':cur==='done'?'':'now')}
 async function delRoute(id){const r=N().data('routes',id);if(!r)return false;if(!await N().confirmBox(`「${r.name||'루트'}」 루트를 지울까요? 단계도 함께 사라져요.`,'지우기'))return false;await N().del('routes',id);if(N().doc('sec','route:'+id))await N().del('sec','route:'+id);N().toast('루트를 지웠어요');return true}
 /* 한 묶음(열 · 분류) 안에서 바뀐 순서를 전체 순서에 끼워 넣는다 — 다른 묶음의 자리 번호는 그대로 */
 function orderRoutes(ids){const set=new Set(ids);let k=0;const merged=routes().map(r=>set.has(r.id)?ids[k++]:r.id);return N().reorder('routes',merged)}
 function orderSteps(rid,ids){return N().patch('routes',rid,r=>{const S=r.steps||[];const idx=ids.map(Number).filter(i=>S[i]);if(idx.length!==S.length)return false;r.steps=idx.map(i=>S[i])})}
 function visItems(kind,id){const d=N().doc(kind,id);if(!d||!N().gm())return [];const cur=d.vis||'pub';const o=[['pub','👥 모두에게'],['gm','🔒 GM만']].concat((N().ST.seats||[]).map(x=>['pl:'+x.seat,'👤 '+(N().seatName(x.seat)||x.seat)+' 에게만']));
  return o.map(([v,l])=>({t:(v===cur?'✓ ':'　')+l,on:async()=>{if(v===cur)return;await N().put(kind,id,N().clone(d.data),v);N().toast('공개 범위: '+N().visLabel(v))}}))}
 function routeCtx(rid){const r=N().data('routes',rid);if(!r)return null;const G=N().gm();const L=[];
  if(G)L.push(...visItems('routes',rid),'-',{t:'✎ 쓰기 화면에서 고치기',on:()=>write(rid)});
  if(window.NT_FAV)L.push({t:(NT_FAV.has('routes',rid)?'★ 즐겨찾기에서 빼기':'☆ 즐겨찾기에 넣기'),on:()=>NT_FAV.toggle('routes',rid,r.name)});
  if(G)L.push('-',{t:'🗑 루트 지우기',danger:true,on:()=>delRoute(rid)});return L}
 function stepCtx(rid,i){if(!N().gm())return null;const r=N().data('routes',rid);const s=r&&(r.steps||[])[i];if(!s)return null;
  return [{t:'▶ 진행 중으로',on:()=>setStep(rid,i,'now')},{t:'✓ 끝으로',on:()=>setStep(rid,i,'done')},{t:'○ 초기화 (예정)',on:()=>setStep(rid,i,'')},'-',{t:'✎ 고치기',on:()=>stepMenu(rid,i)},{t:'✍ 쓰기 화면에서',on:()=>write(rid,'ws'+i+'n')},{t:'빼기',danger:true,on:async()=>{if(!await N().confirmBox(`「${stepTitle(s)}」 단계를 뺄까요?`,'빼기'))return;await N().patch('routes',rid,rr=>{rr.steps.splice(i,1)})}}]}
 /* 흐름도 화살표: 크기가 바뀌거나 글꼴이 늦게 오면 다시 긋는다 (관찰자는 하나만) */
 let RO=null;
 function watchFlow(el){const fl=el.querySelector('#flow');if(!fl)return;if(RO){try{RO.disconnect()}catch(e){}RO=null}
  if(window.ResizeObserver){RO=new ResizeObserver(()=>{if(fl.isConnected)requestAnimationFrame(()=>drawFlow(el))});RO.observe(fl);$$('.fcol',fl).forEach(c=>RO.observe(c))}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(fl.isConnected)drawFlow(el)}).catch(()=>{})}
 /* ---- 흐름도: 부(group)마다 세로 열, 루트 카드 안에 단계 체크리스트, next[] 는 화살표 ---- */
 const STI={done:'✓',now:'▶',skip:'↷',fail:'✗','':''};
 function flowHtml(all,gs){const G=N().gm();
  return `<div class="flow" id="flow"><svg class="flowsvg"></svg>${gs.map(g=>`<div class="fcol"><div class="fcolh">${esc(g||'분류 없음')}</div><div class="fcards">${all.filter(r=>(r.group||'').trim()===g).map(fcard).join('')}</div></div>`).join('')}</div>`}
 function fcard(r){const G=N().gm();const p=prog(r);const c=r.color||'#888';const nx=(r.next||[]).map(id=>N().data('routes',id)).filter(Boolean);const hid=r.visible===false||r._vis!=='pub';const S=N().data.bind(N());
  return `<article class="fcard ${hid?'hid':''} ${p.now>=0?'active':p.n&&p.done===p.n?'done':''}" data-route="${esc(r.id)}" data-id="${esc(r.id)}" style="--c:${c}">
   <header class="${G?'dragh':''}"><b>${esc(r.name||'루트')}</b>${window.NT_FAV?NT_FAV.btn('routes',r.id,r.name):''}${N().visBadge(r._vis,'routes',r.id)}${r.visible===false?'<span class="visb gm" title="지도에 선을 그리지 않음">지도 숨김</span>':''}<span class="sp"></span><span class="prog">${p.done}/${p.n}</span>${G?`<button class="btn xs ghost" data-s="edit" data-id="${esc(r.id)}" title="쓰기 화면에서 고치기">✎</button><button class="btn xs ghost danger rdel" data-s="del" data-id="${esc(r.id)}" title="루트 지우기">🗑</button>`:''}</header>
   <div class="bar"><i style="width:${p.pct}%"></i></div>
   ${r.entry?`<div class="entry"><span>들어오는 조건</span>${esc(r.entry)}</div>`:''}
   <ol class="fsteps">${(r.steps||[]).map((s,i)=>{const sp=s.spot?S('spots',s.spot):null;return `<li class="fstep ${s.st||''}" data-step="${i}" data-id="${i}" title="${esc(s.note||'')}${G?(s.note?'\n':'')+'Shift+클릭: 예정 → 진행 중 → 끝 · 우클릭: 메뉴 · 끌어서 순서':''}"><i>${STI[s.st||'']||i+1}</i><div><b>${esc(stepTitle(s))}</b>${sp&&s.title?`<small>📍 ${esc(spotName(s.spot))}</small>`:''}${s.note?`<small class="clamp">${esc(s.note)}</small>`:''}${s.read||(s.ents||[]).length?`<small class="fmeta">${s.read?'<span title="낭독문이 있어요">❝ 낭독</span>':''}${(s.ents||[]).map(id=>N().data('ents',id)).filter(Boolean).slice(0,4).map(x=>`<span>${esc(x.title)}</span>`).join('')}</small>`:''}</div></li>`}).join('')}${G?`<li class="fstep add" data-s="addstep" data-id="${esc(r.id)}">＋ 단계</li>`:''}</ol>
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
  return `<div class="nowstrip">${cur.map(({r,i})=>{const st=r.steps[i];const sp=st.spot?N().data('spots',st.spot):null;const after=r.steps.slice(i+1).find(x=>!x.st);return `<div class="nowcard" style="--c:${r.color||'#888'}"><small>지금 · ${esc(r.name||'')} ${i+1}/${r.steps.length}</small><b>${esc(stepTitle(st))}</b>${sp&&st.title?`<span>📍 ${esc(spotName(st.spot))}</span>`:''}${st.note?`<span class="clamp">${esc(st.note)}</span>`:''}${G&&st.read?`<q class="clamp">${esc(st.read)}</q>`:''}${(st.ents||[]).length?`<span class="fmeta">${st.ents.map(id=>N().data('ents',id)).filter(Boolean).map(x=>`<span>${esc(x.title)}</span>`).join('')}</span>`:''}${after?`<span class="dim">다음 → ${esc(stepTitle(after))}</span>`:'<span class="dim">마지막 단계</span>'}<div class="row" style="gap:4px;margin-top:6px">${st.spot?`<button class="btn xs ghost" data-s="gomap" data-id="${esc(st.spot)}">지도</button>`:''}${G?`<button class="btn xs ghost" data-s="wstep" data-id="${esc(r.id)}" data-i="${i}">쓰기</button><button class="btn xs pri" data-s="adv" data-id="${esc(r.id)}">끝 → 다음</button>`:''}</div></div>`}).join('')}${!cur.length?`<div class="nowcard idle"><small>진행 중인 단계가 없어요</small><b>${nx.slice(0,3).map(r=>esc(r.name)).join(' · ')}${nx.length>3?' …':''}</b>${G?'<span class="dim">루트의 단계를 눌러 「진행 중」으로 두면 여기 보여요</span>':''}</div>`:''}</div>`}
 function lane(r){const G=N().gm();const p=prog(r);const c=r.color||'#888';const nx=(r.next||[]).map(id=>N().data('routes',id)).filter(Boolean);
  return `<div class="lane ${r.visible===false?'hidden-route':''}" data-route="${esc(r.id)}" data-id="${esc(r.id)}" style="--c:${c}"><div class="laneh ${G?'dragh':''}"><h3>${esc(r.name||'루트')}</h3>${window.NT_FAV?NT_FAV.btn('routes',r.id,r.name):''}${N().visBadge(r._vis,'routes',r.id)}${r.visible===false?'<span class="visb gm">지도에 선 숨김</span>':''}<span class="bar"><i style="width:${p.pct}%"></i></span><span class="prog">${p.done}/${p.n}</span>${G?`<button class="btn xs" data-s="edit" data-id="${esc(r.id)}">쓰기</button><button class="btn xs ghost danger rdel" data-s="del" data-id="${esc(r.id)}" title="루트 지우기">🗑</button>`:''}</div>
   ${r.entry?`<div class="entry">들어오는 조건 · ${esc(r.entry)}</div>`:''}${r.goal?`<div class="goal">${esc(r.goal)}</div>`:''}
   <div class="steps">${(r.steps||[]).map((s,i)=>`<button type="button" class="step ${s.st||''} ${U.sel===r.id&&U.step===i?'on':''}" data-step="${i}" data-id="${i}" ${G?'data-drag':''} title="${esc(s.note||'')}${G?(s.note?'\n':'')+'Shift+클릭: 예정 → 진행 중 → 끝 · 우클릭: 메뉴 · 끌어서 순서':''}"><span class="sno">${i+1}</span><span class="st">${s.st==='done'?'✓':s.st==='now'?'▶':s.st==='skip'?'↷':s.st==='fail'?'✗':''}</span><b>${esc(stepTitle(s))}</b>${s.note?`<small>${esc(s.note)}</small>`:''}</button>`).join('')}${G?`<button type="button" class="stepadd" data-s="addstep" data-id="${esc(r.id)}" title="단계 더하기">＋</button>`:''}</div>
   ${r.note&&(G||true)?`<div class="small pre" style="color:var(--fg2);margin-top:4px">${esc(r.note)}</div>`:''}
   ${nx.length?`<div class="next">→ 다음: ${nx.map(x=>`<span style="color:${esc(x.color||'#fff')}">${esc(x.name)}</span>`).join(' · ')}</div>`:''}
   ${G&&N().data('sec','route:'+r.id)?`<div class="gmnote"><b>GM 메모</b><div class="pre">${esc(N().data('sec','route:'+r.id).t||'')}</div></div>`:''}</div>`}
 async function act(k,b){const id=b.dataset.id;
  if(k==='gomap'){N().go('map');setTimeout(()=>{NT_MAP.select(id);N().render()},0);return}
  if(k==='adv'){await N().patch('routes',id,r=>{const i=(r.steps||[]).findIndex(x=>x.st==='now');if(i<0)return;r.steps[i].st='done';const j=r.steps.findIndex((x,ix)=>ix>i&&!x.st);if(j>=0)r.steps[j].st='now'});return}
  if(k==='new'){const nid=N().uid('r');const cur=U2.wsel&&N().data('routes',U2.wsel);U2.wsel=nid;U2.view='write';vSet('write');U2.focus='wName';await N().put('routes',nid,{name:'새 루트',group:U.group||(cur&&cur.group)||'',color:PAL[routes().length%PAL.length],entry:'',goal:'',note:'',next:[],order:routes().length,visible:true,steps:[]},'gm');return}
  if(k==='edit')return write(id);
  if(k==='wstep')return write(id,'ws'+b.dataset.i+'n');
  if(k==='del')return delRoute(id);
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
    <label class="lbl">낭독 · 묘사 <small class="dim">(PL에게 읽어 줄 글)</small><textarea id="smRead" rows="3">${esc(s.read||'')}</textarea></label>
    ${after?`<div class="small dim">다음 단계 → ${esc(stepTitle(after))}</div>`:''}</div></div>
   <div class="mfoot"><button class="btn xs ghost" data-mv="-1" ${i===0?'disabled':''}>◀ 앞으로</button><button class="btn xs ghost" data-mv="1" ${i>=r.steps.length-1?'disabled':''}>뒤로 ▶</button><button class="btn xs ghost danger" id="smDel">단계 빼기</button><span class="sp"></span><button class="btn xs ghost" id="smW">쓰기 화면</button>${s.spot?'<button class="btn xs" id="smMap">지도에서</button>':''}<button class="btn pri" id="smOk">저장</button></div>`,'wide');
  $('#smSpot',md).onchange=()=>{$('#smCard',md).innerHTML=spotCard($('#smSpot',md).value)};
  const save=(fn)=>N().patch('routes',rid,rr=>{const st=rr.steps[i];if(!st)return false;fn(rr,st)});
  $$('#smSt button',md).forEach(b=>b.onclick=async()=>{const v=b.dataset.st;await save((rr,st)=>{if(v==='now')rr.steps.forEach(x=>{if(x.st==='now')x.st=''});st.st=v});$$('#smSt button',md).forEach(x=>x.classList.toggle('on',x.dataset.st===v))});
  $('#smOk',md).onclick=async()=>{await save((rr,st)=>{st.spot=$('#smSpot',md).value;st.title=$('#smTitle',md).value.trim();st.note=$('#smNote',md).value.trim();st.read=$('#smRead',md).value.trim()});N().closeModal()};
  $('#smW',md).onclick=async()=>{await save((rr,st)=>{st.spot=$('#smSpot',md).value;st.title=$('#smTitle',md).value.trim();st.note=$('#smNote',md).value.trim();st.read=$('#smRead',md).value.trim()});N().closeModal(true);write(rid,'ws'+i+'n')};
  $$('[data-mv]',md).forEach(b=>b.onclick=async()=>{const d=+b.dataset.mv;await N().patch('routes',rid,rr=>{const j=i+d;if(j<0||j>=rr.steps.length)return false;[rr.steps[i],rr.steps[j]]=[rr.steps[j],rr.steps[i]]});N().closeModal();const j=i+d;if(j>=0&&j<((N().data('routes',rid)||{}).steps||[]).length)stepMenu(rid,j)});
  $('#smDel',md).onclick=async()=>{if(!await N().confirmBox('이 단계를 뺄까요?','빼기'))return;await N().patch('routes',rid,rr=>{rr.steps.splice(i,1)});N().closeModal()};
  const mp=$('#smMap',md);if(mp)mp.onclick=()=>{N().closeModal();N().go('map');setTimeout(()=>{NT_MAP.select(s.spot);N().render()},0)}}
 /* ---- 10-29 「쓰기」 화면: 왼쪽 루트 목록, 오른쪽에서 루트 한 장을 창 없이 바로 고친다 ----
    칸을 벗어나면(change) 저장, Ctrl+S 는 지금 칸을 바로 저장. 저장은 한 줄로 세워 차례로 한다(앞 저장이 끝나기 전에 다음 것이 옛 값을 덮지 않게).
    다른 사람이 고쳐 다시 그려져도 쓰고 있던 칸의 글은 그대로 둔다(app.js keepState 의 data-live). */
 let WQ=Promise.resolve();const q=fn=>(WQ=WQ.then(fn).catch(e=>console.warn('scen write',e)));
 const STS=[['','○','예정'],['now','▶','진행 중'],['done','✓','끝'],['skip','↷','건너뜀'],['fail','✗','실패']];
 const spotList=()=>N().list('spots').sort((a,b)=>String(a.num||'').localeCompare(String(b.num||''),'ko',{numeric:true}));
 const entList=()=>{const T=window.NT_ENTS?NT_ENTS.TYPES.map(x=>x[0]):[];return N().list('ents').sort((a,b)=>(T.indexOf(a.type)-T.indexOf(b.type))||String(a.title||'').localeCompare(String(b.title||''),'ko'))};
 const entColor=e=>e.color||(window.NT_ENTS?NT_ENTS.tc(e.type)[2]:'#888');
 function write(rid,focus){U2.view='write';vSet('write');if(rid)U2.wsel=rid;U2.focus=focus||'';if(N().ST.view!=='scen')N().go('scen');else N().render()}
 function writeHtml(all,gs){if(!U2.wsel||!N().data('routes',U2.wsel)){const cur=all.find(r=>(r.steps||[]).some(s=>s.st==='now'));U2.wsel=(cur||all[0]).id}
  const r=Object.assign({},N().data('routes',U2.wsel),{id:U2.wsel,_vis:(N().doc('routes',U2.wsel)||{}).vis});
  return `<div class="swrite"><aside class="swlist" data-keep>${gs.map(g=>`<div class="swg"><div class="swgh">${esc(g||'분류 없음')}</div>${all.filter(x=>(x.group||'').trim()===g).map(x=>{const p=prog(x);return `<button type="button" class="swi ${x.id===r.id?'on':''} ${p.now>=0?'active':''} ${x._vis!=='pub'?'hid':''}" data-wsel="${esc(x.id)}" data-id="${esc(x.id)}" data-drag style="--c:${esc(x.color||'#888')}"><b>${esc(x.name||'루트')}</b><small>${p.n?`${p.done}/${p.n}`:'단계 없음'}${p.now>=0?' · ▶ '+esc(stepTitle(x.steps[p.now])):''}</small><i style="width:${p.pct}%"></i></button>`}).join('')}</div>`).join('')}<button type="button" class="btn sm swnew" data-s="new">＋ 루트</button></aside>${editor(r)}</div>`}
 function editor(r){const p=prog(r);const sec=N().data('sec','route:'+r.id)||{};const spots=spotList();const E=entList();const others=routes().filter(x=>x.id!==r.id);
  const ta=(id,v,ph,rows,live)=>`<textarea id="${id}" ${live===false?'':'data-live'} data-g rows="${rows||1}" placeholder="${esc(ph)}">${esc(v||'')}</textarea>`;
  return `<section class="swed" data-route="${esc(r.id)}" style="--c:${esc(r.color||'#888')}">
   <div class="swhead"><input id="wName" data-live class="swname" type="text" value="${esc(r.name||'')}" placeholder="루트 이름">${N().visBadge(r._vis,'routes',r.id)}</div>
   <div class="swmeta"><label>분류<input id="wGroup" data-live type="text" list="wGL" value="${esc(r.group||'')}" placeholder="예: 1부"></label><datalist id="wGL">${groups().map(g=>`<option value="${esc(g)}">`).join('')}</datalist>
    <label>색<input id="wColor" type="color" value="${esc(r.color||'#1e88e5')}"></label>
    <label class="chk"><input type="checkbox" id="wVisible" ${r.visible!==false?'checked':''}> 지도에 선</label>
    <span class="sp"></span><span class="swprog" title="${p.done}/${p.n}"><i style="width:${p.pct}%"></i></span><span class="small dim">${p.done}/${p.n}</span>
    <button type="button" class="btn xs ghost" data-w="flow">흐름도에서 보기</button><button type="button" class="btn xs ghost danger" data-s="del" data-id="${esc(r.id)}">루트 지우기</button></div>
   <div class="swpair"><label class="lbl">들어오는 조건${ta('wEntry',r.entry,'어떻게 이 루트로 들어오나')}</label><label class="lbl">도착 · 목표${ta('wGoal',r.goal,'이 루트가 끝나면 무엇이 되나')}</label></div>
   <label class="lbl">설명${ta('wNote',r.note,'루트 전체에 대한 글 (공개가 「모두」면 PL도 봐요)',2)}</label>
   <div class="sec swsec">단계 <small class="dim">${(r.steps||[]).length}</small><span class="sp"></span><span class="small dim">번호를 끌어 순서 · ○▶✓↷✗ 로 진행 상태</span></div>
   <ol class="swsteps">${(r.steps||[]).map((s,i)=>stepEd(r,s,i,spots,E)).join('')}</ol>
   <div class="swadd"><span>＋</span>${ta('wQuick','','새 단계 제목을 쓰고 Enter · 여러 줄을 붙여 넣으면 줄마다 단계가 생겨요 · 「제목 — 메모」 꼴이면 메모까지',1,false)}</div>
   <div class="sec">이어지는 루트</div><div class="row swnext">${others.map(o=>`<button type="button" class="chip ${(r.next||[]).includes(o.id)?'on':''}" data-wnext="${esc(o.id)}" style="--c:${esc(o.color||'#888')}">→ ${esc(o.name||'루트')}</button>`).join('')||'<span class="small dim">다른 루트가 없어요</span>'}</div>
   <div class="sec">GM 메모 <span class="dim">(GM 에게만)</span></div>${ta('wSec',sec.t,'숨은 진상 · 분기 조건 · 준비물',2)}
   <div class="small dim swhint">칸을 벗어나면 저장돼요 · Ctrl+S 는 바로 저장 <span id="wSaved"></span></div>
  </section>`}
 function stepEd(r,s,i,spots,E){const showRead=s.read||U2.open[r.id+':'+i];const ents=(s.ents||[]).map(id=>({id,e:N().data('ents',id)})).filter(x=>x.e);
  return `<li class="swstep st-${s.st||'todo'}" data-i="${i}" data-id="${i}">
   <div class="swnum" data-drag title="끌어서 순서 바꾸기"><b>${i+1}</b></div>
   <div class="swbody">
    <div class="swtop"><input id="ws${i}t" data-live class="swtitle" type="text" value="${esc(s.title||'')}" placeholder="${esc(s.spot?spotName(s.spot):'단계 제목')}">
     <select id="ws${i}p" class="swspot" title="지도 장소">${'<option value="">📍 장소 없음</option>'+spots.map(x=>`<option value="${esc(x.id)}" ${x.id===s.spot?'selected':''}>📍 ${esc((x.num?x.num+'. ':'')+x.name)}</option>`).join('')}</select>
     <div class="swst">${STS.map(([v,ic,l])=>`<button type="button" data-wst="${v}" class="${(s.st||'')===v?'on':''}" title="${l}">${ic}</button>`).join('')}</div></div>
    <textarea id="ws${i}n" data-live data-g rows="${s.note?2:1}" placeholder="무슨 일이 일어나나 · 배틀 · 단서 · 분기">${esc(s.note||'')}</textarea>
    ${showRead?`<label class="swread"><span>❝ 낭독 · 묘사</span><textarea id="ws${i}r" data-live data-g rows="2" placeholder="PL에게 읽어 줄 글">${esc(s.read||'')}</textarea></label>`:''}
    <div class="swfoot">${ents.map(x=>`<span class="swent" style="--c:${esc(entColor(x.e))}"><button type="button" data-wgoent="${esc(x.id)}" title="항목 탭에서 보기">${esc(x.e.title)}</button><button type="button" data-wdelent="${esc(x.id)}" title="빼기">×</button></span>`).join('')}
     ${E.length?`<select class="swentadd" data-waddent="${i}" title="이 단계에 나오는 인물 · 아이템 · 설정"><option value="">＋ 등장 항목</option>${E.filter(e=>!(s.ents||[]).includes(e.id)).map(e=>`<option value="${esc(e.id)}">${esc(e.type||'')} · ${esc(e.title||'')}</option>`).join('')}</select>`:''}
     ${showRead?'':'<button type="button" class="btn xs ghost" data-wread>＋ 낭독문</button>'}
     <span class="sp"></span>
     <button type="button" class="btn xs ghost" data-wmv="-1" ${i===0?'disabled':''} title="위로">↑</button><button type="button" class="btn xs ghost" data-wmv="1" ${i>=(r.steps||[]).length-1?'disabled':''} title="아래로">↓</button><button type="button" class="btn xs ghost" data-wins title="바로 아래에 빈 단계 끼우기">＋ 아래에</button><button type="button" class="btn xs ghost danger" data-wdel title="단계 빼기">빼기</button></div>
   </div></li>`}
 const saved=()=>{const s=$('#wSaved');if(s){s.textContent='· 저장했어요';s.classList.add('on');setTimeout(()=>s.classList.remove('on'),1400)}};
 function saveField(rid,t){const id=t.id||'';
  if(id==='wSec')return q(async()=>{const v=t.value.trim();const cur=(N().data('sec','route:'+rid)||{}).t||'';if(v===cur)return;if(v)await N().put('sec','route:'+rid,{t:v},'gm');else await N().del('sec','route:'+rid);saved()});
  const F={wName:['name',v=>v.trim()||'루트'],wGroup:['group',v=>v.trim()],wColor:['color',v=>v],wEntry:['entry',v=>v.trim()],wGoal:['goal',v=>v.trim()],wNote:['note',v=>v.trim()]};
  if(F[id]){const [k,f]=F[id];return q(async()=>{if(await N().patch('routes',rid,r=>{const v=f(t.value);if((r[k]||'')===v)return false;r[k]=v}))saved()})}
  if(id==='wVisible')return q(()=>N().patch('routes',rid,r=>{r.visible=t.checked}));
  const m=id.match(/^ws(\d+)([tpnr])$/);if(m){const i=+m[1];const k={t:'title',p:'spot',n:'note',r:'read'}[m[2]];return q(async()=>{if(await N().patch('routes',rid,r=>{const s=(r.steps||[])[i];if(!s)return false;const v=k==='spot'?t.value:t.value.trim();if((s[k]||'')===v)return false;s[k]=v}))saved()})}
  if(t.dataset.waddent!=null&&t.value){const i=+t.dataset.waddent,eid=t.value;return q(()=>N().patch('routes',rid,r=>{const s=(r.steps||[])[i];if(!s)return false;s.ents=s.ents||[];if(s.ents.includes(eid))return false;s.ents.push(eid)}))}}
 /* 「제목 — 메모」 · 「- 제목」 · 「1. 제목」 한 줄 = 단계 하나. 장소 이름과 똑같으면 장소로 잇는다 */
 function addLines(rid,text){const spots=spotList();const L=String(text||'').split(/\r?\n/).map(x=>x.replace(/^\s*(?:[-*•·]|\d+[.)])\s*/,'').trim()).filter(Boolean);if(!L.length)return;
  U2.focus='wQuick';return q(()=>N().patch('routes',rid,r=>{r.steps=r.steps||[];for(const l of L){const m=l.split(/\s+[—–]\s+|\t|\s+-\s+/);const title=m[0].trim(),note=m.slice(1).join(' — ').trim();const sp=spots.find(x=>x.name===title||(x.num&&(x.num+'. '+x.name)===title));r.steps.push({spot:sp?sp.id:'',title:sp?'':title,note,st:''})}}))}
 function wireWrite(el){const ed=el.querySelector('.swed');if(!ed)return;const rid=ed.dataset.route;
  const grow=t=>{t.style.height='auto';t.style.height=(t.scrollHeight+2)+'px'};
  $$('textarea[data-g]',ed).forEach(t=>{grow(t);t.addEventListener('input',()=>grow(t))});
  ed.addEventListener('change',e=>{const t=e.target;if(t.id==='wQuick')return;saveField(rid,t)});
  ed.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='s'||e.key==='S')){e.preventDefault();const a=document.activeElement;if(a&&ed.contains(a))saveField(rid,a);return}
   if(e.target.classList.contains('swtitle')&&e.key==='Enter'&&!e.isComposing){e.preventDefault();const n=e.target.closest('.swstep').querySelector('textarea');if(n)n.focus()}});
  const qk=$('#wQuick',ed);if(qk){qk.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();const v=qk.value;qk.value='';addLines(rid,v)}});
   qk.addEventListener('paste',e=>{const tx=(e.clipboardData||window.clipboardData).getData('text');if(tx&&/\n/.test(tx.trim())){e.preventDefault();qk.value='';addLines(rid,tx)}})}
  $$('.swg',el).forEach(g=>N().sortable(g,'[data-wsel]',ids=>orderRoutes(ids)));
  const ol=$('.swsteps',ed);if(ol)N().sortable(ol,'.swstep',ids=>orderSteps(rid,ids),{handleSel:'.swnum'});
  if(U2.focus){const f=U2.focus;U2.focus='';setTimeout(()=>{const x=document.getElementById(f);if(x){x.focus();if(f==='wName'&&x.select)x.select();x.scrollIntoView({block:'nearest',behavior:'smooth'})}},0)}}
 function wClick(e,t){const ws=t.closest('[data-wsel]');if(ws){U2.wsel=ws.dataset.wsel;N().render();const m=$('.swed');if(m&&innerWidth<900)m.scrollIntoView({block:'start'});return true}
  const ed=t.closest('.swed');if(!ed)return false;const rid=ed.dataset.route;const li=t.closest('.swstep');const i=li?+li.dataset.i:-1;
  const b=t.closest('button');if(!b)return false;
  if(b.dataset.w==='flow'){U2.view='flow';vSet('flow');N().render();setTimeout(()=>{const c=document.querySelector(`.fcard[data-route="${CSS.escape(rid)}"]`);if(c){c.scrollIntoView({block:'nearest',inline:'center'});c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),1200)}},60);return true}
  if(b.dataset.wst!=null&&i>=0){q(()=>setStep(rid,i,b.dataset.wst));return true}
  if(b.dataset.wmv&&i>=0){const d=+b.dataset.wmv;q(()=>N().patch('routes',rid,r=>{const j=i+d;if(j<0||j>=r.steps.length)return false;[r.steps[i],r.steps[j]]=[r.steps[j],r.steps[i]]}));return true}
  if(b.hasAttribute('data-wins')&&i>=0){U2.focus='ws'+(i+1)+'t';q(()=>N().patch('routes',rid,r=>{r.steps.splice(i+1,0,{spot:'',title:'',note:'',st:''})}));return true}
  if(b.hasAttribute('data-wdel')&&i>=0){(async()=>{const s=(N().data('routes',rid).steps||[])[i];if(!s)return;if((s.note||s.read)&&!await N().confirmBox(`「${stepTitle(s)}」 단계를 뺄까요? 적어 둔 글도 사라져요.`,'빼기'))return;q(()=>N().patch('routes',rid,r=>{r.steps.splice(i,1)}))})();return true}
  if(b.hasAttribute('data-wread')&&i>=0){U2.open[rid+':'+i]=1;U2.focus='ws'+i+'r';N().render();return true}
  if(b.dataset.wgoent){const id=b.dataset.wgoent;N().go('ents');setTimeout(()=>window.NT_ENTS&&NT_ENTS.select(id),0);return true}
  if(b.dataset.wdelent&&i>=0){const id=b.dataset.wdelent;q(()=>N().patch('routes',rid,r=>{const s=r.steps[i];if(!s)return false;s.ents=(s.ents||[]).filter(x=>x!==id)}));return true}
  if(b.dataset.wnext){const id=b.dataset.wnext;q(()=>N().patch('routes',rid,r=>{const n=new Set(r.next||[]);n.has(id)?n.delete(id):n.add(id);r.next=[...n]}));return true}
  return false}
 /* PL(또는 구경)이 단계를 누르면: 읽기 창 */
 function stepRead(rid,i){const r=N().data('routes',rid);const s=r&&(r.steps||[])[i];if(!s)return;const sp=s.spot&&N().data('spots',s.spot);const ents=(s.ents||[]).map(id=>({id,e:N().data('ents',id)})).filter(x=>x.e);
  const md=N().openModal(`<div class="mhead" style="border-color:${esc(r.color||'#888')}"><h2><small class="dim" style="font-size:12px;letter-spacing:.1em;display:block">${esc(r.name||'')} · ${i+1}/${r.steps.length} · ${STL[s.st||'']}</small>${esc(stepTitle(s))}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   ${s.read?`<blockquote class="swquote pre">${esc(s.read)}</blockquote>`:''}${s.note?`<div class="pre" style="line-height:1.7">${esc(s.note)}</div>`:''}${!s.read&&!s.note?'<div class="small dim">적어 둔 글이 없어요.</div>':''}
   ${ents.length?`<div class="sec">등장</div><div class="row" style="gap:4px;flex-wrap:wrap">${ents.map(x=>`<button type="button" class="chip" data-goent="${esc(x.id)}" style="border-color:${esc(entColor(x.e))}">${esc(x.e.title)}</button>`).join('')}</div>`:''}
   <div class="mfoot"><span class="sp"></span>${sp?`<button class="btn sm" id="srMap">📍 ${esc(spotName(s.spot))} · 지도에서</button>`:''}</div>`);
  $$('[data-goent]',md).forEach(b=>b.onclick=()=>{N().closeModal(true);N().go('ents');setTimeout(()=>window.NT_ENTS&&NT_ENTS.select(b.dataset.goent),0)});
  const mp=$('#srMap',md);if(mp)mp.onclick=()=>{N().closeModal(true);N().go('map');setTimeout(()=>{NT_MAP.select(s.spot);N().render()},0)}}
 N().MOD.scen={render};
 window.NT_SCEN={routes,prog,write,stepMenu,stepRead,cycleStep};
})();
