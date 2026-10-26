/* ---------- 지구본 지도 (관측실) ----------
   maps 문서 kind:'globe' 인 지도는 그림 대신 지구본을 그린다 (칼데아스 관측실에서 옮겨 옴). 캠페인마다 있어야 하는 건 아니고, 쓰는 캠페인만 「지도 설정 → 종류: 지구본」.
   spots: x=경도(-180~180) · y=위도(-90~90) · num=특이점 번호(序 · I · EX …) · status cleared|active|unobserved · year · area=장소 · summary(줄마다 한 항목) · img(그 특이점 지도) · logf(기록 폴더 id)
   maps.slots: 번호 목록 (예: 序,I,II,…,VII). 공개된 장소가 없는 번호는 「미관측」 가림막으로 보인다 — GM만 장소는 PL 에게 가림막으로.
   GM 메모는 sec 'spot:<id>' (GM 에게만, 「GM 전용 · 미공개」 칸). */
"use strict";
window.NT_GLOBE=(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const RAD=Math.PI/180;
 const STL={cleared:'수복 완료',active:'진행 중',unobserved:'미관측'};
 const st={lon:20*RAD,lat:20*RAD,z:1,vlon:.06,anim:null,sel:null,dive:false,raf:0,cv:null,gw:null,hits:[],drag:false,dpr:1,R0:1,cx:0,cy:0,lt:0,last:0,items:[],col:{}};
 let LO=null,HI=null,GRAT=null;
 function prep(){if(LO)return;const raw=atob(window.NT_LAND||''),W=360,H=180;LO=[];HI=[];const land=(x,y)=>{const i=y*W+x;return (raw.charCodeAt(i>>3)>>(i&7))&1};
  for(let y=0;y<H;y++){const la=(89.5-y)*RAD,c=Math.cos(la),sp0=Math.sin(la);const step=Math.max(1,Math.round(1/Math.max(c,.06)));
   for(let x=0;x<W;x+=step){const L=land(x,y),lon=(-179.5+x)*RAD;if(L)HI.push([sp0,c,lon,1]);if(y%2===0&&(x/step)%2===0){if(L)LO.push([sp0,c,lon,1]);else if(y%4===0&&(x/step)%4===0)LO.push([sp0,c,lon,0])}}}
  GRAT=[];for(let g=-60;g<=60;g+=30){const a=[];for(let o=-180;o<=180;o+=4)a.push([g*RAD,o*RAD]);GRAT.push(a)}for(let o=-180;o<180;o+=30){const b=[];for(let g=-88;g<=88;g+=4)b.push([g*RAD,o*RAD]);GRAT.push(b)}}
 const readColors=()=>{const cs=getComputedStyle(st.gw);['land','sea','rim','grat','accent','amber','red','fg','muted'].forEach(k=>{st.col[k]=cs.getPropertyValue('--g-'+k).trim()||'#888'})};
 function size(){const cv=st.cv;if(!cv)return;st.dpr=Math.min(devicePixelRatio||1,2);{const g=st.gw.getBoundingClientRect();if(g.width&&Math.abs(g.height-g.width)>2)st.gw.style.height=g.width+'px'}const r=cv.getBoundingClientRect();cv.width=Math.round(r.width*st.dpr);cv.height=Math.round(r.height*st.dpr);st.cx=cv.width/2;st.cy=cv.height/2;st.R0=Math.min(st.cx,st.cy)*.78}
 function proj(la,lo){const sp=Math.sin(la),cp=Math.cos(la),d=lo-st.lon,cl=Math.cos(d),s0=Math.sin(st.lat),c0=Math.cos(st.lat),R=st.R0*st.z;return {z:s0*sp+c0*cp*cl,x:st.cx+R*cp*Math.sin(d),y:st.cy-R*(c0*sp-s0*cp*cl)}}
 function draw(t){const cv=st.cv;if(!cv||!cv.isConnected)return;const ctx=cv.getContext('2d'),col=st.col,dpr=st.dpr,cx=st.cx,cy=st.cy;if(cv.width>2)st.gw.classList.add('live');
  const R=st.R0*st.z;ctx.clearRect(0,0,cv.width,cv.height);ctx.save();ctx.beginPath();ctx.arc(cx,cy,Math.min(cx,cy)*.985,0,6.2832);ctx.clip();
  const gr=ctx.createRadialGradient(cx-R*.3,cy-R*.35,R*.1,cx,cy,R*1.05);gr.addColorStop(0,col.sea);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(cx,cy,R,0,6.2832);ctx.fill();ctx.strokeStyle=col.rim;ctx.lineWidth=1.3*dpr;ctx.stroke();
  ctx.strokeStyle=col.grat;ctx.lineWidth=1*dpr;GRAT.forEach(line=>{ctx.beginPath();let pen=false;line.forEach(p=>{const q=proj(p[0],p[1]);if(q.z>0){if(pen)ctx.lineTo(q.x,q.y);else{ctx.moveTo(q.x,q.y);pen=true}}else pen=false});ctx.stroke()});
  const pts=st.z<1.6?LO:HI,s=Math.max(1.3*dpr,R/(st.z<1.6?120:230));const s0=Math.sin(st.lat),c0=Math.cos(st.lat);
  for(let i=0;i<pts.length;i++){const p=pts[i];const d=p[2]-st.lon,cl=Math.cos(d);const qz=s0*p[0]+c0*p[1]*cl;if(qz<=0)continue;const qx=cx+R*p[1]*Math.sin(d),qy=cy-R*(c0*p[0]-s0*p[1]*cl);if(qx<-10||qy<-10||qx>cv.width+10||qy>cv.height+10)continue;
   ctx.globalAlpha=p[3]?(.35+.65*qz):.3*qz;ctx.fillStyle=p[3]?col.land:col.rim;const k=p[3]?s*(.6+.6*qz):s*.55;ctx.fillRect(qx-k/2,qy-k/2,k,k)}
  ctx.globalAlpha=1;if(st.z>1.05){ctx.strokeStyle=col.rim;ctx.lineWidth=1.5*dpr;ctx.beginPath();ctx.arc(cx,cy,Math.min(cx,cy)*.98,0,6.2832);ctx.stroke()}
  st.hits=[];
  for(const it of st.items){if(it.lat==null)continue;const q=proj(it.lat*RAD,it.lon*RAD);if(q.z<=.05)continue;const c=it.status==='cleared'?col.accent:it.status==='active'?col.amber:col.red,on=st.sel===it.id,ph=(((t/1100+it.lat/7)%1)+1)%1;
   ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=1.6*dpr;
   if(it.status!=='cleared'){ctx.globalAlpha=(1-ph)*q.z;ctx.beginPath();ctx.arc(q.x,q.y,(6+ph*16)*dpr,0,6.2832);ctx.stroke()}
   ctx.globalAlpha=q.z;ctx.beginPath();ctx.arc(q.x,q.y,(on?7:5)*dpr,0,6.2832);ctx.stroke();ctx.beginPath();ctx.arc(q.x,q.y,2.2*dpr,0,6.2832);ctx.fill();
   if(it.status==='unobserved'&&Math.random()<.08){ctx.globalAlpha=.6;ctx.fillRect(q.x-12*dpr,q.y+(Math.random()*10-5)*dpr,24*dpr,1.5*dpr)}
   ctx.globalAlpha=q.z;ctx.font='600 '+(12*dpr)+'px "Chakra Petch","IBM Plex Sans KR",sans-serif';ctx.textBaseline='middle';ctx.fillText(it.no||'',q.x+10*dpr,q.y-9*dpr);
   if(on||st.z>1.6){ctx.font='500 '+(11*dpr)+'px "IBM Plex Sans KR",sans-serif';ctx.fillStyle=col.fg;ctx.fillText(it.place||it.title||'',q.x+10*dpr,q.y+6*dpr)}
   if(it.hid){ctx.globalAlpha=.9;ctx.font=(11*dpr)+'px sans-serif';ctx.fillText('🔒',q.x-20*dpr,q.y-9*dpr)}
   ctx.globalAlpha=1;st.hits.push({id:it.id,x:q.x,y:q.y})}
  ctx.restore();const co=$('#gCoord');if(co)co.textContent=fmt(st.lat/RAD,'N','S')+' '+fmt(((st.lon/RAD+540)%360)-180,'E','W')+' · ×'+st.z.toFixed(1)}
 const fmt=(v,p,n)=>Math.abs(v).toFixed(1)+'°'+(v>=0?p:n);
 const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 function animTo(lat,lon,z,dur,extra){const l0=st.lon,d=(((lon-l0)%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI;st.anim={t0:performance.now(),dur,lon0:l0,lon1:l0+d+(extra||0),lat0:st.lat,lat1:lat,z0:st.z,z1:z};st.vlon=0}
 function loop(t){if(!st.cv||!st.cv.isConnected){st.raf=0;return}const dt=Math.min(100,t-(st.lt||t));st.lt=t;
  if(st.anim){const k=Math.min(1,(t-st.anim.t0)/st.anim.dur),e=ease(k);st.lon=st.anim.lon0+(st.anim.lon1-st.anim.lon0)*e;st.lat=st.anim.lat0+(st.anim.lat1-st.anim.lat0)*e;st.z=st.anim.z0+(st.anim.z1-st.anim.z0)*e;if(k>=1)st.anim=null}
  else if(!st.drag){st.lon+=dt/1000*(st.dive?.004:st.vlon);if(!st.dive)st.vlon+=(.06-st.vlon)*.02}
  if(st.cv.width<2||st.cv.height<2)size();if(!document.hidden&&(st.anim||st.drag||t-st.last>33)){draw(t);st.last=t}st.raf=requestAnimationFrame(loop)}
 /* ---- 자료 ---- */
 function items(m){const G=N().gm();const sp=N().list('spots').filter(s=>s.map===m.id);
  const real=sp.map(s=>({id:s.id,no:s.num||'',title:s.name||'',place:s.area||'',year:s.year||'',status:s.status||'active',label:s.label||'',lat:isFinite(+s.y)?+s.y:null,lon:isFinite(+s.x)?+s.x:null,pl:String(s.summary||'').split('\n').map(x=>x.trim()).filter(Boolean),img:s.img||'',logf:s.logf||'',hid:s._vis!=='pub',_s:s}));
  const slots=(m.slots||[]);const have=new Set(real.map(r=>r.no));const red=slots.filter(n=>!have.has(n)).map(n=>({id:'red:'+n,no:n,redacted:true,lat:null,lon:null,status:'unobserved'}));
  const ord=n=>{const i=slots.indexOf(n);return i<0?999:i};return real.concat(red).sort((a,b)=>ord(a.no)-ord(b.no)||String(a.no).localeCompare(String(b.no)))}
 /* ---- 그리기 ---- */
 function render(el,m){prep();const G=N().gm();const L=items(m);st.items=L.filter(x=>!x.redacted);if(st.sel&&!L.some(x=>x.id===st.sel))st.sel=null;
  const cur=st.sel?L.find(x=>x.id===st.sel):null;
  el.innerHTML=`<div class="toolbar"><h2>${esc(m.name||'관측실')}</h2>${N().MOD.map&&N().MOD.map.mapSelHtml?N().MOD.map.mapSelHtml(m):''}<span class="note">지구본 · 끌어서 회전 · 휠 확대 · 표시를 눌러 선택</span><span class="sp"></span>${G?`<button class="btn xs" data-g="addspot">＋ 특이점</button><button class="btn xs" data-m="mapedit">지도 설정</button><button class="btn xs ghost" data-m="newmap">＋ 지도</button>`:''}</div>
   <div class="globeview"><div class="gobs">
    <div class="gw ${st.dive?'dive':''}" id="gw"><canvas id="gcv" aria-label="지구본"></canvas>
     <svg class="lens" viewBox="0 0 400 400" fill="none" stroke="currentColor" aria-hidden="true"><g>${lens()}</g></svg>
     <div class="hud tl">OBSERVATION · <b>관측 중</b><br><span id="gCoord">—</span></div><div class="hud br">끌어서 회전 · 표시를 눌러 선택</div>
     <div class="zoom"><button type="button" data-g="zi" aria-label="확대">+</button><button type="button" data-g="zo" aria-label="축소">−</button></div>
     <button class="back" type="button" data-g="back">← 관측실로</button>
     <div class="title-ov" aria-hidden="true"><div class="n">${cur?esc(ovNo(cur)):''}</div><div class="t">${cur?(cur.redacted?'관측 불가':esc(cur.title)):''}</div></div></div>
    <aside class="gpanel"><ul class="glist">${L.map(it=>`<li><button type="button" data-g="sel" data-id="${esc(it.id)}" aria-current="${st.sel===it.id}">${it.redacted?`<span class="no">${esc(it.no)}</span><span class="tt"><b><span class="bar">■■■■■■■■</span></b><span>관측 불가</span></span><span class="st redacted">미관측</span>`:`<span class="no">${esc(it.no)}</span><span class="tt"><b>${esc(it.title)}${it.hid?' 🔒':''}</b><span>${esc([it.year,it.place].filter(Boolean).join(' · '))}</span></span><span class="st ${esc(it.status)}">${it.label||STL[it.status]||it.status}</span>`}</button></li>`).join('')||'<li class="dim small" style="padding:10px">특이점이 없어요.'+(G?' 「＋ 특이점」으로 넣어요.':'')+'</li>'}</ul>
     <section class="gdet" aria-live="polite">${cur?detail(cur):'<p class="none">지구본의 표시나 목록에서 특이점을 고르세요.</p>'}</section></aside></div></div>`;
  st.gw=$('#gw',el);st.cv=$('#gcv',el);readColors();size();draw(0);if(!st.raf)st.raf=requestAnimationFrame(loop);
  if(window.ResizeObserver){if(st.ro)st.ro.disconnect();st.ro=new ResizeObserver(()=>{if(st.gw&&st.gw.isConnected){size();draw(performance.now())}});st.ro.observe(st.gw)}
  bind(el,m)}
 const ovNo=it=>'SINGULARITY '+(it.no==='EX'?'EX · 사전 사건':it.no);
 function lens(n=16,r=186,size=13){let o='';for(let i=0;i<n;i++){const a=2*Math.PI*i/n,cx=200+r*Math.cos(a),cy=200+r*Math.sin(a);const pts=[0,1,2,3,4,5].map(k=>(cx+size*Math.cos(Math.PI/3*k+a)).toFixed(1)+','+(cy+size*Math.sin(Math.PI/3*k+a)).toFixed(1)).join(' ');o+=`<polygon points="${pts}" stroke-width=".9"/>`}return o+'<circle cx="200" cy="200" r="186" stroke-width=".4"/><circle cx="200" cy="200" r="170" stroke-width=".5" stroke-dasharray="2 6"/>'}
 function detail(it){const G=N().gm();let h=`<div class="k">${esc(ovNo(it))}</div>`;
  if(it.redacted)return h+`<h2><span class="bar">■■■■■■■■■■</span></h2><div class="meta"><span class="bar">■■■■</span> · <span class="bar">■■■■■■</span></div><p class="redline"><span class="bar">██████████████</span> <span class="bar">████████</span><br><span class="bar">██████████</span></p><p class="none">아직 관측되지 않았다. 관측되면 이곳에 기록된다.</p>${G?`<p class="small dim">GM: 이 번호(${esc(it.no)})의 특이점을 만들어 공개하면 가림막이 걷혀요.</p>`:''}`;
  const sec=G?N().data('sec','spot:'+it.id):null;
  h+=`<div class="row" style="gap:6px"><h2 style="flex:1">${esc(it.title)}</h2>${N().visBadge(it._s._vis)}${G?`<button class="btn xs" data-g="edit" data-id="${esc(it.id)}">고치기</button>`:''}</div><div class="meta">${esc([it.year,it.place].filter(Boolean).join(' · '))} · <span class="st ${esc(it.status)}">${it.label||STL[it.status]||it.status}</span> · ${fmt(it.lat,'N','S')} ${fmt(it.lon,'E','W')}</div>`;
  if(it.pl.length)h+=`<ul>${it.pl.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`;
  if(sec&&sec.t)h+=`<div class="conf"><div class="ck">GM 전용 · 미공개</div><div class="pre">${esc(sec.t)}</div></div>`;
  if(it.img)h+=`<div class="gmap"><img src="${esc(it.img)}" alt="${esc(it.title)} 지도" data-big="${esc(it.img)}"></div>`;
  const ents=N().list('ents').filter(e=>(e.at||[]).includes(it.id));if(ents.length)h+=`<h3>관련 인물 · 항목</h3><div class="row" style="gap:4px;flex-wrap:wrap">${ents.map(e=>`<button type="button" class="chip" data-ent="${esc(e.id)}">${esc(e.title)}</button>`).join('')}</div>`;
  const LG=N().MOD.logs;const logs=it.logf&&LG?LG.inFolder(it.logf):[];
  h+=`<h3>기록 · 레이시프트</h3>${logs.length?`<div class="glogs">${logs.map(l=>`<a href="${esc(LG.viewUrl(l.id))}" target="_blank" rel="noopener">${esc((l.meta&&l.meta.ep?l.meta.ep+' · ':'')+l.title)}</a>`).join('')}</div>`:`<p class="none">아직 남은 기록이 없다.${G&&!it.logf?' <span class="small">(고치기 → 기록 폴더를 고르면 그 폴더의 로그가 여기 붙어요)</span>':''}</p>`}`;
  return h}
 function pick(id,el){st.sel=id;const it=id?items(N().data('maps',(N().list('spots').find(s=>s.id===id)||{}).map)||curMapFor(el)).find(x=>x.id===id):null;
  if(!it){st.dive=false;animTo(20*RAD,st.lon,1,1100)}else if(it.redacted||it.lat==null){st.dive=false;animTo(st.lat,st.lon,1,1800,2*Math.PI)}else{st.dive=true;animTo(Math.max(-75,Math.min(75,it.lat))*RAD,it.lon*RAD,2.8,2000,2*Math.PI)}}
 function select(id,el){pick(id,el);N().render()}
 const curMapFor=()=>N().MOD.map&&N().MOD.map.curMap?N().MOD.map.curMap():null;
 function bind(el,m){const cv=st.cv;let sx,sy,slon,slat,moved,lastX,lastT;
  cv.addEventListener('pointerdown',e=>{st.drag=true;moved=false;cv.setPointerCapture(e.pointerId);cv.classList.add('drag');sx=e.clientX;sy=e.clientY;slon=st.lon;slat=st.lat;lastX=e.clientX;lastT=performance.now();st.anim=null});
  cv.addEventListener('pointermove',e=>{if(!st.drag)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.hypot(dx,dy)>4)moved=true;const R=st.R0*st.z/st.dpr;st.lon=slon-dx/R;st.lat=Math.max(-85*RAD,Math.min(85*RAD,slat+dy/R));const now=performance.now();st.vlon=-(e.clientX-lastX)/R/Math.max(.016,(now-lastT)/1000);lastX=e.clientX;lastT=now});
  cv.addEventListener('pointerup',e=>{st.drag=false;cv.classList.remove('drag');st.vlon=Math.max(-2,Math.min(2,st.vlon));if(moved)return;const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*st.dpr,y=(e.clientY-r.top)*st.dpr;let best=null,bd=22*st.dpr;st.hits.forEach(h=>{const d=Math.hypot(h.x-x,h.y-y);if(d<bd){bd=d;best=h}});
   if(best)select(best.id,el);else if(N().gm()&&e.shiftKey){const ll=unproj(x,y);if(ll)addSpot(m,ll)}});
  cv.addEventListener('pointercancel',()=>{st.drag=false});
  cv.addEventListener('wheel',e=>{e.preventDefault();st.anim=null;st.z=Math.max(.8,Math.min(3.2,st.z*(e.deltaY<0?1.12:1/1.12)))},{passive:false});
  el.addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b)return;const k=b.dataset.g,id=b.dataset.id;
   if(k==='zi')return animTo(st.lat,st.lon,Math.min(3.2,st.z*1.3),400);if(k==='zo')return animTo(st.lat,st.lon,Math.max(.8,st.z/1.3),400);
   if(k==='back')return select(null,el);if(k==='sel'){select(id,el);if(innerWidth<980)st.gw.scrollIntoView({behavior:'smooth',block:'start'});return}
   if(k==='edit')return N().MOD.map.editSpot(id);
   if(k==='addspot')return addSpot(m,{lat:st.lat/RAD,lon:((st.lon/RAD+540)%360)-180})})}
 function unproj(px,py){const R=st.R0*st.z;const x=(px-st.cx)/R,y=-(py-st.cy)/R;const r2=x*x+y*y;if(r2>1)return null;const z=Math.sqrt(1-r2);const s0=Math.sin(st.lat),c0=Math.cos(st.lat);const lat=Math.asin(z*s0+y*c0);const lon=st.lon+Math.atan2(x,z*c0-y*s0);return {lat:lat/RAD,lon:((lon/RAD+540)%360)-180}}
 async function addSpot(m,ll){const n=N().list('spots').filter(s=>s.map===m.id).length;const id=N().uid('s');const slots=m.slots||[];const used=new Set(N().list('spots').filter(s=>s.map===m.id).map(s=>s.num));const no=slots.find(x=>!used.has(x))||String(n+1);
  const ok=await N().put('spots',id,{map:m.id,x:+ll.lon.toFixed(2),y:+ll.lat.toFixed(2),name:'새 특이점',num:no,kind:'사건',area:'',summary:'',items:'',img:'',imgs:[],status:'active',year:'',logf:''},'gm');if(ok){st.sel=id;N().MOD.map.editSpot(id)}}
 return {render,select,pick,items};
})();
