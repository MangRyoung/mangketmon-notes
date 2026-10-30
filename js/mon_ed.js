/* ---------- 제작기로 고치기 (10-29 망령: 「포켓몬 고치기는 제작기 기능 참고해야지」) ----------
   노트 안에 제작기를 그대로 띄운다: 제작기 ?focus=<트레이너>&p=<포켓몬>&embed=1 = 그 트레이너 한 명만 펼치고 그 포켓몬 한 장만 보인다.
   능력치 · 프라이드 · 기술 소켓 · 포텐셜 · 상세 조정까지 제작기와 같은 화면이라 따로 계산을 두지 않는다.
   닫을 때 제작기에 {mkm:'flush'} 를 보내 공유 DB 에 다 올라간 것을 확인하고({mkm:'flushed'}) 노트가 제작기 문서를 다시 읽는다.
   10-30 망령 「미사그에서 아예 제작할 수 있도록 트레이너 추가, 포켓몬/각성체 추가」:
     NT_MONED.make('misag')           = 제작기 ?new=misag — 미사그 캠퍼스 폴더에 새 트레이너. 닫으면 노트에 PC 시트를 만들고 그 시트로 간다.
     NT_MONED.add(<트레이너>,'pl'|'aw') = 제작기 ?focus=&add= — PL 포켓몬 · 각성체 시트를 하나 더해 그 한 장을 연다.
     제작기는 만든 것을 {mkm:'made', kind:'trainer'|'poke', id, tid} 로 알려 준다. */
