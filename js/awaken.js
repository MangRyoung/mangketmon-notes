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
     저장 = 07_이미지\미사그\<트레이너>\(포트 · 스탠딩) · <트레이너>\각성체 n\(포트 · 스탠딩). NAI 「배경 지우기」(augment bg-removal)는 Anlas 를 써서 쓰지 않는다 — 스탠딩은 뽑을 때 V5 투명 배경 설정(10-30 Anlas 소모 일).
   10-31 망령 「감우 결과 넣기 하고 나면 결과 반영된 거 정리해서 보여 주는 창」: 넣은 뒤 resultBox — 칸마다 그림 · 요약 · 1순위 · 후보(타입 · 대가 · 종족치 · 특성) · 「✦ 고치기 창」.
   10-31 망령 「시트 각성체 칸에서 포트 · 조건 설정해서 곧바로 트레이너 쪽에 각성체로 추가하고 그쪽으로 이동」「타입 · 종족치 · 특성은 GM 이 정해 두거나 감우가 추천에 포함」:
     고치기 창(sendBox, GM)에 칸마다 「제작」 줄 — 타입 2 · 종족치 6 · 특성(제작기 특성 DB 목록). 저장 = awk/<sid>.spec {t[],base[6],ab}. 원전을 고르면 그 후보의 추천(t · base · ab)으로 채운다.
     「⇪ 시트에 각성체로」= 저장 → 제작기 트레이너에 각성체 포켓몬 시트를 만들거나(그 칸 시트가 있으면 덮어쓰기 확인) → 그 트레이너 시트로 이동(NT_PC.select).
     감우 결과 꼴에 후보마다 base(종족치 6) · ab(특성) 추천을 더했다. 묶음 글은 JSON 과 함께 꾸민 결과 목록(문서)도 달라고 한다. */
