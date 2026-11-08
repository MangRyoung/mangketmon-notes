/* ---------- 필드 전개 (11-01 망령 「세션 노트 쪽에도 필드 효과 넣는 칸 추가해줘」) ----------
   제작기의 「필드 전개」 칸(트레이너 카드 · 포켓몬 「포텐셜」 탭 맨 아래)과 같은 자료를 노트에서 보고 고친다.
   자료 = 제작기 문서의 fields: [{type:0 필드|1 스타디움|2 이계, name, loc, img, eff(한 줄에 하나), count(지속 턴, -1 = 무한), color(타입 영문)}]
   오레마스 배틀의 「필드 전개」 버튼이 이 값을 읽는다. 저장 = NT_MAKER.edit('pokemon'|'trainers', id, …) → 제작기 공유 DB.
   NT_FLD.chips(owner, kind, id, tid, E) — 카드에 붙이는 작은 줄(이름 칩 + 「필드 전개」 버튼). 버튼 · 칩은 data-fld 로 아래 창을 연다. */
"use strict";
window.NT_FLD=(()=>{
 const N=()=>window.NT;const MK=()=>window.NT_MAKER;const {$,$$,esc,cssu}=window.NT;
 const KINDS=['필드','스타디움','이계'],KEN=['FIELD','STADIUM','ANOTHER WORLD'];
 const TY=[['노말','Normal'],['불꽃','Fire'],['물','Water'],['풀','Grass'],['전기','Electric'],['얼음','Ice'],['격투','Fighting'],['독','Poison'],['땅','Ground'],['비행','Flying'],['에스퍼','Psychic'],['벌레','Bug'],['바위','Rock'],['고스트','Ghost'],['드래곤','Dragon'],['악','Dark'],['강철','Steel'],['페어리','Fairy']];
 const TC={Normal:'#9a9a7a',Fire:'#e8692c',Water:'#3f7fe0',Grass:'#4ea83a',Electric:'#e3b81f',Ice:'#5cc4c7',Fighting:'#b8322b',Poison:'#9a3ea0',Ground:'#c79a46',Flying:'#8c8ff0',Psychic:'#ec4f86',Bug:'#93a91f',Rock:'#a68f3c',Ghost:'#6a54a0',Dragon:'#5b3ef0',Dark:'#5a4638',Steel:'#8f8fae',Fairy:'#e58fc6'};
 const ko=en=>(TY.find(x=>x[1]===en)||[])[0]||'';
 /* 제작기 fieldsFix 와 같은 정리 */
 /* 11-09 망령 「필드에도 구문」: auto = {deploy · start · end · entry · hold · who} — 고칠 때 지우지 않게 (편집 칸은 제작기 js/fx/fx_ui.js fieldAutoBox, NT_WORD 로 불러온다) */
 const AK=['deploy','start','end','entry','hold'];const autoN=a=>{if(!a||typeof a!=='object')return null;const o={};for(const k of AK){const v=String(a[k]==null?'':a[k]).replace(/\r/g,'').trim();if(v)o[k]=v.slice(0,4000)}if(!Object.keys(o).length)return null;if(a.who==='own'||a.who==='foe')o.who=a.who;return o};
 const fix=a=>(Array.isArray(a)?a:[]).filter(x=>x&&typeof x==='object'&&String(x.name||'').trim()).map(x=>Object.assign({type:[0,1,2].includes(+x.type)?+x.type:0,name:String(x.name).trim().slice(0,60),loc:String(x.loc||'').slice(0,60),img:String(x.img||'').slice(0,600),eff:String(x.eff||'').slice(0,4000),count:+x.count>0?Math.min(99,Math.round(+x.count)):-1,color:String(x.color||'').slice(0,20)},autoN(x.auto)?{auto:autoN(x.auto)}:{}));
 const owner=(kind,id)=>{if(!MK())return null;if(kind==='t')return MK().trainer(id)||null;return (MK().M.pokemon||[]).find(q=>q.id===id)||null};
 const CSS=`.fldrow{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:6px}
.fldchip{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-size:11.5px;padding:2px 8px 2px 3px;border-radius:999px;border:1px solid color-mix(in srgb,var(--fc,#888) 60%,transparent);background:color-mix(in srgb,var(--fc,#888) 16%,transparent)}
.fldchip i{font-style:normal;font-size:9.5px;font-weight:700;letter-spacing:.06em;padding:1px 6px;border-radius:999px;background:var(--fc,#888);color:#fff}
.fldchip small{opacity:.75}
.fldcards{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.fldcard{cursor:pointer;display:grid;grid-template-columns:minmax(0,1fr);border:1px solid color-mix(in srgb,var(--fc,#888) 55%,transparent);border-left:4px solid var(--fc,#888);border-radius:8px;overflow:hidden;background:color-mix(in srgb,var(--fc,#888) 10%,transparent)}
.fldcard:has(.fldcard-img){grid-template-columns:112px minmax(0,1fr)}
.fldcard:hover{border-color:var(--fc,#888)}
.fldcard-img{background:#0005 center/cover no-repeat;min-height:72px}
.fldcard-b{padding:6px 9px;min-width:0;display:flex;flex-direction:column;gap:3px}
.fldcard-h{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.fldcard-h b{font-size:13px}.fldcard-h small{font-size:11px;opacity:.75}
.fldcard-e{white-space:pre-wrap;font-size:12px;line-height:1.5}
@media (max-width:520px){.fldcard:has(.fldcard-img){grid-template-columns:1fr}.fldcard-img{min-height:90px}}
.fldl{display:flex;flex-direction:column;gap:10px}
.fldc{display:grid;grid-template-columns:150px minmax(0,1fr);gap:10px;border:1px solid var(--line,#8886);border-left:4px solid var(--fc,#888);border-radius:8px;padding:8px;background:color-mix(in srgb,var(--fc,#888) 6%,transparent)}
.fldc-img{aspect-ratio:16/10;border-radius:6px;background:#0005 center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-size:11px;opacity:.9}
.fldc-b{min-width:0;display:flex;flex-direction:column;gap:4px}
.fldc-h{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.fldc-h b{font-size:14px}.fldc-h .sp{flex:1}
.fldc-k{font-size:10px;font-weight:700;letter-spacing:.08em;padding:1px 7px;border-radius:999px;background:var(--fc,#888);color:#fff}
.fldc-e{white-space:pre-wrap;font-size:12.5px;line-height:1.55}
.flde{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px}.flde .full{grid-column:1/-1}
.flde label{display:flex;flex-direction:column;gap:3px;font-size:12px}.flde input,.flde select,.flde textarea{width:100%}
.flde-img{height:120px;border:1px dashed var(--line,#8886);border-radius:8px;background:#0003 center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;text-align:center;padding:6px}
@media (max-width:640px){.fldc{grid-template-columns:1fr}.flde{grid-template-columns:1fr}}`;
 function css(){if(document.getElementById('fld-css'))return;const s=document.createElement('style');s.id='fld-css';s.textContent=CSS;document.head.appendChild(s)}
 /* 카드에 붙는 줄 */
 /* 11-09 망령 「카드에서 이계 그림이랑 효과는 보여 줘야지」: 칩 대신 그림 · 종류 · 이름 · 턴 · 효과 글이 보이는 줄 (누르면 필드 창) */
 const imgOk=u=>/^(https?:|data:image\/)/.test(String(u||''));
 function chips(o,kind,id,tid,E){css();const L=fix(o&&o.fields);if(!L.length&&!E)return '';
  return `<div class="fldcards">${L.map((f,k)=>`<div class="fldcard" role="button" tabindex="0" style="--fc:${TC[f.color]||'#8f7b52'}" data-fld="${kind}" data-id="${esc(id)}" data-tid="${esc(tid||'')}" data-k="${k}" title="눌러서 필드 전개 보기${E?' · 고치기':''}">${imgOk(f.img)?`<div class="fldcard-img" style="background-image:url('${cssu(f.img)}')"></div>`:''}<div class="fldcard-b"><div class="fldcard-h"><span class="fldc-k">${KINDS[f.type]}</span><b>《${esc(f.name)}》</b><small>${esc(f.loc||'')}${f.loc?' · ':''}${f.count>0?f.count+'턴':'무한'}${autoN(f.auto)?' · ⚙ 구문':''}</small></div>${f.eff?`<div class="fldcard-e">${esc(f.eff)}</div>`:''}</div></div>`).join('')}${E?`<div class="fldrow"><button type="button" class="linkbtn small" data-fld="${kind}" data-id="${esc(id)}" data-tid="${esc(tid||'')}">🏟 필드 전개${L.length?' 고치기':' 넣기'}</button></div>`:''}</div>`}
 /* 목록 창 */
 function open(kind,id,tid,k0){css();const o=owner(kind,id);if(!o)return N().toast('제작기 문서를 찾지 못했어요');const E=N().gm()||N().me()===(kind==='t'?id:tid);let L=fix(o.fields);
  const who=kind==='t'?'트레이너':'포켓몬';
  const card=(f,k)=>`<div class="fldc" style="--fc:${TC[f.color]||'#8f7b52'}"><div class="fldc-img" style="${f.img?`background-image:url('${cssu(f.img)}')`:''}">${f.img?'':'그림 없음'}</div><div class="fldc-b"><div class="fldc-h"><span class="fldc-k">${KEN[f.type]}</span><b>${esc(f.name)}</b><small class="dim">${esc(f.loc||'')}${f.color?' · '+esc(ko(f.color)||f.color):''} · ${f.count>0?f.count+'턴':'무한'}</small><span class="sp"></span>${E?`<button type="button" class="btn xs" data-fe="${k}">✎ 고치기</button><button type="button" class="btn xs ghost" data-fd="${k}">빼기</button>`:''}</div>${f.eff?`<div class="fldc-e">${esc(f.eff)}</div>`:'<div class="small dim">효과 글 없음</div>'}</div></div>`;
  const md=N().openModal(`<div class="mhead"><h2>🏟 필드 전개 · ${esc(o.name||'')}</h2><span class="sp"></span>${E?'<button class="btn sm" data-fa>+ 필드</button>':''}<button class="btn ghost" data-x>닫기</button></div>
   <p class="small" style="margin-top:0">이 ${who}가 오레마스 배틀에서 직접 펼치는 필드 · 스타디움 · 이계예요. 제작기 「필드 전개」 칸과 같은 자료라 여기서 고치면 제작기 · 웹툴에 바로 이어져요. 배틀에서는 트레이너 칸의 「필드 전개」 버튼으로 펼쳐요.</p>
   <div class="fldl" id="fldL"></div>`,'wide',{stack:true});
  const draw=()=>{$('#fldL',md).innerHTML=L.length?L.map(card).join(''):`<p class="small dim">아직 없어요${E?' — 「+ 필드」로 넣어요':''}</p>`};draw();
  const save=async()=>{try{await MK().edit(kind==='t'?'trainers':'pokemon',id,d=>{d.fields=fix(L)});await MK().load(true);N().toast('제작기에 저장했어요');N().render()}catch(e){N().toast('저장하지 못했어요: '+(e.message||e))}};
  md.addEventListener('click',async e=>{let b;
   if(e.target.closest('[data-fa]'))return edit(null,f=>{L.push(f);draw();save()});
   if((b=e.target.closest('[data-fe]'))){const k=+b.dataset.fe;return edit(L[k],f=>{L[k]=f;draw();save()})}
   if((b=e.target.closest('[data-fd]'))){const k=+b.dataset.fd;if(!await N().confirmBox(`「${L[k].name}」을(를) 뺄까요?`,'빼기'))return;L.splice(k,1);draw();save()}});
  if(k0!=null&&L[k0]&&E)edit(L[k0],f=>{L[k0]=f;draw();save()})}
 /* 한 칸 고치기 창 */
 function edit(f0,done){const f=Object.assign({type:2,name:'',loc:'',img:'',eff:'',count:-1,color:''},f0||{});
  const md=N().openModal(`<div class="mhead"><h2>${f0?'✎ 필드 고치기':'+ 필드'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="flde">
    <label>종류<select id="fdT">${KINDS.map((n,i)=>`<option value="${i}" ${f.type===i?'selected':''}>${n}</option>`).join('')}</select></label>
    <label>이름<input type="text" id="fdN" maxlength="60" value="${esc(f.name)}" placeholder="이계/아라크네의 미궁"></label>
    <label>장소<input type="text" id="fdL" maxlength="60" value="${esc(f.loc)}" placeholder="리디아, 직조실, 미궁"></label>
    <label>색 (타입)<select id="fdC"><option value="">없음</option>${TY.map(([k,en])=>`<option value="${en}" ${f.color===en?'selected':''}>${k}</option>`).join('')}</select></label>
    <label>지속 턴<input type="number" id="fdK" min="-1" max="99" value="${f.count}"><small class="dim">−1 = 무한</small></label>
    <label>그림 주소<input type="text" id="fdI" value="${esc(f.img)}" placeholder="https://… (아래 칸에 끌어 놓아도 돼요)"></label>
    <div class="full flde-img" id="fdIB" style="${f.img?`background-image:url('${cssu(f.img)}')`:''}">${f.img?'':'그림을 끌어 놓거나 눌러서 올려요'}</div>
    <label class="full">효과 (한 줄에 하나)<textarea id="fdE" rows="6" placeholder="①…&#10;②…">${esc(f.eff)}</textarea></label>
     <div class="full" id="fdA"></div>
   </div>
   <div class="mfoot"><span class="sp"></span><button class="btn pri" id="fdOk">저장</button></div>`,'wide',{stack:true});
  /* 11-09 자동화 구문 칸 — 제작기 사이트의 fx 스크립트를 NT_WORD 가 불러온 뒤 그린다 */let FAB=null;{const h=$('#fdA',md);const draw=()=>{if(FAB||!h.isConnected)return;if(window.OM_FX_UI&&OM_FX_UI.fieldAutoBox)FAB=OM_FX_UI.fieldAutoBox(h,f.auto,{toast:t=>N().toast(t)})};draw();if(!FAB){h.innerHTML=`<div class="small dim" style="margin-top:6px">⚙ 자동화 구문 칸을 불러오는 중…${autoN(f.auto)?' (지금 구문은 그대로 남아요)':''}</div>`;if(window.NT_WORD&&NT_WORD.load)NT_WORD.load().then(draw).catch(()=>{h.innerHTML='<div class="small dim">자동화 구문 칸을 불러오지 못했어요 — 제작기에서 고쳐 주세요 (지금 구문은 그대로 남아요)</div>'})}}
  const ib=$('#fdIB',md),ii=$('#fdI',md);const show=u=>{ib.style.backgroundImage=u?`url('${cssu(u)}')`:'';ib.textContent=u?'':'그림을 끌어 놓거나 눌러서 올려요'};
  ii.addEventListener('input',()=>show(ii.value.trim()));
  N().bindDrop(ib,async fs=>{if(!fs||!fs[0])return;ib.textContent='올리는 중…';try{const u=await N().upload(fs[0],'photo','fields');ii.value=u;show(u)}catch(e){show(ii.value.trim());N().toast('올리기 실패: '+(e.message||e))}},false,'image/*');
  $('#fdOk',md).onclick=()=>{const nm=$('#fdN',md).value.trim();if(!nm)return N().toast('이름을 적어 주세요');
   const o=fix([{type:+$('#fdT',md).value,name:nm,loc:$('#fdL',md).value.trim(),img:ii.value.trim(),eff:$('#fdE',md).value.replace(/\s+$/,''),count:+$('#fdK',md).value,color:$('#fdC',md).value,auto:FAB?FAB.get():f.auto}])[0];N().closeModal();done(o)}}
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-fld]');if(!b)return;e.preventDefault();e.stopPropagation();open(b.dataset.fld,b.dataset.id,b.dataset.tid,b.dataset.k!=null&&b.dataset.k!==''?+b.dataset.k:null)});
 return {chips,open,fix};
})();
