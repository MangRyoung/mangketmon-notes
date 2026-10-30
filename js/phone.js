/* ---------- PC 시트 휴대폰 (10-29 망령: 「휴대폰의 파티, 문자 기능을 대학 PC 시트에서 연동」) ----------
   이어 둔 웹툴 방(캠페인 설정 「세 도구 잇기」의 웹툴 방)의 휴대폰과 같은 것을 노트에서 연다. 따로 저장하지 않고 웹툴 방의 칸을 그대로 쓴다:
   · 파티 = 방 코드 pub[트레이너].phone.room (같은 코드끼리 파티원) · share=false 면 남의 목록에 안 뜬다
   · 문자 = om_log 의 chat 줄 data.sms = 방 id (party:코드 · dm:a|b · 단체방 · GM 방 rp.sms.rooms). 웹툴 휴대폰과 같은 줄이라 양쪽에 같이 뜬다
   · 연락처 = pub[트레이너].phone.book [{cid,n(등록 이름)}] — 10-30 웹툴 휴대폰과 같이: 연락처 카드(data.card)를 건네받아 「저장」, 등록 이름 ✎, 지우기 ✕. 단톡방 파티 초대(data.inv) 「참가」
   · 읽음 표시 · 연 1:1 방은 웹툴과 같은 열쇠(om_sms_seen · om_sms_open) — 같은 브라우저면 한쪽에서 읽으면 다른 쪽도 읽음
   신분: 같은 주소(mangryoung.github.io)의 웹툴이 이 브라우저에 남긴 계정 · GM 비밀값 · 좌석 비밀값을 om_whoami 에 물어 GM 또는 그 트레이너 좌석이면 보낼 수 있다.
   알림: PL 은 제 시트 트레이너, GM 은 마지막으로 연 휴대폰의 주인에게 온 문자를 노트 어느 탭에서든 띠링 + 오른쪽 아래 카드로 알린다 */
