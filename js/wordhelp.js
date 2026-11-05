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
  const one=src=>new Promise(res=>{const s=document.createElement('script');s.src=base()+src+'?v=202611052055';s.onload=()=>res(true);s.onerror=()=>res(false);document.head.appendChild(s)});
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
.wh .dim{color:var(--mute,#888)}`;
 function css(){if(document.getElementById('wh-css'))return;const s=document.createElement('style');s.id='wh-css';s.textContent=CSS;document.head.appendChild(s)}
 const sh=v=>v===''?'(없음)':String(v).replace(/\n/g,'↵');
 function mount(host,o){if(!host||!o||!o.eff)return;css();const kind=o.kind==='item'?'item':'pot';const ta=o.eff,au=o.auto||null;let F=[],DS=[];
  host.classList.add('wh');
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
 return {load,mount};
})();
