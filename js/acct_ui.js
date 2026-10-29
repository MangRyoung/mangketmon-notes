/* ---------- 계정 · 접속자 · 권한 (2026-10-29 감우) ----------
   망령 「세션 노트랑 웹툴이랑 로그인 체계를 같게 · 세션 노트 대기실에도 현재 접속자와 권한을 관리할 수 있는 창」
   로그인 표는 웹툴(오레마스)과 같은 열쇠 om_acct — 주소(mangryoung.github.io)가 같아 한쪽에서 로그인하면 다른 쪽도 들어가 있다.
   캠페인에서는 비밀구 자리에 'u:'+표 (웹툴과 같은 꼴). 권한 = nt_members (관리자는 모든 캠페인 GM). 예전 비밀구 · ?gm= · ?pl= 링크도 그대로.
   접속자 = 실시간 presence 채널 mk_online. 관리 창(대기실 「👥 접속자 · 권한」 · 설정 탭)은 관리자와 그 캠페인 GM 만. 서버는 supabase/patch_2026-10-29_계정.sql */
"use strict";
window.NT_ACCT=(()=>{
 const N=()=>window.NT;const DB=()=>window.NT_STORE;
 const {$,$$,esc}=window.NT;
 const on=()=>!!(DB()&&DB().acct);
 /* 웹툴 app.js 의 ACCT 와 같은 규칙: 「로그인 유지」면 localStorage, 아니면 sessionStorage */
 const A={get(){try{return JSON.parse(localStorage.getItem('om_acct')||sessionStorage.getItem('om_acct')||'null')}catch(e){return null}},
  kept(){try{return !!localStorage.getItem('om_acct')}catch(e){return false}},
  set(a,keep){try{localStorage.removeItem('om_acct');sessionStorage.removeItem('om_acct');if(a)(keep?localStorage:sessionStorage).setItem('om_acct',JSON.stringify(a))}catch(e){}},
  tok(){const a=A.get();return (a&&a.token)||''}};
 const NEED='서버에 노트 계정 함수가 아직 없어요 — Supabase SQL Editor 에서 supabase/patch_2026-10-29_계정.sql 을 실행해 주세요';
 const errMsg=e=>{const m=String((e&&e.message)||e||'');return /nt_(me|admin|camp_new)|Could not find the function|PGRST202|schema cache/i.test(m)?NEED:m};

 /* ----- 나 ----- */
 let ME=null,meP=null,meErr='';
 function me(force){const t=A.tok();if(!t||!on()){ME=null;return Promise.resolve(null)}if(ME&&!force)return Promise.resolve(ME);if(meP)return meP;
  meP=(async()=>{try{const m=await DB().acct.me(t);meErr='';if(!m){A.set(null);ME=null}else{ME=m;A.set(Object.assign({},A.get()||{},{token:t,uid:m.uid,name:m.name,admin:!!m.admin}),A.kept())}}
   catch(e){meErr=errMsg(e);console.warn('[노트] 계정',e)}finally{meP=null}return ME})();return meP}
 const roleOf=camp=>((ME&&ME.camps)||[]).find(c=>c.id===camp)||null;
 const canManage=()=>!!(ME&&(ME.admin||(ME.camps||[]).some(c=>c.role==='gm')));
 const myName=()=>(ME&&ME.name)||(A.get()||{}).name||(A.get()||{}).uid||'';

 /* ----- 로그인 창 (웹툴 로그인 화면과 같은 칸) ----- */
 function loginModal(msg){if(!on())return N().loginBox();let mode='in';
  const keep0=(()=>{try{return JSON.parse(localStorage.getItem('om_keep')??'true')}catch(e){return true}})();
  const draw=()=>{const m=N().openModal(`<div class="mhead"><h2>${mode==='up'?'가입':'로그인'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="aclg"><div class="lgtabs"><button type="button" data-lm="in" class="${mode==='in'?'on':''}">로그인</button><button type="button" data-lm="up" class="${mode==='up'?'on':''}">가입</button></div>
   ${msg?`<p class="acmsg">${esc(msg)}</p>`:''}
   <form id="acForm" autocomplete="on">
    <label class="lbl">아이디<input type="text" id="acId" name="username" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="영문 소문자 · 숫자 3~20자"></label>
    ${mode==='up'?'<label class="lbl">이름<input type="text" id="acName" placeholder="보일 이름 (나중에 웹툴 「내 계정」에서 바꿀 수 있어요)"></label>':''}
    <label class="lbl">비밀번호<input type="password" id="acPw" name="password" autocomplete="${mode==='up'?'new-password':'current-password'}" placeholder="4자 이상"></label>
    ${mode==='up'?'<label class="lbl">비밀번호 확인<input type="password" id="acPw2" autocomplete="new-password"></label>':''}
    <label class="ackeep"><input type="checkbox" id="acKeep" ${keep0?'checked':''}> 이 기기에서 로그인 유지</label>
    <button class="btn pri" id="acOk" type="submit">${mode==='up'?'가입하고 들어가기':'로그인'}</button></form>
   <p class="small dim">웹툴(오레마스)과 같은 계정이에요. 한쪽에서 로그인하면 다른 쪽도 들어가 있어요. 캠페인 권한(GM · PL 시트)은 관리자나 그 캠페인 GM 이 「접속자 · 권한」 창에서 줘요.</p>
   ${N().ST.camp?'<p class="small dim"><a href="#" id="acSec">예전 방식 — 비밀구로 들어가기</a></p>':''}</div>`,'acmodal');
   $$('[data-lm]',m).forEach(b=>b.onclick=()=>{mode=b.dataset.lm;draw()});
   const sc=$('#acSec',m);if(sc)sc.onclick=e=>{e.preventDefault();N().closeModal(true);N().loginBox()};
   $('#acForm',m).onsubmit=async e=>{e.preventDefault();const id=$('#acId',m).value.trim().toLowerCase(),pw=$('#acPw',m).value,keep=$('#acKeep',m).checked;try{localStorage.setItem('om_keep',JSON.stringify(keep))}catch(x){}
    if(!id||!pw)return N().toast('아이디와 비밀번호를 적어 주세요');const bt=$('#acOk',m);bt.disabled=true;
    try{if(mode==='up'){if(pw!==$('#acPw2',m).value){bt.disabled=false;return N().toast('비밀번호 확인이 달라요')}await DB().acct.signup(id,pw,($('#acName',m).value||'').trim()||id)}
     const tok=await DB().acct.login(id,pw,(navigator.userAgent||'').slice(0,60)+' · 노트');
     if(!tok){bt.disabled=false;return N().toast('아이디나 비밀번호가 맞지 않아요')}
     A.set({token:tok,uid:id},keep);await me(true);N().closeModal(true);N().toast(`${myName()} 님으로 로그인했어요`);after()}
    catch(x){bt.disabled=false;N().toast(errMsg(x))}};
   setTimeout(()=>{const i=$('#acId',m);if(i)i.focus()},30)};
  draw()}
 /* 로그인 · 로그아웃 뒤: 캠페인 안이면 권한을 다시 묻고, 대기실이면 다시 그린다 */
 function after(){lastInfo='';const S=N().ST;if(S.camp)N().open(S.camp,S.view);else N().render()}
 async function logout(){if(!await N().confirmBox('이 기기에서 로그아웃할까요? 웹툴도 같이 로그아웃돼요.','로그아웃'))return;const t=A.tok();try{if(t)await DB().acct.logout(t)}catch(e){}A.set(null);ME=null;N().toast('로그아웃했어요');after()}
 /* 캠페인 위 띠의 내 이름 단추 */
 function meMenu(){const m=N().openModal(`<div class="mhead"><h2>${esc(myName())}</h2><span class="small dim mono">@${esc((ME||A.get()||{}).uid||'')}</span><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
  <p class="small dim">웹툴과 같은 계정으로 들어와 있어요. 이름 · 비밀번호는 웹툴 「내 계정」에서 바꿔요.</p>
  <div class="row" style="gap:6px;justify-content:flex-end;margin-top:10px">${canManage()?'<button class="btn sm pri" id="mmMng">👥 접속자 · 권한</button>':''}<button class="btn sm ghost" id="mmOut">로그아웃</button></div>`,'acmodal');
  const g=$('#mmMng',m);if(g)g.onclick=()=>openManage(N().ST.camp);$('#mmOut',m).onclick=()=>{N().closeModal(true);logout()}}

 /* ----- 대기실 막대 · 캠페인 카드 표시 ----- */
 function lobbyBar(){if(!on())return '';const a=A.get();
  if(a&&a.token&&ME)return `<div class="acbar"><span class="acav">${esc([...(ME.name||ME.uid||'?')][0]||'?')}</span><div class="acme"><b>${esc(ME.name)}</b><small><span class="mono">@${esc(ME.uid)}</span>${ME.admin?' · <span class="acadm">관리자</span>':''}</small></div><span class="sp"></span>
   ${canManage()?'<button class="btn sm pri" data-acmng>👥 접속자 · 권한</button>':''}<button class="btn sm ghost" data-acout>로그아웃</button></div>${meErr?`<p class="small acwarn">${esc(meErr)}</p>`:''}`;
  if(a&&a.token&&meErr)return `<div class="acbar"><div class="acme"><b>${esc(a.name||a.uid||'계정')}</b><small class="acwarn">${esc(meErr)}</small></div><span class="sp"></span><button class="btn sm ghost" data-acout>로그아웃</button></div>`;
  return `<div class="acbar off"><div class="acme"><b>로그인하지 않았어요</b><small>웹툴(오레마스)과 같은 계정이에요 — 한쪽에서 로그인하면 둘 다 들어가 있어요. 예전 비밀구 · 링크도 그대로 돼요.</small></div><span class="sp"></span><button class="btn sm pri" data-acin>로그인</button></div>`}
 function bindBar(root){const q=s=>$(s,root);const i=q('[data-acin]'),o=q('[data-acout]'),g=q('[data-acmng]');if(i)i.onclick=()=>loginModal();if(o)o.onclick=logout;if(g)g.onclick=()=>openManage('')}
 function campTag(camp){const r=roleOf(camp);if(!r)return '';return r.role==='gm'?'<span class="tag acgm">GM</span>':r.seat?'<span class="tag acpl">PL</span>':'<span class="tag">구경</span>'}

 /* ----- 접속자 (presence) ----- */
 const KEY=(()=>{try{let k=sessionStorage.getItem('nt_pkey');if(!k){k=Math.random().toString(36).slice(2,10);sessionStorage.setItem('nt_pkey',k)}return k}catch(e){return Math.random().toString(36).slice(2,10)}})();
 const T0=Date.now();let PR=null,PS={},lastInfo='',trT=0;
 function info(){const S=N().ST,a=A.get()||{};const seat=S.role&&S.role!=='gm'?S.role:'';
  return {uid:(a.token&&a.uid)||'',name:(a.token&&(a.name||a.uid))||'',camp:S.camp||'',cname:S.camp?((S.campInfo&&S.campInfo.name)||S.camp):'',role:S.role==='gm'?'gm':seat?'pl':'',seat,sname:seat?(N().seatName(seat)||seat):'',view:S.camp?S.view:'',
   via:(S.secret||'').startsWith('u:')?'acct':S.secret?'sec':'',dev:matchMedia('(max-width:720px)').matches?'폰':'PC',at:T0}}
 function track(){if(!on())return;clearTimeout(trT);trT=setTimeout(()=>{const i=info();const j=JSON.stringify(i);if(j===lastInfo)return;lastInfo=j;
  if(!PR)PR=DB().online(KEY,i,{onSync:st=>{PS=st||{};drawLive()},onRole});else PR.update(i)},250)}
 function people(){const out=[];for(const k in PS){const L=PS[k]||[];const x=L[L.length-1];if(x)out.push(Object.assign({key:k,me:k===KEY},x))}return out}
 /* 다른 사람이 내 권한을 바꾸면: 내 계정 정보를 다시 읽고, 그 캠페인을 보고 있으면 다시 연다 */
 function onRole(p){const a=A.get();if(!a||!a.uid||p.uid!==a.uid)return;me(true).then(()=>{const S=N().ST;if(S.camp&&(!p.camp||p.camp===S.camp)){N().toast('권한이 바뀌었어요 — 다시 열어요');N().open(S.camp,S.view)}else if(!S.camp)N().render()})}

 /* ----- 관리 창: 접속 중 · 캠페인 권한 ----- */
 const MG={tab:'on',camp:'',data:null};
 const VNAME=v=>((N().VIEWS.find(x=>x[0]===v)||[])[1])||v||'';
 const ago=t=>{const m=Math.floor((Date.now()-t)/60000);if(m<1)return '방금';if(m<60)return m+'분';const h=Math.floor(m/60);return h<24?h+'시간':Math.floor(h/24)+'일'};
 const whenTxt=s=>{if(!s)return '—';return ago(new Date(s).getTime())+' 전'};
 async function openManage(camp){if(!on())return;if(!A.tok())return loginModal('관리 창은 로그인해야 열 수 있어요');
  MG.camp=camp||MG.camp||'';MG.tab=camp?'perm':'on';
  const m=N().openModal(`<div class="mhead"><h2>접속자 · 권한</h2><span class="small dim" id="mgSum"></span><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="mgtabs"><button type="button" data-mgt="on">접속 중</button><button type="button" data-mgt="perm">캠페인 권한</button></div><div class="mgbody"><div class="dim">불러오는 중…</div></div>`,'mgmodal');
  $$('[data-mgt]',m).forEach(b=>b.onclick=()=>{MG.tab=b.dataset.mgt;draw()});
  await load();draw()}
 async function load(){try{MG.data=await DB().acct.adminList(A.tok());if(!MG.data.camps.some(c=>c.id===MG.camp))MG.camp=(MG.data.camps[0]||{}).id||''}catch(e){MG.data={err:errMsg(e),users:[],camps:[]}}}
 const campOf=id=>((MG.data||{}).camps||[]).find(c=>c.id===id)||null;
 /* 한 계정 · 한 캠페인의 권한 고르기: '' 없음 · gm · pl: (시트 아직) · pl:<시트 id> */
 function permSel(c,u,attr){const mem=(c.members||[]).find(x=>x.uid===u.uid);const cur=mem?(mem.role==='gm'?'gm':'pl:'+(mem.seat||'')):'';
  const taken={};(c.members||[]).forEach(x=>{if(x.role==='pl'&&x.seat&&x.uid!==u.uid)taken[x.seat]=x.uid});const leg=new Set((c.legacy||[]).map(x=>x.seat));
  const uname=id=>((MG.data.users||[]).find(x=>x.uid===id)||{}).name||id;
  const pcs=(c.pcs||[]).slice();if(mem&&mem.role==='pl'&&mem.seat&&!pcs.some(p=>p.id===mem.seat))pcs.push({id:mem.seat,name:mem.seat+' (시트 없음)'});
  return `<select ${attr}><option value="" ${cur===''?'selected':''}>${u.admin?'없음 (관리자라 GM)':'없음 (구경)'}</option><option value="gm" ${cur==='gm'?'selected':''}>GM</option><option value="pl:" ${cur==='pl:'?'selected':''}>PL · 시트 아직</option>
   ${pcs.map(p=>`<option value="pl:${esc(p.id)}" ${cur==='pl:'+p.id?'selected':''} ${taken[p.id]?'disabled':''}>PL · ${esc(p.name)}${taken[p.id]?` (${esc(uname(taken[p.id]))} 앉음)`:leg.has(p.id)?' · 비밀구 좌석도 있음':''}</option>`).join('')}</select>`}
 async function setPerm(campId,uidv,val){const role=val===''?null:val==='gm'?'gm':'pl';const seat=role==='pl'?val.slice(3):null;
  try{await DB().acct.adminMember(A.tok(),campId,uidv,role,seat);const u=(MG.data.users||[]).find(x=>x.uid===uidv)||{};const c=campOf(campId)||{};
   N().toast(`${u.name||uidv} — 「${c.name||campId}」 ${role==='gm'?'GM':role==='pl'?(seat?'PL · '+(((c.pcs||[]).find(p=>p.id===seat)||{}).name||seat):'PL (시트 아직)'):'권한 뺌'}`);
   if(PR)PR.send({uid:uidv,camp:campId});if(uidv===(A.get()||{}).uid)onRole({uid:uidv,camp:campId})}
  catch(e){N().toast(errMsg(e))}await load();draw()}
 function draw(){const m=$('.mgmodal');if(!m)return;const body=$('.mgbody',m);if(!body)return;const d=MG.data||{users:[],camps:[]};const P=people();
  $$('[data-mgt]',m).forEach(b=>b.classList.toggle('on',b.dataset.mgt===MG.tab));const sm=$('#mgSum',m);if(sm)sm.textContent=`지금 ${P.length}명 · 계정 ${d.users.length}`;
  const onT=$('[data-mgt="on"]',m);if(onT)onT.textContent=`접속 중 ${P.length}`;
  if(d.err){body.innerHTML=`<div class="empty">${esc(d.err)}</div>`;return}
  const onlineUid=new Set(P.filter(x=>x.uid).map(x=>x.uid));
  if(MG.tab==='on'){
   const L=P.slice().sort((a,b)=>(b.camp?1:0)-(a.camp?1:0)||String(a.cname).localeCompare(String(b.cname))||(a.at-b.at));
   body.innerHTML=L.length?`<div class="onlist">${L.map(x=>{const c=x.camp?campOf(x.camp):null;const u=x.uid?(d.users.find(y=>y.uid===x.uid)||{uid:x.uid,name:x.name}):null;
     const rl=x.role==='gm'?'<span class="badge gm">GM</span>':x.role==='pl'?`<span class="badge seat">PL · ${esc(x.sname||x.seat)}</span>`:x.camp?'<span class="badge">구경</span>':'';
     return `<div class="onrow ${x.me?'me':''}"><span class="ondot" aria-hidden="true"></span><div class="onwho"><b>${esc(x.name||'로그인 안 한 사람')}</b><small>${x.uid?'<span class="mono">@'+esc(x.uid)+'</span>':x.via==='sec'?'비밀구로 들어옴':'구경 링크'} · ${esc(x.dev||'')} · ${esc(ago(x.at||Date.now()))} 전부터${x.me?' · 나':''}</small></div>
      <div class="onwhere">${x.camp?`<b>${esc(x.cname||x.camp)}</b><small>${esc(VNAME(x.view))}</small>`:'<span class="dim">대기실</span>'}</div><div class="onrole">${rl}</div>
      <div class="onctl">${c&&u?permSel(c,u,`data-onp="${esc(x.camp)}" data-uid="${esc(x.uid)}" aria-label="${esc((u.name||x.uid)+' 권한')}"`):''}</div></div>`}).join('')}</div>
     <p class="pf-note small dim">세션 노트를 연 사람만 보여요(대기실 포함). 로그인한 사람은 보고 있는 캠페인의 권한을 여기서 바로 바꿀 수 있어요 — 바꾸면 그 사람 화면이 새 권한으로 다시 열려요. 로그인하지 않은 사람은 비밀구 · 링크 권한이라 설정 탭 「PL 좌석」에서 관리해요.</p>`
    :'<div class="empty">지금 세션 노트를 연 사람이 없어요</div>';
   $$('[data-onp]',body).forEach(s=>s.onchange=()=>setPerm(s.dataset.onp,s.dataset.uid,s.value));return}
  /* 캠페인 권한 */
  const c=campOf(MG.camp);
  body.innerHTML=`<div class="row mgpick"><label class="lbl" style="flex:1;min-width:180px">캠페인<select id="mgCamp">${d.camps.map(x=>`<option value="${esc(x.id)}" ${x.id===MG.camp?'selected':''}>${esc(x.name||x.id)}</option>`).join('')}</select></label></div>
   ${c?`<table class="mgt"><thead><tr><th>계정</th><th>권한</th></tr></thead><tbody>${d.users.map(u=>`<tr><td><span class="ondot ${onlineUid.has(u.uid)?'':'off'}" title="${onlineUid.has(u.uid)?'지금 접속 중':'최근 ' + esc(whenTxt(u.last_at))}"></span><b>${esc(u.name)}</b> <span class="mono small dim">@${esc(u.uid)}</span>${u.admin?' <span class="badge gm">관리자</span>':''}</td><td>${permSel(c,u,`data-pp="${esc(u.uid)}" aria-label="${esc(u.name+' 권한')}"`)}</td></tr>`).join('')||'<tr><td colspan="2" class="dim">아직 계정이 없어요</td></tr>'}</tbody></table>
    ${(c.legacy||[]).length?`<div class="mgleg"><b>비밀구 좌석 (예전 방식)</b> ${(c.legacy||[]).map(x=>`<span class="tag">${esc(((c.pcs||[]).find(p=>p.id===x.seat)||{}).name||x.seat)}${x.name?' · '+esc(x.name):''}</span>`).join(' ')}<div class="small dim">비밀구 좌석은 그대로 돼요. 그 캠페인 설정 탭 「PL 좌석」에서 빼거나 바꿔요.</div></div>`:''}
    <p class="pf-note small dim">PL 은 고른 PC 시트만 고칠 수 있어요. 「PL · 시트 아직」은 비공개 없이 구경만. 관리자는 따로 주지 않아도 모든 캠페인에서 GM 이에요. 계정 만들기 · 관리자 · 비밀번호 초기화는 웹툴 「관리자 패널」에서 해요.</p>`
   :'<div class="empty">관리할 캠페인이 없어요</div>'}`;
  const cs=$('#mgCamp',body);if(cs)cs.onchange=()=>{MG.camp=cs.value;draw()};
  $$('[data-pp]',body).forEach(s=>s.onchange=()=>setPerm(MG.camp,s.dataset.pp,s.value))}
 /* 접속자가 바뀌면 열린 관리 창도 다시 (고르던 칸이 있으면 기다린다) */
 function drawLive(){const m=$('.mgmodal');if(!m)return;const a=document.activeElement;if(a&&a.tagName==='SELECT'&&m.contains(a))return;draw()}

 return {tok:()=>A.tok(),get:()=>A.get(),me,roleOf,canManage,myName,loginModal,logout,meMenu,lobbyBar,bindBar,campTag,track,people,openManage};
})();
