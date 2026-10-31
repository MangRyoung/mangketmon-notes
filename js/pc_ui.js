/* ---------- PC 시트 탭 ----------
   왼쪽: 이 캠페인의 PC 목록 (pc 문서 = 제작기 트레이너 id 로 연결). 제작기 쪽 이름 · 초상 · 랭크 · 포켓몬은 읽기 전용으로 보여 주고,
   RP 칸(배경 · 목표 · 인간관계 · 비밀 · 세션 기록)만 여기서 쓴다. 공개 칸(pub)은 모두, 「본인만」 칸은 pl:<좌석> 문서(pcp), GM 메모는 sec.
   GM: PC 추가(제작기 트레이너 고르기) · 모든 칸 편집. PL: 제 좌석 PC 의 pc · pcp 문서만 편집. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const U={sel:'',mode:'pc'};const K=()=>U.mode==='npc'?'npc':'pc';
 const MK=()=>window.NT_MAKER;
 /* 10-30 망령 「시트를 PC · 객원 · NPC 로 분류 — 폴더 접기 · 지도 · 관계도 거르기」: 시트 문서의 cls (js/cls.js). 탭(PC 시트 · NPC 시트)은 그대로 두고,
    그 안의 카드를 분류 폴더로 묶는다. 폴더 이름을 누르면 접기 · 펴기 (이 브라우저에 캠페인 · 탭마다 기억). 분류 바꾸기 = GM: 카드 우클릭 · 시트 머리의 분류 칸 */
 const CL=()=>window.NT_CLS;
 const CLS0=[['pc','PC','#d22a2a'],['guest','객원','#d9891c'],['npc','NPC','#2f6fd0']];
 const clsL=()=>CL()?CL().L:CLS0;
 const clsOf=(p,k)=>CL()?CL().of(k||K(),p):((k||K())==='npc'?'npc':'pc');
 const clsName=c=>(clsL().find(x=>x[0]===c)||clsL()[0])[1];
 const foldKey=()=>'nt-pcfold:'+(N().ST.camp||'')+':'+K();
 function foldGet(){try{const o=JSON.parse(localStorage.getItem(foldKey())||'{}');return o&&typeof o==='object'?o:{}}catch(e){return {}}}
 function foldSet(o){try{localStorage.setItem(foldKey(),JSON.stringify(o))}catch(e){}}
 /* 10-30 망령 「객원 폴더는 지시 · 육성 · 통솔 · 능력으로 세분화」: 객원 = 자질 칸 넷으로 한 번 더 나눈다.
    칸 = 시트 문서의 gsub (GM 이 고른 것), 비어 있으면 제작기 자질 중 가장 높은 것 (같으면 지시 → 육성 → 통솔 → 능력 순). 자질이 없으면 「미정」 */
 const QS=['지시','육성','통솔','능력'];
 const rkScore=v=>{const m=/^\s*(AA|A|B|C|D)\s*([+-]?)/i.exec(String(v||''));if(!m)return -1;return ({D:0,C:1,B:2,A:3,AA:4})[m[1].toUpperCase()]+(m[2]==='+'?.3:m[2]==='-'?-.3:0)};
 function gsubAuto(p){const t=MK()&&MK().trainer(p.id);const rk=(t&&t.ranks)||{};let best='',bv=-1;for(const q of QS){const v=rkScore(rk[q]);if(v>bv){bv=v;best=q}}return best}
 const gsubOf=p=>QS.includes(p&&p.gsub)?p.gsub:gsubAuto(p);
 const groups=L=>clsL().map(([c,n,col])=>{const g={c,n,col,L:L.filter(p=>clsOf(p)===c)};if(c==='guest')g.subs=QS.concat(['']).map(q=>({q,L:g.L.filter(p=>gsubOf(p)===q)})).filter(x=>x.L.length);return g}).filter(g=>g.L.length);
 /* 화면에 보이는 순서 그대로의 id 줄 (끌어서 순서 바꿀 때 다른 칸은 그대로 두려고) */
 const binsOf=L=>groups(L).flatMap(g=>g.subs?g.subs.map(x=>({key:'guest:'+x.q,L:x.L})):[{key:g.c,L:g.L}]);
 /* 10-30 망령 「드래그해서 폴더별로도 움직일 수 있게」: 비어 있는 칸도 그려 두고(평소엔 숨김) 끄는 동안만 보인다. 칸 열쇠(bin) = pc · npc · guest:<자질> */
 const BIN_ORDER=()=>clsL().flatMap(([c])=>c==='guest'?QS.map(q=>'guest:'+q).concat(['guest:']):[c]);
 function folds(L){const f=foldGet();const grid=(key,L)=>`<div class="pcgrid" data-bin="${esc(key)}">${L.map(p=>card(p)).join('')}</div>`;
  const G0=groups(L);const all=clsL().map(([c,n,col])=>G0.find(g=>g.c===c)||{c,n,col,L:[],subs:c==='guest'?[]:undefined});
  return `<div class="pcfolds">${all.map(g=>{const off=!!f[g.c];const subs=g.c==='guest'?QS.map(q=>(g.subs||[]).find(x=>x.q===q)||{q,L:[]}).concat((g.subs||[]).filter(x=>x.q==='')):null;
   return `<section class="pcfold ${off?'off':''} ${g.L.length?'':'pcempty'}" data-cls="${g.c}" style="--c:${g.col}"><button type="button" class="pcfh" data-pfold="${g.c}" data-pbin="${g.c==='guest'?'guest:*':g.c}" aria-expanded="${off?'false':'true'}"><span class="caret">▾</span><i class="kdot"></i><b>${esc(g.n)}</b><small>${g.L.length}명</small></button>${off?'':subs?`<div class="pcsubs">${subs.map(x=>{const k='guest:'+x.q;const so=!!f[k];return `<section class="pcfold pcsub ${so?'off':''} ${x.L.length?'':'pcempty'}" data-q="${esc(x.q)}"><button type="button" class="pcfh" data-pfold="${esc(k)}" data-pbin="${esc(k)}" aria-expanded="${so?'false':'true'}"><span class="caret">▾</span><b>${esc(x.q||'미정')}</b><small>${x.L.length}명</small></button>${so?'':grid(k,x.L)}</section>`}).join('')}</div>`:grid(g.c,g.L)}</section>`}).join('')}</div>`}
 /* 끌어 옮기기: 같은 칸 안 = 순서만, 다른 칸 = 분류(cls) · 객원 칸(gsub)도 바꾼다. 접힌 칸 · 폴더 이름 위에 놓으면 그 칸 맨 끝으로 */
 function bindDrag(root){if(!root||root._pcDrag)return;root._pcDrag=1;let d=null;
  const clear=()=>$$('.drop',root).forEach(x=>x.classList.remove('drop','insb','insa'));
  root.addEventListener('pointerdown',e=>{if(e.button!==0)return;const it=e.target.closest('.pccard');if(!it||!root.contains(it))return;if(e.target.closest('input,textarea,select,button:not([data-drag]),a,[data-visq],[data-fav]'))return;d={it,x:e.clientX,y:e.clientY,id:e.pointerId,moved:false,ph:null,t:null}});
  root.addEventListener('pointermove',e=>{if(!d||d.id!==e.pointerId)return;if(!d.moved){if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<6)return;d.moved=true;try{root.setPointerCapture(e.pointerId)}catch(x){}
    const r=d.it.getBoundingClientRect();d.ox=e.clientX-r.left;d.oy=e.clientY-r.top;d.ph=d.it.cloneNode(true);d.ph.className+=' nt-ghost';d.ph.style.cssText+=`;position:fixed;pointer-events:none;z-index:2000;opacity:.85;width:${r.width}px;left:${r.left}px;top:${r.top}px;margin:0`;document.body.appendChild(d.ph);d.it.classList.add('nt-dragging');root.classList.add('dragging');document.body.classList.add('nt-sorting')}
   e.preventDefault();d.ph.style.left=(e.clientX-d.ox)+'px';d.ph.style.top=(e.clientY-d.oy)+'px';
   const el=document.elementFromPoint(e.clientX,e.clientY);clear();d.t=null;if(!el||!root.contains(el))return;
   /* 다른 칸 위: 카드는 제자리에 두고 놓일 자리만 표시한다 (카드가 칸 사이를 뛰어다니면 화면이 흔들려서) */
   const h=el.closest('.pcfh[data-pbin]');if(h){h.classList.add('drop');let b=h.dataset.pbin;if(b==='guest:*'){const p=N().data(K(),d.it.dataset.id)||{};b='guest:'+gsubAuto(Object.assign({id:d.it.dataset.id},p))}d.t={bin:b,ref:'',before:false};return}
   const g=el.closest('.pcgrid');if(!g)return;const c=el.closest('.pccard');
   if(g===d.it.parentNode){if(c&&c!==d.it){const r=c.getBoundingClientRect();const before=e.clientX<r.left+r.width/2;g.insertBefore(d.it,before?c:c.nextSibling)}return}
   g.classList.add('drop');if(c){const r=c.getBoundingClientRect();const before=e.clientX<r.left+r.width/2;c.classList.add('drop',before?'insb':'insa');d.t={bin:g.dataset.bin,ref:c.dataset.id,before}}else d.t={bin:g.dataset.bin,ref:'',before:false}});
  const end=async e=>{if(!d||d.id!==e.pointerId)return;const w=d;d=null;try{root.releasePointerCapture(e.pointerId)}catch(x){}if(w.ph)w.ph.remove();w.it.classList.remove('nt-dragging');root.classList.remove('dragging');document.body.classList.remove('nt-sorting');clear();
   if(!w.moved)return;root.dataset.sorted='1';setTimeout(()=>{delete root.dataset.sorted},0);const mid=w.it.dataset.id;const home=(w.it.parentNode&&w.it.parentNode.dataset.bin)||'';
   const t=w.t&&w.t.bin!==home?w.t:null;const data=binsOf(pcs());const order=[];
   for(const key of BIN_ORDER()){const g=$(`.pcgrid[data-bin="${CSS.escape(key)}"]`,root);let ids=g?$$('.pccard',g).map(x=>x.dataset.id).filter(Boolean):((data.find(b=>b.key===key)||{}).L||[]).map(p=>p.id);
    if(t){ids=ids.filter(id=>id!==mid);if(t.bin===key){const k=t.ref?ids.indexOf(t.ref):-1;if(k<0)ids.push(mid);else ids.splice(t.before?k:k+1,0,mid)}}
    order.push(...ids.filter(id=>!order.includes(id)))}
   if(!order.includes(mid))order.push(mid);await moveTo(mid,t?t.bin:home,order)};
  root.addEventListener('pointerup',end);root.addEventListener('pointercancel',end);
  root.addEventListener('click',e=>{if(root.dataset.sorted){e.stopPropagation();e.preventDefault()}},true)}
 async function moveTo(mid,to,order){const KD=K();const base=KD==='npc'?'npc':'pc';const rows=[];let msg='';
  order.forEach((id,i)=>{const dd=N().doc(KD,id);if(!dd)return;const n=Object.assign({},dd.data);let ch=n.order!==i;n.order=i;
   if(id===mid&&to){const [c,q]=to.split(':');const want=c||base;if(clsOf(n)!==want){if(want===base)delete n.cls;else n.cls=want;ch=true;msg='분류: '+clsName(want)}
    if(c==='guest'){const tgt=q||'';const me=Object.assign({id},n);if(gsubOf(me)!==tgt){const auto=gsubAuto(me);if(!tgt||tgt===auto)delete n.gsub;else n.gsub=tgt;ch=true;msg=(msg?msg+' · ':'')+'객원 칸: '+(tgt||'미정')}}}
   if(ch)rows.push({kind:KD,id,data:n,vis:dd.vis})});
  if(rows.length){await N().putMany(rows);if(msg)N().toast(msg)}else N().render()}
 async function setGsub(id,q){const KD=K();if(!N().gm()||!N().doc(KD,id))return;const p=N().data(KD,id)||{};if((p.gsub||'')===q)return;
  await N().patch(KD,id,d=>{if(q)d.gsub=q;else delete d.gsub});N().toast('객원 칸: '+(q||'자동 ('+(gsubAuto(p)||'미정')+')'))}
 async function setCls(id,c){const KD=K();if(!N().gm()||!N().doc(KD,id))return;const p=N().data(KD,id)||{};if(clsOf(p)===c)return;const base=KD==='npc'?'npc':'pc';
  await N().patch(KD,id,d=>{if(c===base)delete d.cls;else d.cls=c});N().toast('분류: '+clsName(c))}
 const clsPick=(id,p0)=>{const p=Object.assign({id},p0);return N().gm()?`<select class="pccls" data-pcls="${esc(id)}" title="시트 분류 — 폴더 묶기 · 지도 · 관계도 거르기에 써요">${clsL().map(([c,n])=>`<option value="${c}" ${clsOf(p)===c?'selected':''}>${esc(n)}</option>`).join('')}</select>${clsOf(p)==='guest'?`<select class="pccls" data-pgsub="${esc(id)}" title="객원 칸 — 자동은 제작기 자질 중 가장 높은 것">${['',...QS].map(q=>`<option value="${q}" ${(QS.includes(p.gsub)?p.gsub:'')===q?'selected':''}>${q?esc(q):'자동 ('+esc(gsubAuto(p)||'미정')+')'}</option>`).join('')}</select>`:''}`:`<span class="visb pccl" style="--c:${(clsL().find(x=>x[0]===clsOf(p))||clsL()[0])[2]}">${esc(clsName(clsOf(p)))}${clsOf(p)==='guest'&&gsubOf(p)?' · '+esc(gsubOf(p)):''}</span>`};
 const pcs=()=>N().list(K()).sort((a,b)=>(a.order||0)-(b.order||0));
 const PUB_PC=[['bg','배경 · 설정'],['goal','목표 · 동기'],['bond','인간관계'],['style','말투 · 겉모습'],['note','메모']];
 /* 10-26 망령: 공개 칸 = 제작기 트레이너 프로필 「상세」(t.bio=[{k,v}]) 와 같은 칸. 제작기 트레이너가 있으면 거기에 바로 읽고 쓴다.
    제작기에 없는 노트 전용 시트는 이 시트 문서의 bio 에 두었다가 「⇪ 제작기로」 때 함께 보낸다. 예전 칸(bg · goal · bond · style · note / 제작기 rp)은 읽을 때 옮겨 온다 */
 const BIO_DEF=['백스토리','성격','말투','겉모습','목표 · 동기','인간관계','선호하는 전법','메모'],BIO_NPC=['PL 이 아는 것'];
 const bioDef=npc=>npc?BIO_DEF.concat(BIO_NPC):BIO_DEF;
 const OLD2BIO=(npc,k)=>({bg:'백스토리',goal:'목표 · 동기',bond:'인간관계',style:'말투',note:npc?'PL 이 아는 것':'메모'})[k];
 function bioMerge(npc,bio,...olds){const L=(Array.isArray(bio)?bio:[]).filter(x=>x&&(x.k||x.v)).map(x=>({k:String(x.k||'메모'),v:String(x.v||'')}));
  for(const o of olds)for(const k in (o||{})){const lab=OLD2BIO(npc,k);const v=String((o||{})[k]||'').trim();if(!lab||!v)continue;const e=L.find(x=>x.k===lab);if(!e)L.push({k:lab,v});else if(!e.v.trim())e.v=v}
  const D=bioDef(npc);for(const k of D)if(!L.some(x=>x.k===k))L.push({k,v:''});const o=k=>{const i=D.indexOf(k);return i<0?99:i};return L.sort((a,b)=>o(a.k)-o(b.k))}
 const oldOf=p=>{const o={};for(const k of ['bg','goal','bond','style','note'])if(p&&p[k])o[k]=p[k];return o};
 /* 이 시트의 상세: 제작기 트레이너가 있으면 그것(+ 아직 안 옮긴 노트 칸), 없으면 노트 문서 */
 /* 10-30 망령 「칸이 너무 잡다하게 나눠져 있다 — 통합할 건 통합해서 큼직하게. 세분류는 눌렀을 때 입력 창 안에서」:
    시트에는 큰 칸 몇 개(묶음)만 — 인물 · 말과 싸움 · 목표 · 관계 · 메모(+ 직접 만든 항목) · 비밀(본인 · GM) · GM 메모. 묶음 ✎ = 그 안의 항목을 한 창에서 고친다.
    저장 자리는 그대로(제작기 「상세」 t.bio 의 항목 하나하나 · 비밀 = pcp 문서 · GM 메모 = sec 문서) */
 const BIO_GRP=[['인물',['백스토리','성격','겉모습']],['말과 싸움',['말투','선호하는 전법']],['목표 · 관계',['목표 · 동기','인간관계']],['메모',['메모','PL 이 아는 것']]];
 const grpOf=k=>{for(const [g,L] of BIO_GRP)if(L.includes(k))return g;return '메모'};
 const sheetBio=(id,npc)=>{const t=MK().trainer(id);const p=N().data(npc?'npc':'pc',id)||{};return t?bioMerge(t.kind==='npc'||npc,pend(p,t,'bio')?bioOver(t.bio,p.bio):t.bio,t.rp,oldOf(p)):bioMerge(npc,p.bio,oldOf(p))};
 const PUB_NPC=[['bg','정체 · 설정'],['goal','원하는 것 · 동기'],['bond','인간관계'],['style','말투 · 겉모습'],['note','PL 이 아는 것']];
 const PUB=()=>U.mode==='npc'?PUB_NPC:PUB_PC;
 const PRIV=[['secret','비밀 · 속마음'],['plan','꿍꿍이 · 계획']];
 const canEditPc=id=>N().gm()||(U.mode==='pc'&&N().me()===id);
 const entOf=(name,id)=>N().list('ents').find(e=>id&&e.mk===id)||N().list('ents').find(e=>e.type==='인물'&&e.title===name);   /* 10-29: 항목의 「제작기 트레이너」 잇기가 먼저 */
 function render(el){const G=N().gm();const L=pcs();const shut=U.sel==='~';const sel=shut?'':U.sel&&N().data(K(),U.sel)?U.sel:(L[0]||{}).id||'';U.sel=shut?'~':sel;   /* 10-31 망령 「펼쳐 둔 학생 카드 접을 방법」: '~' = 접힘 */const NPC=U.mode==='npc';const nPc=N().list('pc').length,nNpc=N().list('npc').length;
  el.innerHTML=`<div class="toolbar"><h2>${NPC?'NPC 시트':'PC 시트'}</h2><span class="note">${NPC?`NPC ${nNpc}명 · 새로 넣는 NPC 는 GM 에게만 보여요`:`PC ${nPc}명`} · 트레이너 · 포켓몬은 제작기 값(읽기 전용) · RP 칸은 여기서</span><span class="sp"></span>${G&&L.some(p=>Object.keys(oldOf(p)).length&&MK().trainer(p.id))?`<button class="btn sm" data-p="bioall" title="예전 공개 칸(배경 · 목표 · 인간관계 · 말투 · 메모)을 제작기 트레이너 「상세」로 한 번에 옮겨요">↪ 예전 칸 → 제작기 상세</button>`:''}${G&&!NPC&&N().skin&&N().skin()==='univ'&&window.NT_MONED?'<button class="btn sm pri" data-monnew="misag" title="제작기 「미사그 캠퍼스」 폴더에 새 트레이너를 만들고, 닫으면 PC 시트로 넣어요 (10-30)">＋ 새 학생</button>':''}${G&&NPC&&N().skin&&N().skin()==='univ'&&window.NT_MONED?'<button class="btn sm pri" data-monnew="misagnpc" title="제작기 「미사그 캠퍼스 / NPC」 폴더(🔒)에 새 NPC 를 만들고, 닫으면 NPC 시트(GM만)로 넣어요 (10-30)">＋ 새 NPC</button>':''}${G?`<button class="btn sm pri" data-p="add">＋ ${NPC?'NPC':'PC'} (제작기에서)</button>`:''}${!NPC&&N().me()&&!N().data('pc',N().me())?'<button class="btn sm pri" data-p="mine">내 PC 시트 만들기</button>':''}<button class="btn xs ghost" data-p="reload" title="제작기 값 다시 읽기">↻ 제작기</button>${G?omAll(L):''}</div>
   ${G?mkBar():''}${L.length?`<div class="split ${N().skin&&N().skin()==='univ'?'nside':''}"><div>${folds(L)}${sel?`<div class="pcshut"><button type="button" class="btn xs ghost" data-pshut title="시트를 접어요. 카드를 다시 누르면 펼쳐져요">▴ 시트 접기</button></div>`+sheet(sel):''}</div>${N().skin&&N().skin()==='univ'?'':`<aside class="side">${sel?sideInfo(sel):''}</aside>`}</div>`:`<div class="empty">아직 ${NPC?'NPC':'PC'} 가 없어요.${G?` 「＋ ${NPC?'NPC':'PC'}」로 제작기 트레이너를 골라 넣어요.`:''}${!NPC&&N().me()?' 「내 PC 시트 만들기」를 눌러요.':''}</div>`}`;
  el.addEventListener('click',e=>{const pm=e.target.closest('[data-pm]');if(pm){N().go(pm.dataset.pm==='npc'?'npc':'pc');return}
   const pf=e.target.closest('[data-pfold]');if(pf){const f=foldGet();const c=pf.dataset.pfold;if(f[c])delete f[c];else f[c]=1;foldSet(f);N().render();return}
   const en=e.target.closest('[data-goent]');if(en){N().go('ents');setTimeout(()=>window.NT_ENTS&&NT_ENTS.select(en.dataset.goent),0);return}
   const pg=e.target.closest('[data-pmgo]');if(pg){e.preventDefault();const t=document.getElementById('pm-'+pg.dataset.pmgo);if(t){t.scrollIntoView({behavior:'smooth',block:'start'});t.classList.add('flash');setTimeout(()=>t.classList.remove('flash'),900)}return}
   if(e.target.closest('[data-pshut]')){U.sel='~';N().render();const fw=$('.pcfolds');if(fw)fw.scrollIntoView({behavior:'smooth',block:'start'});return}
   const c=e.target.closest('[data-pc]');if(c){if(c.dataset.pc===U.sel){U.sel='~';N().render();return}U.sel=c.dataset.pc;N().render();const sh=$('.pcsheet');if(sh)sh.scrollIntoView({behavior:'smooth',block:'start'});return}
   const b=e.target.closest('[data-p]');if(b)act(b.dataset.p,b)});
  /* 10-26 망령: 카드 끌어서 순서 바꾸기(GM) · 우클릭 · 길게 누르기 메뉴 */
  /* 10-30: 폴더마다 끌어서 순서 바꾸기 — 다른 폴더 순서는 그대로 두고 전체 순서를 다시 매긴다 */
  if(G)bindDrag($('.pcfolds',el));
  const fw=$('.pcfolds',el);if(fw)N().bindCtx(fw,'.pccard',c=>ctxItems(c.dataset.id));
  el.addEventListener('change',e=>{const s=e.target.closest('[data-pcls]');if(s)return setCls(s.dataset.pcls,s.value);const q=e.target.closest('[data-pgsub]');if(q)setGsub(q.dataset.pgsub,q.value)})}
 /* 10-29 망령: 시트 → 웹툴. 이어 둔 웹툴 방을 #r=<방>&add=<트레이너 id,…> 로 열면, 웹툴이 (GM 이면) 제작기에서 그 트레이너를 방 명단으로 가져온다 */
 const omRoom=()=>(((N().ST.campInfo||{}).data||{}).om||{}).room||'';
 const omHref=ids=>window.NT_LINK?NT_LINK.omUrl(omRoom())+'&add='+ids.map(encodeURIComponent).join(','):'#';
 const omOne=id=>omRoom()?`<a class="btn xs" href="${esc(omHref([id]))}" target="oremas" rel="noopener" title="이 트레이너를 이어 둔 웹툴 방 명단으로 보내요 (제작기 값 그대로)">⚔ 웹툴로</a>`:'';
 const omAll=L=>{if(!omRoom())return '';const ids=L.map(p=>p.id).filter(id=>MK().trainer(id));return ids.length?`<a class="btn sm" href="${esc(omHref(ids))}" target="oremas" rel="noopener" title="이 탭의 시트 ${ids.length}명을 웹툴 방 명단으로 보내요">⚔ 모두 웹툴로</a>`:''};
 /* 10-29 망령: 이어 둔 제작기 폴더에서 아직 안 넣은 트레이너 */
 function mkBar(){const L=MK().linked();if(!L.length)return `<div class="mkbar off"><span>📁 제작기 폴더를 이으면 그 폴더에 만든 트레이너가 여기 바로 떠요</span><span class="sp"></span><button class="btn xs" data-p="mklink">폴더 잇기</button></div>`;
  const miss=MK().missing();const np=miss.filter(t=>!MK().isNpc(t)).length,nn=miss.length-np;
  return `<div class="mkbar${miss.length?' new':''}"><span>📁 제작기 <b>${L.map(id=>esc(MK().folderName(id))).join(' · ')}</b></span>${miss.length?`<span class="mkmiss">${miss.slice(0,8).map(t=>`<i title="${esc(t.name||'')}" style="${t.image?`background-image:url('${cssu(t.image)}')`:''}"></i>`).join('')}</span><span>아직 안 넣은 트레이너 <b>${miss.length}명</b> <small class="dim">(${[np?'PC '+np:'',nn?'NPC '+nn:''].filter(Boolean).join(' · ')})</small></span>`:'<span class="dim small">폴더의 트레이너가 모두 들어와 있어요</span>'}<span class="sp"></span>${miss.length?'<button class="btn xs pri" data-p="mksync">모두 넣기</button>':''}<button class="btn xs ghost" data-p="mklink">폴더 바꾸기</button></div>`}
 async function mkSync(){await MK().load(true);const miss=MK().missing().sort((a,b)=>(a._ord||0)-(b._ord||0));if(!miss.length){N().render();return N().toast('넣을 트레이너가 없어요')}
  const n={pc:N().list('pc').length,npc:N().list('npc').length};
  await N().putMany(miss.map(t=>{const k=MK().isNpc(t)?'npc':'pc';return {kind:k,id:t.id,data:fromTrainer(t,{order:n[k]++}),vis:k==='npc'?'gm':'pub'}}));
  N().toast(`${miss.length}명을 넣었어요`);N().render()}
 function ctxItems(id){const KD=K();const d=N().doc(KD,id);if(!d)return null;const p=d.data;const G=N().gm();const cur=d.vis||'pub';const it=[];
  if(G){[['pub','👥 모두에게'],['gm','🔒 GM만']].forEach(([v,l])=>it.push({t:l+(v===cur?' ✓':''),on:async()=>{if(v===cur)return;await N().put(KD,id,N().clone(p),v);N().toast('공개 범위: '+N().visLabel(v))}}));it.push('-');
   clsL().forEach(([c,n])=>it.push({t:'분류: '+n+(clsOf(p)===c?' ✓':''),on:()=>setCls(id,c)}));it.push('-');
   if(clsOf(p)==='guest'){const cur=QS.includes(p.gsub)?p.gsub:'';['',...QS].forEach(q=>it.push({t:'객원 칸: '+(q||'자동 ('+(gsubAuto(Object.assign({id},p))||'미정')+')')+(cur===q?' ✓':''),on:()=>setGsub(id,q)}));it.push('-')}}
  if(canEditPc(id))it.push({t:'✎ 기본 칸 고치기',on:()=>act('edit',{dataset:{id}})});
  if(window.NT_FAV)it.push({t:(NT_FAV.has(KD,id)?'★ 즐겨찾기에서 빼기':'☆ 즐겨찾기'),on:()=>NT_FAV.toggle(KD,id,p.name||id)});
  if(G){it.push('-');it.push({t:'🗑 빼기',danger:true,on:()=>act('del',{dataset:{id}})})}
  return it}
 /* 10-29 망령 「제작기에서 이름을 바꿔도 노트엔 처음 이름」: 제작기에 있는 트레이너는 이름 · 초상을 제작기 것으로 보인다 (노트 칸은 제작기가 없을 때 쓰는 사본) */
 /* 10-31 망령 「대학에서 바꾼 트레이너 포트가 어느 순간 제작기 원본으로 되돌아간다」「이름 · 메모 같은 트레이너 변경 사항도 다 비슷하니 전체 점검」:
    원인 = 고칠 때 이 브라우저에 제작기 사본이 아직 없거나(읽는 중 · 실패) 제작기에 못 쓰면 노트 칸에만 저장되고, 화면은 제작기 값을 먼저 보여서 나중에 제작기 값으로 돌아간다.
    → ① 고치기 전에 제작기를 읽고(act 첫머리), 상세는 제작기 문서를 직접 확인해 쓴다. ② 노트에서 바꾼 이름 · 초상 · 상세에는 바꾼 시각(nameAt · imageAt · bioAt)을 남기고 제작기에도 같은 시각을 쓴다.
    제작기 쪽 시각이 다르면 = 제작기에 아직 안 들어간 것 → 노트 값이 맞다(화면도 노트 값, maker.heal 이 제작기를 고친다). 같으면 그 뒤 제작기에서 바꾼 것 → 제작기 값 */
 /* 10-31: 노트 문서는 통째로 덮어쓴다 — 저장할 땐 이 브라우저 사본 말고 지금 DB 의 최신 문서를 바탕으로 (다른 사람이 막 고친 칸을 옛 값으로 되돌리지 않게) */
 const fresh=async(KD,id)=>{try{const r=await N().DBS().get(N().ST.camp,N().ST.secret,KD,id);return (r&&r.data)||N().data(KD,id)||{}}catch(e){return N().data(KD,id)||{}}};
 const pend=(p,t,f)=>!!(p&&p[f+'At'])&&(!t||t[f+'At']!==p[f+'At']);
 const nmOf=(p,t)=>pend(p,t,'name')?(p.name||''):((t&&t.name)||(p&&p.name)||'');
 const imOf=(p,t)=>pend(p,t,'image')?(p.image||''):((t&&t.image)||(p&&p.image)||'');
 const bioOver=(A,B)=>{const L=(Array.isArray(A)?A:[]).map(x=>({k:x.k,v:x.v}));for(const b of B||[]){if(!b||!b.k)continue;const e=L.find(x=>x.k===b.k);if(e)e.v=b.v;else L.push({k:b.k,v:b.v})}return L};
 function card(p){const t=MK().trainer(p.id)||{};const ms=MK().mons(p.id);const img=imOf(p,t);const rk=t.ranks||{};
  return `<button type="button" class="pccard ${p.id===U.sel?'on':''}" data-pc="${esc(p.id)}" data-id="${esc(p.id)}" data-drag><span class="por" style="${img?`background-image:url('${cssu(img)}')`:''}"></span><span style="min-width:0;flex:1"><b>${esc(nmOf(p,t)||p.id)}</b><small class="dim">${esc(p.player||'')}${p.player&&p.sub?' · ':''}${esc(p.sub||'')}</small><span class="rk">${['지시','육성','통솔','능력'].map(k=>`<span>${k} ${esc(rk[k]||'-')}</span>`).join('')}</span><span class="mons">${ms.slice(0,6).map(m=>`<i title="${esc(m.name||'')}" style="${MK().img(m)?`background-image:url('${cssu(MK().img(m))}')`:''}"></i>`).join('')}</span>${N().visBadge(p._vis,K(),p.id)}</span></button>`}
 /* 상세 여러 항목 한꺼번에 저장: ch = {항목 이름: 값 | null(지우기)} — 제작기 트레이너면 그 「상세」, 아니면 이 시트 문서 */
 async function bioSave(id,ch){const KD=K();const NPC=U.mode==='npc';const DB0=N().DBS();const curD=DB0.makerGet?await DB0.makerGet('trainers',id).catch(()=>null):null;const t=curD;
  const set=L=>{for(const [lab,v] of Object.entries(ch)){const e=L.find(x=>x.k===lab);if(v==null){const i=L.indexOf(e);if(i>=0)L.splice(i,1)}else if(e)e.v=v;else L.push({k:lab,v})}return L.filter(x=>String(x.v||'').trim()).map(x=>({k:x.k,v:x.v}))};
  if(t){const DB=N().DBS();if(!DB.makerPut)throw new Error('이 화면에서는 제작기에 쓸 수 없어요');const doc=JSON.parse(JSON.stringify(curD.data||{}));const d=doc.data||doc;const p=N().data(KD,id)||{};const pb=pend(p,d,'bio');
   d.bio=set(bioMerge(d.kind==='npc'||NPC,pb?bioOver(d.bio,p.bio):d.bio,d.rp,oldOf(p)));if(pb)d.bioAt=p.bioAt;delete d.rp;delete d.rpAt;await DB.makerPut('trainers',id,doc);
   if(Object.keys(oldOf(p)).length&&N().doc(KD,id)){const np=Object.assign({},p);for(const kk of ['bg','goal','bond','style','note'])delete np[kk];await N().put(KD,id,np)}
   await MK().load(true);N().render()}
  else{if(!N().doc(KD,id))throw new Error('시트를 찾지 못했어요 — 새로고침해 주세요');await N().patch(KD,id,p=>{p.bio=set(bioMerge(NPC,p.bio,oldOf(p)));p.bioAt=new Date().toISOString();for(const kk of ['bg','goal','bond','style','note'])delete p[kk]})}}
 function sheet(id){const KD=K();const NPC=U.mode==='npc';const p=N().data(KD,id)||{};const ent=entOf(nmOf(p,MK().trainer(id)),id);const t=MK().trainer(id);const ms=MK().mons(id);const G=N().gm(),E=canEditPc(id);const priv=N().data('pcp',id)||{};const sec=N().data('sec',KD+':'+id)||{};const img=imOf(p,t);const rk=(t&&t.ranks)||{};
  const box=(k,lab,v,cls,editable,kind)=>`<div class="rpbox ${cls||''}" data-k="${k}" data-kind="${kind}"><h4>${lab}${cls==='priv'?' <span class="visb pl">👤 본인 · GM</span>':cls==='gm'?' <span class="visb gm">🔒 GM</span>':''}<span class="sp"></span>${editable?`<button class="btn xs ghost" data-p="editbox" data-k="${k}" data-kind="${kind}">✎</button>`:''}</h4><div class="pre">${esc(v||'')||'<span class="dim">—</span>'}</div></div>`;
  const grpBox=(id,g,items,E,kind)=>{const full=items.filter(x=>String(x.v||'').trim()),emp=items.filter(x=>!String(x.v||'').trim());const one=items.length===1&&!items[0].k;
   return `<section class="rpbox rpg ${kind==='priv'?'priv':kind==='gm'?'gm':''}" data-g="${esc(g)}"><h4><b>${esc(g)}</b>${kind==='mk'?' <span class="visb" title="제작기 트레이너 프로필 「상세」와 같은 칸이에요">⇄ 제작기</span>':kind==='priv'?' <span class="visb pl">👤 본인 · GM</span>':kind==='gm'?' <span class="visb gm">🔒 GM</span>':''}<span class="sp"></span>${E?`<button class="btn xs ghost" data-p="editgrp" data-id="${esc(id)}" data-g="${esc(g)}" data-gk="${kind}" title="${esc(items.map(x=>x.k).filter(Boolean).join(' · ')||g)} 고치기">✎ 고치기</button>`:''}</h4>
    ${one?`<div class="pre rpgv">${esc(items[0].v||'')||'<span class="dim">—</span>'}</div>`:`${full.map(x=>`<div class="rpgi"><h5>${esc(x.k)}</h5><div class="pre">${esc(x.v)}</div></div>`).join('')}${emp.length?`<div class="rpge">${full.length?'':'<span class="dim">아직 비어 있어요 · </span>'}${emp.map(x=>`<span>${esc(x.k)}</span>`).join('')}</div>`:''}`}</section>`};
  const bioBox=(id,x,E,i)=>`<div class="rpbox" data-bk="${esc(x.k)}"><h4>${esc(x.k)}${t?' <span class="visb" title="제작기 트레이너 프로필 「상세」와 같은 칸이에요">⇄ 제작기</span>':''}<span class="sp"></span>${E?`<button class="btn xs ghost" data-p="editbio" data-id="${esc(id)}" data-bk="${esc(x.k)}">✎</button>`:''}</h4><div class="pre">${esc(x.v||'')||'<span class="dim">—</span>'}</div></div>`;
  const heroIn=`<span class="por" style="${img?`background-image:url('${cssu(img)}')`:''}"></span><div style="flex:1;min-width:200px"><div class="row"><h2>${esc(nmOf(p,t)||id)}</h2>${window.NT_FAV?NT_FAV.btn(KD,id,nmOf(p,t)||id):''}${N().visBadge((N().doc(KD,id)||{}).vis,KD,id)}${clsPick(id,p)}${ent?`<button class="btn xs ghost" data-goent="${esc(ent.id)}" title="항목(인물)으로">📇 항목</button>`:''}<span class="sp"></span>${E?`<button class="btn xs" data-p="edit" data-id="${esc(id)}">기본 칸 고치기</button>`:''}${window.NT_PHONE&&!(N().skin&&N().skin()==='univ')?NT_PHONE.btn(id):''}${G&&t?omOne(id):''}${E?`<button class="btn xs ghost" data-p="tomk" data-id="${esc(id)}" title="이 시트의 이름 · 초상 · 종류를 제작기 트레이너로 보내요${t?'':' (제작기에 새로 만들어요)'}">⇪ 제작기로</button>`:''}${E&&t&&window.NT_MONED?`<button class="btn xs" data-moned="" data-id="${esc(id)}" title="이 트레이너를 제작기 화면 그대로 노트 안에서 고쳐요 (자질 · 포인트 · 포켓몬 전부)">✎ 제작기로 고치기</button>`:''}${E&&t?`<button class="btn xs ghost" data-p="frommk" data-id="${esc(id)}" title="제작기의 이름 · 초상을 이 시트로 다시 가져와요 (상세 칸은 늘 제작기와 같아요)">⇩ 제작기에서</button>`:''}${G?`<button class="btn xs ghost danger" data-p="del" data-id="${esc(id)}">빼기</button>`:''}</div>
    <div class="dim">${esc(p.player?'플레이어 · '+p.player:'')}${p.sub?(p.player?' · ':'')+esc(p.sub):''}</div>
    ${(()=>{const at=(p.at||[]).map(x=>N().data('spots',x)?{id:x,n:N().data('spots',x).name}:null).filter(Boolean);return at.length?`<div class="small pcat">📍 지금 ${at.map(x=>`<b>${esc(x.n||'')}</b>`).join(' · ')}</div>`:''})()}
    ${t?`<div class="rk">${['지시','육성','통솔','능력'].map(k=>`<span>${k}<b>${esc(rk[k]||'-')}</b></span>`).join('')}</div><div class="small dim">제작기 시트 · ${esc(t.kind==='npc'?'NPC':'PC')}${t.folder?' · '+esc(MK().folderName(t.folder)):''} <a href="${esc((window.NT_CONFIG||{}).makerUrl||'#')}" target="_blank" rel="noopener">제작기에서 열기</a></div>`:`<div class="small dim">제작기에 이 id 의 트레이너가 없어요 — 노트에서만 쓰는 시트${E?' · 「⇪ 제작기로」로 제작기에 만들 수 있어요':''}</div>`}
    ${ms.length?`<div class="party">${ms.map(m=>`<a class="mon" href="#pm-${esc(m.id)}" data-pmgo="${esc(m.id)}">${monPic(m)}${esc(m.name||'')}</a>`).join('')}</div>`:''}</div>`;
  const UNIV=N().skin&&N().skin()==='univ';
  const X=window.NT_UNIV;
  /* 10-29 망령: 대학 — 학생증 오른쪽 = 자질 메모 · 기본 · 고유 포텐셜, 아래 = 휴대폰 · 덱 */
  const side=UNIV?`${heroIn}${(()=>{const a=memoSec(t)+ptSec(id,t,ms,E,'gauge'),b=X&&t?X.uniqSec(id,t,E):'',od=X&&X.ordSec&&t?X.ordSec(id,t,E):[];return a||b||od.length?`<div class="idinfo">${a?`<div class="idcol">${a}</div>`:''}${b?`<div class="idcol">${b}</div>`:''}${od.join('')}</div>`:''})()}`:heroIn;
  const low=UNIV?(window.NT_PHONE&&NT_PHONE.panel?NT_PHONE.panel(id):'')+(X&&t?X.deckSec(id,t,E):''):(X&&t?X.uniqSec(id,t,E)+X.deckSec(id,t,E):'');
  return `<div class="pcsheet" style="margin-top:14px">${UNIV?idHero(id,p,t,rk,img,NPC,side):`<div class="hero">${heroIn}</div>`}
   ${low?`<div class="uxrow ${UNIV?'ulow':''}">${low}</div>`:''}
   ${UNIV?ptSec(id,t,ms,E,'mons'):''}
   ${UNIV&&t?univParty(id,t,ms,E):partySec(t,ms,E&&!!t)}
   <div class="rpgrid rpgrp">${(()=>{const L=sheetBio(id,NPC);return BIO_GRP.map(([g])=>grpBox(id,g,L.filter(x=>grpOf(x.k)===g),E,t?'mk':'')).join('')})()}${(!NPC&&(E||G))?grpBox(id,'비밀',PRIV.map(([k,l])=>({k:l,v:priv[k]||''})),E,'priv'):''}${G?grpBox(id,NPC?'GM 메모 · 숨기는 것':'GM 메모',[{k:'',v:sec.t||''}],true,'gm'):''}</div>
   <div class="rpbox" style="margin-top:10px"><h4>세션 기록<span class="sp"></span>${E?`<button class="btn xs ghost" data-p="logadd" data-id="${esc(id)}">＋ 기록</button>`:''}</h4><div class="sesslog">${(p.log||[]).slice().reverse().map((x,i)=>`<div class="ent"><b>${esc(x.s||'')}</b>${esc(x.t||'')}${E?` <button class="linkbtn small" data-p="logdel" data-id="${esc(id)}" data-i="${(p.log||[]).length-1-i}">지우기</button>`:''}</div>`).join('')||'<span class="dim small">세션마다 한 줄씩 남겨요</span>'}</div></div></div>`}
 /* 10-29 망령: 꾸밈 「대학」 — PC 시트 머리를 학생증(NPC 는 교직원증)으로. 버튼 · 파티 · 제작기 안내는 오른쪽(heroIn 그대로) */
 const CREST='<svg viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2 37 8v14c0 11-7.5 18.5-17 22C10.5 40.5 3 33 3 22V8Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 16h18v14H11z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M20 16v14M11 16c3-2 6-2 9 0 3-2 6-2 9 0" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="20" cy="9.5" r="2.2" fill="currentColor"/></svg>';
 const stuNo=id=>{let h=7;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))>>>0;return '2026-'+String(h%10000).padStart(4,'0')};
 function idHero(id,p,t,rk,img,npc,heroIn){const name=nmOf(p,t)||id;const ini=esc([...String(name)][0]||'?');
  const ed=canEditPc(id);
  return `<div class="hero idwrap"><div class="idcard ${npc?'staff':''} ${ed?'ided':''}" aria-label="${npc?'교직원증':'학생증'}"${ed?` data-p="idedit" data-id="${esc(id)}" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}" title="눌러서 ${npc?'교직원증':'학생증'} 칸 고치기 (이름 · 소속 · 번호 · 담당 · 자질 · 사진 · 기재 사항)"`:''}>
   <div class="idc-head"><i class="idc-crest">${CREST}</i><div class="idc-org"><b>MISAG UNIVERSITY</b><small>미사그 대학교</small></div><span class="idc-kind">${npc?'교직원증<small>STAFF</small>':'학생증<small>STUDENT ID</small>'}</span></div>
   <div class="idc-body"><span class="idc-photo ${img?'':'noimg'}" style="${img?`background-image:url('${cssu(img)}')`:''}">${img?'':ini}</span>
    <dl class="idc-f"><dt>성명</dt><dd class="idc-name">${esc(name)}</dd><dt>${npc?'직위':'소속'}</dt><dd>${esc(p.sub||'—')}</dd><dt>${npc?'번호':'학번'}</dt><dd class="idc-no">${esc(p.stuNo||stuNo(id))}</dd>${npc?'':`<dt>담당</dt><dd>${esc(p.player||'—')}</dd>`}</dl></div>
   ${t?`<div class="idc-rk">${['지시','육성','통솔','능력'].map(k=>`<span><small>${k}</small><b>${esc(rk[k]||'-')}</b></span>`).join('')}</div>`:''}
   ${(()=>{/* 10-29 망령 「학생증 지시 체계까지 라인 맞도록 세로로 늘려서 뭔가 적을만한 걸」: 기재 사항 (기숙사 · 동아리 · 한마디 · 비고) — 남는 높이는 줄 친 비고 칸이 채운다 */
    const L=npc?[['연구실',p.dorm],['담당 과목',p.club],['한마디',p.motto]]:[['기숙사',p.dorm],['동아리',p.club],['한마디',p.motto]];
    return `<div class="idc-ex"><h5>기재 사항<small>${npc?'REMARKS':'REMARKS'}</small></h5><dl class="idc-exf">${L.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v||'')||'<span class="idc-blank">—</span>'}</dd>`).join('')}</dl><div class="idc-note"><span class="idc-nl">비고</span>${esc(p.idNote||'')}</div></div>`})()}
   <div class="idc-foot"><span class="idc-bar" aria-hidden="true"></span><span class="idc-yr">2026학년도</span><span class="idc-seal" aria-hidden="true">미사그<br>대학인</span></div>
  </div><div class="idside">${heroIn}</div></div>`}
 const T2C={'노말':'#9aa','불꽃':'#f08030','물':'#6890f0','풀':'#78c850','전기':'#f8d030','얼음':'#98d8d8','격투':'#c03028','독':'#a040a0','땅':'#e0c068','비행':'#a890f0','에스퍼':'#f85888','벌레':'#a8b820','바위':'#b8a038','고스트':'#705898','드래곤':'#7038f8','악':'#705848','강철':'#b8b8d0','페어리':'#ee99ac'};
 const tchip=t=>t&&t!=='-'?`<em class="tch" style="background:${T2C[t]||'#666'}">${esc(t)}</em>`:'';
 /* ---------- 10-31 망령 「포텐셜이랑 기술 UI 개선 좀 하자」: 기술 = 카드(타입 띠 · 분류 · 위력 · 명중 · 효과 두 줄), 포텐셜 = 분류 색 띠 카드(효과 글 꾸밈) ----------
    제작기 기술 표 줄: [5] 타입 · [6] 분류 · [7] 위력 · [8] 명중(0 = 필중) · [9] 범위 · [10] 접촉 · [11] 우선도 · [13] 효과 */
 const fxT=s=>window.NT_UNIV&&window.NT_UNIV.fx?window.NT_UNIV.fx(s):esc(brN(s));
 const CLS={'물리':'ph','특수':'sp','변화':'st'};
 function moveGrid(mv){if(!mv.length)return '';
  return `<section class="mvp"><h5 class="mvp-h"><span>기술</span><small>${mv.length}</small></h5><div class="mvg">${mv.map(x=>{const r=MK().move(x.name);const ty=r&&r[5]&&r[5]!=='-'?r[5]:'';const cl=r?String(r[6]||''):'';
   const pw=r&&+r[7]?r[7]:'—',ac=r?(+r[8]?r[8]:(cl==='변화'?'—':'필중')):'—';const pr=r&&+r[11]?(+r[11]>0?'+':'')+r[11]:'';const eff=r?brN(r[13]||''):'';
   return `<article class="mvc" style="--tc:${T2C[ty]||'#8f7b52'}"><div class="mvc-h">${ty?tchip(ty):''}<b title="${esc(x.name)}">${esc(x.name)}</b>${x.half?'<small class="mvc-half" title="자속 기술 할인">할인</small>':''}${cl?`<span class="mvc-cl c-${CLS[cl]||'st'}">${esc(cl)}</span>`:''}</div>
    ${r?`<div class="mvc-n"><span><small>위력</small><b>${esc(pw)}</b></span><span><small>명중</small><b>${esc(ac)}</b></span>${r[9]&&r[9]!=='-'?`<span><small>범위</small><b>${esc(r[9])}</b></span>`:''}${pr?`<span><small>우선</small><b>${esc(pr)}</b></span>`:''}${r[10]==='O'?'<span class="mvc-ct" title="접촉 기술">접촉</span>':''}</div>${eff?`<p class="mvc-e" title="${esc(eff)}">${fxT(eff)}</p>`:''}`:'<p class="mvc-e dim">기술 표에 없는 이름이에요</p>'}</article>`}).join('')}</div></section>`}
 const PKC={'역할':'#8f1a26','분류':'#3c5878','종족':'#2e6b45','속별':'#1f6f72','특권':'#a07a1e','전용':'#5b2a6e','특성':'#3f9a5a','소지품':'#6b5d44','계제':'#7a4a1c'};
 const pkc=k=>{for(const [n,c] of Object.entries(PKC))if(String(k).includes(n))return c;return '#6a6f7a'};
 function potGrid(list){if(!list.length)return '';
  return `<section class="mvp"><h5 class="mvp-h"><span>포텐셜</span><small>${list.length}</small></h5><div class="ptg">${list.map(x=>`<article class="ptc" style="--kc:${pkc(x.k)}"><div class="ptc-h"><span class="ptc-k">${esc(x.k||'포텐셜')}</span><b>${esc(x.n)}</b></div>${x.e?`<div class="ptc-e">${fxT(x.e)}</div>`:'<div class="ptc-e dim">효과 글이 없어요</div>'}</article>`).join('')}</div></section>`}
 /* 10-26 망령: 파티 = 제작기 시트 그대로 (레벨 · 타입 · 종족치 · 특성 · 소지품 · 기술 · 전용 · 포텐셜) */
 const monPic=m=>{const u=MK().img(m);return `<i class="${u?'':'noimg'}" style="${u?`background-image:url('${cssu(u)}')`:''}">${u?'':esc([...(m.name||'?')][0]||'?')}</i>`};
 const brN=v=>String(v==null?'':v).replace(/<br\s*\/?>/gi,'\n').replace(/\\n/g,'\n');
 const STL=['HP','공격','방어','특공','특방','스피드'];
 function partySec(t,ms,E){if(!ms.length)return '';if(!MK().dbReady())MK().db().then(()=>N().render());
  return `<div class="rpbox pty" style="margin-top:10px"><h4>파티 ${ms.length}체 <small class="dim">제작기 값${E?' · ✎ 로 고치면 제작기로':' · 읽기 전용'}${t?'':' · 제작기에 없는 트레이너'}</small></h4><div class="ptygrid">${ms.map(m=>monCard(t||{},m,E)).join('')}</div></div>`}
 function monCard(t,m,ED){const E=m.effTxt||{};const rk=(t.ranks||{})['육성'];const lv=MK().baseLv(rk)+(Math.round(+m.dist)||0);
  const b0=(m.base||[]).map(v=>+v||0),bu=m.baseUp&&Array.isArray(m.baseUp.base)?m.baseUp.base.map(v=>+v||0):null,bs=bu||b0,tot=bs.reduce((a,v)=>a+v,0);
  const types=[m.t1,m.t2,m.t3].filter(x=>x&&x!=='-');
  const mv=(m.moves||[]).map(x=>typeof x==='string'?{name:x}:x).filter(x=>x&&x.name);
  const pots=(m.pots||[]).map((n,i)=>({n:String(n||'').replace(/[『』]/g,''),i})).filter(x=>x.n&&x.n!=='-');
  const kindOf=i=>String((E.kinds||[])[i]||(m.potKind||[])[i]||'').replace(/^\d+(\.\d+)*\.\s*/,'');
  const effOf=i=>brN((E.pots||[])[i]||(m.potEff||[])[i]||'');
  const ex=[m.excl,...(m.exclX||[])].filter(x=>x&&x.name&&x.name!=='전용 포텐셜');
  const items=[m.item?{n:m.item,e:E.it}:null,...(m.items2||[]).filter(x=>x&&x.item).map((x,k)=>({n:x.item,e:((E.its2||[])[k]||{}).it}))].filter(Boolean);
  const line=(lab,name,eff)=>`<div class="pml"><span class="pmk">${lab}</span><b>${esc(name)}</b>${eff?`<div class="pme pre">${esc(brN(eff))}</div>`:''}</div>`;
  return `<div class="pmc" id="pm-${esc(m.id)}">
   <div class="pmh">${monPic(m)}<div class="pmt"><div class="row" style="gap:6px;flex-wrap:wrap"><b class="pmn">${esc(m.name||'')}</b>${m.partner?'<small class="pmb">★ 파트너</small>':''}</div>
    <div class="row" style="gap:4px;flex-wrap:wrap;margin-top:3px"><span class="pmlv">Lv ${lv}</span>${m.pride?`<span class="pmb">프라이드 ${esc(m.pride)}</span>`:''}${types.map(tchip).join('')}${m.tera&&m.tera!=='-'?`<small class="dim">테라 ${esc(m.tera)}</small>`:''}${m.gender&&m.gender!=='-'?`<small class="dim">${esc(m.gender)}</small>`:''}</div>
    <div class="small dim" style="margin-top:2px">${[m.egg1,m.egg2].filter(x=>x&&x!=='-').map(esc).join(' · ')}${(m.forms||[]).filter(f=>f&&f.name).length?` · 폼 ${(m.forms||[]).filter(f=>f&&f.name).map(f=>esc(f.name)).join(' · ')}`:''}</div></div></div>
   <div class="pmst">${STL.map((l,i)=>`<span class="${bu&&bu[i]!==b0[i]?'up':''}" title="${bu&&bu[i]!==b0[i]?`포텐셜로 ${b0[i]} → ${bu[i]}`:''}"><small>${l}</small><b>${bs[i]||'-'}</b></span>`).join('')}<span class="tot"><small>합</small><b>${tot}</b></span></div>
   ${m.ability?line('특성',m.ability,E.ab):''}${items.map(x=>line('소지품',x.n,x.e)).join('')}${ED&&t.id?`<div class="ux-itbs"><button type="button" class="linkbtn small ux-itb" data-ux="item" data-id="${esc(t.id)}" data-pid="${esc(m.id)}">✎ 소지품${items.length?' 고치기':' 넣기'}</button>${window.NT_MONED?`<button type="button" class="linkbtn small ux-itb" data-moned="${esc(m.id)}" data-id="${esc(t.id)}">✎ 포켓몬 고치기</button>`:''}</div>`:''}
   ${moveGrid(mv)}
   ${ex.length||pots.length?`<details class="pmpot"><summary>포텐셜 ${ex.length+pots.length} <span class="dim small">${[...ex.map(x=>x.name),...pots.map(x=>x.n)].map(esc).join(' · ')}</span></summary>${potGrid([...ex.map(x=>({k:'전용',n:'『'+String(x.name).replace(/[『』]/g,'')+'』',e:x.eff})),...pots.map(x=>({k:kindOf(x.i),n:'『'+x.n+'』',e:effOf(x.i)}))])}</details>`:''}
   ${m.memo?`<details class="pmpot"><summary>메모</summary>${memoHtml(m.memo)}</details>`:''}
  </div>`}
 /* ---------- 10-30 망령: 미사그 — 「파티 4체 외에 강조될 각성체 2체, 서머리 분리해서 멋있게」 「파티 UI 도 제작기 쪽 따라가자」 ----------
    파티 = 제작기 포켓몬 줄과 같은 모양(No. · 볼 · 타입 · Lv · 특성 · 육각형 · 종족치 등급). 「PL 포켓몬 n/4」 · 「각성체 n/2」 두 묶음, 각성체 줄은 붉은 띠.
    파티 서머리 = PL 줄 + 각성체 카드 2장(대가 · 보조, 프라이드, 대가 등급 · 걸린 대가, 원전). 비면 「＋ 각성체」 자리.
    등급 구간 = 제작기 기본 표(data/db.js grade) */
 const GRD=[[0,'-'],[1,'E-'],[11,'E'],[31,'E+'],[40,'D-'],[46,'D'],[55,'D+'],[60,'C-'],[70,'C'],[81,'C+'],[90,'B-'],[96,'B'],[105,'B+'],[110,'A-'],[120,'A'],[131,'A+'],[140,'AA-'],[150,'AA'],[161,'AA+'],[170,'AAA-'],[180,'AAA'],[191,'AAA+'],[200,'S-'],[220,'S'],[241,'S+'],[256,'EX'],[999,'-']];
 const grd=v=>{if(v===''||v==null||isNaN(+v)||!+v)return '-';let g='-';for(const [b,c] of GRD){if(b<=+v)g=c;else break}return g};
 const gcls=g=>'g-'+({S:'s',AAA:'aaa',AA:'aa',A:'a',B:'b',C:'c',D:'d',E:'e',EX:'s'}[String(g).replace(/[+-]$/,'')]||'e');
 const isAw=m=>m&&(m.awaken==='free'||m.awaken==='c');
 const AWL={free:'각성 (대가)',c:'각성 (보조)'};
 const oneLn=s=>brN(s).replace(/\s*\n+\s*/g,' ').trim();
 const RORD=[0,1,2,5,4,3];   /* 육각형: 위부터 시계 방향 HP · 공격 · 방어 · 스피드 · 특방 · 특공 (제작기와 같은 순서) */
 function radar(bs){const R=22,cx=26,cy=26;const pt=(i,r)=>{const a=-Math.PI/2+i*Math.PI/3;return (cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1)};
  const ring=f=>[0,1,2,3,4,5].map(i=>pt(i,R*f)).join(' ');const v=RORD.map(i=>Math.min(1,(+bs[i]||0)/180));const any=v.some(x=>x>0);
  return `<svg class="mkr-rd" viewBox="0 0 52 52" aria-hidden="true"><polygon points="${ring(1)}" class="rg"/><polygon points="${ring(.5)}" class="rg"/>${[0,1,2,3,4,5].map(i=>`<line x1="${cx}" y1="${cy}" x2="${pt(i,R).split(',')[0]}" y2="${pt(i,R).split(',')[1]}" class="rg"/>`).join('')}${any?`<polygon points="${v.map((x,i)=>pt(i,Math.max(1.5,x*R))).join(' ')}" class="rv"/>`:''}</svg>`}
 function monInfo(t,m){const E=m.effTxt||{};const rk=(t.ranks||{})['육성'];const lv=MK().baseLv(rk)+(Math.round(+m.dist)||0);
  const b0=(m.base||[]).map(v=>+v||0),bu=m.baseUp&&Array.isArray(m.baseUp.base)?m.baseUp.base.map(v=>+v||0):null,bs=bu||b0;
  const types=[m.t1,m.t2,m.t3].filter(x=>x&&x!=='-');const mv=(m.moves||[]).map(x=>typeof x==='string'?{name:x}:x).filter(x=>x&&x.name);
  const pots=(m.pots||[]).map((n,i)=>({n:String(n||'').replace(/[『』]/g,''),i})).filter(x=>x.n&&x.n!=='-');
  const ex=[m.excl,...(m.exclX||[])].filter(x=>x&&x.name&&x.name!=='전용 포텐셜');
  const items=[m.item?{n:m.item,e:E.it}:null,...(m.items2||[]).filter(x=>x&&x.item).map((x,k)=>({n:x.item,e:((E.its2||[])[k]||{}).it}))].filter(Boolean);
  const pu=(t.ptUse&&t.ptUse.mons&&t.ptUse.mons[m.id])||{};const pride=pu.pride||(m.pride&&m.pride!=='-'?m.pride:'');
  const om=String(m.memo||'').match(/【각성체 원전】\s*([^\n]+)/);const origin=om?om[1].split(' · ')[0].trim():'';
  return {E,lv,b0,bu,bs,tot:bs.reduce((a,v)=>a+v,0),types,mv,pots,ex,items,pride,origin}}
 const gGlyph=g=>g==='♂'?'<span class="mkr-gen m">♂</span>':g==='♀'?'<span class="mkr-gen f">♀</span>':'';
 function mkRow(t,m,i,ED,aw){const X=monInfo(t,m);const E=X.E;const c1=T2C[X.types[0]]||'#8f7b52',c2=T2C[X.types[1]]||c1;
  const kindOf=k=>String((E.kinds||[])[k]||(m.potKind||[])[k]||'').replace(/^\d+(\.\d+)*\.\s*/,'');const effOf=k=>brN((E.pots||[])[k]||(m.potEff||[])[k]||'');
  const line=(lab,name,eff)=>`<div class="pml"><span class="pmk">${lab}</span><b>${esc(name)}</b>${eff?`<div class="pme pre">${esc(brN(eff))}</div>`:''}</div>`;
  const abE=oneLn(E.ab);
  return `<article class="mkr ${aw?'aw '+(m.awaken==='free'?'free':'sub'):''}" id="pm-${esc(m.id)}" style="--c1:${c1};--c2:${c2}">
   <div class="mkr-h"><span class="mkr-no"><small>No.</small>${String(i+1).padStart(3,'0')}</span>
    <span class="mkr-av">${monPic(m)}</span>
    <div class="mkr-id"><div class="mkr-n"><b>${esc(m.nick||m.name||'(이름 없음)')}</b>${m.nick?`<small class="mkr-sp" title="종 이름">${esc(m.name||'')}</small>`:''}${gGlyph(m.gender)}${m.partner?'<span class="mkr-star" title="파트너">★</span>':''}</div>
     <div class="mkr-c">${X.types.map(tchip).join('')}<span class="mkr-lv">Lv.${X.lv}</span></div>
     <div class="mkr-c">${aw?`<span class="mkr-aw">${AWL[m.awaken]}</span>`:''}${X.pride?`<span class="mkr-pr">프라이드 <b>${esc(X.pride)}</b></span>`:''}${m.tera&&m.tera!=='-'?`<span class="mkr-tg">테라 ${esc(m.tera)}</span>`:''}</div></div>
    <div class="mkr-ab"><div class="mkr-abn"><span class="mkr-k">특성</span><b>${esc(m.ability||'특성 없음')}</b></div>${abE?`<p title="${esc(abE)}">${esc(abE)}</p>`:''}${X.items.length?`<div class="mkr-it">${X.items.map(x=>`<span title="${esc(oneLn(x.e||''))}">${esc(x.n)}</span>`).join('')}</div>`:''}</div>
    <div class="mkr-st">${radar(X.bs)}<div><div class="mkr-gs">${STL.map((l,k)=>{const g=grd(X.bs[k]);return `<span title="${l} ${X.bs[k]||'-'}${X.bu&&X.bu[k]!==X.b0[k]?` (포텐셜로 ${X.b0[k]} → ${X.bu[k]})`:''}"><small>${l}</small><b class="${gcls(g)}">${esc(g)}</b></span>`}).join('')}</div><div class="mkr-sum">종족치 합 <b>${X.tot||'-'}</b> · 기술 ${X.mv.length} · 포텐셜 ${X.pots.length+X.ex.length}</div></div></div>
    ${ED&&t.id?`<div class="mkr-act">${window.NT_MONED?`<button type="button" class="btn xs" data-moned="${esc(m.id)}" data-id="${esc(t.id)}" title="제작기 화면 그대로 이 포켓몬 한 장을 고쳐요">✎ 고치기</button>`:''}<button type="button" class="btn xs ghost" data-ux="item" data-id="${esc(t.id)}" data-pid="${esc(m.id)}">소지품</button></div>`:''}</div>
   ${X.mv.length||X.pots.length||X.ex.length||m.memo?`<details class="mkr-more"><summary>${[X.mv.length?'기술 '+X.mv.length:'',X.pots.length?'포텐셜 '+X.pots.length:'',X.ex.length?'전용 '+X.ex.length:'',m.memo?'메모':''].filter(Boolean).join(' · ')}</summary><div class="mkr-mb">
    ${moveGrid(X.mv)}${potGrid([...X.ex.map(x=>({k:'전용',n:'『'+String(x.name).replace(/[『』]/g,'')+'』',e:x.eff})),...X.pots.map(x=>({k:kindOf(x.i),n:'『'+x.n+'』',e:effOf(x.i)}))])}${m.memo?memoHtml(m.memo,'mkr-memo'):''}</div></details>`:''}
  </article>`}
 function univParty(id,t,ms,E){if(!t)return '';if(!MK().dbReady())MK().db().then(()=>N().render());const pl=ms.filter(m=>!isAw(m)),aw=ms.filter(isAw).sort((a,b)=>(a.awaken==='free'?0:1)-(b.awaken==='free'?0:1));const G=N().gm();
  const add=(k,n)=>E&&(k!=='aw'||G)&&n?`<button type="button" class="btn xs" data-monadd="${k}" data-id="${esc(id)}" title="제작기에 새 시트를 만들어 바로 열어요">＋ ${k==='aw'?'각성체':'PL 포켓몬'}</button>`:'';
  return `<section class="mkparty" style="margin-top:10px">
   <div class="mkpg"><b>PL 포켓몬</b><span>${pl.length} / 4 · PL이 짠다</span><span class="sp"></span>${add('pl',pl.length<4)}</div>
   ${pl.map((m,i)=>mkRow(t,m,i,E,false)).join('')||'<p class="mkpe">아직 없어요</p>'}
   <div class="mkpg aw"><b>각성체</b><span>${aw.length} / 2 · GM이 짠다 · 통솔점을 쓰지 않는다</span><span class="sp"></span>${add('aw',aw.length<2)}</div>
   ${aw.map((m,i)=>mkRow(t,m,i,E,true)).join('')||'<p class="mkpe">포켓몬 시트의 「각성체」 칸에서 각성 (대가) · (보조)를 고르면 이쪽으로 와요</p>'}</section>`}
 /* 파티 서머리의 각성체 카드 */
 function costLines(o){if(!o||!o.pen)return [];const L=[],e=o.pen;
  if(e.지시){const c=(o.ordOff&&o.ordOff.c||[]).length,d=(o.ordOff&&o.ordOff.o||[]).length;L.push(`<b>지시 ${esc(e.지시)}</b> 지령 −${c}${d?` · 명령 −${d}`:''}`)}
  if(e.육성)L.push(`<b>육성 ${esc(e.육성)}</b> 분배레벨 −${esc(o.dist||0)}`);
  if(e.통솔){(o.items||[]).forEach(x=>L.push(`<b>통솔 ${esc(x.grade||e.통솔)}</b> ${esc(x.key||'')} ${esc(x.desc||'')}${x.need==='type'&&o.type?` [${esc(o.type)}]`:''}${x.need==='role'&&o.role?` [${esc(o.role)}]`:''}`));if(!(o.items||[]).length)L.push(`<b>통솔 ${esc(e.통솔)}</b> 항목을 아직 안 골랐어요`)}
  if(e.능력)L.push(`<b>능력 ${esc(e.능력)}</b> 전용 −${esc(o.excl||0)}${o.uq?` · 고유 점수 −${esc(o.uq)}`:''}`);
  if(o.note)L.push(`<em>${esc(o.note)}</em>`);return L}
 function awCards(id,t,ms,E){const aw=ms.filter(isAw).sort((a,b)=>(a.awaken==='free'?0:1)-(b.awaken==='free'?0:1));const o=t.misagOut||null;const G=N().gm();
  const pen=o&&o.pen?Object.entries(o.pen).map(([k,v])=>`<span>${esc(k)} <b>${esc(v)}</b></span>`).join(''):'';
  /* 10-30 망령 「서머리에서 적용 중인 대가랑 코멘트가 안 보여」: 대가 카드에 걸린 대가를 한 줄씩(제작기 misagOut) + 각성체 칸 코멘트(pcp.awk[n].note) */
  const costL=costLines(o);const awAll=ms.filter(isAw);const P=N().data('pcp',id)||{};const noteOf=m=>{const i=awAll.indexOf(m);const s=Array.isArray(P.awk)&&P.awk[i];return String((s&&s.note)||'').trim()};
  const card=m=>{const X=monInfo(t,m);const free=m.awaken==='free';const u=MK().img(m);const nt=noteOf(m);
   return `<a class="awx ${free?'free':'sub'}" href="#pm-${esc(m.id)}" data-pmgo="${esc(m.id)}" style="--c1:${T2C[X.types[0]]||'#8f7b52'}">
    <span class="awx-por ${u?'':'noimg'}" style="${u?`background-image:url('${cssu(u)}')`:''}">${u?'':esc([...(m.name||'?')][0]||'?')}</span>
    <span class="awx-b"><span class="awx-k">${free?'각성 · 대가':'각성 · 보조'}</span><b class="awx-n">${esc(m.nick||m.name||'(이름 없음)')}</b>${X.origin?`<span class="awx-o">원전 ${esc(X.origin)}</span>`:''}
     <span class="mkr-c">${X.types.map(tchip).join('')}<span class="mkr-lv">Lv.${X.lv}</span></span>
     <span class="awx-pr"><span>프라이드</span><b>${esc(X.pride||'자동')}</b>${free&&o&&o.grade&&o.grade!=='-'?`<span>대가</span><b class="awx-g">${esc(o.grade)}</b>`:''}</span>
     ${free&&pen&&!costL.length?`<span class="awx-pen">${pen}</span>`:''}
     ${free?(costL.length?`<span class="awx-cost">${costL.map(x=>`<span>${x}</span>`).join('')}</span>`:o?'':'<span class="awx-cost none">제작기에서 이 트레이너를 한 번 저장하면 대가가 보여요</span>'):''}
     ${nt?`<span class="awx-note" title="${esc(nt)}">${esc(nt)}</span>`:''}</span>
    <span class="awx-seal" aria-hidden="true">${free?'代價':'補助'}</span></a>`};
  const empty=n=>`<div class="awx empty"><span>각성체 ${n}</span><small>아직 없어요</small>${E&&G?`<button type="button" class="btn xs" data-monadd="aw" data-id="${esc(id)}">＋ 각성체</button>`:''}</div>`;
  return `<div class="awxs">${aw.slice(0,2).map(card).join('')}${aw.length<2?[...Array(2-Math.min(2,aw.length))].map((_,k)=>empty(aw.length+k+1)).join(''):''}</div>`}
 window.NT_PCX={partySec,monCard};
 /* 10-29: 지도의 인물 얼굴 → 이 시트 */
 window.NT_PC={select(k,id){U.mode=k==='npc'?'npc':'pc';U.sel=id;N().go(U.mode);setTimeout(()=>{const sh=$('.pcsheet');if(sh)sh.scrollIntoView({behavior:'smooth',block:'start'})},60)}};   /* 미리보기 · 점검용 */
 function monRow(m){const mv=(m.moves||[]).map(x=>typeof x==='string'?x:(x&&(x.name||x.n))||'').filter(Boolean);const pots=(m.pots||[]).filter(Boolean);
  return `<div class="monrow"><i style="${MK().img(m)?`background-image:url('${cssu(MK().img(m))}')`:''}"></i><div class="mb"><div class="row" style="gap:6px"><b>${esc(m.name||'')}</b>${tchip(m.t1)}${tchip(m.t2)}${m.tera&&m.tera!=='-'?`<small class="dim">테라 ${esc(m.tera)}</small>`:''}</div><div class="small">${m.ability?'특성 '+esc(m.ability):''}${m.item?' · 소지품 '+esc(m.item):''}${m.dist?' · 분배 '+esc(m.dist):''}</div>${mv.length?`<div class="small dim">기술 · ${mv.map(esc).join(' · ')}</div>`:''}${pots.length?`<div class="small dim">포텐셜 · ${pots.map(esc).join(' · ')}</div>`:''}${m.memo?`<div class="small pre" style="margin-top:3px">${esc(m.memo)}</div>`:''}</div></div>`}
 /* 10-30 망령 「여기 뜨는 각성체 원전 좀 꾸며봐 — 투박하게」: 포켓몬 메모의 【각성체 원전】 덩어리(awaken.js memoOf 가 쓰는 꼴)를 카드로.
    첫 줄 = 이름 (원어) · 지역 · 분류…, 다음 줄들 = 「항목: 내용」(누구 · 열화 · 은열쇠 · 대가 성향 · ○○와의 연 …). 빈 줄에서 끝나고, 나머지 메모는 예전처럼 글 그대로 */
 function memoHtml(memo,cls){const s=String(memo||'');const m=/【각성체 원전】[ \t]*([^\n]*)((?:\n(?!\s*\n)[^\n]*)*)/.exec(s);const plain=t=>t.trim()?`<div class="pme pre ${cls||''}">${esc(t.trim())}</div>`:'';
  if(!m)return plain(s);const rest=(s.slice(0,m.index)+'\n'+s.slice(m.index+m[0].length)).replace(/\n{3,}/g,'\n\n');
  const head=m[1].split(/\s+·\s+/).map(x=>x.trim()).filter(Boolean);const nm=head.shift()||'';const nx=/^(.*?)\s*[(（]([^)）]*)[)）]\s*$/.exec(nm);const name=nx?nx[1]:nm,orig=nx?nx[2]:'';
  const rows=m[2].split('\n').map(x=>x.trim()).filter(Boolean).map(x=>{const k=/^([^:：]{1,14})[:：]\s*(.*)$/.exec(x);return k?{k:k[1].trim(),v:k[2].trim()}:{k:'',v:x}});
  const bond=rows.filter(r=>/(와|과)의 연$|^연$|인연$/.test(r.k)),kv=rows.filter(r=>!bond.includes(r));
  const ICO={'누구':'📜','열화':'🕯','은열쇠':'🗝','대가 성향':'⚖','대가':'⚖'};
  const val=r=>/^대가/.test(r.k)?r.v.split(/\s*[·,，]\s*/).filter(Boolean).map(x=>`<span class="awo-chip">${esc(x)}</span>`).join(''):esc(r.v);
  return `<div class="awo">
   <div class="awo-h"><span class="awo-k">✦ 각성체 원전</span><span class="sp"></span>${head.map(x=>`<span class="awo-tag">${esc(x)}</span>`).join('')}</div>
   <div class="awo-n"><b>${esc(name)}</b>${orig?`<span class="awo-o">${esc(orig)}</span>`:''}</div>
   ${kv.length?`<dl class="awo-kv">${kv.map(r=>r.k?`<dt><i aria-hidden="true">${ICO[r.k]||'◇'}</i>${esc(r.k)}</dt><dd>${val(r)}</dd>`:`<dd class="awo-x">${esc(r.v)}</dd>`).join('')}</dl>`:''}
   ${bond.map(r=>`<blockquote class="awo-bond"><small>${esc(r.k)}</small>${esc(r.v)}</blockquote>`).join('')}</div>${plain(rest)}`}
 function memoSec(t){if(!t)return '';const QO=['지시','육성','통솔','능력'];const qo=k=>{const i=QO.indexOf(k);return i<0?9:i};   /* 10-30 망령 「자질 메모 순서는 지시 · 육성 · 통솔 · 능력」 (제작기 문서의 키 순서가 섞여 있다) */
  const det=Object.entries(t.detail||{}).filter(([k,v])=>v&&typeof v!=='object').sort((a,b)=>qo(a[0])-qo(b[0]));if(!det.length)return '';
  return `<section class="ux-sec ux-memo"><h4 class="ux-h"><span>자질 메모</span><span class="sp"></span><small title="제작기 트레이너에서 고쳐요">제작기</small></h4><dl class="ux-kv">${det.slice(0,14).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(String(v))}</dd>`).join('')}</dl></section>`}
 /* 10-29 망령: 「기본 요소(메인 · 통솔점 · 【1/시】 · 분배레벨 · 「기술 할인점」)를 꾸미고 얼마나 찼는지 + 포켓몬도 넣어 PT 서머리로」.
    제작기가 저장할 때 남기는 t.ptUse = {items:[{n,max,use,auto}], mons:{pid:{pride,cost,lv,dist,disc,once,sock,sockCap,aw}}, sock:{u,m}} 를 읽는다.
    사본이 없는 옛 문서는 노트에서 셀 수 있는 것만(분배 · 할인 · 【1/시】 · 메인) 세고, 통솔점은 「제작기에서 한 번 저장」으로 안내 */
 const PTC=['#c0392b','#2e7dbd','#3f9a5a','#c98a1b','#8e4fb3','#2a9d9b'];
 const RVQ={E:-2,D:-1,C:0,B:1,A:2,AA:3,AAA:4,S:5};
 /* 10-30 망령 「서머리에 여전히 메인 3/4」: 제작기에서 다시 저장하기 전 문서(mainV 없음)는 사본 · base 가 옛 기본 4 — 메인 보유 = (4 면 2) + 덤프 수로 고쳐 읽는다 */
 const ptDump=t=>['지시','육성','통솔','능력'].filter(q=>(RVQ[String((t.ranks||{})[q]||'').replace(/[+-]+$/,'')]??0)<0).length;
 function ptMainFix(t,items){if(t.mainV)return items;const d=ptDump(t);return items.map(it=>{if(it.auto!=='rank')return it;const b=+((t.base||{})[it.n]);const v=(isFinite(b)&&b!==4&&(t.base||{})[it.n]!=null&&(t.base||{})[it.n]!=='')?b:2;return Object.assign({},it,{max:v+d})})}
 function ptData(t,ms){const U=t.ptUse;if(U&&Array.isArray(U.items))return {items:ptMainFix(t,U.items),mons:U.mons||{},sock:U.sock||null,snap:true};
  const base=t.base||{};const mons={};for(const m of ms){const pots=(m.effTxt||{}).pots||[];mons[m.id]={dist:Math.round(+m.dist)||0,disc:(m.moves||[]).filter(x=>x&&typeof x==='object'&&x.half).length,once:pots.filter(x=>/【1\s*\/\s*시】/.test(x||'')).length}}
  const sum=k=>Object.values(mons).reduce((a,x)=>a+(+x[k]||0),0);const rank=['지시','육성','통솔','능력'].reduce((a,q)=>a+Math.max(0,RVQ[String((t.ranks||{})[q]||'').replace(/[+-]+$/,'')]??0),0);
  const AU={'메인':['rank',rank],'통솔점':['pride',null],'「기술 할인점」':['disc',sum('disc')],'【1/시】':['once',sum('once')],'분배레벨':['dist',sum('dist')]};
  const dump=['지시','육성','통솔','능력'].filter(q=>(RVQ[String((t.ranks||{})[q]||'').replace(/[+-]+$/,'')]??0)<0).length;   /* 10-30 망령 「메인 2점 + 덤프 1점」: 덤프 하나마다 메인 보유 +1 */
  const items=Object.entries(base).filter(([k,v])=>v!==''&&v!=null&&typeof v!=='object').map(([n,v])=>{const a=AU[n]||['',null];return {n,max:(+v||0)+(a[0]==='rank'?dump:0),use:a[1],auto:a[0]}});
  return {items:ptMainFix(t,items),mons,sock:null,snap:false}}
 const ptLab=n=>{const s=String(n);const m=s.match(/^【(.+)】$/);if(m)return `<em class="ux-tag">${esc(m[1])}</em>`;const q=s.match(/^「(.+)」$/);return esc(q?q[1]:s)};
 const fmt=x=>String(Math.round((+x||0)*100)/100);
 /* 10-30 망령 「포켓몬 서머리를 저기 붙이니 길이가 감당 안 돼 — 휴대폰 · 덱 아래 파티 부근으로 따로」: part = 'gauge'(학생증 옆, 기본 요소 막대) | 'mons'(파티 위, 포켓몬 줄) | 없음(둘 다) */
 function ptSec(id,t,ms,E,part){if(!t)return '';const D=ptData(t,ms);const G=part!=='mons',Mo=part!=='gauge';const UV=part==='mons'&&N().skin&&N().skin()==='univ';if(!(G&&D.items.length)&&!(Mo&&ms.length)&&!UV)return '';
  const col=i=>PTC[i%PTC.length];const per={pride:'cost',dist:'dist',disc:'disc',once:'once'};
  const gauge=it=>{if(it.use==null)return `<div class="ptg" title="제작기에서 이 트레이너를 한 번 저장하면 보여요"><span class="ptl">${ptLab(it.n)}</span><div class="ptb none"><span>제작기에서 한 번 저장하면 보여요</span></div><span class="ptn"><b>—</b> / ${fmt(it.max)}</span></div>`;
   const k=per[it.auto];const tot=Math.max(it.max,it.use)||1;const over=it.use>it.max+1e-9;let segs='',acc=0;
   if(k)ms.forEach((m,i)=>{const v=+((D.mons[m.id]||{})[k])||0;if(v<=0)return;acc+=v;segs+=`<i style="width:${v/tot*100}%;background:${col(i)}" title="${esc((m.name||'')+' '+fmt(v))}"><span>${esc([...(m.name||'?')][0]||'?')}${v!==1?fmt(v):''}</span></i>`});
   const rest=it.use-acc;if(rest>1e-9)segs+=`<i class="etc" style="width:${rest/tot*100}%" title="${esc(it.auto==='rank'?'자질 투자':'포인트 · 그 밖')} ${fmt(rest)}"><span>${fmt(rest)}</span></i>`;
   const left=it.max-it.use;
   return `<div class="ptg ${over?'over':''}" title="${esc(String(it.n).replace(/[【】「」]/g,''))} ${fmt(it.use)} / ${fmt(it.max)} · ${left>1e-9?'남음 '+fmt(left):over?fmt(-left)+' 넘음':'꽉 참'}"><span class="ptl">${ptLab(it.n)}</span><div class="ptb">${segs}${over?`<em class="cap" style="left:${it.max/tot*100}%"></em>`:''}</div><span class="ptn"><b>${fmt(it.use)}</b> / ${fmt(it.max)}${left>1e-9?`<small>남음 ${fmt(left)}</small>`:over?`<small class="warn">${fmt(-left)} 넘음</small>`:'<small>꽉 참</small>'}</span></div>`};
  const mon=(m,i)=>{const x=D.mons[m.id]||{};const types=[m.t1,m.t2,m.t3].filter(v=>v&&v!=='-');const sc=x.sockCap!=null?`${fmt(x.sock)}/${fmt(x.sockCap)}`:'';
   return `<div class="ptm" style="--pc:${col(i)}"><a class="ptm-pic" href="#pm-${esc(m.id)}" data-pmgo="${esc(m.id)}">${monPic(m)}</a><div class="ptm-b"><div class="ptm-n"><b>${esc(m.name||'')}</b>${x.lv?`<span class="ptm-lv">Lv ${x.lv}</span>`:''}${types.map(tchip).join('')}${x.aw?`<small class="ptm-aw">각성 ${x.aw==='c'?'보조':'대가'}</small>`:''}</div>
    <div class="ptm-s">${x.pride?`<span class="ptm-pr">${esc(x.pride)}</span><span>통솔 <b>${fmt(x.cost)}</b></span>`:''}${x.dist?`<span>분배 <b>${x.dist>0?'+':''}${x.dist}</b></span>`:''}${x.disc?`<span>할인 <b>${x.disc}</b></span>`:''}${x.once?`<span><em class="ux-tag">1/시</em> <b>${x.once}</b></span>`:''}${sc?`<span>소켓 <b>${sc}</b></span>`:''}</div>
    <div class="ptm-a">${m.ability?`<span>${esc(m.ability)}</span>`:''}${m.item?`<span>${esc(m.item)}</span>`:''}</div></div>${E&&window.NT_MONED?`<button type="button" class="btn xs ghost" data-moned="${esc(m.id)}" data-id="${esc(id)}" title="제작기 화면으로 고치기">✎</button>`:''}</div>`};
  return `<section class="ux-sec ux-pt ${part==='mons'?'ux-ptm':''}"><h4 class="ux-h"><span>${part==='mons'?'파티 서머리':'PT 서머리'}</span><small>${ms.length}체</small><span class="sp"></span>${D.sock?`<small class="ptsk ${D.sock.u>D.sock.m?'warn':''}">PT 기술점 <b>${fmt(D.sock.u)}</b> / ${fmt(D.sock.m)}</small>`:''}</h4>
   ${G&&D.items.length?`<div class="ptgs">${D.items.map(gauge).join('')}</div>`:''}
   ${Mo&&part==='mons'&&N().skin&&N().skin()==='univ'?`<div class="ptsub"><b>PL 포켓몬</b><small>${ms.filter(m=>!isAw(m)).length} / 4</small></div><div class="ptms">${ms.map((m,i)=>isAw(m)?'':mon(m,i)).join('')||'<span class="dim small">아직 없어요</span>'}</div><div class="ptsub aw"><b>각성체</b><small>${ms.filter(isAw).length} / 2</small></div>${awCards(id,t,ms,E)}${window.NT_AWK?NT_AWK.idCard(id):''}`:Mo&&ms.length?`<div class="ptms">${ms.map(mon).join('')}</div>`:''}
   ${D.snap||part==='mons'?'':'<div class="small dim" style="margin-top:6px">제작기에서 이 트레이너를 한 번 저장하면 통솔점 · 프라이드 · 소켓까지 보여요</div>'}</section>`}
 function sideInfo(id){const t=MK().trainer(id);if(!t)return '';const u=(t.unique||[]).filter(x=>x&&x.name);const base=t.base||{};const det=t.detail||{};
  if(N().skin&&N().skin()==='univ')return '';
  if(window.NT_UNIV&&!Object.values(det).some(Boolean)&&!Object.values(base).some(v=>v&&typeof v!=='object'))return '';
  return `<div class="card"><h3>제작기 정보 <small>읽기 전용</small></h3>${u.length&&!window.NT_UNIV?`<div class="sec">고유 포텐셜</div>${u.map(x=>`<div style="margin-bottom:6px"><b>${esc(x.name)}</b><div class="small pre dim">${esc(String(x.eff||'').replace(/<br\s*\/?>/gi,'\n'))}</div></div>`).join('')}`:''}
   ${Object.keys(det).length?`<div class="sec">자질 메모</div><div class="kv">${Object.entries(det).filter(([k,v])=>v).slice(0,12).map(([k,v])=>`<b>${esc(k)}</b><span class="pre">${esc(String(v))}</span>`).join('')}</div>`:''}
   ${Object.keys(base).length?`<div class="sec">기본</div><div class="kv">${Object.entries(base).filter(([k,v])=>v&&typeof v!=='object').slice(0,12).map(([k,v])=>`<b>${esc(k)}</b><span>${esc(String(v))}</span>`).join('')}</div>`:''}</div>`}
 /* ---------- 제작기 ↔ 노트 (10-26 망령) ----------
   제작기 트레이너 doc: {ord, data:{name, kind, image, folder, priv, owner, ownerName, rp:{bg,goal,bond,style,note}, pids, …}}.
   노트 → 제작기: 이름 · 초상 · 종류(PC/NPC) · 공개 칸(rp) 만 보낸다. 비밀 칸 · GM 메모 · 세션 기록은 보내지 않는다. 제작기에 없으면 같은 id 로 새 트레이너를 만든다(폴더 고르기). */
 const RPK=['bg','goal','bond','style','note'];
 function fromTrainer(t,extra){const o={name:t.name||'',image:t.image||'',player:'',sub:'',log:[]};return Object.assign(o,extra||{})}   /* 상세(공개 칸)는 제작기 트레이너에서 바로 읽으니 복사하지 않는다 */
 async function toMaker(id){const KD=K();const NPC=U.mode==='npc';const p=N().data(KD,id);if(!p)return;await MK().load(true);const t=MK().trainer(id);const DB=N().DBS();
  if(!DB.makerPut)return N().toast('이 화면에서는 제작기에 쓸 수 없어요');
  const myBio=bioMerge(NPC,p.bio,oldOf(p)).filter(x=>x.v.trim());const nm=p.name||(t&&t.name)||'';
  const fs=MK().M.folders.slice().sort((a,b)=>(a.ord||0)-(b.ord||0));const camp=((N().ST.campInfo||{}).name||'').trim();
  const guess=MK().linked()[0]||(fs.find(f=>camp&&f.name&&f.name.includes(camp)&&(!NPC||/npc/i.test(f.name)))||fs.find(f=>camp&&f.name&&f.name.includes(camp))||{}).id||'';
  const fpath=f=>{const L=[];let c=f,n=0;while(c&&n++<6){L.unshift(c.name);c=c.parent?fs.find(x=>x.id===c.parent):null}return L.join(' / ')};
  const md=N().openModal(`<div class="mhead"><h2>⇪ 제작기로 보내기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">${t?`제작기의 <b>「${esc(t.name)}」</b> 트레이너를 고쳐요.`:'제작기에 이 이름으로 <b>새 트레이너</b>를 만들어요. 능력치 · 포켓몬은 제작기에서 채워 주세요.'}</p>
   <div class="tomk"><div><b>이름</b><span>${esc(nm)||'—'}</span></div><div><b>초상</b><span>${p.image?'노트 그림으로 바꿈':t&&t.image?'제작기 그림 그대로':'없음'}</span></div><div><b>종류</b><span>${NPC?'NPC':'PC'}</span></div><div><b>상세</b><span>${t?'제작기 「상세」와 이미 같은 칸이라 따로 안 보내요'+(myBio.length?' (이 시트에만 있던 칸은 빈 곳에 채워요)':''):myBio.length?myBio.map(x=>esc(x.k)).join(' · '):'비어 있음'}</span></div><div><b>안 보내는 것</b><span>비밀 칸 · GM 메모 · 세션 기록</span></div></div>
   ${t?'':`<div class="mrow" style="margin-top:10px"><label class="lbl">폴더<select id="tmF"><option value="">— 폴더 없음 —</option>${fs.map(f=>`<option value="${esc(f.id)}" ${f.id===guess?'selected':''}>${esc(fpath(f))}${f.priv?' 🔒':''}</option>`).join('')}</select></label><label class="lbl">공개<select id="tmP"><option value="1" ${NPC?'selected':''}>🔒 비공개 (GM · 폴더 주인)</option><option value="" ${NPC?'':'selected'}>모두</option></select></label></div><p class="small dim" style="margin:4px 0 0">비공개 폴더에 넣으면 트레이너도 그 폴더 주인의 비공개가 돼요.</p>`}
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="tmOk">${t?'제작기 고치기':'제작기에 만들기'}</button></div>`);
  $('#tmOk',md).onclick=async()=>{const b=$('#tmOk',md);b.disabled=true;b.textContent='보내는 중…';
   try{if(t){const cur=await DB.makerGet('trainers',id);if(!cur)throw new Error('제작기 문서를 찾지 못했어요');const doc=JSON.parse(JSON.stringify(cur.data||{}));const d=doc.data||doc;d.name=d.name||nm;if(p.image&&!d.image)d.image=p.image;d.kind=NPC?'npc':(d.kind||'pc');{const L=bioMerge(d.kind==='npc'||NPC,d.bio,d.rp);for(const x of myBio){const e=L.find(y=>y.k===x.k);if(!e)L.push(x);else if(!e.v.trim())e.v=x.v}d.bio=L.filter(x=>x.v.trim());delete d.rp;delete d.rpAt}await DB.makerPut('trainers',id,doc)}
    else{const fid=$('#tmF',md).value;const f=fs.find(x=>x.id===fid);const priv=!!$('#tmP',md).value||!!(f&&f.priv);const ord=Math.max(0,...MK().M.trainers.map(x=>+x._ord||0))+1;
     const d={name:nm||'새 트레이너',kind:NPC?'npc':'pc',pl:NPC?'':(p.player||''),folder:fid,image:p.image||'',ranks:{지시:'C',육성:'C',통솔:'C',능력:'C'},detail:{지시:'',육성:'',통솔:'',능력:''},solo:false,pts:[],extra:{},base:{},unique:[{name:'',eff:''}],ptMax:'',fields:[],sps:[],bio:myBio,pids:[]};
     if(priv){d.priv=true;if(f&&f.owner){d.owner=f.owner;d.ownerName=f.ownerName||''}}
     await DB.makerPut('trainers',id,{ord,data:d})}
    N().closeModal();await MK().load(true);N().render();N().toast(t?'제작기 트레이너를 고쳤어요':'제작기에 새 트레이너를 만들었어요')}
   catch(e){b.disabled=false;b.textContent='다시 시도';N().toast('보내지 못했어요: '+(e.message||e))}}}
 async function act(k,b){const id=b.dataset.id||(U.sel==='~'?'':U.sel);try{await MK().load()}catch(e){}   /* 10-31: 제작기 사본 없이 고치면 노트에만 저장돼 나중에 되돌아간다 */
  if(k==='reload'){await MK().load(true);N().render();return}
  if(k==='mklink'){await MK().pickLinked();return}
  if(k==='mksync'){await mkSync();return}
  const KD=K();const NPC=U.mode==='npc';
  if(k==='add'||k==='mine'){await MK().load(true);let ts=MK().trainers().filter(t=>!N().data(KD,t.id));if(NPC)ts.sort((a,b)=>MK().isNpc(b)-MK().isNpc(a)||String(a.folder||'').localeCompare(String(b.folder||''),'ko'));if(k==='mine')ts=ts.filter(t=>t.id===N().me());if(!ts.length&&!(k==='add'&&N().gm()))return N().toast(k==='mine'?'제작기에 내 좌석 id 의 트레이너가 없어요 (GM 이 좌석을 트레이너 id 로 만들어야 해요)':'넣을 트레이너가 없어요 (제작기에서 먼저 만들어요)');
   if(k==='mine'){await N().put('pc',ts[0].id,{name:ts[0].name,image:ts[0].image||'',player:'',sub:'',order:pcs().length,log:[]},'pub');U.sel=ts[0].id;N().render();return}
   const md=N().openModal(`<div class="mhead"><h2>${NPC?'NPC':'PC'} 넣기 — 제작기 트레이너${NPC?' <small class="dim">(NPC 로 표시된 것이 먼저)</small>':''}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="row" style="gap:6px;margin-bottom:8px"><input type="search" id="pkQ" placeholder="이름으로 찾기" style="flex:1">${N().gm()?`<button type="button" class="btn sm" id="pkNew" title="제작기 없이 노트에서 새 시트를 만들고, 나중에 「⇪ 제작기로」로 보낼 수 있어요">＋ 새로 만들기</button>`:''}</div>${(()=>{const fs=[...new Set(ts.map(t=>t.folder).filter(Boolean))];return fs.length?`<div class="row" style="gap:4px;flex-wrap:wrap;margin-bottom:8px"><span class="small dim">폴더째 넣기:</span>${fs.map(f=>`<button type="button" class="chip" data-pickfold="${esc(f)}">📁 ${esc(MK().folderName(f))} (${ts.filter(t=>t.folder===f).length})</button>`).join('')}</div>`:''})()}<div class="pcgrid" id="pkList">${ts.map(t=>`<button type="button" class="pccard" data-pick="${esc(t.id)}" data-q="${esc((t.name||'').toLowerCase())}"><span class="por" style="${t.image?`background-image:url('${cssu(t.image)}')`:''}"></span><span><b>${esc(t.name||t.id)}</b><small class="dim">${esc(MK().isNpc(t)?'NPC':'PC')}${t.folder?' · '+esc(MK().folderName(t.folder)):''}</small><span class="rk">${['지시','육성','통솔','능력'].map(x=>`<span>${x} ${esc((t.ranks||{})[x]||'-')}</span>`).join('')}</span></span></button>`).join('')}</div>`,'wide');
   const pn=$('#pkNew',md);if(pn)pn.onclick=async()=>{const nm=await N().promptBox(NPC?'새 NPC 이름':'새 PC 이름','','');if(nm==null||!nm.trim())return;N().closeModal(true);const nid=N().uid(NPC?'n':'p');await N().put(KD,nid,{name:nm.trim(),image:'',player:'',sub:'',order:pcs().length,log:[]},NPC?'gm':'pub');U.sel=nid;N().render();N().toast('만들었어요 — 칸을 채운 뒤 「⇪ 제작기로」로 보낼 수 있어요')};
   $('#pkQ',md).oninput=e=>{const q=e.target.value.toLowerCase();$$('[data-pick]',md).forEach(x=>x.hidden=!!q&&!x.dataset.q.includes(q))};
   md.addEventListener('click',async e=>{const pf=e.target.closest('[data-pickfold]');if(pf){const list=ts.filter(t=>t.folder===pf.dataset.pickfold);N().closeModal();let n=pcs().length;await N().putMany(list.map(t=>({kind:KD,id:t.id,data:fromTrainer(t,{order:n++}),vis:NPC?'gm':'pub'})));U.sel=(list[0]||{}).id||'';N().render();return}
    const p=e.target.closest('[data-pick]');if(!p)return;const t=MK().trainer(p.dataset.pick);N().closeModal();await N().put(KD,t.id,fromTrainer(t,{order:pcs().length}),NPC?'gm':'pub');U.sel=t.id;N().render()});return}
  if(k==='edit'){const p=N().data(KD,id);if(!p)return;await MK().load();const tk=MK().trainer(id);const md=N().openModal(`<div class="mhead"><h2>${NPC?'NPC':'PC'} 기본 칸</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>${tk?'<p class="small dim" style="margin:0 0 6px">제작기에 있는 트레이너예요. 이름 · 초상은 제작기에도 같이 저장돼요.</p>':''}<div class="mrow"><label class="lbl">이름${tk?'':' (비우면 제작기 이름)'}<input id="pcName" type="text" value="${esc(nmOf(p,tk))}"></label><label class="lbl">${NPC?'역할 · 소속':'플레이어'}<input id="pcPl" type="text" value="${esc(p.player||'')}"></label><label class="lbl">한 줄<input id="pcSub" type="text" value="${esc(p.sub||'')}"></label>${N().gm()?`<label class="lbl">공개${N().visSelect(N().doc(KD,id).vis,'pcVis',{noPl:true})}</label>`:''}</div><div class="sec">초상${tk?'':' (비우면 제작기 초상)'}</div><div class="updz" id="pcDz"><div class="pv" style="${imOf(p,tk)?`background-image:url('${cssu(imOf(p,tk))}')`:''}"></div><b>＋ 그림</b></div><div class="row" style="margin-top:12px"><button class="btn xs ghost" id="pcImgX">초상 빼기</button><span class="sp"></span><button class="btn pri" id="pcOk">저장</button></div>`);
   let image=imOf(p,tk);N().bindDrop($('#pcDz',md),async fs=>{try{image=await N().upload(fs[0],'face','pc');$('#pcDz .pv',md).style.backgroundImage=`url('${cssu(image)}')`}catch(x){N().toast('올리기 실패: '+x.message)}});$('#pcImgX',md).onclick=()=>{image='';$('#pcDz .pv',md).style.backgroundImage=''};
   $('#pcOk',md).onclick=async()=>{const v=$('#pcVis',md);const name=$('#pcName',md).value.trim();
    /* 10-29 망령: 제작기 트레이너면 이름 · 초상을 제작기에도 쓴다 (노트 칸은 사본) */
    const now=new Date().toISOString();const imCh=image!==imOf(p,tk);const imAt=imCh?now:(p.imageAt||'');const nmCh=!!name&&name!==nmOf(p,tk);const nmAt=nmCh?now:(p.nameAt||'');
    if(tk&&(nmCh||imCh)){try{await MK().edit('trainers',id,d=>{if(nmCh){d.name=name;d.nameAt=nmAt}if(imCh){d.image=image;d.imageAt=imAt}})}catch(x){N().toast('제작기에 못 썼어요 — 노트 초상이 먼저 보이고, GM 이 열 때 다시 넣어요: '+(x.message||x))}}
    await N().put(KD,id,Object.assign({},await fresh(KD,id),{name,player:$('#pcPl',md).value.trim(),sub:$('#pcSub',md).value.trim(),image},imAt?{imageAt:imAt}:{},nmAt?{nameAt:nmAt}:{}),v?v.value:undefined);N().closeModal();N().render()};return}
  /* 10-30 망령 「학생증은 클릭하면 안쪽 내용(이름 소속 학번 담당 자질 등)을 바꿀 수 있게」.
     이름 · 사진 · 자질은 제작기 트레이너에 쓴다(제작기에 없으면 이 시트에만). 소속 = p.sub · 학번 = p.stuNo(비우면 자동) · 담당 = p.player */
  if(k==='idedit'){const p=N().data(KD,id);if(!p||!canEditPc(id))return;await MK().load();const tk=MK().trainer(id);const rk=Object.assign({},(tk&&tk.ranks)||{});
   /* 10-30 망령 「학생증 고치기에 입력 칸 UI 도 좀 개선하고 여기서 스탠딩 이미지나 표정을 넣어 둘 수 있도록 — 제작기에도 있던, 웹툴로 넘길 수 있는 그 기능」:
      두 장(학생증 · 스탠딩 · 표정). 스탠딩 = 제작기 트레이너 stands[{label(표정 이름), src, point(보정 px), kind}] · standActive(기본) — 제작기와 같은 칸이라 웹툴 명단 「제작기 동기화」 때 무대 그림으로 넘어간다 */
   const RK=['S','AAA+','AAA','AAA-','AA+','AA','AA-','A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','E+','E','E-'];
   let stands=tk?JSON.parse(JSON.stringify(Array.isArray(tk.stands)?tk.stands:[])):[];let sAct=tk?Math.max(0,Math.min(stands.length-1,+tk.standActive||0)):0;let stCh=false;
   const fld=(lab,html,cls)=>`<label class="idfl ${cls||''}"><span>${lab}</span>${html}</label>`;
   const md=N().openModal(`<div class="mhead"><h2>${NPC?'교직원증':'학생증'} 고치기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
    <div class="idtabs" role="tablist"><button type="button" class="on" data-idt="card" role="tab">🪪 ${NPC?'교직원증':'학생증'}</button><button type="button" data-idt="stand" role="tab">🧍 스탠딩 · 표정 <small id="idStN">${stands.length||''}</small></button></div>
    <div class="idpane" data-pane="card">
     <div class="idtop"><div class="idph"><div class="updz" id="idDz"><div class="pv" style="${imOf(p,tk)?`background-image:url('${cssu(imOf(p,tk))}')`:''}"></div><b>사진</b><span>끌어다 놓기 · 누르기</span></div><button type="button" class="btn xs ghost" id="idImgX">사진 빼기</button></div>
      <div class="idmain"><fieldset class="idfs"><legend>기본</legend><div class="idg">${fld('성명',`<input id="idName" type="text" value="${esc(nmOf(p,tk))}" class="big">`,'w2')}${fld(NPC?'직위':'소속',`<input id="idSub" type="text" value="${esc(p.sub||'')}" placeholder="예: 고고학과 2학년">`)}${fld(NPC?'번호':'학번',`<input id="idNo" type="text" value="${esc(p.stuNo||'')}" placeholder="${esc(stuNo(id))} (비우면 자동)">`)}${NPC?'':fld('담당',`<input id="idPl" type="text" value="${esc(p.player||'')}" placeholder="플레이어">`)}</div></fieldset>
       ${tk?`<fieldset class="idfs"><legend>자질 <small>제작기 포인트 · 레벨 계산도 따라 바뀌어요</small></legend><div class="idrk">${['지시','육성','통솔','능력'].map(q=>`<label class="idrkc"><span>${q}</span><input data-rk="${q}" type="text" list="idRkL" value="${esc(rk[q]||'')}" autocomplete="off" maxlength="4"></label>`).join('')}</div><datalist id="idRkL">${RK.map(r=>`<option value="${r}">`).join('')}</datalist></fieldset>`:''}</div></div>
     <fieldset class="idfs"><legend>기재 사항 <small>${NPC?'교직원증':'학생증'} 아래칸</small></legend><div class="idg">${fld(NPC?'연구실':'기숙사',`<input id="idDorm" type="text" value="${esc(p.dorm||'')}" placeholder="${NPC?'예: 제2 연구동 301호':'예: 동 기숙사 204호'}">`)}${fld(NPC?'담당 과목':'동아리',`<input id="idClub" type="text" value="${esc(p.club||'')}" placeholder="${NPC?'예: 각성체 생태학':'예: 모의전 연구회'}">`)}${fld('한마디',`<input id="idMotto" type="text" value="${esc(p.motto||'')}" placeholder="좌우명 · 자기소개 한 줄">`,'w2')}${fld('비고',`<textarea id="idNote" rows="3" placeholder="학생증 뒷면에 적어 둘 것 — 특기 · 알레르기 · 비상 연락 · 소문 …">${esc(p.idNote||'')}</textarea>`,'w2')}</div></fieldset>
     ${tk?'<p class="small dim" style="margin:6px 0 0">이름 · 사진 · 자질은 제작기 트레이너에도 같이 저장돼요.</p>':''}
    </div>
    <div class="idpane" data-pane="stand" hidden>${tk?`<p class="small dim" style="margin:0 0 8px">웹툴(오레마스) 무대에 서는 그림이에요 — 제작기 「스탠딩」과 같은 칸이라 웹툴 명단의 「제작기 동기화」 때 넘어가요. <b>파일 이름이 표정 이름</b>이 되고, 같은 이름이면 그림만 바뀌어요. ★ = 기본 표정. 투명 PNG 그대로 올라가요 (5MB 까지).</p>
     <div class="updz idstdz" id="idStDz"><b>＋ 스탠딩 · 표정 그림 올리기</b><span>여러 장 한 번에 끌어 놓기 · 누르기 — 예: 기본.png · 웃음.png · 화남.png</span></div><div class="idst" id="idSt"></div>`:`<div class="empty small">제작기에 이 트레이너가 없어 스탠딩을 둘 곳이 없어요. 시트의 「⇪ 제작기로」로 먼저 보내 주세요.</div>`}</div>
    <div class="row" style="margin-top:12px"><span class="small dim" id="idMsg"></span><span class="sp"></span><button class="btn pri" id="idOk">저장</button></div>`,'idedm');
   $$('[data-idt]',md).forEach(b2=>b2.onclick=()=>{$$('[data-idt]',md).forEach(x=>x.classList.toggle('on',x===b2));$$('[data-pane]',md).forEach(x=>x.hidden=x.dataset.pane!==b2.dataset.idt)});
   let image=imOf(p,tk);N().bindDrop($('#idDz',md),async fs=>{try{image=await N().upload(fs[0],'face','pc');$('#idDz .pv',md).style.backgroundImage=`url('${cssu(image)}')`}catch(x){N().toast('올리기 실패: '+x.message)}});$('#idImgX',md).onclick=()=>{image='';$('#idDz .pv',md).style.backgroundImage=''};
   const stBox=$('#idSt',md);
   const stDraw=()=>{if(!stBox)return;$('#idStN',md).textContent=stands.length||'';stBox.innerHTML=stands.length?stands.map((s2,i)=>`<div class="idsc ${i===sAct?'on':''}" data-si="${i}"><button type="button" class="idscp" data-sdef="${i}" title="눌러서 기본 표정으로"><img src="${esc(s2.src)}" alt="" loading="lazy">${i===sAct?'<span class="idscb">★ 기본</span>':''}</button>
     <input type="text" data-slab="${i}" value="${esc(s2.label||'')}" placeholder="표정 이름" aria-label="표정 이름">
     <div class="idscf"><select data-skind="${i}" title="웹툴 무대에 서는 모양">${[['','모양 자동'],['stand','스탠딩'],['portrait','초상 틀']].map(([v,n])=>`<option value="${v}" ${(s2.kind||'')===v?'selected':''}>${n}</option>`).join('')}</select><input type="number" data-spt="${i}" value="${+s2.point||0}" title="보정 — 위로 올릴 px (음수면 내림)" aria-label="보정"><button type="button" class="btn xs ghost danger" data-sdel="${i}" aria-label="지우기">×</button></div></div>`).join(''):'<div class="small dim" style="padding:8px 2px">아직 없어요 — 없으면 웹툴은 사진(초상)으로 세워요.</div>'};
   if(stBox){stDraw();
    N().bindDrop($('#idStDz',md),async fs=>{let add=0,rep=0,bad=0;for(const f of fs){if(f.size>5*1024*1024){bad++;continue}try{N().toast('올리는 중… '+f.name);const u=await N().DBS().uploadImage(`stands/${id}`,f);const label=(f.name||'').replace(/\.[^.]+$/,'').trim()||'기본';const e=stands.find(x=>(x.label||'')===label);if(e){e.src=u;rep++}else{stands.push({label:label.slice(0,40),src:u,point:0});add++}}catch(x){bad++}}
     stCh=true;stDraw();N().toast(`스탠딩 ${add}장 추가${rep?` · ${rep}장 교체`:''}${bad?` · ${bad}장 실패(5MB 넘거나 오류)`:''} — 저장을 눌러야 들어가요`)},true,'image/png,image/webp,image/gif,image/jpeg');
    stBox.addEventListener('click',e=>{const d=e.target.closest('[data-sdef]');if(d){sAct=+d.dataset.sdef;stCh=true;stDraw();return}const x=e.target.closest('[data-sdel]');if(x){const i=+x.dataset.sdel;stands.splice(i,1);if(sAct>i||sAct>=stands.length)sAct=Math.max(0,sAct-1);stCh=true;stDraw()}});
    stBox.addEventListener('input',e=>{const t2=e.target;if(t2.dataset.slab!=null){stands[+t2.dataset.slab].label=t2.value.slice(0,40);stCh=true}else if(t2.dataset.spt!=null){stands[+t2.dataset.spt].point=+t2.value||0;stCh=true}});
    stBox.addEventListener('change',e=>{const t2=e.target;if(t2.dataset.skind!=null){const s2=stands[+t2.dataset.skind];if(t2.value)s2.kind=t2.value;else delete s2.kind;stCh=true}})}
   $('#idOk',md).onclick=async()=>{const b=$('#idOk',md);b.disabled=true;const name=$('#idName',md).value.trim();const R={};$$('[data-rk]',md).forEach(x=>{R[x.dataset.rk]=x.value.trim().toUpperCase()});
    const rkCh=tk&&Object.keys(R).some(q=>R[q]!==(rk[q]||''));const now=new Date().toISOString();const imCh=image!==imOf(p,tk);const imAt=imCh?now:(p.imageAt||'');const nmCh=!!name&&name!==nmOf(p,tk);const nmAt=nmCh?now:(p.nameAt||'');const mkCh=tk&&(nmCh||imCh||rkCh||stCh);
    try{if(mkCh)await MK().edit('trainers',id,d=>{if(nmCh){d.name=name;d.nameAt=nmAt}if(imCh){d.image=image;d.imageAt=imAt}if(rkCh)d.ranks=Object.assign({},d.ranks||{},R);if(stCh){d.stands=stands.filter(x=>x&&/^https?:\/\//.test(String(x.src||''))).map(x=>Object.assign({label:String(x.label||'기본').trim().slice(0,40)||'기본',src:x.src,point:+x.point||0},x.kind?{kind:x.kind}:{}));d.standActive=Math.max(0,Math.min(d.stands.length-1,sAct))}})}catch(x){N().toast('제작기에 못 썼어요 — 노트 사진이 먼저 보이고, GM 이 열 때 다시 넣어요: '+(x.message||x))}
    const pl=$('#idPl',md);await N().put(KD,id,Object.assign({},await fresh(KD,id),imAt?{imageAt:imAt}:{},nmAt?{nameAt:nmAt}:{},{name,sub:$('#idSub',md).value.trim(),stuNo:$('#idNo',md).value.trim(),player:pl?pl.value.trim():(p.player||''),image,dorm:$('#idDorm',md).value.trim(),club:$('#idClub',md).value.trim(),motto:$('#idMotto',md).value.trim(),idNote:$('#idNote',md).value.trim()}));if(stCh)await MK().load(true);N().closeModal();N().render()};return}
  if(k==='editbox'){const key=b.dataset.k,kind=b.dataset.kind;const docId=kind==='sec'?KD+':'+id:id;const cur=N().data(kind,docId)||{};const lab=([...PUB(),...PRIV,['t','GM 메모']].find(x=>x[0]===key)||['','메모'])[1];
   const md=N().openModal(`<div class="mhead"><h2>${esc(lab)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><textarea id="bxT" rows="8">${esc(cur[key]||'')}</textarea><div class="row" style="margin-top:10px"><span class="small dim">${kind==='pc'||kind==='npc'?'이 시트의 공개 설정대로 보여요':kind==='pcp'?'본인과 GM 에게만 보여요':'GM 에게만 보여요'}</span><span class="sp"></span><button class="btn pri" id="bxOk">저장</button></div>`);
   $('#bxT',md).focus();$('#bxOk',md).onclick=async()=>{const n=Object.assign({},cur,{[key]:$('#bxT',md).value.trim()});const vis=kind==='pc'||kind==='npc'?undefined:kind==='pcp'?'pl:'+id:'gm';if((kind==='pc'||kind==='npc')&&!N().doc(kind,id))return N().toast('시트를 찾지 못했어요 — 새로고침해 주세요');await N().put(kind,docId,n,vis);N().closeModal()};return}
  if(k==='editgrp'){const g=b.dataset.g,gk=b.dataset.gk;const t=MK().trainer(id);
   if(gk==='priv'||gk==='gm'){const kind=gk==='priv'?'pcp':'sec',docId=gk==='priv'?id:KD+':'+id;const cur=N().data(kind,docId)||{};const F=gk==='priv'?PRIV:[['t',g]];
    const md=N().openModal(`<div class="mhead"><h2>${esc(g)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="rpged">${F.map(([kk,l])=>`<label class="rpgf"><span>${esc(l)}</span><textarea data-gf="${kk}" rows="${F.length>1?6:10}">${esc(cur[kk]||'')}</textarea></label>`).join('')}</div>
     <div class="row" style="margin-top:10px"><span class="small dim">${gk==='priv'?'본인과 GM 에게만 보여요':'GM 에게만 보여요'}</span><span class="sp"></span><button class="btn pri" id="gOk">저장</button></div>`,'rpgm');
    const f0=$('[data-gf]',md);if(f0)f0.focus();
    $('#gOk',md).onclick=async()=>{const n=Object.assign({},cur);$$('[data-gf]',md).forEach(x=>{n[x.dataset.gf]=x.value.replace(/\s+$/,'')});await N().put(kind,docId,n,gk==='priv'?'pl:'+id:'gm');N().closeModal()};return}
   const L0=sheetBio(id,NPC);const fixedL=bioDef(t?t.kind==='npc'||NPC:NPC);let items=L0.filter(x=>grpOf(x.k)===g).map(x=>({k:x.k,v:x.v,fixed:fixedL.includes(x.k)}));const isMemo=g==='메모';
   const md=N().openModal(`<div class="mhead"><h2>${esc(g)}</h2><span class="small dim" style="margin-left:8px">${esc(items.map(x=>x.k).join(' · '))}</span><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="rpged" id="gF"></div>
    <div class="row" style="margin-top:10px">${isMemo?'<button class="btn xs ghost" id="gAdd" title="제작기 「상세」의 「+ 항목」과 같아요">＋ 항목</button>':''}<span class="small dim">${t?'제작기 트레이너 「상세」에 바로 저장돼요':'이 시트에 저장 · 「⇪ 제작기로」를 누르면 제작기 「상세」로 가요'}</span><span class="sp"></span><button class="btn pri" id="gOk">저장</button></div>`,'rpgm');
   const draw=()=>{$('#gF',md).innerHTML=items.map((x,i)=>`<label class="rpgf" data-i="${i}"><span>${esc(x.k)}${x.fixed?'':` <button type="button" class="linkbtn small danger" data-gdel="${i}" title="이 항목 지우기">지우기</button>`}</span><textarea data-gi="${i}" rows="${Math.min(12,Math.max(3,String(x.v||'').split('\n').length+1))}">${esc(x.v||'')}</textarea></label>`).join('')};
   const keep=()=>$$('[data-gi]',md).forEach(x=>{items[+x.dataset.gi].v=x.value});draw();const f0=$('[data-gi]',md);if(f0)f0.focus();
   $('#gF',md).addEventListener('click',e=>{const d=e.target.closest('[data-gdel]');if(!d)return;e.preventDefault();keep();items[+d.dataset.gdel].del=true;items[+d.dataset.gdel].v='';$('[data-i="'+d.dataset.gdel+'"]',md).hidden=true});
   const ga=$('#gAdd',md);if(ga)ga.onclick=async()=>{keep();const n=await N().promptBox('새 항목 이름','','예: 좋아하는 것 · 대사 · 외모');if(n==null||!n.trim())return;const k2=n.trim();if(L0.some(x=>x.k===k2)||items.some(x=>x.k===k2))return N().toast('같은 이름의 항목이 이미 있어요');items.push({k:k2,v:'',fixed:false,fresh:true});draw();const ls=$$('[data-gi]',md);ls[ls.length-1].focus()};
   $('#gOk',md).onclick=async()=>{keep();const ch={};for(const x of items){if(x.del){if(!x.fresh)ch[x.k]=null;continue}const v=String(x.v||'').replace(/\s+$/,'');const was=(L0.find(q=>q.k===x.k)||{v:''}).v;if(v!==was||x.fresh)ch[x.k]=v}
    if(!Object.keys(ch).length)return N().closeModal();const ok=$('#gOk',md);ok.disabled=true;try{await bioSave(id,ch);N().closeModal()}catch(e){ok.disabled=false;N().toast(e.message||String(e))}};return}
  if(k==='editbio'||k==='bioadd'){let lab=b.dataset.bk||'';if(k==='bioadd'){const n=await N().promptBox('새 항목 이름','','예: 좋아하는 것 · 대사 · 외모');if(n==null||!n.trim())return;lab=n.trim()}
   const L0=sheetBio(id,NPC);const cur=(L0.find(x=>x.k===lab)||{v:''}).v;const t=MK().trainer(id)||(N().DBS().makerGet?await N().DBS().makerGet('trainers',id).then(r=>r&&Object.assign({id},(r.data&&r.data.data)||r.data||{})).catch(()=>null):null);const fixed=bioDef(t?t.kind==='npc'||NPC:NPC).includes(lab);
   const md=N().openModal(`<div class="mhead"><h2>${esc(lab)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><textarea id="bxT" rows="8">${esc(cur)}</textarea><div class="row" style="margin-top:10px"><span class="small dim">${t?'제작기 트레이너 「상세」에 바로 저장돼요 · 오레마스엔 「제작기 동기화」로':'이 시트에 저장 · 「⇪ 제작기로」를 누르면 제작기 「상세」로 가요'}</span><span class="sp"></span>${fixed?'':'<button class="btn xs ghost danger" id="bxDel">항목 지우기</button>'}<button class="btn pri" id="bxOk">저장</button></div>`);
   $('#bxT',md).focus();
   const save=async v=>{const set=L=>{const e=L.find(x=>x.k===lab);if(v==null){const i=L.indexOf(e);if(i>=0)L.splice(i,1)}else if(e)e.v=v;else L.push({k:lab,v});return L.filter(x=>String(x.v||'').trim()).map(x=>({k:x.k,v:x.v}))};
    if(t){const DB=N().DBS();if(!DB.makerPut)return N().toast('이 화면에서는 제작기에 쓸 수 없어요');const curD=await DB.makerGet('trainers',id);if(!curD)return N().toast('제작기 문서를 찾지 못했어요');const doc=JSON.parse(JSON.stringify(curD.data||{}));const d=doc.data||doc;const p=N().data(KD,id)||{};const pb=pend(p,d,'bio');
     d.bio=set(bioMerge(d.kind==='npc'||NPC,pb?bioOver(d.bio,p.bio):d.bio,d.rp,oldOf(p)));if(pb)d.bioAt=p.bioAt;delete d.rp;delete d.rpAt;await DB.makerPut('trainers',id,doc);
     if(Object.keys(oldOf(p)).length&&N().doc(KD,id)){const np=Object.assign({},p);for(const kk of ['bg','goal','bond','style','note'])delete np[kk];await N().put(KD,id,np)}   /* 옮겨 간 예전 노트 칸은 비운다 */
     await MK().load(true);N().render()}
    else{if(!N().doc(KD,id))return N().toast('시트를 찾지 못했어요 — 새로고침해 주세요');await N().patch(KD,id,p=>{p.bio=set(bioMerge(NPC,p.bio,oldOf(p)));p.bioAt=new Date().toISOString();for(const kk of ['bg','goal','bond','style','note'])delete p[kk]})}
    N().closeModal()};
   $('#bxOk',md).onclick=()=>save($('#bxT',md).value.replace(/\s+$/,''));const bd=$('#bxDel',md);if(bd)bd.onclick=()=>save(null);return}
  if(k==='bioall'){await MK().load(true);const L=pcs().filter(p=>Object.keys(oldOf(p)).length&&MK().trainer(p.id));if(!L.length)return N().toast('옮길 칸이 없어요');if(!await N().confirmBox(`${L.length}개 시트의 예전 공개 칸을 제작기 트레이너 「상세」의 빈 칸으로 옮길까요? 제작기에 이미 적힌 칸은 덮어쓰지 않아요.`,'옮기기'))return;
   const DB=N().DBS();let n=0;for(const p of L){try{const curD=await DB.makerGet('trainers',p.id);if(!curD)continue;const doc=JSON.parse(JSON.stringify(curD.data||{}));const d=doc.data||doc;d.bio=bioMerge(d.kind==='npc'||NPC,d.bio,d.rp,oldOf(p)).filter(x=>String(x.v||'').trim());delete d.rp;delete d.rpAt;await DB.makerPut('trainers',p.id,doc);const np=Object.assign({},N().data(KD,p.id)||{});for(const kk of ['bg','goal','bond','style','note'])delete np[kk];await N().put(KD,p.id,np);n++}catch(e){console.warn('bioall',p.id,e)}}
   await MK().load(true);N().render();N().toast(`${n}개 시트를 옮겼어요`);return}
  if(k==='tomk')return toMaker(id);
  if(k==='frommk'){await MK().load(true);const t=MK().trainer(id);if(!t)return N().toast('제작기에 이 트레이너가 없어요');const p=N().data(KD,id)||{};if(!await N().confirmBox(`제작기의 「${t.name}」 이름 · 초상으로 이 시트를 덮어쓸까요? (상세 칸은 늘 제작기와 같아요) 세션 기록 · 비밀 칸 · GM 메모는 그대로예요.`,'가져오기'))return;await N().put(KD,id,Object.assign({},p,fromTrainer(t,{order:p.order,log:p.log||[],player:p.player||'',sub:p.sub||''})));N().toast('제작기에서 가져왔어요');return}
  if(k==='logadd'){const s=await N().promptBox('몇 세션? (예: 3)','','');if(s==null)return;const t=await N().promptBox('기록','','한 줄');if(t==null||!t.trim())return;await N().patch(KD,id,p=>{p.log=p.log||[];p.log.push({s:s.trim(),t:t.trim(),at:Date.now()})});return}
  if(k==='logdel'){if(!await N().confirmBox('이 세션 기록을 지울까요?','지우기'))return;await N().patch(KD,id,p=>{(p.log||[]).splice(+b.dataset.i,1)});return}
  if(k==='del'){const p=N().data(KD,id);if(!await N().confirmBox(`「${p.name||id}」 시트를 캠페인에서 뺄까요? (제작기 트레이너는 그대로예요)`,'빼기'))return;await N().del(KD,id);if(N().doc('pcp',id))await N().del('pcp',id);if(N().doc('sec',KD+':'+id))await N().del('sec',KD+':'+id);U.sel='';return}}
 /* 10-30 망령 「PC 시트 옆에 NPC 시트」: 시트 탭 작은 탭 「PC 시트 · NPC 시트」 = 화면 pc · npc (같은 그리기, U.mode 만 다름).
    예전 부르는 법(MOD.pc.mode('npc') 뒤 go('pc'))은 NPC 시트 화면으로 넘긴다 */
 const as=m=>el=>{if(m==='pc'&&U.want==='npc'){U.want='';const s=U.sel;setTimeout(()=>{U.mode='npc';U.sel=s;N().go('npc')},0);return}U.want='';if(U.mode!==m){U.mode=m;U.sel=''}render(el)};
 N().MOD.pc={render:as('pc'),mode:m=>{U.mode=m;U.sel='';U.want=m},select:id=>{U.sel=id}};
 N().MOD.npc={render:as('npc'),mode:m=>{U.mode=m;U.sel='';U.want=m},select:id=>{U.sel=id}};
})();
