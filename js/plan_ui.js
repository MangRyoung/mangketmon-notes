/* ---------- 일정 탭 (세션 · 달력 · 조율 · 설계 메모) ----------
   plan 문서:
     {t:'part', title, order}                                   부(묶음)
     {t:'sess', part, label, kind, what, memo, order, st('' | now | done), date('YYYY-MM-DD'), time('HH:MM'), dur(분), where}   세션
     {t:'cand', date, time, note}                               후보 날짜 (일정 조율)
     {t:'note', k, v, list('done' | 'todo' | ''), order}         설계 메모
   avail 문서 (PL 도 자기 것은 고침 · id 가 '_좌석' 으로 끝남 · vis pub):
     id '<date>_<seat>'  {v:'o' | 'd' | 'x', note}               후보 날짜 투표
     id 'wk_<seat>'      {days:{0..6: 'o' | 'd' | ''}, note}     평소 되는 요일 (0 = 일)
   캘린더 연동: 세션마다 Google 캘린더 추가 링크 · 전체 .ics 내려받기 (휴대폰 · 데스크톱 캘린더에 그대로 들어간다). */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const now=new Date();
 window.NT.BULKF.plan=()=>(id,d)=>U.tab==='note'?d.data.t==='note':(d.data.t==='part'||d.data.t==='sess');
 const U={tab:'sess',listf:'',y:now.getFullYear(),m:now.getMonth()};
 const all=()=>N().list('plan');
 const parts=()=>all().filter(x=>x.t==='part').sort((a,b)=>(a.order||0)-(b.order||0));
 const sessAll=()=>all().filter(x=>x.t==='sess').sort((a,b)=>(a.order||0)-(b.order||0));
 const sess=p=>sessAll().filter(x=>(x.part||'')===p);
 const cands=()=>all().filter(x=>x.t==='cand').sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.time||'').localeCompare(b.time||''));
 const notes=()=>all().filter(x=>x.t==='note').sort((a,b)=>(a.order||0)-(b.order||0));
 const KINDS=['커뮤','배틀','큰 사건','탐색','휴식','최종','기타'];
 const WD=['일','월','화','수','목','금','토'];
 const pad=n=>String(n).padStart(2,'0');
 const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
 const today=ymd(now);
 const fmtD=s=>{if(!s)return '';const d=new Date(s+'T00:00:00');return isNaN(d)?s:`${d.getMonth()+1}/${d.getDate()} (${WD[d.getDay()]})`};
 const seats=()=>(N().ST.seats||[]).map(s=>s.seat);
 const vote=(date,seat)=>N().data('avail',`${date}_${seat}`)||{};
 const wk=seat=>N().data('avail',`wk_${seat}`)||{days:{}};
 const V={o:'○',d:'△',x:'×','':'·'};const VC={o:'ok',d:'mid',x:'bad','':''};
 const cycle=v=>v==='o'?'d':v==='d'?'x':v==='x'?'':'o';
 const nextSess=()=>sessAll().filter(s=>s.date&&s.date>=today&&s.st!=='done').sort((a,b)=>a.date.localeCompare(b.date))[0]||sessAll().find(s=>s.st==='now');
 /* ---- 캘린더 링크 ---- */
 const gcal=s=>{if(!s.date)return '';const [y,m,d]=s.date.split('-').map(Number);const [hh,mm]=(s.time||'19:00').split(':').map(Number);const st=new Date(y,m-1,d,hh,mm);const en=new Date(st.getTime()+((+s.dur||180)*60000));const f=x=>`${x.getFullYear()}${pad(x.getMonth()+1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const c=N().ST.campInfo||{};const title=`${c.name||'망켓몬'} 세션 ${s.label||''}${s.what?' · '+s.what:''}`;return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${f(st)}/${f(en)}&details=${encodeURIComponent((s.memo||'')+'\n'+location.href.split('?')[0]+'#c='+N().ST.camp+'&v=plan')}${s.where?'&location='+encodeURIComponent(s.where):''}`};
 function ics(){const c=N().ST.campInfo||{};const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//mangketmon-notes//KO','CALSCALE:GREGORIAN','X-WR-CALNAME:'+(c.name||'망켓몬')+' 세션'];
  const e=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/[,;]/g,m=>'\\'+m);
  for(const s of sessAll().filter(s=>s.date)){const [y,m,d]=s.date.split('-').map(Number);const [hh,mm]=(s.time||'19:00').split(':').map(Number);const st=new Date(y,m-1,d,hh,mm);const en=new Date(st.getTime()+((+s.dur||180)*60000));const f=x=>`${x.getFullYear()}${pad(x.getMonth()+1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
   L.push('BEGIN:VEVENT',`UID:${N().ST.camp}-${s.id}@mangketmon-notes`,`DTSTAMP:${f(new Date())}`,`DTSTART:${f(st)}`,`DTEND:${f(en)}`,`SUMMARY:${e((c.name||'망켓몬')+' 세션 '+(s.label||'')+(s.what?' · '+s.what:''))}`,`DESCRIPTION:${e(s.memo||'')}`,s.where?`LOCATION:${e(s.where)}`:'','END:VEVENT')}
  L.push('END:VCALENDAR');const bl=new Blob([L.filter(Boolean).join('\r\n')],{type:'text/calendar'});const a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=`${c.name||'campaign'}_sessions.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
 /* ---- 그리기 ---- */
 function render(el){const G=N().gm();const total=sessAll().length,done=sessAll().filter(x=>x.st==='done').length;
  el.innerHTML=`<div class="toolbar"><h2>일정</h2><div class="seg"><button data-pt="sess" class="${U.tab==='sess'?'on':''}">세션 ${done}/${total}</button><button data-pt="cal" class="${U.tab==='cal'?'on':''}">달력</button><button data-pt="poll" class="${U.tab==='poll'?'on':''}">조율 ${cands().length?cands().filter(c=>c.date>=today).length:''}</button><button data-pt="note" class="${U.tab==='note'?'on':''}">설계 메모 ${notes().length}</button></div><span class="sp"></span>
    ${U.tab==='sess'||U.tab==='cal'?`<button class="btn sm ghost" data-pl="ics" title="휴대폰 · 데스크톱 캘린더에 넣기">📅 .ics</button>`:''}${G?(U.tab==='sess'?'<button class="btn sm" data-pl="newpart">＋ 부</button><button class="btn sm pri" data-pl="newsess">＋ 세션</button><button class="btn xs ghost danger" data-pl="wipe" data-w="sess" title="부 · 세션 전부 지우기">비우기</button>':U.tab==='poll'?'<button class="btn sm pri" data-pl="newcand">＋ 후보 날짜</button>':U.tab==='note'?'<button class="btn sm pri" data-pl="newnote">＋ 메모</button><button class="btn xs ghost danger" data-pl="wipe" data-w="note" title="설계 메모 전부 지우기">비우기</button>':''):''}${N().bulkBtns('plan',null,U.tab==='note'?'설계 메모':'부 · 세션')}</div>
   ${U.tab==='sess'?sessHtml():U.tab==='cal'?calHtml():U.tab==='poll'?pollHtml():notesHtml()}`;
  el.addEventListener('click',e=>{const t=e.target;if(t.closest('a'))return;const pt=t.closest('[data-pt]');if(pt){U.tab=pt.dataset.pt;N().render();return}
   const lf=t.closest('[data-lf]');if(lf){U.listf=lf.dataset.lf;N().render();return}
   const v=t.closest('[data-vote]');if(v){const [date,seat]=v.dataset.vote.split('|');if(!N().canEdit('avail',`${date}_${seat}`))return N().toast(seat===N().me()?'':'자기 칸만 찍을 수 있어요');const cur=vote(date,seat);N().put('avail',`${date}_${seat}`,{v:cycle(cur.v||''),note:cur.note||''},'pub');return}
   const w=t.closest('[data-wk]');if(w){const [seat,day]=w.dataset.wk.split('|');if(!N().canEdit('avail',`wk_${seat}`))return N().toast('자기 칸만 찍을 수 있어요');const cur=wk(seat);const days=Object.assign({},cur.days||{});days[day]=cycle(days[day]||'')==='x'?'':cycle(days[day]||'');N().put('avail',`wk_${seat}`,{days,note:cur.note||''},'pub');return}
   const day=t.closest('[data-day]');if(day){dayMenu(day.dataset.day);return}
   const s=t.closest('[data-sess]');if(s&&G)return editSess(s.dataset.sess);
   const n=t.closest('[data-note]');if(n&&G)return editNote(n.dataset.note);
   const b=t.closest('[data-pl]');if(b)act(b.dataset.pl,b)})}
 function sessHtml(){const P=parts();const loose=sess('');const nx=nextSess();
  const banner=nx?`<div class="nextsess"><div><small>다음 세션</small><b>${esc(nx.label||'')} ${esc(nx.what||'')}</b><span>${nx.date?fmtD(nx.date)+(nx.time?' '+nx.time:''):'날짜 미정'}${nx.where?' · '+esc(nx.where):''}</span></div>${nx.date?`<a class="btn xs" target="_blank" rel="noopener" href="${gcal(nx)}">Google 캘린더에</a>`:''}</div>`:'';
  return banner+`<div class="plan-parts">${P.map(p=>part(p,sess(p.id))).join('')}${loose.length||!P.length?part(null,loose):''}</div>`}
 function part(p,list){const G=N().gm();return `<div class="part"><h3>${p?esc(p.title||'부'):(parts().length?'분류 없음':'세션')}${p&&p.sub?`<small class="dim" style="font-family:var(--body);letter-spacing:0;font-weight:400">${esc(p.sub)}</small>`:''}${p?N().visBadge(p._vis,'plan',p.id):''}<span class="small dim">${list.length}회</span><span class="sp"></span>${G&&p?`<button class="btn xs ghost" data-pl="editpart" data-id="${esc(p.id)}">고치기</button>`:''}</h3>
  ${list.map(s=>`<div class="sess ${s.st||''}" data-sess="${esc(s.id)}" ${G?'style="cursor:pointer"':''}><div class="lab">${esc(s.label||'')}</div><div class="when">${s.date?`<b>${fmtD(s.date)}</b>${s.time?`<i>${esc(s.time)}</i>`:''}`:'<span class="dim">날짜 미정</span>'}<em>${esc(s.kind||'')}</em></div><div><div class="what">${esc(s.what||'')}</div>${s.memo?`<div class="memo">${esc(s.memo)}</div>`:''}${(N().MOD.logs?N().MOD.logs.logsOf(s.id):[]).map(l=>l.own?`<a class="chip xs" href="#" data-lgread="${esc(l.id)}" title="기록 읽기">✍ ${esc(l.title)}</a>`:`<a class="chip xs" href="${esc(N().MOD.logs.viewUrl(l.id))}" target="_blank" rel="noopener" title="세션 로그 열기">📜 ${esc(l.title)}</a>`).join(' ')}${N().visBadge(s._vis,'plan',s.id)}</div><div class="stt ${s.st||''}">${window.NT_FAV?NT_FAV.btn('sess',s.id,(s.label||'')+' '+(s.what||'')):''}${s.st==='done'?'끝':s.st==='now'?'진행 중':s.date?`<a class="gl" target="_blank" rel="noopener" href="${gcal(s)}" title="Google 캘린더에 넣기">📅</a>`:''}</div></div>`).join('')||'<div class="small dim" style="padding:8px 12px">세션이 없어요</div>'}</div>`}
 function calHtml(){const first=new Date(U.y,U.m,1);const start=new Date(U.y,U.m,1-first.getDay());const byDay={};for(const s of sessAll())if(s.date)(byDay[s.date]=byDay[s.date]||{s:[],c:[]}).s.push(s);for(const c of cands())if(c.date)(byDay[c.date]=byDay[c.date]||{s:[],c:[]}).c.push(c);
  const cells=[];for(let i=0;i<42;i++){const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i);const k=ymd(d);const x=byDay[k]||{s:[],c:[]};const out=d.getMonth()!==U.m;
   cells.push(`<div class="cday ${out?'out':''} ${k===today?'today':''} ${d.getDay()===0?'sun':d.getDay()===6?'sat':''}" data-day="${k}"><span class="dn">${d.getDate()}</span>${x.s.map(s=>`<span class="cs ${s.st||''}">${esc(s.label||'')} ${esc(s.time||'')}<i>${esc(s.what||'')}</i></span>`).join('')}${x.c.map(c=>{const sm=tally(c.date);return `<span class="cc">후보 ${esc(c.time||'')} <b>○${sm.o}</b>${sm.x?` ×${sm.x}`:''}</span>`}).join('')}</div>`)}
  return `<div class="calhead"><button class="btn xs" data-pl="pm">‹</button><h3>${U.y}년 ${U.m+1}월</h3><button class="btn xs" data-pl="nm">›</button><button class="btn xs ghost" data-pl="tm">오늘</button><span class="sp"></span><span class="small dim">${N().gm()?'날짜를 누르면 세션 · 후보를 넣을 수 있어요':'후보 날짜를 누르면 ○△× 를 찍을 수 있어요'}</span></div>
   <div class="calgrid"><div class="cwd">${WD.map((w,i)=>`<span class="${i===0?'sun':i===6?'sat':''}">${w}</span>`).join('')}</div>${cells.join('')}</div>`}
 const tally=date=>{const r={o:0,d:0,x:0,n:0};for(const s of seats()){const v=vote(date,s).v||'';if(v)r[v]++;else r.n++}return r};
 function pollHtml(){const S=seats();const C=cands();const me=N().me(),G=N().gm();
  if(!S.length)return `<div class="empty">PL 좌석이 없어요. 설정 탭에서 좌석을 만들면 PL 이 자기 칸에 ○△× 를 찍을 수 있어요.</div>`;
  const best=C.filter(c=>c.date>=today).map(c=>({c,t:tally(c.date)})).sort((a,b)=>b.t.o-a.t.o||a.t.x-b.t.x||b.t.d-a.t.d)[0];
  const head=`<tr><th>후보</th>${S.map(s=>`<th class="${s===me?'me':''}">${esc(N().seatName(s)||s)}</th>`).join('')}<th>모임</th>${G?'<th></th>':''}</tr>`;
  const rows=C.map(c=>{const t=tally(c.date);const isBest=best&&best.c.id===c.id&&t.o>0;return `<tr class="${c.date<today?'past':''} ${isBest?'best':''}"><td><b>${fmtD(c.date)}</b> ${esc(c.time||'')}${c.note?`<small>${esc(c.note)}</small>`:''}</td>${S.map(s=>{const v=vote(c.date,s).v||'';const can=N().canEdit('avail',`${c.date}_${s}`);return `<td class="vc ${VC[v]} ${can?'can':''}" data-vote="${esc(c.date)}|${esc(s)}" title="${can?'눌러서 바꾸기 (○ → △ → × → 빈칸)':''}">${V[v]}</td>`}).join('')}<td class="sum"><b>○${t.o}</b> △${t.d} ×${t.x}${t.n?` <span class="dim">·${t.n}</span>`:''}${isBest?'<i>유력</i>':''}</td>${G?`<td class="ops"><button class="btn xs" data-pl="fix" data-id="${esc(c.id)}" title="이 날로 세션을 만들어요">세션으로</button><button class="btn xs ghost" data-pl="delcand" data-id="${esc(c.id)}">빼기</button></td>`:''}</tr>`}).join('');
  const wkrows=S.map(s=>{const w=wk(s);return `<tr><td class="${s===me?'me':''}"><b>${esc(N().seatName(s)||s)}</b>${w.note?`<small>${esc(w.note)}</small>`:''}</td>${WD.map((_,i)=>{const v=(w.days||{})[i]||'';const can=N().canEdit('avail',`wk_${s}`);return `<td class="vc ${VC[v]} ${can?'can':''}" data-wk="${esc(s)}|${i}">${V[v]}</td>`}).join('')}${(me===s||G)?`<td class="ops"><button class="btn xs ghost" data-pl="wknote" data-id="${esc(s)}">메모</button></td>`:'<td></td>'}</tr>`}).join('');
  return `<div class="pollwrap"><h3>후보 날짜 <small>○ 돼요 · △ 애매해요 · × 안 돼요 — ${G?'GM 은 누구 칸이든 대신 찍을 수 있어요':'자기 칸만 찍을 수 있어요'}</small></h3>
   <div class="tblwrap"><table class="poll">${head}${rows||`<tr><td colspan="${S.length+3}" class="dim">후보 날짜가 없어요${G?' — 「＋ 후보 날짜」 나 달력에서 날짜를 눌러요':''}</td></tr>`}</table></div>
   <h3 style="margin-top:18px">평소 되는 요일 <small>대략적인 것 — 조율할 때 참고해요</small></h3>
   <div class="tblwrap"><table class="poll wk"><tr><th>PL</th>${WD.map((w,i)=>`<th class="${i===0?'sun':i===6?'sat':''}">${w}</th>`).join('')}<th></th></tr>${wkrows}</table></div></div>`}
 function notesHtml(){const L=notes().filter(n=>!U.listf||(n.list||'')===(U.listf==='memo'?'':U.listf));const G=N().gm();
  return `<div class="row" style="margin-bottom:8px"><div class="seg"><button data-lf="" class="${!U.listf?'on':''}">전체</button><button data-lf="done" class="${U.listf==='done'?'on':''}">확정</button><button data-lf="todo" class="${U.listf==='todo'?'on':''}">정해야 할 것</button><button data-lf="rule" class="${U.listf==='rule'?'on':''}">규칙</button><button data-lf="memo" class="${U.listf==='memo'?'on':''}">메모</button></div></div>
   <div class="notes-grid">${L.map(n=>`<div class="pnote ${n.list||''}" data-note="${esc(n.id)}" ${G?'title="눌러서 고치기"':''}><span class="lst">${n.list==='done'?'확정':n.list==='todo'?'정해야 할 것':n.list==='rule'?'규칙':'메모'}</span>${N().visBadge(n._vis,'plan',n.id)}<b>${esc(n.k||'')}</b><p>${esc(n.v||'')}</p></div>`).join('')||'<div class="empty">메모가 없어요</div>'}</div>`}
 /* ---- 동작 ---- */
 async function act(k,b){const id=b.dataset.id;const G=N().gm();
  if(k==='ics')return ics();
  if(k==='pm'){U.m--;if(U.m<0){U.m=11;U.y--}return N().render()}if(k==='nm'){U.m++;if(U.m>11){U.m=0;U.y++}return N().render()}if(k==='tm'){U.y=now.getFullYear();U.m=now.getMonth();return N().render()}
  if(k==='wknote'){const w=wk(id);const v=await N().promptBox('평소 되는 시간 메모',w.note||'','예: 평일은 20시 이후, 주말 오후');if(v==null)return;await N().put('avail',`wk_${id}`,{days:w.days||{},note:v.trim()},'pub');return}
  if(!G)return;
  if(k==='wipe'){const w=b.dataset.w;const L=all().filter(x=>w==='note'?x.t==='note':(x.t==='part'||x.t==='sess'||x.t==='cand'));if(!L.length)return N().toast('지울 게 없어요');const v=await N().promptBox(`${w==='note'?'설계 메모':'부 · 세션 · 후보 날짜'} ${L.length}개를 모두 지워요. 되돌릴 수 없어요 — 「지우기」라고 적어요`,'','');if(v==null||v.trim()!=='지우기')return;for(const x of L)await N().del('plan',x.id);N().toast('지웠어요');return}
  if(k==='newpart'){const t=await N().promptBox('부 이름','','예: 1부 · 관측의 진실 (1~6세션)');if(t==null||!t.trim())return;await N().put('plan',N().uid('p'),{t:'part',title:t.trim(),order:parts().length},'gm');return}
  if(k==='editpart'){const p=N().data('plan',id);const md=N().openModal(`<div class="mhead"><h2>부 고치기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="mrow"><label class="lbl">이름<input id="ppT" type="text" value="${esc(p.title||'')}"></label><label class="lbl">한 줄<input id="ppS" type="text" value="${esc(p.sub||'')}"></label><label class="lbl">순서<input id="ppO" type="number" class="n" value="${p.order||0}"></label><label class="lbl">공개${N().visSelect(N().doc('plan',id).vis,'ppV',{noPl:true})}</label></div><div class="row" style="margin-top:12px"><button class="btn danger ghost sm" id="ppDel">부 지우기 (세션은 분류 없음으로)</button><span class="sp"></span><button class="btn pri" id="ppOk">저장</button></div>`);
   $('#ppOk',md).onclick=async()=>{await N().put('plan',id,Object.assign({},p,{title:$('#ppT',md).value.trim(),sub:$('#ppS',md).value.trim(),order:+$('#ppO',md).value||0}),$('#ppV',md).value);N().closeModal()};
   $('#ppDel',md).onclick=async()=>{if(!await N().confirmBox('이 부를 지울까요? 안의 세션은 「분류 없음」으로 남아요.','지우기'))return;for(const s of sess(id))await N().patch('plan',s.id,x=>{x.part=''});await N().del('plan',id);N().closeModal()};return}
  if(k==='newsess')return newSess('');
  if(k==='newcand')return newCand('');
  if(k==='delcand'){if(!await N().confirmBox('이 후보 날짜를 뺄까요? 투표도 같이 사라져요.','빼기'))return;await N().del('plan',id);return}
  if(k==='fix'){const c=N().data('plan',id);if(!c)return;await newSess(c.date,c.time,c.note);await N().del('plan',id);return}
  if(k==='newnote'){const nid=N().uid('n');await N().put('plan',nid,{t:'note',k:'',v:'',list:U.listf==='memo'?'':U.listf||'',order:notes().length},'gm');editNote(nid);N().armDraft('plan',nid);return}}
 async function newSess(date,time,memo){const P=parts();const last=sessAll();const nid=N().uid('s');await N().put('plan',nid,{t:'sess',part:(P[P.length-1]||{}).id||'',label:String(last.length+1),kind:'커뮤',what:'',memo:memo||'',order:last.length,st:'',date:date||'',time:time||'',dur:180,where:''},'gm');editSess(nid);N().armDraft('plan',nid)}
 async function newCand(date){const md=N().openModal(`<div class="mhead"><h2>후보 날짜</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="mrow"><label class="lbl">날짜<input id="cdD" type="date" value="${esc(date||'')}"></label><label class="lbl">시간<input id="cdT" type="time" value="19:00"></label><label class="lbl" style="grid-column:span 2">메모<input id="cdN" type="text" placeholder="예: 토요일 저녁 · 3시간"></label></div><div class="row" style="margin-top:12px"><span class="sp"></span><button class="btn pri" id="cdOk">넣기</button></div>`);
  $('#cdOk',md).onclick=async()=>{const d=$('#cdD',md).value;if(!d)return N().toast('날짜를 골라요');await N().put('plan',N().uid('c'),{t:'cand',date:d,time:$('#cdT',md).value,note:$('#cdN',md).value.trim()},'pub');N().closeModal();U.tab='poll';N().render()}}
 function dayMenu(date){const G=N().gm();const S=sessAll().filter(s=>s.date===date);const C=cands().filter(c=>c.date===date);const me=N().me();
  if(!G&&!C.length&&!S.length)return;
  const md=N().openModal(`<div class="mhead"><h2>${fmtD(date)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   ${S.map(s=>`<div class="dm-row"><b>세션 ${esc(s.label||'')}</b> ${esc(s.time||'')} ${esc(s.what||'')}<span class="sp"></span><a class="btn xs" target="_blank" rel="noopener" href="${gcal(s)}">📅 Google</a>${G?`<button class="btn xs ghost" data-dm="edit" data-id="${esc(s.id)}">고치기</button>`:''}</div>`).join('')}
   ${C.map(c=>{const t=tally(c.date);return `<div class="dm-row"><b>후보</b> ${esc(c.time||'')} ${esc(c.note||'')} <span class="dim">○${t.o} △${t.d} ×${t.x}</span><span class="sp"></span>${me?`<button class="btn xs" data-dm="vote" data-d="${esc(c.date)}">내 표: ${V[vote(c.date,me).v||'']} 바꾸기</button>`:''}${G?`<button class="btn xs" data-dm="fix" data-id="${esc(c.id)}">세션으로</button>`:''}</div>`}).join('')}
   ${G?`<div class="row" style="margin-top:12px;gap:6px"><button class="btn sm pri" data-dm="newsess">＋ 이 날 세션</button>${C.length?'':'<button class="btn sm" data-dm="newcand">＋ 후보 날짜로</button>'}</div>`:''}`);
  md.addEventListener('click',async e=>{const b=e.target.closest('[data-dm]');if(!b)return;const k=b.dataset.dm;
   if(k==='edit'){N().closeModal();return editSess(b.dataset.id)}
   if(k==='vote'){const d=b.dataset.d;const cur=vote(d,me);await N().put('avail',`${d}_${me}`,{v:cycle(cur.v||''),note:cur.note||''},'pub');N().closeModal();return}
   if(k==='fix'){const c=N().data('plan',b.dataset.id);N().closeModal();await newSess(c.date,c.time,c.note);await N().del('plan',b.dataset.id);return}
   if(k==='newsess'){N().closeModal();return newSess(date)}
   if(k==='newcand'){N().closeModal();return newCand(date)}})}
 function editSess(id){const s=N().data('plan',id);if(!s)return;const P=parts();
  const md=N().openModal(`<div class="mhead"><h2>세션 ${esc(s.label||'')}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="mrow"><label class="lbl">표시 (① · 3 …)<input id="ssL" type="text" value="${esc(s.label||'')}"></label><label class="lbl">부<select id="ssP"><option value="">분류 없음</option>${P.map(p=>`<option value="${esc(p.id)}" ${p.id===s.part?'selected':''}>${esc(p.title)}</option>`).join('')}</select></label><label class="lbl">종류<input id="ssK" type="text" value="${esc(s.kind||'')}" list="ssKL"><datalist id="ssKL">${KINDS.map(k=>`<option value="${k}">`).join('')}</datalist></label><label class="lbl">진행<select id="ssSt"><option value="" ${!s.st?'selected':''}>예정</option><option value="now" ${s.st==='now'?'selected':''}>진행 중</option><option value="done" ${s.st==='done'?'selected':''}>끝</option></select></label>
    <label class="lbl">날짜<input id="ssD" type="date" value="${esc(s.date||'')}"></label><label class="lbl">시작<input id="ssT" type="time" value="${esc(s.time||'')}"></label><label class="lbl">길이 (분)<input id="ssDu" type="number" class="n" value="${s.dur||180}" step="30"></label><label class="lbl">장소 · 링크<input id="ssWh" type="text" value="${esc(s.where||'')}" placeholder="디스코드 · 맵툴 주소 …"></label>
    <label class="lbl">순서<input id="ssO" type="number" class="n" value="${s.order||0}"></label><label class="lbl">공개${N().visSelect(N().doc('plan',id).vis,'ssV',{noPl:true})}</label></div>
   <label class="lbl">무엇을 하나<textarea id="ssW" rows="3">${esc(s.what||'')}</textarea></label><label class="lbl" style="margin-top:6px">메모<textarea id="ssM" rows="2">${esc(s.memo||'')}</textarea></label>
   <div class="row" style="margin-top:12px"><button class="btn danger ghost sm" id="ssDel">지우기</button>${s.date?`<a class="btn sm ghost" target="_blank" rel="noopener" href="${gcal(s)}">📅 Google 캘린더에</a>`:''}<span class="sp"></span><button class="btn pri" id="ssOk">저장</button></div>`);
  $('#ssOk',md).onclick=async()=>{const st=$('#ssSt',md).value;if(st==='now')for(const o of sessAll().filter(x=>x.st==='now'&&x.id!==id))await N().patch('plan',o.id,x=>{x.st=''});
   await N().put('plan',id,Object.assign({},s,{label:$('#ssL',md).value.trim(),part:$('#ssP',md).value,kind:$('#ssK',md).value.trim(),st,order:+$('#ssO',md).value||0,what:$('#ssW',md).value.trim(),memo:$('#ssM',md).value.trim(),date:$('#ssD',md).value,time:$('#ssT',md).value,dur:+$('#ssDu',md).value||180,where:$('#ssWh',md).value.trim()}),$('#ssV',md).value);N().closeModal()};
  $('#ssDel',md).onclick=async()=>{if(!await N().confirmBox('이 세션을 지울까요?','지우기'))return;await N().del('plan',id);N().closeModal()}}
 function editNote(id){const n=N().data('plan',id);if(!n)return;
  const md=N().openModal(`<div class="mhead"><h2>설계 메모</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="mrow"><label class="lbl" style="grid-column:span 2">제목<input id="nnK" type="text" value="${esc(n.k||'')}"></label><label class="lbl">묶음<select id="nnL"><option value="" ${!n.list?'selected':''}>메모</option><option value="done" ${n.list==='done'?'selected':''}>확정</option><option value="todo" ${n.list==='todo'?'selected':''}>정해야 할 것</option><option value="rule" ${n.list==='rule'?'selected':''}>규칙</option></select></label><label class="lbl">공개${N().visSelect(N().doc('plan',id).vis,'nnV',{noPl:true})}</label></div>
   <label class="lbl">내용<textarea id="nnV2" rows="6">${esc(n.v||'')}</textarea></label>
   <div class="row" style="margin-top:12px"><button class="btn danger ghost sm" id="nnDel">지우기</button><span class="sp"></span><button class="btn pri" id="nnOk">저장</button></div>`);
  $('#nnK',md).focus();
  $('#nnOk',md).onclick=async()=>{await N().put('plan',id,Object.assign({},n,{k:$('#nnK',md).value.trim(),list:$('#nnL',md).value,v:$('#nnV2',md).value.trim()}),$('#nnV',md).value);N().closeModal()};
  $('#nnDel',md).onclick=async()=>{if(!await N().confirmBox('이 메모를 지울까요?','지우기'))return;await N().del('plan',id);N().closeModal()}}
 N().MOD.plan={render,nextSess,gcal};
})();
