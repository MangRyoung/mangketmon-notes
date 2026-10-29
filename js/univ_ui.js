/* ---------- PC 시트 더하기 (10-29 망령: 대학 시트) — 고유 포텐셜 · 덱 · 소지품 ----------
   셋 다 제작기 트레이너 · 포켓몬 문서에 바로 쓴다 (NT_MAKER.edit). 노트에 사본을 두지 않으니 제작기와 늘 같다.
   · 고유: t.unique=[{name,line,eff,auto}] — 카드로 보이고, ✎ 로 이름 · 문구 · 효과를 고친다
   · 덱: t.deck=[{n,q}] · t.deckName — 카드는 제작기 「카드 DB」(공유 DB 수정 행 dbedit/cards.*). 노트에서 새 카드도 만든다
   · 소지품: 포켓몬 p.item · p.itemOwn · p.items2=[{item,itemOwn}] (제작기와 같은 꼴). DB 에서 고르거나 오리지널(이 포켓몬만)로 만든다.
     파티 칸이 읽는 effTxt(효과 글 사본)도 같이 맞춘다 */
"use strict";
window.NT_UNIV=(()=>{
 const N=()=>window.NT;const MK=()=>window.NT_MAKER;const {$,$$,esc,cssu}=window.NT;
 const brN=v=>String(v==null?'':v).replace(/<br\s*\/?>/gi,'\n').replace(/\\n/g,'\n');
 /* 효과 글 꾸미기: 【태그】 · 『이름』 · 「상태」 · ①② 줄머리 */
 const fx=s=>esc(brN(s)).replace(/【([^】\n]{1,24})】/g,'<em class="ux-tag">$1</em>').replace(/『([^』\n]{1,30})』/g,'<b class="ux-nm">『$1』</b>').replace(/「([^」\n]{1,30})」/g,'<span class="ux-st">「$1」</span>').replace(/(^|\n)([①-⑳])/g,'$1<i class="ux-no">$2</i>');
 /* 같은 트레이너 · 포켓몬에 연달아 쓰면 앞의 쓰기가 끝난 뒤에 (읽고 고치고 쓰기가 겹쳐 하나가 지워지지 않게) */
 let Q=Promise.resolve();
 const run=(kind,id,fn,ok)=>{Q=Q.then(()=>MK().edit(kind,id,fn)).then(r=>{if(r!==false){N().render();if(ok)N().toast(ok)}}).catch(e=>N().toast('제작기에 못 썼어요: '+e.message));return Q};
 const canEd=id=>N().gm()||N().me()===id;
 /* 빈 고유 · 빈 덱 칸은 꾸밈 「대학」 시트에서만 (다른 캠페인 시트를 빈 상자로 채우지 않게) */
 const univ=()=>!!(N().skin&&N().skin()==='univ');

 /* ===== 고유 포텐셜 ===== */
 function uniqSec(id,t,E){if(!t)return '';const L=(t.unique||[]).map((u,i)=>({u,i})).filter(x=>x.u&&(x.u.name||x.u.eff));if(!L.length&&!(E&&univ()))return '';
  return `<section class="ux-sec ux-uq"><h4 class="ux-h"><span>고유 포텐셜</span><small>${L.length}</small><span class="sp"></span>${E?`<button type="button" class="btn xs ghost" data-ux="uqadd" data-id="${esc(id)}">＋ 고유</button>`:''}</h4>
   ${L.length?`<div class="ux-uqg">${L.map(({u,i})=>`<article class="ux-uc">${u.line?`<div class="ux-line" title="문구">${esc(u.line)}</div>`:''}<div class="ux-ub"><div class="ux-un"><i class="ux-gem" aria-hidden="true"></i><b>${esc(u.name||'(이름 없음)')}</b>${u.auto?'<small class="ux-auto" title="자동화 구문이 있어요 (웹툴 배틀에서 돌아요)">⚙</small>':''}<span class="sp"></span>${E?`<button type="button" class="ux-ed" data-ux="uqed" data-id="${esc(id)}" data-i="${i}" title="고치기">✎</button>`:''}</div><div class="ux-ue">${u.eff?fx(u.eff):'<span class="dim">효과가 아직 없어요</span>'}</div></div></article>`).join('')}</div>`:'<p class="small dim">아직 없어요.</p>'}</section>`}
 function uqEdit(id,i){const t=MK().trainer(id);if(!t)return;const L=t.unique||[];if(i==null||i<0){i=L.findIndex(u=>!u||(!u.name&&!u.eff));if(i<0)i=L.length}const u=Object.assign({name:'',line:'',eff:''},L[i]||{});
  const md=N().openModal(`<div class="mhead"><h2>고유 포텐셜</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small dim" style="margin-top:0">저장하면 제작기 트레이너 시트의 고유 포텐셜에 바로 들어가요.</p>
   <div class="mrow"><label class="lbl">이름<input id="uqN" type="text" value="${esc(u.name)}" placeholder="예) 신출귀몰 종횡무진"></label><label class="lbl">문구 <small class="dim">(한자 · 표어 · 비우면 안 보여요)</small><input id="uqL" type="text" value="${esc(u.line||'')}" placeholder="예) 神出鬼沒 縱橫無盡"></label></div>
   <label class="lbl">효과<textarea id="uqE" rows="6" placeholder="【등장】【소진】/ …">${esc(brN(u.eff))}</textarea></label>
   <div class="ux-prev" id="uqP"></div>
   <div class="row" style="margin-top:12px">${L[i]&&(L[i].name||L[i].eff)?'<button class="btn xs ghost danger" id="uqDel">비우기</button>':''}<span class="sp"></span><button class="btn pri" id="uqOk">저장</button></div>`,'wide');
  const pv=()=>{$('#uqP',md).innerHTML=`<div class="ux-uc solo">${$('#uqL',md).value.trim()?`<div class="ux-line">${esc($('#uqL',md).value.trim())}</div>`:''}<div class="ux-ub"><div class="ux-un"><i class="ux-gem"></i><b>${esc($('#uqN',md).value.trim()||'(이름)')}</b></div><div class="ux-ue">${fx($('#uqE',md).value)}</div></div></div>`};
  md.addEventListener('input',pv);pv();
  const save=v=>{N().closeModal();run('trainers',id,d=>{d.unique=Array.isArray(d.unique)?d.unique:[];while(d.unique.length<=i)d.unique.push({name:'',eff:''});const o=Object.assign({},d.unique[i]||{},v);if(!o.line)delete o.line;d.unique[i]=o},'고유 포텐셜을 제작기에 넣었어요')};
  $('#uqOk',md).onclick=()=>save({name:$('#uqN',md).value.trim(),line:$('#uqL',md).value.trim(),eff:$('#uqE',md).value.trim()});
  const dl=$('#uqDel',md);if(dl)dl.onclick=async()=>{if(await N().confirmBox('이 고유 포텐셜을 비울까요? (칸은 남아요)','비우기'))save({name:'',line:'',eff:'',auto:''})}}

 /* ===== 덱 ===== */
 /* 카드 색 — 제작기 카드 DB · 오레마스 덱 창과 같은 키 */
 const PAL=[['red','#c8504a','빨강'],['orange','#d9822b','주황'],['gold','#b8932a','금색'],['green','#4f9a5a','초록'],['teal','#2f948f','청록'],['blue','#4573c4','파랑'],['purple','#8a5cc4','보라'],['pink','#c45c9a','분홍'],['gray','#6b7286','회색'],['black','#30343f','검정']];
 const ccol=v=>{v=String(v||'').trim();const p=PAL.find(x=>x[0]===v||x[2]===v);return p?p[1]:(/^#[0-9a-f]{3,8}$/i.test(v)?v:'#6b7286')};
 const cimg=v=>{v=String(v||'').trim();return /^https?:\/\//.test(v)||/^data:image\//.test(v)?v:''};
 /* ===== 지시 체계 (10-29 망령 「4식 6령 설정도 넣어야 되는데 고유 아래 여백 많으니 거기다가」) =====
    제작기가 트레이너를 저장할 때 남기는 t.ordOut(제작기 ordSnap — 지시 체계 칸과 같은 규칙)을 그린다. 고치기는 제작기의 지시 체계 칸을 노트 안에서 연다(NT_MONED sec=tord) */
 function ordSec(id,t,E){if(!t)return '';const S=t.ordOut;const has=t.orders&&t.orders.preset;if(!has&&!(E&&univ()))return '';
  const ed=E&&window.NT_MONED?`<button type="button" class="btn xs ghost" data-moned="" data-sec="tord" data-id="${esc(id)}" title="제작기의 지시 체계 칸을 열어요 (지령 종류 · 항목별 계열 · 2체 기준 고르기)">✎ 제작기에서</button>`:'';
  const head=sub=>`<h4 class="ux-h"><span>지시 체계</span>${sub?`<small>${sub}</small>`:''}<span class="sp"></span>${ed}</h4>`;
  if(!has)return `<section class="ux-sec ux-ord">${head('')}<p class="small dim" style="margin:0">아직 지령 종류를 정하지 않았어요 (웹툴 방 설정을 따라요).</p></section>`;
  if(!S||!S.preset)return `<section class="ux-sec ux-ord">${head('')}<p class="small dim" style="margin:0">제작기에서 이 트레이너를 한 번 열면(저장되면) 여기에 4식 · 6령이 보여요.</p></section>`;
  const two=S.mode==='solo'||S.mode==='misag';
  const chips=L=>L.map(x=>`<span class="oc ${x.n?'':'z'} ${two&&x.pick?'pk':''} ${x.off?'off':''}" title="${esc(x.nm)}${x.ex?' · 예외 계열 '+x.ex:''}${x.off?' · 각성체 대가로 뺌':''}${two&&x.pick?' · 2체 기준으로 고름':''}"><span>${esc(x.nm)}</span><b>${x.n}</b>${x.ex?'<i>예외</i>':''}</span>`).join('');
  const pickLine=(kind,L)=>{if(!two)return '';const n=(S.pickN||{})[kind]||0;const pk=L.filter(x=>x.pick).length;return `<div class="ux-ordp ${pk===n?'':'need'}">${S.mode==='misag'?'2체로 합칠 때':'1인 기준'} 고른 것 <b>${pk}/${n}</b>${pk===n?'':' · 제작기에서 골라요'}</div>`};
  const offLine=(kind,L)=>{const n=S.offN&&S.offN[kind];if(!n)return '';const k=L.filter(x=>x.off).length;return `<div class="ux-ordp ${k===n?'':'need'}">각성체 대가로 뺀 것 <b>${k}/${n}</b></div>`};
  const blk=(kind,tag,lab,fam)=>{const L=S[kind]||[];return `<div class="ux-ordb"><div class="ux-ordt"><span class="ordk ${kind}">${tag}</span><b>${lab}</b><small>${esc(fam)}</small></div><div class="ux-ordl">${chips(L)}</div>${offLine(kind,L)}${pickLine(kind,L)}</div>`};
  return `<section class="ux-sec ux-ord">${head(`지시 ${esc(S.rk||'-')} · ${esc(S.presetName||'')}`)}${blk('o','ORDER','명령 (4식)',S.oName)}${blk('c','COMMAND','지령 (6령)',S.cName)}</section>`}

 function deckSec(id,t,E){if(!t)return '';const L=t.deck||[];if(!L.length&&!(E&&univ()))return '';if(!MK().dbReady())MK().db().then(()=>N().render());
  const tot=L.reduce((a,x)=>a+(+x.q||0),0);
  const tile=(x,k)=>{const r=MK().card(x.n);const img=r?cimg(r[6]):'';const col=r?ccol(r[5]):'#6b7286';const cost=r&&r[3]!==''&&r[3]!=null?String(r[3]):'';
   return `<div class="ux-ct ${r?'':'miss'}" style="--cc:${col}"><button type="button" class="ux-cti" data-ux="card" data-id="${esc(id)}" data-k="${k}" style="${img?`background-image:url('${cssu(img)}')`:''}" title="${esc(x.n)} — 눌러서 보기">${img?'':`<span class="ux-ctl">${esc([...x.n][0]||'?')}</span>${r&&r[4]?`<span class="ux-ctx">${esc(brN(r[4]).slice(0,54))}</span>`:''}`}${cost?`<b class="ux-ctc">${esc(cost)}</b>`:''}<b class="ux-ctq">×${+x.q||0}</b></button>
    <div class="ux-ctn">${esc(x.n)}</div><div class="ux-ctk">${r?esc(r[2]||'카드'):'<span class="warn">카드 DB 에 없음</span>'}</div>
    ${E?`<div class="ux-ctb"><button type="button" data-ux="dq" data-id="${esc(id)}" data-k="${k}" data-d="-1" aria-label="한 장 빼기">−</button><button type="button" data-ux="dq" data-id="${esc(id)}" data-k="${k}" data-d="1" aria-label="한 장 더">+</button><button type="button" class="danger" data-ux="ddel" data-id="${esc(id)}" data-k="${k}" aria-label="덱에서 빼기">✕</button></div>`:''}</div>`};
  return `<section class="ux-sec ux-deck"><h4 class="ux-h"><span>덱</span>${t.deckName?`<b class="ux-dn">${esc(t.deckName)}</b>`:''}<small>${L.length}종 · ${tot}장</small><span class="sp"></span>${E?`<button type="button" class="btn xs ghost" data-ux="dname" data-id="${esc(id)}">덱 이름</button><button type="button" class="btn xs" data-ux="dadd" data-id="${esc(id)}">＋ 카드</button>`:''}</h4>
   ${L.length?`<div class="ux-cg">${L.map(tile).join('')}</div>`:'<p class="small dim" style="margin:2px 0 0">덱이 비어 있어요. 「＋ 카드」로 제작기 카드 DB 에서 고르거나 새 카드를 만들어요.</p>'}</section>`}
 function cardView(id,k){const t=MK().trainer(id);const x=t&&(t.deck||[])[k];if(!x)return;const r=MK().card(x.n);const img=r?cimg(r[6]):'';
  N().openModal(`<div class="mhead"><h2>${esc(x.n)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="ux-cv" style="--cc:${r?ccol(r[5]):'#6b7286'}"><div class="ux-cvi" style="${img?`background-image:url('${cssu(img)}')`:''}">${img?'':`<span>${esc([...x.n][0]||'?')}</span>`}</div>
   <div class="ux-cvb"><div class="row" style="gap:6px;flex-wrap:wrap">${r?`<span class="chip static">${esc(r[2]||'카드')}</span>${r[3]!==''&&r[3]!=null?`<span class="chip static">비용 ${esc(r[3])}</span>`:''}${r[0]?`<span class="chip static">${esc(r[0])}</span>`:''}`:'<span class="warn small">제작기 카드 DB 에 없는 이름이에요</span>'}<span class="chip static">덱에 ×${+x.q||0}</span></div>
    ${r&&r[4]?`<div class="ux-ue" style="margin-top:8px">${fx(r[4])}</div>`:''}${r&&r[8]?`<p class="small dim pre">${esc(r[8])}</p>`:''}${r&&String(r[9]||'').trim()?'<p class="small dim">⚙ 웹툴 배틀에서 도는 구문이 있어요</p>':''}</div></div>`)}
 function cardPick(id){const t=MK().trainer(id);if(!t)return;let q='';
  const md=N().openModal(`<div class="mhead"><h2>덱에 넣을 카드</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="row" style="gap:6px"><input id="cpQ" type="search" data-nodirty placeholder="이름 · 종류 · 효과로 찾기" style="flex:1"><button class="btn sm" id="cpNew">＋ 새 카드 만들기</button></div>
   <div class="ux-cpl" id="cpL"></div>`,'wide');
  const draw=()=>{const T=MK().trainer(id)||t;const inDeck=new Set((T.deck||[]).map(x=>x.n));const s=q.trim().toLowerCase();
   const L=MK().cardList().filter(r=>!s||[r[1],r[2],r[4],r[0]].some(v=>String(v||'').toLowerCase().includes(s))).slice(0,120);
   $('#cpL',md).innerHTML=(L.length?L.map(r=>{const img=cimg(r[6]);return `<button type="button" class="ux-cpr ${inDeck.has(r[1])?'on':''}" data-cpk="${esc(r[1])}" style="--cc:${ccol(r[5])}"><i style="${img?`background-image:url('${cssu(img)}')`:''}">${img?'':esc([...r[1]][0]||'?')}</i><span><b>${esc(r[1])}</b><small>${esc(r[2]||'카드')}${r[3]!==''&&r[3]!=null?' · 비용 '+esc(r[3]):''}</small><em>${esc(brN(r[4]).slice(0,90))}</em></span><u>${inDeck.has(r[1])?'✓ 덱에 있음':'넣기'}</u></button>`}).join(''):`<div class="small dim" style="padding:10px 2px">${MK().cardList().length?'찾는 카드가 없어요.':'제작기 카드 DB 가 비어 있어요. 「＋ 새 카드 만들기」로 첫 카드를 만들어요.'}</div>`)
    +(s&&!MK().card(q.trim())?`<button type="button" class="btn xs ghost" data-cpfree style="margin-top:8px">「${esc(q.trim())}」 이름만 넣기 (카드 DB 에 없는 카드)</button>`:'')};
  MK().db().then(draw);draw();
  $('#cpQ',md).addEventListener('input',e=>{q=e.target.value;draw()});
  $('#cpNew',md).onclick=()=>cardNew(id,q.trim());
  md.addEventListener('click',e=>{const b=e.target.closest('[data-cpk]');const fr=e.target.closest('[data-cpfree]');const n=b?b.dataset.cpk:fr?q.trim().slice(0,60):'';if(!n)return;
   const r=MK().card(n);run('trainers',id,d=>{d.deck=Array.isArray(d.deck)?d.deck:[];const i=d.deck.findIndex(x=>x.n===n);if(i>=0)d.deck.splice(i,1);else d.deck.push({n,q:Math.max(1,Math.round(+(r&&r[7]))||1)})}).then(draw)})}
 /* 새 카드 → 제작기 카드 DB (공유 DB 수정 행: dbedit/cards.<이름 hex>, 직접 추가한 행 custom · 맨 끝 pos). 제작기 「DB 관리 → 카드 DB」에 그대로 뜬다 */
 const hex=k=>[...new TextEncoder().encode(String(k))].map(b=>b.toString(16).padStart(2,'0')).join('');
 function cardNew(id,name){const md=N().openModal(`<div class="mhead"><h2>새 카드 · 제작기 카드 DB</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small dim" style="margin-top:0">제작기 「DB 관리 → 카드 DB」에 직접 추가한 카드로 들어가고, 이 덱에도 넣어요. 다른 트레이너 덱에서도 고를 수 있어요.</p>
   <div class="mrow"><label class="lbl">이름<input id="cnN" type="text" maxlength="30" value="${esc(name||'')}"></label><label class="lbl">종류<input id="cnK" type="text" list="cnKL" placeholder="예) 행동"><datalist id="cnKL">${[...new Set(MK().cardList().map(r=>r[2]).filter(Boolean))].map(k=>`<option value="${esc(k)}">`).join('')}</datalist></label>
    <label class="lbl">비용<input id="cnC" type="text" style="width:80px" placeholder="0"></label><label class="lbl">색<select id="cnCol">${PAL.map(p=>`<option value="${p[0]}">${p[2]}</option>`).join('')}</select></label><label class="lbl">기본 장수<input id="cnQ" type="number" min="1" max="99" value="1" style="width:80px"></label></div>
   <label class="lbl">효과<textarea id="cnE" rows="4"></textarea></label>
   <div class="sec">그림 <small class="dim">세로 5:7 이 잘 맞아요 · 없어도 돼요</small></div><div class="updz" id="cnDz" style="max-width:160px;aspect-ratio:5/7"><div class="pv"></div><b>＋ 그림</b></div>
   <div class="row" style="margin-top:12px"><span class="sp"></span><button class="btn pri" id="cnOk">만들고 덱에 넣기</button></div>`,'',{stack:true});
  let img='';N().bindDrop($('#cnDz',md),async fs=>{try{img=await N().upload(fs[0],'thumb','card');$('#cnDz .pv',md).style.backgroundImage=`url('${cssu(img)}')`}catch(x){N().toast('올리기 실패: '+x.message)}});
  $('#cnOk',md).onclick=async()=>{const n=$('#cnN',md).value.trim();if(!n)return N().toast('이름을 적어요');if(MK().card(n)&&!await N().confirmBox(`카드 DB 에 「${n}」이(가) 이미 있어요. 그 카드를 덱에 넣을까요?`,'덱에 넣기'))return;
   const DB=N().DBS();try{if(!MK().card(n)){if(!DB.makerPut)throw new Error('이 화면에서는 제작기에 쓸 수 없어요');const row=['',n,$('#cnK',md).value.trim(),$('#cnC',md).value.trim(),$('#cnE',md).value.trim(),$('#cnCol',md).value,img,String(Math.max(1,+$('#cnQ',md).value||1)),'노트에서 만듦',''];
     await DB.makerPut('dbedit','cards.'+hex(n),{kind:'cards',key:n,row,custom:true,pos:MK().cardList().length});MK().dbSet('cards',n,row)}
    N().closeModal();const r=MK().card(n);run('trainers',id,d=>{d.deck=Array.isArray(d.deck)?d.deck:[];if(!d.deck.some(x=>x.n===n))d.deck.push({n,q:Math.max(1,Math.round(+(r&&r[7]))||1)})},'카드를 만들고 덱에 넣었어요')}catch(e){N().toast('만들지 못했어요: '+e.message)}}}

 /* ===== 소지품 ===== */
 const ownOf=x=>{const o=x&&x.itemOwn;return o&&typeof o==='object'&&o.name&&o.name===x.item?o:null};
 /* 제작기 itemRow 와 같은 순서: DB 행이 먼저, 없으면 오리지널 */
 const rowOf=x=>{if(!x||!x.item)return null;const r=MK().item(x.item);if(r)return r;const o=x.own||ownOf(x);return o?[o.kind||'오리지널',o.name,'',o.cons?'O':'-',o.eff||'',o.sock||'-','이 포켓몬만 (DB 에 없음)',o.auto||'']:null};
 const effOf=r=>r?{it:String(r[4]||''),itAuto:String(r[7]||''),itCons:r[3]==='O'?1:0}:null;
 function itemEd(id,pid){const m=MK().M.pokemon.find(p=>p.id===pid);if(!m)return;
  const S=[{item:m.item||'',own:ownOf(m)},...(m.items2||[]).map(x=>({item:(x&&x.item)||'',own:ownOf(x)}))];let pick=-1,make=-1,q='';
  const md=N().openModal(`<div class="mhead"><h2>소지품 · ${esc(m.name||'')}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small dim" style="margin-top:0">저장하면 제작기 포켓몬 시트의 소지품 칸에 바로 들어가요. DB 에 있는 것을 고르거나, 이 포켓몬만의 오리지널 소지품을 만들어요 (소지품 DB 는 그대로).</p>
   <div id="ieB"></div><div class="row" style="margin-top:12px"><span class="sp"></span><button class="btn ghost" data-x>취소</button><button class="btn pri" id="ieOk">제작기에 저장</button></div>`,'wide');
  const kinds=()=>[...new Set(MK().itemList().map(r=>r[0]).filter(Boolean))];
  const draw=()=>{$('#ieB',md).innerHTML=S.map((x,k)=>{const r=rowOf(x);const own=!MK().item(x.item)&&x.own;
    return `<div class="ux-is ${k===pick||k===make?'open':''}"><div class="ux-ish"><span class="ux-isk">소지품 ${k+1}</span>${x.item?`<b>${esc(x.item)}</b>${r&&!(own&&r[0]==='오리지널')?`<small class="chip static">${esc(r[0]||'')}${r[3]==='O'?' · 소모품':''}</small>`:''}${own?`<small class="chip static ux-own">오리지널${r&&r[3]==='O'?' · 소모품':''}</small>`:''}`:'<span class="dim">비어 있음</span>'}<span class="sp"></span>
     <button type="button" class="btn xs" data-ie="pick" data-k="${k}">DB 에서</button><button type="button" class="btn xs ghost" data-ie="make" data-k="${k}">${own?'오리지널 고치기':'오리지널 만들기'}</button>${x.item?`<button type="button" class="btn xs ghost" data-ie="clear" data-k="${k}">비우기</button>`:''}${k?`<button type="button" class="btn xs ghost danger" data-ie="drop" data-k="${k}" title="이 칸 빼기">✕</button>`:''}</div>
     ${r&&r[4]&&k!==make?`<div class="ux-ue">${fx(r[4])}</div>`:''}
     ${k===pick?`<div class="ux-ip"><input type="search" id="ieQ" data-nodirty placeholder="소지품 이름 · 종류 · 효과로 찾기" value="${esc(q)}"><div class="ux-ipl" id="ieL"></div></div>`:''}
     ${k===make?(()=>{const o=Object.assign({name:x.item||'',kind:'오리지널',cons:false,sock:'-',eff:'',auto:''},x.own||{});return `<div class="ux-im"><div class="mrow"><label class="lbl">이름<input id="imN" type="text" value="${esc(o.name)}"></label><label class="lbl">종류<input id="imK" type="text" list="imKL" value="${esc(o.kind)}"><datalist id="imKL">${kinds().map(k=>`<option value="${esc(k)}">`).join('')}</datalist></label><label class="lbl">소모품<select id="imC"><option value="">아니오</option><option value="O" ${o.cons?'selected':''}>소모품 (쓰면 없어짐)</option></select></label><label class="lbl">소켓<input id="imS" type="text" value="${esc(o.sock)}" style="width:70px"></label></div>
      <label class="lbl">효과<textarea id="imE" rows="4">${esc(brN(o.eff))}</textarea></label><label class="lbl">구문 <small class="dim">웹툴 배틀 자동 처리 · 비우면 효과 글을 읽어요</small><textarea id="imA" rows="2" style="font-family:var(--mono,monospace);font-size:12px">${esc(o.auto||'')}</textarea></label>
      <div class="row" style="gap:6px;margin-top:6px"><span class="sp"></span><button type="button" class="btn xs ghost" data-ie="mkcancel">그만두기</button><button type="button" class="btn xs pri" data-ie="mkok" data-k="${k}">이 칸에 두기</button></div></div>`})():''}</div>`}).join('')
    +(S.length<3?'<button type="button" class="btn xs ghost" data-ie="add" style="margin-top:6px">＋ 소지품 칸</button> <small class="dim">기본 1칸 · 2 · 3번 칸은 제작기 조건(특성 · 포텐셜)을 따라요</small>':'');
   if(pick>=0){const i=$('#ieQ',md);list();i.addEventListener('input',()=>{q=i.value;list()});setTimeout(()=>i.focus(),0)}};
  const list=()=>{const el=$('#ieL',md);if(!el)return;const s=q.trim().toLowerCase();const L=MK().itemList().filter(r=>!s||[r[1],r[2],r[0],r[4]].some(v=>String(v||'').toLowerCase().includes(s))).slice(0,60);
   el.innerHTML=L.length?L.map(r=>`<button type="button" class="ux-ipr" data-ipk="${esc(r[1])}"><b>${esc(r[1])}</b><small>${esc(r[0]||'')}${r[3]==='O'?' · 소모품':''}</small><em>${esc(brN(r[4]).slice(0,110))}</em></button>`).join(''):`<div class="small dim" style="padding:8px 2px">${MK().itemList().length?'찾는 소지품이 없어요 — 「오리지널 만들기」로 만들 수 있어요':'소지품 DB 를 불러오는 중…'}</div>`};
  MK().db().then(()=>{if(md.isConnected){draw()}});draw();
  md.addEventListener('click',e=>{const pk=e.target.closest('[data-ipk]');if(pk){S[pick]={item:pk.dataset.ipk,own:null};pick=-1;q='';draw();return}
   const b=e.target.closest('[data-ie]');if(!b)return;const a=b.dataset.ie,k=+b.dataset.k;
   if(a==='pick'){pick=pick===k?-1:k;make=-1;draw();return}
   if(a==='make'){make=make===k?-1:k;pick=-1;draw();return}
   if(a==='mkcancel'){make=-1;draw();return}
   if(a==='mkok'){const n=$('#imN',md).value.trim();if(!n)return N().toast('이름을 적어요');if(MK().item(n))N().toast(`소지품 DB 에 「${n}」이(가) 있어서 DB 의 효과가 먼저 쓰여요`);
    S[k]={item:n,own:{name:n,kind:$('#imK',md).value.trim()||'오리지널',cons:$('#imC',md).value==='O',sock:$('#imS',md).value.trim()||'-',eff:$('#imE',md).value,auto:$('#imA',md).value.trim()}};make=-1;draw();return}
   if(a==='clear'){S[k]={item:'',own:null};draw();return}
   if(a==='drop'){S.splice(k,1);pick=make=-1;draw();return}
   if(a==='add'){if(S.length<3)S.push({item:'',own:null});draw();return}});
  $('#ieOk',md).onclick=()=>{if(make>=0)return N().toast('오리지널 칸을 「이 칸에 두기」나 「그만두기」로 마쳐 주세요');N().closeModal();
   run('pokemon',pid,d=>{const put=(o,x)=>{o.item=x.item||'';if(x.item&&x.own)o.itemOwn=Object.assign({},x.own);else delete o.itemOwn;return o};
    put(d,S[0]||{item:''});d.items2=S.slice(1).map(x=>put({},x));
    d.effTxt=Object.assign({},d.effTxt||{},effOf(rowOf(S[0]))||{it:'',itAuto:'',itCons:0},{its2:S.slice(1).map(x=>effOf(rowOf(x)))})},'소지품을 제작기에 넣었어요')}}

 /* 단추 — 어느 탭에서 그려도 되게 문서에 한 번만 */
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-ux]');if(!b)return;const a=b.dataset.ux,id=b.dataset.id||'';
  if(a==='card'){e.preventDefault();return cardView(id,+b.dataset.k)}
  if(!canEd(id))return N().toast('이 시트는 고칠 수 없어요');e.preventDefault();
  if(a==='uqadd')return uqEdit(id,-1);if(a==='uqed')return uqEdit(id,+b.dataset.i);
  if(a==='dadd')return cardPick(id);
  if(a==='dq'){const k=+b.dataset.k,dd=+b.dataset.d;return run('trainers',id,d=>{const x=(d.deck||[])[k];if(!x)return false;x.q=Math.max(0,Math.min(99,(+x.q||0)+dd))})}
  if(a==='ddel'){const k=+b.dataset.k;return run('trainers',id,d=>{if(!(d.deck||[])[k])return false;d.deck.splice(k,1)})}
  if(a==='dname'){const t=MK().trainer(id)||{};return N().promptBox('덱 이름',t.deckName||'',(t.name||'트레이너')+'의 덱').then(v=>{if(v==null)return;run('trainers',id,d=>{d.deckName=v.trim()})})}
  if(a==='item')return itemEd(id,b.dataset.pid)});
 return {uniqSec,ordSec,deckSec,itemEd,fx};
})();
