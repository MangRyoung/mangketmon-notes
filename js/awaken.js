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
     코멘트 = pcp.awk[n-1].note (PL 이 쓸 수 있는 문서).
   10-29 망령 「프라이드 C · B · A 는 파워 차이만큼 격 차이」「대가도 목록 안에서 추천」「후보 3~5개」「확정 버튼으로 보내기 목록에서 빼고 테두리」:
     격 = 각성체 프라이드(제작기 포켓몬 pride, 없으면 칸에서 고름) → GRADE. 추천 picks[].cost = 룰북 「각성체와 대가」 표의 분류 · 항목.
     확정 = pcp.awk[n-1].fixed {id,n,at} (PL 도 보인다) — 묶음에서 빠지고 칸 테두리가 바뀐다. 추천 기록 = awk/<sid> (GM). 「⇪ 제작기 각성체로」 = 그 칸의 제작기 각성체 시트 메모에 원전을 넣는다(없으면 새로 만든다).
   10-30 망령 「DB 후보 말고 새 후보로 찾게. DB는 한계가 있으니까」: 묶음 글이 DB 밖 새 후보(extra) 3~5명을 중심으로, DB 후보(picks)는 0~2명만 달라고 한다. extra 는 6명까지 받는다.
   10-30 망령 「겉모습은 저 창에서 안 내도」「코멘트는 따로 말고 1 · 2 칸 아무 데나 누르면 각성체 고치기 창」: 트레이너 포트 줄에서 겉모습 글을 뺐다. 각성체 칸(.aweslot data-sedit)을 누르면 sendBox — 그림 · 버튼 · 메인/프라이드 줄은 제 일을 한다. 코멘트는 있을 때만 보인다.
   10-30 망령 「설명이 길어져도 칸 차이가 안 나게」: 각성체 칸 코멘트는 두 줄까지만(넘치면 … , 전문은 마우스를 올리거나 칸을 눌러 고치기 창에서). 코멘트가 없어도 두 줄 자리를 잡는다.
   10-30 망령 「묶음과 결과 넣기를 따로 할 필요가?」「코멘트도 눌러서 고치게」「고치기 창에서 프라이드 · 대가(종류까지) 지정 → 배역 뽑는 데 참고」「학생증의 각성체 줄은 파티 서머리 각성체 아랫줄로」:
     묶음 창 아래에 「📋 감우 결과 넣기」. 각성체 탭 코멘트를 누르면 그 칸 코멘트 창. 고치기 창(sendBox) = 칸마다 메인 (대가) · 프라이드 · 대가 분류(pcp.awk[n-1].cost).
     대가 분류는 묶음 글 · 그림 읽기(gradeLine)에 「GM 이 정한 대가」로 들어간다. idCard 는 pc_ui 파티 서머리 각성체 카드 아래에서 부른다.
   10-30 망령 「각성체 쪽에 트레이너도 포트 · 확정 안 했으면 감우에게 무진 그림체 포트(배경 포함 정사각) · 스탠딩(배경 제거 허리 위) 각 5장, 07_이미지\미사그\<이름> 에」「nai_token main/sub · 장 수 설정」:
     트레이너 포트 확정 = pcp/<pc>.tport {fixed,at}. 생성 설정 = 문서 awkcfg/nai {key:'main'|'sub',port,stand} (GM).
     묶음에 확정 안 한 트레이너 · 겉모습 · 설정이 같이 들어가고, 감우가 PC 의 07_이미지\미사그\_nai\뽑기.bat 로 뽑는다 (image.novelai.net 은 PC 에서만).
   10-30 망령 「각성체도 스탠딩 뽑을 일이 많을 것 · 원전 추천과 이미지 생성 요청을 따로 · 확정 안 된 각성체도 기본 대상 · 목록에 그림을 작게」:
     「📦 원전 추천 묶음」(bundle) 과 「🎨 그림 뽑기 묶음」(imgBundle) 을 나눴다. 그림 뽑기 대상 = 트레이너 포트 확정 안 한 PC + 원전 확정 안 한 각성체(그림이나 코멘트가 있는 칸).
     저장 = 07_이미지\미사그\<트레이너>\(포트 · 스탠딩) · <트레이너>\각성체 n\(포트 · 스탠딩). NAI 「배경 지우기」(augment bg-removal)는 Anlas 를 써서 쓰지 않는다 — 스탠딩은 뽑을 때 V5 투명 배경 설정(10-30 Anlas 소모 일). */
