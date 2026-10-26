/* ---------- 기록 탭 (세션 로그 보관소) ----------
   로그는 제작기 로그 정리기가 올린 Supabase docs 표(kind 'mtlog' · 폴더는 'mtlogmeta/tree')를 그대로 읽는다. 본문은 여기 두지 않고,
   「열기」는 제작기 ?tab=log&view=<로그 id> 로 넘긴다 (정리기가 보관소에서 받아 보여 준다).
   캠페인 설정(camp.data): logFolders[] 이 캠페인의 폴더 id · logHide[] 목록에서 숨길 로그 id · logPin{로그 id: 세션 id} 세션에 잇기
   누구나 읽을 수 있는 표라 PL 도 목록을 본다(정리기의 「보관소에 올리지 않음」 로그는 애초에 없다).
   10-26 망령: 여기서도 기록을 더하고 · 고치고 · 지운다.
    · 직접 쓴 기록 = nt_docs kind 'logs' (id lg_…) {title,ep,date,players,tags[],summary,body,url,folder,sess} — 처음엔 GM만, 공개 칩으로 바꾼다.
    · 보관소 로그 고치기 = 같은 kind 의 덮어쓰기 문서 (id mt_<로그 id>) — 제목 · 회차 · 날짜 · 참가자 · 태그 · 요약만. 원본(제작기)은 그대로.
    · 보관소 로그 지우기 = 이 캠페인 목록에서만 뺀다 (camp.data.logDel). 원본을 정말 지우는 건 제작기 로그 정리기에서. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const C={rows:[],folders:[],at:0,loading:null,err:''};
 const U={q:'',folder:'',open:{}};
 const camp=()=>(N().ST.campInfo||{}).data||{};
 async function load(force){if(C.loading)return C.loading;if(!force&&C.at&&Date.now()-C.at<300000)return C;
  C.loading=(async()=>{try{const [rows,meta]=await Promise.all([N().DBS().mtlogIndex(),N().DBS().mtlogMeta().catch(()=>[])]);const tree=(meta||[]).find(x=>x.id==='tree');C.folders=(tree&&tree.data&&tree.data.folders)||[];const order=new Map(((tree&&tree.data&&tree.data.order)||[]).map(([id,fd],i)=>[id,[i,fd]]));
    C.rows=(rows||[]).map(r=>{const p=order.get(r.id);return {id:r.id,title:r.title||'로그',folder:(p&&p[1])||(r.folder&&r.folder!=='null'?r.folder:null),count:+r.count||0,created:+r.created||0,updated:+r.updated||0,meta:r.meta||null,ord:p?p[0]:1e9}}).sort((a,b)=>a.ord-b.ord);C.at=Date.now();C.err=''}catch(e){C.err=e.message}finally{C.loading=null}return C})();return C.loading}
 const fname=id=>{if(id===OWNF)return '✍ 직접 쓴 기록';const f=C.folders.find(x=>x.id===id);return f?f.name:(id?'(지워진 폴더)':'폴더 없음')};
 const ymd=t=>{if(!t)return '';const d=new Date(+t);return isNaN(d)?'':`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`};
 const dateOf=r=>(r.meta&&r.meta.date)||ymd(r.created);
 const viewUrl=id=>`${((window.NT_CONFIG||{}).makerUrl||'https://mangryoung.github.io/mangketmon-maker/').split('?')[0]}?tab=log&view=${encodeURIComponent(id)}`;
 const OWNF='__own';
 const ovOf=id=>N().data('logs','mt_'+id);
 function ownRows(){return N().list('logs').filter(x=>!String(x.id).startsWith('mt_')).map(x=>({id:x.id,own:1,title:x.title||'기록',folder:OWNF,ofold:x.folder||'',count:String(x.body||'').split('\n').filter(Boolean).length,created:+x.created||0,updated:x._at?Date.parse(x._at):0,meta:{ep:x.ep,date:x.date,players:x.players,tags:x.tags||[],summary:x.summary},body:x.body||'',url:x.url||'',sess:x.sess||'',vis:x._vis}))
  .sort((a,b)=>String(a.meta.date||'').localeCompare(String(b.meta.date||''))||String(a.meta.ep||'').localeCompare(String(b.meta.ep||''),'ko',{numeric:true})||a.created-b.created)}
 function mine(){const d=camp();const fs=d.logFolders||[];const hide=new Set(d.logHide||[]);const del=new Set(d.logDel||[]);const G=N().gm();
  const mt=C.rows.filter(r=>(!fs.length||fs.includes(r.folder||''))&&!del.has(r.id)&&(G||!hide.has(r.id))).map(r=>{const o=ovOf(r.id);if(!o)return r;return Object.assign({},r,{title:o.title||r.title,edited:1,meta:Object.assign({},r.meta||{},{ep:o.ep,date:o.date,players:o.players,tags:o.tags||[],summary:o.summary})})});
  return mt.concat(ownRows())}
 function render(el){const G=N().gm();const d=camp();const fs=d.logFolders||[];
  if(!C.at&&!C.loading){load().then(()=>N().render());el.innerHTML=`<div class="toolbar"><h2>기록</h2></div><div class="empty dim">보관소 목록을 읽는 중…</div>`;return}
  if(C.loading&&!C.at){el.innerHTML=`<div class="toolbar"><h2>기록</h2></div><div class="empty dim">보관소 목록을 읽는 중…</div>`;return}
  const L=mine().filter(r=>!U.folder||(r.folder||'')===U.folder).filter(r=>{const q=U.q.trim().toLowerCase();if(!q)return true;const m=r.meta||{};return [r.title,m.ep,m.players,m.summary,(m.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)});
  const sess=N().list('plan').filter(x=>x.t==='sess');const pin=d.logPin||{};const hide=new Set(d.logHide||[]);
  const groups=[...new Set(L.map(r=>r.folder||''))];
  el.innerHTML=`<div class="toolbar"><h2>기록</h2><span class="note">세션 로그 보관소 · 제작기 로그 정리기가 올린 것${C.err?` · <span style="color:var(--red2)">${esc(C.err)}</span>`:''}</span>
    ${groups.length>1?`<select id="lgF"><option value="">모든 폴더</option>${groups.map(g=>`<option value="${esc(g)}" ${U.folder===g?'selected':''}>${esc(fname(g))}</option>`).join('')}</select>`:''}
    <input type="search" id="lgQ" placeholder="제목 · 참가자 · 태그 · 요약 찾기" value="${esc(U.q)}" style="width:200px"><span class="sp"></span>
    ${G?`<button class="btn sm pri" data-lg="new" title="보관소와 상관없이 여기서 직접 기록을 쓴다">＋ 기록</button>`:''}${G&&(d.logDel||[]).length?`<button class="btn sm ghost" data-lg="undel" title="목록에서 뺀 보관소 로그 되살리기">🗑 뺀 것 ${(d.logDel||[]).length}</button>`:''}${G?`<button class="btn sm" data-lg="folders" title="이 캠페인에 속한 로그 폴더 고르기">📁 폴더 ${fs.length?fs.length+'개':'전부'}</button>`:''}<a class="btn sm ghost" href="${esc(viewUrl('').replace(/&view=$/,''))}" target="_blank" rel="noopener" title="제작기 로그 정리기 열기">정리기 열기 ↗</a><button class="btn xs ghost" data-lg="reload" title="보관소 다시 읽기">↻</button></div>
   ${!C.rows.length&&!ownRows().length?`<div class="empty">보관소에 로그가 없어요. 제작기 → 로그 정리기에서 「이 브라우저에서 보관소에 올리기」를 켜면 여기에 나와요.</div>`:!L.length?`<div class="empty">이 캠페인 폴더에는 로그가 없어요.${G?' 「📁 폴더」에서 폴더를 고르거나 비워 두면 전부 보여요.':''}</div>`:
   `<div class="loglist">${groups.map(g=>`<section class="logsec"><h3>${esc(fname(g))}<small>${L.filter(r=>(r.folder||'')===g).length}</small></h3>${L.filter(r=>(r.folder||'')===g).map(r=>{const m=r.meta||{};const sid=r.own?r.sess:pin[r.id];const s=sid&&sess.find(x=>x.id===sid);const href=r.own?(r.url||''):viewUrl(r.id);const open=U.open[r.id];
     return `<article class="logrow ${hide.has(r.id)?'hid':''}" data-id="${esc(r.id)}"><div class="lgl"><b class="ep">${esc(m.ep||'')}</b><span class="dt">${esc(dateOf(r))}</span></div>
      <div class="lgm"><div class="row" style="gap:6px;flex-wrap:wrap">${r.own?`<a class="ttl" href="#" data-lg="read" data-id="${esc(r.id)}">${esc(r.title)}</a>${N().visBadge(r.vis||'gm','logs',r.id)}${r.ofold?`<span class="chip static">${esc(r.ofold)}</span>`:''}`:`<a class="ttl" href="${esc(href)}" target="_blank" rel="noopener">${esc(r.title)}</a>${r.edited&&G?'<span class="visb" title="이 캠페인에서 고친 제목 · 요약 (원본은 그대로)">✏ 고침</span>':''}`}${s?`<span class="chip static">📅 세션 ${esc(s.label||'')}</span>`:''}${hide.has(r.id)?'<span class="visb gm">🔒 목록에서 숨김</span>':''}</div>
       <div class="small dim">${r.own?(r.body?r.count+'줄':'본문 없음'):r.count+'줄'}${m.players?' · '+esc(m.players):''}${(m.tags||[]).length?' · '+m.tags.map(t=>'#'+esc(t)).join(' '):''}</div>
       ${m.summary?`<div class="sum ${open?'open':''}" data-lg="more" data-id="${esc(r.id)}">${esc(m.summary)}</div>`:''}</div>
      <div class="lgr">${window.NT_FAV?NT_FAV.btn('logs',r.id,r.title):''}${r.own?`<button class="btn xs" data-lg="read" data-id="${esc(r.id)}">읽기</button>`:`<a class="btn xs" href="${esc(href)}" target="_blank" rel="noopener">열기 ↗</a>`}${G?`<button class="btn xs ghost" data-lg="pin" data-id="${esc(r.id)}" title="일정의 세션에 잇기">${s?'📅':'세션'}</button>${r.own?'':`<button class="btn xs ghost" data-lg="hide" data-id="${esc(r.id)}" title="${hide.has(r.id)?'목록에 다시 보이기':'PL 목록에서 숨기기'}">${hide.has(r.id)?'👁':'🔒'}</button>`}<button class="btn xs ghost" data-lg="edit" data-id="${esc(r.id)}" title="고치기">✏</button><button class="btn xs ghost danger" data-lg="del" data-id="${esc(r.id)}" title="${r.own?'지우기':'이 캠페인 목록에서 빼기 (원본은 제작기에)'}">🗑</button>`:''}</div></article>`}).join('')}</section>`).join('')}</div>`}`;
  const qi=$('#lgQ',el);if(qi)qi.oninput=()=>{U.q=qi.value;const v=qi.value;N().render();const q2=$('#lgQ');if(q2){q2.focus();q2.setSelectionRange(v.length,v.length)}};
  const fsel=$('#lgF',el);if(fsel)fsel.onchange=()=>{U.folder=fsel.value;N().render()};
  if(!el._lgBound){el._lgBound=1;el.addEventListener('click',e=>{if(N().ST.view!=='logs')return;const b=e.target.closest('[data-lg]');if(b){if(b.tagName==='A'&&b.dataset.lg==='read')e.preventDefault();act(b.dataset.lg,b)}})}}
 async function saveCamp(patch){const S=N().ST;const d=Object.assign({},camp(),patch);try{await N().DBS().campUpdate(S.camp,S.secret,null,d);S.campInfo.data=d;N().render()}catch(e){N().toast('저장 실패: '+e.message)}}
 async function act(k,b){const id=b.dataset.id;const d=camp();
  if(k==='reload'){await load(true);N().render();return}
  if(k==='more'){U.open[id]=!U.open[id];N().render();return}
  if(k==='read')return read(id);
  if(!N().gm())return;
  if(k==='new'||k==='edit')return edit(k==='new'?'':id);
  if(k==='del'){const own=!!N().doc('logs',id)&&!String(id).startsWith('mt_');
   if(own){const x=N().data('logs',id)||{};if(!await N().confirmBox(`「${x.title||'기록'}」 을(를) 지울까요? 되돌릴 수 없어요.`))return;await N().del('logs',id);N().toast('지웠어요');return}
   const r=C.rows.find(x=>x.id===id);if(!await N().confirmBox(`「${(ovOf(id)||{}).title||(r&&r.title)||id}」 을(를) 이 캠페인 기록 목록에서 뺄까요?\n보관소 원본은 그대로 남아요 (정말 지우려면 제작기 로그 정리기에서). 「🗑 뺀 것」에서 되살릴 수 있어요.`))return;
   const L=new Set(d.logDel||[]);L.add(id);const pin=Object.assign({},d.logPin||{});delete pin[id];await saveCamp({logDel:[...L],logPin:pin});return}
  if(k==='undel'){const L=(d.logDel||[]);const md=N().openModal(`<div class="mhead"><h2>목록에서 뺀 보관소 로그</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="col" style="gap:6px">${L.map(x=>{const r=C.rows.find(y=>y.id===x);return `<div class="row" style="gap:8px"><span style="flex:1">${esc((r&&r.title)||x)}</span><button class="btn xs" data-ud="${esc(x)}">되살리기</button></div>`}).join('')}</div>`);
   md.querySelectorAll('[data-ud]').forEach(b2=>b2.onclick=async()=>{N().closeModal();await saveCamp({logDel:(camp().logDel||[]).filter(y=>y!==b2.dataset.ud)})});return}
  if(k==='folders'){const cur=new Set(d.logFolders||[]);const all=[...new Set(C.rows.map(r=>r.folder||''))];
   const md=N().openModal(`<div class="mhead"><h2>이 캠페인의 로그 폴더</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><p class="small dim">정리기의 폴더 중 이 캠페인 것만 고르면 그 로그만 보여요. 하나도 안 고르면 전부 보여요.</p><div class="row" style="flex-wrap:wrap;gap:6px">${all.map(f=>`<label class="chk chip ${cur.has(f)?'on':''}"><input type="checkbox" value="${esc(f)}" ${cur.has(f)?'checked':''} hidden>${esc(fname(f))} <small class="dim">${C.rows.filter(r=>(r.folder||'')===f).length}</small></label>`).join('')}</div><div class="mfoot"><span class="sp"></span><button class="btn pri" id="lfOk">저장</button></div>`);
   $$('.chk input',md).forEach(i=>i.onchange=()=>i.parentElement.classList.toggle('on',i.checked));
   $('#lfOk',md).onclick=async()=>{const v=$$('.chk input:checked',md).map(i=>i.value);N().closeModal();await saveCamp({logFolders:v})};return}
  if(k==='hide'){const h=new Set(d.logHide||[]);h.has(id)?h.delete(id):h.add(id);await saveCamp({logHide:[...h]});return}
  if(k==='pin'){const sess=N().list('plan').filter(x=>x.t==='sess').sort((a,b)=>(a.order||0)-(b.order||0));const pin=Object.assign({},d.logPin||{});
   if(N().doc('logs',id)&&!String(id).startsWith('mt_'))pin[id]=(N().data('logs',id)||{}).sess||'';
   const md=N().openModal(`<div class="mhead"><h2>세션에 잇기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><label class="lbl">세션<select id="lpS"><option value="">— 없음 —</option>${sess.map(s=>`<option value="${esc(s.id)}" ${pin[id]===s.id?'selected':''}>${esc(s.label||'')} ${esc(s.date||'')} ${esc(s.what||'')}</option>`).join('')}</select></label><div class="mfoot"><span class="sp"></span><button class="btn pri" id="lpOk">저장</button></div>`);
   $('#lpOk',md).onclick=async()=>{const v=$('#lpS',md).value;N().closeModal();if(N().doc('logs',id)&&!String(id).startsWith('mt_'))return N().patch('logs',id,x=>{x.sess=v});if(v)pin[id]=v;else delete pin[id];await saveCamp({logPin:pin})}}}
 /* 직접 쓴 기록 읽기 */
 function read(id){const x=N().data('logs',id);if(!x)return;const G=N().gm();const s=x.sess&&N().data('plan',x.sess);
  const md=N().openModal(`<div class="mhead"><h2>${esc(x.ep?x.ep+' ':'')}${esc(x.title||'기록')}</h2><span class="sp"></span>${G?`<button class="btn sm" data-lr="edit">고치기</button>`:''}<button class="btn ghost" data-x>닫기</button></div>
   <div class="small dim" style="margin-bottom:8px">${esc(x.date||'')}${x.players?' · '+esc(x.players):''}${(x.tags||[]).length?' · '+x.tags.map(t=>'#'+esc(t)).join(' '):''}${s?' · 📅 세션 '+esc(s.label||''):''}</div>
   ${x.summary?`<div class="card" style="margin-bottom:10px;white-space:pre-wrap">${esc(x.summary)}</div>`:''}
   ${x.body?`<div class="logbody">${esc(x.body)}</div>`:'<p class="dim small">본문이 없어요.</p>'}
   ${x.url?`<p style="margin-top:10px"><a class="btn sm" href="${esc(x.url)}" target="_blank" rel="noopener">링크 열기 ↗</a></p>`:''}`,'wide');
  const e=md.querySelector('[data-lr="edit"]');if(e)e.onclick=()=>edit(id)}
 /* 더하기 · 고치기. id '' = 새 기록, 보관소 로그 id = 덮어쓰기(mt_<id>), lg_… = 직접 쓴 기록 */
 function edit(id){const isMt=!!id&&C.rows.some(r=>r.id===id);const own=!id||(!isMt&&!!N().doc('logs',id));
  const r=isMt?C.rows.find(x=>x.id===id):null;const o=isMt?(ovOf(id)||{}):(id?N().data('logs',id)||{}:{});const m=(r&&r.meta)||{};
  const v=k=>o[k]!=null&&o[k]!==''?o[k]:(isMt?(k==='title'?r.title:m[k]):'')||'';
  const tags=(o.tags&&o.tags.length?o.tags:(isMt?m.tags:[]))||[];const sess=N().list('plan').filter(x=>x.t==='sess').sort((a,b)=>(a.order||0)-(b.order||0));
  const folds=[...new Set(ownRows().map(x=>x.ofold).filter(Boolean))];
  const md=N().openModal(`<div class="mhead"><h2>${!id?'새 기록':isMt?'보관소 로그 고치기':'기록 고치기'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   ${isMt?'<p class="small dim" style="margin-top:0">이 캠페인에서 보이는 제목 · 요약만 바꿔요. 제작기 보관소의 원본 로그는 그대로예요.</p>':''}
   <div class="grid2"><label class="lbl" style="grid-column:1/-1">제목<input type="text" id="lgT" value="${esc(v('title'))}" placeholder="3세션 · 번역소"></label>
    <label class="lbl">회차<input type="text" id="lgE" value="${esc(v('ep'))}" placeholder="③"></label><label class="lbl">날짜<input type="text" id="lgD" value="${esc(v('date'))}" placeholder="2026.10.26"></label>
    <label class="lbl">참가자<input type="text" id="lgP" value="${esc(v('players'))}" placeholder="명운 · 소라"></label><label class="lbl">태그 <small class="dim">쉼표로</small><input type="text" id="lgG" value="${esc(tags.join(', '))}"></label>
    ${own?`<label class="lbl">묶음 <small class="dim">비우면 그냥 「직접 쓴 기록」</small><input type="text" id="lgF2" list="lgFl" value="${esc(o.folder||'')}"><datalist id="lgFl">${folds.map(f=>`<option value="${esc(f)}">`).join('')}</datalist></label>
    <label class="lbl">세션<select id="lgS"><option value="">— 없음 —</option>${sess.map(s=>`<option value="${esc(s.id)}" ${o.sess===s.id?'selected':''}>${esc(s.label||'')} ${esc(s.date||'')} ${esc(s.what||'')}</option>`).join('')}</select></label>`:''}
    <label class="lbl" style="grid-column:1/-1">요약<textarea id="lgM" rows="3">${esc(v('summary'))}</textarea></label>
    ${own?`<label class="lbl" style="grid-column:1/-1">본문 <small class="dim">로그를 붙여 넣거나 정리한 글</small><textarea id="lgB" rows="10">${esc(o.body||'')}</textarea></label>
    <label class="lbl">링크 <small class="dim">다른 곳에 둔 로그 · 영상</small><input type="text" id="lgU" value="${esc(o.url||'')}" placeholder="https://"></label>
    <label class="lbl">공개${N().visSelect(id?(N().doc('logs',id)||{}).vis:'gm','lgV')}</label>`:''}</div>
   <div class="mfoot">${isMt&&N().doc('logs','mt_'+id)?'<button class="btn ghost" id="lgReset" title="고친 것을 버리고 원본대로">원본대로</button>':''}<span class="sp"></span><button class="btn pri" id="lgOk">저장</button></div>`,'wide');
  const val=s=>{const e=md.querySelector(s);return e?e.value.trim():''};
  const rs=md.querySelector('#lgReset');if(rs)rs.onclick=async()=>{N().closeModal();await N().del('logs','mt_'+id)};
  md.querySelector('#lgOk').onclick=async()=>{const n={title:val('#lgT'),ep:val('#lgE'),date:val('#lgD'),players:val('#lgP'),tags:val('#lgG').split(',').map(t=>t.trim().replace(/^#/,'')).filter(Boolean),summary:val('#lgM')};
   if(isMt){N().closeModal();await N().put('logs','mt_'+id,n,'pub');N().toast('고쳤어요 (원본은 그대로)');return}
   if(!n.title&&!val('#lgB'))return N().toast('제목이나 본문을 적어 주세요');
   Object.assign(n,{title:n.title||'기록',body:md.querySelector('#lgB').value,url:val('#lgU'),folder:val('#lgF2'),sess:val('#lgS'),created:o.created||Date.now()});
   const vis=md.querySelector('#lgV').value;const nid=id||N().uid('lg_');N().closeModal();await N().put('logs',nid,n,vis);N().toast(id?'고쳤어요':'기록을 더했어요'+(vis==='gm'?' (지금은 GM만 — 공개 칩으로 바꿔요)':''))}}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-lgread]');if(!b)return;e.preventDefault();e.stopPropagation();read(b.dataset.lgread)},true);
 N().MOD.logs={render,load,folders:()=>C.folders,inFolder:f=>C.rows.filter(r=>(r.folder||'')===f),logsOf:sid=>{const pin=camp().logPin||{};return C.rows.filter(r=>pin[r.id]===sid).concat(ownRows().filter(r=>r.sess===sid))},viewUrl,read};
})();