"use strict";
window.NT_AWK=(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const MK=()=>window.NT_MAKER;
 const U={mode:'pc',sel:'',q:'',fame:0,fate:false,taken:true,recOnly:(()=>{try{return localStorage.getItem('nt_aw_reconly')==='1'}catch(e){return false}})(),hideDone:(()=>{try{return localStorage.getItem('nt_aw_hidedone')==='1'}catch(e){return false}})(),hideFix:(()=>{try{return localStorage.getItem('nt_aw_hidefix')==='1'}catch(e){return false}})(),reg:new Set(),cat:'',type:'',cost:'',more:0,busy:false,dbq:'',dbreg:'',open:''};
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
 /* 10-31 망령 「NPC 시트도 추가하면 각성체 칸에 등록되지?」: 각성체가 있는 NPC(제작기 각성체 포켓몬 · 칸 그림/코멘트 · 감우 결과)도 PC 뒤에 같이 */
 const isNpc=id=>!N().data('pc',id)&&!!N().data('npc',id);
 const pvis=id=>isNpc(id)?'gm':'pl:'+id;
 const npcAw=()=>N().gm()?N().list('npc').filter(p=>{const id=p.id;if(N().data('pc',id))return false;const L=(N().data('pcp',id)||{}).awk;return mkAw(id).length||(Array.isArray(L)&&L.some(x=>x&&(x.img||x.note||x.src||x.fixed)))||N().data('awk',id+'~1')}).sort((a,b)=>(a.order||0)-(b.order||0)):[];
 const pcs=()=>N().list('pc').sort((a,b)=>(a.order||0)-(b.order||0)).concat(npcAw());
 const rec=id=>N().data('awk',id)||{};
 async function save(id,fn){const cur=N().clone(rec(id));const r=fn(cur);if(r===false)return;await N().put('awk',id,cur,'gm')}
 /* 다른 PC 가 고른 후보 → {후보 id: PC 이름} */
 function takenMap(except){const M={};for(const p of N().list('awk')){if(p.id===except||!p.pick||!String(p.id).includes('~'))continue;M[p.pick]=subName(p.id)}return M}
 const portrait=id=>{const p=N().data('pc',id)||N().data('npc',id)||{};const t=MK()&&MK().trainer(id);return p.image||(t&&t.image)||''};
 const pcp=id=>N().data('pcp',id)||{};
 const sidOf=(pc,n)=>pc+'~'+n;const sidPc=x=>String(x).split('~')[0];const sidN=x=>+String(x).split('~')[1]||1;
 const mkAw=pc=>{try{return MK()?MK().mons(pc).filter(m=>m.awaken==='free'||m.awaken==='c'):[]}catch(e){return []}};
 const slotRaw=(pc,n)=>{const L=pcp(pc).awk;return (Array.isArray(L)&&L[n-1])||{}};
 function slot(sid){const pc=sidPc(sid),n=sidN(sid);const s=slotRaw(pc,n);const m=mkAw(pc)[n-1];const mi=m?(MK().img(m)||''):'';return {sid,pc,n,img:s.img||mi,own:!!s.img,note:s.note||'',pid:m?m.id:'',mname:m?(m.name||''):'',kind:m?m.awaken:(s.main?'free':(()=>{const o=n===1?2:1,om=mkAw(pc)[o-1];return (om?om.awaken==='free':!!slotRaw(pc,o).main)?'c':''})()),pride:(m&&m.pride)||s.pride||'',cost:s.cost||'',src:s.src||'',fixed:s.fixed||null}}
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
 const pcName=id=>{const p=N().data('pc',id)||N().data('npc',id)||{};const t=MK()&&MK().trainer(id);return p.name||(t&&t.name)||id};

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
  /* 10-31 망령 「각성체 DB 에서 확정난 친구들은 안 보이게」: 확정(pcp.awk[n].fixed)한 각성체 칸 · 그 원전 인물을 숨기는 단추 (이 브라우저에 기억) */
  const L0=subs();const nFix=L0.filter(x=>slot(x.id).fixed).length;const L=U.hideFix?L0.filter(x=>!slot(x.id).fixed):L0;if(!U.sel||!L.some(x=>x.id===U.sel))U.sel=(L[0]||{}).id||'';
  const hf=`<label class="small awhf" title="원전을 확정한 각성체 칸과, 후보 DB 에서 이미 확정에 쓴 인물을 숨겨요"><input type="checkbox" data-aw="hidefix" ${U.hideFix?'checked':''}> 확정된 각성체 숨기기 <b>${nFix}</b></label>`;
  el.innerHTML=`<div class="toolbar"><h2>각성체 DB</h2><div class="seg"><button data-aw="mode" data-v="pc" class="${U.mode==='pc'?'on':''}">각성체 별 추천</button><button data-aw="mode" data-v="db" class="${U.mode==='db'?'on':''}">후보 DB ${all().length}명</button></div><span class="note">은열쇠로 부르는 간이 영령 · 마이너하거나 열화된 모습이 기본</span><span class="sp"></span><button class="btn sm pri" data-aw="bundle" title="각성체 칸마다 넣어 둔 그림 · 코멘트를 그림 한 장 + 글 하나로 묶어요 — 대화에 그대로 붙여 넣으면 감우가 한 번에 읽어요">📦 감우에게 보낼 묶음</button><button class="btn sm" data-aw="pasteall" title="감우가 여러 PC 결과를 한 번에 준 것을 붙여 넣어요">📋 묶음 결과 넣기</button>${DB.err?`<span class="small" style="color:var(--red)">기본 목록을 못 읽었어요: ${esc(DB.err)}</span>`:''}</div>
   <div class="awhfbar">${hf}</div>
   ${U.mode==='db'?dbView():L.length?`<div class="awk"><div class="awpcs">${L.map(pcChip).join('')}</div>${U.sel?pcView(U.sel):''}</div>`:L0.length?'<div class="empty">모든 각성체가 확정됐어요. 「확정된 각성체 숨기기」를 끄면 다시 보여요.</div>':'<div class="empty">PC 시트가 없어요. 시트 탭에서 PC 를 먼저 넣어 주세요.</div>'}`;
  el.addEventListener('click',onClick);el.addEventListener('input',onInput);el.addEventListener('change',onInput);
  const td=el.querySelector('[data-awtagd]');if(td)td.addEventListener('toggle',()=>{U.tagOpen=td.open})}
 function pcChip(p){const r=rec(p.id);const img=subImg(p.id);const pk=r.pick&&byId(r.pick);const fx=slot(p.id).fixed;
  return `<button type="button" class="awpc ${p.id===U.sel?'on':''} ${fx?'fixed':''}" data-aw="sel" data-v="${esc(p.id)}"><i style="${img?`background-image:url('${cssu(img)}')`:''}"></i><span><b>${isNpc(sidPc(p.id))?'<em class="awnpc">NPC</em>':''}${esc(subName(p.id))}</b><small>${fx?'✦ 확정 · '+esc(fx.n||''):pk?'✓ '+esc(pk.n):(r.cands||[]).length?'후보 '+(r.cands||[]).length:r.read?'읽음':subNote(p.id)||slot(p.id).own?'보낼 준비':'—'}</small></span></button>`}
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
   ${pickedBox(id,r)}
   <div class="awres">${extraCards(id,rd)}${res.slice(0,N0).map(x=>card(id,x,r)).join('')||(U.recOnly?(extraCards(id,rd)?'':'<div class="empty">아직 감우 추천이 없어요. 「📦 원전 추천 묶음」으로 받아 오거나 「감우 추천만 보기」를 꺼 주세요.</div>'):'<div class="empty">조건에 맞는 후보가 없어요. 지명도 · 지역 조건을 넓혀 보세요.</div>')}</div>
   ${res.length>N0?`<div class="row" style="justify-content:center;margin-top:10px"><button class="btn sm ghost" data-aw="more">더 보기 (${res.length-N0}명 더)</button></div>`:''}
  </div>`}
 function tagPicker(sel){const G=DB.groups||{};return `<details class="awtags card" ${U.tagOpen?'open':''} data-awtagd><summary class="row"><b>태그</b><small class="dim">${sel.length?`고른 태그 ${sel.length}개 · ${sel.slice(0,6).map(esc).join(' · ')}${sel.length>6?' …':''}`:'외형 · 분위기 · 소품 — 고른 태그가 많이 겹칠수록 위로'}</small><span class="sp"></span>${sel.length?`<button class="linkbtn small" data-aw="tagclr">비우기</button>`:''}<small class="dim">${U.tagOpen?'접기 ▴':'펼치기 ▾'}</small></summary>
   ${Object.entries(G).filter(([g])=>g!=='풍').map(([g,L])=>`<div class="awtg"><span>${esc(g)}</span>${L.map(t=>`<button type="button" class="chip ${sel.includes(t)?'on':''}" data-aw="tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>`).join('')}
   <div class="awtg"><span>풍</span>${(G['풍']||[]).map(t=>`<button type="button" class="chip ${sel.includes(t)?'on':''}" data-aw="tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div></details>`}
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
 function pickedBox(id,r){const x=slot(id);const fx=x.fixed;const nm=curName(id);const e=nm?(candOf(id,nm)||{n:nm}):null;const C=(r.cands||[]).map(byId).filter(Boolean);const sp=r.spec||(e?specOfCand(e):null);
  return `<div class="awpick card ${fx?'fixed':''}"><div class="row"><b>각성체 ${x.n} 칸</b>${fx?`<span class="awfix">✦ 확정</span>`:''}<span class="sp"></span>
    ${nm?`<button class="btn sm ${fx?'':'pri'}" data-aw="fix" data-v="${esc(id)}" title="확정하면 「보낼 묶음」에서 빠지고 칸 테두리가 바뀌어요 (플레이어에게도 보여요)">${fx?'확정 풀기':'✦ 확정'}</button><button class="btn sm pri" data-aw="mkmon" data-v="${esc(id)}" title="제작기 트레이너에 이 칸 각성체 시트를 만들거나 고친 뒤 그 시트로 가요">⇪ 시트에 각성체로</button>`:''}<button class="btn sm" data-aw="sendedit" data-v="${esc(id)}" title="그림 · 코멘트 · 메인/프라이드 · 제작 설정(타입 · 종족치 · 특성)">✎ 고치기 창</button>${nm&&!fx?`<button class="btn sm ghost" data-aw="clr" data-v="${esc(id)}">비우기</button>`:''}</div>
   ${nm?`<div class="awpk"><b>${esc(nm)}</b> ${e&&e.o?`<small class="dim">${esc(e.o)}</small>`:''} ${e&&e.k?`<small>은열쇠 · ${esc(e.k)}</small>`:''}${e&&e.cost?` <small class="awcostrec">대가 추천 · ${esc(e.cost)}</small>`:''}${r.made?` <span class="visb">제작기에 만듦 ${esc(String(r.made.at||'').slice(5,10))}</span>`:''}</div>${specBlock(sp,'big')||'<div class="small dim" style="margin-top:6px">타입 · 종족치 · 특성은 「✎ 고치기 창」에서 정해요</div>'}`:'<div class="small dim">아래 카드를 누르면 이 칸에 들어가요 — 타입 · 종족치 · 특성 추천도 같이.</div>'}
   ${C.length?`<div class="awcands"><small class="dim">☆ 후보</small>${C.map(c=>`<span class="chip static ${c.n===nm?'on':''}">${esc(c.n)} <button type="button" class="linkbtn" data-aw="apply" data-v="${esc(c.id)}" title="이 칸에 넣기">✦</button><button type="button" class="linkbtn" data-aw="cand" data-v="${esc(c.id)}" title="후보에서 빼기">✕</button></span>`).join('')}</div>`:''}</div>`}
 function card(id,x,r){const e=x.e;const on=(r.cands||[]).includes(e.id),cur=curName(id)===e.n;const open=U.open===e.id;const rp=((r.read||{}).picks||[]).find(q=>q.id===e.id);const sp=specOfCand(rp?candOf(id,e.n):e);
  return `<div class="awc card awc-click ${cur?'pk':on?'on':''}" data-aw="apply" data-v="${esc(e.id)}" title="누르면 이 칸에 넣어요">
   <div class="awch"><b>${esc(e.n)}</b>${e.o?`<small class="dim">${esc(e.o)}</small>`:''}<span class="sp"></span>${rp?'<span class="awbdg rec">감우 추천</span>':''}${e.own?'<span class="awbdg own">직접 추가</span>':''}${e.x?'<span class="awbdg" title="Fate 에 서번트로 나온 인물이에요 — 열화판으로만">Fate</span>':''}<span class="awsc" title="맞은 태그 점수">${x.s?x.s.toFixed(1):'-'}</span></div>
   <div class="awmeta"><span>${esc(e.r||'')}${e.e?' · '+esc(e.e):''}</span><span>${esc(e.c||'')}</span><span class="awfm" title="지명도 ${e.f}/5">${stars(e.f)}</span></div>
   ${e.l?`<p class="awl">${esc(e.l)}</p>`:''}
   ${specBlock(sp)||((e.t||[]).length?`<div class="awspk"><div class="awspk-t">${(e.t||[]).map(tchip).join('')}</div></div>`:'')}
   ${x.why?`<p class="awwhy">🔍 ${esc(x.why)}</p>`:''}
   ${kvRows([['열화',e.d],['은열쇠',e.k],['대가 추천',x.cost,'awcostrec'],['대가 성향',e.w]])}
   ${x.hit.length?`<div class="awft"><small class="awhit">태그 · ${x.hit.map(esc).join(' · ')}</small></div>`:''}
   ${open?`<div class="awtags2">${(e.g||[]).map(t=>`<span class="chip xs static">${esc(t)}</span>`).join('')}</div>`:''}
   <div class="awbtn2"><div class="awlinks"><button type="button" class="linkbtn small" data-aw="open" data-v="${esc(e.id)}">${open?'태그 접기':'태그'}</button><button type="button" class="linkbtn small" data-aw="dbedit" data-v="${esc(e.id)}" title="후보 DB 의 이 인물 고치기 (타입 · 종족치 · 특성 포함)">✎ 고치기</button>${rp?`<button type="button" class="linkbtn small" data-aw="pdrop" data-v="${esc(e.id)}" title="이 칸의 감우 추천에서만 빼요">✕ 빼기</button>`:''}<span class="sp"></span><button type="button" class="btn xs ${on?'':'ghost'}" data-aw="cand" data-v="${esc(e.id)}" title="☆ 후보 = 나중에 비교할 목록">${on?'★ 후보':'☆ 후보'}</button></div><button type="button" class="btn sm awgo ${cur?'pri':''}" data-aw="apply" data-v="${esc(e.id)}">${cur?'✦ 이 칸에 들어가 있어요':'✦ 이 칸에 넣기'}</button></div></div>`}
 /* 포트 읽기가 DB 밖에서 찾아온 후보 — 맨 앞에 */
 function extraCards(id,rd){const X=(rd&&rd.extra)||[];const have=new Set(all().map(e=>e.n));const cn=curName(id);
  return X.map((e,i)=>{const inDb=have.has(e.n);const cur=cn===e.n;return `<div class="awc card extra awc-click ${cur?'pk':''}" data-aw="xapply" data-v="${i}" title="누르면 이 칸에 넣어요"><div class="awch"><b>${esc(e.n)}</b>${e.o?`<small class="dim">${esc(e.o)}</small>`:''}<span class="sp"></span>${i===0?'<span class="awbdg rec">1순위</span>':''}<span class="awbdg">DB 밖</span></div>
   <div class="awmeta"><span>${esc(e.r||'')}${e.e?' · '+esc(e.e):''}</span><span>${esc(e.c||'')}</span><span class="awfm">${stars(e.f||2)}</span></div>${e.l?`<p class="awl">${esc(e.l)}</p>`:''}
   ${specBlock(specOfCand(e))}
   ${e.why?`<p class="awwhy">🔍 ${esc(e.why)}</p>`:''}
   ${kvRows([['열화',e.d],['은열쇠',e.k],['대가 추천',e.cost,'awcostrec'],['대가 성향',e.w]])}
   <div class="awbtn2"><div class="awlinks"><button type="button" class="linkbtn small" data-aw="xedit" data-v="${i}">✎ 고치기</button><button type="button" class="linkbtn small" data-aw="xdrop" data-v="${i}">✕ 빼기</button>${inDb?'<small class="dim">DB 에 있음</small>':`<button type="button" class="linkbtn small" data-aw="xadd" data-v="${i}">＋ DB 에 넣기</button>`}</div><button type="button" class="btn sm awgo ${cur?'pri':''}" data-aw="xapply" data-v="${i}">${cur?'✦ 이 칸에 들어가 있어요':'✦ 이 칸에 넣기'}</button></div></div>`}).join('')+`<button type="button" class="awc card awc-add" data-aw="xnew"><b>＋ 추천 후보 직접 더하기</b><small class="dim">이 칸 추천 목록에 이름 · 타입 · 종족치 · 특성을 적어 넣어요</small></button>`}

 /* ----- 후보 DB 보기 ----- */
 function dbView(){const q=U.dbq.toLowerCase();const FX={};for(const x of subs()){const f=slot(x.id).fixed;if(f&&f.id)FX[f.id]=subName(x.id)}const L=all().filter(e=>(!U.hideFix||!FX[e.id])&&(!U.dbreg||e.r===U.dbreg)&&(!q||[e.n,e.o,e.l,e.d,e.k,(e.g||[]).join(' ')].join(' ').toLowerCase().includes(q)));
  const R=regions();const cnt=r=>all().filter(e=>e.r===r).length;
  return `<div class="awdb"><div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><input type="search" data-aw="dbq" id="awDbQ" data-live placeholder="이름 · 태그 · 설명 찾기" value="${esc(U.dbq)}" style="flex:1;min-width:160px"><span class="small dim">넣을 칸</span>${slotPick(U.sel||(subs()[0]||{}).id)}<button class="btn sm pri" data-aw="dbadd">＋ 직접 추가</button></div>
   <div class="awreg" style="margin-bottom:8px"><button type="button" class="chip xs ${!U.dbreg?'on':''}" data-aw="dbreg" data-v="">전부 ${all().length}</button>${R.map(r=>`<button type="button" class="chip xs ${U.dbreg===r?'on':''}" data-aw="dbreg" data-v="${esc(r)}">${esc(r)} ${cnt(r)}</button>`).join('')}</div>
   <div class="tblwrap"><table class="awtbl"><thead><tr><th>이름</th><th>지역 · 시대</th><th>분류</th><th>지명도</th><th>타입 · 종족치 · 특성</th><th>대가</th><th>은열쇠</th><th></th></tr></thead><tbody>${L.map(e=>`<tr><td><b>${esc(e.n)}</b>${FX[e.id]?` <span class="awbdg fix" title="이미 확정한 원전">✦ ${esc(FX[e.id])}</span>`:''}${e.x?' <span class="awbdg">Fate</span>':''}${e.own?' <span class="awbdg own">직접</span>':''}<div class="small dim">${esc(e.l||'')}</div></td><td>${esc(e.r||'')}<div class="small dim">${esc(e.e||'')}</div></td><td>${esc(e.c||'')}</td><td class="awfm">${stars(e.f)}</td><td>${specBlock(specOfCand(e),'tbl')||(e.t||[]).map(tchip).join(' ')}</td><td>${esc(e.w||'')}</td><td class="small">${esc(e.k||'')}</td><td class="awtbl-act"><button class="btn xs pri" data-aw="dbapply" data-v="${esc(e.id)}" title="위에서 고른 각성체 칸에 넣어요">✦ 넣기</button>${e.own?`<button class="linkbtn small" data-aw="dbedit" data-v="${esc(e.id)}">고치기</button>`:`<button class="linkbtn small" data-aw="dbedit" data-v="${esc(e.id)}" title="고친 것은 직접 추가 목록에 사본으로 저장돼요">고치기</button>`}</td></tr>`).join('')}</tbody></table></div></div>`}

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
  if(k==='pickset'||k==='apply'){const e=byId(v);return e?applyCand(id,e):undefined}
  if(k==='xapply'){const e=((rec(id).read||{}).extra||[])[+v];return e?applyCand(id,e):undefined}
  if(k==='dbapply'){const sid=U.sel||(subs()[0]||{}).id;const e=byId(v);if(!sid)return N().toast('각성체 칸이 없어요');return e?applyCand(sid,e):undefined}
  if(k==='xedit'){const e=((rec(id).read||{}).extra||[])[+v];return e?editEntry(e,{sid:id,idx:+v}):undefined}
  if(k==='xnew')return editEntry(null,{sid:id,idx:-1});
  if(k==='xdrop')return dropRec(id,'x',v);
  if(k==='pdrop')return dropRec(id,'p',v);
  if(k==='clr')return clearCand(v||id);
  if(k==='mkmon'){await MK().load();const ok=await makeMon(v||id);if(ok===false)return;return}
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
  if(k==='hidefix'){U.hideFix=t.checked;try{localStorage.setItem('nt_aw_hidefix',t.checked?'1':'0')}catch(e){}return N().render()}
  if(k==='recOnly'){U.recOnly=t.checked;try{localStorage.setItem('nt_aw_reconly',t.checked?'1':'0')}catch(e){}return N().render()}   /* 10-30 망령 「각성체 별 추천 설정에 감우가 추천해 준 것 외에 DB 는 숨기기」 */
  if(k==='cat'||k==='type'||k==='cost'){U[k]=t.value;return N().render()}
  if(k==='tosid'){U.sel=t.value;return}}

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
 async function applyRead(id,j,by){if(!id)return;if(!DB.base)await load();   /* 10-31: 후보 DB 를 아직 안 읽었으면 DB 추천(picks)이 빠지던 것 */const V=new Set(vocab());const tags=(j.tags||[]).filter(t=>V.has(t));const A=all();
  const picks=(j.picks||[]).map(p=>{const e=p.id&&byId(p.id)||A.find(x=>x.n===p.n);return e?{id:e.id,why:String(p.why||''),cost:String(p.cost||''),t:(p.t||[]).filter(t=>T2C[t]).slice(0,2),base:baseFix(p.base),ab:String(p.ab||'').trim(),so:/^(0\.5|1|1\.5|2|2\.5|3)$/.test(String(p.so||''))?String(p.so):''}:null}).filter(Boolean).slice(0,8);
  const extra=(j.extra||[]).filter(e=>e&&e.n).slice(0,6).map(e=>({n:String(e.n),o:String(e.o||''),r:String(e.r||''),e:String(e.e||''),c:String(e.c||''),f:Math.max(1,Math.min(5,+e.f||2)),l:String(e.l||''),d:String(e.d||''),k:String(e.k||''),t:(e.t||[]).filter(t=>T2C[t]).slice(0,2),w:COSTS.includes(e.w)?e.w:'',g:(e.g||[]).filter(t=>V.has(t)),why:String(e.why||''),cost:String(e.cost||''),base:baseFix(e.base),ab:String(e.ab||'').trim(),so:/^(0\.5|1|1\.5|2|2\.5|3)$/.test(String(e.so||''))?String(e.so):''}));
  await save(id,r=>{r.read={by,at:new Date().toISOString(),sum:String(j.sum||''),tags,picks,extra};r.tags=[...new Set((r.tags||[]).concat(tags))]})}
 function pasteBox(id){const md=N().openModal(`<div class="mhead"><h2>📋 ${id?'감우 결과 넣기 · '+esc(subName(id)):'묶음 결과 넣기 (여러 각성체)'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">대화에서 각성체 그림을 보여 주면 감우가 이 꼴의 JSON 을 드려요. 그대로 붙여 넣으면 태그 · 후보가 채워져요.</p>
   <textarea id="awPaste" rows="12" placeholder='{"sum":"…","tags":["우울","장발"],"picks":[{"n":"아랑","why":"…","cost":"통솔 · B-2"}],"extra":[]}' style="width:100%;font-family:var(--mono);font-size:12px"></textarea>
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awPOk">넣기</button></div>`,'wide');
  $('#awPOk',md).onclick=async()=>{await pasteApply($('#awPaste',md).value,id)}}
 /* 붙여 넣은 감우 결과 → 각 칸 추천 기록. 한 체 것({…})이면 id 칸에, 배열이면 pc · slot 으로 찾는다. 트레이너 줄(slot "t" · kind "trainer")은 건너뛴다(그림은 PC 폴더에 저장) */
 async function pasteApply(text,id){let j;const s=String(text||'').trim().replace(/^```(json)?\s*|\s*```$/g,'');if(!s){N().toast('붙여 넣은 내용이 없어요');return false}try{j=JSON.parse(s)}catch(e){N().toast('JSON 이 아니에요: '+e.message);return false}
  const many=Array.isArray(j)?j:Array.isArray(j.list)?j.list:null;
  if(!many){if(!id){N().toast('한 체 것이에요 — 각성체 DB 에서 그 각성체를 고른 뒤 「📋 감우 결과 넣기」로 넣어 주세요');return false}await applyRead(id,j,'chat');resultBox([id],[]);return true}
  const P=pcs();let n=0;const miss=[],done=[];for(const x of many){if(!x||x.kind==='trainer'||x.slot==='t')continue;const pc0=String(x.pc||'');const k=+x.slot||(pc0.includes('~')?sidN(pc0):1);let p=P.find(q=>q.id===sidPc(pc0))||P.find(q=>pcName(q.id)===x.name||pcName(q.id)===pc0||String(x.name||'').startsWith(pcName(q.id)+' '));if(!p){miss.push(x.name||x.pc||'?');continue}await applyRead(sidOf(p.id,k),x,'chat');done.push(sidOf(p.id,k));n++}
  if(done.length)resultBox(done,miss);else N().toast('넣은 칸이 없어요'+(miss.length?` · 못 찾은 PC: ${miss.join(', ')}`:''));return n>0||!miss.length}
 /* 10-31 망령 「결과 넣기 하고 나면 결과 반영된 거 정리해서 보여 주는 창」 */
 function candLine(e,first,extra){const b=e.base;return `<div class="awrc ${first?'top':''}"><div class="awrc-h"><b>${esc(e.n)}</b>${e.o?` <small class="dim">${esc(e.o)}</small>`:''}${first?' <span class="awrc-1">1순위</span>':''}${extra?'':' <span class="awrc-db">DB</span>'}<span class="sp"></span>${(e.t||[]).map(tchip).join('')}</div>
   <div class="awrc-m small">${esc([e.r,e.e,e.c].filter(Boolean).join(' · '))}${e.f?` · 지명도 ${e.f}`:''}${e.cost?` · <span class="awcostrec">대가 ${esc(e.cost)}</span>`:''}</div>
   ${e.l?`<div class="awrc-l small">${esc(e.l)}</div>`:''}${specBlock(specOfCand(e))}
   ${e.why?`<div class="awrc-w small dim">${esc(e.why)}</div>`:''}</div>`}
 function resultBox(sids,miss){const L=sids.filter((v,i,a)=>a.indexOf(v)===i);const nX=L.reduce((a,sid)=>a+(((rec(sid).read||{}).extra)||[]).length,0),nP=L.reduce((a,sid)=>a+(((rec(sid).read||{}).picks)||[]).length,0);
  const md=N().openModal(`<div class="mhead"><h2>✅ 감우 결과를 넣었어요</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">${L.length}칸 · DB 밖 새 후보 ${nX}명 · DB 후보 ${nP}명${miss&&miss.length?` · <b style="color:var(--red)">못 찾은 PC: ${esc(miss.join(', '))}</b>`:''}. 칸의 「✦ 고치기 창」에서 원전을 고르고 「⇪ 시트에 각성체로」를 누르면 바로 제작기 시트가 생겨요.</p>
   <div class="awrb">${L.map(sid=>{const r=rec(sid);const rd=r.read||{};const X=rd.extra||[];const PK=(rd.picks||[]).map(p=>Object.assign({},byId(p.id)||{n:p.n||'?'},{why:p.why,cost:p.cost},p.t&&p.t.length?{t:p.t}:{},p.base?{base:p.base}:{},p.ab?{ab:p.ab}:{}));
    return `<section class="awres-s"><div class="awres-h">${thumb(subImg(sid))}<div style="flex:1;min-width:0"><b>${esc(subName(sid))}</b><div class="small dim">${esc(gradeLine(sid))}</div></div><button type="button" class="btn xs" data-rs="${esc(sid)}">✦ 고치기 창</button></div>
     ${rd.sum?`<p class="awres-sum small">${esc(rd.sum)}</p>`:''}<div class="awres-c">${X.map((e,i)=>candLine(e,i===0,true)).join('')}${PK.map(e=>candLine(e,false,false)).join('')}</div></section>`}).join('')}</div>`,'wide');
  md.addEventListener('click',e=>{const b=e.target.closest('[data-rs]');if(b)sendBox(b.dataset.rs)});N().render()}

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
  '후보마다 그 인물에 어울리는 대가를 아래 목록 안에서 하나 추천해 주세요 (대가 없음인 칸은 "없음").',COSTLIST,
  '후보마다 제작 추천도 같이: 타입(t, 1~2개) · 종족치(base, HP/공격/방어/특공/특방/스피드 6칸) · 특성(ab, 제작기 특성 DB 에 있는 이름). 종족치 합은 그 칸 프라이드의 계단 이하(C 480 · C+ 503 · B 525 · B+ 548 · A 570, 보조는 C), 칸마다 하한(C 40 · B 45 · A 50) 이상, HP 95 · 주력 공격 105 를 넘기면 할증이 붙으니 되도록 그 안에서. 「GM 이 정한 제작 조건」이 있는 칸은 그대로 따르고 나머지만 채워 주세요.',
  '타입 고르는 법 (10-31 망령 「너무 쓰는 타입만 넣지 말고 마이너한 타입도」): ① 겉모습 하나(갑옷 → 강철 · 무사 → 격투 · 마녀 → 악)로 끝내지 말고, 그 인물을 대표하는 이야기의 한 장면 · 물건 · 재료 · 죽은 방식 · 땅에서 둘째 타입을 뽑아요 — 독살 · 저주 · 뱀 · 약초 목욕 → 독, 벼락 · 폭풍 · 전기 → 전기, 밀랍 · 누에 · 거미 · 겹눈 → 벌레, 서리 · 눈 · 차가움 → 얼음, 용 · 뱀신 · 왕권 · 괴수 → 드래곤, 진흙 · 무덤 · 들판 → 땅, 숲 · 꽃 · 나무 → 풀, 돌 · 성 · 조각상 → 바위. ② 노말 · 격투 · 악 · 강철 · 에스퍼는 그 인물의 핵심일 때만 — 「싸웠다 → 격투」「나쁜 사람 → 악」「신비 → 에스퍼」 같은 기본값으로 쓰지 않아요. ③ 한 칸 후보끼리 같은 타입 조합은 쓰지 않고, 같은 타입은 칸 안에서 2명까지(그림 자체가 그 타입인 칸 — 바다 · 불꽃 등 — 만 4명까지). 칸마다 적어도 한 명은 마이너 타입(벌레 · 독 · 전기 · 얼음 · 드래곤 · 땅 · 바위 · 풀). ④ 묶음 전체에서 18 타입을 고루 — 한 타입이 전체 타입 칸의 12% 를 넘지 않게, 안 나온 타입이 없게. ⑤ why 끝에 「· 타입 독/악 — 근거 한 마디」를 붙여요.',
  '그리고 JSON 과 함께, 사람이 보기 좋게 꾸민 결과 목록(문서)도 같이 만들어 주세요 — 맨 앞에 칸마다 1순위 · 격 · 대가를 한눈에 보는 그림, 그 아래 PC 별로 칸마다 그림 요약과 후보 표(이름 · 지역/시대 · 지명도 · 타입 · 대가 · 종족치 · 특성 · 누구인지 · 열화 · 은열쇠 · 이유).',''];
  L.forEach((p,i)=>{const r=rec(p.id);const x=slot(p.id);out.push(`${i+1}. ${subName(p.id)} (pc: ${x.pc}, slot: ${x.n})`);out.push('   '+gradeLine(p.id));if(x.note)out.push('   코멘트: '+x.note.replace(/\n/g,' / '));if((r.tags||[]).length)out.push('   고른 태그: '+r.tags.join(', '));const pk=r.pick&&byId(r.pick);if(pk)out.push('   이미 정함: '+pk.n);const sp=r.spec||{};const st=(sp.t||[]).filter(Boolean),sb=baseFix(sp.base);if(st.length||sb||sp.ab||sp.so)out.push('   GM 이 정한 제작 조건 (지켜 주세요): '+[st.length?'타입 '+st.join('/'):'',sb?'종족치 '+sb.join('/'):'',sp.ab?'특성 '+sp.ab:'',sp.so&&!sp.ab?'특성 소켓 '+sp.so+' (이 소켓의 특성으로)':''].filter(Boolean).join(' · '));out.push('')});
  out.push('돌려받을 꼴: JSON 배열 하나. [{"pc":"<pc id>","slot":<1|2>,"name":"<이름>","sum":"…","tags":[…],"extra":[{"n":"<이름>","o":"<원어 · 한자>","r":"<지역>","e":"<시대>","c":"<분류>","f":<지명도 1~5>,"l":"<누구인지 한 문장>","d":"<각성체로 올 때의 열화된 모습>","k":"<은열쇠 물건>","t":["<포켓몬 타입>"],"base":[<HP>,<공격>,<방어>,<특공>,<특방>,<스피드>],"ab":"<특성>","why":"…","cost":"<분류 · 항목>"} DB 밖 새 후보 3~5명],"picks":[{"id":"<DB id>","n":"<이름>","t":["<타입>"],"base":[…6칸],"ab":"<특성>","why":"…","cost":"<분류 · 항목>"} DB 후보 0~2명]}]');
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
 const baseFix=b=>Array.isArray(b)&&b.length===6&&b.every(v=>v!==''&&v!=null&&isFinite(+v))?b.map(v=>Math.max(1,Math.min(255,Math.round(+v)))):null;
 const sumOf=b=>(b||[]).reduce((a,v)=>a+(+v||0),0);
 const thumb=u=>`<i class="awbth ${u?'':'no'}" style="${u?`background-image:url('${cssu(u)}')`:''}"></i>`;
 function imgTargets(){const out=[];for(const p of pcs()){const pc=p.id;if(!isNpc(pc)&&!(tport(pc)||{}).fixed)out.push({id:'t:'+pc,pc,t:true});for(const n of [1,2]){const x=slot(sidOf(pc,n));if(!x.fixed&&(x.img||x.note||x.pid))out.push({id:x.sid,pc,n})}}return out}
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
 /* 후보 고치기 · 추가 — opt 없음 = 후보 DB(awkdb), opt.sid = 그 칸의 감우 추천(read.extra[idx], -1 = 새로). 10-31: 타입 · 종족치 · 특성 · 소켓도 저장 */
 function editEntry(e,opt){opt=opt||null;const X=!!(opt&&opt.sid);const isNew=X?opt.idx<0:(!e||!e.own);const d=Object.assign({n:'',o:'',r:'',e:'',c:'설화',f:2,l:'',d:'',k:'',t:[],w:'',g:[],base:null,ab:'',so:'',why:'',cost:''},e||{});const B=baseFix(d.base)||[];
  const title=X?(isNew?'추천 후보 더하기 · ':'추천 후보 고치기 · ')+esc(subName(opt.sid)):e&&e.own?'후보 고치기':e&&e.n?'후보 고치기 (사본으로 저장)':'후보 직접 추가';
  const SO=['0.5','1','1.5','2','2.5','3','3.5','4'];
  const md=N().openModal(`<div class="mhead"><h2>${title}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   ${X?`<p class="small dim" style="margin-top:0">이 칸의 감우 추천 목록에만 들어가요. 후보 DB 에도 두려면 저장한 뒤 카드의 「＋ DB 에 넣기」.</p>`:''}
   <div class="mrow"><label class="lbl">이름<input id="aeN" value="${esc(d.n)}"></label><label class="lbl">원어 · 한자<input id="aeO" value="${esc(d.o)}"></label><label class="lbl">지역<input id="aeR" list="aeRL" value="${esc(d.r)}"><datalist id="aeRL">${regions().map(r=>`<option value="${esc(r)}">`).join('')}</datalist></label><label class="lbl">시대<input id="aeE" value="${esc(d.e)}"></label></div>
   <div class="mrow"><label class="lbl">분류<select id="aeC">${['역사','설화','신화','전설','문학','괴담','서사시','민요'].map(c=>`<option ${d.c===c?'selected':''}>${c}</option>`).join('')}</select></label><label class="lbl">지명도 (1 마이너 ~ 5 유명)<select id="aeF">${[1,2,3,4,5].map(v=>`<option ${+d.f===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="lbl">대가 성향<select id="aeW"><option value="">—</option>${COSTS.map(c=>`<option ${d.w===c?'selected':''}>${c}</option>`).join('')}</select></label>${X?`<label class="lbl">대가 추천<input id="aeCost" value="${esc(d.cost)}" placeholder="예: 통솔 · B-2"></label>`:`<label class="lbl">Fate 서번트<select id="aeX"><option value="">아님</option><option value="1" ${d.x?'selected':''}>나왔음</option></select></label>`}</div>
   <label class="lbl">누구인지<textarea id="aeL" rows="2">${esc(d.l)}</textarea></label>
   <label class="lbl">열화 · 마이너한 모습<textarea id="aeD" rows="2">${esc(d.d)}</textarea></label>
   <label class="lbl">은열쇠 (부르는 물건)<input id="aeK" value="${esc(d.k)}"></label>
   ${X?`<label class="lbl">왜 이 그림에<textarea id="aeWhy" rows="2">${esc(d.why)}</textarea></label>`:''}
   <div class="sec">제작 — 타입 · 종족치 · 특성 <small class="dim">(칸에 넣을 때 고치기 창 제작 설정으로 들어가요)</small></div>
   <div class="awtg aetypes">${TYPES.map(t=>`<label class="chip aety" style="--tc:${T2C[t]}"><input type="checkbox" data-aet value="${t}" ${(d.t||[]).includes(t)?'checked':''} hidden>${t}</label>`).join('')}</div>
   <div class="aespec"><div class="awsp-st">${BASEN.map((n,k)=>`<div class="awsp-s ${gcls(grd(B[k]))}"><div class="awsp-sl"><span class="awsp-l">${n}</span><b class="awsp-rk">${grd(B[k])}</b></div><input type="number" min="1" max="255" data-aeb="${k}" value="${B[k]!=null?B[k]:''}" placeholder="—"></div>`).join('')}</div>
    <div class="row" style="gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px"><small class="dim" id="aeSum"></small><span class="sp"></span><select id="aeSo"><option value="">소켓 —</option>${SO.map(v=>`<option ${String(d.so||'')===v?'selected':''}>${v}</option>`).join('')}</select><input id="aeAb" list="aeAbL" value="${esc(d.ab||'')}" placeholder="특성" style="width:150px"><datalist id="aeAbL"></datalist><button type="button" class="btn sm" id="aeAbP">🔍 특성 DB</button></div></div>
   ${X?'':`<div class="sec">태그</div>${Object.entries(DB.groups||{}).map(([g,L])=>`<div class="awtg"><span>${esc(g)}</span>${L.map(t=>`<label class="chip"><input type="checkbox" data-aeg value="${esc(t)}" ${(d.g||[]).includes(t)?'checked':''} hidden>${esc(t)}</label>`).join('')}</div>`).join('')}`}
   <div class="mfoot">${(!X&&e&&e.own)||(X&&!isNew)?'<button class="btn ghost danger" id="aeDel">'+(X?'추천에서 빼기':'지우기')+'</button>':''}<span class="sp"></span><button class="btn pri" id="aeOk">저장</button></div>`,'wide');
  const sync=()=>$$('label.chip',md).forEach(l=>{const i=l.querySelector('input');if(i)l.classList.toggle('on',i.checked)});sync();
  const bsum=()=>{const v=$$('[data-aeb]',md).map(x=>x.value);$$('[data-aeb]',md).forEach(x=>{const c=x.closest('.awsp-s');const g=grd(x.value);c.className='awsp-s '+gcls(g);$('.awsp-rk',c).textContent=g});const n=sumOf(v);$('#aeSum',md).textContent=v.some(x=>x!=='')?`합 ${n} — C 480 · C+ 503 · B 525 · B+ 548 · A 570`:'종족치 합: C 480 · C+ 503 · B 525 · B+ 548 · A 570'};bsum();
  md.addEventListener('change',e2=>{if(e2.target.matches('[data-aet]')){const on=$$('[data-aet]:checked',md);if(on.length>2)e2.target.checked=false}sync()});md.addEventListener('input',e2=>{if(e2.target.matches('[data-aeb]'))bsum()});
  MK().db().then(()=>{const dl=$('#aeAbL',md);if(dl)dl.innerHTML=MK().abilList().map(r=>`<option value="${esc(r[1])}">`).join('')}).catch(()=>{});
  $('#aeAbP',md).onclick=()=>abilPicker($('#aeAb',md).value.trim(),1,parseFloat($('#aeSo',md).value),v=>{$('#aeAb',md).value=v;const r=MK().abil(v);if(r&&SO.includes(String(parseFloat(r[0]))))$('#aeSo',md).value=String(parseFloat(r[0]))});
  $('#aeOk',md).onclick=async()=>{const n=$('#aeN',md).value.trim();if(!n)return N().toast('이름을 적어 주세요');const ty=$$('[data-aet]:checked',md).map(x=>x.value).slice(0,2);
   const bv=$$('[data-aeb]',md).map(x=>x.value);const bb=bv.every(x=>x!=='')?bv.map(x=>Math.max(1,Math.min(255,Math.round(+x)||1))):null;if(!bb&&bv.some(x=>x!=='')&&!await N().confirmBox('종족치가 6칸 다 차지 않았어요. 종족치 없이 저장할까요?','저장'))return;
   const o={n,o:$('#aeO',md).value.trim(),r:$('#aeR',md).value.trim()||'기타',e:$('#aeE',md).value.trim(),c:$('#aeC',md).value,f:+$('#aeF',md).value,l:$('#aeL',md).value.trim(),d:$('#aeD',md).value.trim(),k:$('#aeK',md).value.trim(),t:ty,w:$('#aeW',md).value};
   if(bb)o.base=bb;const ab=$('#aeAb',md).value.trim();if(ab)o.ab=ab;const so=$('#aeSo',md).value;if(so)o.so=so;
   if(X){o.why=$('#aeWhy',md).value.trim();o.cost=$('#aeCost',md).value.trim();o.f=Math.max(1,Math.min(5,o.f));
    await save(opt.sid,y=>{y.read=Object.assign({by:'gm',at:new Date().toISOString(),sum:'',tags:[],picks:[],extra:[]},y.read||{});const L=(y.read.extra||[]).slice();if(opt.idx>=0&&L[opt.idx])L[opt.idx]=Object.assign({},L[opt.idx],o);else L.push(Object.assign({g:[]},o));y.read.extra=L});
    N().closeModal();return N().toast(isNew?'추천 후보를 더했어요':'저장했어요')}
   o.g=$$('[data-aeg]:checked',md).map(x=>x.value);if($('#aeX',md)&&$('#aeX',md).value)o.x=1;
   const nid=e&&e.id?e.id:N().uid('aw');await N().put('awkdb',nid,o,'gm');N().closeModal();N().toast(isNew&&!(e&&e.id)?'후보를 넣었어요':'저장했어요')};
  const dl=$('#aeDel',md);if(dl)dl.onclick=async()=>{if(X){N().closeModal();return dropRec(opt.sid,'x',opt.idx)}if(!await N().confirmBox(`「${d.n}」 를 직접 추가 목록에서 지울까요?${(DB.base||[]).some(x=>x.id===e.id)?' (기본 목록 것은 원래대로 돌아가요)':''}`,'지우기'))return;await N().del('awkdb',e.id);N().closeModal()}}

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
    ${G?`<div class="row" style="gap:6px;flex-wrap:wrap"><span class="small dim">${fx?'':pk?'✓ 원전 · '+esc(pk.n):x.src?'✓ 원전 · '+esc(x.src):(r.cands||[]).length?'후보 '+r.cands.length+'명':r.read?'추천 받음':'아직'}</span><span class="sp"></span><button class="btn xs ${fx||!pk?'':'pri'}" data-aw="fix" data-v="${esc(x.sid)}" title="${fx?'확정을 풀고 다시 보내기 목록에 넣어요':'원전을 직접 정해 확정해요 (고른 후보가 있으면 그 이름이 먼저 들어가요)'}">${fx?'확정 풀기':'✦ 확정'}</button><button class="btn xs" data-aw="godb" data-v="${esc(x.sid)}">추천 보기 →</button></div>`:''}</div>${prefHtml(x)}</div>`}
 /* 10-30 망령 「대가를 요구하는 메인 각성체 지정 · 프라이드 몇으로 할지」:
    칸마다 「메인 (대가)」 하나 + 프라이드. 노트 사본 = pcp/<pc>.awk[n-1].main · .pride (PL 본인 · GM).
    그 칸에 제작기 각성체 시트가 있으면 제작기 값(awaken 'free' = 대가 · 'c' = 보조, pride)을 보이고, 고치면 제작기에도 넣는다.
    시트가 아직 없으면 「⇪ 제작기 각성체로」로 만들 때 이 값으로 만든다 */
 const PRIDES=['C','C+','B','B+','A','EX'];
 /* 10-31: 프라이드별 종족치 합 · 하한 (룰북 「포켓몬 제작」 — 계산 종족치 기준) · 종족치 6칸 이름 */
 const BUDGET={C:[480,40],'C+':[503,43],B:[525,45],'B+':[548,48],A:[570,50],EX:[630,55]};
 const BASEN=['HP','공격','방어','특공','특방','스피드'];
 /* 10-31 망령 「종족치는 랭크도 보여 줘야」: 등급 구간 = 제작기 기본 표(data/db.js grade) — pc_ui 와 같은 값 */
 const GRD=[[0,'-'],[1,'E-'],[11,'E'],[31,'E+'],[40,'D-'],[46,'D'],[55,'D+'],[60,'C-'],[70,'C'],[81,'C+'],[90,'B-'],[96,'B'],[105,'B+'],[110,'A-'],[120,'A'],[131,'A+'],[140,'AA-'],[150,'AA'],[161,'AA+'],[170,'AAA-'],[180,'AAA'],[191,'AAA+'],[200,'S-'],[220,'S'],[241,'S+'],[256,'EX'],[999,'-']];
 const grd=v=>{if(v===''||v==null||isNaN(+v)||!+v)return '-';let g='-';for(const [b,c] of GRD){if(b<=+v)g=c;else break}return g};
 const gcls=g=>'g-'+({S:'s',AAA:'aaa',AA:'aa',A:'a',B:'b',C:'c',D:'d',E:'e',EX:'s'}[String(g).replace(/[+-]$/,'')]||'e');
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
  try{await N().put('pcp',pc,cur,pvis(pc))}catch(e){N().render();return N().toast('저장하지 못했어요: '+(e.message||e))}
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
 async function toggleTFix(pc){if(!N().gm())return;const cur=Object.assign({},pcp(pc));if(cur.tport&&cur.tport.fixed)delete cur.tport;else cur.tport={fixed:true,at:new Date().toISOString()};await N().put('pcp',pc,cur,pvis(pc));N().toast(cur.tport?'트레이너 포트를 확정했어요':'트레이너 포트 확정을 풀었어요')}
 /* 코멘트 한 칸 고치기 (각성체 탭에서 코멘트를 누르면) */
 function noteBox(sid){const x=slot(sid);if(!canSend(x.pc))return;
  const md=N().openModal(`<div class="mhead"><h2>✎ ${esc(subName(sid))} 코멘트</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <textarea id="awNote" rows="6" style="width:100%" placeholder="예: 그림의 소품(거울 · 부채)이나 분위기 설명, 바라는 지역 · 시대, 피하고 싶은 인물">${esc(x.note)}</textarea>
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awNOk">저장</button></div>`,'');
  const ta=$('#awNote',md);ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);
  $('#awNOk',md).onclick=async()=>{const cur=Object.assign({},pcp(x.pc));const L=[0,1].map(i=>Object.assign({},(Array.isArray(cur.awk)&&cur.awk[i])||{}));L[x.n-1].note=ta.value.trim();cur.awk=L;delete cur.awk_img;delete cur.awk_note;
   try{await N().put('pcp',x.pc,cur,pvis(x.pc));N().closeModal();N().toast('저장했어요')}catch(e){N().toast('저장하지 못했어요: '+(e.message||e))}}}
 /* 확정: pcp 의 그 칸에 {id,n,at} — 묶음에서 빠지고 테두리가 바뀐다. 풀면 지운다 */
 /* 10-29 망령 「각성체 탭에서도 확정 — 내가 정해도 되니까」: 고른 후보가 없어도 GM 이 원전 이름을 적어 확정한다. 이름이 DB 에 있으면 그 항목 id 를 붙인다 */
 async function toggleFix(sid){const x=slot(sid);const r=rec(sid);let e=r.pick&&byId(r.pick);
  if(!x.fixed){const nm=String(await N().promptBox(`각성체 ${x.n} 원전 확정`,e?e.n:x.src,'원전 이름 (예: 잔 다르크)')||'').trim();if(!nm)return;
   if(!e||nm!==e.n){const L=DB.base?all():[];const hit=L.find(q=>q.n===nm)||L.find(q=>(q.n||'').replace(/\s/g,'')===nm.replace(/\s/g,''));e=hit?{id:hit.id,n:hit.n}:{id:'',n:nm}}}
  const cur=Object.assign({},pcp(x.pc));const L=Array.isArray(cur.awk)?cur.awk.map(o=>Object.assign({},o)):[];while(L.length<x.n)L.push({});
  if(x.fixed)delete L[x.n-1].fixed;else L[x.n-1].fixed={id:e.id,n:e.n,at:new Date().toISOString()};cur.awk=L;await N().put('pcp',x.pc,cur,pvis(x.pc));N().toast(x.fixed?'확정을 풀었어요':`「${e.n}」로 확정했어요`)}
 /* 각성체 칸 그림 눌러 바꾸기 */
 function bindSlotImgs(el){$$('[data-aimg]',el).forEach(bx=>N().bindDrop(bx,async fs=>{const sid=bx.dataset.aimg;const x=slot(sid);try{const u=await N().upload(fs[0],'photo','awk');const cur=Object.assign({},pcp(x.pc));const L=Array.isArray(cur.awk)?cur.awk.map(o=>Object.assign({},o)):[];while(L.length<x.n)L.push({});L[x.n-1].img=u;cur.awk=L;await N().put('pcp',x.pc,cur,pvis(x.pc))}catch(e){N().toast('올리기 실패: '+(e.message||e))}}))}
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
 /* 10-30 망령 「이 설정에서 추천 후보 중에 고르던가 직접 입력하고 확정도」: GM 이면 칸마다 원전 줄 — 감우 추천(extra · picks) · 고른 후보 목록에서 고르거나 이름을 직접 적고 ✦ 확정.
    확정 안 하고 저장하면 DB 에 있는 이름은 고른 후보(awk.pick), 없는 이름은 칸의 src 로 남는다 */
 function srcCands(sid){const r=rec(sid);const rd=r.read||{};const out=[];const add=(n,why)=>{n=String(n||'').trim();if(n&&!out.some(q=>q.n===n))out.push({n,why:why||''})};
  if(r.pick){const e=byId(r.pick);if(e)add(e.n,'고른 후보')}(rd.extra||[]).forEach(e=>add(e.n,e.why));(rd.picks||[]).forEach(p=>add((p.id&&(byId(p.id)||{}).n)||p.n,p.why));(r.cands||[]).forEach(i=>{const e=byId(i);if(e)add(e.n,'후보 목록')});return out}
 /* 10-31 망령 「저 항목(고치기 창)에도 추천 들어가 있으면 보고 변경 — DB 쪽 카드 UI 참고」: 칸마다 추천 카드 묶음. 누르면 원전 · 제작 설정이 그 후보로 채워지고(저장해야 남음), 직접 적기 · 확정은 아래 줄 */
 function srcList(sid){const r=rec(sid);const rd=r.read||{};const out=[];const add=(n,tag)=>{n=String(n||'').trim();if(!n)return;let o=out.find(q=>q.n===n);if(!o){o={n,c:candOf(sid,n)||{n},tags:[]};out.push(o)}if(tag&&!o.tags.includes(tag))o.tags.push(tag)};
  (rd.extra||[]).forEach((e,k)=>{if(k===0)add(e.n,'1순위');add(e.n,'DB 밖')});(rd.picks||[]).forEach(p=>add((p.id&&(byId(p.id)||{}).n)||p.n,'감우 추천'));if(r.pick){const e=byId(r.pick);if(e)add(e.n,'고른 후보')}(r.cands||[]).forEach(id=>{const e=byId(id);if(e)add(e.n,'☆ 후보')});return out}
 function srcCard(i,x,cur){const c=x.c;const on=!!cur&&cur===x.n;const tg=t=>`<span class="awbdg ${t==='1순위'||t==='감우 추천'?'rec':t==='DB 밖'?'':'own'}">${esc(t)}</span>`;
  return `<div class="awc card awmc awc-click ${on?'pk':''}" data-scn="${esc(x.n)}" data-scs="${i}" title="누르면 이 칸 원전 · 제작 설정을 이 후보로 채워요 (저장을 눌러야 남아요)"><div class="awch"><b>${esc(x.n)}</b>${c.o?`<small class="dim">${esc(c.o)}</small>`:''}<span class="sp"></span>${x.tags.map(tg).join('')}</div>
   ${c.r||c.e||c.c?`<div class="awmeta"><span>${esc(c.r||'')}${c.e?' · '+esc(c.e):''}</span><span>${esc(c.c||'')}</span>${c.f?`<span class="awfm" title="지명도 ${c.f}/5">${stars(c.f)}</span>`:''}</div>`:''}${c.l?`<p class="awl">${esc(c.l)}</p>`:''}
   ${specBlock(specOfCand(c))||((c.t||[]).length?`<div class="awspk"><div class="awspk-t">${(c.t||[]).map(tchip).join('')}</div></div>`:'')}${c.why?`<p class="awwhy">🔍 ${esc(c.why)}</p>`:''}${kvRows([['대가 추천',c.cost,'awcostrec']])}
   <button type="button" class="btn sm awgo ${on?'pri':''}" data-scn="${esc(x.n)}" data-scs="${i}">${on?'✦ 지금 이 칸 원전':'✦ 이 칸에 넣기'}</button></div>`}
 function srcGrid(i,sid,cur){const L=srcList(sid);return L.length?L.map(x=>srcCard(i,x,cur)).join(''):`<p class="small dim" style="margin:0">아직 추천이 없어요 — 「📦 감우에게 보낼 묶음」으로 보내거나 아래에 직접 적어 주세요</p>`}
 function srcRow(x,i){const fx=x.fixed;const pk=rec(x.sid).pick&&byId(rec(x.sid).pick);const cur=fx?fx.n:(pk&&pk.n)||x.src||'';const n=srcList(x.sid).length;
  return `<details class="awmcs" open><summary><b>원전 고르기</b><small class="dim">감우 추천 · 고른 후보 ${n}명 — 카드를 누르면 아래 원전 · 제작 설정이 채워져요 (저장해야 남아요)</small></summary><div class="awmcg" data-scl="${i}">${srcGrid(i,x.sid,cur)}</div></details>
   <div class="awssrc"><span class="awssrc-l">원전</span><input data-sw="${i}" value="${esc(cur)}" placeholder="카드에서 고르거나 직접 적기 (예: 잔 다르크)"><label class="awemain ${fx?'on':''}" title="확정하면 「보낼 묶음」에서 빠지고 칸 테두리가 바뀌어요"><input type="checkbox" data-sf="${i}" ${fx?'checked':''}> ✦ 확정</label></div>`}
 /* 10-31 망령 「타입 · 종족치 · 특성은 GM 이 정해 두거나 감우가 추천에 포함」: 칸마다 제작 줄 (GM). 저장 = awk/<sid>.spec */
 /* 10-31: 특성 DB 고르기 창 (고치기 창 · 후보 고치기 창이 같이 쓴다) */
 function abilPicker(cur0,to,s0,onPick){const U2={q:'',so:!isFinite(s0)?'':s0<=1?'1':s0>=2.5?'2.5':String(s0)};const SO=[['','전체'],['1','~1'],['1.5','1.5'],['2','2'],['2.5','2.5+']];
  const pm=N().openModal(`<div class="mhead"><h2>🔍 특성 DB</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="awab-bar"><input id="awAbQ" placeholder="이름 · 효과 글로 찾기" value=""><span class="awab-so">${SO.map(([v,l])=>`<button type="button" class="chip ${v===U2.so?'on':''}" data-abso="${v}">소켓 ${l}</button>`).join('')}</span><small class="dim">기본 특성 TO ${to} · 0.5 넘을 때마다 계산 종족치 +45</small></div><div class="awab-list" id="awAbL"><div class="empty">특성 DB 읽는 중…</div></div>`,'wide',{stack:true});
  const draw=()=>{const L=$('#awAbL',pm);if(!L)return;if(!MK().dbReady())return;const q=U2.q.trim().toLowerCase();const cur=cur0||'';
   const R=MK().abilList().filter(r=>{const so=parseFloat(r[0]);if(U2.so==='1'&&!(so<=1))return false;if(U2.so==='1.5'&&so!==1.5)return false;if(U2.so==='2'&&so!==2)return false;if(U2.so==='2.5'&&!(so>=2.5))return false;return !q||String(r[1]).toLowerCase().includes(q)||String(r[2]||'').toLowerCase().includes(q)}).slice(0,300);
   L.innerHTML=R.length?R.map(r=>{const so=parseFloat(r[0]);return `<button type="button" class="awab-r ${r[1]===cur?'sel':''}" data-abv="${esc(r[1])}"><div class="awab-t"><b>${esc(r[1])}</b>${r[3]==='O'?'<span class="awsp-kb">틀깨기 대상</span>':''}${r[4]==='O'?'<span class="awsp-kb">방호</span>':''}<span class="sp"></span><span class="awsp-so ${isFinite(so)&&so>to?'over':''}">소켓 ${esc(r[0])}</span></div><div class="awab-e">${esc(String(r[2]||'').replace(/<br\s*\/?>/gi,' '))}</div></button>`}).join(''):'<div class="empty">맞는 특성이 없어요</div>'};
  MK().db().then(draw);const qi=$('#awAbQ',pm);qi.focus();qi.oninput=()=>{U2.q=qi.value;draw()};
  pm.addEventListener('click',e=>{const sb=e.target.closest('[data-abso]');if(sb){U2.so=sb.dataset.abso;$$('[data-abso]',pm).forEach(x=>x.classList.toggle('on',x===sb));return draw()}const r=e.target.closest('[data-abv]');if(r){N().closeModal();onPick(r.dataset.abv)}})}
 function specRow(x,i){const r=rec(x.sid);const m=x.pid&&MK()&&MK().M.pokemon.find(q=>q.id===x.pid);const sp=r.spec||(m?{t:[m.t1,m.t2].filter(v=>v&&v!=='-'),base:Array.isArray(m.base)?m.base:[],ab:m.ability||'',mk:true}:{});const T=sp.t||[],B=sp.base||[];
  const tsel=k=>`<select class="awsp-type ${T[k]&&T2C[T[k]]?'on':''}" data-st="${i}" data-k="${k}" style="${T[k]&&T2C[T[k]]?`--tc:${T2C[T[k]]}`:''}"><option value="">${k?'타입 2 (없음)':'타입 1'}</option>${TYPES.map(t=>`<option ${T[k]===t?'selected':''}>${t}</option>`).join('')}</select>`;
  const bv=k=>B[k]!=null&&B[k]!==''?String(B[k]):'';
  return `<div class="awspec"><div class="awsp-h"><b>제작 설정</b><small>${sp.mk?'⇄ 지금 제작기 시트 값':'비워 두면 감우 추천 · 고른 후보 값으로'}</small><span class="sp"></span><span class="awsp-sum" data-sbt="${i}"></span></div>
   <div class="awsp-row"><div class="awsp-f"><span class="awsp-l">타입</span><div class="awsp-tys">${tsel(0)}${tsel(1)}</div></div><div class="awsp-f grow"><span class="awsp-l">특성</span><div class="awsp-abw"><select class="awsp-so-sel" data-sso="${i}" title="특성을 아직 안 골라도 특성 소켓(특성 TO)만 정해 둘 수 있어요"><option value="">소켓 —</option>${['0.5','1','1.5','2','2.5','3','3.5','4'].map(v=>`<option value="${v}" ${String(sp.so||'')===v?'selected':''}>소켓 ${v}</option>`).join('')}</select><input class="awsp-ab" data-sab="${i}" list="awAbList" value="${esc(sp.ab||'')}" placeholder="이름을 적거나 DB 에서 고르기"><button type="button" class="btn sm awsp-abp" data-sabp="${i}">🔍 특성 DB</button></div><div class="awsp-abi" data-sabi="${i}"></div></div></div>
   <div class="awsp-st">${BASEN.map((n,k)=>`<div class="awsp-s ${gcls(grd(bv(k)))}" data-sbc="${i}" data-k="${k}"><div class="awsp-sl"><span class="awsp-l">${n}</span><b class="awsp-rk" data-sbr="${i}" data-k="${k}">${grd(bv(k))}</b></div><input type="number" min="1" max="255" step="1" inputmode="numeric" data-sb="${i}" data-k="${k}" value="${esc(bv(k))}" placeholder="—"><i class="awsp-bar"><b data-sbb="${i}" data-k="${k}"></b></i></div>`).join('')}</div>
   <div class="awsp-ft"><small class="dim">저장하고 제작기 「${esc(pcName(x.pc))}」에 이 칸 각성체 시트를 만든 뒤 그 시트로 가요</small><span class="sp"></span><button type="button" class="btn sm pri awsp-go" data-smk="${i}">⇪ 시트에 각성체로</button></div></div>`}
 function candOf(sid,n){const rd=rec(sid).read||{};const ex=(rd.extra||[]).find(e=>e.n===n);if(ex)return ex;const L=all();const db=L.find(q=>q.n===n);if(!db)return null;const p=(rd.picks||[]).find(q=>q.id===db.id)||{};return Object.assign({},db,{t:p.t&&p.t.length?p.t:db.t,base:p.base||baseFix(db.base)||null,ab:p.ab||db.ab||'',so:p.so||db.so||'',cost:p.cost||'',why:p.why||''})}
 /* 10-31 망령 「각성체 DB 에서 선택할 방법이 없잖니 — 클릭하면 각성체 칸에 반영」「타입 · 종족치도 DB 에 저장」「추천 항목을 추가 · 삭제 · 관리」 */
 const specOfCand=e=>{const o={};const t=(e&&e.t||[]).filter(t=>T2C[t]);if(t.length)o.t=t.slice(0,2);const b=baseFix(e&&e.base);if(b)o.base=b;if(e&&e.ab)o.ab=String(e.ab);if(e&&e.so)o.so=String(e.so);return o};
 const curName=sid=>{const x=slot(sid),r=rec(sid);const pk=r.pick&&byId(r.pick);return (x.fixed&&x.fixed.n)||(pk&&pk.n)||x.src||''};
 const miniSpec=sp=>{if(!sp)return '';const b=baseFix(sp.base);const t=(sp.t||[]).filter(Boolean);return [t.length?t.map(tchip).join(''):'',b?`<span class="awms">${b.map((v,i)=>`<i title="${BASEN[i]} ${grd(v)}">${v}</i>`).join('')}<small>합 ${sumOf(b)}</small></span>`:'',sp.ab?`<span class="awms-ab">특성 「${esc(sp.ab)}」</span>`:sp.so?`<span class="awms-ab">특성 소켓 ${esc(sp.so)}</span>`:''].filter(Boolean).join(' ')};
 /* 10-31 망령 「종족치도 랭크 정도는 · 특성도 효과는」: 카드 · 칸 상자에 쓰는 제작 블록 (타입 · 종족치 6칸 + 랭크 · 특성 + 소켓 + 효과) */
 const abTxt=v=>String(v||'').replace(/<br\s*\/?>/gi,' ').replace(/\s+/g,' ').trim();
 let abW=0;const abWait=()=>{if(abW||!MK())return;abW=1;MK().db().then(()=>N().render()).catch(()=>{})};
 const specBlock=(sp,cls)=>{if(!sp)return '';const b=baseFix(sp.base);const t=(sp.t||[]).filter(Boolean);if(!t.length&&!b&&!sp.ab&&!sp.so)return '';const ready=MK()&&MK().dbReady();if(sp.ab&&!ready)abWait();const r=sp.ab&&ready?MK().abil(sp.ab):null;
  return `<div class="awspk ${cls||''}">${t.length?`<div class="awspk-t">${t.map(tchip).join('')}</div>`:''}${b?`<div class="awspk-st">${b.map((v,i)=>{const g=grd(v);return `<span class="awspk-c ${gcls(g)}" title="${BASEN[i]} ${v} · ${g}"><small>${BASEN[i]}</small><b>${v}</b><em>${g}</em></span>`}).join('')}<span class="awspk-sum"><small>합</small><b>${sumOf(b)}</b></span></div>`:''}${sp.ab||sp.so?`<div class="awspk-ab"><div class="awspk-abh"><small>특성</small><b>${esc(sp.ab||'아직 — 소켓만')}</b>${r||sp.so?`<span class="awsp-so">소켓 ${esc(r?r[0]:sp.so)}</span>`:''}${r&&r[3]==='O'?'<span class="awsp-kb">틀깨기 대상</span>':''}${r&&r[4]==='O'?'<span class="awsp-kb">방호</span>':''}</div>${r?`<p>${esc(abTxt(r[2]))}</p>`:sp.ab&&ready?'<p class="dim">제작기 특성 DB 에 없는 이름이에요</p>':sp.ab?'<p class="dim">효과 읽는 중…</p>':''}</div>`:''}</div>`};
 const kvRows=L=>{const R=L.filter(([,v])=>v);return R.length?`<div class="awkv">${R.map(([k,v,c])=>`<span>${k}</span><p ${c?`class="${c}"`:''}>${esc(v)}</p>`).join('')}</div>`:''};
 async function applyCand(sid,e){if(!e||!e.n)return;const x=slot(sid);
  if(x.fixed&&x.fixed.n!==e.n&&!await N().confirmBox(`각성체 ${x.n} 칸은 「${x.fixed.n}」(으)로 확정돼 있어요.\n「${e.n}」(으)로 바꿀까요? (확정은 풀려요)`,'바꾸기'))return;
  const db=e.id&&byId(e.id);const isDb=!!(db&&db.n===e.n);const pc=x.pc,n=x.n;
  const cur=Object.assign({},pcp(pc));const L=Array.isArray(cur.awk)?cur.awk.map(o=>Object.assign({},o)):[];while(L.length<n)L.push({});const o=L[n-1];
  if(o.fixed&&o.fixed.n!==e.n)delete o.fixed;if(isDb)delete o.src;else o.src=e.n;cur.awk=L;
  const sp=specOfCand(isDb?candOf(sid,e.n):e);
  try{await N().put('pcp',pc,cur,pvis(pc));await save(sid,r=>{if(isDb){r.pick=db.id;r.cands=r.cands||[];if(!r.cands.includes(db.id))r.cands.push(db.id)}else delete r.pick;if(Object.keys(sp).length)r.spec=Object.assign({},r.spec||{},sp)})}
  catch(err){return N().toast('넣지 못했어요: '+(err.message||err))}
  N().toast(`각성체 ${n} 칸 ← 「${e.n}」${Object.keys(sp).length?' · 타입 · 종족치 · 특성도':''}`)}
 async function clearCand(sid){const x=slot(sid);if(x.fixed&&!await N().confirmBox(`확정된 「${x.fixed.n}」 도 풀고 비울까요?`,'비우기'))return;const cur=Object.assign({},pcp(x.pc));const L=Array.isArray(cur.awk)?cur.awk.map(o=>Object.assign({},o)):[];while(L.length<x.n)L.push({});delete L[x.n-1].src;delete L[x.n-1].fixed;cur.awk=L;await N().put('pcp',x.pc,cur,pvis(x.pc));await save(sid,r=>{delete r.pick})}
 async function dropRec(sid,kind,v){const r=rec(sid);const rd=r.read||{};const nm=kind==='x'?((rd.extra||[])[+v]||{}).n:(byId(v)||{}).n;if(!await N().confirmBox(`「${nm||'?'}」 를 이 칸의 감우 추천에서 뺄까요?${kind==='p'?' (후보 DB 에서는 안 지워져요)':''}`,'빼기'))return;
  await save(sid,y=>{y.read=Object.assign({extra:[],picks:[]},y.read||{});if(kind==='x')y.read.extra=(y.read.extra||[]).filter((e,i)=>i!==+v);else y.read.picks=(y.read.picks||[]).filter(p=>p.id!==v)})}
 function slotPick(cur){const L=subs();return `<select data-aw="tosid" title="후보를 넣을 각성체 칸">${L.map(p=>`<option value="${esc(p.id)}" ${p.id===cur?'selected':''}>${esc(subName(p.id))}${slot(p.id).fixed?' ✦':''}</option>`).join('')}</select>`}
 function sendBox(id){const pc=sidPc(id);if(!canSend(pc))return;const G=N().gm();const S=[1,2].map(n=>slot(sidOf(pc,n)));const own=S.map(x=>x.own?slotRaw(pc,x.n).img:'');
  const md=N().openModal(`<div class="mhead"><h2>✦ 각성체 · ${esc(pcName(pc))}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">각성체는 은열쇠로 부르는 간이 영령 — 역사 · 설화 속 인물이 마이너하거나 열화된 모습으로 와요. 각성체 그림을 넣으면 그 모습에 어울리는 원전 인물을 골라 드려요. 제작기에서 각성체로 표시한 포켓몬 그림이 있으면 그걸 써요(여기 올린 그림이 먼저).</p>
   ${S.map((x,i)=>`<div class="awsend awslot"><div class="awsimg ${x.img?'on':''}" data-si="${i}" style="${x.img?`background-image:url('${cssu(x.img)}')`:''}">${x.img?'':'각성체 '+x.n+' 그림<br><small>끌어다 놓기 · 누르기</small>'}</div>
    <label class="lbl awsnote">각성체 ${x.n}${x.mname?` <small class="dim">제작기 「${esc(x.mname)}」</small>`:''}<textarea data-sn="${i}" rows="4" placeholder="예: 그림의 소품(거울 · 부채)이나 분위기 설명, 바라는 지역 · 시대, 피하고 싶은 인물">${esc(x.note)}</textarea>${own[i]?`<button type="button" class="linkbtn small" data-sx="${i}">올린 그림 빼기</button>`:''}
    ${(()=>{const P=pref(pc,x.n);const opts=PRIDES.includes(P.pride)||!P.pride?PRIDES:[P.pride].concat(PRIDES);return `<div class="awsprefs"><label class="awemain ${P.main?'on':''}"><input type="radio" name="awsm" data-sm="${i}" ${P.main?'checked':''}> 메인 (대가)</label>
     <label class="awepr">프라이드<select data-sp="${i}"><option value="">${P.mk?'자동':'미정'}</option>${opts.map(v=>`<option ${v===P.pride?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
     <label class="awepr awcost" ${P.main?'':'hidden'}>대가 분류<select data-sc="${i}"><option value="">감우가 추천</option>${CPICK.map(v=>`<option ${v===x.cost?'selected':''} title="${esc(COSTT[v])}">${esc(v)}</option>`).join('')}</select></label>
     <small class="dim awcostt" ${P.main?'':'hidden'}>${x.cost?esc(COSTT[x.cost]||''):'정해 두면 그 대가가 어울리는 인물로 골라 드려요'}</small>${P.mk?'<small class="dim">⇄ 제작기 값</small>':''}</div>`})()}${G?srcRow(x,i)+specRow(x,i):''}</label></div>`).join('')}${G?'<datalist id="awAbList"></datalist>':''}
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="awSOk">저장</button></div>`,'wide');
  if(G)MK().db().then(()=>{const dl=$('#awAbList',md);if(dl)dl.innerHTML=MK().abilList().map(r=>`<option value="${esc(r[1])}">`).join('')}).catch(()=>{});
  const budOf=i=>{const ps=$(`[data-sp="${i}"]`,md),ms=$(`[data-sm="${i}"]`,md);const P=pref(pc,i+1);const v=(ps&&ps.value)||(P.mk?P.pride:'')||(ms&&ms.checked?'':'C');return BUDGET[v]?[v].concat(BUDGET[v]):null};
  const sbt=i=>{const el=$(`[data-sbt="${i}"]`,md);if(!el)return;const b=$$(`[data-sb="${i}"]`,md).map(x=>x.value);const n=sumOf(b);const B0=budOf(i);const adj=B0?toAdj(i):0;const B=B0?[B0[0],B0[1]+adj,B0[2]]:null;const any=b.some(v=>v!=='');
   $$(`[data-sbb="${i}"]`,md).forEach(q=>{const v=+b[+q.dataset.k]||0;q.style.width=Math.min(100,v/160*100)+'%';q.className=v&&B&&v<B[2]?'bad':''});
   $$(`[data-sbc="${i}"]`,md).forEach(c=>{const g=grd(b[+c.dataset.k]);c.className='awsp-s '+gcls(g);const r=$('.awsp-rk',c);if(r)r.textContent=g});
   el.innerHTML=B?`<em>${B[0]}</em><b>${any?n:'—'}</b><small>/ ${B[1]}${adj?` <span title="특성 TO 조정">(${adj>0?'+':''}${adj})</span>`:''}</small>${any?`<small>${n>B[1]?`· ${n-B[1]} 넘음`:`· ${B[1]-n} 남음`}</small>`:''}<small class="dim">· 하한 ${B[2]}</small>`:`<b>${any?n:'—'}</b><small>합</small>`;el.classList.toggle('over',!!B&&n>B[1]);el.classList.toggle('ok',!!B&&any&&n<=B[1]);el.classList.toggle('low',!!B&&b.some(v=>v!==''&&+v<B[2]))};
  const specGet=i=>{const t=$$(`[data-st="${i}"]`,md).map(x=>x.value).filter(Boolean);const b=$$(`[data-sb="${i}"]`,md).map(x=>x.value===''?'':Math.max(1,Math.min(255,Math.round(+x.value)||1)));const a=$(`[data-sab="${i}"]`,md);const ab=a?a.value.trim():'';const so=($(`[data-sso="${i}"]`,md)||{}).value||'';const o={};if(t.length)o.t=t;if(b.some(v=>v!==''))o.base=b;if(ab)o.ab=ab;if(so)o.so=so;return Object.keys(o).length?o:null};
  const tcol=q=>{const c=T2C[q.value];q.classList.toggle('on',!!c);if(c)q.style.setProperty('--tc',c);else q.style.removeProperty('--tc')};
  /* 10-31 망령 「특성은 제작기나 시트에서 하는 것처럼 DB 기능」: 소켓(특성 TO) · 틀깨기 · 방호 · 효과를 보며 고르는 창 */
  const toOf=i=>{const B=budOf(i);return B&&B[0]==='A'?1.5:B&&B[0]==='EX'?2:1};
  const soOf=i=>{const a=$(`[data-sab="${i}"]`,md);const r=a&&a.value.trim()&&MK().dbReady()?MK().abil(a.value.trim()):null;const v=r?parseFloat(r[0]):parseFloat(($(`[data-sso="${i}"]`,md)||{}).value);return isFinite(v)?v:null};
  const toAdj=i=>{const s=soOf(i);if(s==null)return 0;const to=toOf(i);return s>to?-Math.round((s-to)/0.5)*45:s<1?Math.round((1-s)/0.5)*25:0};   /* 예산에 더할 값: TO 를 올리면 −45 · 1 밑으로 내리면 +25 (0.5 마다) */
  const abInfo=i=>{const el=$(`[data-sabi="${i}"]`,md),a=$(`[data-sab="${i}"]`,md);if(!el||!a)return;const v=a.value.trim();if(!v){const s=soOf(i),to=toOf(i);el.innerHTML=s!=null?`<span class="awsp-so ${s>to?'over':''}">소켓 ${s}</span><small class="dim">특성은 아직 — 이 소켓 안에서 고르기</small>${s>to?`<small class="awsp-warn">기본 TO ${to} 넘음 → 계산 종족치 +${Math.round((s-to)/0.5)*45}</small>`:s<1?`<small class="dim">TO 를 내려 계산 종족치 −${Math.round((1-s)/0.5)*25} 되팔기</small>`:''}`:'';sbt(i);return}if(!MK().dbReady()){el.innerHTML='<small class="dim">특성 DB 읽는 중…</small>';return}const r=MK().abil(v);if(!r){el.innerHTML='<small class="awsp-warn">제작기 특성 DB 에 없는 이름이에요</small>';return}
   const so=parseFloat(r[0]);const ss=$(`[data-sso="${i}"]`,md);if(ss&&isFinite(so)&&[...ss.options].some(o=>o.value===String(so)))ss.value=String(so);sbt(i);const to=toOf(i);const ex=isFinite(so)&&so>to?Math.round((so-to)/0.5)*45:0;el.innerHTML=`<span class="awsp-so ${ex?'over':''}">소켓 ${esc(r[0])}</span>${r[3]==='O'?'<span class="awsp-kb">틀깨기 대상</span>':''}${r[4]==='O'?'<span class="awsp-kb">방호</span>':''}${ex?`<small class="awsp-warn">기본 TO ${to} 넘음 → 계산 종족치 +${ex}</small>`:''}<div class="awsp-abe">${esc(String(r[2]||'').replace(/<br\s*\/?>/gi,' '))}</div>`};
  function abPick(i){const a=$(`[data-sab="${i}"]`,md);abilPicker(a?a.value.trim():'',toOf(i),parseFloat(($(`[data-sso="${i}"]`,md)||{}).value),v=>{if(a){a.value=v;abInfo(i)}})}
  $$('[data-sabp]',md).forEach(b=>b.onclick=()=>abPick(+b.dataset.sabp));
  [0,1].forEach(i=>{sbt(i);abInfo(i)});
  if(G)MK().db().then(()=>[0,1].forEach(abInfo)).catch(()=>{});
  md.addEventListener('input',e=>{if(e.target.matches('[data-sb]'))sbt(+e.target.dataset.sb);if(e.target.matches('[data-sab]'))abInfo(+e.target.dataset.sab)});
  $$('[data-si]',md).forEach(bx=>{const i=+bx.dataset.si;N().bindDrop(bx,async fs=>{try{own[i]=await N().upload(fs[0],'photo','awk');bx.style.backgroundImage=`url('${cssu(own[i])}')`;bx.classList.add('on');bx.innerHTML=''}catch(e){N().toast('올리기 실패: '+(e.message||e))}})});
  $$('[data-sx]',md).forEach(b=>b.onclick=()=>{const i=+b.dataset.sx;own[i]='';const bx=$(`[data-si="${i}"]`,md);const m=mkAw(pc)[i];const mi=m?MK().img(m):'';bx.style.backgroundImage=mi?`url('${cssu(mi)}')`:'';if(!mi){bx.classList.remove('on');bx.innerHTML='각성체 '+(i+1)+' 그림'}b.remove()});
  const syncMain=()=>$$('[data-sm]',md).forEach(r=>{const i=+r.dataset.sm;r.parentElement.classList.toggle('on',r.checked);const w=r.closest('.awsprefs');$$('.awcost,.awcostt',w).forEach(e=>e.hidden=!r.checked)});
  const gridUp=i=>{const el=$(`[data-scl="${i}"]`,md);const w=$(`[data-sw="${i}"]`,md);if(el)el.innerHTML=srcGrid(i,S[i].sid,w?w.value.trim():'')};
  const fillFrom=(i,n)=>{const w=$(`[data-sw="${i}"]`,md);if(w)w.value=n;const c=candOf(S[i].sid,n);if(c){if(c.t&&c.t.length)$$(`[data-st="${i}"]`,md).forEach(q=>{q.value=c.t[+q.dataset.k]||'';tcol(q)});if(c.base)$$(`[data-sb="${i}"]`,md).forEach(q=>q.value=c.base[+q.dataset.k]);const a=$(`[data-sab="${i}"]`,md),so=$(`[data-sso="${i}"]`,md);if(c.ab){if(a)a.value=c.ab}else if(c.so&&so){if(a)a.value='';so.value=String(c.so)}abInfo(i);sbt(i)}gridUp(i)};
  md.addEventListener('click',e=>{const b=e.target.closest('[data-scn]');if(!b||!md.contains(b))return;e.preventDefault();fillFrom(+b.dataset.scs,b.dataset.scn)});
  md.addEventListener('input',e=>{if(e.target.matches('[data-sw]'))gridUp(+e.target.dataset.sw)});
  if(G&&!DB.base)load().then(()=>[0,1].forEach(gridUp)).catch(()=>{});
  md.addEventListener('change',e=>{if(e.target.matches('[data-sm]'))syncMain();if(e.target.matches('[data-sq]')&&e.target.value)fillFrom(+e.target.dataset.sq,e.target.value);if(e.target.matches('[data-sp],[data-sm]')){[0,1].forEach(sbt);[0,1].forEach(abInfo)}if(e.target.matches('[data-st]'))tcol(e.target);if(e.target.matches('[data-sab]'))abInfo(+e.target.dataset.sab);if(e.target.matches('[data-sso]')){const i=+e.target.dataset.sso;const a=$(`[data-sab="${i}"]`,md);const r=a&&a.value.trim()&&MK().dbReady()?MK().abil(a.value.trim()):null;if(r&&String(parseFloat(r[0]))!==e.target.value){a.value=''}abInfo(i);sbt(i)}if(e.target.matches('[data-sf]'))e.target.parentElement.classList.toggle('on',e.target.checked);if(e.target.matches('[data-sc]')){const w=e.target.closest('.awsprefs');const t=$('.awcostt',w);if(t)t.textContent=e.target.value?COSTT[e.target.value]||'':'정해 두면 그 대가가 어울리는 인물로 골라 드려요'}});
  const doSave=async close=>{const cur=Object.assign({},pcp(pc));const P0=[1,2].map(n=>pref(pc,n));const picks=[undefined,undefined];
   cur.awk=[0,1].map(i=>{const o=Object.assign({},slotRaw(pc,i+1),{img:own[i]||'',note:$(`[data-sn="${i}"]`,md).value.trim()});o.main=$(`[data-sm="${i}"]`,md).checked;o.pride=$(`[data-sp="${i}"]`,md).value;const c=$(`[data-sc="${i}"]`,md).value;if(c&&o.main)o.cost=c;else delete o.cost;
    if(G&&$(`[data-sw="${i}"]`,md)){const nm=$(`[data-sw="${i}"]`,md).value.trim();const fx=$(`[data-sf="${i}"]`,md).checked&&!!nm;const L=DB.base?all():[];const hit=nm&&(L.find(q=>q.n===nm)||L.find(q=>(q.n||'').replace(/\s/g,'')===nm.replace(/\s/g,'')));
     if(fx){o.fixed=o.fixed&&o.fixed.n===nm?o.fixed:{id:hit?hit.id:'',n:hit?hit.n:nm,at:new Date().toISOString()}}else delete o.fixed;
     if(nm&&!hit)o.src=nm;else delete o.src;picks[i]=hit?hit.id:''}
    return o});delete cur.awk_img;delete cur.awk_note;
   try{await N().put('pcp',pc,cur,pvis(pc));for(const i of [0,1]){const v=picks[i];if(v===undefined)continue;const sid=sidOf(pc,i+1);const was=rec(sid).pick||'';const nv=v;if(nv!==was)await save(sid,r=>{if(nv)r.pick=nv;else delete r.pick})}
    if(G)for(const i of [0,1]){const sid=sidOf(pc,i+1);const nv=specGet(i);const was=rec(sid).spec||null;if(JSON.stringify(nv)!==JSON.stringify(was))await save(sid,r=>{if(nv)r.spec=nv;else delete r.spec})}}catch(e){N().toast('저장하지 못했어요: '+(e.message||e));return false}if(close)N().closeModal();
   const main=cur.awk.some((s,i)=>s.main!==P0[i].main);const prN=[1,2].filter(n=>cur.awk[n-1].pride&&cur.awk[n-1].pride!==P0[n-1].pride);
   if(main||prN.length)await mkSync(pc,cur.awk,main,prN);else if(close)N().toast('저장했어요');return true};
  $('#awSOk',md).onclick=()=>doSave(true);
  $$('[data-smk]',md).forEach(b=>b.onclick=async()=>{const i=+b.dataset.smk;const lab=b.textContent;b.disabled=true;b.textContent='저장하는 중…';if(!await doSave(false)){b.disabled=false;b.textContent=lab;return}b.textContent='만드는 중…';if(!await makeMon(S[i].sid)){b.disabled=false;b.textContent=lab}})}
 /* 10-31 망령 「포트랑 조건 설정해서 곧바로 해당 트레이너 쪽에 각성체로 추가하고 그쪽으로 이동」: 저장된 값(원전 · 메인/프라이드 · 제작 줄 · 그림)으로 제작기 각성체 시트를 만들거나 고친다 */
 async function makeMon(sid){const pc=sidPc(sid);const DBS=N().DBS();if(!DBS.makerPut||!DBS.makerGet){N().toast('이 화면에서는 제작기에 쓸 수 없어요');return false}
  await MK().load(true);const t=MK().trainer(pc);if(!t){N().toast('이 PC 는 제작기 트레이너가 없어요 — 시트 탭에서 「⇪ 제작기로」를 먼저');return false}
  const x=slot(sid);const r=rec(sid);const sp=r.spec||{};const pk=r.pick&&byId(r.pick);const nm=(x.fixed&&x.fixed.n)||(pk&&pk.n)||x.src||'';
  const e=nm?(candOf(sid,nm)||{n:nm}):null;const P=pref(pc,x.n);const aw=mkAw(pc);const m=x.pid&&MK().M.pokemon.find(q=>q.id===x.pid);
  let kind=P.main?'free':'c';if(!m&&kind==='free'&&aw.some(q=>q.awaken==='free'))kind='c';const pride=PRIDES.includes(P.pride)?P.pride:(kind==='c'?'C':'');
  const T=(sp.t||[]).filter(Boolean).length?sp.t.filter(Boolean):((e&&e.t)||[]);const B=baseFix(sp.base)||(e&&baseFix(e.base))||null;const ab=sp.ab||(e&&e.ab)||'';
  const fill=d=>{if(nm)d.name=nm;if(T.length){d.t1=T[0];d.t2=T[1]||'-'}if(B)d.base=B.slice();if(ab)d.ability=ab;d.awaken=kind;if(pride)d.pride=pride;if(x.own&&x.img)d.image=x.img;
   if(e&&e.n){const rest=String(d.memo||'').replace(/【각성체 원전】[\s\S]*?(\n\n|$)/,'').trim();d.memo=memoOf(e,e.cost||'')+(!ab&&sp.so?'\n특성 소켓: '+sp.so+' (특성은 아직)':'')+(rest?'\n\n'+rest:'')}};
  const what=[nm?`이름 「${nm}」`:'',T.length?'타입 '+T.join('/'):'',B?'종족치 '+B.join('/'):'',ab?`특성 「${ab}」`:sp.so?`특성 소켓 ${sp.so}`:'',`${kind==='free'?'각성 (대가)':'각성 (보조)'}${pride?' · 프라이드 '+pride:''}`,x.own?'그림':''].filter(Boolean).join(' · ');
  let pid=m?m.id:'';
  try{if(m){if(!await N().confirmBox(`제작기 「${t.name}」의 각성체 「${m.name||'?'}」 시트가 이미 있어요.\n이 값으로 고칠까요?\n${what}\n(포텐셜 · 기술 · 그 밖의 칸은 그대로)`,'고치기'))return false;await MK().edit('pokemon',m.id,fill)}
   else{if(aw.length>=2){N().toast('이 트레이너는 각성체가 이미 2체예요');return false}if(x.n===2&&!aw.length){N().toast('각성체 1 칸 시트를 먼저 만들어 주세요 (제작기 순서대로 칸이 정해져요)');return false}
    if(!nm&&!await N().confirmBox('원전 이름이 비어 있어요. 이름 없이 만들까요?','만들기'))return false;
    pid=Math.random().toString(36).slice(2,10);const p=Object.assign(newPoke(),{id:pid});fill(p);await DBS.makerPut('pokemon',pid,{tid:pc,data:p});await MK().edit('trainers',pc,d=>{d.pids=(d.pids||[]).concat(pid)})}
   await save(sid,y=>{y.made={pid,id:(pk&&pk.n===nm?pk.id:''),n:nm,at:new Date().toISOString()}});await MK().load(true)}
  catch(err){N().toast('제작기에 못 썼어요: '+(err.message||err));return false}
  N().closeModal();N().toast(`${m?'고쳤어요':'만들었어요'} — 「${t.name}」 시트로 갈게요`);if(window.NT_PC&&NT_PC.select)NT_PC.select(N().data('npc',pc)&&!N().data('pc',pc)?'npc':'pc',pc);return true}

 N().MOD.awk={render:entry};
 N().MOD.awdb={render};
 return {load,all,byId,applyRead,vocab,idCard,sendBox};
})();
