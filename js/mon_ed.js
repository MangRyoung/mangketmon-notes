/* ---------- 제작기로 고치기 (10-29 망령: 「포켓몬 고치기는 제작기 기능 참고해야지」) ----------
   노트 안에 제작기를 그대로 띄운다: 제작기 ?focus=<트레이너>&p=<포켓몬>&embed=1 = 그 트레이너 한 명만 펼치고 그 포켓몬으로 간다.
   능력치 · 프라이드 · 기술 소켓 · 포텐셜 · 상세 조정까지 제작기와 같은 화면이라 따로 계산을 두지 않는다.
   닫을 때 제작기에 {mkm:'flush'} 를 보내 공유 DB 에 다 올라간 것을 확인하고({mkm:'flushed'}) 노트가 제작기 문서를 다시 읽는다 */
"use strict";
window.NT_MONED=(()=>{
 const N=()=>window.NT;const MK=()=>window.NT_MAKER;const {$,esc}=window.NT;
 const canEd=id=>N().gm()||N().me()===id;
 const url=(tid,pid,sec)=>String((window.NT_CONFIG||{}).makerUrl||'').replace(/\/?$/,'/')+'?focus='+encodeURIComponent(tid)+(pid?'&p='+encodeURIComponent(pid):'')+(sec?'&sec='+encodeURIComponent(sec):'')+'&embed=1&t='+Date.now().toString(36);   /* 10-30: 브라우저가 들고 있는 옛 제작기 index.html(최대 10분) 대신 늘 새로 받게 */
 function open(tid,pid,sec){   /* sec: 제작기에서 그 칸으로 (tord = 지시 체계) */const t=MK().trainer(tid);const m=pid&&MK().M.pokemon.find(p=>p.id===pid);
  const md=N().openModal(`<div class="mked-h"><b>제작기</b><span class="dim">${esc((t&&t.name)||'')}${m?' · '+esc(m.name||''):''}</span><span class="sp"></span><a class="btn xs ghost" href="${esc(url(tid,pid,sec).replace(/&embed=1/,''))}" target="_blank" rel="noopener" title="제작기를 새 창에서 (다른 트레이너도 보고 싶을 때)">새 창 ↗</a><button type="button" class="btn xs pri" id="mkedX">저장하고 닫기</button></div>
   <div class="mked-b"><iframe id="mkedF" title="제작기" src="${esc(url(tid,pid,sec))}"></iframe><div class="mked-w" id="mkedW" hidden>제작기에 저장하는 중…</div></div>`,'mked');
  const bg=md.parentElement;bg._dirty=1;   /* 바깥을 눌러 닫히지 않게 (저장 확인을 거치도록) */
  let closing=false;
  const fin=()=>{bg.remove();if(!$('.modalbg'))document.body.classList.remove('modal-open');reload()};
  $('#mkedX',md).onclick=()=>{if(closing)return;closing=true;const f=$('#mkedF',md);const w=$('#mkedW',md);w.hidden=false;
   let done=false;const on=e=>{const d=e.data;if(!d||d.mkm!=='flushed'||e.source!==(f&&f.contentWindow))return;done=true;window.removeEventListener('message',on);if(!d.ok)N().toast(d.ro?'제작기가 읽기 전용으로 열려 있었어요 — 고친 것이 올라가지 않았을 수 있어요':'제작기 저장을 다 확인하지 못했어요 — 제작기에서 한 번 열어 확인해 주세요');fin()};
   window.addEventListener('message',on);
   try{f.contentWindow.postMessage({mkm:'flush'},'*')}catch(e){}
   setTimeout(()=>{if(done)return;window.removeEventListener('message',on);N().toast('제작기가 답하지 않아 그냥 닫았어요 — 저장이 늦을 수 있어요');fin()},12000)};
  bg.addEventListener('nt:close',()=>{if(!closing)setTimeout(reload,2500)})}
 async function reload(){try{await MK().load(true);N().render()}catch(e){}}
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-moned]');if(!b)return;e.preventDefault();const id=b.dataset.id||'';if(!canEd(id))return N().toast('이 시트는 고칠 수 없어요');open(id,b.dataset.moned||'',b.dataset.sec||'')});
 return {open,url};
})();
