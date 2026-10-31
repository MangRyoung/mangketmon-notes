/* ---------- 망켓몬 세션 노트 — 앱 뼈대 (2026-10-26 감우) ----------
   주소: #c=<캠페인>&v=<탭>  (비밀구는 localStorage nt_sec_<캠페인> 에 — 주소에 넣지 않는다. 처음엔 ?gm=… / ?pl=… 로 받아 저장하고 지운다)
   역할: 'gm' | 좌석 id(PL) | null(구경). 문서 vis: pub(모두) · gm(GM만) · pl:<좌석>(그 PL 과 GM)
   데이터: D[kind][id] = {data, vis, updated_at}. 처음엔 nt_all 로 전부, 그 뒤엔 실시간(pub) + 알림(broadcast)으로 바뀐 것만 nt_get. */
"use strict";
window.NT=(()=>{
 const ST={camp:'',secret:'',role:null,camps:[],campInfo:null,view:'map',online:false,since:null,seats:[]};
 const D={};
 const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uid=p=>(p||'')+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-3);
 const clone=o=>JSON.parse(JSON.stringify(o));
 const cssu=s=>String(s??'').replace(/[\s"'()\\<>]/g,c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0').toUpperCase());
 const DBS=()=>window.NT_STORE;
 const gm=()=>ST.role==='gm';
 const me=()=>ST.role&&ST.role!=='gm'?ST.role:'';
 const VIEWS=[['map','지도'],['graph','관계도'],['ents','항목'],['pc','PC 시트'],['npc','NPC 시트'],['awk','각성체'],['awdb','각성체 DB'],['scen','시나리오'],['plan','일정'],['logs','기록'],['set','설정']];
 /* 10-29 망령: 위 탭은 6개 — 자료(항목 · 관계도) · 지도 · 시트 · 일정(일정 · 기록) · 시나리오 · 설정. 화면(VIEWS)과 주소는 그대로라 예전 링크 · 알림도 그대로 간다 */
 const TABS=[['ents','자료',['ents']],['map','지도',['map']],['pc','시트',['pc','npc','awk','awdb']],['graph','관계도',['graph']],['plan','일정',['plan','logs']],['scen','시나리오',['scen']],['set','설정',['set']]];   /* 10-30 망령 「관계도도 시트 옆에」: 자료에서 꺼내 시트 바로 옆 탭으로 (웹툴처럼) */
 const tabOf=v=>TABS.find(t=>t[2].includes(v))||TABS[0];
 /* 10-29: 각성체 DB 는 GM만. 10-30 망령 「PC 시트 옆에 NPC 시트」: NPC 시트는 GM, 또는 공개된 NPC 가 있을 때만 */
 const subOk=v=>v==='awdb'?gm():v==='npc'?(gm()||list('npc').length>0):true;
 const subGet=t=>{try{const v=localStorage.getItem('nt_sub_'+t[0]);return t[2].includes(v)&&subOk(v)?v:t[2][0]}catch(e){return t[2][0]}};
 /* 묶인 화면은 머리글(h2) 자리에 「항목 · 관계도」 같은 작은 탭을 둔다 */
 function subTabs(main){const t0=tabOf(ST.view);const t=[t0[0],t0[1],t0[2].filter(v=>subOk(v)||v===ST.view)];if(t[2].length<2)return;try{localStorage.setItem('nt_sub_'+t[0],ST.view)}catch(e){}
  const h=main.querySelector(':scope>.toolbar>h2');const html=`<div class="subtabs" role="tablist">${t[2].map(v=>`<button type="button" data-subv="${v}" class="${v===ST.view?'on':''}">${esc((VIEWS.find(x=>x[0]===v)||[])[1]||v)}</button>`).join('')}</div>`;
  if(h)h.outerHTML=html;else main.insertAdjacentHTML('afterbegin',`<div class="toolbar">${html}</div>`);
  const st=main.querySelector('.subtabs');if(st)st.addEventListener('click',e=>{const b=e.target.closest('[data-subv]');if(!b)return;e.stopPropagation();if(b.dataset.subv!==ST.view)go(b.dataset.subv)})}
 const MOD={};  /* view → {render(el), onDoc?} — 각 *_ui.js 가 등록 */

 /* ----- 알림 · 창 ----- */
 let toastT=0;
 function toast(t){const el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),2200)}
 /* 10-26 망령: 창을 쌓을 수 있다(확인창이 편집창을 지우지 않게). closeModal 은 맨 위 창만 닫는다. 고친 게 있으면(입력이 있었으면) 바깥 클릭 · Esc 로는 안 닫힌다 — 「닫기」나 저장으로만. */
 function openModal(html,cls,opt){opt=opt||{};if(!opt.stack)closeModal(true);const bg=document.createElement('div');bg.className='modalbg';bg.style.zIndex=String(1000+$$('.modalbg').length);bg.innerHTML=`<div class="modal ${cls||''}" role="dialog">${html}</div>`;document.body.appendChild(bg);
  bg.addEventListener('input',e=>{if(!e.target.closest('[data-nodirty]'))bg._dirty=1});
  bg.addEventListener('click',e=>{if(e.target.closest('[data-x]')){closeOne(bg,'x');return}if(e.target===bg){if(bg._dirty){const m=bg.firstElementChild;m.classList.remove('shake');void m.offsetWidth;m.classList.add('shake');toast('고친 내용이 있어요 — 「닫기」나 저장을 눌러 주세요');return}closeOne(bg,'bg')}});
  document.body.classList.add('modal-open');return bg.firstElementChild}
 function closeOne(bg,how){if(!bg||!bg.isConnected)return;bg.dispatchEvent(new CustomEvent('nt:close',{detail:{how}}));bg.remove();if(!$('.modalbg'))document.body.classList.remove('modal-open')}
 function closeModal(all){const L=$$('.modalbg');if(!L.length)return;if(all)L.forEach(b=>closeOne(b,'all'));else closeOne(L[L.length-1],'code')}
 document.addEventListener('keydown',e=>{if(e.key!=='Escape'||e.isComposing)return;const vq=$('.visqm');if(vq){vq.remove();return}if(document.body.classList.contains('favopen')){document.body.classList.remove('favopen');return}const L=$$('.modalbg');if(!L.length)return;const bg=L[L.length-1];if(bg._dirty){toast('고친 내용이 있어요 — 「닫기」나 저장을 눌러 주세요');return}closeOne(bg,'esc')});
 /* 새로 만든 문서의 편집 창을 저장 없이 닫으면(닫기 · 바깥 · Esc) 손대지 않은 문서는 도로 지운다 */
 function armDraft(kind,id){const snap=JSON.stringify(data(kind,id)||null);setTimeout(()=>{const L=$$('.modalbg');const bg=L[L.length-1];if(!bg)return;bg.addEventListener('nt:close',async e=>{const how=(e.detail||{}).how;if(how==='code'||how==='ok'||how==='all')return;if(JSON.stringify(data(kind,id)||null)!==snap)return;if(!doc(kind,id))return;await del(kind,id);toast('저장하지 않아 새 문서를 지웠어요')})},0)}
 function confirmBox(msg,ok){return new Promise(res=>{const m=openModal(`<div class="mhead"><h2>확인</h2></div><p style="white-space:pre-wrap">${esc(msg)}</p><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn ghost" data-x>취소</button><button class="btn pri" id="cfOk">${esc(ok||'확인')}</button></div>`,'',{stack:true});
  let done=false;const fin=v=>{if(done)return;done=true;res(v)};$('#cfOk',m).onclick=()=>{fin(true);closeOne(m.parentElement,'ok')};m.parentElement.addEventListener('nt:close',()=>fin(false))})}
 function promptBox(title,def,ph){return new Promise(res=>{const m=openModal(`<div class="mhead"><h2>${esc(title)}</h2></div><input type="text" id="pbIn" data-nodirty style="width:100%" value="${esc(def||'')}" placeholder="${esc(ph||'')}"><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn ghost" data-x>취소</button><button class="btn pri" id="pbOk">확인</button></div>`,'',{stack:true});
  let done=false;const fin=v=>{if(done)return;done=true;res(v)};const i=$('#pbIn',m);i.focus();i.select();const go=()=>{const v=i.value;fin(v);closeOne(m.parentElement,'ok')};$('#pbOk',m).onclick=go;i.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing)go()};m.parentElement.addEventListener('nt:close',()=>fin(null))})}

 /* ----- 데이터 ----- */
 const col=k=>D[k]||(D[k]={});
 const doc=(k,id)=>(D[k]||{})[id]||null;
 const data=(k,id)=>{const d=doc(k,id);return d?d.data:null};
 const list=k=>Object.entries(col(k)).map(([id,d])=>Object.assign({id,_vis:d.vis,_at:d.updated_at},d.data));
 const canSee=vis=>vis==='pub'||gm()||(me()&&vis==='pl:'+me());
 const canEdit=(k,id)=>gm()||!!(me()&&(((k==='pc'||k==='pcp')&&id===me())||(k==='avail'&&String(id).endsWith('_'+me()))));
 const VISL={pub:'모두',gm:'GM만'};
 const visLabel=v=>v==='pub'?'모두':v==='gm'?'GM만':v&&v.startsWith('pl:')?'PL 전용 · '+(seatName(v.slice(3))||v.slice(3)):v;
 const seatName=s=>{const t=data('pc',s);const mk=(window.NT_MAKER&&NT_MAKER.trainer(s))||null;return (mk&&mk.name)||(t&&t.name)||((ST.seats.find(x=>x.seat===s)||{}).name)||''};
 /* 공개 설정 고르기 칸. 값: pub · gm · pl:<seat> */
 function visSelect(cur,id,opt){opt=opt||{};const seats=ST.seats.length?ST.seats:[];cur=cur||'pub';
  const o=[['pub','👥 모두'],['gm','🔒 GM만']].concat(opt.noPl?[]:seats.map(s=>['pl:'+s.seat,'👤 '+(seatName(s.seat)||s.seat)+' 에게만']));
  if(cur.startsWith('pl:')&&!o.some(x=>x[0]===cur))o.push([cur,'👤 '+visLabel(cur)]);
  return `<select class="vissel" ${id?`id="${id}"`:''} data-vis title="공개 설정">${o.map(([v,l])=>`<option value="${v}" ${v===cur?'selected':''}>${l}</option>`).join('')}</select>`}
 const visBadge=(v,kind,id)=>{/* 10-26 망령: GM 은 상세 칸의 이 칩을 눌러 바로 공개 범위(모두 · GM만 · PL 한 명)를 바꾼다 */
  if(kind&&id&&gm()){v=v||'pub';return `<span role="button" tabindex="0" class="visb visq ${v==='pub'?'pub':v==='gm'?'gm':'pl'}" data-visq="${esc(kind)}|${esc(id)}" title="공개 범위 바꾸기 — 지금: ${esc(visLabel(v))}">${v==='pub'?'👥 모두':v==='gm'?'🔒 GM만':'👤 '+esc(seatName(v.slice(3))||'PL')+'만'} ▾</span>`}
  return !v||v==='pub'?'':`<span class="visb ${v==='gm'?'gm':'pl'}" title="${esc(visLabel(v))}">${v==='gm'?'🔒 GM':'👤 '+esc(seatName(v.slice(3))||'PL')}</span>`};
 function visMenu(b){document.querySelectorAll('.visqm').forEach(x=>x.remove());const [kind,id]=b.dataset.visq.split('|');const d=doc(kind,id);if(!d)return;const cur=d.vis||'pub';
  const o=[['pub','👥 모두에게'],['gm','🔒 GM만']].concat(ST.seats.map(x=>['pl:'+x.seat,'👤 '+(seatName(x.seat)||x.seat)+' 에게만']));
  const m=document.createElement('div');m.className='visqm';m.innerHTML=o.map(([v,l])=>`<button type="button" data-vq="${esc(v)}" class="${v===cur?'on':''}">${esc(l)}${v===cur?' ✓':''}</button>`).join('')+(ST.seats.length?'':'<div class="vqh">PL 한 명에게만 보이게 하려면 「설정」 탭에서 좌석을 먼저 만들어 주세요</div>');
  document.body.appendChild(m);const r=b.getBoundingClientRect();m.style.left=Math.max(6,Math.min(innerWidth-m.offsetWidth-6,r.left))+'px';m.style.top=(r.bottom+4+m.offsetHeight>innerHeight?Math.max(6,r.top-m.offsetHeight-4):r.bottom+4)+'px';
  m.addEventListener('click',async e=>{const x=e.target.closest('[data-vq]');if(!x)return;e.stopPropagation();m.remove();const v=x.dataset.vq;if(v===cur)return;await put(kind,id,clone(d.data),v);toast('공개 범위: '+visLabel(v))})}
 document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-visq]')){e.preventDefault();visMenu(e.target)}});
 /* 10-29: 창 안에서 Ctrl+S · Ctrl+Enter = 그 창의 저장 단추 */
 document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.isComposing||!(e.key==='s'||e.key==='S'||e.key==='Enter'))return;const L=$$('.modalbg');if(!L.length)return;const m=L[L.length-1];const ok=$('.mfoot .btn.pri',m)||[...$$('.btn.pri',m)].pop();if(!ok||ok.disabled)return;e.preventDefault();const a=document.activeElement;if(a&&a.blur)a.blur();ok.click()});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-visq]');if(b){e.preventDefault();e.stopPropagation();return visMenu(b)}if(!e.target.closest('.visqm'))document.querySelectorAll('.visqm').forEach(x=>x.remove())},true);

 /* 10-31 망령 「여러 사람이 겹치면? 새로고침 안 하면 안 고쳐지는 곳이 있는데 덮어씌워지는 거 아니지?」:
    문서는 통째로 저장된다. 창을 연 뒤 남이 같은 문서를 고쳤거나(실시간이 끊겼던 동안 포함) 옛 사본으로 저장하면 남의 칸이 옛 값으로 돌아갔다.
    → 저장 직전에 DB 의 최신 문서를 읽어 칸 단위로 합친다. 내 값이 「예전에 본 판」 그대로인 칸 = 내가 안 고친 칸 → 최신 값을 둔다.
    내가 바꾼 칸만 내 값으로. 객체 · 같은 길이 배열은 안쪽까지 같은 규칙. 예전 판 = 이 브라우저가 받은 지난 판들(HIST) + 아직 못 받은 판 직전의 사본 */
 const HIST=new Map();const hkey=(k,id)=>k+'/'+id;
 function histPush(kind,id){const c=col(kind)[id];if(!c||!c.data)return;const L=HIST.get(hkey(kind,id))||[];let j;try{j=JSON.stringify(c.data)}catch(e){return}if(L[L.length-1]!==j){L.push(j);while(L.length>6)L.shift();HIST.set(hkey(kind,id),L)}}
 const jeq=(a,b)=>{try{return JSON.stringify(a)===JSON.stringify(b)}catch(e){return false}};
 const isObj=x=>x&&typeof x==='object'&&!Array.isArray(x);
 function mergeVal(m,t,P){if(jeq(m,t))return m;
  if(isObj(m)&&isObj(t)){const o={};for(const k of new Set(Object.keys(m).concat(Object.keys(t)))){const Pk=P.filter(isObj).map(p=>p[k]);
    if(!(k in m)){if(Pk.some(v=>v!==undefined&&jeq(v,t[k])))continue;o[k]=t[k];continue}   /* 내가 지운 칸(최신이 예전 그대로) → 지움 · 남이 새로 넣은 칸 → 둠 */
    if(!(k in t)){if(P.filter(isObj).some(p=>(k in p)&&jeq(p[k],m[k])))continue;o[k]=m[k];continue}   /* 남이 지운 칸을 내가 안 고쳤으면 지운 채로 */
    o[k]=mergeVal(m[k],t[k],Pk.filter(v=>v!==undefined))}return o}
  if(Array.isArray(m)&&Array.isArray(t)&&m.length===t.length&&P.length&&P.every(p=>Array.isArray(p)&&p.length===m.length))return m.map((v,i)=>mergeVal(v,t[i],P.map(p=>p[i])));
  return P.some(p=>jeq(p,m))?t:m}   /* 내 값이 예전 판 그대로 = 안 고친 칸 → 최신 */
 async function fresh3(kind,id,obj){try{if(DBS().mode!=='supabase')return obj;const r=await DBS().get(ST.camp,ST.secret,kind,id);if(!r||!r.data)return obj;const cur=doc(kind,id);
   if(cur&&cur.updated_at&&r.updated_at&&r.updated_at<=cur.updated_at&&jeq(r.data,cur.data))return obj;   /* 내가 본 판이 최신 → 그대로 */
   const P=(HIST.get(hkey(kind,id))||[]).map(j=>{try{return JSON.parse(j)}catch(e){return null}}).filter(Boolean);if(cur&&cur.data&&!jeq(cur.data,r.data))P.push(cur.data);
   if(!P.length)return obj;const m=mergeVal(obj,r.data,P);if(!jeq(m,obj))console.info('[노트] 남이 고친 칸을 살려서 합쳤어요',kind,id);return m}catch(e){return obj}}
 async function put(kind,id,obj,vis,opt){if(!ST.camp)return false;mark(kind,id);const cur=doc(kind,id);const v=vis||(cur?cur.vis:'pub');
  try{if(cur&&!(opt&&opt.force))obj=await fresh3(kind,id,obj);histPush(kind,id);const t=await DBS().put(ST.camp,ST.secret,kind,id,obj,v);col(kind)[id]={data:clone(obj),vis:v,updated_at:typeof t==='string'?t:new Date().toISOString()};
   if(v!=='pub')DBS().ping(ST.camp,{t:'doc',kind,id});render();return true}
  catch(e){toast('저장 실패: '+e.message);return false}}
 async function patch(kind,id,fn,vis){const cur=data(kind,id);if(!cur)return false;const n=clone(cur);const r=fn(n);if(r===false)return false;return put(kind,id,n,vis)}
 async function del(kind,id){if(!ST.camp)return false;mark(kind,id);try{await DBS().del(ST.camp,ST.secret,kind,id);const had=doc(kind,id);delete col(kind)[id];if(had&&had.vis!=='pub')DBS().ping(ST.camp,{t:'del',kind,id});render();return true}catch(e){toast('지우기 실패: '+e.message);return false}}
 /* GM: 여러 문서의 공개 범위를 한 번에 (vis 'pub'|'gm'). filter(id,doc) 로 고른다 */
 async function bulkVis(kind,vis,filter,label){if(!gm())return;const rows=[];for(const [id,d] of Object.entries(col(kind))){if(filter&&!filter(id,d))continue;if(d.vis===vis)continue;rows.push({kind,id,data:d.data,vis})}
  if(!rows.length)return toast('바꿀 게 없어요');if(!await confirmBox(`${label||kind} ${rows.length}개를 ${vis==='pub'?'「모두」에게 공개':'「GM만」으로'} 할까요?`,vis==='pub'?'공개':'비공개'))return;await putMany(rows);toast(`${rows.length}개를 바꿨어요`)}
 const bulkBtns=(kind,filter,label)=>gm()?`<span class="seg bulk" title="이 탭의 문서 공개 범위를 한 번에"><button type="button" data-bulk="${kind}|gm" data-bl="${esc(label||'')}">🔒 전부 GM만</button><button type="button" data-bulk="${kind}|pub" data-bl="${esc(label||'')}">👁 전부 공개</button></span>`:'';
 document.addEventListener('click',e=>{const b=e.target.closest('[data-bulk]');if(!b)return;const [kind,vis]=b.dataset.bulk.split('|');const f=BULKF[kind];bulkVis(kind,vis,f&&f(),b.dataset.bl)});
 const BULKF={};
 async function putMany(rows){for(const r of rows)mark(r.kind,r.id);try{const n=await DBS().putMany(ST.camp,ST.secret,rows);for(const r of rows)col(r.kind)[r.id]={data:clone(r.data),vis:r.vis||'pub',updated_at:new Date().toISOString()};DBS().ping(ST.camp,{t:'all'});render();return n}catch(e){toast('가져오기 실패: '+e.message);return 0}}

 /* 10-29 망령 「변동 사항만 주고받게」: 받은 문서를 이 브라우저에 사본으로 두고(캠페인 · 역할마다), 다음에 열 때는 그 뒤에 바뀐 것만 받는다.
    지워진 것 · 볼 수 없게 바뀐 것은 id 목록(nt_ids · 내용 없음)으로 걸러 낸다. 사본이 7일 넘었거나 3MB 를 넘으면 전부 새로 받는다 */
 const CK=()=>'nt_cache_'+ST.camp+'_'+(ST.role||'x')+(me()?'_'+me():'');
 function cacheGet(){try{if(DBS().mode!=='supabase')return null;const j=JSON.parse(localStorage.getItem(CK())||'null');return j&&j.v===1&&j.since&&Date.now()-j.t<7*864e5?j:null}catch(e){return null}}
 let cacheT=0;function cacheSave(){if(!ST.camp||!ST.since)return;clearTimeout(cacheT);const key=CK();cacheT=setTimeout(()=>{try{const s=JSON.stringify({v:1,t:Date.now(),since:ST.since,D});if(s.length<3e6)localStorage.setItem(key,s);else localStorage.removeItem(key)}catch(e){try{localStorage.removeItem(key)}catch(e2){}}},1200)}
 const SYNC={full:0,delta:0,last:''};
 function apply(rows){for(const r of rows){histPush(r.kind,r.id);col(r.kind)[r.id]={data:r.data||{},vis:r.vis,updated_at:r.updated_at};if(!ST.since||r.updated_at>ST.since)ST.since=r.updated_at}}
 async function loadAll(){const c=cacheGet();for(const k in D)delete D[k];
  if(c){Object.assign(D,c.D);ST.since=c.since;try{const ids=await DBS().ids(ST.camp,ST.secret);const rows=await DBS().all(ST.camp,ST.secret,ST.since);const have=new Set(ids.map(x=>x.kind+'/'+x.id).concat(rows.map(x=>x.kind+'/'+x.id)));
    for(const k in D)for(const id in D[k])if(!have.has(k+'/'+id))delete D[k][id];apply(rows);SYNC.delta++;SYNC.last='바뀐 문서 '+rows.length+'개만 받음';cacheSave();return}catch(e){console.warn('cache',e);for(const k in D)delete D[k];ST.since=null}}
  const rows=await DBS().all(ST.camp,ST.secret,null);ST.since=null;apply(rows);SYNC.full++;SYNC.last='전부 받음 '+rows.length+'개';cacheSave()}
 /* 다시 맞추기: 바뀐 것만 + 지워진 것 */
 async function resync(){if(!ST.camp)return;try{const ids=await DBS().ids(ST.camp,ST.secret);const rows=await DBS().all(ST.camp,ST.secret,ST.since);apply(rows);
  const have=new Set(ids.map(x=>x.kind+'/'+x.id).concat(rows.map(x=>x.kind+'/'+x.id)));for(const k in D)for(const id in D[k])if(!have.has(k+'/'+id))delete D[k][id];render()}catch(e){console.warn('resync',e)}}
 let unsub=null;
 const MINE=new Map();const mark=(k,id)=>MINE.set(k+'/'+id,Date.now());const recent=(k,id)=>{const t=MINE.get(k+'/'+id);return t&&Date.now()-t<6000};
 function listen(){if(unsub)unsub();unsub=DBS().subscribe(ST.camp,{
  onDoc(kind,id,dat,vis,at){if(!canSee(vis)){if(doc(kind,id))delete col(kind)[id];render();return}const cur=doc(kind,id);if(cur&&cur.updated_at>=at)return;histPush(kind,id);col(kind)[id]={data:dat||{},vis,updated_at:at};if(at>(ST.since||''))ST.since=at;if(window.NT_NOTICE&&!recent(kind,id))NT_NOTICE.push(kind,id,cur?'edit':'new',dat);render()},
  onDel(kind,id){const had=doc(kind,id);if(had){if(window.NT_NOTICE&&!recent(kind,id))NT_NOTICE.push(kind,id,'del',had.data);delete col(kind)[id];render()}},
  async onPing(p){if(!p)return;if(p.t==='all')return resync();if(p.t==='mk'){if(window.NT_MAKER)try{await NT_MAKER.load(true);render()}catch(e){}return}   /* 10-31: 남이 노트에서 제작기 문서를 고쳤다 → 제작기 사본 다시 받기 */if(p.t==='del'){const had=doc(p.kind,p.id);if(had){if(window.NT_NOTICE&&!recent(p.kind,p.id))NT_NOTICE.push(p.kind,p.id,'del',had.data);delete col(p.kind)[p.id];render()}return}
   if(p.t==='doc'){try{const had=doc(p.kind,p.id);const r=await DBS().get(ST.camp,ST.secret,p.kind,p.id);if(r){if(had&&had.updated_at>=r.updated_at)return;histPush(p.kind,p.id);col(p.kind)[p.id]={data:r.data||{},vis:r.vis,updated_at:r.updated_at};if(window.NT_NOTICE&&!recent(p.kind,p.id))NT_NOTICE.push(p.kind,p.id,had?'edit':'new',r.data)}else delete col(p.kind)[p.id];render()}catch(e){}}},
  onStatus(st){ST.online=st==='SUBSCRIBED';const b=$('#ntLive');if(b){b.classList.toggle('on',ST.online);b.title=ST.online?'실시간 연결됨':'실시간 끊김 — 새로고침'}if(ST.online&&ST.since)resync()}})}

 /* ----- 그림 올리기 (줄여서) ----- */
 async function shrink(f,W,H,q){try{if(!/^image\/(png|jpe?g|webp|bmp|gif)$/i.test(f.type||''))return f;if(/gif/i.test(f.type))return f;const bmp=await createImageBitmap(f);const sc=Math.min(1,W/bmp.width,H/bmp.height);const cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(bmp.width*sc));cv.height=Math.max(1,Math.round(bmp.height*sc));cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);const bl=await new Promise(r=>cv.toBlob(r,'image/webp',q||.85));return bl&&bl.size<f.size?bl:f}catch(e){return f}}
 const SIZES={map:[3200,3200,.86],photo:[1600,1600,.84],face:[512,512,.86],thumb:[900,900,.84]};
 async function upload(f,kind,tag){const [W,H,q]=SIZES[kind]||SIZES.photo;const b=await shrink(f,W,H,q);toast('올리는 중…');const u=await DBS().uploadImage(`notes/${ST.camp}/${tag||kind}`,b);toast('올렸다');return u}
 /* 끌어 놓기 · 클릭 · Ctrl+V 로 파일 받기 */
 function bindDrop(el,onFiles,multi,accept){if(!el||el._dz)return;el._dz=1;const fi=el.querySelector('input[type=file]')||(()=>{const i=document.createElement('input');i.type='file';i.accept=accept||'image/*';i.hidden=true;if(multi)i.multiple=true;el.appendChild(i);return i})();
  const give=fs=>{fs=[...fs].filter(f=>accept||/^image\//.test(f.type));if(fs.length)onFiles(multi?fs:[fs[0]])};
  el.addEventListener('click',e=>{if(e.target.closest('button,a,input:not([type=file])'))return;fi.click()});fi.onchange=()=>{give(fi.files);fi.value=''};
  el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('over')});el.addEventListener('dragleave',()=>el.classList.remove('over'));el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('over');give(e.dataTransfer.files)});
  el.addEventListener('paste',e=>{const fs=[...(e.clipboardData||{}).files||[]];if(fs.length){e.preventDefault();give(fs)}})}

 /* ----- 주소 · 비밀구 ----- */
 const SK=c=>'nt_sec_'+c;
 function readHash(){const h=new URLSearchParams(location.hash.replace(/^#/,''));const q=new URLSearchParams(location.search);const o={camp:h.get('c')||q.get('c')||'',view:h.get('v')||'',gm:q.get('gm')||h.get('gm')||'',pl:q.get('pl')||h.get('pl')||''};return o}
 function setHash(){const p=new URLSearchParams();if(ST.camp)p.set('c',ST.camp);if(ST.camp&&ST.view)p.set('v',ST.view);const s='#'+p.toString();if(location.hash!==s)history.replaceState(null,'',location.pathname+s)}
 function cleanQuery(){if(location.search)history.replaceState(null,'',location.pathname+location.hash)}

 /* ----- 테마 (오레마스 vtheme.js 와 같은 키 om_vt 를 써서 두 툴이 같은 테마) ----- */
 /* 10-29 망령: 망각(mm) 테마 추가. 캠페인 설정의 「기본 테마」(data.theme)가 있으면 그 캠페인을 여는 동안 그 테마로 보여 준다 — 위 띠에서 다른 테마를 고르면 그걸 따른다(이 브라우저에 남는 내 테마는 그대로).
    「꾸밈」(data.skin)은 캠페인 분위기 장식: univ = 대학(학생증 PC 시트 · 도서 목록 카드 항목 · 도면 지도). html[data-skin] 으로 css/skin.css 가 덮는다 */
 const VT=[['p5','P5'],['p3','P3'],['p4','P4'],['mm','망각']];
 const SKINS=[['','없음'],['univ','대학 (학생증 · 도서 목록 카드 · 도면)']];
 let vtCamp='';
 const vtMine=()=>{try{const v=localStorage.getItem('om_vt');return VT.some(x=>x[0]===v)?v:'p4'}catch(e){return 'p4'}};
 const vtGet=()=>vtCamp||vtMine();
 const vtApply=()=>document.documentElement.setAttribute('data-vt',vtGet());
 const vtSet=v=>{vtCamp='';try{localStorage.setItem('om_vt',v)}catch(e){}vtApply();render()};
 const skin=()=>{const s=ST.campInfo&&ST.campInfo.data&&ST.campInfo.data.skin;return SKINS.some(x=>x[0]===s)?s:''};
 function campLook(c){const t=c&&c.data&&c.data.theme;vtCamp=VT.some(x=>x[0]===t)?t:'';vtApply();const k=c?skin():'';if(k)document.documentElement.setAttribute('data-skin',k);else document.documentElement.removeAttribute('data-skin')}
 vtApply();


 /* ----- 공용 조작 (10-26 망령) ----- */
 /* 끌어서 순서 바꾸기. container 안의 itemSel 요소들을 pointer 로 끈다(모바일도). 놓으면 onOrder(ids) — ids 는 data-id 순서. 핸들이 있으면 handleSel 안에서만 시작. */
 function sortable(container,itemSel,onOrder,opt){opt=opt||{};if(!container||container._ntSort)return;container._ntSort=1;let d=null;
  container.addEventListener('pointerdown',e=>{if(e.button!==0)return;const it=e.target.closest(itemSel);if(!it||!container.contains(it))return;if(opt.handleSel&&!e.target.closest(opt.handleSel))return;if(e.target.closest('input,textarea,select,button:not([data-drag]),a,[data-visq],[data-fav]'))return;
   d={it,x:e.clientX,y:e.clientY,id:e.pointerId,moved:false,ph:null}});
  container.addEventListener('pointermove',e=>{if(!d||d.id!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved){if(Math.hypot(dx,dy)<6)return;d.moved=true;try{container.setPointerCapture(e.pointerId)}catch(x){}d.it.classList.add('nt-dragging');d.ph=d.it.cloneNode(true);d.ph.className+=' nt-ghost';d.ph.style.cssText+=';position:fixed;pointer-events:none;z-index:2000;opacity:.85;width:'+d.it.offsetWidth+'px;left:'+(d.it.getBoundingClientRect().left)+'px;top:'+(d.it.getBoundingClientRect().top)+'px;margin:0';document.body.appendChild(d.ph);d.ox=e.clientX-d.it.getBoundingClientRect().left;d.oy=e.clientY-d.it.getBoundingClientRect().top;document.body.classList.add('nt-sorting')}
   e.preventDefault();d.ph.style.left=(e.clientX-d.ox)+'px';d.ph.style.top=(e.clientY-d.oy)+'px';
   const items=$$(itemSel,container).filter(x=>x!==d.it);const horiz=opt.horizontal;let before=null;for(const x of items){const r=x.getBoundingClientRect();const mid=horiz?r.left+r.width/2:r.top+r.height/2;if((horiz?e.clientX:e.clientY)<mid){before=x;break}}
   if(before)before.parentNode.insertBefore(d.it,before);else{const last=items[items.length-1];if(last)last.parentNode.insertBefore(d.it,last.nextSibling)}});
  const end=e=>{if(!d||d.id!==e.pointerId)return;const was=d;d=null;try{container.releasePointerCapture(e.pointerId)}catch(x){}if(was.ph)was.ph.remove();was.it.classList.remove('nt-dragging');document.body.classList.remove('nt-sorting');
   if(!was.moved)return;const ids=$$(itemSel,container).map(x=>x.dataset.id).filter(Boolean);if(onOrder)onOrder(ids);container.dataset.sorted='1';setTimeout(()=>{delete container.dataset.sorted},0)};
  container.addEventListener('pointerup',end);container.addEventListener('pointercancel',end);
  container.addEventListener('click',e=>{if(container.dataset.sorted){e.stopPropagation();e.preventDefault()}},true)}
 /* 순서 저장 도우미: kind 문서들의 order 를 ids 순서대로 다시 매긴다 */
 async function reorder(kind,ids,field){field=field||'order';const rows=[];ids.forEach((id,i)=>{const dd=doc(kind,id);if(dd&&dd.data[field]!==i)rows.push({kind,id,data:Object.assign({},dd.data,{[field]:i}),vis:dd.vis})});if(rows.length)await putMany(rows)}
 /* 우클릭 · 길게 누르기 메뉴. items: [{t:'글', k:'키', danger:true, on:fn}] */
 function ctxMenu(x,y,items){$$('.ntctx').forEach(m=>m.remove());if(!items||!items.length)return;const m=document.createElement('div');m.className='ntctx';m.innerHTML=items.map((it,i)=>it==='-'?'<hr>':`<button type="button" data-i="${i}" class="${it.danger?'danger':''}">${esc(it.t)}</button>`).join('');document.body.appendChild(m);
  const W=m.offsetWidth,H=m.offsetHeight;m.style.left=Math.max(4,Math.min(innerWidth-W-4,x))+'px';m.style.top=Math.max(4,Math.min(innerHeight-H-4,y))+'px';
  m.addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(!b)return;e.stopPropagation();m.remove();const it=items[+b.dataset.i];if(it&&it.on)it.on()});
  setTimeout(()=>{const off=e=>{if(!m.contains(e.target)){m.remove();document.removeEventListener('pointerdown',off,true)}};document.addEventListener('pointerdown',off,true)},0);return m}
 /* 요소에 우클릭 + 길게 누르기(500ms) 를 건다. getItems(target,e) 가 items 를 돌려주면 메뉴를 띄운다. */
 function bindCtx(root,sel,getItems){if(!root||root._ntCtx)return;root._ntCtx=1;
  root.addEventListener('contextmenu',e=>{const t=e.target.closest(sel);if(!t||!root.contains(t))return;const items=getItems(t,e);if(!items||!items.length)return;e.preventDefault();ctxMenu(e.clientX,e.clientY,items)});
  let lp=null;root.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;const t=e.target.closest(sel);if(!t)return;const x=e.clientX,y=e.clientY;lp={t,x,y,tm:setTimeout(()=>{lp=null;const items=getItems(t,e);if(items&&items.length){ctxMenu(x,y,items);if(navigator.vibrate)try{navigator.vibrate(10)}catch(z){}}},500)}},{passive:true});
  const cancel=e=>{if(lp&&(e.type!=='pointermove'||Math.hypot(e.clientX-lp.x,e.clientY-lp.y)>8)){clearTimeout(lp.tm);lp=null}};root.addEventListener('pointermove',cancel,{passive:true});root.addEventListener('pointerup',cancel);root.addEventListener('pointercancel',cancel)}
 /* 손가락 두 개 확대. el 에 걸고, get()→{zoom,px,py}, set({zoom,px,py}) 로 상태를 주고받는다. 한 손가락 끌기는 건드리지 않는다. */
 function pinch(el,get,set,lim){lim=lim||[.3,6];const pts=new Map();let p0=null;
  el.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2){const [a,b]=[...pts.values()];const s=get();p0={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:s.zoom,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,px:s.px,py:s.py};el.dataset.pinching='1'}},{passive:true});
  el.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!p0||pts.size<2)return;const [a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y)||1;const z=Math.max(lim[0],Math.min(lim[1],p0.z*d/p0.d));const r=el.getBoundingClientRect();const mx=p0.cx-r.left,my=p0.cy-r.top;set({zoom:z,px:mx-(mx-p0.px)*z/p0.z,py:my-(my-p0.py)*z/p0.z})},{passive:true});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2){p0=null;setTimeout(()=>{delete el.dataset.pinching},0)}};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)}

 /* ----- 화면 ----- */
 /* 10-26 망령: 다시 그려도 안쪽 스크롤 · 입력 포커스가 안 튄다 (실시간 갱신이 올 때마다 초기화되던 것) */
 const KEEPSEL='.flow,.steps,.side,.tblwrap,.loglist,.entlist,.entgrid,.splist,.notes-grid,.pcsheet,.sess-list,[data-keep]';
 function keepState(root){if(!root)return null;const sc=[];root.querySelectorAll(KEEPSEL).forEach((e,i)=>{if(e.scrollTop||e.scrollLeft)sc.push([e.className,i,e.scrollLeft,e.scrollTop])});const a=document.activeElement;const f=a&&root.contains(a)&&a.id?{id:a.id,s:a.selectionStart,e:a.selectionEnd,v:a.matches&&a.matches('[data-live]')?a.value:null}:null;return {sc,f,view:ST.view,y:window.scrollY}}
 function restoreState(root,k){if(!k||k.view!==ST.view)return;const L=root.querySelectorAll(KEEPSEL);k.sc.forEach(([cls,i,l,t])=>{const e=L[i];if(e&&e.className===cls){e.scrollLeft=l;e.scrollTop=t}});if(k.f){const e=root.querySelector('#'+CSS.escape(k.f.id));if(e&&e!==document.activeElement){try{if(k.f.v!=null&&e.matches('[data-live]')&&e.value!==k.f.v){e.value=k.f.v;e.dispatchEvent(new Event('input'))}/* 10-29: 쓰고 있던 칸은 다시 그려져도 글을 지킨다 */e.focus({preventScroll:true});if(k.f.s!=null&&e.setSelectionRange)e.setSelectionRange(k.f.s,k.f.e)}catch(x){}}}}

 function render(){const app=$('#app');if(!app)return;if(window.NT_ACCT)NT_ACCT.track();/* 10-29 접속자 */if(!ST.camp)return renderLobby(app);cacheSave();
  let sh=$('#ntShell',app);if(!sh){app.innerHTML=`<div id="ntShell"><header class="top"></header><div id="ntBody"><div id="ntFavSlot"></div><main id="ntMain"></main></div></div>`;sh=$('#ntShell',app)}
  renderTop($('.top',sh));const fs=$('#ntFavSlot',sh);if(fs&&window.NT_FAV)fs.innerHTML=NT_FAV.rail();const old=$('#ntMain',sh);const keep=keepState(old);const main=old.cloneNode(false);old.replaceWith(main);main.dataset.view=ST.view;/* 탭 모듈이 render 마다 el.addEventListener 를 붙이므로, 매번 새 요소로 바꿔 처리기가 쌓이거나 다른 탭 것과 섞이지 않게 한다 */const M=MOD[ST.view];
  try{if(M)M.render(main);else main.innerHTML='<div class="empty">준비 중</div>';subTabs(main);restoreState(main,keep)}catch(e){console.error(e);main.innerHTML=`<div class="empty vfail"><b>「${esc((VIEWS.find(v=>v[0]===ST.view)||[])[1]||ST.view)}」 화면을 그리지 못했어요.</b><div class="small dim" style="margin-top:6px;word-break:break-all">${esc(e&&e.message||e)}</div><button class="btn sm" onclick="NT.go('map')">지도로</button></div>`}}
 function renderTop(top){const c=ST.campInfo||{};const role=gm()?'<span class="badge gm">GM</span>':me()?`<span class="badge seat">${esc(seatName(me())||me())}</span>`:'<span class="badge">구경</span>';
  const cur=tabOf(ST.view)[0];const tabs=TABS.filter(([k])=>k!=='set'||gm()||me()).map(t=>`<button data-v="${t[0]===cur?ST.view:subGet(t)}" data-tab="${t[0]}" class="${t[0]===cur?'on':''}">${t[1]}</button>`).join('');
  top.innerHTML=`<a class="back" href="#" data-lobby>← 캠페인</a><h1 class="camp name"><b>${esc(c.name||'…')}</b>${c.data&&c.data.sub?`<small>${esc(c.data.sub)}</small>`:''}</h1>${role}<nav class="tabs" id="sceneTabs">${tabs}</nav><span class="sp"></span>
   ${(()=>{const r=((c.data||{}).om||{}).room;return r&&window.NT_LINK?`<a class="btn xs omgo" href="${esc(NT_LINK.omUrl(r))}" target="oremas" rel="noopener" title="이 캠페인과 이어진 웹툴 방 열기">🎲 웹툴</a>`:''})()}${window.NT_NOTICE?NT_NOTICE.bellHtml():''}<button type="button" class="favtop" data-favdrawer title="즐겨찾기">★</button><span id="ntLive" class="live ${ST.online?'on':''}" title="${ST.online?'실시간 연결됨':'연결 중…'}"></span>${!ST.role&&ST.acct==='pl'&&window.NT_ACCT?'<button class="btn xs pri" data-seatpick title="빈 PC 시트를 골라 앉아요">🪑 자리 앉기</button>':''}${!ST.role?`<button class="btn xs" data-login>${window.NT_ACCT&&NT_ACCT.tok()?'비밀구':'로그인'}</button>`:String(ST.secret).startsWith('u:')&&window.NT_ACCT?`<button class="btn xs ghost acmebtn" data-acme title="웹툴과 같은 계정 · 로그아웃">${esc(NT_ACCT.myName()||'계정')}</button>`:'<button class="btn xs ghost" data-logout title="이 브라우저에서 비밀구 지우기">나가기</button>'}
   <span class="vtsw compact"><button type="button" class="vtcur">${(VT.find(x=>x[0]===vtGet())||[])[1]}<i>▾</i></button><span class="vtmenu">${VT.map(([k,l])=>`<button type="button" data-vt="${k}" class="${k===vtGet()?'on':''}">${l}</button>`).join('')}</span></span>`;
  top.onclick=e=>{const t=e.target;const b=t.closest('button[data-v]');if(b){go(b.dataset.v);return}
   if(t.closest('[data-lobby]')){e.preventDefault();leave();return}
   if(t.closest('[data-login]'))return window.NT_ACCT&&!NT_ACCT.tok()?NT_ACCT.loginModal():loginBox();   /* 10-29: 로그인 안 했으면 계정 로그인(비밀구는 그 창 아래), 계정은 있는데 권한이 없으면 비밀구 */
   if(t.closest('[data-acme]'))return NT_ACCT.meMenu();
   if(t.closest('[data-seatpick]'))return NT_ACCT.seatPicker();
   if(t.closest('[data-logout]')){try{localStorage.removeItem(SK(ST.camp))}catch(x){}ST.secret='';ST.role=null;open(ST.camp);return}
   const v=t.closest('button[data-vt]');if(v){vtSet(v.dataset.vt);return}
   if(t.closest('.vtcur')){const s=t.closest('.vtsw');s.classList.toggle('open');return}};
  if(!window._vtswBound){window._vtswBound=1;document.addEventListener('pointerdown',ev=>{if(!ev.target.closest('.vtsw'))$$('.vtsw.open').forEach(x=>x.classList.remove('open'))},{capture:true})}}
 function go(v){ST.view=VIEWS.some(x=>x[0]===v)?v:'map';setHash();render();try{localStorage.setItem('nt_view',ST.view)}catch(e){}}

 /* ----- 로비 ----- */
 async function renderLobby(app){if(window.NT_ACCT)await NT_ACCT.me();const AC=window.NT_ACCT&&NT_ACCT.tok()&&DBS().acct;
  app.innerHTML=`<div class="lobby">${window.NT_ACCT?NT_ACCT.lobbyBar():''}<div class="lhead"><div><small>MANGKETMON · SESSION NOTES</small><h1>망켓몬 세션 노트</h1><p>캠페인마다 지도 · 관계도 · 항목 · PC 시트 · 시나리오 · 진행표. 웹툴과 같은 계정으로 로그인하면 받은 권한(GM · PL)대로 보이고, 링크만 있으면 공개한 것만 보인다.</p></div>
   <span class="vtsw">${VT.map(([k,l])=>`<button type="button" data-vt="${k}" class="${k===vtGet()?'on':''}">${l}</button>`).join('')}</span></div>
   <div class="camps" id="campList"><div class="dim">불러오는 중…</div></div>
   ${AC?`<div class="newcamp"><h3>새 캠페인</h3><div class="row"><input type="text" id="ncName" placeholder="캠페인 이름 (예: 무진)" style="flex:1;min-width:160px"><button class="btn pri" id="ncGo">만들기</button></div><p class="small dim">만든 계정이 그 캠페인의 GM 이 돼요. 플레이어 권한은 「👥 접속자 · 권한」에서 줘요.</p></div>`
   :`<div class="newcamp"><h3>새 캠페인</h3><div class="row"><input type="text" id="ncName" placeholder="캠페인 이름 (예: 무진)" style="flex:1;min-width:160px"><input type="text" id="ncSec" placeholder="GM 비밀구 (6자 이상 · 잊으면 복구 불가)" style="flex:1;min-width:200px"><button class="btn pri" id="ncGo">만들기</button></div><p class="small dim">로그인하면 비밀구 없이 계정으로 만들어요. 비밀구는 이 브라우저에 저장돼요. 다른 기기에서는 <code>?gm=비밀구</code> 를 주소 뒤에 붙여 한 번 열면 돼요. PL 에게는 <code>?pl=좌석비밀구</code> 링크를 줘요.</p></div>`}
   ${DBS().mode==='local'?'<p class="small dim">⚠ 공유 DB 설정이 없어 이 브라우저에만 저장돼요 (js/config.js).</p>':''}
   <p class="small dim foot">오레마스 · 제작기와 같은 Supabase 를 써요. <a href="${esc((window.NT_CONFIG||{}).oremasUrl||'#')}" target="_blank" rel="noopener">웹툴</a> · <a href="${esc((window.NT_CONFIG||{}).makerUrl||'#')}" target="_blank" rel="noopener">제작기</a></p></div>`;
  app.onclick=e=>{const v=e.target.closest('button[data-vt]');if(v)vtSet(v.dataset.vt)};if(window.NT_ACCT)NT_ACCT.bindBar(app);
  $('#ncGo',app).onclick=async()=>{const n=$('#ncName',app).value.trim();if(!n)return toast('이름을 적어 줘');
   if(AC){try{const id=await DBS().acct.campNew(NT_ACCT.tok(),n);toast('캠페인을 만들었다');await NT_ACCT.me(true);ST.camps=[];open(id)}catch(err){toast('만들기 실패: '+err.message)}return}
   const s=$('#ncSec',app).value.trim();if(s.length<6)return toast('비밀구는 6자 이상');
   try{const id=await DBS().create(n,s);try{localStorage.setItem(SK(id),s)}catch(x){}toast('캠페인을 만들었다');open(id)}catch(err){toast('만들기 실패: '+err.message)}};
  try{ST.camps=await DBS().camps()}catch(e){$('#campList',app).innerHTML=`<div class="empty">캠페인 목록을 못 읽었어요: ${esc(e.message)}<br><span class="small dim">Supabase 에 supabase/schema.sql 을 아직 안 넣었다면 먼저 넣어 주세요.</span></div>`;return}
  const L=$('#campList',app);if(!L)return;
  L.innerHTML=ST.camps.length?ST.camps.map(c=>{let has=window.NT_ACCT?NT_ACCT.campTag(c.id):'';try{if(!has)has=localStorage.getItem(SK(c.id))?'<span class="tag ok">비밀구 있음</span>':''}catch(e){}const d=c.data||{};return `<button class="campcard" data-c="${esc(c.id)}" style="${d.cover?`--cv:url('${cssu(d.cover)}')`:''}"><span class="cvr"></span><b>${esc(c.name||'이름 없음')}</b><small>${esc(d.sub||'')}</small><span class="meta">${has}<span class="dim">${esc((c.updated_at||'').slice(0,10))}</span></span></button>`}).join(''):'<div class="empty">아직 캠페인이 없어요. 아래에서 만들어요.</div>';
  L.onclick=e=>{const b=e.target.closest('[data-c]');if(b)open(b.dataset.c)}}

 async function loginBox(){const v=await promptBox('비밀구 (GM 또는 PL 좌석)','','비밀구를 적으면 이 브라우저에 저장돼요');if(v==null)return;const s=v.trim();if(!s)return;
  try{const w=await DBS().whoami(ST.camp,s);if(!w)return toast('맞는 비밀구가 아니에요');try{localStorage.setItem(SK(ST.camp),s)}catch(e){}toast(w==='gm'?'GM 으로 들어왔어요':'PL 좌석으로 들어왔어요');open(ST.camp)}catch(e){toast('확인 실패: '+e.message)}}

 async function open(camp,view){const q=readHash();ST.camp=camp;let sec='';try{sec=localStorage.getItem(SK(camp))||''}catch(e){}
  const given=q.gm||q.pl;if(given){sec=given;try{localStorage.setItem(SK(camp),sec)}catch(e){}cleanQuery()}
  ST.secret=sec;ST.role=null;ST.view=view||q.view||(()=>{try{return localStorage.getItem('nt_view')}catch(e){return ''}})()||'map';if(!VIEWS.some(x=>x[0]===ST.view))ST.view='map';
  const app=$('#app');app.innerHTML='<div class="lobby dim">캠페인을 여는 중…</div>';
  try{if(!ST.camps.length)ST.camps=await DBS().camps();ST.campInfo=ST.camps.find(c=>c.id===camp)||null;if(!ST.campInfo){toast('없는 캠페인이에요');ST.camp='';setHash();return render()}campLook(ST.campInfo);
   /* 10-29 계정: 링크로 받은 비밀구가 없으면 계정(웹툴과 같은 로그인) 권한을 먼저 — 권한이 없으면 저장된 비밀구 */
   const tok=!given&&window.NT_ACCT?NT_ACCT.tok():'';
   ST.acct='';if(tok){/* 10-29 망령 「웹툴처럼 로그인한 PL 은 기본 PL 권한으로 자기가 자리에 앉게」: 열면 PL 권한(자리 없음)을 받는다 (patch_2026-10-29_PL기본.sql) */try{ST.acct=await DBS().acct.join(tok,camp)||''}catch(e){}
    try{const w=await DBS().whoami(camp,'u:'+tok);if(w){ST.role=w;ST.secret='u:'+tok}}catch(e){}}
   if(!ST.role&&sec){ST.secret=sec;ST.role=await DBS().whoami(camp,sec);if(!ST.role){toast('저장된 비밀구가 맞지 않아 구경 모드예요');ST.secret=''}}
   try{ST.seats=await DBS().seats(camp)||[]}catch(e){ST.seats=[]}
   await loadAll();if(window.NT_MAKER)NT_MAKER.load().then(()=>render()).catch(()=>{});
   setHash();app.innerHTML='';render();listen();if(window.NT_ACCT)NT_ACCT.afterOpen()}
  catch(e){app.innerHTML=`<div class="empty">열지 못했어요: ${esc(e.message)} <button class="btn sm" onclick="NT.leave()">캠페인 목록</button></div>`}}
 function leave(){if(unsub){unsub();unsub=null}ST.camp='';ST.role=null;ST.campInfo=null;campLook(null);for(const k in D)delete D[k];setHash();render()}
 async function refreshCamp(){try{ST.camps=await DBS().camps();ST.campInfo=ST.camps.find(c=>c.id===ST.camp)||ST.campInfo;campLook(ST.campInfo)}catch(e){}try{ST.seats=await DBS().seats(ST.camp)||[]}catch(e){}render()}

 window.addEventListener('hashchange',()=>{const q=readHash();if(q.camp!==ST.camp){if(q.camp)open(q.camp,q.view);else leave()}else if(q.view&&q.view!==ST.view)go(q.view)});
 window.addEventListener('DOMContentLoaded',()=>{const q=readHash();if(q.camp)open(q.camp,q.view);else render()});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&ST.camp)resync()});

 return {loginBox,ST,D,SYNC,$,$$,esc,uid,clone,cssu,gm,me,canSee,canEdit,toast,openModal,closeModal,confirmBox,promptBox,armDraft,sortable,reorder,ctxMenu,bindCtx,pinch,doc,data,list,put,patch,del,putMany,bulkVis,bulkBtns,BULKF,upload,shrink,bindDrop,visSelect,visBadge,visLabel,seatName,render,go,open,leave,refreshCamp,resync,MOD,VIEWS,TABS,DBS,VT,SKINS,skin};
})();
