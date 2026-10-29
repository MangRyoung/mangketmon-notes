/* ---------- 각성체 추천 (2026-10-29 망령 「포트 올리면 역사 속 인물이나 설화에서 후보 추천」) ----------
   미사그 대학의 각성체 = 은열쇠로 부르는 「간이 영령」. 서번트 · 영령과 비슷하지만 사람에게 주는 부담을 줄이려 마이너하거나 열화된 모습(망령 10-29).
   시트 탭 아래 「각성체」 화면 · GM만. 후보 DB = data/awaken_db.json(감우가 모은 기본 목록) + 문서 awkdb(GM이 더한 것).
   PC마다 문서 awk/<pc id> (GM만): {tags[], read:{by,at,sum,tags,picks[{id,why}],extra[]}, cands[id], pick:id, made:{pid,id,at}}.
   포트 읽기 = Supabase Edge Function(NT_CONFIG.awakenFn, 기본 'awaken-read')이 Claude 로 그림을 읽어 태그 · 후보를 돌려준다.
   함수가 없으면 「감우 결과 넣기」에 대화에서 받은 JSON 을 붙여 넣는다(같은 꼴).
   10-29 망령 「트레이너별로 그림 · 코멘트를 넣어 두고 한 번에 감우한테 보낼 수 있게」 → 「📦 감우에게 보낼 묶음」(그림 한 장 + 글).
   10-29 망령 「각성체 탭 내용물은 DB 탭으로 빼고, 각성체엔 플레이어가 학생증에서 이어 그림 · 코멘트를 넣게」:
     시트 탭 아래 「각성체」(awk, 모두 — PL 은 제 PC, GM 은 전원 + 묶음) · 「각성체 DB」(awdb, GM 만 — 추천 · 후보 DB).
     학생증(pc_ui idHero) 옆 카드 = NT_AWK.idCard(id).
   10-29 망령 「트레이너에 어울리는 각성체가 아니야. 각성체 포트레이트를 줄 테니 거기에 어울리는 걸 추천」:
     추천 대상 = PC 마다 각성체 칸 둘 (sid = <pc>~1 · <pc>~2). 그림 = pcp/<pc>.awk[n-1].img → 없으면 제작기에서 각성체(awaken free · c)로 표시한 n 번째 포켓몬 그림.
     코멘트 = pcp.awk[n-1].note (PL 이 쓸 수 있는 문서). 추천 기록 = awk/<sid> (GM). 「⇪ 제작기 각성체로」 = 그 칸의 제작기 각성체 시트 메모에 원전을 넣는다(없으면 새로 만든다). */
