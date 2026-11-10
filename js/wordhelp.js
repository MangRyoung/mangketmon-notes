/* ---------- 워딩 점검 · 구문 추천 (11-01 망령 「노트쪽 제작기에도 문법 점검이나 구문 추천기 넣어줘」) ----------
   제작기와 같은 도구를 제작기 사이트(NT_CONFIG.makerUrl)에서 그대로 불러온다 — 노트에 사본을 두지 않는다.
     js/potlint.js        포텐셜 DB 문장 꼴 점검 · 고치기 · 추천 자동화 구문
     js/fx/*.js           오레마스 자동화 구문 해석(OM_FX) · 생성기(OM_FX_UI.mountGen) · 소지품 구문(OM_ITEMRULE)
   NT_WORD.mount(host, {eff, auto, kind:'pot'|'item', name}) — host 안에 「✍ 워딩 도우미」와 (pot) 「⚙ 생성기」를 그린다.
     eff = 효과 글 textarea, auto = 구문 textarea, name() = 지금 이름(소지품 구문 만들 때) */
"use strict";
window.NT_WORD=(()=>{
 const N=()=>window.NT;const {$,$$,esc}=window.NT;
 const base=()=>String((window.NT_CONFIG||{}).makerUrl||'').replace(/\/?$/,'/');
 let P=null,ST='';   /* '' 아직 · ok · part(일부만) · fail */
 function load(){if(window.MKM_POTLINT&&window.OM_FX&&window.OM_FX_UI&&window.OM_ITEMRULE)return Promise.resolve(true);if(P)return P;
  /* fx_ui 는 웹툴 창 함수(OM_APP)를 부른다 — 노트 창으로 이어 준다 */
  if(!window.OM_APP)window.OM_APP={openModal:h=>N().openModal(h,'wide',{stack:true}),closeModal:()=>N().closeModal(),toast:t=>N().toast(t),ST:{role:'player',state:{}},set:async()=>false};
  const one=src=>new Promise(res=>{const s=document.createElement('script');s.src=base()+src+'?v=202611102130sh';s.onload=()=>res(true);s.onerror=()=>res(false);document.head.appendChild(s)});
  P=(async()=>{const a=await one('js/potlint.js');let b=true;for(const f of ['states.js','readymade.js','fx.js','fx_ui.js','itemrule.js'])b=(await one('js/fx/'+f))&&b;
   ST=a&&b?'ok':a||b?'part':'fail';if(ST==='fail')P=null;return ST!=='fail'})();return P}
 const CSS=`.wh{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.wh details{border:1px dashed var(--line,#8886);border-radius:8px;padding:6px 10px;background:color-mix(in srgb,currentColor 3%,transparent)}
.wh summary{cursor:pointer;font-weight:700;font-size:13px}.wh summary small{font-weight:500;margin-left:6px;color:var(--mute,#888)}
.wh details.has>summary small{color:var(--red,#e4002b)}.wh details.ok>summary small{color:#3f9a5a}
.wh-row{display:flex;align-items:center;gap:6px;margin:6px 0 4px}.wh-row .sp{flex:1}.wh-row b{font-size:12.5px}
.wh-l{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px}.wh-l li{font-size:12.5px;line-height:1.5}
.wh code{font-family:var(--mono,monospace);font-size:12px;background:color-mix(in srgb,currentColor 8%,transparent);padding:1px 5px;border-radius:4px}
.wh-ds{display:flex;flex-direction:column;gap:3px;margin:2px 0 4px}.wh-ds code{display:block;padding:4px 8px}
.wh-pv{font-size:12px;line-height:1.5;margin-top:4px;white-space:pre-wrap}.wh-pv .warn{color:var(--red,#e4002b)}.wh-pv .okc{color:#3f9a5a}
.wh .dim{color:var(--mute,#888)}
.wh-tb{display:flex;flex-wrap:wrap;gap:4px;padding:6px;margin:4px 0;border-radius:8px;background:color-mix(in srgb,currentColor 5%,transparent)}
.wh-tb button{border:1px solid var(--line,#8886);background:transparent;color:inherit;border-radius:5px;font:12px var(--mono,monospace);padding:2px 7px;cursor:pointer;min-height:26px}
.wh-tb button:hover,.wh-tb button.on{background:color-mix(in srgb,var(--gold,#c8a24a) 22%,transparent)}.wh-tb .sep{width:1px;align-self:stretch;background:var(--line,#8886);margin:0 2px}
.wh-th{font-size:12px;color:var(--mute,#888);min-height:18px;margin:0 0 4px;line-height:1.5}.wh-th b{color:inherit;font-weight:700}.wh-th .wh-tv{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.wh-th .wh-tv button{border:1px solid var(--line,#8886);background:transparent;color:inherit;border-radius:5px;font:12px var(--mono,monospace);padding:2px 7px;cursor:pointer;min-height:26px}
@media (pointer:coarse){.wh-tb button,.wh-th .wh-tv button{min-height:34px;padding:2px 9px}}`;
 /* 11-06 망령 「고유 쪽에도 일반 포텐셜들처럼 태그들 좀 쉽게 넣게」: 제작기 태그 툴바(maker.js tagbarHTML · bindTagbar)와 같은 단추 — 누르면 커서 자리에 넣는다.
    태그 사전은 제작기 TAGS_DEF 사본 (제작기 설정 화면에서 고친 사전까지는 못 읽어요 · 바뀌면 같이 고칠 것) */
 const TAGS=[
 ['N/시','조건을 채웠을 때 시합에 N번까지 사용할 수 있다. 무효화되어도 횟수를 소모한다.','1/시|2/시|3/시|N/시'],
 ['자동','【N/시】와 함께 쓴다. 조건을 채우면 자동으로 사용되며, 그 시점에 횟수를 소모한다.',''],
 ['선행','지시 입력 때 미리 선행 입력해 두고, 조건을 만족하면 반드시 발동한다. 포텐셜 종류별로 1개까지.',''],
 ['강제','모든 발동 조건을 무시하고 강제로 발동시켰을 때 붙는다. 횟수를 소모하지 않는다.',''],
 ['임의','발동 조건을 무시하고 임의의 타이밍에 발동한다. 횟수를 소모한다.',''],
 ['사전','트레이너의 지시 전에 해당하는 효과. 『포켓몬 도감』『스카우터』, 선언계 『고유』 정도.',''],
 ['준비','시합 준비 시(배틀을 시작하기 전, 파티 · 소지품을 정할 때) 한 번 적용한다. 소지품 착용 · 기술 고르기 · 상대 PT 조건 · 종족치처럼 시합 내내 이어지는 효과에 쓴다. 시합 중에는 다시 발동하지 않는다. (11-01 망령 「시합 준비 시」를 태그로)',''],
 ['야생','『야생』일 때만 발동한다. 포획되면 보통 제거된다.',''],
 ['방호','기술의 대미지를 덜 받거나 무효화하는 모든 효과.',''],
 ['방호 (조건)','대미지를 덜 받는 데 쓰였을 때만 방호로 취급하는 효과(능력 강화 등).',''],
 ['동조','적진의 같은 『역할』에 작동하는 효과. 아군이면 (아군), 상대에게 상시 작용하면 (상대).','동조|동조 (아군)|동조 (상대)'],
 ['등장','필드에 등장했을 때 작동한다. 등장 방식을 괄호로 한정한다. 「다음 기술」 표현과 함께 쓴다.','등장|등장 (통상 교대)|등장 (임의 교대)|등장 (죽어내밀기)|등장 (상대)'],
 ['퇴장','필드를 떠날 때 작동한다. 강제 교대는 (강제 교대) 외의 퇴장을 발동하지 않는다.','퇴장|퇴장 (통상 교대)|퇴장 (임의 교대)|퇴장 (강제 교대)|퇴장 (빈사)'],
 ['지연','필드에 등장하여 N번째 턴(N은 보통 2 이상). (아군, N턴), (N턴 동안)도 있다.','지연 (2턴)|지연 (3턴)|지연 (아군, 2턴)|지연 (2턴 동안)|지연 (아군, 2턴 동안)'],
 ['지원','PT에 참여하고 있을 때(소지 중 포함). 「빈사」면 작동하지 않으며, 빈사 중에도 작동하면 (빈사).','지원|지원 (빈사)'],
 ['수세','자신이 공격을 지시받지 않았을 때. 자신의 기술 위력과는 연계되지 않는다.',''],
 ['공세','대상이 공격을 지시받지 않았을 때. 상대의 기술 위력과는 연계되지 않는다.',''],
 ['함성','포켓몬을 쓰러뜨렸을 때. 여러 마리를 한 번에 쓰러뜨리면 그만큼 발동한다.','함성|함성 (「알그룹 : 인간형」)'],
 ['자질','트레이너의 특정 자질이 지정 랭크 이상일 때. 이하 조건은 「지시 : C 이하」처럼.','지시 : B|지시 : A|육성 : B|육성 : A|통솔 : B|통솔 : A|능력 : B|능력 : A|지시 : C 이하'],
 ['유일','같은 이름·파생 효과와 중첩되지 않고 가장 높은 값만 적용한다. 제약은 중첩된다.','유일|유일 (『결계』)|유일 (「소지품」)'],
 ['소진','1턴에 1번. 소지에 들어갔다 다시 나와도 그 턴에는 쓸 수 없다.',''],
 ['탈진','연속된 턴에 사용할 수 없다. 발동 후 다음 턴 종료 시까지 사용 불가.',''],
 ['보급','필드에 등장하여 1번만. 다시 쓰려면 소지에 들어갔다 나와야 한다.',''],
 ['공유','발동한 턴 종료 시까지 다른 【공유】 효과를 발동할 수 없다.','공유|공유 (『지령』)'],
 ['중첩','조건을 달성할 때마다 같은 효과가 N번까지 누적된다.','중첩 (2회)|중첩 (3회)'],
 ['연동','자신이 특정 조건을 충족했을 때 연동해서 발동한다. (아군)은 아군에게, (상대)는 상대에게 조건을 달성시켰을 때.','연동 (「특성 : ○○」)|연동 (아군)|연동 (상대)']
];
 function insertAt(ta,v){const a=ta.selectionStart??ta.value.length,b=ta.selectionEnd??a;const wrap=v==='「」'||v==='『』';const ins=wrap?v[0]+ta.value.slice(a,b)+v[1]:v;
  ta.value=ta.value.slice(0,a)+ins+ta.value.slice(b);const pos=wrap&&a===b?a+1:a+ins.length;ta.focus();ta.setSelectionRange(pos,pos);ta.dispatchEvent(new Event('input',{bubbles:true}))}
 function tagbar(ta){if(!ta||ta.previousElementSibling&&ta.previousElementSibling.classList.contains('wh-th'))return;css();
  const bar=document.createElement('div');bar.className='wh-tb';bar.innerHTML=TAGS.map((t,i)=>`<button type="button" data-wti="${i}" title="${esc(t[1])}">【${esc(t[0])}】${t[2]?' ▾':''}</button>`).join('')
   +'<span class="sep"></span><button type="button" data-wins="/" title="태그와 본문 구분">/</button><button type="button" data-wins="「」" title="용어 괄호">「」</button><button type="button" data-wins="『』" title="포텐셜 괄호">『』</button><button type="button" data-wins="\n①" title="효과 번호">①</button><button type="button" data-wins="\n②">②</button><button type="button" data-wins="\n③">③</button>';
  const help=document.createElement('div');help.className='wh-th';help.textContent='태그를 누르면 커서 자리에 들어가요. ▾ 는 누르면 고를 꼴이 나와요.';
  ta.insertAdjacentElement('beforebegin',bar);ta.insertAdjacentElement('beforebegin',help);
  const say=(t,vs)=>{help.innerHTML=`<b>【${esc(t[0])}】</b> ${esc(t[1])}${vs?`<div class="wh-tv">${vs.map(v=>`<button type="button" data-wtv="${esc(v)}">【${esc(v)}】</button>`).join('')}</div>`:''}`};
  for(const el of [bar,help]){el.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault()});   /* 커서 자리를 잃지 않게 */
   el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();
    if(b.dataset.wins!=null)return insertAt(ta,b.dataset.wins);if(b.dataset.wtv!=null){insertAt(ta,'【'+b.dataset.wtv+'】');return}
    const t=TAGS[+b.dataset.wti];if(!t)return;bar.querySelectorAll('button.on').forEach(x=>x.classList.remove('on'));
    if(t[2]){b.classList.add('on');say(t,t[2].split('|'))}else{say(t);insertAt(ta,'【'+t[0]+'】')}})}
  bar.addEventListener('mouseover',e=>{const b=e.target.closest('[data-wti]');if(b&&!bar.querySelector('button.on')){const t=TAGS[+b.dataset.wti];if(t)say(t)}})}
 function css(){if(document.getElementById('wh-css'))return;const s=document.createElement('style');s.id='wh-css';s.textContent=CSS;document.head.appendChild(s)}
 const sh=v=>v===''?'(없음)':String(v).replace(/\n/g,'↵');
 function mount(host,o){if(!host||!o||!o.eff)return;css();const kind=o.kind==='item'?'item':'pot';const ta=o.eff,au=o.auto||null;let F=[],DS=[];
  host.classList.add('wh');if(kind==='pot'&&o.tagbar!==false)tagbar(ta);   /* 11-06 효과 칸 위 태그 단추 */
  host.innerHTML=`<details class="wh-w"><summary>✍ 워딩 도우미<small data-whc>불러오는 중…</small></summary><div data-whb></div></details>
   ${au?`<div class="wh-pv" data-whp></div>`:''}${au&&kind==='pot'?`<details class="wh-g"><summary>⚙ 구문 생성기<small>항목을 골라 칸을 채우면 구문 칸에 줄을 넣어요</small></summary><div data-whg></div></details>`:''}`;
  const W=()=>window.MKM_POTLINT,FX=()=>window.OM_FX,IR=()=>window.OM_ITEMRULE;
  const prev=()=>{const pv=$('[data-whp]',host);if(!pv||!au)return;const v=au.value.trim();
   if(kind==='item'){if(!IR()){pv.innerHTML=ST==='fail'?'<span class="warn">구문 스크립트를 못 불러왔어요</span>':'';return}
    if(!v){const g=IR().fromEff(o.name?o.name():'',ta.value);pv.innerHTML=IR().has(g)?`<span class="dim">구문이 비어 있어 효과 글로 자동 처리 — </span><code>${esc(IR().toText(g).replace(/\n/g,' / '))}</code>`:'<span class="dim">구문 없음 · 효과 글에서 읽을 것도 없음 — 웹툴에서 손으로</span>';return}
    const r=IR().parse(v);pv.innerHTML=(IR().has(r.rule)?'<span class="okc">✓ 구문을 읽었어요</span>':'<span class="dim">자동으로 하는 일이 없어요</span>')+(r.errs.length?` <span class="warn">모르는 줄: ${esc(r.errs.join(' / '))}</span>`:'');return}
   if(!FX()){pv.innerHTML=ST==='fail'?'<span class="warn">구문 스크립트를 못 불러왔어요</span>':'';return}
   if(!v){pv.innerHTML='<span class="dim">구문 없음 — 같은 이름의 레디메이드가 있으면 그것이, 없으면 웹툴에서 손으로</span>';return}
   const r=FX().parse(v);pv.innerHTML=(r.ops.length?`<span class="okc">✓ 미리보기</span> ${esc(FX().unparse(r.ops).join(' / '))}`:'<span class="dim">읽은 줄이 없어요</span>')+(r.errs&&r.errs.length?` <span class="warn">모르는 줄: ${esc(r.errs.join(' / '))}</span>`:'')};
  const upd=()=>{const box=$('.wh-w',host),c=$('[data-whc]',host),b=$('[data-whb]',host);if(!box)return;const txt=ta.value;
   if(!W()){c.textContent=ST==='fail'||ST==='part'?'워딩 스크립트를 못 불러왔어요':'불러오는 중…';b.innerHTML='';prev();return}
   F=txt.trim()?W().check(txt):[];const fx=txt.trim()?W().fixAll(txt):'';DS=[];let gen='';
   if(fx&&kind==='pot'&&au)DS=(W().suggest(fx).lines)||[];
   if(fx&&kind==='item'&&au&&IR()){for(const tx of [txt,fx]){const g=IR().fromEff(o.name?o.name():'',tx);if(IR().has(g)){gen=IR().toText(g);break}}}
   c.textContent=!txt.trim()?'':(F.length?`고칠 곳 ${F.length}`:'문장 꼴 OK')+(DS.length?` · 추천 구문 ${DS.length}줄`:gen?' · 추천 구문 있음':'');box.classList.toggle('has',!!F.length);box.classList.toggle('ok',!!txt.trim()&&!F.length);
   b.innerHTML=!txt.trim()?'<div class="small dim">효과를 쓰면 DB 문장 꼴(【1/시】/ · 「공격 : +1」한다 · 강화(1.5배) · 턴 종료 시까지 · 「화상」 상태로 만든다 …)과 비교해 고칠 곳을 알려 줘요.</div>':
    (F.length?`<div class="wh-row"><b>고칠 곳</b><span class="sp"></span><button type="button" class="btn xs" data-whfa>모두 고치기</button></div><ul class="wh-l">${F.map((f,i)=>`<li>${esc(f.msg)}<br><code>${esc(sh(f.from))}</code> → <code>${esc(sh(f.to))}</code> <button type="button" class="btn xs ghost" data-whf="${i}">이것만</button></li>`).join('')}</ul>`:'<div class="small okc" style="color:#3f9a5a">DB 문장 꼴과 어긋나는 곳이 없어요</div>')
    +(DS.length?`<div class="wh-row"><b>추천 자동화 구문</b>${F.length?'<small class="dim">(고친 문장 기준)</small>':''}<span class="sp"></span><button type="button" class="btn xs" data-whds>구문 칸에 덧붙이기</button></div><div class="wh-ds">${DS.map(x=>`<code>${esc(x)}</code>`).join('')}</div>`
     :gen?`<div class="wh-row"><b>추천 소지품 구문</b><span class="sp"></span><button type="button" class="btn xs" data-whgen>구문 칸에 넣기</button></div><div class="wh-ds">${gen.split('\n').map(x=>`<code>${esc(x)}</code>`).join('')}</div>`
     :au?`<div class="small dim" style="margin-top:6px">자동화 구문으로 옮길 만한 효과는 못 찾았어요 (조건 · 특수 효과는 GM 이 손으로${kind==='pot'?' · 아래 생성기':''})</div>`:'');
   prev()};
  const fire=el=>el.dispatchEvent(new Event('input',{bubbles:true}));
  host.addEventListener('click',e=>{let b;
   if((b=e.target.closest('[data-whf]'))){ta.value=W().fixOne(ta.value,F[+b.dataset.whf]);fire(ta);return}
   if(e.target.closest('[data-whfa]')){ta.value=W().fixAll(ta.value);fire(ta);N().toast('DB 문장 꼴로 고쳤어요 — 뜻이 바뀌지 않았는지 한 번 읽어 봐 주세요');return}
   if(e.target.closest('[data-whds]')&&au){const have=au.value.split('\n').map(x=>x.trim()).filter(Boolean),add=DS.filter(x=>!have.includes(x.trim()));if(!add.length)return N().toast('추천 줄은 이미 구문 칸에 있어요');au.value=[...have,...add].join('\n');fire(au);N().toast(`${add.length}줄을 구문 칸에 덧붙였어요`);return}
   if(e.target.closest('[data-whgen]')&&au&&IR()){let g=IR().fromEff(o.name?o.name():'',W()?W().fixAll(ta.value):ta.value);if(!IR().has(g))g=IR().fromEff(o.name?o.name():'',ta.value);if(au.value.trim()&&!confirm('구문 칸에 이미 쓴 내용이 있어요. 추천 구문으로 바꿀까요?'))return;au.value=IR().toText(g);fire(au);N().toast('추천 소지품 구문을 넣었어요')}});
  ta.addEventListener('input',upd);if(au)au.addEventListener('input',prev);
  if(o.nameEl)o.nameEl.addEventListener('input',prev);
  upd();
  load().then(()=>{if(!host.isConnected)return;upd();const gh=$('[data-whg]',host);if(gh&&au&&window.OM_FX_UI&&OM_FX_UI.mountGen&&!gh.childElementCount)OM_FX_UI.mountGen(gh,au,{toast:t=>N().toast(t)})})}
 return {load,mount,tagbar};
})();
