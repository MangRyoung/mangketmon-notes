/* ---------- PC 시트 탭 ----------
   왼쪽: 이 캠페인의 PC 목록 (pc 문서 = 제작기 트레이너 id 로 연결). 제작기 쪽 이름 · 초상 · 랭크 · 포켓몬은 읽기 전용으로 보여 주고,
   RP 칸(배경 · 목표 · 인간관계 · 비밀 · 세션 기록)만 여기서 쓴다. 공개 칸(pub)은 모두, 「본인만」 칸은 pl:<좌석> 문서(pcp), GM 메모는 sec.
   GM: PC 추가(제작기 트레이너 고르기) · 모든 칸 편집. PL: 제 좌석 PC 의 pc · pcp 문서만 편집. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const U={sel:'',mode:'pc'};const K=()=>U.mode==='npc'?'npc':'pc';
 const MK=()=>window.NT_MAKER;
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
 const sheetBio=(id,npc)=>{const t=MK().trainer(id);const p=N().data(npc?'npc':'pc',id)||{};return t?bioMerge(t.kind==='npc'||npc,t.bio,t.rp,oldOf(p)):bioMerge(npc,p.bio,oldOf(p))};
 const PUB_NPC=[['bg','정체 · 설정'],['goal','원하는 것 · 동기'],['bond','인간관계'],['style','말투 · 겉모습'],['note','PL 이 아는 것']];
 const PUB=()=>U.mode==='npc'?PUB_NPC:PUB_PC;
 const PRIV=[['secret','비밀 · 속마음'],['plan','꿍꿍이 · 계획']];
 const canEditPc=id=>N().gm()||(U.mode==='pc'&&N().me()===id);
 const entOf=name=>N().list('ents').find(e=>e.type==='인물'&&e.title===name);
 function render(el){const G=N().gm();const L=pcs();const sel=U.sel&&N().data(K(),U.sel)?U.sel:(L[0]||{}).id||'';U.sel=sel;const NPC=U.mode==='npc';const nPc=N().list('pc').length,nNpc=N().list('npc').length;
  el.innerHTML=`<div class="toolbar"><h2>${NPC?'NPC 시트':'PC 시트'}</h2><div class="seg"><button data-pm="pc" class="${!NPC?'on':''}">PC ${nPc}</button><button data-pm="npc" class="${NPC?'on':''}">NPC ${nNpc}</button></div><span class="note">트레이너 · 포켓몬은 제작기 값(읽기 전용) · RP 칸은 여기서</span><span class="sp"></span>${G?`<button class="btn sm pri" data-p="add">＋ ${NPC?'NPC':'PC'} (제작기에서)</button>`:''}${!NPC&&N().me()&&!N().data('pc',N().me())?'<button class="btn sm pri" data-p="mine">내 PC 시트 만들기</button>':''}<button class="btn xs ghost" data-p="reload" title="제작기 값 다시 읽기">↻ 제작기</button></div>
   ${L.length?`<div class="split"><div><div class="pcgrid">${L.map(p=>card(p)).join('')}</div>${sel?sheet(sel):''}</div><aside class="side">${sel?sideInfo(sel):''}</aside></div>`:`<div class="empty">아직 ${NPC?'NPC':'PC'} 가 없어요.${G?` 「＋ ${NPC?'NPC':'PC'}」로 제작기 트레이너를 골라 넣어요.`:''}${!NPC&&N().me()?' 「내 PC 시트 만들기」를 눌러요.':''}</div>`}`;
  el.addEventListener('click',e=>{const pm=e.target.closest('[data-pm]');if(pm){U.mode=pm.dataset.pm;U.sel='';N().render();return}
   const en=e.target.closest('[data-goent]');if(en){N().go('ents');setTimeout(()=>window.NT_ENTS&&NT_ENTS.select(en.dataset.goent),0);return}
   const pg=e.target.closest('[data-pmgo]');if(pg){e.preventDefault();const t=document.getElementById('pm-'+pg.dataset.pmgo);if(t){t.scrollIntoView({behavior:'smooth',block:'start'});t.classList.add('flash');setTimeout(()=>t.classList.remove('flash'),900)}return}
   const c=e.target.closest('[data-pc]');if(c){U.sel=c.dataset.pc;N().render();const sh=$('.pcsheet');if(sh)sh.scrollIntoView({behavior:'smooth',block:'start'});return}
   const b=e.target.closest('[data-p]');if(b)act(b.dataset.p,b)});
  /* 10-26 망령: 카드 끌어서 순서 바꾸기(GM) · 우클릭 · 길게 누르기 메뉴 */
  const grid=$('.pcgrid',el);if(grid&&G)N().sortable(grid,'.pccard',ids=>N().reorder(K(),ids));
  if(grid)N().bindCtx(grid,'.pccard',c=>ctxItems(c.dataset.id))}
 function ctxItems(id){const KD=K();const d=N().doc(KD,id);if(!d)return null;const p=d.data;const G=N().gm();const cur=d.vis||'pub';const it=[];
  if(G){[['pub','👥 모두에게'],['gm','🔒 GM만']].forEach(([v,l])=>it.push({t:l+(v===cur?' ✓':''),on:async()=>{if(v===cur)return;await N().put(KD,id,N().clone(p),v);N().toast('공개 범위: '+N().visLabel(v))}}));it.push('-')}
  if(canEditPc(id))it.push({t:'✎ 기본 칸 고치기',on:()=>act('edit',{dataset:{id}})});
  if(window.NT_FAV)it.push({t:(NT_FAV.has(KD,id)?'★ 즐겨찾기에서 빼기':'☆ 즐겨찾기'),on:()=>NT_FAV.toggle(KD,id,p.name||id)});
  if(G){it.push('-');it.push({t:'🗑 빼기',danger:true,on:()=>act('del',{dataset:{id}})})}
  return it}
 function card(p){const t=MK().trainer(p.id)||{};const ms=MK().mons(p.id);const img=p.image||t.image||'';const rk=t.ranks||{};
  return `<button type="button" class="pccard ${p.id===U.sel?'on':''}" data-pc="${esc(p.id)}" data-id="${esc(p.id)}" data-drag><span class="por" style="${img?`background-image:url('${cssu(img)}')`:''}"></span><span style="min-width:0;flex:1"><b>${esc(p.name||t.name||p.id)}</b><small class="dim">${esc(p.player||'')}${p.player&&p.sub?' · ':''}${esc(p.sub||'')}</small><span class="rk">${['지시','육성','통솔','능력'].map(k=>`<span>${k} ${esc(rk[k]||'-')}</span>`).join('')}</span><span class="mons">${ms.slice(0,6).map(m=>`<i title="${esc(m.name||'')}" style="${MK().img(m)?`background-image:url('${cssu(MK().img(m))}')`:''}"></i>`).join('')}</span>${N().visBadge(p._vis,K(),p.id)}</span></button>`}
 function sheet(id){const KD=K();const NPC=U.mode==='npc';const p=N().data(KD,id)||{};const ent=entOf(p.name||((MK().trainer(id)||{}).name));const t=MK().trainer(id);const ms=MK().mons(id);const G=N().gm(),E=canEditPc(id);const priv=N().data('pcp',id)||{};const sec=N().data('sec',KD+':'+id)||{};const img=p.image||(t&&t.image)||'';const rk=(t&&t.ranks)||{};
  const box=(k,lab,v,cls,editable,kind)=>`<div class="rpbox ${cls||''}" data-k="${k}" data-kind="${kind}"><h4>${lab}${cls==='priv'?' <span class="visb pl">👤 본인 · GM</span>':cls==='gm'?' <span class="visb gm">🔒 GM</span>':''}<span class="sp"></span>${editable?`<button class="btn xs ghost" data-p="editbox" data-k="${k}" data-kind="${kind}">✎</button>`:''}</h4><div class="pre">${esc(v||'')||'<span class="dim">—</span>'}</div></div>`;
  const bioBox=(id,x,E,i)=>`<div class="rpbox" data-bk="${esc(x.k)}"><h4>${esc(x.k)}${t?' <span class="visb" title="제작기 트레이너 프로필 「상세」와 같은 칸이에요">⇄ 제작기</span>':''}<span class="sp"></span>${E?`<button class="btn xs ghost" data-p="editbio" data-id="${esc(id)}" data-bk="${esc(x.k)}">✎</button>`:''}</h4><div class="pre">${esc(x.v||'')||'<span class="dim">—</span>'}</div></div>`;
  return `<div class="pcsheet" style="margin-top:14px"><div class="hero"><span class="por" style="${img?`background-image:url('${cssu(img)}')`:''}"></span><div style="flex:1;min-width:200px"><div class="row"><h2>${esc(p.name||(t&&t.name)||id)}</h2>${window.NT_FAV?NT_FAV.btn(KD,id,p.name||(t&&t.name)||id):''}${N().visBadge((N().doc(KD,id)||{}).vis,KD,id)}${ent?`<button class="btn xs ghost" data-goent="${esc(ent.id)}" title="항목(인물)으로">📇 항목</button>`:''}<span class="sp"></span>${E?`<button class="btn xs" data-p="edit" data-id="${esc(id)}">기본 칸 고치기</button>`:''}${E?`<button class="btn xs ghost" data-p="tomk" data-id="${esc(id)}" title="이 시트의 이름 · 초상 · 종류를 제작기 트레이너로 보내요${t?'':' (제작기에 새로 만들어요)'}">⇪ 제작기로</button>`:''}${E&&t?`<button class="btn xs ghost" data-p="frommk" data-id="${esc(id)}" title="제작기의 이름 · 초상을 이 시트로 다시 가져와요 (상세 칸은 늘 제작기와 같아요)">⇩ 제작기에서</button>`:''}${G?`<button class="btn xs ghost danger" data-p="del" data-id="${esc(id)}">빼기</button>`:''}</div>
    <div class="dim">${esc(p.player?'플레이어 · '+p.player:'')}${p.sub?(p.player?' · ':'')+esc(p.sub):''}</div>
    ${t?`<div class="rk">${['지시','육성','통솔','능력'].map(k=>`<span>${k}<b>${esc(rk[k]||'-')}</b></span>`).join('')}</div><div class="small dim">제작기 시트 · ${esc(t.kind==='npc'?'NPC':'PC')}${t.folder?' · '+esc(t.folder):''} <a href="${esc((window.NT_CONFIG||{}).makerUrl||'#')}" target="_blank" rel="noopener">제작기에서 열기</a></div>`:`<div class="small dim">제작기에 이 id 의 트레이너가 없어요 — 노트에서만 쓰는 시트${E?' · 「⇪ 제작기로」로 제작기에 만들 수 있어요':''}</div>`}
    ${ms.length?`<div class="party">${ms.map(m=>`<a class="mon" href="#pm-${esc(m.id)}" data-pmgo="${esc(m.id)}">${monPic(m)}${esc(m.name||'')}</a>`).join('')}</div>`:''}</div></div>
   ${partySec(t,ms)}
   <div class="rpgrid">${sheetBio(id,NPC).map((x,i)=>bioBox(id,x,E,i)).join('')}${E?`<button type="button" class="rpbox rpadd" data-p="bioadd" data-id="${esc(id)}" title="제작기 「상세」의 「+ 항목」과 같아요">＋ 항목</button>`:''}${(!NPC&&(E||G))?PRIV.map(([k,l])=>box(k,l,priv[k],'priv',E,'pcp')).join(''):''}${G?box('t',NPC?'GM 메모 · 숨기는 것':'GM 메모',sec.t,'gm',true,'sec'):''}</div>
   <div class="rpbox" style="margin-top:10px"><h4>세션 기록<span class="sp"></span>${E?`<button class="btn xs ghost" data-p="logadd" data-id="${esc(id)}">＋ 기록</button>`:''}</h4><div class="sesslog">${(p.log||[]).slice().reverse().map((x,i)=>`<div class="ent"><b>${esc(x.s||'')}</b>${esc(x.t||'')}${E?` <button class="linkbtn small" data-p="logdel" data-id="${esc(id)}" data-i="${(p.log||[]).length-1-i}">지우기</button>`:''}</div>`).join('')||'<span class="dim small">세션마다 한 줄씩 남겨요</span>'}</div></div></div>`}
 const T2C={'노말':'#9aa','불꽃':'#f08030','물':'#6890f0','풀':'#78c850','전기':'#f8d030','얼음':'#98d8d8','격투':'#c03028','독':'#a040a0','땅':'#e0c068','비행':'#a890f0','에스퍼':'#f85888','벌레':'#a8b820','바위':'#b8a038','고스트':'#705898','드래곤':'#7038f8','악':'#705848','강철':'#b8b8d0','페어리':'#ee99ac'};
 const tchip=t=>t&&t!=='-'?`<em class="tch" style="background:${T2C[t]||'#666'}">${esc(t)}</em>`:'';
 /* 10-26 망령: 파티 = 제작기 시트 그대로 (레벨 · 타입 · 종족치 · 특성 · 소지품 · 기술 · 전용 · 포텐셜) */
 const monPic=m=>{const u=MK().img(m);return `<i class="${u?'':'noimg'}" style="${u?`background-image:url('${cssu(u)}')`:''}">${u?'':esc([...(m.name||'?')][0]||'?')}</i>`};
 const brN=v=>String(v==null?'':v).replace(/<br\s*\/?>/gi,'\n').replace(/\\n/g,'\n');
 const STL=['HP','공격','방어','특공','특방','스피드'];
 function partySec(t,ms){if(!ms.length)return '';if(!MK().dbReady())MK().db().then(()=>N().render());
  return `<div class="rpbox pty" style="margin-top:10px"><h4>파티 ${ms.length}체 <small class="dim">제작기 값 · 읽기 전용${t?'':' · 제작기에 없는 트레이너'}</small></h4><div class="ptygrid">${ms.map(m=>monCard(t||{},m)).join('')}</div></div>`}
 function monCard(t,m){const E=m.effTxt||{};const rk=(t.ranks||{})['육성'];const lv=MK().baseLv(rk)+(Math.round(+m.dist)||0);
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
   ${m.ability?line('특성',m.ability,E.ab):''}${items.map(x=>line('소지품',x.n,x.e)).join('')}
   ${mv.length?`<div class="pmmv">${mv.map(x=>{const r=MK().move(x.name);return `<div class="pmm" title="${esc(r?brN(r[13]||''):'')}">${r?tchip(r[5]):''}<b>${esc(x.name)}</b>${x.half?'<small class="pmb">할인</small>':''}<span class="sp"></span><small class="dim">${r?`${esc(r[6]||'')}${+r[7]?` · ${esc(r[7])}`:''}${r[8]&&r[8]!=='0'&&r[8]!=='-'?` · ${esc(r[8])}%`:''}`:''}</small></div>`}).join('')}</div>`:''}
   ${ex.map(x=>line('전용',x.name,x.eff)).join('')}
   ${pots.length?`<details class="pmpot"><summary>포텐셜 ${pots.length} <span class="dim small">${pots.map(x=>esc(x.n)).join(' · ')}</span></summary>${pots.map(x=>`<div class="pml"><span class="pmk">${esc(kindOf(x.i)||'포텐셜')}</span><b>『${esc(x.n)}』</b>${effOf(x.i)?`<div class="pme pre">${esc(effOf(x.i))}</div>`:''}</div>`).join('')}</details>`:''}
   ${m.memo?`<details class="pmpot"><summary>메모</summary><div class="pme pre">${esc(m.memo)}</div></details>`:''}
  </div>`}
 window.NT_PCX={partySec,monCard};   /* 미리보기 · 점검용 */
 function monRow(m){const mv=(m.moves||[]).map(x=>typeof x==='string'?x:(x&&(x.name||x.n))||'').filter(Boolean);const pots=(m.pots||[]).filter(Boolean);
  return `<div class="monrow"><i style="${MK().img(m)?`background-image:url('${cssu(MK().img(m))}')`:''}"></i><div class="mb"><div class="row" style="gap:6px"><b>${esc(m.name||'')}</b>${tchip(m.t1)}${tchip(m.t2)}${m.tera&&m.tera!=='-'?`<small class="dim">테라 ${esc(m.tera)}</small>`:''}</div><div class="small">${m.ability?'특성 '+esc(m.ability):''}${m.item?' · 소지품 '+esc(m.item):''}${m.dist?' · 분배 '+esc(m.dist):''}</div>${mv.length?`<div class="small dim">기술 · ${mv.map(esc).join(' · ')}</div>`:''}${pots.length?`<div class="small dim">포텐셜 · ${pots.map(esc).join(' · ')}</div>`:''}${m.memo?`<div class="small pre" style="margin-top:3px">${esc(m.memo)}</div>`:''}</div></div>`}
 function sideInfo(id){const t=MK().trainer(id);if(!t)return '';const u=(t.unique||[]).filter(x=>x&&x.name);const base=t.base||{};const det=t.detail||{};
  return `<div class="card"><h3>제작기 정보 <small>읽기 전용</small></h3>${u.length?`<div class="sec">고유 포텐셜</div>${u.map(x=>`<div style="margin-bottom:6px"><b>${esc(x.name)}</b><div class="small pre dim">${esc(String(x.eff||'').replace(/<br\s*\/?>/gi,'\n'))}</div></div>`).join('')}`:''}
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
  const guess=(fs.find(f=>camp&&f.name&&f.name.includes(camp)&&(!NPC||/npc/i.test(f.name)))||fs.find(f=>camp&&f.name&&f.name.includes(camp))||{}).id||'';
  const fpath=f=>{const L=[];let c=f,n=0;while(c&&n++<6){L.unshift(c.name);c=c.parent?fs.find(x=>x.id===c.parent):null}return L.join(' / ')};
  const md=N().openModal(`<div class="mhead"><h2>⇪ 제작기로 보내기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">${t?`제작기의 <b>「${esc(t.name)}」</b> 트레이너를 고쳐요.`:'제작기에 이 이름으로 <b>새 트레이너</b>를 만들어요. 능력치 · 포켓몬은 제작기에서 채워 주세요.'}</p>
   <div class="tomk"><div><b>이름</b><span>${esc(nm)||'—'}</span></div><div><b>초상</b><span>${p.image?'노트 그림으로 바꿈':t&&t.image?'제작기 그림 그대로':'없음'}</span></div><div><b>종류</b><span>${NPC?'NPC':'PC'}</span></div><div><b>상세</b><span>${t?'제작기 「상세」와 이미 같은 칸이라 따로 안 보내요'+(myBio.length?' (이 시트에만 있던 칸은 빈 곳에 채워요)':''):myBio.length?myBio.map(x=>esc(x.k)).join(' · '):'비어 있음'}</span></div><div><b>안 보내는 것</b><span>비밀 칸 · GM 메모 · 세션 기록</span></div></div>
   ${t?'':`<div class="mrow" style="margin-top:10px"><label class="lbl">폴더<select id="tmF"><option value="">— 폴더 없음 —</option>${fs.map(f=>`<option value="${esc(f.id)}" ${f.id===guess?'selected':''}>${esc(fpath(f))}${f.priv?' 🔒':''}</option>`).join('')}</select></label><label class="lbl">공개<select id="tmP"><option value="1" ${NPC?'selected':''}>🔒 비공개 (GM · 폴더 주인)</option><option value="" ${NPC?'':'selected'}>모두</option></select></label></div><p class="small dim" style="margin:4px 0 0">비공개 폴더에 넣으면 트레이너도 그 폴더 주인의 비공개가 돼요.</p>`}
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="tmOk">${t?'제작기 고치기':'제작기에 만들기'}</button></div>`);
  $('#tmOk',md).onclick=async()=>{const b=$('#tmOk',md);b.disabled=true;b.textContent='보내는 중…';
   try{if(t){const cur=await DB.makerGet('trainers',id);if(!cur)throw new Error('제작기 문서를 찾지 못했어요');const doc=JSON.parse(JSON.stringify(cur.data||{}));const d=doc.data||doc;d.name=nm||d.name;if(p.image)d.image=p.image;d.kind=NPC?'npc':(d.kind||'pc');{const L=bioMerge(d.kind==='npc'||NPC,d.bio,d.rp);for(const x of myBio){const e=L.find(y=>y.k===x.k);if(!e)L.push(x);else if(!e.v.trim())e.v=x.v}d.bio=L.filter(x=>x.v.trim());delete d.rp;delete d.rpAt}await DB.makerPut('trainers',id,doc)}
    else{const fid=$('#tmF',md).value;const f=fs.find(x=>x.id===fid);const priv=!!$('#tmP',md).value||!!(f&&f.priv);const ord=Math.max(0,...MK().M.trainers.map(x=>+x._ord||0))+1;
     const d={name:nm||'새 트레이너',kind:NPC?'npc':'pc',pl:NPC?'':(p.player||''),folder:fid,image:p.image||'',ranks:{지시:'C',육성:'C',통솔:'C',능력:'C'},detail:{지시:'',육성:'',통솔:'',능력:''},solo:false,pts:[],extra:{},base:{},unique:[{name:'',eff:''}],ptMax:'',fields:[],sps:[],bio:myBio,pids:[]};
     if(priv){d.priv=true;if(f&&f.owner){d.owner=f.owner;d.ownerName=f.ownerName||''}}
     await DB.makerPut('trainers',id,{ord,data:d})}
    N().closeModal();await MK().load(true);N().render();N().toast(t?'제작기 트레이너를 고쳤어요':'제작기에 새 트레이너를 만들었어요')}
   catch(e){b.disabled=false;b.textContent='다시 시도';N().toast('보내지 못했어요: '+(e.message||e))}}}
 async function act(k,b){const id=b.dataset.id||U.sel;
  if(k==='reload'){await MK().load(true);N().render();return}
  const KD=K();const NPC=U.mode==='npc';
  if(k==='add'||k==='mine'){await MK().load(true);let ts=MK().trainers().filter(t=>!N().data(KD,t.id));if(NPC)ts.sort((a,b)=>(b.kind==='npc')-(a.kind==='npc')||String(a.folder||'').localeCompare(String(b.folder||''),'ko'));if(k==='mine')ts=ts.filter(t=>t.id===N().me());if(!ts.length&&!(k==='add'&&N().gm()))return N().toast(k==='mine'?'제작기에 내 좌석 id 의 트레이너가 없어요 (GM 이 좌석을 트레이너 id 로 만들어야 해요)':'넣을 트레이너가 없어요 (제작기에서 먼저 만들어요)');
   if(k==='mine'){await N().put('pc',ts[0].id,{name:ts[0].name,image:ts[0].image||'',player:'',sub:'',order:pcs().length,log:[]},'pub');U.sel=ts[0].id;N().render();return}
   const md=N().openModal(`<div class="mhead"><h2>${NPC?'NPC':'PC'} 넣기 — 제작기 트레이너${NPC?' <small class="dim">(NPC 로 표시된 것이 먼저)</small>':''}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="row" style="gap:6px;margin-bottom:8px"><input type="search" id="pkQ" placeholder="이름으로 찾기" style="flex:1">${N().gm()?`<button type="button" class="btn sm" id="pkNew" title="제작기 없이 노트에서 새 시트를 만들고, 나중에 「⇪ 제작기로」로 보낼 수 있어요">＋ 새로 만들기</button>`:''}</div>${(()=>{const fs=[...new Set(ts.map(t=>t.folder).filter(Boolean))];return fs.length?`<div class="row" style="gap:4px;flex-wrap:wrap;margin-bottom:8px"><span class="small dim">폴더째 넣기:</span>${fs.map(f=>`<button type="button" class="chip" data-pickfold="${esc(f)}">📁 ${esc(MK().folderName(f))} (${ts.filter(t=>t.folder===f).length})</button>`).join('')}</div>`:''})()}<div class="pcgrid" id="pkList">${ts.map(t=>`<button type="button" class="pccard" data-pick="${esc(t.id)}" data-q="${esc((t.name||'').toLowerCase())}"><span class="por" style="${t.image?`background-image:url('${cssu(t.image)}')`:''}"></span><span><b>${esc(t.name||t.id)}</b><small class="dim">${esc(t.kind==='npc'?'NPC':'PC')}${t.folder?' · '+esc(MK().folderName(t.folder)):''}</small><span class="rk">${['지시','육성','통솔','능력'].map(x=>`<span>${x} ${esc((t.ranks||{})[x]||'-')}</span>`).join('')}</span></span></button>`).join('')}</div>`,'wide');
   const pn=$('#pkNew',md);if(pn)pn.onclick=async()=>{const nm=await N().promptBox(NPC?'새 NPC 이름':'새 PC 이름','','');if(nm==null||!nm.trim())return;N().closeModal(true);const nid=N().uid(NPC?'n':'p');await N().put(KD,nid,{name:nm.trim(),image:'',player:'',sub:'',order:pcs().length,log:[]},NPC?'gm':'pub');U.sel=nid;N().render();N().toast('만들었어요 — 칸을 채운 뒤 「⇪ 제작기로」로 보낼 수 있어요')};
   $('#pkQ',md).oninput=e=>{const q=e.target.value.toLowerCase();$$('[data-pick]',md).forEach(x=>x.hidden=!!q&&!x.dataset.q.includes(q))};
   md.addEventListener('click',async e=>{const pf=e.target.closest('[data-pickfold]');if(pf){const list=ts.filter(t=>t.folder===pf.dataset.pickfold);N().closeModal();let n=pcs().length;await N().putMany(list.map(t=>({kind:KD,id:t.id,data:fromTrainer(t,{order:n++}),vis:NPC?'gm':'pub'})));U.sel=(list[0]||{}).id||'';N().render();return}
    const p=e.target.closest('[data-pick]');if(!p)return;const t=MK().trainer(p.dataset.pick);N().closeModal();await N().put(KD,t.id,fromTrainer(t,{order:pcs().length}),NPC?'gm':'pub');U.sel=t.id;N().render()});return}
  if(k==='edit'){const p=N().data(KD,id);if(!p)return;const md=N().openModal(`<div class="mhead"><h2>${NPC?'NPC':'PC'} 기본 칸</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="mrow"><label class="lbl">이름 (비우면 제작기 이름)<input id="pcName" type="text" value="${esc(p.name||'')}"></label><label class="lbl">${NPC?'역할 · 소속':'플레이어'}<input id="pcPl" type="text" value="${esc(p.player||'')}"></label><label class="lbl">한 줄<input id="pcSub" type="text" value="${esc(p.sub||'')}"></label>${N().gm()?`<label class="lbl">공개${N().visSelect(N().doc(KD,id).vis,'pcVis',{noPl:true})}</label>`:''}</div><div class="sec">초상 (비우면 제작기 초상)</div><div class="updz" id="pcDz"><div class="pv" style="${p.image?`background-image:url('${cssu(p.image)}')`:''}"></div><b>＋ 그림</b></div><div class="row" style="margin-top:12px"><button class="btn xs ghost" id="pcImgX">초상 빼기</button><span class="sp"></span><button class="btn pri" id="pcOk">저장</button></div>`);
   let image=p.image||'';N().bindDrop($('#pcDz',md),async fs=>{try{image=await N().upload(fs[0],'face','pc');$('#pcDz .pv',md).style.backgroundImage=`url('${cssu(image)}')`}catch(x){N().toast('올리기 실패: '+x.message)}});$('#pcImgX',md).onclick=()=>{image='';$('#pcDz .pv',md).style.backgroundImage=''};
   $('#pcOk',md).onclick=async()=>{const v=$('#pcVis',md);await N().put(KD,id,Object.assign({},p,{name:$('#pcName',md).value.trim(),player:$('#pcPl',md).value.trim(),sub:$('#pcSub',md).value.trim(),image}),v?v.value:undefined);N().closeModal()};return}
  if(k==='editbox'){const key=b.dataset.k,kind=b.dataset.kind;const docId=kind==='sec'?KD+':'+id:id;const cur=N().data(kind,docId)||{};const lab=([...PUB(),...PRIV,['t','GM 메모']].find(x=>x[0]===key)||['','메모'])[1];
   const md=N().openModal(`<div class="mhead"><h2>${esc(lab)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><textarea id="bxT" rows="8">${esc(cur[key]||'')}</textarea><div class="row" style="margin-top:10px"><span class="small dim">${kind==='pc'||kind==='npc'?'이 시트의 공개 설정대로 보여요':kind==='pcp'?'본인과 GM 에게만 보여요':'GM 에게만 보여요'}</span><span class="sp"></span><button class="btn pri" id="bxOk">저장</button></div>`);
   $('#bxT',md).focus();$('#bxOk',md).onclick=async()=>{const n=Object.assign({},cur,{[key]:$('#bxT',md).value.trim()});const vis=kind==='pc'||kind==='npc'?undefined:kind==='pcp'?'pl:'+id:'gm';if((kind==='pc'||kind==='npc')&&!N().doc(kind,id))return N().toast('시트를 찾지 못했어요 — 새로고침해 주세요');await N().put(kind,docId,n,vis);N().closeModal()};return}
  if(k==='editbio'||k==='bioadd'){let lab=b.dataset.bk||'';if(k==='bioadd'){const n=await N().promptBox('새 항목 이름','','예: 좋아하는 것 · 대사 · 외모');if(n==null||!n.trim())return;lab=n.trim()}
   const L0=sheetBio(id,NPC);const cur=(L0.find(x=>x.k===lab)||{v:''}).v;const t=MK().trainer(id);const fixed=bioDef(t?t.kind==='npc'||NPC:NPC).includes(lab);
   const md=N().openModal(`<div class="mhead"><h2>${esc(lab)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><textarea id="bxT" rows="8">${esc(cur)}</textarea><div class="row" style="margin-top:10px"><span class="small dim">${t?'제작기 트레이너 「상세」에 바로 저장돼요 · 오레마스엔 「제작기 동기화」로':'이 시트에 저장 · 「⇪ 제작기로」를 누르면 제작기 「상세」로 가요'}</span><span class="sp"></span>${fixed?'':'<button class="btn xs ghost danger" id="bxDel">항목 지우기</button>'}<button class="btn pri" id="bxOk">저장</button></div>`);
   $('#bxT',md).focus();
   const save=async v=>{const set=L=>{const e=L.find(x=>x.k===lab);if(v==null){const i=L.indexOf(e);if(i>=0)L.splice(i,1)}else if(e)e.v=v;else L.push({k:lab,v});return L.filter(x=>String(x.v||'').trim()).map(x=>({k:x.k,v:x.v}))};
    if(t){const DB=N().DBS();if(!DB.makerPut)return N().toast('이 화면에서는 제작기에 쓸 수 없어요');const curD=await DB.makerGet('trainers',id);if(!curD)return N().toast('제작기 문서를 찾지 못했어요');const doc=JSON.parse(JSON.stringify(curD.data||{}));const d=doc.data||doc;const p=N().data(KD,id)||{};
     d.bio=set(bioMerge(d.kind==='npc'||NPC,d.bio,d.rp,oldOf(p)));delete d.rp;delete d.rpAt;await DB.makerPut('trainers',id,doc);
     if(Object.keys(oldOf(p)).length&&N().doc(KD,id)){const np=Object.assign({},p);for(const kk of ['bg','goal','bond','style','note'])delete np[kk];await N().put(KD,id,np)}   /* 옮겨 간 예전 노트 칸은 비운다 */
     await MK().load(true);N().render()}
    else{if(!N().doc(KD,id))return N().toast('시트를 찾지 못했어요 — 새로고침해 주세요');await N().patch(KD,id,p=>{p.bio=set(bioMerge(NPC,p.bio,oldOf(p)));for(const kk of ['bg','goal','bond','style','note'])delete p[kk]})}
    N().closeModal()};
   $('#bxOk',md).onclick=()=>save($('#bxT',md).value.replace(/\s+$/,''));const bd=$('#bxDel',md);if(bd)bd.onclick=()=>save(null);return}
  if(k==='tomk')return toMaker(id);
  if(k==='frommk'){await MK().load(true);const t=MK().trainer(id);if(!t)return N().toast('제작기에 이 트레이너가 없어요');const p=N().data(KD,id)||{};if(!await N().confirmBox(`제작기의 「${t.name}」 이름 · 초상으로 이 시트를 덮어쓸까요? (상세 칸은 늘 제작기와 같아요) 세션 기록 · 비밀 칸 · GM 메모는 그대로예요.`,'가져오기'))return;await N().put(KD,id,Object.assign({},p,fromTrainer(t,{order:p.order,log:p.log||[],player:p.player||'',sub:p.sub||''})));N().toast('제작기에서 가져왔어요');return}
  if(k==='logadd'){const s=await N().promptBox('몇 세션? (예: 3)','','');if(s==null)return;const t=await N().promptBox('기록','','한 줄');if(t==null||!t.trim())return;await N().patch(KD,id,p=>{p.log=p.log||[];p.log.push({s:s.trim(),t:t.trim(),at:Date.now()})});return}
  if(k==='logdel'){if(!await N().confirmBox('이 세션 기록을 지울까요?','지우기'))return;await N().patch(KD,id,p=>{(p.log||[]).splice(+b.dataset.i,1)});return}
  if(k==='del'){const p=N().data(KD,id);if(!await N().confirmBox(`「${p.name||id}」 시트를 캠페인에서 뺄까요? (제작기 트레이너는 그대로예요)`,'빼기'))return;await N().del(KD,id);if(N().doc('pcp',id))await N().del('pcp',id);if(N().doc('sec',KD+':'+id))await N().del('sec',KD+':'+id);U.sel='';return}}
 N().MOD.pc={render,mode:m=>{U.mode=m;U.sel=''},select:id=>{U.sel=id}};
})();
