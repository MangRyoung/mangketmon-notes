/* ---------- 기록 탭 (세션 로그 보관소) ----------
   로그는 제작기 로그 정리기가 올린 Supabase docs 표(kind 'mtlog' · 폴더는 'mtlogmeta/tree')를 그대로 읽는다. 본문은 여기 두지 않고,
   「열기」는 제작기 ?tab=log&view=<로그 id> 로 넘긴다 (정리기가 보관소에서 받아 보여 준다).
   캠페인 설정(camp.data): logFolders[] 이 캠페인의 폴더 id · logHide[] 목록에서 숨길 로그 id · logPin{로그 id: 세션 id} 세션에 잇기
   누구나 읽을 수 있는 표라 PL 도 목록을 본다(정리기의 「보관소에 올리지 않음」 로그는 애초에 없다). */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const C={rows:[],folders:[],at:0,loading:null,err:''};
 const U={q:'',folder:'',open:{}};
 const camp=()=>(N().ST.campInfo||{}).data||{};
 async function load(force){if(C.loading)return C.loading;if(!force&&C.at&&Date.now()-C.at<300000)return C;
  C.loading=(async()=>{try{const [rows,meta]=await Promise.all([N().DBS().mtlogIndex(),N().DBS().mtlogMeta().catch(()=>[])]);const tree=(meta||[]).find(x=>x.id==='tree');C.folders=(tree&&tree.data&&tree.data.folders)||[];const order=new Map(((tree&&tree.data&&tree.data.order)||[]).map(([id,fd],i)=>[id,[i,fd]]));
    C.rows=(rows||[]).map(r=>{const p=order.get(r.id);return {id:r.id,title:r.title||'로그',folder:(p&&p[1])||(r.folder&&r.folder!=='null'?r.folder:null),count:+r.count||0,created:+r.created||0,updated:+r.updated||0,meta:r.meta||null,ord:p?p[0]:1e9}}).sort((a,b)=>a.ord-b.ord);C.at=Date.now();C.err=''}catch(e){C.err=e.message}finally{C.loading=null}return C})();return C.loading}
 const fname=id=>{const f=C.folders.find(x=>x.id===id);return f?f.name:(id?'(지워진 폴더)':'폴더 없음')};
 const ymd=t=>{if(!t)return '';const d=new Date(+t);return isNaN(d)?'':`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`};
 const dateOf=r=>(r.meta&&r.meta.date)||ymd(r.created);
 const viewUrl=id=>`${((window.NT_CONFIG||{}).makerUrl||'https://mangryoung.github.io/mangketmon-maker/').split('?')[0]}?tab=log&view=${encodeURIComponent(id)}`;
 function mine(){const d=camp();const fs=d.logFolders||[];const hide=new Set(d.logHide||[]);const G=N().gm();
  return C.rows.filter(r=>(!fs.length||fs.includes(r.folder||''))&&(G||!hide.has(r.id)))}
 function render(el){const G=N().gm();const d=camp();const fs=d.logFolders||[];
  if(!C.at&&!C.loading){load().then(()=>N().render());el.innerHTML=`<div class="toolbar"><h2>기록</h2></div><div class="empty dim">보관소 목록을 읽는 중…</div>`;return}
  if(C.loading&&!C.at){el.innerHTML=`<div class="toolbar"><h2>기록</h2></div><div class="empty dim">보관소 목록을 읽는 중…</div>`;return}
  const L=mine().filter(r=>!U.folder||(r.folder||'')===U.folder).filter(r=>{const q=U.q.trim().toLowerCase();if(!q)return true;const m=r.meta||{};return [r.title,m.ep,m.players,m.summary,(m.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)});
  const sess=N().list('plan').filter(x=>x.t==='sess');const pin=d.logPin||{};const hide=new Set(d.logHide||[]);
  const groups=[...new Set(L.map(r=>r.folder||''))];
  el.innerHTML=`<div class="toolbar"><h2>기록</h2><span class="note">세션 로그 보관소 · 제작기 로그 정리기가 올린 것${C.err?` · <span style="color:var(--red2)">${esc(C.err)}</span>`:''}</span>
    ${groups.length>1?`<select id="lgF"><option value="">모든 폴더</option>${groups.map(g=>`<option value="${esc(g)}" ${U.folder===g?'selected':''}>${esc(fname(g))}</option>`).join('')}</select>`:''}
    <input type="search" id="lgQ" placeholder="제목 · 참가자 · 태그 · 요약 찾기" value="${esc(U.q)}" style="width:200px"><span class="sp"></span>
    ${G?`<button class="btn sm" data-lg="folders" title="이 캠페인에 속한 로그 폴더 고르기">📁 폴더 ${fs.length?fs.length+'개':'전부'}</button>`:''}<a class="btn sm ghost" href="${esc(viewUrl('').replace(/&view=$/,''))}" target="_blank" rel="noopener" title="제작기 로그 정리기 열기">정리기 열기 ↗</a><button class="btn xs ghost" data-lg="reload" title="보관소 다시 읽기">↻</button></div>
   ${!C.rows.length?`<div class="empty">보관소에 로그가 없어요. 제작기 → 로그 정리기에서 「이 브라우저에서 보관소에 올리기」를 켜면 여기에 나와요.</div>`:!L.length?`<div class="empty">이 캠페인 폴더에는 로그가 없어요.${G?' 「📁 폴더」에서 폴더를 고르거나 비워 두면 전부 보여요.':''}</div>`:
   `<div class="loglist">${groups.map(g=>`<section class="logsec"><h3>${esc(fname(g))}<small>${L.filter(r=>(r.folder||'')===g).length}</small></h3>${L.filter(r=>(r.folder||'')===g).map(r=>{const m=r.meta||{};const s=pin[r.id]&&sess.find(x=>x.id===pin[r.id]);const open=U.open[r.id];
     return `<article class="logrow ${hide.has(r.id)?'hid':''}" data-id="${esc(r.id)}"><div class="lgl"><b class="ep">${esc(m.ep||'')}</b><span class="dt">${esc(dateOf(r))}</span></div>
      <div class="lgm"><div class="row" style="gap:6px;flex-wrap:wrap"><a class="ttl" href="${esc(viewUrl(r.id))}" target="_blank" rel="noopener">${esc(r.title)}</a>${s?`<span class="chip static">📅 세션 ${esc(s.label||'')}</span>`:''}${hide.has(r.id)?'<span class="visb gm">🔒 목록에서 숨김</span>':''}</div>
       <div class="small dim">${r.count}줄${m.players?' · '+esc(m.players):''}${(m.tags||[]).length?' · '+m.tags.map(t=>'#'+esc(t)).join(' '):''}</div>
       ${m.summary?`<div class="sum ${open?'open':''}" data-lg="more" data-id="${esc(r.id)}">${esc(m.summary)}</div>`:''}</div>
      <div class="lgr">${window.NT_FAV?NT_FAV.btn('logs',r.id,r.title):''}<a class="btn xs" href="${esc(viewUrl(r.id))}" target="_blank" rel="noopener">열기 ↗</a>${G?`<button class="btn xs ghost" data-lg="pin" data-id="${esc(r.id)}" title="일정의 세션에 잇기">${s?'📅':'세션'}</button><button class="btn xs ghost" data-lg="hide" data-id="${esc(r.id)}" title="${hide.has(r.id)?'목록에 다시 보이기':'PL 목록에서 숨기기'}">${hide.has(r.id)?'👁':'🔒'}</button>`:''}</div></article>`}).join('')}</section>`).join('')}</div>`}`;
  const qi=$('#lgQ',el);if(qi)qi.oninput=()=>{U.q=qi.value;const v=qi.value;N().render();const q2=$('#lgQ');if(q2){q2.focus();q2.setSelectionRange(v.length,v.length)}};
  const fsel=$('#lgF',el);if(fsel)fsel.onchange=()=>{U.folder=fsel.value;N().render()};
  el.addEventListener('click',e=>{const b=e.target.closest('[data-lg]');if(b)act(b.dataset.lg,b)})}
 async function saveCamp(patch){const S=N().ST;const d=Object.assign({},camp(),patch);try{await N().DBS().campUpdate(S.camp,S.secret,null,d);S.campInfo.data=d;N().render()}catch(e){N().toast('저장 실패: '+e.message)}}
 async function act(k,b){const id=b.dataset.id;const d=camp();
  if(k==='reload'){await load(true);N().render();return}
  if(k==='more'){U.open[id]=!U.open[id];N().render();return}
  if(!N().gm())return;
  if(k==='folders'){const cur=new Set(d.logFolders||[]);const all=[...new Set(C.rows.map(r=>r.folder||''))];
   const md=N().openModal(`<div class="mhead"><h2>이 캠페인의 로그 폴더</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><p class="small dim">정리기의 폴더 중 이 캠페인 것만 고르면 그 로그만 보여요. 하나도 안 고르면 전부 보여요.</p><div class="row" style="flex-wrap:wrap;gap:6px">${all.map(f=>`<label class="chk chip ${cur.has(f)?'on':''}"><input type="checkbox" value="${esc(f)}" ${cur.has(f)?'checked':''} hidden>${esc(fname(f))} <small class="dim">${C.rows.filter(r=>(r.folder||'')===f).length}</small></label>`).join('')}</div><div class="mfoot"><span class="sp"></span><button class="btn pri" id="lfOk">저장</button></div>`);
   $$('.chk input',md).forEach(i=>i.onchange=()=>i.parentElement.classList.toggle('on',i.checked));
   $('#lfOk',md).onclick=async()=>{const v=$$('.chk input:checked',md).map(i=>i.value);N().closeModal();await saveCamp({logFolders:v})};return}
  if(k==='hide'){const h=new Set(d.logHide||[]);h.has(id)?h.delete(id):h.add(id);await saveCamp({logHide:[...h]});return}
  if(k==='pin'){const sess=N().list('plan').filter(x=>x.t==='sess').sort((a,b)=>(a.order||0)-(b.order||0));const pin=Object.assign({},d.logPin||{});
   const md=N().openModal(`<div class="mhead"><h2>세션에 잇기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><label class="lbl">세션<select id="lpS"><option value="">— 없음 —</option>${sess.map(s=>`<option value="${esc(s.id)}" ${pin[id]===s.id?'selected':''}>${esc(s.label||'')} ${esc(s.date||'')} ${esc(s.what||'')}</option>`).join('')}</select></label><div class="mfoot"><span class="sp"></span><button class="btn pri" id="lpOk">저장</button></div>`);
   $('#lpOk',md).onclick=async()=>{const v=$('#lpS',md).value;if(v)pin[id]=v;else delete pin[id];N().closeModal();await saveCamp({logPin:pin})}}}
 N().MOD.logs={render,load,folders:()=>C.folders,inFolder:f=>C.rows.filter(r=>(r.folder||'')===f),logsOf:sid=>{const pin=camp().logPin||{};return C.rows.filter(r=>pin[r.id]===sid)},viewUrl};
})();
