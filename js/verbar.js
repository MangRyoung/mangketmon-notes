/* 10-30 망령 「세션 노트도 새 버전 업뎃되면 알림창 뜨게」: 제작기 verbar.js 와 같은 방식.
   올라온 index.html 의 ?v= 가 지금 읽은 파일과 다르면 위에 띠를 띄우고, 누르면 새로고침. 파일을 고치면 index.html 의 그 파일 ?v= 를 올려야 알림이 뜬다.
   확인: 처음 8초 뒤 · 탭으로 돌아올 때(1분에 한 번까지) · 5분마다(보고 있을 때) */
"use strict";
(()=>{
 const key=u=>u.replace(/^.*\/(?=[^/]+\?)/,'').replace(/\?.*?v=(\d+).*$/,'@$1');
 const HAVE=()=>[...document.scripts,...document.querySelectorAll('link[rel=stylesheet]')].map(s=>s.src||s.href||'').filter(u=>/[?&]v=\d+/.test(u)&&u.startsWith(location.origin)).map(key);
 let T=0,shown=false;
 async function check(force){if(shown||(!force&&Date.now()-T<60000))return;T=Date.now();
  try{const r=await fetch(location.pathname.replace(/[^/]*$/,'')+'index.html',{cache:'reload'});if(!r.ok)return;const t=await r.text();const have=new Set(HAVE());if(!have.size)return;
   const want=[...t.matchAll(/(?:src|href)="([^"]+\?v=\d+)"/g)].map(m=>m[1]).filter(u=>!/^https?:/.test(u)).map(key);
   if(want.some(w=>!have.has(w)))bar()}catch(e){}}
 function bar(){if(shown)return;shown=true;const d=document.createElement('button');d.id='ntVerbar';d.type='button';d.textContent='세션 노트 새 버전이 올라왔어요 · 눌러서 새로고침';
  d.style.cssText='position:fixed;left:50%;top:max(8px,env(safe-area-inset-top));transform:translateX(-50%);z-index:9999;background:#2b7;color:#fff;border:2px solid #000;box-shadow:3px 3px 0 #000;padding:7px 16px;font-size:13px;font-weight:700;border-radius:8px;cursor:pointer;max-width:calc(100vw - 32px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:inherit';
  d.onclick=()=>location.reload();document.body.appendChild(d)}
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
 window.addEventListener('pageshow',e=>{if(e.persisted)check(1)});
 setInterval(()=>{if(document.visibilityState==='visible')check()},300000);setTimeout(()=>check(1),8000);
 window.NT_VER={check,bar};
})();
