/* ---------- 알림: 보고 있는 동안 남이 올리거나 고친 문서를 띄운다 ----------
   app.js 의 실시간 수신(onDoc · onPing doc · onDel)에서 NT_NOTICE.push 를 부른다. 내가 쓴 것(에코)은 app.js 가 걸러 준다.
   위 띠의 🔔 에 안 읽은 수 · 누르면 목록 · 항목을 누르면 그 곳으로(NT_FAV.go 와 같은 길). 탭이 숨어 있으면 제목에 (n) 과, 허락돼 있으면 브라우저 알림. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const L=[];let unread=0,open=false;const baseTitle=document.title;
 const KL={ents:'항목',spots:'장소',maps:'지도',routes:'루트',rels:'관계',pc:'PC 시트',npc:'NPC 시트',pcp:'PC 비밀 칸',plan:'일정',avail:'일정 투표',sec:'GM 메모',links:'이음선',logs:'기록',dgs:'던전'};
 const nameOf=(kind,id,d)=>{d=d||N().data(kind,id)||{};if(kind==='ents')return d.title;if(kind==='spots'||kind==='maps'||kind==='routes'||kind==='pc'||kind==='npc')return d.name;if(kind==='rels'){const a=N().data('ents',d.a)||{},b=N().data('ents',d.b)||{};return (a.title||'?')+' → '+(b.title||'?')}
  if(kind==='plan')return d.t==='sess'?'세션 '+(d.label||'')+' '+(d.what||''):d.t==='note'?'메모 · '+(d.k||''):d.t==='cand'?'후보 날짜 '+(d.date||''):d.title||'';if(kind==='avail'){const seat=String(id).split('_').pop();return (N().seatName(seat)||seat)+(String(id).startsWith('wk_')?' · 평소 되는 요일':' · '+String(id).split('_')[0])}
  if(kind==='logs')return d.title||'기록';if(kind==='dgs')return d.n||'던전';if(kind==='sec')return String(id);if(kind==='pcp')return N().seatName(id)||id;return id};
 const goOf=(kind,id)=>{if(kind==='sec'){const [k,i]=String(id).split(':');return goOf({spot:'spots',ent:'ents',route:'routes',pc:'pc',npc:'npc'}[k]||k,i)}if(kind==='pcp')return {kind:'pc',id};if(kind==='plan'){const d=N().data('plan',id)||{};return {kind:d.t==='sess'?'sess':'plan',id}}if(kind==='avail'||kind==='maps'||kind==='links')return {kind:'tab',id:kind==='maps'?'map':'plan'};if(kind==='rels')return {kind:'tab',id:'graph'};if(kind==='logs')return String(id).startsWith('mt_')?{kind:'tab',id:'logs'}:{kind:'logs',id};return {kind,id}};
 function push(kind,id,ev,data){if(!N().ST.camp)return;const t={kind,id,ev,at:Date.now(),name:nameOf(kind,id,data)||'',who:(data&&data._by)||''};L.unshift(t);if(L.length>50)L.pop();unread++;
  const txt=`${ev==='del'?'지움':ev==='new'?'새로':'고침'} · ${KL[kind]||kind} 「${t.name}」`;toastN(txt,t);paintBell();
  if(document.hidden){document.title=`(${unread}) ${baseTitle}`;try{if('Notification' in window&&Notification.permission==='granted')new Notification('세션 노트 · '+((N().ST.campInfo||{}).name||''),{body:txt,tag:'nt-'+kind+'-'+id})}catch(e){}}}
 function toastN(txt,t){let box=$('#ntNotices');if(!box){box=document.createElement('div');box.id='ntNotices';document.body.appendChild(box)}const d=document.createElement('div');d.className='ntn';d.innerHTML=`<span>📣 ${esc(txt)}</span>${t.ev!=='del'?'<b>보기</b>':''}`;d.onclick=()=>{d.remove();if(t.ev!=='del')go(t)};box.appendChild(d);setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),400)},8000)}
 function go(t){if(t.kind==='dgs'&&window.NT_DG)return NT_DG.openEd(t.id);const g=goOf(t.kind,t.id);if(g.kind==='tab')return N().go(g.id);if(window.NT_FAV)NT_FAV.go(g)}
 function paintBell(){const b=$('#ntBell');if(!b)return;b.classList.toggle('on',unread>0);const c=$('#ntBell i');if(c)c.textContent=unread||''}
 function bellHtml(){return `<button type="button" id="ntBell" class="bell ${unread?'on':''}" data-bell title="알림">🔔<i>${unread||''}</i></button>`}
 function panel(){open=!open;let p=$('#ntNoticePanel');if(p)p.remove();if(!open)return;unread=0;document.title=baseTitle;paintBell();
  p=document.createElement('div');p.id='ntNoticePanel';p.innerHTML=`<div class="nph"><b>알림</b><span class="sp"></span>${'Notification' in window&&Notification.permission==='default'?'<button type="button" class="btn xs ghost" data-np="perm">브라우저 알림 켜기</button>':''}<button type="button" class="btn xs ghost" data-np="x">닫기</button></div>${L.length?L.slice(0,30).map((t,i)=>`<button type="button" class="npi" data-np="go" data-i="${i}"><small>${new Date(t.at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} · ${t.ev==='del'?'지움':t.ev==='new'?'새로':'고침'}</small><span>${esc(KL[t.kind]||t.kind)} 「${esc(t.name)}」</span></button>`).join(''):'<div class="small dim" style="padding:10px">보고 있는 동안 다른 사람이 올리거나 고친 것이 여기 쌓여요.</div>'}`;
  document.body.appendChild(p);p.addEventListener('click',e=>{const b=e.target.closest('[data-np]');if(!b)return;const k=b.dataset.np;if(k==='x'){open=false;p.remove()}else if(k==='perm'){try{Notification.requestPermission().then(()=>{open=false;p.remove();panel()})}catch(x){}}else if(k==='go'){const t=L[+b.dataset.i];open=false;p.remove();if(t&&t.ev!=='del')go(t)}})}
 document.addEventListener('click',e=>{if(e.target.closest('[data-bell]'))return panel();if(open&&!e.target.closest('#ntNoticePanel')){open=false;const p=$('#ntNoticePanel');if(p)p.remove()}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){open=false;const p=$('#ntNoticePanel');if(p)p.remove()}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!open){/* 돌아오면 제목만 원래대로, 수는 종에 남긴다 */document.title=unread?`(${unread}) ${baseTitle}`:baseTitle}});
 window.NT_NOTICE={push,bellHtml,list:L};
})();