"use strict";
window.NT_AWK=(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const MK=()=>window.NT_MAKER;
 const U={mode:'pc',sel:'',q:'',fame:3,fate:false,taken:true,reg:new Set(),cat:'',type:'',cost:'',more:0,busy:false,dbq:'',dbreg:'',open:''};
 const DB={base:null,groups:null,p:null,err:''};
 const T2C={'노말':'#9aa','불꽃':'#f08030','물':'#6890f0','풀':'#78c850','전기':'#f8d030','얼음':'#98d8d8','격투':'#c03028','독':'#a040a0','땅':'#e0c068','비행':'#a890f0','에스퍼':'#f85888','벌레':'#a8b820','바위':'#b8a038','고스트':'#705898','드래곤':'#7038f8','악':'#705848','강철':'#b8b8d0','페어리':'#ee99ac'};
 const TYPES=Object.keys(T2C),COSTS=['지시','육성','통솔','능력'];
 const tchip=t=>`<em class="tch" style="background:${T2C[t]||'#666'}">${esc(t)}</em>`;
 const GW={'분위기':1.6,'모습':1.3,'복장':1,'소품':1.1,'모티프':1.2,'색':.6,'풍':.8};   /* 태그 묶음별 무게 — 분위기가 가장 크다 */
 const fnName=()=>(window.NT_CONFIG||{}).awakenFn||'awaken-read';
 const fnUrl=()=>{const c=window.NT_CONFIG||{};return c.supabaseUrl?String(c.supabaseUrl).replace(/\/$/,'')+'/functions/v1/'+fnName():''};

 /* ----- 후보 DB ----- */
 function load(){if(DB.p)return DB.p;DB.p=fetch('data/awaken_db.json?v=1',{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(j=>{DB.base=j.list||[];DB.groups=j.groups||{}}).catch(e=>{DB.err=e.message||String(e);DB.base=[];DB.groups={}}).finally(()=>N().render());return DB.p}
 const custom=()=>N().list('awkdb').map(e=>Object.assign({},e,{own:1}));
 const all=()=>{const L=(DB.base||[]).slice();const C=custom();const ids=new Set(C.map(x=>x.id));return L.filter(x=>!ids.has(x.id)).concat(C)};
 const byId=id=>all().find(x=>x.id===id)||null;
 const tagGroup=t=>{for(const [g,L] of Object.entries(DB.groups||{}))if(L.includes(t))return g;return ''};
 const regions=()=>[...new Set(all().map(e=>e.r).filter(Boolean))];

 /* ----- PC 별 문서 ----- */
 const pcs=()=>N().list('pc').sort((a,b)=>(a.order||0)-(b.order||0));
 const rec=id=>N().data('awk',id)||{};
 async function save(id,fn){const cur=N().clone(rec(id));const r=fn(cur);if(r===false)return;await N().put('awk',id,cur,'gm')}
 /* 다른 PC 가 고른 후보 → {후보 id: PC 이름} */
 function takenMap(except){const M={};for(const p of N().list('awk')){if(p.id===except||!p.pick||!String(p.id).includes('~'))continue;M[p.pick]=subName(p.id)}return M}
 const portrait=id=>{const p=N().data('pc',id)||{};const t=MK()&&MK().trainer(id);return p.image||(t&&t.image)||''};
 const pcp=id=>N().data('pcp',id)||{};
 const sidOf=(pc,n)=>pc+'~'+n;const sidPc=x=>String(x).split('~')[0];const sidN=x=>+String(x).split('~')[1]||1;
 const mkAw=pc=>{try{return MK()?MK().mons(pc).filter(m=>m.awaken==='free'||m.awaken==='c'):[]}catch(e){return []}};
 const slotRaw=(pc,n)=>{const L=pcp(pc).awk;return (Array.isArray(L)&&L[n-1])||{}};
 function slot(sid){const pc=sidPc(sid),n=sidN(sid);const s=slotRaw(pc,n);const m=mkAw(pc)[n-1];const mi=m?(MK().img(m)||''):'';return {sid,pc,n,img:s.img||mi,own:!!s.img,note:s.note||'',pid:m?m.id:'',mname:m?(m.name||''):'',kind:m?m.awaken:''}}
 const hasSlot=sid=>{const x=slot(sid);return !!(x.img||x.note||x.pid)};
 const subs=()=>pcs().flatMap(p=>[sidOf(p.id,1)].concat(hasSlot(sidOf(p.id,2))?[sidOf(p.id,2)]:[])).map(id=>({id}));
 const subImg=sid=>slot(sid).img;
 const subNote=sid=>slot(sid).note;
 const subName=sid=>{const x=slot(sid);return `${pcName(x.pc)} · 각성체 ${x.n}${x.mname?' ('+x.mname+')':''}`};
 const canSend=id=>N().gm()||N().me()===sidPc(id);
 const pcName=id=>{const p=N().data('pc',id)||{};const t=MK()&&MK().trainer(id);return p.name||(t&&t.name)||id};

 /* ----- 점수: 고른 태그 · 포트 읽기의 추천 ----- */
 function scoreOf(e,tags,picks){let s=0;const hit=[];for(const t of tags){if((e.g||[]).includes(t)){s+=GW[tagGroup(t)]||1;hit.push(t)}}
  const pk=picks&&picks.find(x=>x.id===e.id);if(pk)s+=4;
  s+=(3-Math.min(3,Math.abs((e.f||2)-2)))*.15;   /* 지명도 2 근처를 조금 앞으로 (마이너 · 열화판이 기본) */
  return {s,hit,why:pk?pk.why:''}}
 function filtered(id){const r=rec(id);const tags=r.tags||[];const picks=(r.read&&r.read.picks)||[];const tk=takenMap(id);
  return all().filter(e=>{if(U.fame<5&&(e.f||2)>U.fame&&!picks.some(x=>x.id===e.id))return false;if(!U.fate&&e.x)return false;if(U.taken&&tk[e.id])return false;
   if(U.reg.size&&!U.reg.has(e.r))return false;if(U.cat&&e.c!==U.cat)return false;if(U.type&&!(e.t||[]).includes(U.type))return false;if(U.cost&&e.w!==U.cost)return false;
   if(U.q){const q=U.q.toLowerCase();if(![e.n,e.o,e.l,e.d,e.k,e.r,e.e].join(' ').toLowerCase().includes(q))return false}return true})
   .map(e=>Object.assign({e},scoreOf(e,tags,picks))).sort((a,b)=>b.s-a.s||String(a.e.n).localeCompare(String(b.e.n),'ko'))}

 /* ----- 화면 ----- */
 function render(el){if(!N().gm()){el.innerHTML='<div class="toolbar"><h2>각성체 DB</h2></div><div class="empty">각성체 DB 는 GM 화면이에요.</div>';return}
  if(!DB.base){load();el.innerHTML='<div class="toolbar"><h2>각성체 DB</h2></div><div class="empty">후보 목록을 불러오는 중…</div>';return}
  const L=subs();if(!U.sel||!L.some(x=>x.id===U.sel))U.sel=(L[0]||{}).id||'';
  el.innerHTML=`<div class="toolbar"><h2>각성체 DB</h2><div class="seg"><button data-aw="mode" data-v="pc" class="${U.mode==='pc'?'on':''}">각성체 별 추천</button><button data-aw="mode" data-v="db" class="${U.mode==='db'?'on':''}">후보 DB ${all().length}명</button></div><span class="note">은열쇠로 부르는 간이 영령 · 마이너하거나 열화된 모습이 기본</span><span class="sp"></span><button class="btn sm pri" data-aw="bundle" title="각성체 칸마다 넣어 둔 그림 · 코멘트를 그림 한 장 + 글 하나로 묶어요 — 대화에 그대로 붙여 넣으면 감우가 한 번에 읽어요">📦 감우에게 보낼 묶음</button><button class="btn sm" data-aw="pasteall" title="감우가 여러 PC 결과를 한 번에 준 것을 붙여 넣어요">📋 묶음 결과 넣기</button>${DB.err?`<span class="small" style="color:var(--red)">기본 목록을 못 읽었어요: ${esc(DB.err)}</span>`:''}</div>
   ${U.mode==='db'?dbView():L.length?`<div class="awk"><div class="awpcs">${L.map(pcChip).join('')}</div>${U.sel?pcView(U.sel):''}</div>`:'<div class="empty">PC 시트가 없어요. 시트 탭에서 PC 를 먼저 넣어 주세요.</div>'}`;
  el.addEventListener('click',onClick);el.addEventListener('input',onInput);el.addEventListener('change',onInput);
}
 function pcChip(p){const r=rec(p.id);const img=subImg(p.id);const pk=r.pick&&byId(r.pick);
  return `<button type="button" class="awpc ${p.id===U.sel?'on':''}" data-aw="sel" data-v="${esc(p.id)}"><i style="${img?`background-image:url('${cssu(img)}')`:''}"></i><span><b>${esc(subName(p.id))}</b><small>${pk?'✓ '+esc(pk.n):(r.cands||[]).length?'후보 '+(r.cands||[]).length:r.read?'읽음':subNote(p.id)||slot(p.id).own?'보낼 준비':'—'}</small></span></button>`}
 const stars=f=>'●'.repeat(f||0)+'○'.repeat(5-(f||0));
 function pcView(id){const r=rec(id);const img=subImg(id);const tags=r.tags||[];const rd=r.read;const res=filtered(id);const N0=12+U.more*12;const fn=!!fnUrl();
  return `<div class="awmain">
   <div class="awhead card"><div class="awpor ${img?'':'noimg'}" style="${img?`background-image:url('${cssu(img)}')`:''}">${img?'':'각성체 그림 없음'}</div>
    <div class="awinfo"><div class="row"><h3>${esc(subName(id))}</h3><span class="sp"></span>
      <button class="btn sm pri" data-aw="read" ${U.busy||!subImg(id)?'disabled':''} title="${subImg(id)?(fn?'각성체 그림을 Claude 가 읽어 어울리는 원전 인물을 골라요 (한 번에 100~300원쯤, GM만)':'Edge Function 주소가 없어요 — 설정 안내를 봐 주세요'):'각성체 그림을 먼저 넣어 주세요 (각성체 탭 · 제작기 각성체 포켓몬 그림)'}">${U.busy?'읽는 중…':'🔍 포트 읽기'}</button>
      <button class="btn sm" data-aw="paste" title="대화에서 감우가 읽어 준 결과(JSON)를 붙여 넣어요">📋 감우 결과 넣기</button></div>
      <div class="awsend"><div class="awsnote"><small class="dim">코멘트</small><div class="pre small">${esc(subNote(id))||'<span class="dim">— 아직 없어요</span>'}</div></div><button type="button" class="linkbtn small" data-aw="sendedit" data-v="${esc(sidPc(id))}">그림 · 코멘트 고치기</button></div>
    ${rd?`<div class="awread"><b>${rd.by==='fn'?'포트 읽기':'감우 결과'}</b> <small class="dim">${esc(String(rd.at||'').slice(0,16).replace('T',' '))}</small><div class="pre">${esc(rd.sum||'')}</div>${(rd.extra||[]).length?`<div class="small dim" style="margin-top:4px">DB 밖 후보 ${rd.extra.length}명은 아래 목록 맨 앞에 「DB 밖」으로 떠요 · 마음에 들면 「DB 에 넣기」</div>`:''}</div>`:`<p class="small dim" style="margin:6px 0 0">각성체 그림을 읽으면 외형 · 분위기 태그가 채워지고 어울리는 원전 인물이 앞으로 와요. 태그를 직접 골라도 돼요.</p>`}
    </div></div>
   ${tagPicker(tags)}
   ${filterBar()}
   ${(r.cands||[]).length||r.pick?pickedBox(id,r):''}
   <div class="awres">${extraCards(id,rd)}${res.slice(0,N0).map(x=>card(id,x,r)).join('')||'<div class="empty">조건에 맞는 후보가 없어요. 지명도 · 지역 조건을 넓혀 보세요.</div>'}</div>
   ${res.length>N0?`<div class="row" style="justify-content:center;margin-top:10px"><button class="btn sm ghost" data-aw="more">더 보기 (${res.length-N0}명 더)</button></div>`:''}
  </div>`}
 function tagPicker(sel){const G=DB.groups||{};return `<div class="awtags card"><div class="row"><b>태그</b><small class="dim">외형 · 분위기 · 소품 — 고른 태그가 많이 겹칠수록 위로</small><span class="sp"></span>${sel.length?`<button class="linkbtn small" data-aw="tagclr">비우기</button>`:''}</div>
   ${Object.entries(G).filter(([g])=>g!=='풍').map(([g,L])=>`<div class="awtg"><span>${esc(g)}</span>${L.map(t=>`<button type="button" class="chip ${sel.includes(t)?'on':''}" data-aw="tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>`).join('')}
   <div class="awtg"><span>풍</span>${(G['풍']||[]).map(t=>`<button type="button" class="chip ${sel.includes(t)?'on':''}" data-aw="tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>`}
 function filterBar(){const R=regions();const cats=[...new Set(all().map(e=>e.c))];
  return `<div class="awfil row">
   <label class="small">지명도 ≤ <select data-aw="fame">${[1,2,3,4,5].map(v=>`<option value="${v}" ${U.fame===v?'selected':''}>${v}${v===3?' (기본)':v===5?' (전부)':''}</option>`).join('')}</select></label>
   <select data-aw="cat"><option value="">분류 전부</option>${cats.map(c=>`<option ${U.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
   <select data-aw="type"><option value="">타입 전부</option>${TYPES.map(c=>`<option ${U.type===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
   <select data-aw="cost"><option value="">대가 성향 전부</option>${COSTS.map(c=>`<option ${U.cost===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
   <label class="small"><input type="checkbox" data-aw="fate" ${U.fate?'checked':''}> Fate 서번트로 나온 인물도</label>
   <label class="small"><input type="checkbox" data-aw="taken" ${U.taken?'checked':''}> 다른 PC 가 고른 후보 숨기기</label>
   <input type="search" data-aw="q" id="awQ" data-live placeholder="이름 · 은열쇠 · 설명 찾기" value="${esc(U.q)}" style="flex:1;min-width:140px">
   <div class="awreg">${R.map(g=>`<button type="button" class="chip xs ${U.reg.has(g)?'on':''}" data-aw="reg" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div></div>`}
 function pickedBox(id,r){const pk=r.pick&&byId(r.pick);const C=(r.cands||[]).map(byId).filter(Boolean);
  return `<div class="awpick card"><div class="row"><b>고른 후보</b><span class="sp"></span>${pk?`<button class="btn sm pri" data-aw="tomk" title="이 칸의 제작기 각성체 시트 메모에 원전을 넣어요 (시트가 없으면 새로 만들어요)">⇪ 제작기 각성체로</button>`:''}</div>
   ${pk?`<div class="awpk"><b>✓ ${esc(pk.n)}</b> <small class="dim">${esc(pk.o||'')}</small> ${(pk.t||[]).map(tchip).join('')} <small>은열쇠 · ${esc(pk.k||'—')}</small>${r.made?` <span class="visb">제작기에 만듦 ${esc(String(r.made.at||'').slice(5,10))}</span>`:''}</div>`:'<div class="small dim">「✓ 이걸로」를 누르면 여기에 정해져요.</div>'}
   ${C.length?`<div class="awcands">${C.map(e=>`<span class="chip static ${pk&&pk.id===e.id?'on':''}">${esc(e.n)} <button type="button" class="linkbtn" data-aw="pickset" data-v="${esc(e.id)}" title="이걸로">✓</button><button type="button" class="linkbtn" data-aw="cand" data-v="${esc(e.id)}" title="후보에서 빼기">✕</button></span>`).join('')}</div>`:''}</div>`}
 function card(id,x,r){const e=x.e;const on=(r.cands||[]).includes(e.id),pk=r.pick===e.id;const open=U.open===e.id;
  return `<div class="awc card ${pk?'pk':on?'on':''}" data-id="${esc(e.id)}">
   <div class="awch"><b>${esc(e.n)}</b>${e.o?`<small class="dim">${esc(e.o)}</small>`:''}<span class="sp"></span><span class="awsc" title="맞은 태그 점수">${x.s?x.s.toFixed(1):'-'}</span></div>
   <div class="awmeta"><span>${esc(e.r||'')}${e.e?' · '+esc(e.e):''}</span><span>${esc(e.c||'')}</span><span class="awfm" title="지명도 ${e.f}/5">${stars(e.f)}</span>${e.x?'<span class="awx" title="Fate 에 서번트로 나온 인물이에요 — 열화판으로만">Fate</span>':''}${e.own?'<span class="awx own">직접 추가</span>':''}</div>
   <p class="awl">${esc(e.l||'')}</p>
   ${x.why?`<p class="awwhy">🔍 ${esc(x.why)}</p>`:''}
   <div class="awkv"><span>열화</span><p>${esc(e.d||'')}</p><span>은열쇠</span><p>${esc(e.k||'')}</p></div>
   <div class="awft">${(e.t||[]).map(tchip).join('')}<small class="awcost">대가 · ${esc(e.w||'—')}</small><span class="sp"></span>${x.hit.length?`<small class="awhit">${x.hit.map(esc).join(' · ')}</small>`:''}</div>
   ${open?`<div class="awtags2">${(e.g||[]).map(t=>`<span class="chip xs static">${esc(t)}</span>`).join('')}</div>`:''}
   <div class="row awbtn"><button type="button" class="linkbtn small" data-aw="open" data-v="${esc(e.id)}">${open?'접기':'태그'}</button><span class="sp"></span><button type="button" class="btn xs ${on?'':'ghost'}" data-aw="cand" data-v="${esc(e.id)}">${on?'★ 후보':'☆ 후보'}</button><button type="button" class="btn xs ${pk?'pri':''}" data-aw="pickset" data-v="${esc(e.id)}">${pk?'✓ 정함':'✓ 이걸로'}</button></div></div>`}
 /* 포트 읽기가 DB 밖에서 찾아온 후보 — 맨 앞에 */
 function extraCards(id,rd){const X=(rd&&rd.extra)||[];if(!X.length)return '';const have=new Set(all().map(e=>e.n));
  return X.map((e,i)=>{const inDb=have.has(e.n);return `<div class="awc card extra"><div class="awch"><b>${esc(e.n)}</b>${e.o?`<small class="dim">${esc(e.o)}</small>`:''}<span class="sp"></span><span class="awx">DB 밖</span></div>
   <div class="awmeta"><span>${esc(e.r||'')}${e.e?' · '+esc(e.e):''}</span><span>${esc(e.c||'')}</span><span class="awfm">${stars(e.f||2)}</span></div><p class="awl">${esc(e.l||'')}</p>${e.why?`<p class="awwhy">🔍 ${esc(e.why)}</p>`:''}
   <div class="awkv"><span>열화</span><p>${esc(e.d||'')}</p><span>은열쇠</span><p>${esc(e.k||'')}</p></div><div class="awft">${(e.t||[]).filter(t=>T2C[t]).map(tchip).join('')}<small class="awcost">대가 · ${esc(e.w||'—')}</small></div>
   <div class="row awbtn"><small class="dim">사실 확인이 필요할 수 있어요</small><span class="sp"></span>${inDb?'<small class="dim">DB 에 있음</small>':`<button type="button" class="btn xs" data-aw="xadd" data-v="${i}">＋ DB 에 넣기</button>`}</div></div>`}).join('')}

 /* ----- 후보 DB 보기 ----- */
 function dbView(){const q=U.dbq.toLowerCase();const L=all().filter(e=>(!U.dbreg||e.r===U.dbreg)&&(!q||[e.n,e.o,e.l,e.d,e.k,(e.g||[]).join(' ')].join(' ').toLowerCase().includes(q)));
  const R=regions();const cnt=r=>all().filter(e=>e.r===r).length;
  return `<div class="awdb"><div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><input type="search" data-aw="dbq" id="awDbQ" data-live placeholder="이름 · 태그 · 설명 찾기" value="${esc(U.dbq)}" style="flex:1;min-width:160px"><button class="btn sm pri" data-aw="dbadd">＋ 직접 추가</button></div>
   <div class="awreg" style="margin-bottom:8px"><button type="button" class="chip xs ${!U.dbreg?'on':''}" data-aw="dbreg" data-v="">전부 ${all().length}</button>${R.map(r=>`<button type="button" class="chip xs ${U.dbreg===r?'on':''}" data-aw="dbreg" data-v="${esc(r)}">${esc(r)} ${cnt(r)}</button>`).join('')}</div>
   <div class="tblwrap"><table class="awtbl"><thead><tr><th>이름</th><th>지역 · 시대</th><th>분류</th><th>지명도</th><th>타입</th><th>대가</th><th>은열쇠</th><th></th></tr></thead><tbody>${L.map(e=>`<tr><td><b>${esc(e.n)}</b>${e.x?' <span class="awx">Fate</span>':''}${e.own?' <span class="awx own">직접</span>':''}<div class="small dim">${esc(e.l||'')}</div></td><td>${esc(e.r||'')}<div class="small dim">${esc(e.e||'')}</div></td><td>${esc(e.c||'')}</td><td class="awfm">${stars(e.f)}</td><td>${(e.t||[]).map(tchip).join(' ')}</td><td>${esc(e.w||'')}</td><td class="small">${esc(e.k||'')}</td><td>${e.own?`<button class="linkbtn small" data-aw="dbedit" data-v="${esc(e.id)}">고치기</button>`:`<button class="linkbtn small" data-aw="dbedit" data-v="${esc(e.id)}" title="고친 것은 직접 추가 목록에 사본으로 저장돼요">고치기</button>`}</td></tr>`).join('')}</tbody></table></div></div>`}

 /* ----- 손 ----- */
 async function onClick(ev){const b=ev.target.closest('[data-aw]');if(!b||b.tagName==='SELECT'||b.tagName==='INPUT')return;const k=b.dataset.aw,v=b.dataset.v;const id=U.sel;
  if(k==='mode'){U.mode=v;return N().render()}
  if(k==='sel'){U.sel=v;U.more=0;U.open='';return N().render()}
  if(k==='tag'){return save(id,r=>{const L=r.tags||[];const i=L.indexOf(v);if(i>=0)L.splice(i,1);else L.push(v);r.tags=L})}
  if(k==='tagclr')return save(id,r=>{r.tags=[]});
  if(k==='reg'){U.reg.has(v)?U.reg.delete(v):U.reg.add(v);return N().render()}
  if(k==='more'){U.more++;return N().render()}
  if(k==='open'){U.open=U.open===v?'':v;return N().render()}
  if(k==='cand')return save(id,r=>{const L=r.cands||[];const i=L.indexOf(v);if(i>=0)L.splice(i,1);else L.push(v);r.cands=L});
  if(k==='pickset')return save(id,r=>{if(r.pick===v){r.pick='';return}r.pick=v;r.cands=r.cands||[];if(!r.cands.includes(v))r.cands.push(v)});
  if(k==='read')return readPort(id);
  if(k==='paste')return pasteBox(id);
  if(k==='xadd'){const e=((rec(id).read||{}).extra||[])[+v];if(!e)return;return editEntry(Object.assign({},e,{id:''}))}
  if(k==='tomk')return toMaker(id);
  if(k==='bundle')return bundle();
  if(k==='pasteall')return pasteBox('');
  if(k==='sendedit')return sendBox(v||id);
  if(k==='godb'){U.sel=v;U.mode='pc';return N().go('awdb')}
  if(k==='dbreg'){U.dbreg=v;return N().render()}
  if(k==='dbadd')return editEntry(null);
  if(k==='dbedit')return editEntry(byId(v))}
 let qT=0;
 function onInput(ev){const t=ev.target;const k=t.dataset&&t.dataset.aw;if(!k)return;
  if(k==='q'||k==='dbq'){if(ev.type!=='input')return;clearTimeout(qT);qT=setTimeout(()=>{U[k]=t.value;N().render()},250);return}
  if(ev.type!=='change')return;
  if(k==='fame'){U.fame=+t.value;return N().render()}
  if(k==='fate'||k==='taken'){U[k]=t.checked;return N().render()}
  if(k==='cat'||k==='type'||k==='cost'){U[k]=t.value;return N().render()}}

 /* ----- 포트 읽기 (Edge Function) ----- */
 const vocab=()=>Object.values(DB.groups||{}).flat();
 const brief=()=>all().map(e=>[e.id,e.n,e.r,e.c,e.f,(e.g||[]).join(',')].join('|')).join('\n');
 async function imgPayload(url){if(!/^data:/.test(url))return {url};const m=/^data:([^;,]+);base64,(.*)$/.exec(url);return m?{media_type:m[1],data:m[2]}:{url}}
 async function readPort(id){const url=fnUrl();const img=subImg(id);if(!img)return N().toast('각성체 그림이 없어요');if(!url)return N().toast('Edge Function 주소가 없어요 (js/config.js)');
  U.busy=true;N().render();
  try{const c=window.NT_CONFIG||{};const bio=subNote(id).slice(0,1500);
   const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',apikey:c.supabaseKey||'',Authorization:'Bearer '+(c.supabaseKey||'')},
    body:JSON.stringify({camp:N().ST.camp,secret:N().ST.secret,image:await imgPayload(img),name:subName(id),bio,vocab:vocab(),db:brief()})});
   const j=await res.json().catch(()=>({error:'응답을 읽지 못했어요 (HTTP '+res.status+')'}));if(!res.ok||j.error)throw new Error(j.error||('HTTP '+res.status));
   await applyRead(id,j,'fn');N().toast('각성체 그림을 읽었어요')}
  catch(e){N().toast('포트 읽기 실패: '+(e.message||e))}finally{U.busy=false;N().render()}}
 /* 읽은 결과(함수 · 붙여 넣기 같은 꼴): {sum, tags[], picks[{id|n, why}], extra[{n,o,r,e,c,f,l,d,k,t,w,g,why}]} */
 async function applyRead(id,j,by){if(!id)return;const V=new Set(vocab());const tags=(j.tags||[]).filter(t=>V.has(t));const A=all();
  const picks=(j.picks||[]).map(p=>{const e=p.id&&byId(p.id)||A.find(x=>x.n===p.n);return e?{id:e.id,why:String(p.why||'')}:null}).filter(Boolean);
  const extra=(j.extra||[]).filter(e=>e&&e.n).slice(0,4).map(e=>({n:String(e.n),o:String(e.o||''),r:String(e.r||''),e:String(e.e||''),c:String(e.c||''),f:Math.max(1,Math.min(5,+e.f||2)),l:String(e.l||''),d:String(e.d||''),k:String(e.k||''),t:(e.t||[]).filter(t=>T2C[t]).slice(0,2),w:COSTS.includes(e.w)?e.w:'',g:(e.g||[]).filter(t=>V.has(t)),why:String(e.why||'')}));
  await save(id,r=>{r.read={by,at:new Date().toISOString(),sum:String(j.sum||''),tags,picks,extra};r.tags=[...new Set((r.tags||[]).concat(tags))]})}
 function pasteBox(id){const md=N().openModal(`<div class="mhead"><h2>📋 ${id?'감우 결과 넣기 · '+esc(subName(id)):'묶음 결과 넣기 (여러 각성체)'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">대화에서 각성체 그림을 보여 주면 감우가 이 꼴의 JSON 을 드려요. 그대로 붙여 넣으면 태그 · 후보가 채워져요.</p>
   <textarea id="awPaste" rows="12" placeholder='{"sum":"…","tags":["우울","장발"],"picks":[{"n":"아랑","why":"…"}],"extra":[]}' style="width:100%;font-family:var(--mono);font-size:12px"></textarea>
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awPOk">넣기</button></div>`,'wide');
  $('#awPOk',md).onclick=async()=>{let j;const s=$('#awPaste',md).value.trim().replace(/^```(json)?\s*|\s*```$/g,'');try{j=JSON.parse(s)}catch(e){return N().toast('JSON 이 아니에요: '+e.message)}
   const many=Array.isArray(j)?j:Array.isArray(j.list)?j.list:null;
   if(!many){if(!id)return N().toast('한 체 것이에요 — 각성체 DB 에서 그 각성체를 고른 뒤 「📋 감우 결과 넣기」로 넣어 주세요');await applyRead(id,j,'chat');N().closeModal();return N().toast('넣었어요')}
   const P=pcs();let n=0;const miss=[];for(const x of many){const pc0=String(x.pc||'');const k=+x.slot||(pc0.includes('~')?sidN(pc0):1);let p=P.find(q=>q.id===sidPc(pc0))||P.find(q=>pcName(q.id)===x.name||pcName(q.id)===pc0||String(x.name||'').startsWith(pcName(q.id)+' '));if(!p){miss.push(x.name||x.pc||'?');continue}await applyRead(sidOf(p.id,k),x,'chat');n++}
   N().closeModal();N().toast(`${n}체 넣었어요`+(miss.length?` · 못 찾은 PC: ${miss.join(', ')}`:''))}}

 /* ----- 📦 감우에게 보낼 묶음: 그림 한 장(번호 · 이름) + 글(코멘트 · 고른 태그 · 돌려받을 꼴) ----- */
 function loadImg(src){return new Promise(res=>{const im=new Image();if(!/^data:/.test(src))im.crossOrigin='anonymous';im.onload=()=>res(im);im.onerror=()=>res(null);im.src=src})}
 async function sheet(L){const n=L.length,cols=Math.min(n,4),rows=Math.ceil(n/cols),W=420,H=560,LB=56,G=16;
  const cv=document.createElement('canvas');cv.width=cols*W+(cols+1)*G;cv.height=rows*(H+LB)+(rows+1)*G;const c=cv.getContext('2d');c.fillStyle='#16161c';c.fillRect(0,0,cv.width,cv.height);
  let bad=0;for(let i=0;i<n;i++){const p=L[i];const x=G+(i%cols)*(W+G),y=G+Math.floor(i/cols)*(H+LB+G);c.fillStyle='#000';c.fillRect(x,y,W,H);
   const im=await loadImg(subImg(p.id));if(im){const s=Math.max(W/im.width,H/im.height);const w=im.width*s,h=im.height*s;c.save();c.beginPath();c.rect(x,y,W,H);c.clip();c.drawImage(im,x+(W-w)/2,y+Math.min(0,(H-h)/4),w,h);c.restore()}else bad++;
   c.fillStyle='#f4f0e6';c.fillRect(x,y+H,W,LB);c.fillStyle='#111';c.font='bold 26px "IBM Plex Sans KR",sans-serif';c.textBaseline='middle';c.fillText(`${i+1}. ${subName(p.id)}`.slice(0,26),x+14,y+H+LB/2)}
  let url='';try{url=cv.toDataURL('image/png')}catch(e){url=''}return {cv,url,bad}}
 function bundleText(L){const out=['[각성체 원전 추천 부탁 — 미사그]','그림 한 장에 번호 · 이름을 붙인 각성체 그림이 있어요. 그림마다 그 모습에 어울리는 역사 · 설화 속 원전 인물(마이너하거나 열화된 모습)을 골라 주세요.',''];
  L.forEach((p,i)=>{const r=rec(p.id);const x=slot(p.id);out.push(`${i+1}. ${subName(p.id)} (pc: ${x.pc}, slot: ${x.n})`);if(x.note)out.push('   코멘트: '+x.note.replace(/\n/g,' / '));if((r.tags||[]).length)out.push('   고른 태그: '+r.tags.join(', '));const pk=r.pick&&byId(r.pick);if(pk)out.push('   이미 정함: '+pk.n);out.push('')});
  out.push('돌려받을 꼴: JSON 배열 하나. [{"pc":"<pc id>","slot":<1|2>,"name":"<이름>","sum":"…","tags":[…],"picks":[{"id":"<DB id>","n":"<이름>","why":"…"}],"extra":[…]}]');
  out.push('(받은 것은 세션 노트 시트 > 각성체의 「📋 묶음 결과 넣기」에 그대로 붙여 넣어요)');return out.join('\n')}
 async function bundle(){await MK().load();const P=subs();if(!P.length)return N().toast('PC 가 없어요');const sel=new Set(P.filter(p=>subImg(p.id)&&!rec(p.id).pick).map(p=>p.id));if(!sel.size)P.forEach(p=>subImg(p.id)&&sel.add(p.id));
  const md=N().openModal(`<div class="mhead"><h2>📦 감우에게 보낼 묶음</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">보낼 각성체를 고르세요. <b>그림 복사</b>(또는 받기)와 <b>글 복사</b>를 해서 대화에 같이 붙여 넣으면, 감우가 그림마다 어울리는 원전 인물을 한 번에 드려요. 받은 답은 「📋 묶음 결과 넣기」에.</p>
   <div class="awbpcs">${P.map(p=>`<label class="chip ${sel.has(p.id)?'on':''}"><input type="checkbox" data-bsel value="${esc(p.id)}" ${sel.has(p.id)?'checked':''} hidden>${esc(subName(p.id))}${subImg(p.id)?'':' · 그림 없음'}${subNote(p.id)?' ✎':''}</label>`).join('')}</div>
   <div class="awbprev" id="awBPrev"><div class="empty">그리는 중…</div></div>
   <textarea id="awBText" rows="9" readonly style="width:100%;font-family:var(--mono);font-size:12px;margin-top:8px"></textarea>
   <div class="mfoot"><span class="small dim" id="awBMsg"></span><span class="sp"></span><button class="btn" id="awBImgDl">⬇ 그림 받기</button><button class="btn" id="awBImgCp">🖼 그림 복사</button><button class="btn pri" id="awBTxtCp">📝 글 복사</button></div>`,'wide');
  let cur=null;const draw=async()=>{const L=P.filter(p=>sel.has(p.id));$('#awBText',md).value=L.length?bundleText(L):'';const pv=$('#awBPrev',md);if(!L.length){pv.innerHTML='<div class="empty">각성체를 하나 이상 골라 주세요</div>';cur=null;return}
   cur=await sheet(L);pv.innerHTML='';cur.cv.style.maxWidth='100%';cur.cv.style.maxHeight='46vh';pv.appendChild(cur.cv);
   $('#awBMsg',md).textContent=!cur.url?'그림 저장소가 교차 출처를 막아 한 장으로 못 묶었어요 — 그림은 따로 올려 주세요':cur.bad?`그림을 못 읽은 각성체 ${cur.bad}체`:`${L.length}체`};
  md.addEventListener('change',e=>{const c=e.target.closest('[data-bsel]');if(!c)return;c.checked?sel.add(c.value):sel.delete(c.value);c.parentElement.classList.toggle('on',c.checked);draw()});
  $('#awBTxtCp',md).onclick=async()=>{const t=$('#awBText',md).value;try{await navigator.clipboard.writeText(t);N().toast('글을 복사했어요')}catch(e){$('#awBText',md).select();document.execCommand('copy');N().toast('글을 복사했어요')}};
  $('#awBImgDl',md).onclick=()=>{if(!cur||!cur.url)return N().toast('묶은 그림이 없어요');const a=document.createElement('a');a.href=cur.url;a.download='각성체_묶음_'+new Date().toISOString().slice(0,10)+'.png';document.body.appendChild(a);a.click();a.remove()};
  $('#awBImgCp',md).onclick=async()=>{if(!cur||!cur.url)return N().toast('묶은 그림이 없어요');try{const b=await new Promise(r=>cur.cv.toBlob(r,'image/png'));await navigator.clipboard.write([new ClipboardItem({'image/png':b})]);N().toast('그림을 복사했어요 — 대화에 붙여 넣으세요')}catch(e){N().toast('이 브라우저는 그림 복사가 안 돼요 — 「그림 받기」로 받아 올려 주세요')}};
  draw()}

 /* ----- DB 직접 추가 · 고치기 (문서 awkdb, GM만) ----- */
 function editEntry(e){const isNew=!e||!e.own;const d=Object.assign({n:'',o:'',r:'',e:'',c:'설화',f:2,l:'',d:'',k:'',t:[],w:'',g:[]},e||{});const V=vocab();
  const md=N().openModal(`<div class="mhead"><h2>${e&&e.own?'후보 고치기':e&&e.n?'후보 고치기 (사본으로 저장)':'후보 직접 추가'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="mrow"><label class="lbl">이름<input id="aeN" value="${esc(d.n)}"></label><label class="lbl">원어 · 한자<input id="aeO" value="${esc(d.o)}"></label><label class="lbl">지역<input id="aeR" list="aeRL" value="${esc(d.r)}"><datalist id="aeRL">${regions().map(r=>`<option value="${esc(r)}">`).join('')}</datalist></label><label class="lbl">시대<input id="aeE" value="${esc(d.e)}"></label></div>
   <div class="mrow"><label class="lbl">분류<select id="aeC">${['역사','설화','신화','전설','문학','괴담','서사시','민요'].map(c=>`<option ${d.c===c?'selected':''}>${c}</option>`).join('')}</select></label><label class="lbl">지명도 (1 마이너 ~ 5 유명)<select id="aeF">${[1,2,3,4,5].map(v=>`<option ${+d.f===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="lbl">대가 성향<select id="aeW"><option value="">—</option>${COSTS.map(c=>`<option ${d.w===c?'selected':''}>${c}</option>`).join('')}</select></label><label class="lbl">Fate 서번트<select id="aeX"><option value="">아님</option><option value="1" ${d.x?'selected':''}>나왔음</option></select></label></div>
   <label class="lbl">누구인지<textarea id="aeL" rows="2">${esc(d.l)}</textarea></label>
   <label class="lbl">열화 · 마이너한 모습<textarea id="aeD" rows="2">${esc(d.d)}</textarea></label>
   <label class="lbl">은열쇠 (부르는 물건)<input id="aeK" value="${esc(d.k)}"></label>
   <div class="sec">타입 (최대 2)</div><div class="awtg">${TYPES.map(t=>`<label class="chip"><input type="checkbox" data-aet value="${t}" ${(d.t||[]).includes(t)?'checked':''} hidden>${t}</label>`).join('')}</div>
   <div class="sec">태그</div>${Object.entries(DB.groups||{}).map(([g,L])=>`<div class="awtg"><span>${esc(g)}</span>${L.map(t=>`<label class="chip"><input type="checkbox" data-aeg value="${esc(t)}" ${(d.g||[]).includes(t)?'checked':''} hidden>${esc(t)}</label>`).join('')}</div>`).join('')}
   <div class="mfoot">${e&&e.own?'<button class="btn ghost danger" id="aeDel">지우기</button>':''}<span class="sp"></span><button class="btn pri" id="aeOk">저장</button></div>`,'wide');
  const sync=()=>$$('label.chip',md).forEach(l=>{const i=l.querySelector('input');if(i)l.classList.toggle('on',i.checked)});sync();md.addEventListener('change',sync);
  $('#aeOk',md).onclick=async()=>{const n=$('#aeN',md).value.trim();if(!n)return N().toast('이름을 적어 주세요');const ty=$$('[data-aet]:checked',md).map(x=>x.value).slice(0,2);
   const o={n,o:$('#aeO',md).value.trim(),r:$('#aeR',md).value.trim()||'기타',e:$('#aeE',md).value.trim(),c:$('#aeC',md).value,f:+$('#aeF',md).value,l:$('#aeL',md).value.trim(),d:$('#aeD',md).value.trim(),k:$('#aeK',md).value.trim(),t:ty,w:$('#aeW',md).value,g:$$('[data-aeg]:checked',md).map(x=>x.value)};if($('#aeX',md).value)o.x=1;
   const nid=e&&e.id?e.id:N().uid('aw');await N().put('awkdb',nid,o,'gm');N().closeModal();N().toast(isNew&&!(e&&e.id)?'후보를 넣었어요':'저장했어요')};
  const dl=$('#aeDel',md);if(dl)dl.onclick=async()=>{if(!await N().confirmBox(`「${d.n}」 를 직접 추가 목록에서 지울까요?${(DB.base||[]).some(x=>x.id===e.id)?' (기본 목록 것은 원래대로 돌아가요)':''}`,'지우기'))return;await N().del('awkdb',e.id);N().closeModal()}}

 /* ----- 제작기 각성체로: 이 PC 의 제작기 트레이너에 포켓몬 시트(각성체)를 만든다 ----- */
 function newPoke(){return {name:'',gender:'-',pride:'',egg1:'-',egg2:'-',t1:'-',t2:'-',t3:'-',tera:'-',ability:'',item:'',dist:0,base:Array(6).fill(''),ev:Array(6).fill(''),pots:Array(20).fill(''),potEff:Array(20).fill(''),potKind:Array(20).fill(''),excl:{name:'',eff:''},exclX:[],moves:[],sockMax:'',memo:'',image:'',stands:[],standActive:0,partner:false,awaken:'',auto:{},forms:[],fields:[]}}
 async function toMaker(id){const r=rec(id);const e=r.pick&&byId(r.pick);if(!e)return;const DBS=N().DBS();if(!DBS.makerPut||!DBS.makerGet)return N().toast('이 화면에서는 제작기에 쓸 수 없어요');
  await MK().load(true);const pc=sidPc(id);const t=MK().trainer(pc);if(!t)return N().toast('이 PC 는 제작기 트레이너가 없어요 — 시트 탭에서 「⇪ 제작기로」를 먼저');
  const x=slot(id);const m=x.pid&&MK().M.pokemon.find(q=>q.id===x.pid);
  if(m){/* 그 칸의 각성체 시트가 이미 있다 → 메모에 원전을 넣는다 (이름은 고를 때만) */
   const md=N().openModal(`<div class="mhead"><h2>⇪ 제작기 각성체 시트에 넣기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
    <p class="small" style="margin-top:0">제작기 <b>「${esc(t.name)}」</b>의 각성체 <b>「${esc(m.name||'?')}」</b> 시트 메모 맨 위에 원전을 넣어요. 전에 넣은 원전 줄은 바꿔요.</p>
    <div class="tomk"><div><b>원전</b><span>${esc(e.n)}</span></div><div><b>타입</b><span>${(e.t||[]).map(tchip).join(' ')||'—'} <small class="dim">(참고 — 시트 타입은 그대로)</small></span></div><div><b>메모</b><span class="pre small">${esc(memoOf(e))}</span></div></div>
    <label class="small" style="display:block;margin-top:10px"><input type="checkbox" id="awRen"> 시트 이름도 「${esc(e.n)}」로 바꾸기</label>
    <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awMk">넣기</button></div>`);
   $('#awMk',md).onclick=async()=>{const b=$('#awMk',md);b.disabled=true;b.textContent='넣는 중…';
    try{const ren=$('#awRen',md).checked;await MK().edit('pokemon',m.id,d=>{const rest=String(d.memo||'').replace(/【각성체 원전】[\s\S]*?(\n\n|$)/,'').trim();d.memo=memoOf(e)+(rest?'\n\n'+rest:'');if(ren)d.name=e.n});
     await save(id,y=>{y.made={pid:m.id,id:e.id,at:new Date().toISOString()}});N().closeModal();N().toast('제작기 각성체 시트에 넣었어요')}
    catch(err){b.disabled=false;b.textContent='다시 시도';N().toast('넣지 못했어요: '+(err.message||err))}};return}
  const aw=mkAw(pc);const hasFree=aw.some(q=>q.awaken==='free');
  if(aw.length>=2)return N().toast('이 트레이너는 각성체가 이미 2체예요');
  const md=N().openModal(`<div class="mhead"><h2>⇪ 제작기 각성체로</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">제작기의 <b>「${esc(t.name)}」</b> 트레이너에 각성체로 표시한 포켓몬 시트가 ${aw.length?'이 칸엔 ':''}없어서 하나 만들어요. 이름 · 타입 · 메모(원전 · 열화 · 은열쇠)${x.own?' · 그림':''}만 채우고, 종족치 · 포텐셜은 제작기에서 짜 주세요.${t.misag?'':' <b style="color:var(--red)">이 트레이너는 포인트 칸이 「미사그 대학 (4+2)」가 아니라서 각성체 칸이 제작기에서 안 보일 수 있어요.</b>'}</p>
   <div class="tomk"><div><b>이름</b><span>${esc(e.n)}</span></div><div><b>타입</b><span>${(e.t||[]).map(tchip).join(' ')||'—'}</span></div><div><b>메모</b><span class="pre small">${esc(memoOf(e))}</span></div></div>
   <div class="mrow" style="margin-top:10px"><label class="lbl">각성체<select id="awKind"><option value="free" ${hasFree?'':'selected'} ${hasFree?'disabled':''}>각성 (대가) · 프라이드로 대가${hasFree?' — 이미 있음':''}</option><option value="c" ${hasFree?'selected':''}>각성 (보조) · C 권장 · 대가 없음</option></select></label></div>
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awMk">만들기</button></div>`);
  $('#awMk',md).onclick=async()=>{const b=$('#awMk',md);b.disabled=true;b.textContent='만드는 중…';
   try{const cur=await DBS.makerGet('trainers',pc);if(!cur)throw new Error('제작기 트레이너 문서를 찾지 못했어요');const pid=Math.random().toString(36).slice(2,10);
    const p=Object.assign(newPoke(),{id:pid,name:e.n,t1:(e.t||[])[0]||'-',t2:(e.t||[])[1]||'-',memo:memoOf(e),image:x.own?x.img:'',awaken:$('#awKind',md).value});
    await DBS.makerPut('pokemon',pid,{tid:pc,data:p});
    if(MK().edit)await MK().edit('trainers',pc,d=>{d.pids=(d.pids||[]).concat(pid)});else{const doc=JSON.parse(JSON.stringify(cur.data||{}));const d=doc.data||doc;d.pids=(d.pids||[]).concat(pid);await DBS.makerPut('trainers',pc,doc)}
    await save(id,y=>{y.made={pid,id:e.id,at:new Date().toISOString()}});await MK().load(true);N().closeModal();N().toast('제작기에 각성체 시트를 만들었어요')}
   catch(err){b.disabled=false;b.textContent='다시 시도';N().toast('만들지 못했어요: '+(err.message||err))}}}
 const memoOf=e=>[`【각성체 원전】 ${e.n}${e.o?' ('+e.o+')':''} · ${[e.r,e.e,e.c].filter(Boolean).join(' · ')}`,e.l?'누구: '+e.l:'',e.d?'열화: '+e.d:'',e.k?'은열쇠: '+e.k:'',e.w?'대가 성향: '+e.w:''].filter(Boolean).join('\n');

 /* ----- 「각성체」 화면 (모두): PL = 제 PC 의 각성체 그림 · 코멘트, GM = 전원 + 묶음 ----- */
 function slotHtml(x,G){const r=G?rec(x.sid):{};const pk=r.pick&&DB.base&&byId(r.pick);
  return `<div class="aweslot"><div class="awepor" style="${x.img?`background-image:url('${cssu(x.img)}')`:''}">${x.img?'':'그림 없음'}</div><div class="awes"><b>각성체 ${x.n}</b>${x.mname?`<small>제작기 「${esc(x.mname)}」${x.own?' · 올린 그림':''}</small>`:x.own?'<small>올린 그림</small>':''}
   <div class="pre small awenote">${x.note?esc(x.note):'<span class="dim">코멘트 없음</span>'}</div>
   ${G?`<div class="small dim">${pk?'✓ 원전 · '+esc(pk.n):(r.cands||[]).length?'후보 '+r.cands.length+'명':r.read?'추천 받음':'아직'}</div><button class="btn xs" data-aw="godb" data-v="${esc(x.sid)}">추천 보기 →</button>`:''}</div></div>`}
 function sendCard(pc,big){const G=N().gm();const S=[1,2].map(n=>slot(sidOf(pc,n)));
  return `<div class="awe card ${big?'big':''}"><div class="awebody"><h3>${esc(pcName(pc))}</h3><div class="aweslots">${S.map(x=>slotHtml(x,G)).join('')}</div>
   ${canSend(pc)?`<div class="row"><button class="btn sm pri" data-aw="sendedit" data-v="${esc(pc)}">✎ 각성체 그림 · 코멘트</button></div>`:''}</div></div>`}
 function entry(el){const G=N().gm(),M=N().me();const L=pcs();
  const head=`<div class="toolbar"><h2>각성체</h2><span class="note">${G?'각성체 그림(제작기 각성체 포켓몬 그림 · 또는 올린 그림)과 코멘트를 모아 감우에게 보내요 — 그림에 어울리는 원전 인물을 찾아 드려요':'내 각성체 그림과 바라는 점을 넣어 두세요 — 그 모습에 어울리는 역사 · 설화 속 원전 인물을 골라 드려요'}</span><span class="sp"></span>${G?`<button class="btn sm pri" data-aw="bundle">📦 감우에게 보낼 묶음</button><button class="btn sm" data-aw="pasteall">📋 묶음 결과 넣기</button>`:''}</div>`;
  let body;if(G)body=L.length?`<div class="awegrid">${L.map(p=>sendCard(p.id)).join('')}</div>`:'<div class="empty">PC 시트가 없어요.</div>';
  else if(M&&N().data('pc',M))body=`<div class="awegrid one">${sendCard(M,true)}</div>`;
  else body='<div class="empty">PL 좌석으로 들어오면 내 PC 의 각성체 그림 · 코멘트를 넣을 수 있어요.</div>';
  el.innerHTML=head+body;el.addEventListener('click',onClick);if(G&&!DB.base)load();if(MK()&&!MK().M.at)MK().load().then(()=>N().render())}
 /* 학생증 옆 카드 (pc_ui idHero 가 부른다) */
 function idCard(pc){if(!canSend(pc))return '';const S=[1,2].map(n=>slot(sidOf(pc,n)));const any=S.some(x=>x.img||x.note);
  return `<div class="awid"><b>✦ 각성체</b><span class="awidt">${S.filter(x=>x.img).map(x=>`<i style="background-image:url('${cssu(x.img)}')" title="각성체 ${x.n}"></i>`).join('')}<small>${any?S.filter(x=>x.note).map(x=>esc(x.note.slice(0,40))).join(' · ')||'그림 있음':'각성체 그림과 바라는 점을 넣으면 어울리는 원전 인물을 골라 드려요'}</small></span><button type="button" class="btn xs" onclick="NT_AWK.sendBox('${esc(pc)}')">${any?'고치기':'넣기'}</button></div>`}
 function sendBox(id){const pc=sidPc(id);if(!canSend(pc))return;const S=[1,2].map(n=>slot(sidOf(pc,n)));const own=S.map(x=>x.own?slotRaw(pc,x.n).img:'');
  const md=N().openModal(`<div class="mhead"><h2>✦ 각성체 · ${esc(pcName(pc))}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">각성체는 은열쇠로 부르는 간이 영령 — 역사 · 설화 속 인물이 마이너하거나 열화된 모습으로 와요. 각성체 그림을 넣으면 그 모습에 어울리는 원전 인물을 골라 드려요. 제작기에서 각성체로 표시한 포켓몬 그림이 있으면 그걸 써요(여기 올린 그림이 먼저).</p>
   ${S.map((x,i)=>`<div class="awsend awslot"><div class="awsimg ${x.img?'on':''}" data-si="${i}" style="${x.img?`background-image:url('${cssu(x.img)}')`:''}">${x.img?'':'각성체 '+x.n+' 그림<br><small>끌어다 놓기 · 누르기</small>'}</div>
    <label class="lbl awsnote">각성체 ${x.n}${x.mname?` <small class="dim">제작기 「${esc(x.mname)}」</small>`:''}<textarea data-sn="${i}" rows="4" placeholder="예: 그림의 소품(거울 · 부채)이나 분위기 설명, 바라는 지역 · 시대, 피하고 싶은 인물">${esc(x.note)}</textarea>${own[i]?`<button type="button" class="linkbtn small" data-sx="${i}">올린 그림 빼기</button>`:''}</label></div>`).join('')}
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awSOk">저장</button></div>`,'wide');
  $$('[data-si]',md).forEach(bx=>{const i=+bx.dataset.si;N().bindDrop(bx,async fs=>{try{own[i]=await N().upload(fs[0],'photo','awk');bx.style.backgroundImage=`url('${cssu(own[i])}')`;bx.classList.add('on');bx.innerHTML=''}catch(e){N().toast('올리기 실패: '+(e.message||e))}})});
  $$('[data-sx]',md).forEach(b=>b.onclick=()=>{const i=+b.dataset.sx;own[i]='';const bx=$(`[data-si="${i}"]`,md);const m=mkAw(pc)[i];const mi=m?MK().img(m):'';bx.style.backgroundImage=mi?`url('${cssu(mi)}')`:'';if(!mi){bx.classList.remove('on');bx.innerHTML='각성체 '+(i+1)+' 그림'}b.remove()});
  $('#awSOk',md).onclick=async()=>{const cur=Object.assign({},pcp(pc));cur.awk=[0,1].map(i=>({img:own[i]||'',note:$(`[data-sn="${i}"]`,md).value.trim()}));delete cur.awk_img;delete cur.awk_note;await N().put('pcp',pc,cur,'pl:'+pc);N().closeModal();N().toast('저장했어요')}}

 N().MOD.awk={render:entry};
 N().MOD.awdb={render};
 return {load,all,byId,applyRead,vocab,idCard,sendBox};
})();
