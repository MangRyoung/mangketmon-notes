/* ---------- 포켓몬 고치기 (10-29 망령: 「소지품 말고 포켓몬 데이터 수정하는 기능」) ----------
   PC 시트 파티 칸의 「✎ 포켓몬 고치기」. 제작기 포켓몬 문서(pokemon/<id>)에 바로 쓴다 (NT_MAKER.edit, 저장할 때 한 번).
   · 고치는 것: 성별 · 테라 · 분배 · 특성 · 기술 · 포텐셜 · 메모. 종족 · 종족값 · 전용 포텐셜 · 프라이드는 제작기에서
   · 포텐셜은 제작기처럼 칸 번호를 그대로 둔다(앞으로 당기지 않는다). 이름을 바꾼 칸은 제작기에서 따로 적은 효과 · 분류(potEff · potKind)를 비운다
   · 파티 칸이 읽는 effTxt(특성 · 포텐셜 효과 글 사본)도 같이 맞춘다 — 제작기가 다음에 저장하면 제작기가 다시 적는다 */
"use strict";
window.NT_MONED=(()=>{
 const N=()=>window.NT;const MK=()=>window.NT_MAKER;const {$,esc}=window.NT;
 const brN=v=>String(v==null?'':v).replace(/<br\s*\/?>/gi,'\n').replace(/\\n/g,'\n');
 const fx=s=>window.NT_UNIV?NT_UNIV.fx(s):esc(brN(s));
 const TY=['노말','불꽃','물','풀','전기','얼음','격투','독','땅','비행','에스퍼','벌레','바위','고스트','드래곤','악','강철','페어리','스텔라'];
 const GEN=[['-','—'],['♂','♂ 수컷'],['♀','♀ 암컷'],['무성','무성']];
 const canEd=id=>N().gm()||N().me()===id;
 let Q=Promise.resolve();
 const potName=n=>String(n||'').replace(/[『』]/g,'').trim();
 function open(id,pid){const m=MK().M.pokemon.find(p=>p.id===pid);if(!m)return;
  const S={gender:m.gender||'-',tera:m.tera||'-',dist:+m.dist||0,ability:m.ability||'',memo:m.memo||'',
   moves:(m.moves||[]).map(x=>typeof x==='string'?{name:x,half:false}:Object.assign({},x)).filter(x=>x&&x.name),
   pots:(m.pots||[]).map(n=>potName(n)==='-'?'':potName(n)),potEff:(m.potEff||[]).slice(),potKind:(m.potKind||[]).slice()};
  const pot0=S.pots.slice();let mq=null,pend=-1;
  const md=N().openModal(`<div class="mhead"><h2>포켓몬 고치기 · ${esc(m.name||'')}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small dim" style="margin-top:0">저장하면 제작기 포켓몬 시트에 바로 들어가요. 종족 · 종족값 · 전용 포텐셜은 제작기에서 고쳐요.</p>
   <div id="meB"></div><div class="row" style="margin-top:12px"><span class="sp"></span><button class="btn ghost" data-x>취소</button><button class="btn pri" id="meOk">제작기에 저장</button></div>`,'wide');
  const abRow=()=>MK().abil(S.ability);
  const potEff=i=>S.potEff[i]&&S.pots[i]===pot0[i]?S.potEff[i]:((MK().pot(S.pots[i])||[])[2]||'');
  const potKind=i=>S.potKind[i]&&S.pots[i]===pot0[i]?S.potKind[i]:((MK().pot(S.pots[i])||[])[0]||'');
  const draw=()=>{const ar=abRow();const pl=S.pots.map((n,i)=>({n,i})).filter(x=>x.n||x.i===pend);
   $('#meB',md).innerHTML=`
    <div class="me-sec"><h4>기본</h4><div class="mrow">
     <label class="lbl">성별<select id="meG">${GEN.map(([v,l])=>`<option value="${esc(v)}" ${S.gender===v?'selected':''}>${l}</option>`).join('')}</select></label>
     <label class="lbl">테라<select id="meT"><option value="-">—</option>${TY.map(v=>`<option ${S.tera===v?'selected':''}>${v}</option>`).join('')}</select></label>
     <label class="lbl">분배 <small class="dim">레벨에 더해요</small><input id="meD" type="number" step="1" value="${esc(S.dist)}" style="width:90px"></label></div></div>
    <div class="me-sec"><h4>특성</h4><input id="meA" type="text" list="meAL" data-nodirty value="${esc(S.ability)}" placeholder="특성 이름"><datalist id="meAL">${MK().abilList().map(r=>`<option value="${esc(r[1])}">`).join('')}</datalist>
     ${S.ability?(ar?`<div class="ux-ue me-pv">${fx(ar[2])}</div>`:'<div class="small dim me-pv">특성 DB 에 없는 이름이에요 — 효과 글 없이 이름만 들어가요</div>'):''}</div>
    <div class="me-sec"><h4>기술 <small class="dim">${S.moves.length}</small><span class="sp"></span><button type="button" class="btn xs" data-me="mvadd">＋ 기술</button></h4>
     ${S.moves.map((x,k)=>{const r=MK().move(x.name);return `<div class="me-mv">${r&&r[5]&&r[5]!=='-'?`<em class="tch" style="background:${esc(tcol(r[5]))}">${esc(r[5])}</em>`:''}<b>${esc(x.name)}</b><small class="dim">${r?esc([r[6],+r[7]?'위력 '+r[7]:'',r[8]&&r[8]!=='0'&&r[8]!=='-'?'명중 '+r[8]:''].filter(Boolean).join(' · ')):'기술 DB 에 없음'}</small><span class="sp"></span><label class="small"><input type="checkbox" data-mehalf="${k}" ${x.half?'checked':''}> 할인</label><button type="button" class="btn xs ghost" data-me="mvup" data-k="${k}" title="위로" ${k?'':'disabled'}>↑</button><button type="button" class="btn xs ghost danger" data-me="mvdel" data-k="${k}" title="빼기">✕</button></div>`}).join('')||'<div class="small dim">기술이 없어요</div>'}
     ${mq!=null?`<div class="ux-ip"><input type="search" id="meQ" data-nodirty placeholder="기술 이름 · 타입 · 분류 · 효과로 찾기" value="${esc(mq)}"><div class="ux-ipl" id="meL"></div></div>`:''}</div>
    <div class="me-sec"><h4>포텐셜 <small class="dim">${pl.length}</small><span class="sp"></span><button type="button" class="btn xs" data-me="potadd">＋ 포텐셜</button></h4>
     <datalist id="mePL">${MK().potList().map(r=>`<option value="${esc(r[1])}">${esc(String(r[0]||'').replace(/^\d+(\.\d+)*\.\s*/,''))}</option>`).join('')}</datalist>
     ${pl.map(({n,i})=>{const e=potEff(i),k=String(potKind(i)).replace(/^\d+(\.\d+)*\.\s*/,'');return `<div class="me-pot"><div class="row" style="gap:6px"><span class="ux-isk">${i+1}</span><input type="text" list="mePL" data-mepot="${i}" data-nodirty value="${esc(n)}" style="flex:1;min-width:0">${k?`<small class="chip static">${esc(k)}</small>`:''}<button type="button" class="btn xs ghost danger" data-me="potdel" data-k="${i}" title="이 칸 비우기">✕</button></div>${e?`<div class="ux-ue me-pv">${fx(e)}</div>`:`<div class="small dim me-pv">${MK().pot(n)?'':'포텐셜 DB 에 없는 이름이에요'}</div>`}</div>`}).join('')||'<div class="small dim">포텐셜이 없어요</div>'}</div>
    <div class="me-sec"><h4>메모</h4><textarea id="meM" rows="3" data-nodirty>${esc(S.memo)}</textarea></div>`;
   if(mq!=null){const i=$('#meQ',md);mlist();i.addEventListener('input',()=>{mq=i.value;mlist()});setTimeout(()=>i.focus(),0)}};
  const mlist=()=>{const el=$('#meL',md);if(!el)return;const s=(mq||'').trim().toLowerCase();const have=new Set(S.moves.map(x=>x.name));
   const L=MK().moveList().filter(r=>!have.has(r[2])&&(!s||[r[2],r[5],r[6],r[1],r[13]].some(v=>String(v||'').toLowerCase().includes(s)))).slice(0,60);
   el.innerHTML=L.length?L.map(r=>`<button type="button" class="ux-ipr" data-mepk="${esc(r[2])}"><b>${esc(r[2])}</b><small>${esc([r[5],r[6],+r[7]?'위력 '+r[7]:''].filter(Boolean).join(' · '))}</small><em>${esc(brN(r[13]).slice(0,110))}</em></button>`).join(''):`<div class="small dim" style="padding:8px 2px">${MK().moveList().length?'찾는 기술이 없어요':'기술 DB 를 불러오는 중…'}</div>`};
  const grab=()=>{const g=id=>$(id,md);if(g('#meG'))S.gender=g('#meG').value;if(g('#meT'))S.tera=g('#meT').value;if(g('#meD'))S.dist=Math.round(+g('#meD').value)||0;if(g('#meA'))S.ability=g('#meA').value.trim();if(g('#meM'))S.memo=g('#meM').value;
   md.querySelectorAll('[data-mepot]').forEach(x=>{S.pots[+x.dataset.mepot]=potName(x.value)})};
  MK().db().then(()=>{if(md.isConnected)draw()});draw();
  md.addEventListener('change',e=>{const t=e.target;if(t.dataset.mehalf!=null){const x=S.moves[+t.dataset.mehalf];if(x)x.half=t.checked;return}if(t.id==='meA'||t.dataset.mepot!=null){grab();draw()}});
  md.addEventListener('click',e=>{const pk=e.target.closest('[data-mepk]');if(pk){grab();S.moves.push({name:pk.dataset.mepk,half:false});mq='';draw();return}
   const b=e.target.closest('[data-me]');if(!b)return;grab();const a=b.dataset.me,k=+b.dataset.k;
   if(a==='mvadd'){mq=mq==null?'':null;draw();return}
   if(a==='mvdel'){S.moves.splice(k,1);draw();return}
   if(a==='mvup'&&k>0){const x=S.moves.splice(k,1)[0];S.moves.splice(k-1,0,x);draw();return}
   if(a==='potdel'){S.pots[k]='';if(pend===k)pend=-1;draw();return}
   if(a==='potadd'){let i=S.pots.findIndex(x=>!x);if(i<0){i=S.pots.length;if(i>=20)return N().toast('포텐셜 칸(20)이 다 찼어요')}S.pots[i]='';pend=i;draw();const el=md.querySelector(`[data-mepot="${i}"]`);if(el)el.focus();return}});
  $('#meOk',md).onclick=()=>{grab();N().closeModal();
   Q=Q.then(()=>MK().edit('pokemon',pid,d=>{
     d.gender=S.gender;d.tera=S.tera;d.dist=S.dist;d.ability=S.ability;d.memo=S.memo;
     d.moves=S.moves.map(x=>({name:x.name,half:!!x.half}));
     const n=Math.max(20,(d.pots||[]).length,S.pots.length);const P=Array(n).fill(''),PE=Array(n).fill(''),PK=Array(n).fill('');
     for(let i=0;i<n;i++){const v=S.pots[i]||'';P[i]=v;if(v&&v===pot0[i]){PE[i]=(d.potEff||[])[i]||'';PK[i]=(d.potKind||[])[i]||''}}
     d.pots=P;d.potEff=PE;d.potKind=PK;
     const ab=MK().abil(S.ability);const ef=i=>PE[i]||((MK().pot(P[i])||[])[2]||'');const kd=i=>PK[i]||((MK().pot(P[i])||[])[0]||'');
     d.effTxt=Object.assign({},d.effTxt||{},{ab:ab?String(ab[2]||''):'',pots:P.map((v,i)=>v?String(ef(i)):''),kinds:P.map((v,i)=>v?String(kd(i)):'')})}))
    .then(r=>{if(r!==false){N().render();N().toast('포켓몬을 제작기에 저장했어요')}}).catch(e=>N().toast('제작기에 못 썼어요: '+e.message))}}
 const T2C={'노말':'#9aa','불꽃':'#f08030','물':'#6890f0','풀':'#78c850','전기':'#f8d030','얼음':'#98d8d8','격투':'#c03028','독':'#a040a0','땅':'#e0c068','비행':'#a890f0','에스퍼':'#f85888','벌레':'#a8b820','바위':'#b8a038','고스트':'#705898','드래곤':'#7038f8','악':'#705848','강철':'#b8b8d0','페어리':'#ee99ac'};
 const tcol=t=>T2C[t]||'#666';
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-moned]');if(!b)return;e.preventDefault();const id=b.dataset.id||'';if(!canEd(id))return N().toast('이 시트는 고칠 수 없어요');open(id,b.dataset.moned)});
 return {open};
})();
