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
 /* 11-14 망령 「세션 노트 쪽엔 어디에 있음? 기능 확장이랑 폼체인지」: 제작기 트레이너의 기능 확장(t.ext) · 공유 폼체인지(t.sforms)를 고유 포텐셜 아래에 읽기 전용으로 (고치기는 제작기 트레이너 카드) */
 function extraSec(t,id,E){if(!t)return '';id=id||t.id||'';const SHOW=E&&univ();const ed=(ux,i)=>E?`<span class="sp"></span><button type="button" class="ux-ed" data-ux="${ux}" data-id="${esc(id)}" data-i="${i}" title="고치기">✎</button>`:'';const add=(ux,lab)=>E?`<button type="button" class="btn xs ghost" data-ux="${ux}" data-id="${esc(id)}">＋ ${lab}</button>`:'<small class="dim">제작기 트레이너 카드에서 고쳐요</small>';const ST=['HP','공격','방어','특공','특방','스피드'];let mons=t.pokemon||[];if(!mons.length&&t.id){try{mons=(window.NT_MAKER&&NT_MAKER.mons?NT_MAKER.mons(t.id):[])||[]}catch(e){mons=[]}}
  const X=(t.ext||[]).map((x,i)=>Object.assign({_i:i},x)).filter(x=>x&&x.mv);const F=(t.sforms||[]).map((f,i)=>Object.assign({_i:i},f)).filter(f=>f&&(E||f.name||f.ability||(f.base||[]).some(v=>v!==''&&v!=null)||(f.t1&&f.t1!=='-')||(f.pots||[]).some(x=>x&&x.name)||(f.mvs||[]).some(x=>x&&x.to)||(f.exs||[]).some(x=>x&&x.name)));
  const xr=x=>{const who=x.who?((mons.find(m=>m&&m.id===x.who)||{}).name||'지정 포켓몬'):'PT 전원';return `<article class="ux-uc"><div class="ux-ub"><div class="ux-un"><i class="ux-gem" aria-hidden="true"></i><b>「기능 확장 : ${esc(x.mv)}」</b>${ed('exed',x._i)}</div><div class="ux-ue small">${+x.lim?`【${+x.lim}/시】`:'횟수 제한 없음'} · ${x.kind==='extra'?'추가 행동':'행동으로'} · ${esc(who)}${x.src?` · 출처 ${esc(x.src)}`:''}</div></div></article>`};
  const fr=f=>{const ty=[f.t1,f.t2].filter(v=>v&&v!=='-');const bs=(f.base||[]).map((v,i)=>v!==''&&v!=null?ST[i]+' '+v:'').filter(Boolean);const L=[];if(ty.length)L.push('타입 '+ty.join('/'));if(f.ability)L.push('특성 '+f.ability);if(bs.length)L.push('종족치 '+bs.join(' · '));
   const P=(f.pots||[]).filter(x=>x&&x.name),M=(f.mvs||[]).filter(x=>x&&x.to),EX=(f.exs||[]).filter(x=>x&&x.name);
   return `<article class="ux-uc"><div class="ux-ub"><div class="ux-un"><i class="ux-gem" aria-hidden="true"></i><b>${esc(f.name||'(이름은 포켓몬 그대로)')}</b><small class="dim" style="margin-left:6px">${esc(f.kind||'폼체인지')}${f.revert?' · 교대하면 돌아옴':''}</small>${ed('sfed',f._i)}</div><div class="ux-ue small">${L.map(esc).join(' · ')||'<span class="dim">타입 · 특성 · 종족치는 그대로</span>'}${P.map(x=>`<div><b>포텐셜 #${(+x.slot||0)+1}</b> ${esc(x.name)}${x.eff?`<div class="pre dim">${esc(String(x.eff).replace(/<br\s*\/?>/gi,'\n'))}</div>`:''}</div>`).join('')}${EX.map(x=>`<div><b>전용${f.exRep?' (원래 전용 대신)':''}</b> ${esc(x.name)}${x.eff?`<div class="pre dim">${esc(String(x.eff).replace(/<br\s*\/?>/gi,'\n'))}</div>`:''}</div>`).join('')}${M.length?`<div><b>기술</b> ${M.map(x=>(x.from?esc(x.from)+' → ':'+ ')+esc(x.to)).join(' · ')}</div>`:''}${f.cond?`<div class="dim">${esc(f.cond)}</div>`:''}</div></div></article>`};
  return (X.length||SHOW?`<section class="ux-sec ux-uq"><h4 class="ux-h"><span>기능 확장</span><small>${X.length}</small><span class="sp"></span>${add('exadd','기능 확장')}</h4>${X.length?`<div class="ux-uqg">${X.map(xr).join('')}</div>`:'<p class="small dim">아직 없어요.</p>'}</section>`:'')
   +(F.length||SHOW?`<section class="ux-sec ux-uq"><h4 class="ux-h"><span>공유 폼체인지</span><small>${F.length} · PT 전원</small><span class="sp"></span>${add('sfadd','공유 폼')}</h4>${F.length?`<div class="ux-uqg">${F.map(fr).join('')}</div>`:'<p class="small dim">아직 없어요.</p>'}</section>`:'')}

 /* 11-14 망령 「세션 노트에서 바로 고칠 수 있는 편이 좋지」: 기능 확장 · 공유 폼체인지 고치기 — 제작기 트레이너 문서(ext · sforms)에 바로 쓴다 (제작기 extFix · fixForm 과 같은 꼴) */
 const TYPES=['노말','불꽃','물','풀','전기','얼음','격투','독','땅','비행','에스퍼','벌레','바위','고스트','드래곤','악','강철','페어리'];
 const dl=(idn,L)=>`<datalist id="${idn}">${L.slice(0,1500).map(n=>`<option value="${esc(n)}">`).join('')}</datalist>`;
 function extEdit(id,i){const t=MK().trainer(id);if(!t)return;const L=t.ext||[];const isNew=i==null||i<0||!L[i];const x=Object.assign({mv:'',lim:1,kind:'act',who:'',src:''},isNew?{}:L[i]);if(isNew&&L.length>=12)return N().toast('기능 확장은 12개까지예요');
  let mons=[];try{mons=MK().mons(id)||[]}catch(e){}const mvN=(MK().moveList()||[]).map(r=>r&&r[2]).filter(Boolean);
  const md=N().openModal(`<div class="mhead"><h2>기능 확장</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small dim" style="margin-top:0">트레이너가 주는 「기능 확장 : 기술」 — 웹툴 배틀의 지시 · 공격 창 기술 목록 맨 뒤에 붙어요. 저장하면 제작기에 바로 들어가요.</p>
   ${dl('exMvL',mvN)}
   <div class="mrow"><label class="lbl">기술<input id="exM" type="text" list="exMvL" value="${esc(x.mv)}" placeholder="예) 안개제거" maxlength="60"></label><label class="lbl">출처 <small class="dim">(포텐셜 이름)</small><input id="exS" type="text" value="${esc(x.src||'')}" placeholder="예) 『항법술』" maxlength="60"></label></div>
   <div class="mrow"><label class="lbl">횟수<select id="exL">${[0,1,2,3,4,5,6].map(n=>`<option value="${n}" ${+x.lim===n?'selected':''}>${n?`【${n}/시】`:'제한 없음'}</option>`).join('')}</select></label>
    <label class="lbl">쓰는 법<select id="exK"><option value="act" ${x.kind==='extra'?'':'selected'}>행동으로</option><option value="extra" ${x.kind==='extra'?'selected':''}>추가 행동</option></select></label>
    <label class="lbl">쓰는 포켓몬<select id="exW"><option value="">PT 전원</option>${mons.map(m=>`<option value="${esc(m.id)}" ${m.id===x.who?'selected':''}>${esc(m.name||'이름 없음')}</option>`).join('')}${x.who&&!mons.some(m=>m.id===x.who)?`<option value="${esc(x.who)}" selected>(없는 포켓몬)</option>`:''}</select></label></div>
   <div class="row" style="margin-top:12px">${isNew?'':'<button class="btn xs ghost danger" id="exDel">지우기</button>'}<span class="sp"></span><button class="btn pri" id="exOk">저장</button></div>`);
  $('#exOk',md).onclick=()=>{const mv=$('#exM',md).value.trim().slice(0,60);if(!mv)return N().toast('기술 이름을 적어 주세요');const v={mv,lim:Math.max(0,Math.min(9,+$('#exL',md).value||0)),kind:$('#exK',md).value==='extra'?'extra':'act',who:$('#exW',md).value,src:$('#exS',md).value.trim().slice(0,60)};
   N().closeModal();run('trainers',id,d=>{d.ext=Array.isArray(d.ext)?d.ext:[];if(isNew)d.ext.push(v);else d.ext[i]=Object.assign({},d.ext[i]||{},v)},'기능 확장을 제작기에 넣었어요')};
  const de=$('#exDel',md);if(de)de.onclick=async()=>{if(!(await N().confirmBox(`「기능 확장 : ${x.mv}」을(를) 지울까요?`,'지우기')))return;N().closeModal();run('trainers',id,d=>{if(Array.isArray(d.ext))d.ext.splice(i,1)},'기능 확장을 지웠어요')}}
 function sformEdit(id,i){const t=MK().trainer(id);if(!t)return;const L=t.sforms||[];const isNew=i==null||i<0||!L[i];if(isNew&&L.length>=6)return N().toast('공유 폼은 6개까지예요');
  const f=JSON.parse(JSON.stringify(Object.assign({name:'',kind:'폼체인지',t1:'-',t2:'-',ability:'',base:['','','','','',''],image:'',cond:'',revert:true,pots:[],mvs:[]},isNew?{}:L[i])));f.pots=Array.isArray(f.pots)?f.pots:[];f.mvs=Array.isArray(f.mvs)?f.mvs:[];f.exs=Array.isArray(f.exs)?f.exs:[];
  const ST=['HP','공격','방어','특공','특방','스피드'];const KINDS=['폼체인지','메가진화','원시회귀','일루젼','기타'];
  const abN=(MK().abilList()||[]).map(r=>r&&r[1]).filter(Boolean),mvN=(MK().moveList()||[]).map(r=>r&&r[2]).filter(Boolean),ptN=(MK().potList()||[]).map(r=>r&&r[1]).filter(Boolean);
  const tsel=(idn,v)=>`<select id="${idn}"><option value="-">(그대로)</option>${TYPES.map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('')}</select>`;
  const potsH=()=>f.pots.map((x,k)=>`<div class="mrow" style="align-items:flex-start;gap:6px;margin-bottom:6px"><label class="lbl" style="flex:0 0 76px">칸<select data-sfp="slot" data-k="${k}">${Array.from({length:20},(_,n)=>`<option value="${n}" ${n===(+x.slot||0)?'selected':''}>#${n+1}</option>`).join('')}</select></label><label class="lbl" style="flex:1;min-width:0">포텐셜 이름<input type="text" list="sfPtL" data-sfp="name" data-k="${k}" value="${esc(x.name||'')}"></label><label class="lbl" style="flex:2;min-width:0">효과 <small class="dim">(비우면 DB 글)</small><textarea rows="2" data-sfp="eff" data-k="${k}">${esc(brN(x.eff||''))}</textarea></label><button type="button" class="btn xs ghost danger" data-sfdel="pots" data-k="${k}" style="margin-top:18px" aria-label="지우기">✕</button></div>`).join('');
  const mvsH=()=>f.mvs.map((x,k)=>`<div class="mrow" style="gap:6px;margin-bottom:6px"><label class="lbl" style="flex:1;min-width:0">원래 기술 <small class="dim">(비우면 추가)</small><input type="text" list="sfMvL" data-sfm="from" data-k="${k}" value="${esc(x.from||'')}"></label><label class="lbl" style="flex:1;min-width:0">새 기술<input type="text" list="sfMvL" data-sfm="to" data-k="${k}" value="${esc(x.to||'')}"></label><button type="button" class="btn xs ghost danger" data-sfdel="mvs" data-k="${k}" style="margin-top:18px" aria-label="지우기">✕</button></div>`).join('');
  const exsH=()=>f.exs.map((x,k)=>`<div class="mrow" style="align-items:flex-start;gap:6px;margin-bottom:6px"><label class="lbl" style="flex:1;min-width:0">전용 이름<input type="text" data-sfe="name" data-k="${k}" value="${esc(x.name||'')}"></label><label class="lbl" style="flex:2;min-width:0">효과<textarea rows="2" data-sfe="eff" data-k="${k}">${esc(brN(x.eff||''))}</textarea></label><button type="button" class="btn xs ghost danger" data-sfdel="exs" data-k="${k}" style="margin-top:18px" aria-label="지우기">✕</button></div>`).join('');
  const md=N().openModal(`<div class="mhead"><h2>공유 폼체인지</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small dim" style="margin-top:0">PT 전원이 쓸 수 있는 폼 — 웹툴에서 이 트레이너의 모든 포켓몬 폼 목록에 붙어요. 비워 둔 칸(이름 · 타입 · 특성 · 종족치)은 그 포켓몬 것 그대로. 저장하면 제작기에 바로 들어가요.</p>
   ${dl('sfAbL',abN)}${dl('sfMvL',mvN)}${dl('sfPtL',ptN)}
   <div class="mrow"><label class="lbl">이름 <small class="dim">(비우면 포켓몬 이름)</small><input id="sfN" type="text" value="${esc(f.name)}"></label><label class="lbl">종류<select id="sfK">${KINDS.map(k=>`<option ${k===f.kind?'selected':''}>${k}</option>`).join('')}</select></label></div>
   <div class="mrow"><label class="lbl">타입1${tsel('sfT1',f.t1)}</label><label class="lbl">타입2${tsel('sfT2',f.t2)}</label><label class="lbl">특성 <small class="dim">(비우면 그대로)</small><input id="sfA" type="text" list="sfAbL" value="${esc(f.ability||'')}"></label></div>
   <div class="mrow" style="flex-wrap:wrap;gap:6px">${ST.map((n,k)=>`<label class="lbl" style="flex:1 1 70px;min-width:64px">${n}<input type="number" inputmode="numeric" data-sfb="${k}" value="${esc(String((f.base||[])[k]??''))}" placeholder="그대로"></label>`).join('')}</div>
   <div class="sec" style="margin-top:10px">포텐셜 교체 <small class="dim">이 폼일 때만 바뀌는 칸 — 빈 번호 칸을 고르면 「이 폼일 때만 생기는 포텐셜」</small> <button type="button" class="btn xs" id="sfPA">＋ 교체 칸</button></div><div id="sfPB">${potsH()}</div>
   <div class="sec" style="margin-top:10px">기술 교체 <small class="dim">이 폼일 때만 바뀌는 기술</small> <button type="button" class="btn xs" id="sfMA">＋ 교체 기술</button></div><div id="sfMB">${mvsH()}</div>
   <div class="sec" style="margin-top:10px">전용 포텐셜 <small class="dim">이 폼일 때만 생기는 전용</small> <label class="small" style="display:inline-flex;gap:4px;align-items:center"><input type="checkbox" id="sfXR" ${f.exRep?'checked':''}> 원래 전용은 쓰지 않음</label> <button type="button" class="btn xs" id="sfEA">＋ 전용</button></div><div id="sfEB">${exsH()}</div>
   <div class="mrow" style="margin-top:8px"><label class="lbl" style="flex:2">조건 · 메모<input id="sfC" type="text" value="${esc(f.cond||'')}" placeholder="예) 고유 『○○』 발동 시"></label><label class="lbl" style="flex:2">그림 주소 <small class="dim">(비우면 원래 그림 · 파일은 제작기에서)</small><input id="sfI" type="text" value="${esc(/^data:/.test(f.image||'')?'':(f.image||''))}" placeholder="https://…"></label></div>
   <label class="row" style="gap:6px;margin-top:8px"><input type="checkbox" id="sfR" ${f.revert?'checked':''}> 교대하면 원래 모습으로 돌아옴</label>
   <div class="row" style="margin-top:12px">${isNew?'':'<button class="btn xs ghost danger" id="sfDel">지우기</button>'}<span class="sp"></span><button class="btn pri" id="sfOk">저장</button></div>`,'wide');
  const grab=()=>{$$('[data-sfp]',md).forEach(el=>{const x=f.pots[+el.dataset.k];if(x)x[el.dataset.sfp]=el.dataset.sfp==='slot'?+el.value:el.value});$$('[data-sfm]',md).forEach(el=>{const x=f.mvs[+el.dataset.k];if(x)x[el.dataset.sfm]=el.value.trim()});$$('[data-sfe]',md).forEach(el=>{const x=f.exs[+el.dataset.k];if(x)x[el.dataset.sfe]=el.value})};
  const redraw=()=>{$('#sfPB',md).innerHTML=potsH();$('#sfMB',md).innerHTML=mvsH();$('#sfEB',md).innerHTML=exsH()};
  $('#sfEA',md).onclick=()=>{grab();if(f.exs.length>=6)return N().toast('폼 전용은 6개까지예요');f.exs.push({name:'',eff:''});redraw()};
  $('#sfPA',md).onclick=()=>{grab();const used=f.pots.map(x=>+x.slot);let sl=[8,9,10,11,12,13,14].find(n=>!used.includes(n));if(sl==null)sl=0;f.pots.push({slot:sl,name:'',eff:''});redraw()};
  $('#sfMA',md).onclick=()=>{grab();f.mvs.push({from:'',to:''});redraw()};
  md.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-sfdel]');if(!b)return;grab();f[b.dataset.sfdel].splice(+b.dataset.k,1);redraw()});
  $('#sfOk',md).onclick=()=>{grab();const keepImg=/^data:/.test(f.image||'')&&!$('#sfI',md).value.trim();
   const v={name:$('#sfN',md).value.trim(),kind:$('#sfK',md).value,t1:$('#sfT1',md).value||'-',t2:$('#sfT2',md).value||'-',ability:$('#sfA',md).value.trim(),base:$$('[data-sfb]',md).map(el=>String(el.value).trim()),image:keepImg?f.image:$('#sfI',md).value.trim(),cond:$('#sfC',md).value.trim(),revert:$('#sfR',md).checked,
    pots:f.pots.filter(x=>x&&String(x.name||'').trim()).map(x=>({slot:Math.max(0,Math.min(19,+x.slot||0)),name:String(x.name).trim(),eff:String(x.eff||'').trim()})),mvs:f.mvs.filter(x=>x&&x.to).map(x=>({from:String(x.from||''),to:String(x.to)})),exs:f.exs.filter(x=>x&&String(x.name||'').trim()).map(x=>({name:String(x.name).trim(),eff:String(x.eff||'').trim()})),exRep:$('#sfXR',md).checked};
   N().closeModal();run('trainers',id,d=>{d.sforms=Array.isArray(d.sforms)?d.sforms:[];if(isNew)d.sforms.push(v);else d.sforms[i]=Object.assign({},d.sforms[i]||{},v)},'공유 폼체인지를 제작기에 넣었어요')};
  const de=$('#sfDel',md);if(de)de.onclick=async()=>{if(!(await N().confirmBox(`공유 폼 「${f.name||'이름 없음'}」을(를) 지울까요?`,'지우기')))return;N().closeModal();run('trainers',id,d=>{if(Array.isArray(d.sforms))d.sforms.splice(i,1)},'공유 폼을 지웠어요')}}

 function uniqSec(id,t,E){return uniqSec0(id,t,E)+extraSec(t,id,E)}
 function uniqSec0(id,t,E){if(!t)return '';const L=(t.unique||[]).map((u,i)=>({u,i})).filter(x=>x.u&&(x.u.name||x.u.eff));if(!L.length&&!(E&&univ()))return '';
  return `<section class="ux-sec ux-uq"><h4 class="ux-h"><span>고유 포텐셜</span><small>${L.length}</small><span class="sp"></span>${E?`<button type="button" class="btn xs ghost" data-ux="uqadd" data-id="${esc(id)}">＋ 고유</button>`:''}</h4>
   ${L.length?`<div class="ux-uqg">${L.map(({u,i})=>`<article class="ux-uc">${u.line?`<div class="ux-line" title="문구">${esc(u.line)}</div>`:''}<div class="ux-ub"><div class="ux-un"><i class="ux-gem" aria-hidden="true"></i><b>${esc(u.name||'(이름 없음)')}</b>${u.auto?'<small class="ux-auto" title="자동화 구문이 있어요 (웹툴 배틀에서 돌아요)">⚙</small>':''}<span class="sp"></span>${E?`<button type="button" class="ux-ed" data-ux="uqed" data-id="${esc(id)}" data-i="${i}" title="고치기">✎</button>`:''}</div><div class="ux-ue">${u.eff?fx(u.eff):'<span class="dim">효과가 아직 없어요</span>'}</div></div></article>`).join('')}</div>`:'<p class="small dim">아직 없어요.</p>'}</section>`}
 function uqEdit(id,i){const t=MK().trainer(id);if(!t)return;const L=t.unique||[];if(i==null||i<0){i=L.findIndex(u=>!u||(!u.name&&!u.eff));if(i<0)i=L.length}const u=Object.assign({name:'',line:'',eff:''},L[i]||{});
  const md=N().openModal(`<div class="mhead"><h2>고유 포텐셜</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small dim" style="margin-top:0">저장하면 제작기 트레이너 시트의 고유 포텐셜에 바로 들어가요.</p>
   <div class="mrow"><label class="lbl">이름<input id="uqN" type="text" value="${esc(u.name)}" placeholder="예) 신출귀몰 종횡무진"></label><label class="lbl">문구 <small class="dim">(한자 · 표어 · 비우면 안 보여요)</small><input id="uqL" type="text" value="${esc(u.line||'')}" placeholder="예) 神出鬼沒 縱橫無盡"></label></div>
   <label class="lbl">효과<textarea id="uqE" rows="6" placeholder="【등장】【소진】/ …">${esc(brN(u.eff))}</textarea></label>
   <label class="lbl">구문 <small class="dim">웹툴 배틀 자동 처리 · 비우면 같은 이름의 레디메이드 또는 손으로</small><textarea id="uqA" rows="2" spellcheck="false" style="font-family:var(--mono,monospace);font-size:12px" placeholder="예) 랭크 공격+1 임시">${esc(u.auto||'')}</textarea></label>
   <div id="uqW"></div>
   <div class="ux-prev" id="uqP"></div>
   <div class="row" style="margin-top:12px">${L[i]&&(L[i].name||L[i].eff)?'<button class="btn xs ghost danger" id="uqDel">비우기</button>':''}<span class="sp"></span><button class="btn pri" id="uqOk">저장</button></div>`,'wide');
  const pv=()=>{$('#uqP',md).innerHTML=`<div class="ux-uc solo">${$('#uqL',md).value.trim()?`<div class="ux-line">${esc($('#uqL',md).value.trim())}</div>`:''}<div class="ux-ub"><div class="ux-un"><i class="ux-gem"></i><b>${esc($('#uqN',md).value.trim()||'(이름)')}</b></div><div class="ux-ue">${fx($('#uqE',md).value)}</div></div></div>`};
  md.addEventListener('input',pv);pv();
  if(window.NT_WORD)NT_WORD.mount($('#uqW',md),{eff:$('#uqE',md),auto:$('#uqA',md),kind:'pot'});   /* 11-01 망령 「노트쪽 제작기에도 문법 점검 · 구문 추천」 */
  const save=v=>{N().closeModal();run('trainers',id,d=>{d.unique=Array.isArray(d.unique)?d.unique:[];while(d.unique.length<=i)d.unique.push({name:'',eff:''});const o=Object.assign({},d.unique[i]||{},v);if(!o.line)delete o.line;d.unique[i]=o},'고유 포텐셜을 제작기에 넣었어요')};
  $('#uqOk',md).onclick=()=>{const a=$('#uqA',md).value.trim();save(Object.assign({name:$('#uqN',md).value.trim(),line:$('#uqL',md).value.trim(),eff:$('#uqE',md).value.trim()},a||u.auto?{auto:a}:{}))};
  const dl=$('#uqDel',md);if(dl)dl.onclick=async()=>{if(await N().confirmBox('이 고유 포텐셜을 비울까요? (칸은 남아요)','비우기'))save({name:'',line:'',eff:'',auto:''})}}

 /* ===== 덱 ===== */
 /* 카드 색 — 제작기 카드 DB · 오레마스 덱 창과 같은 키 */
 const PAL=[['red','#c8504a','빨강'],['orange','#d9822b','주황'],['gold','#b8932a','금색'],['green','#4f9a5a','초록'],['teal','#2f948f','청록'],['blue','#4573c4','파랑'],['purple','#8a5cc4','보라'],['pink','#c45c9a','분홍'],['gray','#6b7286','회색'],['black','#30343f','검정']];
 const ccol=v=>{v=String(v||'').trim();const p=PAL.find(x=>x[0]===v||x[2]===v);return p?p[1]:(/^#[0-9a-f]{3,8}$/i.test(v)?v:'#6b7286')};
 const cimg=v=>{v=String(v||'').trim();return /^https?:\/\//.test(v)||/^data:image\//.test(v)?v:''};
 /* ===== 지시 체계 (10-29 망령 「4식 6령 설정도 넣어야 되는데 고유 아래 여백 많으니 거기다가」) =====
    제작기가 트레이너를 저장할 때 남기는 t.ordOut(제작기 ordSnap — 지시 체계 칸과 같은 규칙)을 그린다. 고치기는 제작기의 지시 체계 칸을 노트 안에서 연다(NT_MONED sec=tord) */
 function ordSec(id,t,E){if(!t)return [];const S=t.ordOut;const has=t.orders&&t.orders.preset;if(!has&&!(E&&univ()))return [];
  const ed=E&&window.NT_MONED?`<button type="button" class="btn xs ghost" data-moned="" data-sec="tord" data-id="${esc(id)}" title="제작기의 지시 체계 칸을 열어요 (지령 종류 · 항목별 계열 · 2체 기준 고르기)">✎ 제작기에서</button>`:'';
  const head=sub=>`<h4 class="ux-h"><span>지시 체계</span>${sub?`<small>${sub}</small>`:''}<span class="sp"></span>${ed}</h4>`;
  /* 10-29 망령 「ORDER 와 COMMAND 를 (PT 서머리 · 고유 아래) 양쪽에 배치시켜야 라인이 맞겠다」: [ORDER 칸, COMMAND 칸] 두 칸으로 돌려준다. 아직 못 그리면 한 칸(양쪽에 걸침) */
  if(!has)return [`<section class="ux-sec ux-ord span">${head('')}<p class="small dim" style="margin:0">아직 지령 종류를 정하지 않았어요 (웹툴 방 설정을 따라요).</p></section>`];
  if(!S||!S.preset)return [`<section class="ux-sec ux-ord span">${head('')}<p class="small dim" style="margin:0">제작기에서 이 트레이너를 한 번 열면(저장되면) 여기에 4식 · 6령이 보여요.</p></section>`];
  const two=S.mode==='solo'||S.mode==='misag';
  /* 11-10 망령 「(2체로 합칠 때 고르기를) 이 쪽에서 그냥 클릭해서 바꿀 수 있게」: 고칠 수 있으면 칩을 눌러 고르기 · 빼기 (제작기 t.orders.pick 과 같은 칸) */
  const pickable=x=>E&&two&&x.avail!==false&&!x.off;
  const chips=(L,kind)=>L.map(x=>{const pa=pickable(x);const tg=pa?'button':'span';return `<${tg} ${pa?`type="button" data-ux="ordpick" data-id="${esc(id)}" data-kind="${kind}" data-k="${esc(x.k)}"`:''} class="oc ${pa?'oc-pa':''} ${x.n?'':'z'} ${two&&x.pick?'pk':''} ${x.off?'off':''}" title="${esc(x.nm)}${x.ex?' · 예외 계열 '+x.ex:''}${x.off?' · 각성체 대가로 뺌':''}${two&&x.pick?' · 2체 기준으로 고름':''}${pa?(x.pick?' — 누르면 뺀다':' — 누르면 고른다'):''}"><span>${esc(x.nm)}</span><b>${x.n}</b>${x.ex?'<i>예외</i>':''}</${tg}>`}).join('');
  const pickLine=(kind,L)=>{if(!two)return '';const n=(S.pickN||{})[kind]||0;const pk=L.filter(x=>x.pick).length;return `<div class="ux-ordp ${pk===n?'':'need'}">${S.mode==='misag'?'2체로 합칠 때':'1인 기준'} 고른 것 <b>${pk}/${n}</b>${pk===n?'':(E?' · 칩을 눌러 골라요':' · 제작기에서 골라요')}</div>`};
  const offLine=(kind,L)=>{const n=S.offN&&S.offN[kind];if(!n)return '';const k=L.filter(x=>x.off).length;return `<div class="ux-ordp ${k===n?'':'need'}">각성체 대가로 뺀 것 <b>${k}/${n}</b></div>`};
  const blk=(kind,tag,lab,fam)=>{const L=S[kind]||[];return `<div class="ux-ordb"><div class="ux-ordt"><span class="ordk ${kind}">${tag}</span><b>${lab}</b><small>${esc(fam)}</small></div><div class="ux-ordl">${chips(L,kind)}</div>${offLine(kind,L)}${pickLine(kind,L)}</div>`};
  return [`<section class="ux-sec ux-ord o">${head(`지시 ${esc(S.rk||'-')} · ${esc(S.presetName||'')}`)}${blk('o','ORDER','명령 (4식)',S.oName)}</section>`,
   `<section class="ux-sec ux-ord c"><h4 class="ux-h"><span>지시 체계</span><small>COMMAND</small></h4>${blk('c','COMMAND','지령 (6령)',S.cName)}</section>`]}

 /* 11-10 지시 체계 칩 고르기: t.orders.pick[kind] 를 고치고, 노트가 그리는 요약(t.ordOut · 미사그 misagOut.two)도 같은 규칙으로 바로 맞춘다 (제작기가 다음에 저장하면 제작기 계산으로 다시 덮음) */
 function ordPick(id,kind,k){const t=MK().trainer(id)||{};const S=t.ordOut;if(!S||!S.preset||!(kind==='o'||kind==='c'))return;const L=S[kind]||[];const x=L.find(q=>q.k===k);if(!x||x.off||x.avail===false)return;
  const cur=((t.orders||{}).pick||{})[kind];const pk=Array.isArray(cur)?cur.slice():[];const on=pk.includes(k);const n=(S.pickN||{})[kind]||0;
  if(!on&&n&&pk.filter(q=>L.some(y=>y.k===q&&!y.off&&y.avail!==false)).length>=n)return N().toast(`이미 ${n}개 골랐어요 — 하나를 먼저 눌러 빼 주세요`);
  const nx=on?pk.filter(q=>q!==k):pk.concat(k);
  /* 제작기 soloMustOk: 지시 A 이상 2체 · 1인 기준은 6령에 회피 · 명중 중 하나를 넣어야 — 다 골랐는데 없으면 알려만 준다 */
  const lv={A:3,AA:4,AAA:5,S:6,EX:6}[String(S.rk||'').replace(/[+\-]/g,'').toUpperCase()]||0;const can=kind==='c'&&lv>=3?['evasion','accuracy'].filter(q=>L.some(y=>y.k===q&&!y.off&&y.avail!==false)):[];const warn=can.length&&nx.length>=n&&!nx.some(q=>can.includes(q))?' · 지시 A 이상은 회피 · 명중 지령 중 하나를 넣어야 해요':'';
  return run('trainers',id,d=>{d.orders=d.orders||{};d.orders.pick=Object.assign({},d.orders.pick||{});d.orders.pick[kind]=nx;
   const O=d.ordOut;if(O&&Array.isArray(O[kind])){for(const y of O[kind]){y.pick=nx.includes(y.k);const zero=y.avail===false||(O.mode==='solo'&&!y.pick)||y.off;y.n=zero?0:(+O.base||1)}}
   const two=d.misagOut&&d.misagOut.two;if(two&&O&&Array.isArray(O[kind])){const ok=O[kind].filter(y=>y.pick&&y.avail!==false&&!y.off);two.pick=Object.assign({},two.pick||{});two.names=Object.assign({},two.names||{});two.pick[kind]=ok.map(y=>y.k);two.names[kind]=ok.map(y=>y.nm)}},`${x.nm} — ${on?'뺐어요':'골랐어요'}${warn}`)}
 /* 11-04 망령 「여긴 왜 안 고쳐」: 은열쇠 세 칸 (노트 27 · 제작기 sk3Html 과 같은 데이터)
    t.sk3 = {c 체크, d 던전, b 배틀, r 예비} 카드 이름 · t.vault = [{n, src, at}] 카드 보관소. 칸을 누르면 그 종류의 공통 카드 + 보관소 카드에서 고른다. 코스트 없음 */
 const SK3=[['c','스킬'],['d','던전'],['b','배틀'],['r','예비']],SK3N={c:'스킬',d:'던전',b:'배틀',r:'예비'};
 const skK=r=>{const t=String((r&&r[2])||'');const o=[];if(/체크|스킬/.test(t))o.push('c');if(/던전/.test(t))o.push('d');if(/배틀/.test(t))o.push('b');return o};
 const skCommon=()=>{const L=MK().cardList().filter(r=>r&&r[0]==='은열쇠 · 공통'&&r[1]&&skK(r).length);const st=L.filter(r=>String(r[12]||'').trim()==='시작');return st.length?st:L};
 function skChoices(t,k){const ok=r=>{const ks=skK(r);return k==='r'?ks.length>0:ks.includes(k)};const out=[];for(const r of skCommon())if(ok(r))out.push({n:r[1],v:false});
  for(const v of (Array.isArray(t.vault)?t.vault:[]))if(v&&v.n){const r=MK().card(v.n);if(r&&ok(r)&&!out.some(x=>x.n===v.n))out.push({n:v.n,v:true})}return out}
 /* 은열쇠 카드 그림 — 제작기 · 웹툴과 같은 js/skcard.js (이름 · 종류 · 문양 · 효과까지) */
 const CPAL={red:'#c8504a',orange:'#d9822b',gold:'#b8932a',green:'#4f9a5a',teal:'#2f948f',blue:'#4573c4',purple:'#8a5cc4',pink:'#c45c9a',gray:'#6b7286',black:'#30343f'};
 function skc(n,o){const r=n?MK().card(n):null;if(!window.SKCARD)return `<b>${esc(n||'')}</b>`;
  return SKCARD.html(r?{n,t:r[2],c:'',x:brN(String(r[4]||'')),col:ccol(r[5]),img:cimg(r[6]),ic:String(r[10]||''),src:String(r[11]||''),auto:!!String(r[9]||'').trim()}:{n:n||'?',t:'카드 DB 에 없음',col:'#6b7286'},o||{})}
 function skTile(n,attrs,badge,mini){return `<button type="button" class="ux-skc" ${attrs} title="${esc(n||'')}">${skc(n,{cls:mini?'skc-mini':'',badge:badge||''})}</button>`}
 function skTileOld(n,attrs,badge){const r=n?MK().card(n):null;const img=r?cimg(r[6]):'';const col=r?ccol(r[5]):'#6b7286';
  return `<div class="ux-ct ${n&&!r?'miss':''}" style="--cc:${col}"><button type="button" class="ux-cti" ${attrs} style="${img?`background-image:url('${cssu(img)}')`:''}" title="${esc(n||'')}">${img?'':`<span class="ux-ctl">${esc([...(n||'?')][0]||'?')}</span>${r&&r[4]?`<span class="ux-ctx">${esc(brN(r[4]).slice(0,54))}</span>`:''}`}${badge?`<b class="ux-ctq">${esc(badge)}</b>`:''}</button><div class="ux-ctn">${esc(n||'')}</div></div>`}
 function deckSec(id,t,E){if(!t)return '';const s3=t.sk3&&typeof t.sk3==='object'?t.sk3:{};const V=(Array.isArray(t.vault)?t.vault:[]).filter(v=>v&&v.n);
  if(!Object.keys(s3).length&&!V.length&&!(E&&univ())&&!(t.deck||[]).length)return '';if(!MK().dbReady())MK().db().then(()=>N().render());
  const used=new Set(Object.values(s3));
  const slot=([k,lab])=>{const n=s3[k];return `<div class="ux-sk k-${k}"><div class="ux-skh">${lab}</div>${n?skTile(n,`data-ux="${E?'skpick':'skv'}" data-id="${esc(id)}" data-k="${k}"`):`<button type="button" class="ux-ske" ${E?`data-ux="skpick" data-id="${esc(id)}" data-k="${k}"`:'disabled'}>${E?'＋':''}<br>${lab} 카드</button>`}</div>`};
  return `<section class="ux-sec ux-deck"><h4 class="ux-h"><span>은열쇠 카드</span><small>체크 · 던전 · 배틀 · 예비</small><span class="sp"></span>${E?'<small class="dim">칸을 누르면 그 종류 카드에서 고른다</small>':''}</h4>
   <div class="ux-skrow"><div class="ux-skg">${SK3.map(slot).join('')}</div>
   <div class="ux-skv"><div class="ux-skvh">카드 보관소 <small>${V.length}</small></div>
   ${V.length?`<div class="ux-skvl">${V.map(v=>`<div class="ux-skvi">${skTile(v.n,`data-ux="skv" data-id="${esc(id)}" data-n="${esc(v.n)}"`,used.has(v.n)?'칸':'',true)}<small>${esc(v.src||'')}</small></div>`).join('')}</div>`:'<p class="small dim" style="margin:2px 0 0">시나리오 · 호감도 보상으로 받은 그 트레이너만의 특수 카드가 여기 들어와요 (웹툴 GM 「카드 건네주기」 · 제작기 「＋ 특수 카드」). 같은 종류 칸에 넣어 써요.</p>'}</div></div>
   ${(t.deck||[]).length?`<p class="small dim" style="margin:6px 0 0">예전 덱 ${(t.deck||[]).length}종은 제작기 「예전 덱 관리」에 남아 있어요.</p>`:''}</section>`}
 function skPick(id,k){const t=MK().trainer(id);if(!t)return;const L=skChoices(t,k);const s3=t.sk3||{};const other=n=>Object.entries(s3).find(([kk,v])=>kk!==k&&v===n);
  const md=N().openModal(`<div class="mhead"><h2>${esc(t.name||'')} · ${SK3N[k]} 칸</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="ux-skp">${L.map(x=>{const o=other(x.n);return `<div class="${o?'ux-skoff':''}${s3[k]===x.n?' ux-skon':''}">${skTile(x.n,o?'disabled':`data-skn="${esc(x.n)}"`,x.v?'보관소':o?SK3N[o[0]]+' 칸':'')}</div>`}).join('')||'<p class="small dim">고를 카드가 없어요 — 제작기 카드 DB 의 「은열쇠 · 공통」을 확인해요.</p>'}</div>
   <div class="row" style="margin-top:10px">${s3[k]?'<button class="btn sm danger" data-skclr>칸 비우기</button>':''}<span class="sp"></span><button class="btn sm" data-x>닫기</button></div>`,'wide');
  md.addEventListener('click',e=>{const b=e.target.closest('[data-skn]');const c=e.target.closest('[data-skclr]');if(!b&&!c)return;const n=b?b.dataset.skn:'';N().closeModal();
   run('trainers',id,d=>{d.sk3=Object.assign({},d.sk3&&typeof d.sk3==='object'?d.sk3:{});if(n)d.sk3[k]=n;else delete d.sk3[k]},n?`${SK3N[k]} 칸 — 「${n}」`:'칸을 비웠어요')})}
 function skView(n){if(window.SKCARD){N().openModal(`<div class="mhead"><h2>${esc(n)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div style="display:flex;justify-content:center"><div class="ux-skbig">${skc(n,{})}</div></div>`);return}const r=MK().card(n);const img=r?cimg(r[6]):'';N().openModal(`<div class="mhead"><h2>${esc(n)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="ux-cv" style="--cc:${r?ccol(r[5]):'#6b7286'}"><div class="ux-cvi" style="${img?`background-image:url('${cssu(img)}')`:''}">${img?'':`<span>${esc([...n][0]||'?')}</span>`}</div><div class="ux-cvb"><div class="row" style="gap:6px;flex-wrap:wrap">${r?`<span class="chip static">${esc(r[2]||'카드')}</span>${r[10]?`<span class="chip static">${esc(r[10])}</span>`:''}`:'<span class="warn small">제작기 카드 DB 에 없는 이름이에요</span>'}</div>${r&&r[4]?`<div class="ux-ue" style="margin-top:8px">${fx(r[4])}</div>`:''}</div></div>`)}
 function oldDeckSec(id,t,E){if(!t)return '';const L=t.deck||[];if(!L.length&&!(E&&univ()))return '';if(!MK().dbReady())MK().db().then(()=>N().render());
  const tot=L.reduce((a,x)=>a+(+x.q||0),0);
  const tile=(x,k)=>{const r=MK().card(x.n);const img=r?cimg(r[6]):'';const col=r?ccol(r[5]):'#6b7286';const cost=r&&r[3]!==''&&r[3]!=null?String(r[3]):'';
   return `<div class="ux-ct ${r?'':'miss'}" style="--cc:${col}"><button type="button" class="ux-cti" data-ux="card" data-id="${esc(id)}" data-k="${k}" style="${img?`background-image:url('${cssu(img)}')`:''}" title="${esc(x.n)} — 눌러서 보기">${img?'':`<span class="ux-ctl">${esc([...x.n][0]||'?')}</span>${r&&r[4]?`<span class="ux-ctx">${esc(brN(r[4]).slice(0,54))}</span>`:''}`}<b class="ux-ctq">×${+x.q||0}</b></button>
    <div class="ux-ctn">${esc(x.n)}</div><div class="ux-ctk">${r?esc(r[2]||'카드'):'<span class="warn">카드 DB 에 없음</span>'}</div>
    ${E?`<div class="ux-ctb"><button type="button" data-ux="dq" data-id="${esc(id)}" data-k="${k}" data-d="-1" aria-label="한 장 빼기">−</button><button type="button" data-ux="dq" data-id="${esc(id)}" data-k="${k}" data-d="1" aria-label="한 장 더">+</button><button type="button" class="danger" data-ux="ddel" data-id="${esc(id)}" data-k="${k}" aria-label="덱에서 빼기">✕</button></div>`:''}</div>`};
  return `<section class="ux-sec ux-deck"><h4 class="ux-h"><span>덱</span>${t.deckName?`<b class="ux-dn">${esc(t.deckName)}</b>`:''}<small>${L.length}종 · ${tot}장</small><span class="sp"></span>${E?`<button type="button" class="btn xs ghost" data-ux="dname" data-id="${esc(id)}">덱 이름</button><button type="button" class="btn xs" data-ux="dadd" data-id="${esc(id)}">＋ 카드</button>`:''}</h4>
   ${L.length?`<div class="ux-cg">${L.map(tile).join('')}</div>`:'<p class="small dim" style="margin:2px 0 0">덱이 비어 있어요. 「＋ 카드」로 제작기 카드 DB 에서 고르거나 새 카드를 만들어요.</p>'}</section>`}
 function cardView(id,k){const t=MK().trainer(id);const x=t&&(t.deck||[])[k];if(!x)return;const r=MK().card(x.n);const img=r?cimg(r[6]):'';
  N().openModal(`<div class="mhead"><h2>${esc(x.n)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="ux-cv" style="--cc:${r?ccol(r[5]):'#6b7286'}"><div class="ux-cvi" style="${img?`background-image:url('${cssu(img)}')`:''}">${img?'':`<span>${esc([...x.n][0]||'?')}</span>`}</div>
   <div class="ux-cvb"><div class="row" style="gap:6px;flex-wrap:wrap">${r?`<span class="chip static">${esc(r[2]||'카드')}</span>${r[0]?`<span class="chip static">${esc(r[0])}</span>`:''}`:'<span class="warn small">제작기 카드 DB 에 없는 이름이에요</span>'}<span class="chip static">덱에 ×${+x.q||0}</span></div>
    ${r&&r[4]?`<div class="ux-ue" style="margin-top:8px">${fx(r[4])}</div>`:''}${r&&r[8]?`<p class="small dim pre">${esc(r[8])}</p>`:''}${r&&String(r[9]||'').trim()?'<p class="small dim">⚙ 웹툴 배틀에서 도는 구문이 있어요</p>':''}</div></div>`)}
 function cardPick(id){const t=MK().trainer(id);if(!t)return;let q='';
  const md=N().openModal(`<div class="mhead"><h2>덱에 넣을 카드</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="row" style="gap:6px"><input id="cpQ" type="search" data-nodirty placeholder="이름 · 종류 · 효과로 찾기" style="flex:1"><button class="btn sm" id="cpNew">＋ 새 카드 만들기</button></div>
   <div class="ux-cpl" id="cpL"></div>`,'wide');
  const draw=()=>{const T=MK().trainer(id)||t;const inDeck=new Set((T.deck||[]).map(x=>x.n));const s=q.trim().toLowerCase();
   const L=MK().cardList().filter(r=>!s||[r[1],r[2],r[4],r[0]].some(v=>String(v||'').toLowerCase().includes(s))).slice(0,120);
   $('#cpL',md).innerHTML=(L.length?L.map(r=>{const img=cimg(r[6]);return `<button type="button" class="ux-cpr ${inDeck.has(r[1])?'on':''}" data-cpk="${esc(r[1])}" style="--cc:${ccol(r[5])}"><i style="${img?`background-image:url('${cssu(img)}')`:''}">${img?'':esc([...r[1]][0]||'?')}</i><span><b>${esc(r[1])}</b><small>${esc(r[2]||'카드')}</small><em>${esc(brN(r[4]).slice(0,90))}</em></span><u>${inDeck.has(r[1])?'✓ 덱에 있음':'넣기'}</u></button>`}).join(''):`<div class="small dim" style="padding:10px 2px">${MK().cardList().length?'찾는 카드가 없어요.':'제작기 카드 DB 가 비어 있어요. 「＋ 새 카드 만들기」로 첫 카드를 만들어요.'}</div>`)
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
   const DB=N().DBS();try{if(!MK().card(n)){if(!DB.makerPut)throw new Error('이 화면에서는 제작기에 쓸 수 없어요');const row=['',n,$('#cnK',md).value.trim(),$('#cnC',md).value.trim(),$('#cnE',md).value.trim(),$('#cnCol',md).value,img,String(Math.max(1,+$('#cnQ',md).value||1)),'노트에서 만듦','','',String((MK().trainer(id)||{}).name||'').trim()];   /* 11-01: 10 아이콘 · 11 출처 = 만든 트레이너 (제작기 카드 DB 폴더) */
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
      <label class="lbl">효과<textarea id="imE" rows="4">${esc(brN(o.eff))}</textarea></label><label class="lbl">구문 <small class="dim">웹툴 배틀 자동 처리 · 비우면 효과 글을 읽어요</small><textarea id="imA" rows="2" spellcheck="false" style="font-family:var(--mono,monospace);font-size:12px">${esc(o.auto||'')}</textarea></label><div id="imW"></div>
      <div class="row" style="gap:6px;margin-top:6px"><span class="sp"></span><button type="button" class="btn xs ghost" data-ie="mkcancel">그만두기</button><button type="button" class="btn xs pri" data-ie="mkok" data-k="${k}">이 칸에 두기</button></div></div>`})():''}</div>`}).join('')
    +(S.length<3?'<button type="button" class="btn xs ghost" data-ie="add" style="margin-top:6px">＋ 소지품 칸</button> <small class="dim">기본 1칸 · 2 · 3번 칸은 제작기 조건(특성 · 포텐셜)을 따라요</small>':'');
   if(make>=0&&window.NT_WORD)NT_WORD.mount($('#imW',md),{eff:$('#imE',md),auto:$('#imA',md),kind:'item',name:()=>$('#imN',md).value.trim(),nameEl:$('#imN',md)});   /* 11-01 망령: 오리지널 소지품도 워딩 점검 · 구문 추천 */
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
  if(a==='exadd'||a==='exed'){e.preventDefault();if(!canEd(id))return;return extEdit(id,a==='exadd'?-1:+b.dataset.i)}
  if(a==='sfadd'||a==='sfed'){e.preventDefault();if(!canEd(id))return;return sformEdit(id,a==='sfadd'?-1:+b.dataset.i)}
  if(a==='skv'){e.preventDefault();const t=MK().trainer(id)||{};return skView(b.dataset.n||((t.sk3||{})[b.dataset.k])||'')}
  if(!canEd(id))return N().toast('이 시트는 고칠 수 없어요');e.preventDefault();
  if(a==='heal'){const m=(MK().mons(id)||[]).find(x=>x.id===b.dataset.pid);if(!m)return;b.disabled=true;return MK().heal1(m).then(()=>{N().toast(`「${m.nick||m.name||'포켓몬'}」 회복 — 웹툴 방 시트에도 곧 반영돼요`);N().render()}).catch(er=>{b.disabled=false;N().toast('회복 저장 실패: '+er.message)})}   /* 11-06 망령 「기술 포텐셜 접는 버튼 옆에 회복」 */
  if(a==='uqadd')return uqEdit(id,-1);if(a==='uqed')return uqEdit(id,+b.dataset.i);
  if(a==='dadd')return cardPick(id);
  if(a==='skpick')return skPick(id,b.dataset.k);
  if(a==='ordpick')return ordPick(id,b.dataset.kind,b.dataset.k);
  if(a==='dq'){const k=+b.dataset.k,dd=+b.dataset.d;return run('trainers',id,d=>{const x=(d.deck||[])[k];if(!x)return false;x.q=Math.max(0,Math.min(99,(+x.q||0)+dd))})}
  if(a==='ddel'){const k=+b.dataset.k;return run('trainers',id,d=>{if(!(d.deck||[])[k])return false;d.deck.splice(k,1)})}
  if(a==='dname'){const t=MK().trainer(id)||{};return N().promptBox('덱 이름',t.deckName||'',(t.name||'트레이너')+'의 덱').then(v=>{if(v==null)return;run('trainers',id,d=>{d.deckName=v.trim()})})}
  if(a==='item')return itemEd(id,b.dataset.pid)});
 return {uniqSec,ordSec,deckSec,itemEd,fx,skc};
})();