"use strict";
window.NT_PHONE=(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;const DB=()=>N().DBS();
 const SEEN_KEY='om_sms_seen',OPEN_KEY='om_sms_open';
 const PH={room:'',id:null,st:null,log:[],at:0,sub:null,loading:null,md:null,sid:'',scr:'home',chat:'',draft:{},err:''};
 const LSg=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
 const LSs=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
 const omRoom=()=>(((N().ST.campInfo||{}).data||{}).om||{}).room||'';
 const acctTok=()=>{try{const a=JSON.parse(localStorage.getItem('om_acct')||sessionStorage.getItem('om_acct')||'null');return (a&&a.token)||''}catch(e){return ''}};
 /* 이 브라우저의 웹툴 신분 (계정 → GM 비밀값 → 좌석 비밀값 순) */
 async function who(room){if(PH.id&&PH.id.room===room)return PH.id;const C=[];const t=acctTok();if(t)C.push('u:'+t);const r=(LSg('om_rooms',[])||[]).find(x=>x&&x.id===room);if(r&&r.gm)C.push(r.gm);const si=LSg('om_seat_'+room,null);if(si&&si.secret)C.push(si.secret);
  let best=null;for(const s of C){try{const w=await DB().omWho(room,s);if(w==='gm'){best={room,secret:s,role:'gm',seat:''};break}if(w&&!best)best={room,secret:s,role:'seat',seat:String(w)}}catch(e){}}
  PH.id=best||{room,secret:'',role:null,seat:''};return PH.id}
 /* 방 상태(명단 · 방 코드 · 관계도 이름 · GM 방) + 문자 줄. 두 번째부터는 마지막 줄 뒤에 온 것만 */
 async function load(force){const room=omRoom();if(!room||!DB().omPhoneState)return null;if(PH.room!==room){stopSub();Object.assign(PH,{room,id:null,st:null,log:[],at:0})}
  if(!force&&PH.st&&Date.now()-PH.at<20000)return PH.st;if(PH.loading)return PH.loading;
  PH.loading=(async()=>{try{await who(room);const last=PH.log.length?PH.log[PH.log.length-1].id:0;const [st,rows]=await Promise.all([DB().omPhoneState(room),DB().omSms(room,last||null)]);
    PH.st=st||{};for(const r of rows||[])if(!PH.log.some(x=>x.id===r.id))PH.log.push(r);PH.log.sort((a,b)=>a.id-b.id);PH.at=Date.now();PH.err='';startSub()}catch(e){PH.err=e.message||String(e);console.warn('phone',e)}finally{PH.loading=null}badges();return PH.st})();return PH.loading}
 function startSub(){if(PH.sub||!DB().omSub)return;PH.sub=DB().omSub(PH.room,onLog)}
 function stopSub(){if(PH.sub){try{PH.sub()}catch(e){}PH.sub=null}}
 const T=()=>(PH.st&&PH.st.tr)||{};const nodes=()=>(PH.st&&PH.st.nodes)||{};
 /* 노트 시트(제작기 트레이너 id) → 웹툴 명단 트레이너 (같은 id 또는 mkId) */
 const trOf=sid=>sid?Object.values(T()).find(t=>t&&(t.id===sid||t.mkId===sid))||null:null;
 const phoneData=tid=>(((PH.st&&PH.st.pub)||{})[tid]||{}).phone||{};
 const codeOf=tid=>String(phoneData(tid).room||'').trim();
 const shared=tid=>phoneData(tid).share!==false&&!((T()[tid]||{}).priv);
 const smsRows=()=>PH.log.filter(r=>r.kind==='chat'&&r.data&&r.data.sms&&r.data.sms!=='sns');
 const logsOf=room=>smsRows().filter(r=>!r.data.room&&r.data.sms===room);
 const dmId=(a,b)=>'dm:'+[a,b].sort().join('|');const dmMembers=id=>String(id).startsWith('dm:')?id.slice(3).split('|'):null;
 function cidName(cid){if(!cid)return '';if(cid==='gm')return 'GM';if(cid.startsWith('n:')){const n=nodes()[cid.slice(2)];return n?n.name:'(사라진 사람)'}const t=T()[cid];if(t)return t.name||'';const s=((PH.st&&PH.st.seats)||{})[cid];return s&&s.name?s.name:'(사라진 사람)'}
 function cidImg(cid){if(!cid||cid==='gm')return '';if(cid.startsWith('n:')){const n=nodes()[cid.slice(2)];if(!n)return '';if(n.img)return n.img;const t=Object.values(T()).find(x=>x.name===n.name);return t?t.image||'':''}const t=T()[cid];return t?t.image||'':''}
 const cidKey=cid=>{if(cid.startsWith('n:')){const n=nodes()[cid.slice(2)];return n?'npc:'+n.name:''}return cid};
 /* 10-30 연락처 (웹툴 phone_ui.js 의 bookOf · nm 과 같은 규칙) */
 function bookOf(tid){const pd=phoneData(tid);if(Array.isArray(pd.book))return pd.book.filter(x=>x&&x.cid);return (pd.contacts||[]).map(id=>nodes()[id]).filter(Boolean).map(n=>{const t=Object.values(T()).find(x=>x.name===n.name);return {cid:t?t.id:'n:'+n.id,n:''}})}
 const inBook=(me,cid)=>bookOf(me).some(x=>x.cid===cid);
 const nmOf=(me,cid)=>{const e=bookOf(me).find(x=>x.cid===cid);return (e&&e.n)||cidName(cid)};
 const cidSub=cid=>{if(cid.startsWith('n:')){const n=nodes()[cid.slice(2)];return n?({pc:'PC',npc:'NPC',org:'조직'}[n.kind]||'NPC'):''}const t=T()[cid];return t?(t.kind==='npc'?'NPC':'PC'):''};
 const preview=d=>d.card?'📇 '+(d.card.name||'')+' 연락처':d.inv?'👥 파티 초대 · '+(d.inv.code||''):d.t?String(d.t):d.img?'(그림)':'';
 function people(me){const out=new Map();const put=cid=>{if(cid&&cid!==me&&!out.has(cid))out.set(cid,{cid,name:cidName(cid),sub:cidSub(cid)})};
  for(const x of Object.values(T()))if(x&&(N().gm()||shared(x.id)))put(x.id);
  for(const n of Object.values(nodes())){const t=Object.values(T()).find(x=>x.name===n.name);put(t?t.id:'n:'+n.id)}
  return [...out.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko'))}
 const memberOf=(r,me)=>!!r&&(r.kind==='party'?r.id==='party:'+codeOf(me):r.kind==='gm'?true:(r.members||[]).includes(me));
 function cardsIn(me){const no=new Set(phoneData(me).cardx||[]);const rs=rooms(me);const out=new Map();
  for(const r of smsRows()){const c=r.data.card;if(!c||!c.cid||c.cid===me||r.data.cid===me||no.has(r.id)||inBook(me,c.cid))continue;if(!memberOf(rs.find(x=>x.id===r.data.sms),me))continue;out.set(c.cid,{row:r,cid:c.cid,name:c.name||cidName(c.cid)})}
  return [...out.values()]}
 function invitesIn(me){const my=codeOf(me);const rs=rooms(me);const out=new Map();
  for(const r of smsRows()){const v=r.data.inv;if(!v||!v.code||v.code===my||r.data.cid===me)continue;const room=rs.find(x=>x.id===r.data.sms);if(!memberOf(room,me))continue;out.set(v.code,{row:r,code:v.code,rname:room.name||''})}
  return [...out.values()]}
 /* 웹툴 휴대폰 rooms() 와 같은 규칙 (주인 cid 기준) */
 function rooms(me){const out=new Map();const put=r=>{if(r&&r.id&&!out.has(r.id))out.set(r.id,r)};
  const code=codeOf(me);if(code)put({id:'party:'+code,name:'파티 · '+code,members:[],kind:'party'});
  for(const r of (((PH.st&&PH.st.sms)||{}).rooms||[]))if(r&&r.id)put(Object.assign({kind:'gm',members:[]},r));
  for(const row of smsRows()){const d=row.data;if(d.room&&d.room.name){const o=out.get(d.sms);if(!o||o.kind==='group')out.set(d.sms,{id:d.sms,name:d.room.name,members:d.room.members||[],kind:'group'})}}   /* 나중 정의가 이긴다 (초대 · 나가기) */
  for(const row of smsRows()){const m=dmMembers(row.data.sms);if(m)put({id:row.data.sms,members:m,kind:'dm'})}
  for(const id of LSg(OPEN_KEY,[])){const m=dmMembers(id);if(m)put({id,members:m,kind:'dm'})}
  const L=[...out.values()].filter(r=>r.kind==='party'||r.kind==='gm'||(r.members||[]).includes(me));
  for(const r of L)if(r.kind==='dm'){r.other=(r.members||[]).find(x=>x!==me)||(r.members||[])[0];r.name=nmOf(me,r.other)}
  const last=id=>{const x=logsOf(id);return x.length?x[x.length-1].id:0};L.sort((a,b)=>last(b.id)-last(a.id));return L}
 const seen=()=>LSg(SEEN_KEY,{})||{};
 function markSeen(room){const l=logsOf(room);if(!l.length)return;const s=seen();if((+s[room]||0)>=l[l.length-1].id)return;s[room]=l[l.length-1].id;LSs(SEEN_KEY,s);badges()}
 const unread=(room,me)=>{const last=+seen()[room]||0;return logsOf(room).filter(r=>r.id>last&&r.data.cid!==me).length};
 const unreadAll=me=>rooms(me).reduce((a,r)=>a+unread(r.id,me),0);
 const canWrite=t=>!!(PH.id&&PH.id.secret&&t&&(PH.id.role==='gm'||PH.id.seat===t.id));
 const hm=at=>{const d=new Date(at);return isNaN(d)?'':`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
 const av=(cid,cls)=>{const u=cidImg(cid);const n=cidName(cid);return `<i class="ntph-av ${cls||''} ${u?'':'noimg'}" style="${u?`background-image:url('${cssu(u)}')`:''}">${u?'':esc([...(n||'?')][0]||'?')}</i>`};
 const roomIcon=r=>r.kind==='party'?'<i class="ntph-av room">👥</i>':r.kind==='dm'?av(r.other):r.kind==='gm'?'<i class="ntph-av room">📣</i>':'<i class="ntph-av room">💬</i>';

 /* ===== 휴대폰 창 ===== */
 function open(sid,scr,chat){PH.sid=sid;PH.scr=scr||'home';PH.chat=chat||'';if(N().gm()){try{localStorage.setItem('nt_ph_watch_'+N().ST.camp,sid)}catch(e){}}
  const md=N().openModal(`<div class="ntph"><div class="ntph-bar"><span id="ntphClock"></span><span class="sp"></span><span>📶 🔋</span><button type="button" class="ntph-x" data-x title="닫기">✕</button></div><div class="ntph-scr" id="ntphS"><div class="ntph-empty">불러오는 중…</div></div><div class="ntph-home"><button type="button" data-ph="home" aria-label="홈"></button></div></div>`,'ntphm');
  PH.md=md;const ck=()=>{const c=$('#ntphClock',md);if(!c||!md.isConnected)return clearInterval(tk);c.textContent=hm(Date.now())};const tk=setInterval(ck,20000);ck();
  md.addEventListener('click',onClick);md.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&e.target.id==='ntphIn'){e.preventDefault();send()}});
  md.addEventListener('input',e=>{if(e.target.id==='ntphIn')PH.draft[PH.chat]=e.target.value});
  draw();load(true).then(draw)}
 function draw(){const md=PH.md;if(!md||!md.isConnected)return;const el=$('#ntphS',md);if(!el)return;const keepIn=document.activeElement&&document.activeElement.id==='ntphIn';
  el.innerHTML=screen();if(PH.scr==='chat'){const box=$('.ntph-msgs',el);if(box)box.scrollTop=box.scrollHeight;markSeen(PH.chat);if(keepIn){const i=$('#ntphIn',el);if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}}
  const f=$('#ntphFile',el);if(f)f.onchange=()=>{const x=f.files&&f.files[0];f.value='';if(x)sendImg(x)}}
 function screen(){const room=omRoom();
  if(!room)return `<div class="ntph-empty">이 캠페인에 웹툴 방이 이어져 있지 않아요.<br><small>설정 탭 「세 도구 잇기 → 웹툴 방」에서 이으면 웹툴 휴대폰의 파티 · 문자를 여기서 써요.</small></div>`;
  if(!PH.st)return `<div class="ntph-empty">${PH.err?'웹툴 방을 읽지 못했어요<br><small>'+esc(PH.err)+'</small>':'불러오는 중…'}</div>`;
  const t=trOf(PH.sid);const p=N().data('pc',PH.sid)||N().data('npc',PH.sid)||{};const MKt=window.NT_MAKER&&NT_MAKER.trainer(PH.sid);const nm=(MKt&&MKt.name)||p.name||'';
  if(!t)return `<div class="ntph-empty">웹툴 방 명단에 「${esc(nm||PH.sid)}」이(가) 아직 없어요.<br><small>${N().gm()?'시트의 「⚔ 웹툴로」로 명단에 넣거나, ':''}웹툴 시트 탭에서 「내 파티 불러오기」를 하면 휴대폰이 생겨요.</small></div>`;
  const me=t.id,W=canWrite(t);
  if(PH.scr==='party')return party(t,me,W);if(PH.scr==='book')return book(t,me,W);if(PH.scr==='sms')return smsList(t,me,W);if(PH.scr==='chat')return chat(t,me,W);
  const un=unreadAll(me);const code=codeOf(me);const rs=rooms(me).map(r=>({r,L:logsOf(r.id)})).filter(x=>x.L.length).slice(0,2);
  return `<div class="ntph-me">${av(me,'big')}<div><b>${esc(t.name||nm)}</b><small>${code?'파티 코드 '+esc(code):'파티 코드 없음'}${W?'':' · 보기 전용'}</small></div></div>
   <div class="ntph-apps"><button type="button" data-ph="book"><i>📞${cardsIn(me).length?`<em>${cardsIn(me).length}</em>`:''}</i><span>연락처</span></button><button type="button" data-ph="party"><i>👥</i><span>파티</span></button><button type="button" data-ph="sms"><i>💬${un?`<em>${un}</em>`:''}</i><span>문자</span></button><a href="${esc(window.NT_LINK?NT_LINK.omUrl(room):'#')}" target="oremas" rel="noopener"><i>🎲</i><span>웹툴</span></a></div>
   ${rs.length?`<div class="ntph-sec">최근 문자</div>${rs.map(({r,L})=>{const l=L[L.length-1];const u=unread(r.id,me);return `<button type="button" class="ntph-row" data-ph="chat" data-room="${esc(r.id)}">${roomIcon(r)}<span class="ntph-rt"><b>${esc(r.name||'')}${u?`<em>${u}</em>`:''}</b><small>${esc(l.data.as||l.who||'')}: ${esc(preview(l.data))}</small></span><small class="ntph-tm">${hm(l.at)}</small></button>`}).join('')}`:''}
   ${W?'':`<div class="ntph-note">${PH.id&&PH.id.role?'이 브라우저는 웹툴 방에 다른 좌석으로 들어가 있어요 — 보기만 해요.':'이 브라우저에서 웹툴 방에 들어간 적이 없어 보기만 해요. 웹툴에서 이 트레이너 좌석(또는 GM)으로 한 번 들어오면 여기서도 보낼 수 있어요.'}</div>`}`}
 function party(t,me,W){const code=codeOf(me);const mem=Object.values(T()).filter(x=>x&&(x.id===me||(code&&codeOf(x.id)===code&&shared(x.id))));
  return `<div class="ntph-head"><button type="button" class="ntph-back" data-ph="home">‹</button><div><b>파티</b><small>${code?'방 '+esc(code):'방 코드 없음'}</small></div></div>
   <div class="ntph-code"><input type="text" id="ntphCode" data-nodirty value="${esc(code)}" placeholder="파티 코드 (예: velvet-01)" ${W?'':'readonly'}>${W?`<button type="button" class="btn sm pri" data-ph="codego">맺기</button>${code?'<button type="button" class="btn sm ghost" data-ph="codeout">나가기</button>':''}`:''}</div>
   ${W?`<label class="ntph-share"><input type="checkbox" id="ntphShare" data-nodirty ${shared(me)?'checked':''}> 「${esc(t.name||'')}」를 방에 공유 (끄면 남의 파티 목록에 안 떠요)</label>`:''}
   <div class="ntph-small">같은 코드를 넣은 사람끼리 파티가 돼요. 단톡방에서 「👥 파티」를 누르면 방 사람들에게 초대가 가요.</div>
   ${(()=>{const IV=invitesIn(me);return IV.length?`<div class="ntph-sec">받은 초대 <small>${IV.length}</small></div>${IV.map(x=>`<div class="ntph-row"><i class="ntph-av room">👥</i><span class="ntph-rt"><b>${esc(x.code)}</b><small>${esc(x.row.data.as||'')} · ${esc(x.rname)}</small></span>${W?`<button type="button" class="btn xs pri" data-ph="invjoin" data-code="${esc(x.code)}">참가</button>`:''}</div>`).join('')}`:''})()}
   <div class="ntph-sec">파티원 <small>${mem.length}</small>${W&&mem.length>2?'<button type="button" class="btn xs ghost" data-ph="grp">＋ 단체방</button>':''}</div>
   ${mem.map(x=>`<div class="ntph-row">${av(x.id)}<span class="ntph-rt"><b>${esc(x.name||'')}${x.id===me?' <u>나</u>':''}${x.kind==='npc'?' <u>NPC</u>':''}</b><small>${shared(x.id)?'':'비공개 · '}${esc(codeOf(x.id)||'')}</small></span>${x.id===me?'':`<button type="button" class="btn xs" data-ph="dm" data-cid="${esc(x.id)}">💬</button>`}</div>`).join('')}
   ${code&&mem.length<2?'<div class="ntph-small">아직 같은 코드를 넣은 사람이 없어요.</div>':''}`}
 function book(t,me,W){const B=bookOf(me);const P=cardsIn(me);
  return `<div class="ntph-head"><button type="button" class="ntph-back" data-ph="home">‹</button><div><b>연락처</b><small>${esc(t.name||'')} · ${B.length}명</small></div>${W?'<button type="button" class="btn xs" data-ph="give" title="내 연락처 카드를 건네요">📇 건네기</button><button type="button" class="btn xs" data-ph="add">＋</button>':''}</div>
   ${P.length?`<div class="ntph-sec">받은 연락처 <small>${P.length}</small></div>${P.map(c=>`<div class="ntph-row ntph-cardin">${av(c.cid)}<span class="ntph-rt"><b>📇 ${esc(c.name)}</b><small>${esc(c.row.data.as||'')} 이(가) 건넨 연락처</small></span>${W?`<button type="button" class="btn xs pri" data-ph="csave" data-cid="${esc(c.cid)}">저장</button><button type="button" class="btn xs ghost" data-ph="cx" data-id="${c.row.id}">✕</button>`:''}</div>`).join('')}`:''}
   <div class="ntph-sec">내 연락처 <small>${B.length}</small></div>
   ${B.map(e=>{const real=cidName(e.cid);return `<div class="ntph-row">${av(e.cid)}<span class="ntph-rt"><b>${esc(e.n||real)}</b><small>${esc([e.n&&e.n!==real?real:'',cidSub(e.cid)].filter(Boolean).join(' · '))}</small></span>${W?`<button type="button" class="btn xs ghost" data-ph="cname" data-cid="${esc(e.cid)}" title="등록 이름">✎</button><button type="button" class="btn xs ghost" data-ph="cdel" data-cid="${esc(e.cid)}" title="지우기">✕</button><button type="button" class="btn xs" data-ph="dm" data-cid="${esc(e.cid)}">💬</button>`:''}</div>`}).join('')||'<div class="ntph-empty sm">아직 아무도 없어요.<br><small>「📇 건네기」로 내 연락처를 주거나, 받은 카드를 저장하거나, ＋ 로 넣어요.</small></div>'}`}
 function smsList(t,me,W){const rs=rooms(me);
  return `<div class="ntph-head green"><button type="button" class="ntph-back" data-ph="home">‹</button><div><b>문자</b><small>${esc(t.name||'')} · 웹툴 휴대폰과 같은 방</small></div>${W?'<button type="button" class="btn xs" data-ph="grp">＋ 단톡방</button>':''}</div>
   ${rs.length?rs.map(r=>{const L=logsOf(r.id);const l=L[L.length-1];const u=unread(r.id,me);return `<button type="button" class="ntph-row" data-ph="chat" data-room="${esc(r.id)}">${roomIcon(r)}<span class="ntph-rt"><b>${esc(r.name||'')}${u?`<em>${u}</em>`:''}</b><small>${l?esc((l.data.as||l.who||'')+': '+preview(l.data)):'아직 메시지가 없어요'}</small></span>${l?`<small class="ntph-tm">${hm(l.at)}</small>`:''}</button>`}).join(''):`<div class="ntph-empty sm">문자 방이 없어요.<br><small>연락처에서 💬 로 1:1, 「＋ 단톡방」으로 여럿과 얘기해요. 파티 코드를 맺으면 파티 방도 생겨요.</small></div>`}`}
 function chat(t,me,W){const r=rooms(me).find(x=>x.id===PH.chat);if(!r){PH.scr='sms';return smsList(t,me,W)}const L=logsOf(r.id);let day='',pk='',pt=0;
  const rows=L.map(x=>{const d=x.data;const at=new Date(x.at);const dd=isNaN(at)?'':`${at.getMonth()+1}/${at.getDate()}`;let head='';if(dd&&dd!==day){day=dd;head=`<div class="ntph-day">${dd}</div>`}
   const mine=d.cid?d.cid===me:d.k===me;const k=d.cid||d.k||d.as;const cont=!head&&k===pk&&(+at-pt)<180000;pk=k;pt=+at||0;
   const txt=esc(d.t||'').replace(/@([^\s@]+)/g,'<span class="ntph-at">@$1</span>');
   return head+`<div class="ntph-msg ${mine?'me':''} ${cont?'cont':''}">${mine?'':av(d.cid||'','sm')}<div class="ntph-mb">${cont||mine?'':`<small class="ntph-mn">${esc((d.cid&&inBook(me,d.cid)?nmOf(me,d.cid):'')||d.as||x.who||'')}</small>`}${d.img?`<a class="ntph-pic" href="${esc(d.img)}" target="_blank" rel="noopener"><img src="${esc(d.img)}" alt="" loading="lazy"></a>`:''}${d.t?`<div class="ntph-bub">${txt}</div>`:''}${d.card?`<div class="ntph-bub ntph-cardb">${av(d.card.cid,'sm')}<span><small>📇 연락처</small><b>${esc(d.card.name||cidName(d.card.cid))}</b></span>${!mine&&W?(d.card.cid===me||inBook(me,d.card.cid)?'<em>저장됨</em>':`<button type="button" class="btn xs pri" data-ph="csave" data-cid="${esc(d.card.cid)}">저장</button>`):''}</div>`:''}${d.inv?`<div class="ntph-bub ntph-cardb"><i class="ntph-av sm room">👥</i><span><small>파티 초대</small><b>${esc(d.inv.code)}</b></span>${W?(codeOf(me)===d.inv.code?'<em>참가 중</em>':mine?'':`<button type="button" class="btn xs pri" data-ph="invjoin" data-code="${esc(d.inv.code)}">참가</button>`):''}</div>`:''}<small class="ntph-mt">${hm(x.at)}</small></div></div>`}).join('');
  const mem=r.kind==='group'?(r.members||[]).map(c=>nmOf(me,c)).join(' · '):r.kind==='dm'?'1:1':'모두';
  const tools=W&&memberOf(r,me)?`${r.kind!=='party'?'<button type="button" class="btn xs ghost" data-ph="csend" title="이 방에 내 연락처 카드">📇</button>':''}${r.kind==='group'?'<button type="button" class="btn xs ghost" data-ph="pinv" title="이 단톡방 사람들과 파티">👥 파티</button>':''}`:'';
  return `<div class="ntph-head green"><button type="button" class="ntph-back" data-ph="sms">‹</button><div><b>${esc(r.name||'')}</b><small>${esc(mem)} · ${L.length}개</small></div>${tools}</div>
   <div class="ntph-msgs">${rows||'<div class="ntph-empty sm">첫 메시지를 보내 봐요</div>'}</div>
   ${W?`<div class="ntph-in"><label class="ntph-clip" title="그림 보내기">📎<input type="file" accept="image/*" id="ntphFile" hidden></label><input type="text" id="ntphIn" data-nodirty placeholder="${esc(t.name||'')} 으로 보내기" value="${esc(PH.draft[r.id]||'')}"><button type="button" class="btn pri sm" data-ph="send">➤</button></div>`:'<div class="ntph-note">보기 전용이에요</div>'}`}
 function onClick(e){const b=e.target.closest('[data-ph]');if(!b)return;const a=b.dataset.ph;const t=trOf(PH.sid);
  if(a==='home'||a==='party'||a==='sms'||a==='book'){PH.scr=a;draw();if(a!=='home')load().then(draw);return}
  if(a==='chat'){PH.scr='chat';PH.chat=b.dataset.room;draw();return}
  if(a==='send')return send();
  if(!t||!canWrite(t))return;
  if(a==='dm'){const id=dmId(t.id,b.dataset.cid);const o=LSg(OPEN_KEY,[]);if(!o.includes(id)){o.push(id);LSs(OPEN_KEY,o.slice(-50))}PH.scr='chat';PH.chat=id;draw();return}
  if(a==='codego'||a==='codeout'){const v=a==='codeout'?'':($('#ntphCode',PH.md).value||'').trim();const sh=$('#ntphShare',PH.md);return setCode(t.id,v,sh?sh.checked:undefined).then(()=>{N().toast(v?`방 코드 「${v}」로 파티를 맺었어요`:'방 코드를 비웠어요');draw()}).catch(x=>N().toast('바꾸지 못했어요: '+x.message))}
  if(a==='grp')return newGroup(t);
  if(a==='csave'){const c=b.dataset.cid;if(inBook(t.id,c))return;return setBook(t.id,[...bookOf(t.id),{cid:c,n:'',at:Date.now()}]).then(()=>{N().toast(`「${cidName(c)}」을(를) 연락처에 넣었어요`);draw()}).catch(x=>N().toast('넣지 못했어요: '+x.message))}
  if(a==='cx')return setPhone(t.id,'cardx',[...(phoneData(t.id).cardx||[]),+b.dataset.id].slice(-100)).then(draw).catch(x=>N().toast(x.message));
  if(a==='cdel'){const c=b.dataset.cid;if(!confirm(`「${nmOf(t.id,c)}」을(를) 연락처에서 지울까요? (주고받은 문자는 남아요)`))return;return setBook(t.id,bookOf(t.id).filter(x=>x.cid!==c)).then(draw).catch(x=>N().toast(x.message))}
  if(a==='cname'){const c=b.dataset.cid;const e=bookOf(t.id).find(x=>x.cid===c);const real=cidName(c);const v=prompt(`「${real}」을(를) 어떤 이름으로 둘까요? (비우면 본명)`,(e&&e.n)||'');if(v==null)return;const n=v.trim().slice(0,30);return setBook(t.id,bookOf(t.id).map(x=>x.cid===c?Object.assign({},x,{n:n===real?'':n}):x)).then(draw).catch(x=>N().toast(x.message))}
  if(a==='invjoin'){const code=b.dataset.code;return setCode(t.id,code).then(()=>{N().toast(`파티 「${code}」에 들어갔어요`);draw()}).catch(x=>N().toast(x.message))}
  if(a==='csend')return sendCard(t,PH.chat).then(()=>{N().toast('연락처 카드를 보냈어요');setTimeout(()=>load(true).then(draw),1200)}).catch(x=>N().toast(x.message));
  if(a==='pinv'){const r=rooms(t.id).find(x=>x.id===PH.chat);if(!r)return;let code=codeOf(t.id);if(!code)code=(String(r.name).replace(/[^\w가-힣]+/g,'-').replace(/^-|-$/g,'').slice(0,14)||'party')+'-'+Math.random().toString(36).slice(2,5);
   if(!confirm(`이 단톡방 사람들에게 파티 「${code}」 초대를 보낼까요?${codeOf(t.id)?'':'\n(나도 이 코드로 들어가요)'}`))return;
   return (async()=>{if(!codeOf(t.id))await setCode(t.id,code);await DB().omLogAdd(PH.room,PH.id.secret,'chat',t.name||'',{t:'',sms:r.id,as:t.name||'',k:cidKey(t.id),cid:t.id,inv:{code}});setTimeout(()=>load(true).then(draw),1200)})().catch(x=>N().toast(x.message))}
  if(a==='give'||a==='add')return pickPeople(t,a)}
 /* 내 휴대폰의 한 칸 쓰기 (휴대폰이 아직 없으면 통째로) */
 async function setPhone(tid,key,val){const S=PH.id,room=PH.room;const pub=(PH.st.pub=PH.st.pub||{});const has=pub[tid]&&pub[tid].phone;
  if(!has){if(S.role==='gm'&&!pub[tid])await DB().omPut(room,S.secret,['pub',tid],{});const ph={log:{},memo:'',contacts:[],notes:[],[key]:val};await DB().omPut(room,S.secret,['pub',tid,'phone'],ph);pub[tid]=Object.assign({},pub[tid]||{},{phone:ph});return}
  await DB().omPut(room,S.secret,['pub',tid,'phone',key],val);pub[tid].phone=Object.assign({},pub[tid].phone,{[key]:val})}
 const setBook=(tid,list)=>{const u=new Set();return setPhone(tid,'book',list.filter(x=>x&&x.cid&&!u.has(x.cid)&&u.add(x.cid)))};
 const sendCard=(t,room)=>DB().omLogAdd(PH.room,PH.id.secret,'chat',t.name||'',{t:'',sms:room,as:t.name||'',k:cidKey(t.id),cid:t.id,card:{cid:t.id,name:t.name||''}});
 /* 건네기 · 추가: 이 방의 사람 고르기 */
 function pickPeople(t,mode){const L=people(t.id).filter(x=>mode==='give'||!inBook(t.id,x.cid));if(!L.length)return N().toast('고를 사람이 없어요');
  const md=N().openModal(`<div class="mhead"><h2>${mode==='give'?'📇 내 연락처 건네기':'연락처에 넣기'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="small dim" style="margin-bottom:6px">${mode==='give'?`「${esc(t.name||'')}」의 연락처 카드를 1:1 문자로 보내요. 받은 사람이 「저장」하면 그쪽 연락처에 들어가요.`:'이 웹툴 방의 사람 중에서 골라요.'}</div><div style="max-height:46vh;overflow:auto">${L.map(x=>`<label class="small" style="display:flex;gap:6px;align-items:center;margin:4px 0"><input type="checkbox" value="${esc(x.cid)}"> ${av(x.cid,'sm')} <b>${esc(x.name)}</b> <span class="dim">${esc(x.sub)}${inBook(t.id,x.cid)?' · 내 연락처':''}</span></label>`).join('')}</div>${mode==='give'?'<label class="small" style="display:block;margin-top:8px"><input type="checkbox" id="pkBack" checked> 받는 사람도 내 연락처에 넣기 (서로 주고받기)</label>':''}<div class="row" style="margin-top:12px"><span class="sp"></span><button class="btn pri" id="pkOk">${mode==='give'?'건네기':'넣기'}</button></div>`,'',{stack:true});
  $('#pkOk',md).onclick=async()=>{const ids=$$('input[type=checkbox][value]:checked',md).map(x=>x.value);if(!ids.length)return N().toast('사람을 골라요');const back=mode==='add'||($('#pkBack',md)||{}).checked;
   try{if(mode==='give'){for(const c of ids){const id=dmId(t.id,c);const o=LSg(OPEN_KEY,[]);if(!o.includes(id)){o.push(id);LSs(OPEN_KEY,o.slice(-50))}await sendCard(t,id)}}if(back){const B=bookOf(t.id);await setBook(t.id,[...B,...ids.filter(c=>!B.some(x=>x.cid===c)).map(c=>({cid:c,n:'',at:Date.now()}))])}N().closeModal();N().toast(mode==='give'?`연락처를 ${ids.length}명에게 건넸어요`:`${ids.length}명을 넣었어요`);setTimeout(()=>load(true).then(draw),1200)}catch(e){N().toast('하지 못했어요: '+e.message)}}}
 document.addEventListener('change',e=>{if(e.target&&e.target.id==='ntphShare'){const t=trOf(PH.sid);if(t&&canWrite(t))setCode(t.id,codeOf(t.id),e.target.checked).then(draw).catch(x=>N().toast('바꾸지 못했어요: '+x.message))}});
 async function setCode(tid,code,share){const S=PH.id,room=PH.room;const pub=(PH.st.pub=PH.st.pub||{});const has=pub[tid]&&pub[tid].phone;
  if(!has){if(S.role==='gm'&&!pub[tid])await DB().omPut(room,S.secret,['pub',tid],{});const ph=Object.assign({log:{},memo:'',contacts:[],notes:[],room:code},share===false?{share:false}:{});await DB().omPut(room,S.secret,['pub',tid,'phone'],ph);pub[tid]=Object.assign({},pub[tid]||{},{phone:ph});return}
  if(code!==codeOf(tid))await DB().omPut(room,S.secret,['pub',tid,'phone','room'],code);if(share!=null&&share!==(phoneData(tid).share!==false))await DB().omPut(room,S.secret,['pub',tid,'phone','share'],share);
  pub[tid].phone=Object.assign({},pub[tid].phone,{room:code},share!=null?{share}:{})}
 async function send(){const t=trOf(PH.sid);const i=PH.md&&$('#ntphIn',PH.md);if(!t||!i||!canWrite(t))return;const v=i.value.trim();if(!v)return;i.value='';PH.draft[PH.chat]='';
  const d={t:v,sms:PH.chat,as:t.name||'',k:cidKey(t.id),cid:t.id};try{await DB().omLogAdd(PH.room,PH.id.secret,'chat',t.name||'',d);setTimeout(()=>load(true).then(draw),1500)}catch(e){i.value=v;N().toast('보내지 못했어요: '+e.message)}}
 async function sendImg(f){const t=trOf(PH.sid);if(!t||!canWrite(t)||!/^image\//.test(f.type||''))return;try{const u=await N().upload(f,'photo','sms');await DB().omLogAdd(PH.room,PH.id.secret,'chat',t.name||'',{t:'',img:u,sms:PH.chat,as:t.name||'',k:cidKey(t.id),cid:t.id})}catch(e){N().toast('그림을 보내지 못했어요: '+e.message)}}
 /* 단체방: 웹툴과 같이 정의 한 줄(data.room={name,members})을 남긴다 */
 function newGroup(t){const code=codeOf(t.id);const mem=[...new Map([...bookOf(t.id).map(e=>({id:e.cid,name:e.n||cidName(e.cid)})),...Object.values(T()).filter(x=>x&&x.id!==t.id&&code&&codeOf(x.id)===code&&shared(x.id)).map(x=>({id:x.id,name:x.name}))].map(x=>[x.id,x])).values()];if(!mem.length)return N().toast('연락처에 먼저 사람을 넣어요');
  const md=N().openModal(`<div class="mhead"><h2>단톡방 만들기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><label class="lbl">방 이름<input id="ngN" type="text" value="${esc((t.name||'')+'의 방')}"></label><div class="sec">누구와</div>${mem.map(x=>`<label class="small" style="display:flex;gap:6px;align-items:center;margin:3px 0"><input type="checkbox" value="${esc(x.id)}"> ${esc(x.name||'')}</label>`).join('')}<div class="row" style="margin-top:12px"><span class="sp"></span><button class="btn pri" id="ngOk">만들기</button></div>`,'',{stack:true});
  $('#ngOk',md).onclick=async()=>{const name=$('#ngN',md).value.trim();const ids=$$('input[type=checkbox]:checked',md).map(x=>x.value);if(!name||!ids.length)return N().toast('이름과 사람을 골라요');const id='g:'+Date.now().toString(36);
   try{await DB().omLogAdd(PH.room,PH.id.secret,'chat',t.name||'',{t:'',sms:id,as:t.name||'',k:cidKey(t.id),cid:t.id,room:{name,members:[...new Set([t.id,...ids])]}});N().closeModal();await load(true);PH.scr='chat';PH.chat=id;draw()}catch(e){N().toast('만들지 못했어요: '+e.message)}}}

 /* ===== 알림 ===== */
 function watchSid(){const me=N().me&&N().me();if(me)return me;if(!N().gm())return '';try{return localStorage.getItem('nt_ph_watch_'+N().ST.camp)||''}catch(e){return ''}}
 function onLog(row){const d=row.data||{};if(row.kind!=='chat'||!d.sms||d.sms==='sns')return;if(PH.log.some(x=>x.id===row.id))return;PH.log.push(row);
  const sid=watchSid();const t=trOf(sid);const openChat=PH.md&&PH.md.isConnected&&PH.scr==='chat'&&PH.chat===d.sms;
  if(t&&d.cid!==t.id&&(d.t||d.img)&&rooms(t.id).some(r=>r.id===d.sms)){if(openChat&&PH.sid===sid){markSeen(d.sms)}else{pop(row,t);beep()}}
  if(PH.md&&PH.md.isConnected)draw();badges()}
 const POP=[];
 function pop(row,t){const d=row.data;const r=rooms(t.id).find(x=>x.id===d.sms)||{name:'문자'};POP.unshift({row,r,sid:watchSid()});POP.length=Math.min(POP.length,3);
  let el=document.getElementById('ntphPop');if(!el){el=document.createElement('div');el.id='ntphPop';el.className='ntphpop';document.body.appendChild(el);
   el.addEventListener('click',e=>{const c=e.target.closest('[data-pp]');if(e.target.closest('[data-ppx]')){el.classList.remove('on');POP.length=0;return}if(!c)return;const x=POP[+c.dataset.pp];el.classList.remove('on');POP.length=0;if(x)open(x.sid,'chat',x.row.data.sms)})}
  el.innerHTML=`<button type="button" class="ntphpop-x" data-ppx aria-label="닫기">✕</button>`+POP.map((x,i)=>`<button type="button" class="ntphpop-c" data-pp="${i}">${av(x.row.data.cid||'')}<span><small>📱 ${esc(x.r.name||'문자')}</small><b>${esc(x.row.data.as||x.row.who||'')}</b><em>${esc(x.row.data.t||(x.row.data.img?'(그림)':''))}</em></span></button>`).join('');
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(pop.tm);pop.tm=setTimeout(()=>el.classList.remove('on'),9000)}
 let AC=null;function beep(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const t0=AC.currentTime;[[1320,0],[1760,.13]].forEach(([f,dt])=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t0+dt);g.gain.linearRampToValueAtTime(.12,t0+dt+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+dt+.22);o.connect(g).connect(AC.destination);o.start(t0+dt);o.stop(t0+dt+.25)})}catch(e){}}
 /* 시트의 📱 단추에 안 읽은 수 */
 function badges(){panels();$$('.ntph-btn[data-phone]').forEach(b=>{const t=trOf(b.dataset.phone);const n=t&&PH.st?unreadAll(t.id):0;let em=b.querySelector('em');if(!n){if(em)em.remove();return}if(!em){em=document.createElement('em');b.appendChild(em)}em.textContent=n})}
 /* 10-29 망령: 대학 시트 아래 휴대폰 칸 — 방 코드 · 파티원 · 최근 문자. 누르면 휴대폰 창의 그 화면으로 */
 function panelIn(sid){const room=omRoom();const head=(n,x)=>`<h4 class="ux-h"><span>휴대폰</span>${x||''}<span class="sp"></span>${room?`<button type="button" class="btn xs" data-phone="${esc(sid)}">📱 열기${n?`<em>${n}</em>`:''}</button>`:''}</h4>`;
  if(!room)return head()+`<div class="ntph-pe">이 캠페인에 웹툴 방이 이어져 있지 않아요.<br><small>${N().gm()?'설정 탭 「세 도구 잇기 → 웹툴 방」에서 이으면 파티 · 문자를 여기서 봐요.':'GM 이 웹툴 방을 이으면 파티 · 문자가 여기 떠요.'}</small></div>`;
  if(!PH.st)return head()+`<div class="ntph-pe">${PH.err?'웹툴 방을 읽지 못했어요<br><small>'+esc(PH.err)+'</small>':'불러오는 중…'}</div>`;
  const t=trOf(sid);if(!t)return head()+`<div class="ntph-pe">웹툴 방 명단에 이 트레이너가 아직 없어요.<br><small>${N().gm()?'시트의 「⚔ 웹툴로」로 명단에 넣으면 휴대폰이 생겨요.':'웹툴 시트 탭에서 「내 파티 불러오기」를 하면 휴대폰이 생겨요.'}</small></div>`;
  const me=t.id,code=codeOf(me),un=unreadAll(me);const mem=code?Object.values(T()).filter(x=>x&&x.id!==me&&codeOf(x.id)===code&&shared(x.id)):[];
  const rs=rooms(me).map(r=>({r,L:logsOf(r.id)})).filter(x=>x.L.length).slice(0,3);
  return head(un,`<small>${code?'방 '+esc(code):'방 코드 없음'}${canWrite(t)?'':' · 보기 전용'}</small>`)+`
   <div class="ntph-papps"><button type="button" class="ntph-pa" data-phone="${esc(sid)}" data-phscr="party"><i>👥</i><span><b>파티</b><small>${code?mem.length+1+'명':'코드를 맺어요'}</small></span><span class="ntph-pm">${mem.slice(0,5).map(x=>av(x.id,'sm')).join('')}</span></button><button type="button" class="ntph-pa" data-phone="${esc(sid)}" data-phscr="sms"><i>💬</i><span><b>문자${un?`<em>${un}</em>`:''}</b><small>${rooms(me).length}개 방</small></span></button></div>
   ${rs.length?rs.map(({r,L})=>{const l=L[L.length-1];const u=unread(r.id,me);return `<button type="button" class="ntph-row" data-phone="${esc(sid)}" data-phscr="chat" data-room="${esc(r.id)}">${roomIcon(r)}<span class="ntph-rt"><b>${esc(r.name||'')}${u?`<em>${u}</em>`:''}</b><small>${esc(l.data.as||l.who||'')}: ${esc(preview(l.data))}</small></span><small class="ntph-tm">${hm(l.at)}</small></button>`}).join(''):'<div class="ntph-pe">아직 주고받은 문자가 없어요.</div>'}`}
 function panel(sid){if(!(N().gm()||N().me()===sid))return '';if(omRoom()&&!PH.st&&!PH.loading&&!PH.err)setTimeout(()=>load(),0);
  return `<section class="ux-sec ux-ph" data-phpanel="${esc(sid)}">${panelIn(sid)}</section>`}
 function panels(){$$('[data-phpanel]').forEach(el=>{el.innerHTML=panelIn(el.dataset.phpanel)})}
 /* 시트 단추 — 이어 둔 웹툴 방이 있고, GM 이거나 제 시트일 때 */
 function btn(sid){if(!omRoom())return '';if(!(N().gm()||N().me()===sid))return '';const t=trOf(sid);const n=t&&PH.st?unreadAll(t.id):0;
  return `<button type="button" class="btn xs ntph-btn" data-phone="${esc(sid)}" title="웹툴 방의 이 트레이너 휴대폰 (파티 · 문자)">📱 휴대폰${n?`<em>${n}</em>`:''}</button>`}
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-phone]');if(!b)return;e.preventDefault();open(b.dataset.phone,b.dataset.phscr,b.dataset.room)});
 /* 알림 켜 두기: 캠페인에 웹툴 방이 있고 지켜볼 트레이너가 있으면 한 번 읽고 실시간으로 받는다. 탭이 다시 보이면 놓친 것만 */
 function boot(){try{if(!N()||!N().ST||!N().ST.camp)return;const room=omRoom();if(!room){if(PH.room)stopSub();return}if(watchSid()&&(PH.room!==room||(!PH.sub&&!PH.loading)))load()}catch(e){}}
 setInterval(boot,15000);setTimeout(boot,2500);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&PH.sub&&Date.now()-PH.at>60000)load(true)});
 return {open,btn,panel,boot,load,PH};
})();
