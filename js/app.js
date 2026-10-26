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
 const VIEWS=[['map','지도'],['graph','관계도'],['ents','항목'],['pc','PC 시트'],['scen','시나리오'],['plan','일정'],['logs','기록'],['set','설정']];
 const MOD={};  /* view → {render(el), onDoc?} — 각 *_ui.js 가 등록 */

 /* ----- 알림 · 창 ----- */
 let toastT=0;
 function toast(t){const el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),2200)}
 function openModal(html,cls){closeModal();const bg=document.createElement('div');bg.className='modalbg';bg.innerHTML=`<div class="modal ${cls||''}" role="dialog">${html}</div>`;document.body.appendChild(bg);
  bg.addEventListener('click',e=>{if(e.target===bg||e.target.closest('[data-x]'))closeModal()});document.body.classList.add('modal-open');return bg.firstElementChild}
 function closeModal(){$$('.modalbg').forEach(x=>x.remove());document.body.classList.remove('modal-open')}
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('.modalbg'))closeModal()});
 function confirmBox(msg,ok){return new Promise(res=>{const m=openModal(`<div class="mhead"><h2>확인</h2></div><p style="white-space:pre-wrap">${esc(msg)}</p><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn ghost" data-x>취소</button><button class="btn pri" id="cfOk">${esc(ok||'확인')}</button></div>`);
  $('#cfOk',m).onclick=()=>{closeModal();res(true)};m.parentElement.addEventListener('click',e=>{if(e.target===m.parentElement||e.target.closest('[data-x]'))res(false)})})}
 function promptBox(title,def,ph){return new Promise(res=>{const m=openModal(`<div class="mhead"><h2>${esc(title)}</h2></div><input type="text" id="pbIn" style="width:100%" value="${esc(def||'')}" placeholder="${esc(ph||'')}"><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn ghost" data-x>취소</button><button class="btn pri" id="pbOk">확인</button></div>`);
  const i=$('#pbIn',m);i.focus();i.select();const go=()=>{const v=i.value;closeModal();res(v)};$('#pbOk',m).onclick=go;i.onkeydown=e=>{if(e.key==='Enter')go()};m.parentElement.addEventListener('click',e=>{if(e.target===m.parentElement||e.target.closest('[data-x]'))res(null)})})}

 /* ----- 데이터 ----- */
 const col=k=>D[k]||(D[k]={});
 const doc=(k,id)=>(D[k]||{})[id]||null;
 const data=(k,id)=>{const d=doc(k,id);return d?d.data:null};
 const list=k=>Object.entries(col(k)).map(([id,d])=>Object.assign({id,_vis:d.vis,_at:d.updated_at},d.data));
 const canSee=vis=>vis==='pub'||gm()||(me()&&vis==='pl:'+me());
 const canEdit=(k,id)=>gm()||!!(me()&&(((k==='pc'||k==='pcp')&&id===me())||(k==='avail'&&String(id).endsWith('_'+me()))));
 const VISL={pub:'모두',gm:'GM만'};
 const visLabel=v=>v==='pub'?'모두':v==='gm'?'GM만':v&&v.startsWith('pl:')?'PL 전용 · '+(seatName(v.slice(3))||v.slice(3)):v;
 const seatName=s=>{const t=data('pc',s);const mk=(window.NT_MAKER&&NT_MAKER.trainer(s))||null;return (t&&t.name)||(mk&&mk.name)||((ST.seats.find(x=>x.seat===s)||{}).name)||''};
 /* 공개 설정 고르기 칸. 값: pub · gm · pl:<seat> */
 function visSelect(cur,id,opt){opt=opt||{};const seats=ST.seats.length?ST.seats:[];cur=cur||'pub';
  const o=[['pub','👥 모두'],['gm','🔒 GM만']].concat(opt.noPl?[]:seats.map(s=>['pl:'+s.seat,'👤 '+(seatName(s.seat)||s.seat)+' 에게만']));
  if(cur.startsWith('pl:')&&!o.some(x=>x[0]===cur))o.push([cur,'👤 '+visLabel(cur)]);
  return `<select class="vissel" ${id?`id="${id}"`:''} data-vis title="공개 설정">${o.map(([v,l])=>`<option value="${v}" ${v===cur?'selected':''}>${l}</option>`).join('')}</select>`}
 const visBadge=v=>!v||v==='pub'?'':`<span class="visb ${v==='gm'?'gm':'pl'}" title="${esc(visLabel(v))}">${v==='gm'?'🔒 GM':'👤 '+esc(seatName(v.slice(3))||'PL')}</span>`;

 async function put(kind,id,obj,vis){if(!ST.camp)return false;const cur=doc(kind,id);const v=vis||(cur?cur.vis:'pub');
  try{const t=await DBS().put(ST.camp,ST.secret,kind,id,obj,v);col(kind)[id]={data:clone(obj),vis:v,updated_at:typeof t==='string'?t:new Date().toISOString()};
   if(v!=='pub')DBS().ping(ST.camp,{t:'doc',kind,id});render();return true}
  catch(e){toast('저장 실패: '+e.message);return false}}
 async function patch(kind,id,fn,vis){const cur=data(kind,id);if(!cur)return false;const n=clone(cur);const r=fn(n);if(r===false)return false;return put(kind,id,n,vis)}
 async function del(kind,id){if(!ST.camp)return false;try{await DBS().del(ST.camp,ST.secret,kind,id);const had=doc(kind,id);delete col(kind)[id];if(had&&had.vis!=='pub')DBS().ping(ST.camp,{t:'del',kind,id});render();return true}catch(e){toast('지우기 실패: '+e.message);return false}}
 /* GM: 여러 문서의 공개 범위를 한 번에 (vis 'pub'|'gm'). filter(id,doc) 로 고른다 */
 async function bulkVis(kind,vis,filter,label){if(!gm())return;const rows=[];for(const [id,d] of Object.entries(col(kind))){if(filter&&!filter(id,d))continue;if(d.vis===vis)continue;rows.push({kind,id,data:d.data,vis})}
  if(!rows.length)return toast('바꿀 게 없어요');if(!await confirmBox(`${label||kind} ${rows.length}개를 ${vis==='pub'?'「모두」에게 공개':'「GM만」으로'} 할까요?`,vis==='pub'?'공개':'비공개'))return;await putMany(rows);toast(`${rows.length}개를 바꿨어요`)}
 const bulkBtns=(kind,filter,label)=>gm()?`<span class="seg bulk" title="이 탭의 문서 공개 범위를 한 번에"><button type="button" data-bulk="${kind}|gm" data-bl="${esc(label||'')}">🔒 전부 GM만</button><button type="button" data-bulk="${kind}|pub" data-bl="${esc(label||'')}">👁 전부 공개</button></span>`:'';
 document.addEventListener('click',e=>{const b=e.target.closest('[data-bulk]');if(!b)return;const [kind,vis]=b.dataset.bulk.split('|');const f=BULKF[kind];bulkVis(kind,vis,f&&f(),b.dataset.bl)});
 const BULKF={};
 async function putMany(rows){try{const n=await DBS().putMany(ST.camp,ST.secret,rows);for(const r of rows)col(r.kind)[r.id]={data:clone(r.data),vis:r.vis||'pub',updated_at:new Date().toISOString()};DBS().ping(ST.camp,{t:'all'});render();return n}catch(e){toast('가져오기 실패: '+e.message);return 0}}

 async function loadAll(){const rows=await DBS().all(ST.camp,ST.secret,null);for(const k in D)delete D[k];let mx=null;for(const r of rows){col(r.kind)[r.id]={data:r.data||{},vis:r.vis,updated_at:r.updated_at};if(!mx||r.updated_at>mx)mx=r.updated_at}ST.since=mx}
 /* 다시 맞추기: 바뀐 것만 + 지워진 것 */
 async function resync(){if(!ST.camp)return;try{const rows=await DBS().all(ST.camp,ST.secret,ST.since);for(const r of rows){col(r.kind)[r.id]={data:r.data||{},vis:r.vis,updated_at:r.updated_at};if(!ST.since||r.updated_at>ST.since)ST.since=r.updated_at}
  const ids=await DBS().ids(ST.camp,ST.secret);const have=new Set(ids.map(x=>x.kind+'/'+x.id));for(const k in D)for(const id in D[k])if(!have.has(k+'/'+id))delete D[k][id];render()}catch(e){console.warn('resync',e)}}
 let unsub=null;
 function listen(){if(unsub)unsub();unsub=DBS().subscribe(ST.camp,{
  onDoc(kind,id,dat,vis,at){if(!canSee(vis)){if(doc(kind,id))delete col(kind)[id];render();return}const cur=doc(kind,id);if(cur&&cur.updated_at>=at)return;col(kind)[id]={data:dat||{},vis,updated_at:at};if(at>(ST.since||''))ST.since=at;render()},
  onDel(kind,id){if(doc(kind,id)){delete col(kind)[id];render()}},
  async onPing(p){if(!p)return;if(p.t==='all')return resync();if(p.t==='del'){if(doc(p.kind,p.id)){delete col(p.kind)[p.id];render()}return}
   if(p.t==='doc'){try{const r=await DBS().get(ST.camp,ST.secret,p.kind,p.id);if(r){col(p.kind)[p.id]={data:r.data||{},vis:r.vis,updated_at:r.updated_at}}else delete col(p.kind)[p.id];render()}catch(e){}}},
  onStatus(st){ST.online=st==='SUBSCRIBED';const b=$('#ntLive');if(b){b.classList.toggle('on',ST.online);b.title=ST.online?'실시간 연결됨':'실시간 끊김 — 새로고침'}if(ST.online&&ST.since)resync()}})}

 /* ----- 그림 올리기 (줄여서) ----- */
 async function shrink(f,W,H,q){try{if(!/^image\/(png|jpe?g|webp|bmp|gif)$/i.test(f.type||''))return f;if(/gif/i.test(f.type))return f;const bmp=await createImageBitmap(f);const sc=Math.min(1,W/bmp.width,H/bmp.height);const cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(bmp.width*sc));cv.height=Math.max(1,Math.round(bmp.height*sc));cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);const bl=await new Promise(r=>cv.toBlob(r,'image/webp',q||.85));return bl&&bl.size<f.size?bl:f}catch(e){return f}}
 const SIZES={map:[3200,3200,.86],photo:[1600,1600,.84],face:[512,512,.86],thumb:[900,900,.84]};
 async function upload(f,kind,tag){const [W,H,q]=SIZES[kind]||SIZES.photo;const b=await shrink(f,W,H,q);toast('올리는 중…');const u=await DBS().uploadImage(`notes/${ST.camp}/${tag||kind}`,b);toast('올렸다');return u}
 /* 끌어 놓기 · 클릭 · Ctrl+V 로 파일 받기 */
 function bindDrop(el,onFiles,multi){if(!el||el._dz)return;el._dz=1;const fi=el.querySelector('input[type=file]')||(()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.hidden=true;if(multi)i.multiple=true;el.appendChild(i);return i})();
  const give=fs=>{fs=[...fs].filter(f=>/^image\//.test(f.type));if(fs.length)onFiles(multi?fs:[fs[0]])};
  el.addEventListener('click',e=>{if(e.target.closest('button,a,input:not([type=file])'))return;fi.click()});fi.onchange=()=>{give(fi.files);fi.value=''};
  el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('over')});el.addEventListener('dragleave',()=>el.classList.remove('over'));el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('over');give(e.dataTransfer.files)});
  el.addEventListener('paste',e=>{const fs=[...(e.clipboardData||{}).files||[]];if(fs.length){e.preventDefault();give(fs)}})}

 /* ----- 주소 · 비밀구 ----- */
 const SK=c=>'nt_sec_'+c;
 function readHash(){const h=new URLSearchParams(location.hash.replace(/^#/,''));const q=new URLSearchParams(location.search);const o={camp:h.get('c')||q.get('c')||'',view:h.get('v')||'',gm:q.get('gm')||h.get('gm')||'',pl:q.get('pl')||h.get('pl')||''};return o}
 function setHash(){const p=new URLSearchParams();if(ST.camp)p.set('c',ST.camp);if(ST.camp&&ST.view)p.set('v',ST.view);const s='#'+p.toString();if(location.hash!==s)history.replaceState(null,'',location.pathname+s)}
 function cleanQuery(){if(location.search)history.replaceState(null,'',location.pathname+location.hash)}

 /* ----- 테마 (오레마스 vtheme.js 와 같은 키 om_vt 를 써서 두 툴이 같은 테마) ----- */
 const VT=[['p5','P5'],['p3','P3'],['p4','P4']];
 const vtGet=()=>{try{const v=localStorage.getItem('om_vt');return VT.some(x=>x[0]===v)?v:'p4'}catch(e){return 'p4'}};
 const vtSet=v=>{document.documentElement.setAttribute('data-vt',v);try{localStorage.setItem('om_vt',v)}catch(e){}render()};
 document.documentElement.setAttribute('data-vt',vtGet());

 /* ----- 화면 ----- */
 function render(){const app=$('#app');if(!app)return;if(!ST.camp)return renderLobby(app);
  let sh=$('#ntShell',app);if(!sh){app.innerHTML=`<div id="ntShell"><header class="top"></header><div id="ntBody"><div id="ntFavSlot"></div><main id="ntMain"></main></div></div>`;sh=$('#ntShell',app)}
  renderTop($('.top',sh));const fs=$('#ntFavSlot',sh);if(fs&&window.NT_FAV)fs.innerHTML=NT_FAV.rail();const main=$('#ntMain',sh);main.dataset.view=ST.view;const M=MOD[ST.view];
  try{if(M)M.render(main);else main.innerHTML='<div class="empty">준비 중</div>'}catch(e){console.error(e);main.innerHTML=`<div class="empty vfail"><b>「${esc((VIEWS.find(v=>v[0]===ST.view)||[])[1]||ST.view)}」 화면을 그리지 못했어요.</b><div class="small dim" style="margin-top:6px;word-break:break-all">${esc(e&&e.message||e)}</div><button class="btn sm" onclick="NT.go('map')">지도로</button></div>`}}
 function renderTop(top){const c=ST.campInfo||{};const role=gm()?'<span class="badge gm">GM</span>':me()?`<span class="badge seat">${esc(seatName(me())||me())}</span>`:'<span class="badge">구경</span>';
  const tabs=VIEWS.filter(([k])=>k!=='set'||gm()||me()).map(([k,n])=>`<button data-v="${k}" class="${ST.view===k?'on':''}">${n}</button>`).join('');
  top.innerHTML=`<a class="back" href="#" data-lobby>← 캠페인</a><h1 class="camp name"><b>${esc(c.name||'…')}</b>${c.data&&c.data.sub?`<small>${esc(c.data.sub)}</small>`:''}</h1>${role}<nav class="tabs" id="sceneTabs">${tabs}</nav><span class="sp"></span>
   <span id="ntLive" class="live ${ST.online?'on':''}" title="${ST.online?'실시간 연결됨':'연결 중…'}"></span>${!ST.role?'<button class="btn xs" data-login>비밀구</button>':'<button class="btn xs ghost" data-logout title="이 브라우저에서 비밀구 지우기">나가기</button>'}
   <span class="vtsw compact"><button type="button" class="vtcur">${(VT.find(x=>x[0]===vtGet())||[])[1]}<i>▾</i></button><span class="vtmenu">${VT.map(([k,l])=>`<button type="button" data-vt="${k}" class="${k===vtGet()?'on':''}">${l}</button>`).join('')}</span></span>`;
  top.onclick=e=>{const t=e.target;const b=t.closest('button[data-v]');if(b){go(b.dataset.v);return}
   if(t.closest('[data-lobby]')){e.preventDefault();leave();return}
   if(t.closest('[data-login]'))return loginBox();
   if(t.closest('[data-logout]')){try{localStorage.removeItem(SK(ST.camp))}catch(x){}ST.secret='';ST.role=null;open(ST.camp);return}
   const v=t.closest('button[data-vt]');if(v){vtSet(v.dataset.vt);return}
   if(t.closest('.vtcur')){const s=t.closest('.vtsw');s.classList.toggle('open');return}};
  document.addEventListener('pointerdown',ev=>{if(!ev.target.closest('.vtsw'))$$('.vtsw.open').forEach(x=>x.classList.remove('open'))},{capture:true})}
 function go(v){ST.view=VIEWS.some(x=>x[0]===v)?v:'map';setHash();render();try{localStorage.setItem('nt_view',ST.view)}catch(e){}}

 /* ----- 로비 ----- */
 async function renderLobby(app){app.innerHTML=`<div class="lobby"><div class="lhead"><div><small>MANGKETMON · SESSION NOTES</small><h1>망켓몬 세션 노트</h1><p>캠페인마다 지도 · 관계도 · 항목 · PC 시트 · 시나리오 · 진행표. GM 비밀구로 들어오면 전부 보이고, 링크만 있으면 공개한 것만 보인다.</p></div>
   <span class="vtsw">${VT.map(([k,l])=>`<button type="button" data-vt="${k}" class="${k===vtGet()?'on':''}">${l}</button>`).join('')}</span></div>
   <div class="camps" id="campList"><div class="dim">불러오는 중…</div></div>
   <div class="newcamp"><h3>새 캠페인</h3><div class="row"><input type="text" id="ncName" placeholder="캠페인 이름 (예: 무진)" style="flex:1;min-width:160px"><input type="text" id="ncSec" placeholder="GM 비밀구 (6자 이상 · 잊으면 복구 불가)" style="flex:1;min-width:200px"><button class="btn pri" id="ncGo">만들기</button></div><p class="small dim">비밀구는 이 브라우저에 저장돼요. 다른 기기에서는 <code>?gm=비밀구</code> 를 주소 뒤에 붙여 한 번 열면 돼요. PL 에게는 <code>?pl=좌석비밀구</code> 링크를 줘요.</p></div>
   ${DBS().mode==='local'?'<p class="small dim">⚠ 공유 DB 설정이 없어 이 브라우저에만 저장돼요 (js/config.js).</p>':''}
   <p class="small dim foot">오레마스 · 제작기와 같은 Supabase 를 써요. <a href="${esc((window.NT_CONFIG||{}).oremasUrl||'#')}" target="_blank" rel="noopener">웹툴</a> · <a href="${esc((window.NT_CONFIG||{}).makerUrl||'#')}" target="_blank" rel="noopener">제작기</a></p></div>`;
  app.onclick=e=>{const v=e.target.closest('button[data-vt]');if(v)vtSet(v.dataset.vt)};
  $('#ncGo',app).onclick=async()=>{const n=$('#ncName',app).value.trim(),s=$('#ncSec',app).value.trim();if(!n)return toast('이름을 적어 줘');if(s.length<6)return toast('비밀구는 6자 이상');
   try{const id=await DBS().create(n,s);try{localStorage.setItem(SK(id),s)}catch(x){}toast('캠페인을 만들었다');open(id)}catch(err){toast('만들기 실패: '+err.message)}};
  try{ST.camps=await DBS().camps()}catch(e){$('#campList',app).innerHTML=`<div class="empty">캠페인 목록을 못 읽었어요: ${esc(e.message)}<br><span class="small dim">Supabase 에 supabase/schema.sql 을 아직 안 넣었다면 먼저 넣어 주세요.</span></div>`;return}
  const L=$('#campList',app);if(!L)return;
  L.innerHTML=ST.camps.length?ST.camps.map(c=>{let has='';try{has=localStorage.getItem(SK(c.id))?'<span class="tag ok">비밀구 있음</span>':''}catch(e){}const d=c.data||{};return `<button class="campcard" data-c="${esc(c.id)}" style="${d.cover?`--cv:url('${cssu(d.cover)}')`:''}"><span class="cvr"></span><b>${esc(c.name||'이름 없음')}</b><small>${esc(d.sub||'')}</small><span class="meta">${has}<span class="dim">${esc((c.updated_at||'').slice(0,10))}</span></span></button>`}).join(''):'<div class="empty">아직 캠페인이 없어요. 아래에서 만들어요.</div>';
  L.onclick=e=>{const b=e.target.closest('[data-c]');if(b)open(b.dataset.c)}}

 async function loginBox(){const v=await promptBox('비밀구 (GM 또는 PL 좌석)','','비밀구를 적으면 이 브라우저에 저장돼요');if(v==null)return;const s=v.trim();if(!s)return;
  try{const w=await DBS().whoami(ST.camp,s);if(!w)return toast('맞는 비밀구가 아니에요');try{localStorage.setItem(SK(ST.camp),s)}catch(e){}toast(w==='gm'?'GM 으로 들어왔어요':'PL 좌석으로 들어왔어요');open(ST.camp)}catch(e){toast('확인 실패: '+e.message)}}

 async function open(camp,view){const q=readHash();ST.camp=camp;let sec='';try{sec=localStorage.getItem(SK(camp))||''}catch(e){}
  const given=q.gm||q.pl;if(given){sec=given;try{localStorage.setItem(SK(camp),sec)}catch(e){}cleanQuery()}
  ST.secret=sec;ST.role=null;ST.view=view||q.view||(()=>{try{return localStorage.getItem('nt_view')}catch(e){return ''}})()||'map';if(!VIEWS.some(x=>x[0]===ST.view))ST.view='map';
  const app=$('#app');app.innerHTML='<div class="lobby dim">캠페인을 여는 중…</div>';
  try{if(!ST.camps.length)ST.camps=await DBS().camps();ST.campInfo=ST.camps.find(c=>c.id===camp)||null;if(!ST.campInfo){toast('없는 캠페인이에요');ST.camp='';setHash();return render()}
   if(sec){ST.role=await DBS().whoami(camp,sec);if(!ST.role){toast('저장된 비밀구가 맞지 않아 구경 모드예요');ST.secret=''}}
   try{ST.seats=await DBS().seats(camp)||[]}catch(e){ST.seats=[]}
   await loadAll();if(window.NT_MAKER)NT_MAKER.load().then(()=>render()).catch(()=>{});
   setHash();app.innerHTML='';render();listen()}
  catch(e){app.innerHTML=`<div class="empty">열지 못했어요: ${esc(e.message)} <button class="btn sm" onclick="NT.leave()">캠페인 목록</button></div>`}}
 function leave(){if(unsub){unsub();unsub=null}ST.camp='';ST.role=null;ST.campInfo=null;for(const k in D)delete D[k];setHash();render()}
 async function refreshCamp(){try{ST.camps=await DBS().camps();ST.campInfo=ST.camps.find(c=>c.id===ST.camp)||ST.campInfo}catch(e){}try{ST.seats=await DBS().seats(ST.camp)||[]}catch(e){}render()}

 window.addEventListener('hashchange',()=>{const q=readHash();if(q.camp!==ST.camp){if(q.camp)open(q.camp,q.view);else leave()}else if(q.view&&q.view!==ST.view)go(q.view)});
 window.addEventListener('DOMContentLoaded',()=>{const q=readHash();if(q.camp)open(q.camp,q.view);else render()});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&ST.camp)resync()});

 return {ST,D,$,$$,esc,uid,clone,cssu,gm,me,canSee,canEdit,toast,openModal,closeModal,confirmBox,promptBox,doc,data,list,put,patch,del,putMany,bulkVis,bulkBtns,BULKF,upload,shrink,bindDrop,visSelect,visBadge,visLabel,seatName,render,go,open,leave,refreshCamp,resync,MOD,VIEWS,DBS};
})();