"use strict";
window.NT_AWK=(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const MK=()=>window.NT_MAKER;
 const U={mode:'pc',sel:'',q:'',fame:0,fate:false,taken:true,recOnly:(()=>{try{return localStorage.getItem('nt_aw_reconly')==='1'}catch(e){return false}})(),hideDone:(()=>{try{return localStorage.getItem('nt_aw_hidedone')==='1'}catch(e){return false}})(),reg:new Set(),cat:'',type:'',cost:'',more:0,busy:false,dbq:'',dbreg:'',open:''};
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
 function slot(sid){const pc=sidPc(sid),n=sidN(sid);const s=slotRaw(pc,n);const m=mkAw(pc)[n-1];const mi=m?(MK().img(m)||''):'';return {sid,pc,n,img:s.img||mi,own:!!s.img,note:s.note||'',pid:m?m.id:'',mname:m?(m.name||''):'',kind:m?m.awaken:(s.main?'free':(()=>{const o=n===1?2:1,om=mkAw(pc)[o-1];return (om?om.awaken==='free':!!slotRaw(pc,o).main)?'c':''})()),pride:(m&&m.pride)||s.pride||'',cost:s.cost||'',fixed:s.fixed||null}}
 const hasSlot=sid=>{const x=slot(sid);return !!(x.img||x.note||x.pid)};
 const subs=()=>pcs().flatMap(p=>[sidOf(p.id,1)].concat(hasSlot(sidOf(p.id,2))?[sidOf(p.id,2)]:[])).map(id=>({id}));
 const subImg=sid=>slot(sid).img;
 const subNote=sid=>slot(sid).note;
 const subName=sid=>{const x=slot(sid);return `${pcName(x.pc)} · 각성체 ${x.n}${x.mname?' ('+x.mname+')':''}`};
 const canSend=id=>N().gm()||N().me()===sidPc(id);
 /* 프라이드 → 격 (룰북 미사그 「각성체와 대가」: C · C+ 대가 없음, B · B+ 는 B, A 는 A — 파워 차이만큼 원전의 격도 다르다) */
 const gradeOf=pr=>{const v=String(pr||'').toUpperCase();return /^EX/.test(v)?'EX':/^A/.test(v)?'A':/^B/.test(v)?'B':/^C/.test(v)?'C':''};
 const GRADE={C:{f:[1,2],max:3,t:'격 낮음 — 이름만 남은 사람 · 민담의 조연 · 한 마을의 이야기 (지명도 1~2)',cost:'대가 없음'},
  B:{f:[2,3],max:3,t:'격 중간 — 한 고장 전설 · 야사의 주인공, 이름난 장인 · 무인 (지명도 2~3)',cost:'대가 B — 분류 하나 (지시 『6령』 2개 빼기 · 육성 분배레벨 −10 · 통솔 B-1 또는 B-2 · 능력 『전용 포텐셜』 −1)'},
  A:{f:[3,4],max:4,t:'격 높음 — 한 나라에 알려진 인물 · 신화의 조연급, 유명 인물이라면 열화된 한 시절 (지명도 3~4)',cost:'대가 A — B 에 더해 (지시 『4식』 1개 더 · 육성 −10 더 · 통솔 B 1택 + A-1 또는 A-2 · 능력 고유 포텐셜 점수 −0.5)'},
  EX:{f:[1,5],max:5,t:'EX — 격은 GM 이 정함',cost:'대가는 GM 이 원하는 대로 조합'}};
 const COSTLIST='대가 목록 (룰북 「각성체와 대가」): 지시 B 『6령』 2개 빼기 / A 『4식』 1개 더 · 육성 B 분배레벨 −10 / A −10 더 · 통솔 B-1 PT 에 특정 타입 2체 이상 (미사그 1인 2체: 각성체 2체 모두 지정 타입) · B-2 『역할』 1개 무효 / A-1 필드 위 다른 아군에 지정 타입이 없으면 자기 포텐셜 무효 · A-2 필드 위 아군 한 체의 『역할』 무효 · 능력 B 『전용 포텐셜』 −1 / A 고유 포텐셜 점수 −0.5. 미사그는 1인 2체 — 각성체는 처음부터 「1인 기준 (2체)」 값 안에서 짠다 (파트너 없음 · 통솔점 검사 없음).';
 const slotGrade=sid=>{const x=slot(sid);return x.kind==='c'?'C':gradeOf(x.pride)};
 const gradeLine=sid=>{const x=slot(sid);const g=slotGrade(sid);const G=GRADE[g];return `${x.kind==='c'?'각성 (보조) · ':x.kind==='free'?'각성 (대가) · ':''}프라이드 ${x.pride||'모름'}${G?' → '+G.t+' · '+(x.kind==='c'?'대가 없음 (보조)':G.cost):''}${x.kind!=='c'&&x.cost?` · GM 이 정한 대가 분류: ${x.cost} (이 대가가 어울리는 인물로)`:''}`};
 /* 10-30: 고치기 창에서 고르는 대가 분류 (룰북 「각성체와 대가」 표) */
 const CPICK=['지시','육성','통솔 · B-1','통솔 · B-2','통솔 · A-1','통솔 · A-2','능력'];
 const COSTT={'지시':'『6령』 2개 빼기 (A 면 『4식』 1개 더)','육성':'분배레벨 −10 (A 면 −10 더)','통솔 · B-1':'PT 에 특정 타입 2체 이상 — 미사그 1인 2체에선 각성체 2체 모두 지정 타입','통솔 · B-2':'『역할』 1개 무효','통솔 · A-1':'필드 위 다른 아군에 지정 타입이 없으면 자기 포텐셜 무효 (B 1택 더)','통솔 · A-2':'필드 위 아군 한 체의 『역할』 무효 (B 1택 더)','능력':'『전용 포텐셜』 −1 (A 면 고유 포텐셜 점수 −0.5)'};
 /* 트레이너 포트 · NAI 설정 */
 const tport=pc=>pcp(pc).tport||null;
 const naiCfg=()=>Object.assign({key:'main',port:5,stand:5},N().data('awkcfg','nai')||{},{bg:false});   /* 10-30 망령: NAI 「배경 지우기」(Anlas)는 쓰지 않는다 — 스탠딩은 뽑을 때 V5 투명 배경 설정으로 */
 const tBio=(pc,k)=>{const t=MK()&&MK().trainer(pc);const L=(t&&t.bio)||[];const x=L.find(y=>y&&y.k===k);return x?String(x.v||'').trim():''};
 const pcName=id=>{const p=N().data('pc',id)||{};const t=MK()&&MK().trainer(id);return p.name||(t&&t.name)||id};

 /* ----- 점수: 고른 태그 · 포트 읽기의 추천 ----- */
 function scoreOf(e,tags,picks,band){let s=0;const hit=[];for(const t of tags){if((e.g||[]).includes(t)){s+=GW[tagGroup(t)]||1;hit.push(t)}}
  const pk=picks&&picks.find(x=>x.id===e.id);if(pk)s+=4;
  const f=e.f||2;if(band)s+=f>=band[0]&&f<=band[1]?.8:-.4*Math.min(f<band[0]?band[0]-f:f-band[1],3);   /* 프라이드 격에 맞는 지명도를 앞으로 */
  else s+=(3-Math.min(3,Math.abs(f-2)))*.15;   /* 격을 모르면 지명도 2 근처 (마이너 · 열화판이 기본) */
  return {s,hit,why:pk?pk.why:'',cost:pk?pk.cost||'':''}}
 function filtered(id){const r=rec(id);const tags=r.tags||[];const picks=(r.read&&r.read.picks)||[];const tk=takenMap(id);const G=GRADE[slotGrade(id)];const fame=U.fame||(G?G.max:3);
  return all().filter(e=>{if(U.recOnly&&!picks.some(x=>x.id===e.id))return false;if(fame<5&&(e.f||2)>fame&&!picks.some(x=>x.id===e.id))return false;if(!U.fate&&e.x)return false;if(U.taken&&tk[e.id])return false;
   if(U.reg.size&&!U.reg.has(e.r))return false;if(U.cat&&e.c!==U.cat)return false;if(U.type&&!(e.t||[]).includes(U.type))return false;if(U.cost&&e.w!==U.cost)return false;
   if(U.q){const q=U.q.toLowerCase();if(![e.n,e.o,e.l,e.d,e.k,e.r,e.e].join(' ').toLowerCase().includes(q))return false}return true})
   .map(e=>Object.assign({e},scoreOf(e,tags,picks,G&&G.f))).sort((a,b)=>b.s-a.s||String(a.e.n).localeCompare(String(b.e.n),'ko'))}

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
      <div class="awgrade small">✦ ${esc(gradeLine(id))}</div>
      <div class="awsend"><div class="awsnote"><small class="dim">코멘트</small><div class="pre small">${esc(subNote(id))||'<span class="dim">— 아직 없어요</span>'}</div></div><button type="button" class="linkbtn small" data-aw="sendedit" data-v="${esc(sidPc(id))}">그림 · 코멘트 고치기</button></div>
    ${rd?`<div class="awread"><b>${rd.by==='fn'?'포트 읽기':'감우 결과'}</b> <small class="dim">${esc(String(rd.at||'').slice(0,16).replace('T',' '))}</small><div class="pre">${esc(rd.sum||'')}</div>${(rd.extra||[]).length?`<div class="small dim" style="margin-top:4px">DB 밖 후보 ${rd.extra.length}명은 아래 목록 맨 앞에 「DB 밖」으로 떠요 · 마음에 들면 「DB 에 넣기」</div>`:''}</div>`:`<p class="small dim" style="margin:6px 0 0">각성체 그림을 읽으면 외형 · 분위기 태그가 채워지고 어울리는 원전 인물이 앞으로 와요. 태그를 직접 골라도 돼요.</p>`}
    </div></div>
   ${tagPicker(tags)}
   ${filterBar()}
   ${(r.cands||[]).length||r.pick?pickedBox(id,r):''}
   <div class="awres">${extraCards(id,rd)}${res.slice(0,N0).map(x=>card(id,x,r)).join('')||(U.recOnly?(extraCards(id,rd)?'':'<div class="empty">아직 감우 추천이 없어요. 「📦 원전 추천 묶음」으로 받아 오거나 「감우 추천만 보기」를 꺼 주세요.</div>'):'<div class="empty">조건에 맞는 후보가 없어요. 지명도 · 지역 조건을 넓혀 보세요.</div>')}</div>
   ${res.length>N0?`<div class="row" style="justify-content:center;margin-top:10px"><button class="btn sm ghost" data-aw="more">더 보기 (${res.length-N0}명 더)</button></div>`:''}
  </div>`}
 function tagPicker(sel){const G=DB.groups||{};return `<div class="awtags card"><div class="row"><b>태그</b><small class="dim">외형 · 분위기 · 소품 — 고른 태그가 많이 겹칠수록 위로</small><span class="sp"></span>${sel.length?`<button class="linkbtn small" data-aw="tagclr">비우기</button>`:''}</div>
   ${Object.entries(G).filter(([g])=>g!=='풍').map(([g,L])=>`<div class="awtg"><span>${esc(g)}</span>${L.map(t=>`<button type="button" class="chip ${sel.includes(t)?'on':''}" data-aw="tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>`).join('')}
   <div class="awtg"><span>풍</span>${(G['풍']||[]).map(t=>`<button type="button" class="chip ${sel.includes(t)?'on':''}" data-aw="tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>`}
 function filterBar(){const R=regions();const cats=[...new Set(all().map(e=>e.c))];
  return `<div class="awfil row">
   <label class="small">지명도 ≤ <select data-aw="fame"><option value="0" ${!U.fame?'selected':''}>프라이드 격에 맞춤</option>${[1,2,3,4,5].map(v=>`<option value="${v}" ${U.fame===v?'selected':''}>${v}${v===5?' (전부)':''}</option>`).join('')}</select></label>
   <select data-aw="cat"><option value="">분류 전부</option>${cats.map(c=>`<option ${U.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
   <select data-aw="type"><option value="">타입 전부</option>${TYPES.map(c=>`<option ${U.type===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
   <select data-aw="cost"><option value="">대가 성향 전부</option>${COSTS.map(c=>`<option ${U.cost===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
   <label class="small" title="감우 결과 · 포트 읽기가 고른 후보(새 후보 · DB 추천)만 보이고, 나머지 DB 목록은 숨겨요"><input type="checkbox" data-aw="recOnly" ${U.recOnly?'checked':''}> 감우 추천만 보기 (DB 목록 숨기기)</label>
   <label class="small"><input type="checkbox" data-aw="fate" ${U.fate?'checked':''}> Fate 서번트로 나온 인물도</label>
   <label class="small"><input type="checkbox" data-aw="taken" ${U.taken?'checked':''}> 다른 PC 가 고른 후보 숨기기</label>
   <input type="search" data-aw="q" id="awQ" data-live placeholder="이름 · 은열쇠 · 설명 찾기" value="${esc(U.q)}" style="flex:1;min-width:140px">
   <div class="awreg">${R.map(g=>`<button type="button" class="chip xs ${U.reg.has(g)?'on':''}" data-aw="reg" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div></div>`}
 function pickedBox(id,r){const pk=r.pick&&byId(r.pick);const C=(r.cands||[]).map(byId).filter(Boolean);const fx=slot(id).fixed;const pc=pk&&((r.read&&r.read.picks)||[]).find(q=>q.id===pk.id);
  return `<div class="awpick card ${fx?'fixed':''}"><div class="row"><b>고른 후보</b>${fx?`<span class="awfix">✦ 확정 · ${esc(fx.n)}</span>`:''}<span class="sp"></span>${pk?`<button class="btn sm ${fx?'':'pri'}" data-aw="fix" data-v="${esc(id)}" title="확정하면 「보낼 묶음」에서 빠지고 칸 테두리가 바뀌어요 (플레이어에게도 보여요)">${fx?'확정 풀기':'✦ 확정'}</button>`:''}${pk?`<button class="btn sm pri" data-aw="tomk" title="이 칸의 제작기 각성체 시트 메모에 원전을 넣어요 (시트가 없으면 새로 만들어요)">⇪ 제작기 각성체로</button>`:''}</div>
   ${pk?`<div class="awpk"><b>✓ ${esc(pk.n)}</b> <small class="dim">${esc(pk.o||'')}</small> ${(pk.t||[]).map(tchip).join('')} <small>은열쇠 · ${esc(pk.k||'—')}</small>${pc&&pc.cost?` <small class="awcostrec">대가 추천 · ${esc(pc.cost)}</small>`:''}${r.made?` <span class="visb">제작기에 만듦 ${esc(String(r.made.at||'').slice(5,10))}</span>`:''}</div>`:'<div class="small dim">「✓ 이걸로」를 누르면 여기에 정해져요.</div>'}
   ${C.length?`<div class="awcands">${C.map(e=>`<span class="chip static ${pk&&pk.id===e.id?'on':''}">${esc(e.n)} <button type="button" class="linkbtn" data-aw="pickset" data-v="${esc(e.id)}" title="이걸로">✓</button><button type="button" class="linkbtn" data-aw="cand" data-v="${esc(e.id)}" title="후보에서 빼기">✕</button></span>`).join('')}</div>`:''}</div>`}
 function card(id,x,r){const e=x.e;const on=(r.cands||[]).includes(e.id),pk=r.pick===e.id;const open=U.open===e.id;
  return `<div class="awc card ${pk?'pk':on?'on':''}" data-id="${esc(e.id)}">
   <div class="awch"><b>${esc(e.n)}</b>${e.o?`<small class="dim">${esc(e.o)}</small>`:''}<span class="sp"></span><span class="awsc" title="맞은 태그 점수">${x.s?x.s.toFixed(1):'-'}</span></div>
   <div class="awmeta"><span>${esc(e.r||'')}${e.e?' · '+esc(e.e):''}</span><span>${esc(e.c||'')}</span><span class="awfm" title="지명도 ${e.f}/5">${stars(e.f)}</span>${e.x?'<span class="awx" title="Fate 에 서번트로 나온 인물이에요 — 열화판으로만">Fate</span>':''}${e.own?'<span class="awx own">직접 추가</span>':''}</div>
   <p class="awl">${esc(e.l||'')}</p>
   ${x.why?`<p class="awwhy">🔍 ${esc(x.why)}</p>`:''}
   <div class="awkv"><span>열화</span><p>${esc(e.d||'')}</p><span>은열쇠</span><p>${esc(e.k||'')}</p>${x.cost?`<span>대가 추천</span><p class="awcostrec">${esc(x.cost)}</p>`:''}</div>
   <div class="awft">${(e.t||[]).map(tchip).join('')}<small class="awcost">대가 · ${esc(e.w||'—')}</small><span class="sp"></span>${x.hit.length?`<small class="awhit">${x.hit.map(esc).join(' · ')}</small>`:''}</div>
   ${open?`<div class="awtags2">${(e.g||[]).map(t=>`<span class="chip xs static">${esc(t)}</span>`).join('')}</div>`:''}
   <div class="row awbtn"><button type="button" class="linkbtn small" data-aw="open" data-v="${esc(e.id)}">${open?'접기':'태그'}</button><span class="sp"></span><button type="button" class="btn xs ${on?'':'ghost'}" data-aw="cand" data-v="${esc(e.id)}">${on?'★ 후보':'☆ 후보'}</button><button type="button" class="btn xs ${pk?'pri':''}" data-aw="pickset" data-v="${esc(e.id)}">${pk?'✓ 정함':'✓ 이걸로'}</button></div></div>`}
 /* 포트 읽기가 DB 밖에서 찾아온 후보 — 맨 앞에 */
 function extraCards(id,rd){const X=(rd&&rd.extra)||[];if(!X.length)return '';const have=new Set(all().map(e=>e.n));
  return X.map((e,i)=>{const inDb=have.has(e.n);return `<div class="awc card extra"><div class="awch"><b>${esc(e.n)}</b>${e.o?`<small class="dim">${esc(e.o)}</small>`:''}<span class="sp"></span><span class="awx">DB 밖</span></div>
   <div class="awmeta"><span>${esc(e.r||'')}${e.e?' · '+esc(e.e):''}</span><span>${esc(e.c||'')}</span><span class="awfm">${stars(e.f||2)}</span></div><p class="awl">${esc(e.l||'')}</p>${e.why?`<p class="awwhy">🔍 ${esc(e.why)}</p>`:''}
   <div class="awkv"><span>열화</span><p>${esc(e.d||'')}</p><span>은열쇠</span><p>${esc(e.k||'')}</p>${e.cost?`<span>대가 추천</span><p class="awcostrec">${esc(e.cost)}</p>`:''}</div><div class="awft">${(e.t||[]).filter(t=>T2C[t]).map(tchip).join('')}<small class="awcost">대가 · ${esc(e.w||'—')}</small></div>
   <div class="row awbtn"><small class="dim">사실 확인이 필요할 수 있어요</small><span class="sp"></span>${inDb?'<small class="dim">DB 에 있음</small>':`<button type="button" class="btn xs" data-aw="xadd" data-v="${i}">＋ DB 에 넣기</button>`}</div></div>`}).join('')}

 /* ----- 후보 DB 보기 ----- */
 function dbView(){const q=U.dbq.toLowerCase();const L=all().filter(e=>(!U.dbreg||e.r===U.dbreg)&&(!q||[e.n,e.o,e.l,e.d,e.k,(e.g||[]).join(' ')].join(' ').toLowerCase().includes(q)));
  const R=regions();const cnt=r=>all().filter(e=>e.r===r).length;
  return `<div class="awdb"><div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><input type="search" data-aw="dbq" id="awDbQ" data-live placeholder="이름 · 태그 · 설명 찾기" value="${esc(U.dbq)}" style="flex:1;min-width:160px"><button class="btn sm pri" data-aw="dbadd">＋ 직접 추가</button></div>
   <div class="awreg" style="margin-bottom:8px"><button type="button" class="chip xs ${!U.dbreg?'on':''}" data-aw="dbreg" data-v="">전부 ${all().length}</button>${R.map(r=>`<button type="button" class="chip xs ${U.dbreg===r?'on':''}" data-aw="dbreg" data-v="${esc(r)}">${esc(r)} ${cnt(r)}</button>`).join('')}</div>
   <div class="tblwrap"><table class="awtbl"><thead><tr><th>이름</th><th>지역 · 시대</th><th>분류</th><th>지명도</th><th>타입</th><th>대가</th><th>은열쇠</th><th></th></tr></thead><tbody>${L.map(e=>`<tr><td><b>${esc(e.n)}</b>${e.x?' <span class="awx">Fate</span>':''}${e.own?' <span class="awx own">직접</span>':''}<div class="small dim">${esc(e.l||'')}</div></td><td>${esc(e.r||'')}<div class="small dim">${esc(e.e||'')}</div></td><td>${esc(e.c||'')}</td><td class="awfm">${stars(e.f)}</td><td>${(e.t||[]).map(tchip).join(' ')}</td><td>${esc(e.w||'')}</td><td class="small">${esc(e.k||'')}</td><td>${e.own?`<button class="linkbtn small" data-aw="dbedit" data-v="${esc(e.id)}">고치기</button>`:`<button class="linkbtn small" data-aw="dbedit" data-v="${esc(e.id)}" title="고친 것은 직접 추가 목록에 사본으로 저장돼요">고치기</button>`}</td></tr>`).join('')}</tbody></table></div></div>`}

 /* ----- 손 ----- */
 async function onClick(ev){const b=ev.target.closest('[data-aw]');if(!b){const se=ev.target.closest('[data-sedit]');if(se&&!ev.target.closest('[data-aimg],.awemp,a,button,input,select,label,textarea'))return sendBox(se.dataset.sedit);return}if(b.tagName==='SELECT'||b.tagName==='INPUT')return;const k=b.dataset.aw,v=b.dataset.v;const id=U.sel;
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
  if(k==='imgb')return imgBundle();
  if(k==='pasteall')return pasteBox('');
  if(k==='sendedit')return sendBox(v||id);
  if(k==='fix')return toggleFix(v||id);
  if(k==='note')return noteBox(v);
  if(k==='tfix')return toggleTFix(v);
  if(k==='timg')return;
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
  if(k==='recOnly'){U.recOnly=t.checked;try{localStorage.setItem('nt_aw_reconly',t.checked?'1':'0')}catch(e){}return N().render()}   /* 10-30 망령 「각성체 별 추천 설정에 감우가 추천해 준 것 외에 DB 는 숨기기」 */
  if(k==='cat'||k==='type'||k==='cost'){U[k]=t.value;return N().render()}}

 /* ----- 포트 읽기 (Edge Function) ----- */
 const vocab=()=>Object.values(DB.groups||{}).flat();
 const brief=()=>all().map(e=>[e.id,e.n,e.r,e.c,e.f,(e.g||[]).join(',')].join('|')).join('\n');
 async function imgPayload(url){if(!/^data:/.test(url))return {url};const m=/^data:([^;,]+);base64,(.*)$/.exec(url);return m?{media_type:m[1],data:m[2]}:{url}}
 async function readPort(id){const url=fnUrl();const img=subImg(id);if(!img)return N().toast('각성체 그림이 없어요');if(!url)return N().toast('Edge Function 주소가 없어요 (js/config.js)');
  U.busy=true;N().render();
  try{const c=window.NT_CONFIG||{};const bio=subNote(id).slice(0,1500);
   const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',apikey:c.supabaseKey||'',Authorization:'Bearer '+(c.supabaseKey||'')},
    body:JSON.stringify({camp:N().ST.camp,secret:N().ST.secret,image:await imgPayload(img),name:subName(id),bio,grade:gradeLine(id),vocab:vocab(),db:brief()})});
   const j=await res.json().catch(()=>({error:'응답을 읽지 못했어요 (HTTP '+res.status+')'}));if(!res.ok||j.error)throw new Error(j.error||('HTTP '+res.status));
   await applyRead(id,j,'fn');N().toast('각성체 그림을 읽었어요')}
  catch(e){N().toast('포트 읽기 실패: '+(e.message||e))}finally{U.busy=false;N().render()}}
 /* 읽은 결과(함수 · 붙여 넣기 같은 꼴): {sum, tags[], picks[{id|n, why}], extra[{n,o,r,e,c,f,l,d,k,t,w,g,why}]} */
 async function applyRead(id,j,by){if(!id)return;const V=new Set(vocab());const tags=(j.tags||[]).filter(t=>V.has(t));const A=all();
  const picks=(j.picks||[]).map(p=>{const e=p.id&&byId(p.id)||A.find(x=>x.n===p.n);return e?{id:e.id,why:String(p.why||''),cost:String(p.cost||'')}:null}).filter(Boolean).slice(0,8);
  const extra=(j.extra||[]).filter(e=>e&&e.n).slice(0,6).map(e=>({n:String(e.n),o:String(e.o||''),r:String(e.r||''),e:String(e.e||''),c:String(e.c||''),f:Math.max(1,Math.min(5,+e.f||2)),l:String(e.l||''),d:String(e.d||''),k:String(e.k||''),t:(e.t||[]).filter(t=>T2C[t]).slice(0,2),w:COSTS.includes(e.w)?e.w:'',g:(e.g||[]).filter(t=>V.has(t)),why:String(e.why||''),cost:String(e.cost||'')}));
  await save(id,r=>{r.read={by,at:new Date().toISOString(),sum:String(j.sum||''),tags,picks,extra};r.tags=[...new Set((r.tags||[]).concat(tags))]})}
 function pasteBox(id){const md=N().openModal(`<div class="mhead"><h2>📋 ${id?'감우 결과 넣기 · '+esc(subName(id)):'묶음 결과 넣기 (여러 각성체)'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">대화에서 각성체 그림을 보여 주면 감우가 이 꼴의 JSON 을 드려요. 그대로 붙여 넣으면 태그 · 후보가 채워져요.</p>
   <textarea id="awPaste" rows="12" placeholder='{"sum":"…","tags":["우울","장발"],"picks":[{"n":"아랑","why":"…","cost":"통솔 · B-2"}],"extra":[]}' style="width:100%;font-family:var(--mono);font-size:12px"></textarea>
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awPOk">넣기</button></div>`,'wide');
  $('#awPOk',md).onclick=async()=>{if(await pasteApply($('#awPaste',md).value,id))N().closeModal()}}
 /* 붙여 넣은 감우 결과 → 각 칸 추천 기록. 한 체 것({…})이면 id 칸에, 배열이면 pc · slot 으로 찾는다. 트레이너 줄(slot "t" · kind "trainer")은 건너뛴다(그림은 PC 폴더에 저장) */
 async function pasteApply(text,id){let j;const s=String(text||'').trim().replace(/^```(json)?\s*|\s*```$/g,'');if(!s){N().toast('붙여 넣은 내용이 없어요');return false}try{j=JSON.parse(s)}catch(e){N().toast('JSON 이 아니에요: '+e.message);return false}
  const many=Array.isArray(j)?j:Array.isArray(j.list)?j.list:null;
  if(!many){if(!id){N().toast('한 체 것이에요 — 각성체 DB 에서 그 각성체를 고른 뒤 「📋 감우 결과 넣기」로 넣어 주세요');return false}await applyRead(id,j,'chat');N().toast('넣었어요');return true}
  const P=pcs();let n=0;const miss=[];for(const x of many){if(!x||x.kind==='trainer'||x.slot==='t')continue;const pc0=String(x.pc||'');const k=+x.slot||(pc0.includes('~')?sidN(pc0):1);let p=P.find(q=>q.id===sidPc(pc0))||P.find(q=>pcName(q.id)===x.name||pcName(q.id)===pc0||String(x.name||'').startsWith(pcName(q.id)+' '));if(!p){miss.push(x.name||x.pc||'?');continue}await applyRead(sidOf(p.id,k),x,'chat');n++}
  N().toast(`${n}체 넣었어요`+(miss.length?` · 못 찾은 PC: ${miss.join(', ')}`:''));return n>0||!miss.length}

 /* ----- 📦 감우에게 보낼 묶음: 그림 한 장(번호 · 이름) + 글(코멘트 · 고른 태그 · 돌려받을 꼴) ----- */
 function loadImg(src){return new Promise(res=>{const im=new Image();if(!/^data:/.test(src))im.crossOrigin='anonymous';im.onload=()=>res(im);im.onerror=()=>res(null);im.src=src})}
 async function sheet(L){const n=L.length,cols=Math.min(n,4),rows=Math.ceil(n/cols),W=420,H=560,LB=56,G=16;
  const cv=document.createElement('canvas');cv.width=cols*W+(cols+1)*G;cv.height=rows*(H+LB)+(rows+1)*G;const c=cv.getContext('2d');c.fillStyle='#16161c';c.fillRect(0,0,cv.width,cv.height);
  let bad=0;for(let i=0;i<n;i++){const p=L[i];const x=G+(i%cols)*(W+G),y=G+Math.floor(i/cols)*(H+LB+G);c.fillStyle='#000';c.fillRect(x,y,W,H);
   const im=await loadImg(p.t?portrait(p.id):subImg(p.id));if(im){const s=Math.max(W/im.width,H/im.height);const w=im.width*s,h=im.height*s;c.save();c.beginPath();c.rect(x,y,W,H);c.clip();c.drawImage(im,x+(W-w)/2,y+Math.min(0,(H-h)/4),w,h);c.restore()}else bad++;
   c.fillStyle='#f4f0e6';c.fillRect(x,y+H,W,LB);c.fillStyle='#111';c.font='bold 26px "IBM Plex Sans KR",sans-serif';c.textBaseline='middle';c.fillText((p.lab||(p.t?`T${p.k}. ${pcName(p.id)} (트레이너)`:`${p.k||i+1}. ${subName(p.id)}`)).slice(0,26),x+14,y+H+LB/2)}
  let url='';try{url=cv.toDataURL('image/png')}catch(e){url=''}return {cv,url,bad}}
 function bundleText(L,T){T=T||[];const cfg=naiCfg();const out=['[각성체 원전 추천 부탁 — 미사그]','그림 한 장에 번호 · 이름을 붙인 각성체 그림이 있어요. 그림마다 그 모습에 어울리는 역사 · 설화 속 원전 인물(마이너하거나 열화된 모습)을 3~5명씩 골라 주세요.',
  '후보는 각성체 DB 에 갇히지 말고 DB 밖에서 새로 찾아 주세요(extra 3~5명이 중심). DB 후보(picks)는 그림에 정말 잘 맞을 때만 0~2명.',
  '규칙: 각성체 프라이드가 원전의 격을 정해요 — 파워 차이만큼 격 차이. C · C+ = 격 낮음(이름만 남은 사람 · 민담 조연, 지명도 1~2) · B · B+ = 격 중간(한 고장 전설의 주인공, 지명도 2~3) · A = 격 높음(한 나라에 알려진 인물 · 신화 조연급, 유명 인물은 열화된 한 시절, 지명도 3~4). 각성 (보조)는 C 권장 · 대가 없음.',
  '후보마다 그 인물에 어울리는 대가를 아래 목록 안에서 하나 추천해 주세요 (대가 없음인 칸은 "없음").',COSTLIST,''];
  L.forEach((p,i)=>{const r=rec(p.id);const x=slot(p.id);out.push(`${i+1}. ${subName(p.id)} (pc: ${x.pc}, slot: ${x.n})`);out.push('   '+gradeLine(p.id));if(x.note)out.push('   코멘트: '+x.note.replace(/\n/g,' / '));if((r.tags||[]).length)out.push('   고른 태그: '+r.tags.join(', '));const pk=r.pick&&byId(r.pick);if(pk)out.push('   이미 정함: '+pk.n);out.push('')});
  out.push('돌려받을 꼴: JSON 배열 하나. [{"pc":"<pc id>","slot":<1|2>,"name":"<이름>","sum":"…","tags":[…],"extra":[{"n":"<이름>","o":"<원어 · 한자>","r":"<지역>","e":"<시대>","c":"<분류>","f":<지명도 1~5>,"l":"<누구인지 한 문장>","d":"<각성체로 올 때의 열화된 모습>","k":"<은열쇠 물건>","t":["<포켓몬 타입>"],"why":"…","cost":"<분류 · 항목>"} DB 밖 새 후보 3~5명],"picks":[{"id":"<DB id>","n":"<이름>","why":"…","cost":"<분류 · 항목>"} DB 후보 0~2명]}]');
  out.push('(받은 것은 세션 노트 시트 > 각성체 > 「📦 원전 추천 묶음」 창 아래 「📋 감우 결과 넣기」에 그대로 붙여 넣어요)');return out.join('\n')}
 async function bundle(){await MK().load();const P0=subs();if(!pcs().length)return N().toast('PC 가 없어요');const P=P0.filter(p=>!slot(p.id).fixed);const nFix=P0.length-P.length;const TP=[],tsel=new Set();const sel=new Set(P.filter(p=>subImg(p.id)&&!rec(p.id).pick).map(p=>p.id));if(!sel.size)P.forEach(p=>subImg(p.id)&&sel.add(p.id));
  const md=N().openModal(`<div class="mhead"><h2>📦 원전 추천 묶음</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">보낼 각성체를 고르세요. <b>그림 복사</b>(또는 받기)와 <b>글 복사</b>를 해서 대화에 같이 붙여 넣으면, 감우가 그림마다 어울리는 원전 인물을 한 번에 드려요. 받은 답은 이 창 아래 「📋 감우 결과 넣기」에.${nFix?` <span class="dim">(확정된 ${nFix}체는 뺐어요)</span>`:''}</p>
   <div class="awbpcs">${P.map(p=>`<label class="chip awbch ${sel.has(p.id)?'on':''}"><input type="checkbox" data-bsel value="${esc(p.id)}" ${sel.has(p.id)?'checked':''} hidden>${thumb(subImg(p.id))}${esc(subName(p.id))}${subImg(p.id)?'':' · 그림 없음'}${subNote(p.id)?' ✎':''}</label>`).join('')}</div>
   <div class="awbprev" id="awBPrev"><div class="empty">그리는 중…</div></div>
   <textarea id="awBText" rows="9" readonly style="width:100%;font-family:var(--mono);font-size:12px;margin-top:8px"></textarea>
   <div class="mfoot"><span class="small dim" id="awBMsg"></span><span class="sp"></span><button class="btn" id="awBImgDl">⬇ 그림 받기</button><button class="btn" id="awBImgCp">🖼 그림 복사</button><button class="btn pri" id="awBTxtCp">📝 글 복사</button></div>
   <details class="awbpaste" ${P.length?'':'open'}><summary>📋 감우 결과 넣기 <small class="dim">감우가 돌려준 JSON 을 그대로 붙여 넣어요</small></summary>
    <textarea id="awPaste" rows="7" placeholder='[{"pc":"…","slot":1,"sum":"…","tags":[…],"picks":[{"n":"아랑","why":"…","cost":"통솔 · B-2"}],"extra":[]}]' style="width:100%;font-family:var(--mono);font-size:12px"></textarea>
    <div class="row"><span class="sp"></span><button class="btn pri" id="awPOk">넣기</button></div></details>`,'wide');
  $('#awPOk',md).onclick=async()=>{if(await pasteApply($('#awPaste',md).value,'')){$('#awPaste',md).value=''}};

  let cur=null;const draw=async()=>{const L=P.filter(p=>sel.has(p.id));const T=TP.filter(pc=>tsel.has(pc));$('#awBText',md).value=L.length||T.length?bundleText(L,T):'';const pv=$('#awBPrev',md);if(!L.length&&!T.length){pv.innerHTML='<div class="empty">각성체나 트레이너를 하나 이상 골라 주세요</div>';cur=null;return}
   const SL=L.map((p,i)=>({id:p.id,k:i+1})).concat(T.filter(pc=>portrait(pc)).map(pc=>({id:pc,t:true,k:T.indexOf(pc)+1})));
   cur=await sheet(SL);pv.innerHTML='';cur.cv.style.maxWidth='100%';cur.cv.style.maxHeight='46vh';pv.appendChild(cur.cv);
   $('#awBMsg',md).textContent=!cur.url?'그림 저장소가 교차 출처를 막아 한 장으로 못 묶었어요 — 그림은 따로 올려 주세요':cur.bad?`그림을 못 읽은 각성체 ${cur.bad}체`:`${L.length}체${T.length?' · 트레이너 '+T.length+'명':''}`};
  md.addEventListener('change',e=>{const c=e.target.closest('[data-bsel],[data-btsel]');if(!c)return;const S=c.matches('[data-btsel]')?tsel:sel;c.checked?S.add(c.value):S.delete(c.value);c.parentElement.classList.toggle('on',c.checked);draw()});
  $('#awBTxtCp',md).onclick=async()=>{const t=$('#awBText',md).value;try{await navigator.clipboard.writeText(t);N().toast('글을 복사했어요')}catch(e){$('#awBText',md).select();document.execCommand('copy');N().toast('글을 복사했어요')}};
  $('#awBImgDl',md).onclick=()=>{if(!cur||!cur.url)return N().toast('묶은 그림이 없어요');const a=document.createElement('a');a.href=cur.url;a.download='각성체_묶음_'+new Date().toISOString().slice(0,10)+'.png';document.body.appendChild(a);a.click();a.remove()};
  $('#awBImgCp',md).onclick=async()=>{if(!cur||!cur.url)return N().toast('묶은 그림이 없어요');try{const b=await new Promise(r=>cur.cv.toBlob(r,'image/png'));await navigator.clipboard.write([new ClipboardItem({'image/png':b})]);N().toast('그림을 복사했어요 — 대화에 붙여 넣으세요')}catch(e){N().toast('이 브라우저는 그림 복사가 안 돼요 — 「그림 받기」로 받아 올려 주세요')}};
  draw()}

 /* ----- 🎨 그림 뽑기 묶음: 트레이너 · 각성체 그림(포트 · 스탠딩)을 NAI 로 — 감우가 job.json 을 쓰고 PC 에서 돌린다 ----- */
 const thumb=u=>`<i class="awbth ${u?'':'no'}" style="${u?`background-image:url('${cssu(u)}')`:''}"></i>`;
 function imgTargets(){const out=[];for(const p of pcs()){const pc=p.id;if(!(tport(pc)||{}).fixed)out.push({id:'t:'+pc,pc,t:true});for(const n of [1,2]){const x=slot(sidOf(pc,n));if(!x.fixed&&(x.img||x.note||x.pid))out.push({id:x.sid,pc,n})}}return out}
 const tgImg=x=>x.t?portrait(x.pc):subImg(x.id);
 const tgName=x=>x.t?`${pcName(x.pc)} (트레이너)`:subName(x.id);
 const tgDir=x=>x.t?pcName(x.pc):`${pcName(x.pc)}\\각성체 ${x.n}`;
 function imgText(L,cfg){const out=['[그림 뽑기 부탁 — 미사그 · NovelAI]',
  `그림마다 무진 인물 그림체로 「포트」 = 배경이 들어간 정사각 얼굴 · 상반신 ${cfg.port}장, 「스탠딩」 = 허리 위 상반신 ${cfg.stand}장을 뽑아 PC 의 07_이미지\\미사그\\<아래 폴더>\\포트 · 스탠딩 에 저장해 주세요.`,
  `토큰 = nai_token.txt 의 ${cfg.key==='sub'?'Sub':'Main'} · 스탠딩 = 뽑을 때 투명 배경 설정(V5 Transparent BG). NAI 「배경 지우기」(Anlas 씀)는 쓰지 말 것.`,
  '묶음 그림의 번호(T = 트레이너, A = 각성체)를 보고 겉모습 태그를 적어 주세요 (지금 그림은 참고용 — 같은 인물로).',''];
  L.forEach((x,i)=>{const k=(x.t?'T':'A')+(i+1);out.push(`${k}. ${tgName(x)} (pc: ${x.pc}${x.t?'':', slot: '+x.n}) → 폴더 ${tgDir(x)}`);
   if(x.t){const g=tBio(x.pc,'겉모습'),c=tBio(x.pc,'성격'),b=tBio(x.pc,'백스토리');if(g)out.push('   겉모습: '+g.replace(/\n/g,' / '));if(c)out.push('   성격: '+c.replace(/\n/g,' / ').slice(0,200));if(b)out.push('   백스토리: '+b.replace(/\n/g,' / ').slice(0,200))}
   else{const s=slot(x.id);if(s.note)out.push('   코멘트: '+s.note.replace(/\n/g,' / '));const pk=rec(x.id).pick&&byId(rec(x.id).pick);if(pk)out.push('   원전 (고른 후보): '+pk.n)}
   if(!tgImg(x))out.push('   그림 없음 — 글로만');out.push('')});
  return out.join('\n')}
 async function imgBundle(){await MK().load();const T=imgTargets();if(!T.length)return N().toast('뽑을 대상이 없어요 — 트레이너 · 각성체가 모두 확정됐어요');const sel=new Set(T.map(x=>x.id));let cfg=naiCfg();
  const md=N().openModal(`<div class="mhead"><h2>🎨 그림 뽑기 묶음</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">확정 안 한 트레이너 포트 · 각성체가 기본으로 들어가요. <b>그림 복사</b>(또는 받기)와 <b>글 복사</b>를 해서 감우에게 보내면, 감우가 PC 의 07_이미지\\미사그\\_nai 로 포트 · 스탠딩을 뽑아 이름별 폴더에 넣어 드려요.</p>
   <div class="awbpcs">${T.map(x=>`<label class="chip awbch ${x.t?'tr':''} on"><input type="checkbox" data-isel value="${esc(x.id)}" checked hidden>${thumb(tgImg(x))}${esc(tgName(x))}</label>`).join('')}</div>
   <div class="awbcfg">NAI 토큰 <select id="awCKey"><option value="main" ${cfg.key!=='sub'?'selected':''}>Main</option><option value="sub" ${cfg.key==='sub'?'selected':''}>Sub</option></select>
    포트 <input type="number" id="awCPort" min="0" max="20" value="${cfg.port}"> 장 · 스탠딩 <input type="number" id="awCStand" min="0" max="20" value="${cfg.stand}"> 장
    <small class="dim">스탠딩은 뽑을 때 투명 배경 설정으로 (Anlas 드는 배경 지우기는 안 써요)</small></div>
   <div class="awbprev" id="awBPrev"><div class="empty">그리는 중…</div></div>
   <textarea id="awBText" rows="9" readonly style="width:100%;font-family:var(--mono);font-size:12px;margin-top:8px"></textarea>
   <div class="mfoot"><span class="small dim" id="awBMsg"></span><span class="sp"></span><button class="btn" id="awBImgDl">⬇ 그림 받기</button><button class="btn" id="awBImgCp">🖼 그림 복사</button><button class="btn pri" id="awBTxtCp">📝 글 복사</button></div>`,'wide');
  let cur=null;const draw=async()=>{const L=T.filter(x=>sel.has(x.id));$('#awBText',md).value=L.length?imgText(L,cfg):'';const pv=$('#awBPrev',md);if(!L.length){pv.innerHTML='<div class="empty">하나 이상 골라 주세요</div>';cur=null;return}
   const SL=L.map((x,i)=>({id:x.t?x.pc:x.id,t:x.t,k:i+1,lab:`${x.t?'T':'A'}${i+1}. ${x.t?pcName(x.pc)+' (트레이너)':subName(x.id)}`})).filter(q=>q.t?portrait(q.id):subImg(q.id));
   if(!SL.length){pv.innerHTML='<div class="empty">그림이 있는 대상이 없어요 — 글만 보내도 돼요</div>';cur=null;return}
   cur=await sheet(SL);pv.innerHTML='';cur.cv.style.maxWidth='100%';cur.cv.style.maxHeight='46vh';pv.appendChild(cur.cv);
   const nt=L.filter(x=>x.t).length;$('#awBMsg',md).textContent=!cur.url?'그림 저장소가 교차 출처를 막아 한 장으로 못 묶었어요 — 그림은 따로 올려 주세요':`트레이너 ${nt} · 각성체 ${L.length-nt} · ${L.length*(cfg.port+cfg.stand)}장`};
  const saveCfg=async()=>{cfg={key:$('#awCKey',md).value==='sub'?'sub':'main',port:Math.max(0,Math.min(20,+$('#awCPort',md).value||0)),stand:Math.max(0,Math.min(20,+$('#awCStand',md).value||0)),bg:false};try{await N().put('awkcfg','nai',cfg,'gm')}catch(e){N().toast('설정을 저장하지 못했어요: '+(e.message||e))}draw()};
  ['#awCKey','#awCPort','#awCStand'].forEach(q=>$(q,md).addEventListener('change',saveCfg));
  md.addEventListener('change',e=>{const c=e.target.closest('[data-isel]');if(!c)return;c.checked?sel.add(c.value):sel.delete(c.value);c.parentElement.classList.toggle('on',c.checked);draw()});
  $('#awBTxtCp',md).onclick=async()=>{const t=$('#awBText',md).value;try{await navigator.clipboard.writeText(t);N().toast('글을 복사했어요')}catch(e){$('#awBText',md).select();document.execCommand('copy');N().toast('글을 복사했어요')}};
  $('#awBImgDl',md).onclick=()=>{if(!cur||!cur.url)return N().toast('묶은 그림이 없어요');const a=document.createElement('a');a.href=cur.url;a.download='그림뽑기_묶음_'+new Date().toISOString().slice(0,10)+'.png';document.body.appendChild(a);a.click();a.remove()};
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
 async function toMaker(id){const r=rec(id);const e=r.pick&&byId(r.pick);if(!e)return;const crec=(((r.read&&r.read.picks)||[]).find(q=>q.id===e.id)||{}).cost||'';const DBS=N().DBS();if(!DBS.makerPut||!DBS.makerGet)return N().toast('이 화면에서는 제작기에 쓸 수 없어요');
  await MK().load(true);const pc=sidPc(id);const t=MK().trainer(pc);if(!t)return N().toast('이 PC 는 제작기 트레이너가 없어요 — 시트 탭에서 「⇪ 제작기로」를 먼저');
  const x=slot(id);const m=x.pid&&MK().M.pokemon.find(q=>q.id===x.pid);
  if(m){/* 그 칸의 각성체 시트가 이미 있다 → 메모에 원전을 넣는다 (이름은 고를 때만) */
   const md=N().openModal(`<div class="mhead"><h2>⇪ 제작기 각성체 시트에 넣기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
    <p class="small" style="margin-top:0">제작기 <b>「${esc(t.name)}」</b>의 각성체 <b>「${esc(m.name||'?')}」</b> 시트 메모 맨 위에 원전을 넣어요. 전에 넣은 원전 줄은 바꿔요.</p>
    <div class="tomk"><div><b>원전</b><span>${esc(e.n)}</span></div><div><b>타입</b><span>${(e.t||[]).map(tchip).join(' ')||'—'} <small class="dim">(참고 — 시트 타입은 그대로)</small></span></div><div><b>메모</b><span class="pre small">${esc(memoOf(e,crec))}</span></div></div>
    <label class="small" style="display:block;margin-top:10px"><input type="checkbox" id="awRen"> 시트 이름도 「${esc(e.n)}」로 바꾸기</label>
    <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awMk">넣기</button></div>`);
   $('#awMk',md).onclick=async()=>{const b=$('#awMk',md);b.disabled=true;b.textContent='넣는 중…';
    try{const ren=$('#awRen',md).checked;await MK().edit('pokemon',m.id,d=>{const rest=String(d.memo||'').replace(/【각성체 원전】[\s\S]*?(\n\n|$)/,'').trim();d.memo=memoOf(e,crec)+(rest?'\n\n'+rest:'');if(ren)d.name=e.n});
     await save(id,y=>{y.made={pid:m.id,id:e.id,at:new Date().toISOString()}});N().closeModal();N().toast('제작기 각성체 시트에 넣었어요')}
    catch(err){b.disabled=false;b.textContent='다시 시도';N().toast('넣지 못했어요: '+(err.message||err))}};return}
  const aw=mkAw(pc);const hasFree=aw.some(q=>q.awaken==='free');const sp=slotRaw(pc,x.n),op=slotRaw(pc,x.n===1?2:1);const wantFree=!hasFree&&(sp.main||!op.main);
  if(aw.length>=2)return N().toast('이 트레이너는 각성체가 이미 2체예요');
  const md=N().openModal(`<div class="mhead"><h2>⇪ 제작기 각성체로</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">제작기의 <b>「${esc(t.name)}」</b> 트레이너에 각성체로 표시한 포켓몬 시트가 ${aw.length?'이 칸엔 ':''}없어서 하나 만들어요. 이름 · 타입 · 메모(원전 · 열화 · 은열쇠)${x.own?' · 그림':''}만 채우고, 종족치 · 포텐셜은 제작기에서 짜 주세요.${t.misag?'':' <b style="color:var(--red)">이 트레이너는 포인트 칸이 「미사그 대학 (4+2)」가 아니라서 각성체 칸이 제작기에서 안 보일 수 있어요.</b>'}</p>
   <div class="tomk"><div><b>이름</b><span>${esc(e.n)}</span></div><div><b>타입</b><span>${(e.t||[]).map(tchip).join(' ')||'—'}</span></div><div><b>메모</b><span class="pre small">${esc(memoOf(e,crec))}</span></div></div>
   <div class="mrow" style="margin-top:10px"><label class="lbl">각성체<select id="awKind"><option value="free" ${wantFree?'selected':''} ${hasFree?'disabled':''}>각성 (대가) · 프라이드로 대가${hasFree?' — 이미 있음':''}</option><option value="c" ${wantFree?'':'selected'}>각성 (보조) · C 권장 · 대가 없음</option></select></label></div>
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awMk">만들기</button></div>`);
  $('#awMk',md).onclick=async()=>{const b=$('#awMk',md);b.disabled=true;b.textContent='만드는 중…';
   try{const cur=await DBS.makerGet('trainers',pc);if(!cur)throw new Error('제작기 트레이너 문서를 찾지 못했어요');const pid=Math.random().toString(36).slice(2,10);
    const p=Object.assign(newPoke(),{id:pid,name:e.n,t1:(e.t||[])[0]||'-',t2:(e.t||[])[1]||'-',memo:memoOf(e,crec),image:x.own?x.img:'',awaken:$('#awKind',md).value,pride:PRIDES.includes(sp.pride)?sp.pride:''});
    await DBS.makerPut('pokemon',pid,{tid:pc,data:p});
    if(MK().edit)await MK().edit('trainers',pc,d=>{d.pids=(d.pids||[]).concat(pid)});else{const doc=JSON.parse(JSON.stringify(cur.data||{}));const d=doc.data||doc;d.pids=(d.pids||[]).concat(pid);await DBS.makerPut('trainers',pc,doc)}
    await save(id,y=>{y.made={pid,id:e.id,at:new Date().toISOString()}});await MK().load(true);N().closeModal();N().toast('제작기에 각성체 시트를 만들었어요')}
   catch(err){b.disabled=false;b.textContent='다시 시도';N().toast('만들지 못했어요: '+(err.message||err))}}}
 const memoOf=(e,cost)=>[`【각성체 원전】 ${e.n}${e.o?' ('+e.o+')':''} · ${[e.r,e.e,e.c].filter(Boolean).join(' · ')}`,e.l?'누구: '+e.l:'',e.d?'열화: '+e.d:'',e.k?'은열쇠: '+e.k:'',e.w?'대가 성향: '+e.w:'',cost?'대가 추천: '+cost:''].filter(Boolean).join('\n');

 /* ----- 「각성체」 화면 (모두): PL = 제 PC 의 각성체 그림 · 코멘트, GM = 전원 + 묶음 ----- */
 function slotHtml(x,G){const r=G?rec(x.sid):{};const pk=r.pick&&DB.base&&byId(r.pick);const E=canSend(x.pc);const fx=x.fixed;
  return `<div class="aweslot ${fx?'fixed':''}" ${E?`data-sedit="${esc(x.pc)}" title="눌러서 각성체 고치기"`:''}><div class="awepor ${E?'edit':''}" ${E?`data-aimg="${esc(x.sid)}" title="눌러서 (또는 끌어다 놓아) 각성체 ${x.n} 그림 바꾸기"`:''} style="${x.img?`background-image:url('${cssu(x.img)}')`:''}">${x.img?'':E?'그림 넣기':'그림 없음'}</div>
   <div class="awes"><div class="row" style="gap:6px"><b>각성체 ${x.n}</b>${fx?`<span class="awfix">✦ 확정 · ${esc(fx.n)}</span>`:''}</div>
    <small>${x.mname?`제작기 「${esc(x.mname)}」${x.own?' · 올린 그림':''} · `:x.own?'올린 그림 · ':''}${x.kind==='c'?'보조':x.kind==='free'?'대가':''}${x.pride?' · 프라이드 '+esc(x.pride):''}${x.kind!=='c'&&x.cost?' · 대가 '+esc(x.cost):''}</small>
    <div class="pre small awenote clamp" ${x.note?`title="${esc(x.note)}"`:''}>${x.note?esc(x.note):''}</div>
    ${G?`<div class="row" style="gap:6px;flex-wrap:wrap"><span class="small dim">${fx?'':pk?'✓ 원전 · '+esc(pk.n):(r.cands||[]).length?'후보 '+r.cands.length+'명':r.read?'추천 받음':'아직'}</span><span class="sp"></span><button class="btn xs ${fx||!pk?'':'pri'}" data-aw="fix" data-v="${esc(x.sid)}" title="${fx?'확정을 풀고 다시 보내기 목록에 넣어요':'원전을 직접 정해 확정해요 (고른 후보가 있으면 그 이름이 먼저 들어가요)'}">${fx?'확정 풀기':'✦ 확정'}</button><button class="btn xs" data-aw="godb" data-v="${esc(x.sid)}">추천 보기 →</button></div>`:''}</div>${prefHtml(x)}</div>`}
 /* 10-30 망령 「대가를 요구하는 메인 각성체 지정 · 프라이드 몇으로 할지」:
    칸마다 「메인 (대가)」 하나 + 프라이드. 노트 사본 = pcp/<pc>.awk[n-1].main · .pride (PL 본인 · GM).
    그 칸에 제작기 각성체 시트가 있으면 제작기 값(awaken 'free' = 대가 · 'c' = 보조, pride)을 보이고, 고치면 제작기에도 넣는다.
    시트가 아직 없으면 「⇪ 제작기 각성체로」로 만들 때 이 값으로 만든다 */
 const PRIDES=['C','C+','B','B+','A','EX'];
 function pref(pc,n){const x=slot(sidOf(pc,n));const m=x.pid&&MK()&&MK().M.pokemon.find(q=>q.id===x.pid);const s=slotRaw(pc,n);
  return m?{main:m.awaken==='free',pride:String(m.pride||''),mk:true}:{main:!!s.main,pride:String(s.pride||''),mk:false}}
 function prefHtml(x){const P=pref(x.pc,x.n);const E=canSend(x.pc);
  if(!E)return `<div class="awemp ro">${P.main?'<b class="awemb">메인 · 대가</b>':'<span class="dim">보조</span>'}<span>프라이드 <b>${esc(P.pride||(P.mk?'자동':'미정'))}</b></span></div>`;
  const opts=PRIDES.includes(P.pride)||!P.pride?PRIDES:[P.pride].concat(PRIDES);
  return `<div class="awemp"><label class="awemain ${P.main?'on':''}" title="대가를 요구하는 메인 각성체 — 제작기 「각성 (대가)」. 다른 칸은 「각성 (보조)」가 돼요"><input type="radio" name="awm-${esc(x.pc)}" data-awm="${esc(x.pc)}" value="${x.n}" ${P.main?'checked':''}> 메인 (대가)</label>
   <label class="awepr">프라이드<select data-awp="${esc(x.pc)}" data-n="${x.n}"><option value="">${P.mk?'자동':'미정'}</option>${opts.map(v=>`<option ${v===P.pride?'selected':''}>${esc(v)}</option>`).join('')}</select></label>${P.mk?'<small title="제작기 각성체 시트와 같은 값이에요">⇄ 제작기</small>':''}</div>`}
 async function setPref(pc,n,patch){if(!canSend(pc))return;
  const cur=Object.assign({},pcp(pc));const L=[0,1].map(i=>Object.assign({},(Array.isArray(cur.awk)&&cur.awk[i])||{}));
  if('main' in patch)L.forEach((s,i)=>{s.main=i===n-1});if('pride' in patch)L[n-1].pride=patch.pride;
  cur.awk=L;delete cur.awk_img;delete cur.awk_note;
  try{await N().put('pcp',pc,cur,'pl:'+pc)}catch(e){N().render();return N().toast('저장하지 못했어요: '+(e.message||e))}
  await mkSync(pc,L,'main' in patch,'pride' in patch?[n]:[]);N().render()}
 /* 노트 칸의 메인 (대가) · 프라이드를 제작기 각성체 시트에도 (있을 때만) */
 async function mkSync(pc,L,main,prideNs){const aw=mkAw(pc);const jobs=[];const mi=L.findIndex(s=>s.main);
  if(main&&mi>=0)aw.forEach((m,i)=>{const k=i===mi?'free':'c';if(m.awaken!==k)jobs.push([m.id,d=>{d.awaken=k}])});
  for(const n of prideNs){const m=aw[n-1];const v=String((L[n-1]||{}).pride||'');if(m&&v&&String(m.pride||'')!==v)jobs.push([m.id,d=>{d.pride=v}])}
  try{for(const [id,fn] of jobs)await MK().edit('pokemon',id,fn);N().toast(jobs.length?'저장했어요 · 제작기 각성체 시트에도 넣었어요':'저장했어요')}
  catch(e){N().toast('노트엔 저장했어요 — 제작기엔 못 썼어요: '+(e.message||e))}}
 function onPref(ev){const t=ev.target;if(t.dataset.awhide!=null){U.hideDone=t.checked;try{localStorage.setItem('nt_aw_hidedone',t.checked?'1':'0')}catch(e){}return N().render()}if(t.dataset.awm!=null&&t.checked)return setPref(t.dataset.awm,+t.value,{main:true});
  if(t.dataset.awp!=null)return setPref(t.dataset.awp,+t.dataset.n||1,{pride:t.value})}
 function sendCard(pc,big){const G=N().gm();const S=[1,2].map(n=>slot(sidOf(pc,n)));const all=S.every(x=>x.fixed);const tp=tport(pc);const img=portrait(pc);
  return `<div class="awe card ${big?'big':''} ${all?'fixed':''}"><div class="awebody"><div class="row"><h3>${esc(pcName(pc))}</h3><span class="sp"></span>${canSend(pc)?`<button class="btn xs" data-aw="sendedit" data-v="${esc(pc)}">✎ 각성체 고치기</button>`:''}</div>
   <div class="awtr ${tp&&tp.fixed?'fixed':''}"><span class="awtr-por ${img?'':'noimg'}" style="${img?`background-image:url('${cssu(img)}')`:''}">${img?'':esc([...(pcName(pc)||'?')][0]||'?')}</span>
    <div class="awtr-b"><div class="row" style="gap:6px"><b>트레이너 포트</b>${tp&&tp.fixed?'<span class="awfix">✦ 확정</span>':''}</div>
     <small>${tp&&tp.fixed?'이 그림으로 정했어요 — 그림 뽑기에서 빠져요':G?'확정 전이면 「🎨 그림 뽑기 묶음」에 들어가 감우가 무진 그림체 포트 · 스탠딩을 뽑아요':'GM 이 정해요'}</small>
     ${G?`<div class="row" style="gap:6px"><span class="sp"></span><button class="btn xs ${tp&&tp.fixed?'':'pri'}" data-aw="tfix" data-v="${esc(pc)}">${tp&&tp.fixed?'확정 풀기':'✦ 확정'}</button></div>`:''}</div></div>
   <div class="aweslots">${S.map(x=>slotHtml(x,G)).join('')}</div></div></div>`}
 async function toggleTFix(pc){if(!N().gm())return;const cur=Object.assign({},pcp(pc));if(cur.tport&&cur.tport.fixed)delete cur.tport;else cur.tport={fixed:true,at:new Date().toISOString()};await N().put('pcp',pc,cur,'pl:'+pc);N().toast(cur.tport?'트레이너 포트를 확정했어요':'트레이너 포트 확정을 풀었어요')}
 /* 코멘트 한 칸 고치기 (각성체 탭에서 코멘트를 누르면) */
 function noteBox(sid){const x=slot(sid);if(!canSend(x.pc))return;
  const md=N().openModal(`<div class="mhead"><h2>✎ ${esc(subName(sid))} 코멘트</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <textarea id="awNote" rows="6" style="width:100%" placeholder="예: 그림의 소품(거울 · 부채)이나 분위기 설명, 바라는 지역 · 시대, 피하고 싶은 인물">${esc(x.note)}</textarea>
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awNOk">저장</button></div>`,'');
  const ta=$('#awNote',md);ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);
  $('#awNOk',md).onclick=async()=>{const cur=Object.assign({},pcp(x.pc));const L=[0,1].map(i=>Object.assign({},(Array.isArray(cur.awk)&&cur.awk[i])||{}));L[x.n-1].note=ta.value.trim();cur.awk=L;delete cur.awk_img;delete cur.awk_note;
   try{await N().put('pcp',x.pc,cur,'pl:'+x.pc);N().closeModal();N().toast('저장했어요')}catch(e){N().toast('저장하지 못했어요: '+(e.message||e))}}}
 /* 확정: pcp 의 그 칸에 {id,n,at} — 묶음에서 빠지고 테두리가 바뀐다. 풀면 지운다 */
 /* 10-29 망령 「각성체 탭에서도 확정 — 내가 정해도 되니까」: 고른 후보가 없어도 GM 이 원전 이름을 적어 확정한다. 이름이 DB 에 있으면 그 항목 id 를 붙인다 */
 async function toggleFix(sid){const x=slot(sid);const r=rec(sid);let e=r.pick&&byId(r.pick);
  if(!x.fixed){const nm=String(await N().promptBox(`각성체 ${x.n} 원전 확정`,e?e.n:'','원전 이름 (예: 잔 다르크)')||'').trim();if(!nm)return;
   if(!e||nm!==e.n){const L=DB.base?all():[];const hit=L.find(q=>q.n===nm)||L.find(q=>(q.n||'').replace(/\s/g,'')===nm.replace(/\s/g,''));e=hit?{id:hit.id,n:hit.n}:{id:'',n:nm}}}
  const cur=Object.assign({},pcp(x.pc));const L=Array.isArray(cur.awk)?cur.awk.map(o=>Object.assign({},o)):[];while(L.length<x.n)L.push({});
  if(x.fixed)delete L[x.n-1].fixed;else L[x.n-1].fixed={id:e.id,n:e.n,at:new Date().toISOString()};cur.awk=L;await N().put('pcp',x.pc,cur,'pl:'+x.pc);N().toast(x.fixed?'확정을 풀었어요':`「${e.n}」로 확정했어요`)}
 /* 각성체 칸 그림 눌러 바꾸기 */
 function bindSlotImgs(el){$$('[data-aimg]',el).forEach(bx=>N().bindDrop(bx,async fs=>{const sid=bx.dataset.aimg;const x=slot(sid);try{const u=await N().upload(fs[0],'photo','awk');const cur=Object.assign({},pcp(x.pc));const L=Array.isArray(cur.awk)?cur.awk.map(o=>Object.assign({},o)):[];while(L.length<x.n)L.push({});L[x.n-1].img=u;cur.awk=L;await N().put('pcp',x.pc,cur,'pl:'+x.pc)}catch(e){N().toast('올리기 실패: '+(e.message||e))}}))}
 /* 10-30 망령 「각성체 쪽에 숨김 설정도 — 다 확정 난 애들은 목록에 띄우기엔 좀 크니까」: 트레이너 포트 · 각성체 1 · 2 모두 확정이면 「다 확정」 */
 const allDone=pc=>{const tp=tport(pc);return !!(tp&&tp.fixed)&&[1,2].every(n=>slot(sidOf(pc,n)).fixed)};
 function entry(el){const G=N().gm(),M=N().me();const L0=pcs();const nDone=G?L0.filter(p=>allDone(p.id)).length:0;const L=G&&U.hideDone?L0.filter(p=>!allDone(p.id)):L0;
  const head=`<div class="toolbar"><h2>각성체</h2><span class="note">${G?'각성체 그림(제작기 각성체 포켓몬 그림 · 또는 올린 그림)과 코멘트를 모아 감우에게 보내요 — 그림에 어울리는 원전 인물을 찾아 드려요':'내 각성체 그림과 바라는 점을 넣어 두세요 — 그 모습에 어울리는 역사 · 설화 속 원전 인물을 골라 드려요'}</span><span class="sp"></span>${G?`<label class="small awhide" title="트레이너 포트 · 각성체 1 · 2 를 모두 확정한 학생을 목록에서 숨겨요"><input type="checkbox" data-awhide ${U.hideDone?'checked':''}> 다 확정한 학생 숨기기${nDone?` (${nDone}명)`:''}</label><button class="btn sm pri" data-aw="bundle">📦 원전 추천 묶음 · 결과 넣기</button><button class="btn sm" data-aw="imgb">🎨 그림 뽑기 묶음</button>`:''}</div>`;
  let body;if(G)body=L.length?`<div class="awegrid">${L.map(p=>sendCard(p.id)).join('')}</div>`:L0.length?'<div class="empty">모두 확정했어요. 「다 확정한 학생 숨기기」를 끄면 다시 보여요.</div>':'<div class="empty">PC 시트가 없어요.</div>';
  else if(M&&N().data('pc',M))body=`<div class="awegrid one">${sendCard(M,true)}</div>`;
  else body='<div class="empty">PL 좌석으로 들어오면 내 PC 의 각성체 그림 · 코멘트를 넣을 수 있어요.</div>';
  el.innerHTML=head+body;el.addEventListener('click',onClick);el.addEventListener('change',onPref);bindSlotImgs(el);if(G&&!DB.base)load();if(MK()&&!MK().M.at)MK().load().then(()=>N().render())}
 /* 학생증 옆 카드 (pc_ui idHero 가 부른다) */
 /* 10-30 미사그 1인 2체 (제작기 misagOut.two: checks · pick · names · g3 · b1) */
 function twoLine(pc){const t=MK()&&MK().trainer(pc);if(!t||!t.misagOut)return '';const w=t.misagOut.two;if(!w)return `<div class="awtwo"><b>2체 기준</b><small>제작기에서 이 트레이너를 한 번 저장하면 보여요</small></div>`;const nd=w.need||{};const cnt=(L,k)=>nd[k]!=null?` (${L.length}/${nd[k]})`:'';const nm=k=>((w.names||{})[k]||[]).filter(Boolean);const o=nm('o'),c=nm('c');const g=w.g3||{};const ck=(w.checks||[]).filter(Boolean);
  const chip=(l,v)=>`<span><small>${esc(l)}</small> <b>${esc(v)}</b></span>`;
  return `<div class="awtwo"><b>2체 기준</b>${chip('4식'+cnt(o,'o'),o.length?o.join(' · '):'안 고름')}${chip('6령'+cnt(c,'c'),c.length?c.join(' · '):'안 고름')}${g.aw||g.pl?chip('3계제권',`각성체 ${g.aw||'-'} · PL ${g.pl||'-'}`):''}${w.b1?chip('통솔 B-1','각성체 2체 모두 지정 타입'):''}${w.role?chip('역할','중복 불가'):''}${ck.length?`<span class="awtwock">${ck.map(x=>`⚠ ${esc(x)}`).join('<br>')}</span>`:''}</div>`}
 function idCard(pc){if(!canSend(pc))return '';const S=[1,2].map(n=>slot(sidOf(pc,n)));const any=S.some(x=>x.img||x.note);
  return twoLine(pc)+`<div class="awid"><b>✦ 각성체</b><span class="awidt">${S.filter(x=>x.img).map(x=>`<i style="background-image:url('${cssu(x.img)}')" title="각성체 ${x.n}"></i>`).join('')}<small>${any?S.filter(x=>x.note).map(x=>esc(x.note.slice(0,40))).join(' · ')||'그림 있음':'각성체 그림과 바라는 점을 넣으면 어울리는 원전 인물을 골라 드려요'}</small></span><button type="button" class="btn xs" onclick="NT_AWK.sendBox('${esc(pc)}')">${any?'고치기':'넣기'}</button></div>`}
 function sendBox(id){const pc=sidPc(id);if(!canSend(pc))return;const S=[1,2].map(n=>slot(sidOf(pc,n)));const own=S.map(x=>x.own?slotRaw(pc,x.n).img:'');
  const md=N().openModal(`<div class="mhead"><h2>✦ 각성체 · ${esc(pcName(pc))}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">각성체는 은열쇠로 부르는 간이 영령 — 역사 · 설화 속 인물이 마이너하거나 열화된 모습으로 와요. 각성체 그림을 넣으면 그 모습에 어울리는 원전 인물을 골라 드려요. 제작기에서 각성체로 표시한 포켓몬 그림이 있으면 그걸 써요(여기 올린 그림이 먼저).</p>
   ${S.map((x,i)=>`<div class="awsend awslot"><div class="awsimg ${x.img?'on':''}" data-si="${i}" style="${x.img?`background-image:url('${cssu(x.img)}')`:''}">${x.img?'':'각성체 '+x.n+' 그림<br><small>끌어다 놓기 · 누르기</small>'}</div>
    <label class="lbl awsnote">각성체 ${x.n}${x.mname?` <small class="dim">제작기 「${esc(x.mname)}」</small>`:''}<textarea data-sn="${i}" rows="4" placeholder="예: 그림의 소품(거울 · 부채)이나 분위기 설명, 바라는 지역 · 시대, 피하고 싶은 인물">${esc(x.note)}</textarea>${own[i]?`<button type="button" class="linkbtn small" data-sx="${i}">올린 그림 빼기</button>`:''}
    ${(()=>{const P=pref(pc,x.n);const opts=PRIDES.includes(P.pride)||!P.pride?PRIDES:[P.pride].concat(PRIDES);return `<div class="awsprefs"><label class="awemain ${P.main?'on':''}"><input type="radio" name="awsm" data-sm="${i}" ${P.main?'checked':''}> 메인 (대가)</label>
     <label class="awepr">프라이드<select data-sp="${i}"><option value="">${P.mk?'자동':'미정'}</option>${opts.map(v=>`<option ${v===P.pride?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
     <label class="awepr awcost" ${P.main?'':'hidden'}>대가 분류<select data-sc="${i}"><option value="">감우가 추천</option>${CPICK.map(v=>`<option ${v===x.cost?'selected':''} title="${esc(COSTT[v])}">${esc(v)}</option>`).join('')}</select></label>
     <small class="dim awcostt" ${P.main?'':'hidden'}>${x.cost?esc(COSTT[x.cost]||''):'정해 두면 그 대가가 어울리는 인물로 골라 드려요'}</small>${P.mk?'<small class="dim">⇄ 제작기 값</small>':''}</div>`})()}</label></div>`).join('')}
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awSOk">저장</button></div>`,'wide');
  $$('[data-si]',md).forEach(bx=>{const i=+bx.dataset.si;N().bindDrop(bx,async fs=>{try{own[i]=await N().upload(fs[0],'photo','awk');bx.style.backgroundImage=`url('${cssu(own[i])}')`;bx.classList.add('on');bx.innerHTML=''}catch(e){N().toast('올리기 실패: '+(e.message||e))}})});
  $$('[data-sx]',md).forEach(b=>b.onclick=()=>{const i=+b.dataset.sx;own[i]='';const bx=$(`[data-si="${i}"]`,md);const m=mkAw(pc)[i];const mi=m?MK().img(m):'';bx.style.backgroundImage=mi?`url('${cssu(mi)}')`:'';if(!mi){bx.classList.remove('on');bx.innerHTML='각성체 '+(i+1)+' 그림'}b.remove()});
  const syncMain=()=>$$('[data-sm]',md).forEach(r=>{const i=+r.dataset.sm;r.parentElement.classList.toggle('on',r.checked);const w=r.closest('.awsprefs');$$('.awcost,.awcostt',w).forEach(e=>e.hidden=!r.checked)});
  md.addEventListener('change',e=>{if(e.target.matches('[data-sm]'))syncMain();if(e.target.matches('[data-sc]')){const w=e.target.closest('.awsprefs');const t=$('.awcostt',w);if(t)t.textContent=e.target.value?COSTT[e.target.value]||'':'정해 두면 그 대가가 어울리는 인물로 골라 드려요'}});
  $('#awSOk',md).onclick=async()=>{const cur=Object.assign({},pcp(pc));const P0=[1,2].map(n=>pref(pc,n));
   cur.awk=[0,1].map(i=>{const o=Object.assign({},slotRaw(pc,i+1),{img:own[i]||'',note:$(`[data-sn="${i}"]`,md).value.trim()});o.main=$(`[data-sm="${i}"]`,md).checked;o.pride=$(`[data-sp="${i}"]`,md).value;const c=$(`[data-sc="${i}"]`,md).value;if(c&&o.main)o.cost=c;else delete o.cost;return o});delete cur.awk_img;delete cur.awk_note;
   try{await N().put('pcp',pc,cur,'pl:'+pc)}catch(e){return N().toast('저장하지 못했어요: '+(e.message||e))}N().closeModal();
   const main=cur.awk.some((s,i)=>s.main!==P0[i].main);const prN=[1,2].filter(n=>cur.awk[n-1].pride&&cur.awk[n-1].pride!==P0[n-1].pride);
   if(main||prN.length)await mkSync(pc,cur.awk,main,prN);else N().toast('저장했어요')}}

 N().MOD.awk={render:entry};
 N().MOD.awdb={render};
 return {load,all,byId,applyRead,vocab,idCard,sendBox};
})();