"use strict";
window.NT_MONED=(()=>{
 const N=()=>window.NT;const MK=()=>window.NT_MAKER;const {$,esc}=window.NT;
 const canEd=id=>N().gm()||N().me()===id;
 const base=()=>String((window.NT_CONFIG||{}).makerUrl||'').replace(/\/?$/,'/');
 /* 10-30: 브라우저가 들고 있는 옛 제작기 index.html(최대 10분) 대신 늘 새로 받게 끝에 시각을 붙인다 */
 const qs=o=>Object.entries(o).filter(([,v])=>v).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
 const url=(tid,pid,sec,x)=>base()+'?'+qs(Object.assign({focus:tid,p:pid,sec},x||{},{embed:'1',t:Date.now().toString(36)}));
 function frame(src,title,sub,onMade){
  const md=N().openModal(`<div class="mked-h"><b>${esc(title)}</b><span class="dim">${esc(sub||'')}</span><span class="sp"></span><a class="btn xs ghost" id="mkedN" href="${esc(src.replace(/&embed=1/,''))}" target="_blank" rel="noopener" title="제작기를 새 창에서 (다른 트레이너도 보고 싶을 때)">새 창 ↗</a><button type="button" class="btn xs pri" id="mkedX">저장하고 닫기</button></div>
   <div class="mked-b"><iframe id="mkedF" title="제작기" src="${esc(src)}"></iframe><div class="mked-w" id="mkedW" hidden>제작기에 저장하는 중…</div></div>`,'mked');
  const bg=md.parentElement;const f=$('#mkedF',md);let made=null,closing=false;
  /* 10-29 망령 「고친 게 없어도 고친 게 있다고 떠」: 바깥 누르기 · Esc 도 「저장하고 닫기」와 같은 길(제작기에 flush → 확인 뒤 닫기)로 보낸다. 실제로 안 올라간 게 없으면 제작기가 바로 답해 곧장 닫힌다 */
  bg.addEventListener('click',e=>{if(e.target===bg){e.stopImmediatePropagation();$('#mkedX',md).click()}},true);
  const esc_=e=>{if(e.key!=='Escape'||e.isComposing||!bg.isConnected)return;const L=document.querySelectorAll('.modalbg');if(L[L.length-1]!==bg)return;e.stopImmediatePropagation();e.preventDefault();$('#mkedX',md).click()};
  document.addEventListener('keydown',esc_,true);
  const onMsg=e=>{const d=e.data;if(!d||d.mkm!=='made'||e.source!==(f&&f.contentWindow))return;made=d;const n=$('#mkedN',md);
   if(n)n.href=d.kind==='poke'?base()+'?'+qs({focus:d.tid,p:d.id}):base()+'?'+qs({focus:d.id})};
  window.addEventListener('message',onMsg);
  const off=()=>{document.removeEventListener('keydown',esc_,true);window.removeEventListener('message',onMsg)};
  bg.addEventListener('nt:close',()=>{off();if(!closing)setTimeout(reload,2500)});
  const fin=async()=>{off();bg.remove();if(!$('.modalbg'))document.body.classList.remove('modal-open');await reload();if(made&&onMade)try{await onMade(made)}catch(e){N().toast('노트에 넣지 못했어요: '+(e.message||e))}};
  $('#mkedX',md).onclick=()=>{if(closing)return;closing=true;const w=$('#mkedW',md);w.hidden=false;
   let done=false;const on=e=>{const d=e.data;if(!d||d.mkm!=='flushed'||e.source!==(f&&f.contentWindow))return;done=true;window.removeEventListener('message',on);if(!d.ok)N().toast(d.ro?'제작기가 읽기 전용으로 열려 있었어요 — 고친 것이 올라가지 않았을 수 있어요':'제작기 저장을 다 확인하지 못했어요 — 제작기에서 한 번 열어 확인해 주세요');fin()};
   window.addEventListener('message',on);
   try{f.contentWindow.postMessage({mkm:'flush'},'*')}catch(e){}
   setTimeout(()=>{if(done)return;window.removeEventListener('message',on);N().toast('제작기가 답하지 않아 그냥 닫았어요 — 저장이 늦을 수 있어요');fin()},12000)};
  return md}
 function open(tid,pid,sec){   /* sec: 제작기에서 그 칸으로 (tord = 지시 체계) */const t=MK().trainer(tid);const m=pid&&MK().M.pokemon.find(p=>p.id===pid);
  return frame(url(tid,pid,sec),'제작기',`${(t&&t.name)||''}${m?' · '+(m.name||''):''}`)}
 /* PL 포켓몬(pl) · 각성체(aw) 한 장 더하기 */
 function add(tid,kind){if(!canEd(tid))return N().toast('이 시트는 고칠 수 없어요');const t=MK().trainer(tid);
  return frame(url(tid,'','',{add:kind==='aw'?'aw':'pl'}),kind==='aw'?'새 각성체':'새 PL 포켓몬',(t&&t.name)||'')}
 /* 새 트레이너 (미사그 캠퍼스 폴더) → 닫으면 PC 시트로 넣는다 */
 function make(kind){if(!N().gm())return N().toast('새 트레이너는 GM 만 만들 수 있어요');
  return frame(base()+'?'+qs({new:kind||'misag',embed:'1',t:Date.now().toString(36)}),'새 학생','미사그 캠퍼스 폴더에 만들어요 — 이름 · 자질 · 사진을 채우고 「저장하고 닫기」',
   async d=>{if(d.kind!=='trainer'||!d.id)return;const t=MK().trainer(d.id)||{name:d.name||'새 학생'};
    if(!N().data('pc',d.id))await N().put('pc',d.id,{name:t.name||'',image:t.image||'',player:'',sub:'',order:N().list('pc').length,log:[]},'pub');
    if(window.NT_PC)NT_PC.select('pc',d.id);N().toast('새 학생을 PC 시트로 넣었어요')})}
 async function reload(){try{await MK().load(true);N().render()}catch(e){}}
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-moned],[data-monadd],[data-monnew]');if(!b)return;e.preventDefault();
  if(b.dataset.monnew!=null)return make(b.dataset.monnew||'misag');
  const id=b.dataset.id||'';if(!canEd(id))return N().toast('이 시트는 고칠 수 없어요');
  if(b.dataset.monadd!=null)return add(id,b.dataset.monadd);
  open(id,b.dataset.moned||'',b.dataset.sec||'')});
 return {open,url,add,make};
})();
