/* ---------- 한 장 요약 그림 · 디코로 (11-17 망령 「디코로 버튼은 다 만들고 세션 노트에도 요약 단추 있어야지」) ----------
   제작기 한 장 요약(maker.js cardPng · cardDc)과 같은 길:
   · PNG 저장 = html2canvas 로 카드를 찍고(바깥 24px 여백 · 테마 배경 · 아래 각주) 그림 파일로.
   · 디코로 = 그림(webp) → 저장소 oremas/dc/<방>/ → 웹툴 방의 om_dc_card (서버가 웹후크로 정해 둔 스레드에 보낸다).
     방 · 신분 = 이 캠페인에 이어 둔 웹툴 방 · 노트의 웹툴 신분(NT_PHONE). (supabase/patch_2026-11-02_게시판_디스코드.sql — 웹툴 저장소) */
"use strict";
window.NT_CARD=(()=>{
 const N=()=>window.NT;const toast=m=>{try{N().toast(m)}catch(e){}};const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const PROPS=['color','background-color','background-image','border-top-color','border-right-color','border-bottom-color','border-left-color','outline-color','text-decoration-color','box-shadow','text-shadow','fill','stroke'];
 const BAD=/color\(|oklch\(|oklab\(|\blab\(|\blch\(|color-mix\(/;
 function rgb(v){v=String(v).replace(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.e-]+%?))?\)/g,(_,r,g,b,a)=>`rgba(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)},${a==null?1:/%$/.test(a)?parseFloat(a)/100:+a})`);
  if(BAD.test(v)){let cx=null;try{cx=document.createElement('canvas').getContext('2d')}catch(e){}v=v.replace(/(color|oklch|oklab|lab|lch|color-mix)\((?:[^()]|\([^()]*\))*\)/g,m=>{if(!cx)return 'rgba(0,0,0,0)';cx.fillStyle='rgba(0,0,0,0)';cx.fillStyle=m;const f=String(cx.fillStyle);return /^(#|rgb)/.test(f)?f:'rgba(0,0,0,0)'})}return v}
 function fix(cdoc,root){const W=cdoc.defaultView;if(!W)return;for(const el of [root,...root.querySelectorAll('*')]){const cs=W.getComputedStyle(el);for(const p of PROPS){const v=cs.getPropertyValue(p);if(v&&BAD.test(v))el.style.setProperty(p,rgb(v),'important')}}}
 function bg(){const r=getComputedStyle(document.body);const v=(r.getPropertyValue('--bg')||'').trim()||r.backgroundColor||'#fff';return BAD.test(v)?rgb(v):v}
 async function load(){if(window.html2canvas)return;await new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';sc.onload=ok;sc.onerror=()=>no(new Error('html2canvas 를 불러오지 못했어요'));document.head.appendChild(sc)})}
 /* el = 카드. 감싼 부모째 찍고, 복제본에 여백 · 각주를 단다 */
 async function canvas(el,foot){await load();const B=bg();const wrap=el.parentNode;
  return window.html2canvas(wrap,{backgroundColor:B,scale:2,useCORS:true,width:wrap.clientWidth,height:el.offsetHeight+48+42,scrollX:0,scrollY:0,onclone:(cd,cw)=>{try{
   const ink=cd.defaultView?cd.defaultView.getComputedStyle(cw).color:'';cw.style.padding='24px';cw.style.boxSizing='border-box';cw.style.background=B;cw.style.overflow='visible';cw.style.maxHeight='none';cw.style.height='auto';
   const d=new Date();const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
   const f=cd.createElement('div');f.setAttribute('style',`margin-top:14px;padding-top:8px;border-top:1px solid rgba(127,127,127,.35);display:flex;justify-content:space-between;gap:12px;font-size:12px;opacity:.75;color:${ink||'inherit'}`);
   f.innerHTML=`<span>${esc(foot||'')}</span><span>망켓몬 세션 노트 · ${ds}</span>`;cw.appendChild(f);fix(cd,cw)}catch(e){}}})}
 async function png(el,file,foot){try{const cv=await canvas(el,foot);const a=document.createElement('a');a.download=String(file||'한장요약').replace(/[\\/:*?"<>|]/g,'_')+'.png';a.href=cv.toDataURL('image/png');a.click()}catch(err){toast('PNG 로 저장하지 못했어요 ('+err.message+')')}}
 let SB=null;const sb=()=>SB||(SB=window.supabase.createClient(window.NT_CONFIG.supabaseUrl,window.NT_CONFIG.supabaseKey,{auth:{persistSession:false}}));
 async function target(){const P=window.NT_PHONE;const room=P&&P.omRoom&&P.omRoom();if(!room)return null;try{await P.load(true)}catch(e){}const id=P.PH&&P.PH.id;return {room,secret:(id&&id.secret)||''}}
 /* o = {id, title, sub, who:{n,img}, foot} */
 async function dc(b,el,o){if(!b||b.disabled)return;const lab=b.textContent;b.disabled=true;b.textContent='방 찾는 중…';
  try{const tg=await target();if(!tg)throw new Error('이 캠페인에 웹툴 방이 이어져 있지 않아요 — 설정 탭 「세 도구 잇기 → 웹툴 방」');if(!tg.secret)throw new Error('이 브라우저는 그 웹툴 방에 앉은 적이 없어요 — 웹툴에서 GM 이나 자리로 한 번 들어와 주세요');
   b.textContent='그리는 중…';const cv=await canvas(el,o.foot);const blob=await new Promise(r=>cv.toBlob(r,'image/webp',.9));if(!blob)throw new Error('그림을 만들지 못했어요');
   b.textContent='올리는 중…';const S=sb();const path='dc/'+tg.room+'/'+String(o.id||'card').replace(/[^\w-]/g,'')+'_'+Date.now().toString(36)+'.webp';
   const up=await S.storage.from('oremas').upload(path,blob,{upsert:false,contentType:'image/webp',cacheControl:'31536000'});if(up.error)throw new Error('그림을 올리지 못했어요: '+up.error.message);
   const url=S.storage.from('oremas').getPublicUrl(path).data.publicUrl;b.textContent='보내는 중…';
   const r1=await S.rpc('om_dc_card',{p_room:tg.room,p_secret:tg.secret,p_title:o.title||'한 장 요약',p_sub:o.sub||'',p_img:url,p_who:o.who||{n:o.title||''}});
   if(r1.error){const m=r1.error.message||'';throw new Error(/PGRST202|Could not find the function/i.test(m+(r1.error.code||''))?'디스코드 연동 함수가 아직 없어요 — Supabase 에 웹툴 supabase/patch_2026-11-02_게시판_디스코드.sql 을 (다시) 실행해 주세요':m)}
   let r=null;for(let i=0;i<12;i++){await new Promise(z=>setTimeout(z,900));const q=await S.rpc('om_dc_card_result',{p_room:tg.room,p_secret:tg.secret,p_id:r1.data});if(q.error)break;r=q.data;if(r&&!r.wait)break}
   if(!r||r.wait)toast('디스코드로 보냈어요 (대답은 아직 — 디스코드에서 확인해 주세요)');
   else if(r.status>=200&&r.status<300)toast('디스코드에 올렸어요');
   else{let c=0,m='';try{const j=JSON.parse(r.body||'{}');c=j.code;m=j.message||''}catch(e){}toast('디스코드가 거절했어요 — '+(c===10003?'스레드를 찾지 못했어요 (웹툴 설정 「디스코드」에서 스레드 링크 다시)':c===10015?'웹후크가 없어요 (웹툴 설정 「디스코드」에서 다시 이어 주세요)':(r.error||m||('오류 '+r.status))))}}
  catch(err){toast(String((err&&err.message)||err))}
  b.disabled=false;b.textContent=lab}
 return {png,dc,canvas}})();
