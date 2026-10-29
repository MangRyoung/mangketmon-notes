/* ---------- 던전 (10-29 망령 「지도에 설정한 지점 중 하나에 시뮬레이터에서 던전 불러오고 편집하고 이미지 넣고」) ----------
   문서 kind 'dgs' (처음엔 GM만). 웹툴 던전 탭과 같은 꼴 {n,st,r:{방 id:{n,t,x,y,m,b,sk,rk,cl,e}},l:{'a~b':1},o,a,wn} 에 노트 몫 {spot, bg, hide[], src} 을 더한다.
   좌표는 웹툴 편집기 판(1000×640) 그대로라 오가도 자리가 바뀌지 않는다. 방 그림 b = 웹툴의 방 배경 그림.
   가져오기: 시뮬레이터 저장 던전(oremas/sim/data/dungeons/*.json · 목록은 GitHub API, 내용은 Pages) · 그 파일 · 웹툴 「JSON 내보내기」 글.
   웹툴로: 「🎲 웹툴로」 = 이어 둔 웹툴 방을 #r=…&dg=<id> 로 연다. 웹툴은 노트에서 이 문서 하나만 받아, 지난번과 달라졌을 때만 덮어쓴다.
   웹툴에서 고친 던전은 웹툴 📓 메뉴 「던전을 노트로」로 돌아온다 (그때도 바뀐 던전만 쓴다). */
"use strict";
window.NT_DG=(()=>{
 const N=()=>window.NT;const esc=s=>N().esc(s);
 const TY={entry:['입구','⛩','#59b6ff'],room:['통로','◇','#8fa3bf'],battle:['조우 구역','☠','#ff4d5e'],trap:['함정·기믹','⚙','#ffa53a'],puzzle:['수수께끼','✦','#c58bff'],treasure:['보물','◆','#ffd84a'],safe:['세이프룸','☗','#3ee0a1'],boss:['심층부','♛','#ff2a6d']};
 const ty=t=>TY[t]||TY.room;
 const RK={long:'긴 휴식',mid:'중간 휴식',short:'짧은 휴식',breath:'숨돌리기'};
 const W=1000,H=640;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const lk=(a,b)=>[a,b].sort().join('~');
 const rid=()=>'r'+Math.random().toString(36).slice(2,7);
 const all=()=>N().list('dgs');
 const at=spot=>all().filter(d=>d.spot===spot).sort((a,b)=>String(a.n||'').localeCompare(String(b.n||''),'ko'));
 const has=spot=>all().some(d=>d.spot===spot);
 const spotName=id=>{const s=id&&N().data('spots',id);return s?s.name||'':''};
 const omRoom=()=>(((N().ST.campInfo||{}).data||{}).om||{}).room||'';
 const omBase=()=>String((window.NT_CONFIG||{}).oremasUrl||'https://mangryoung.github.io/oremas/').replace(/[#?].*$/,'').replace(/index\.html$/,'').replace(/\/?$/,'/');
 const omHref=id=>window.NT_LINK&&omRoom()?NT_LINK.omUrl(omRoom())+'&dg='+encodeURIComponent(id):'';

 /* ----- 미리 보기 (장소 칸 · 목록) ----- */
 function mini(d,cls){const R=d.r||{};const hide=new Set(d.hide||[]);const G=N().gm();const vis=id=>G||!hide.has(id);
  const ls=Object.keys(d.l||{}).map(k=>k.split('~')).filter(([a,b])=>R[a]&&R[b]&&vis(a)&&vis(b));
  return `<svg class="${cls||'dgmini'}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${ls.map(([a,b])=>`<line x1="${R[a].x}" y1="${R[a].y}" x2="${R[b].x}" y2="${R[b].y}"/>`).join('')}${Object.entries(R).filter(([id])=>vis(id)).map(([id,r])=>`<circle cx="${r.x}" cy="${r.y}" r="${id===d.st?30:22}" fill="${ty(r.t)[2]}"/>`).join('')}</svg>`}
 function card(d){const n=Object.keys(d.r||{}).length;const imgs=Object.values(d.r||{}).filter(r=>r.b).length;
  return `<button type="button" class="dgcard" data-dgo="${esc(d.id)}">${d.bg?`<span class="dgbg" style="background-image:url('${N().cssu(d.bg)}')"></span>`:''}${mini(d)}<span class="dgcap"><b>⛩ ${esc(d.n||'이름 없는 던전')}</b><small>방 ${n}${imgs?' · 그림 '+imgs:''}${d.a?' · '+esc(d.a):''}</small></span>${N().visBadge(d._vis)}</button>`}
 function spotSec(sid){const G=N().gm();const L=at(sid);if(!L.length&&!G)return '';
  return `<div class="sec">던전${G?` <button type="button" class="btn xs ghost" data-dgnew="${esc(sid)}" title="시뮬레이터에서 불러오거나 새로 그려요">＋ 던전</button>`:''}</div>${L.length?`<div class="dglist">${L.map(card).join('')}</div>`:'<div class="small dim">아직 붙은 던전이 없어요. 시뮬레이터에서 불러오거나 새로 그려요.</div>'}`}
 const pinMark=sid=>has(sid)?'<u class="pdg" title="던전">⛩</u>':'';

 /* ----- 시뮬레이터 던전 → 웹툴 꼴 (시뮬 lib/autogen.js toWebtool 을 줄여 옮김) ----- */
 const BASEN=['HP','공격','방어','특공','특방','스피드'],BASE_OF={지시:3,육성:1,통솔:4,능력:3};
 function up(ck){ck=Object.assign({},ck||{});if(+ck.v>=4)return ck;const T3={5:8,7:10,9:12,11:15};ck.target=T3[+ck.target]||(+ck.target||7)+3;ck.pm=+ck.step?(+ck.step>0?1:-1):0;delete ck.step;
  if(ck.base==null)ck.base=BASE_OF[ck.stat]??3;if(!ck.fit){const h=String(ck.hint||'');ck.fit={types:h.startsWith('type:')?[h.slice(5)]:[],moves:[],abil:[]}}ck.v=4;return ck}
 const STK={Paralysis:'마비',Poison:'독',Confusion:'혼란',Burn:'화상',Sleep:'잠듦'};
 const PEN=p=>{if(!p)return '';const L=[];if(p.al)L.push('경계도 '+(p.al>0?'+':'−')+Math.abs(p.al));if(p.dmg)L.push('HP −'+p.dmg);if(p.st)L.push('상태 '+(STK[p.st]||p.st)+(+p.cnt>0?' '+p.cnt+'턴':''));if(p.oo)L.push('다음 배틀 4식 −'+p.oo);if(p.oc)L.push('다음 배틀 6령 −'+p.oc);if(p.rk)L.push('랭크 '+Object.entries(p.rk).map(([k,v])=>k+(v>0?'+':'')+v).join(' '));if(p.memo)L.push(p.memo);return L.join(' · ')};
 const THEME_A={폐가:'안개 · 폐가',동굴:'어둠 · 동굴',숲:'안개 · 숲',연구소:'폐허 · 연구소',유적:'고대 · 유적',바다:'파도 · 바다',화산:'열기 · 화산',설원:'눈보라 · 설원'};
 const TN={8:'쉬움',10:'보통',12:'어려움',15:'매우 어려움'};
 function fromSim(dg,wild){wild=wild||{};const rs=dg.rooms||[];const M=dg.map;const R={},L={};const used=new Set();
  const idOf={};rs.forEach(x=>{let id=String(x.id||'').replace(/[^\w]/g,'').slice(0,8);if(!id||used.has(id)){do id=rid();while(used.has(id))}used.add(id);idOf[x.id]=id});
  const nm=m=>m.sp?[m.sp]:m.db?[wild[m.db]||m.db]:(m.pick||[]).map(i=>`${m.trainer||'?'} #${i}`);
  rs.forEach((x,i)=>{const row=Math.floor(i/4),col=i%4,c=row%2?3-col:col;const cell=M&&M.cells&&M.cells[x.id];
   const o={n:String(x.name||'방 '+(i+1)).slice(0,40),t:TY[x.t]?x.t:'room',x:clamp(Math.round(cell?M.grid.x0+cell[0]*M.grid.dx:110+c*200),30,970),y:clamp(Math.round(cell?M.grid.y0+cell[1]*M.grid.dy:140+row*180),30,600)};const memo=[];if(x.memo)memo.push(x.memo);
   if(x.check){const c0=x.check,u=up(c0);o.sk={v:4,label:c0.label,stat:c0.stat,base:u.base,scene:'field',target:+u.target,fit:u.fit,name:c0.label};if(dg.gen&&dg.gen.tier)o.sk.auto=dg.gen.tier;if(u.pm)o.sk.pm=u.pm;if(c0.twice)o.sk.twice=c0.twice;o.sk.pen={fail:Object.assign({},c0.pen&&c0.pen.fail)};if(c0.noStep)o.sk.noStep=1;
    const ft=(u.fit&&u.fit.types)||[];memo.push(`🎲 ${c0.stat} + ${BASEN[u.base]||''} · ${TN[+u.target]||''} ${u.target} · 적합 ${ft.length?'타입 '+ft.join('/'):'아무 포켓몬'}`);memo.push(`  실패: 트레이너 상태 한 단계${c0.noStep?' 없음':''} · ${PEN(c0.pen&&c0.pen.fail)}`);if(c0.gainCrit)memo.push(`  대성공: ${PEN(c0.gainCrit)}`);if(c0.reward)memo.push(`  보상: ${c0.reward}`)}
   if(x.enc&&x.enc.mix){const mons=x.enc.mix.flatMap(nm);const lv=+x.enc.lvAdd||0;const ru=dg.rules||{};
    memo.push(`${x.enc.boss?'♛ 보스방':'⚔ 야생'} ${mons.length}체 · Lv ${lv>=0?'+':''}${lv} (경계도 30↑ +${ru.al30||5} · 70↑ +${ru.al70||10})`);
    memo.push('  '+mons.map((n,j)=>x.enc.boss&&j===(+x.enc.bossAt||0)?`★${n}『와일드 보스』${x.enc.raid?' 「레이드 배틀 : '+x.enc.raid+'」':''}`:`${n}『와일드』`).join(' · '));if(!x.enc.boss&&ru.alBattle)memo.push(`  배틀이 끝나면 경계도 +${ru.alBattle}`)}
   if(x.rest&&RK[x.rest])o.rk=x.rest;if(x.clue)o.cl={t:String(x.clue.t||''),d:String(x.clue.d||'')};if(memo.length)o.m=memo.join('\n').slice(0,1200);R[idOf[x.id]]=o;
   if(!M&&i)L[lk(idOf[rs[i-1].id],idOf[x.id])]=1});
  if(M&&M.links)for(const k of Object.keys(M.links)){const [a,b]=k.split('~').map(z=>idOf[z]);if(a&&b&&a!==b)L[lk(a,b)]=1}
  const st=idOf[(rs.find(x=>x.t==='entry')||rs[0]||{}).id]||Object.keys(R)[0];
  return {n:String(dg.name||'시뮬레이터 던전').slice(0,60),o:dg.owner?`(자동 생성) ${dg.owner}`:'',a:THEME_A[dg.theme]||dg.theme||'',wn:dg.wn||2,st,r:R,l:L,src:{from:'sim',id:dg.id||'',tier:(dg.gen||{}).tier||'',seed:(dg.gen||{}).seed||'',theme:dg.theme||'',note:String(dg.note||'').slice(0,300)}}}
 /* 웹툴 꼴(r · l) 은 칸만 걸러 그대로 */
 const RF=['n','t','x','y','m','b','sk','rk','rmany','cl','e','eh'];
 function fromOm(j){const R={};for(const [k,x] of Object.entries(j.r||{})){const id=String(k).replace(/[^A-Za-z0-9_]/g,'').slice(0,12)||rid();const o={};for(const f of RF)if(x[f]!=null&&x[f]!=='')o[f]=x[f];o.n=String(o.n||'방').slice(0,40);o.t=TY[o.t]?o.t:'room';o.x=clamp(Math.round(+o.x||110),30,970);o.y=clamp(Math.round(+o.y||80),30,600);R[id]=o}
  const L={};for(const k of Object.keys(j.l||{})){const [a,b]=String(k).split('~');if(R[a]&&R[b]&&a!==b)L[lk(a,b)]=1}
  const o={n:String(j.n||'가져온 던전').slice(0,60),st:R[j.st]?j.st:(Object.keys(R).find(id=>R[id].t==='entry')||Object.keys(R)[0]),r:R,l:L,src:{from:'json'}};for(const f of ['o','a','wn','noal'])if(j[f]!=null&&j[f]!=='')o[f]=j[f];if(j.gen)o.src=Object.assign(o.src,{tier:j.gen.tier||'',seed:j.gen.seed||'',theme:j.gen.theme||''});return o}
 async function fromAny(txt,wild){let j;try{j=JSON.parse(String(txt||'').trim())}catch(e){throw new Error('JSON 을 읽지 못했어요 — '+e.message)}
  const L=Array.isArray(j)?j:(j&&Array.isArray(j.dungeons)?j.dungeons:[j]);const out=[];
  for(const x of L){if(!x||typeof x!=='object')continue;if(Array.isArray(x.rooms)){out.push(fromSim(x,wild||await wildNames()))}else if(x.r&&typeof x.r==='object')out.push(fromOm(x))}
  if(!out.length)throw new Error('던전을 찾지 못했어요 (시뮬레이터 저장 던전이나 웹툴 「JSON 내보내기」 글이어야 해요)');return out}

 /* ----- 시뮬레이터 저장 던전 목록 ----- */
 const SIM={list:null,at:0,wild:null};
 async function wildNames(){if(SIM.wild)return SIM.wild;try{const j=await (await fetch(omBase()+'sim/data/wild/db.json',{cache:'force-cache'})).json();SIM.wild=Object.fromEntries((j.entries||[]).map(e=>[e.id,e.sp||e.name||e.id]))}catch(e){SIM.wild={}}return SIM.wild}
 async function simList(force){if(!force&&SIM.list&&Date.now()-SIM.at<600000)return SIM.list;
  const r=await fetch('https://api.github.com/repos/MangRyoung/oremas/contents/sim/data/dungeons',{headers:{Accept:'application/vnd.github+json'}});if(!r.ok)throw new Error(r.status===403?'GitHub 이 잠시 막았어요 (한 시간 60번 제한) — 파일로 올려 주세요':'목록을 받지 못했어요 ('+r.status+')');
  const files=(await r.json()).filter(f=>f.type==='file'&&/\.json$/.test(f.name)).slice(0,60);
  const L=await Promise.all(files.map(async f=>{try{const d=await (await fetch(omBase()+'sim/data/dungeons/'+encodeURIComponent(f.name))).json();return {file:f.name,d}}catch(e){return null}}));
  SIM.list=L.filter(x=>x&&x.d&&Array.isArray(x.d.rooms));SIM.at=Date.now();return SIM.list}
 const TIER={easy:'쉬움',normal:'보통',hard:'어려움',vhard:'아주 어려움'};

 /* ----- 새 던전 ----- */
 async function create(spot,d){const id=N().uid('d');const o=Object.assign({spot:spot||''},d);if(!N().gm())return;if(!await N().put('dgs',id,o,'gm'))return;N().toast(`던전 「${o.n||''}」 를 붙였어요`);openEd(id)}
 function blank(){const a=rid(),b=rid();return {n:'새 던전',st:a,r:{[a]:{n:'입구',t:'entry',x:120,y:520},[b]:{n:'심층부',t:'boss',x:860,y:150}},l:{[lk(a,b)]:1},src:{from:'new'}}}
 function newFor(spot){if(!N().gm())return;const m=N().openModal(`<div class="mhead"><h2>⛩ 「${esc(spotName(spot)||'장소')}」 에 던전 붙이기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="dgnew"><button type="button" class="dgopt" data-k="sim"><b>🧪 시뮬레이터에서</b><small>시뮬레이터에 저장한 던전(oremas/sim/data/dungeons)을 골라요. 방 · 통로 · 체크 · 야생이 그대로 들어와요.</small></button>
   <button type="button" class="dgopt" data-k="file"><b>📄 파일 · 붙여넣기</b><small>시뮬레이터 던전 파일, 「자동 생성 → 웹툴로」 파일, 웹툴 「JSON 내보내기」 글.</small></button>
   <button type="button" class="dgopt" data-k="blank"><b>✏ 빈 던전</b><small>입구와 심층부만 놓고 시작해요.</small></button>
   ${all().filter(d=>d.spot!==spot).length?`<button type="button" class="dgopt" data-k="move"><b>↪ 다른 던전 옮겨 오기</b><small>다른 장소나 장소 없이 둔 던전을 여기로 붙여요.</small></button>`:''}</div><div id="dgNewBody"></div>`,'wide');
  m.addEventListener('click',async e=>{const b=e.target.closest('.dgopt');if(!b)return;m.querySelectorAll('.dgopt').forEach(x=>x.classList.toggle('on',x===b));const box=m.querySelector('#dgNewBody');const k=b.dataset.k;
   if(k==='blank'){N().closeModal();return create(spot,blank())}
   if(k==='move'){box.innerHTML=`<div class="dgpick">${all().filter(d=>d.spot!==spot).map(d=>`<button type="button" class="dgcard" data-mv="${esc(d.id)}">${mini(d)}<span class="dgcap"><b>⛩ ${esc(d.n||'')}</b><small>${d.spot?'지금: '+esc(spotName(d.spot)||'?'):'장소 없음'}</small></span></button>`).join('')}</div>`;
    box.onclick=async ev=>{const c=ev.target.closest('[data-mv]');if(!c)return;await N().patch('dgs',c.dataset.mv,x=>{x.spot=spot});N().closeModal();N().toast('옮겨 붙였어요')};return}
   if(k==='file'){box.innerHTML=`<div class="dgfile"><div class="dgdrop" id="dgDrop">여기에 .json 파일을 끌어 놓거나 눌러서 골라요<input type="file" accept=".json,application/json,text/plain" multiple hidden></div><textarea id="dgTxt" rows="6" data-nodirty placeholder="또는 JSON 글을 붙여 넣어요"></textarea><div class="row" style="justify-content:flex-end;margin-top:8px"><button type="button" class="btn pri" id="dgGo">가져오기</button></div></div>`;
    const go=async txts=>{try{const L=[];for(const t of txts)L.push(...await fromAny(t));N().closeModal();for(const d of L.slice(0,10))await create(spot,d)}catch(err){N().toast(err.message)}};
    N().bindDrop(box.querySelector('#dgDrop'),async fs=>go(await Promise.all([...fs].map(f=>f.text()))),true,'.json,application/json,text/plain');box.querySelector('#dgGo').onclick=()=>go([box.querySelector('#dgTxt').value]);return}
   if(k==='sim'){box.innerHTML='<div class="small dim" style="padding:10px 2px">시뮬레이터 던전 목록을 받는 중…</div>';
    try{const [L,wild]=await Promise.all([simList(),wildNames()]);if(!box.isConnected)return;
     box.innerHTML=L.length?`<div class="dgpick">${L.map((x,i)=>{const d=fromSim(x.d,wild);return `<button type="button" class="dgcard" data-sim="${i}">${mini(d)}<span class="dgcap"><b>${esc(x.d.name||x.file)}</b><small>${esc(TIER[(x.d.gen||{}).tier]||'')}${x.d.theme?' · '+esc(x.d.theme):''} · 방 ${x.d.rooms.length}${x.d.owner?' · 주인 '+esc(x.d.owner):''}</small></span></button>`}).join('')}</div><div class="small dim" style="margin-top:6px">시뮬레이터에서 저장하고 저장소에 올린 던전만 보여요. 아직 안 올린 던전은 「파일 · 붙여넣기」로 그 파일을 넣어요.</div>`:'<div class="small dim">올라간 시뮬레이터 던전이 없어요.</div>';
     box.onclick=async ev=>{const c=ev.target.closest('[data-sim]');if(!c)return;const x=L[+c.dataset.sim];const d=fromSim(x.d,wild);d.src.file=x.file;N().closeModal();await create(spot,d)}}
    catch(err){box.innerHTML=`<div class="small" style="color:var(--yel)">${esc(err.message)}</div>`}}});}

 /* ----- 편집기 · 보기 ----- */
 const E={id:'',d:null,sel:'',mode:'move',t:0,m:null};
 const R=()=>(E.d&&E.d.r)||{};
 const canEd=()=>N().gm();
 function save(now){if(!canEd())return;clearTimeout(E.t);const id=E.id,d=JSON.parse(JSON.stringify(E.d));const go=()=>N().put('dgs',id,d);if(now)return go();E.t=setTimeout(go,500)}
 function openEd(id){const d=N().data('dgs',id);if(!d)return N().toast('던전을 찾지 못했어요');E.id=id;E.d=JSON.parse(JSON.stringify(d));E.d.r=E.d.r||{};E.d.l=E.d.l||{};E.sel='';E.mode='move';
  const G=canEd();const vis=(N().doc('dgs',id)||{}).vis||'gm';
  E.m=N().openModal(`<div data-nodirty class="dged ${G?'gm':'pl'}"><div class="mhead dghead">${G?`<input class="dgname" data-df="n" value="${esc(E.d.n||'')}" placeholder="던전 이름">`:`<h2>⛩ ${esc(E.d.n||'던전')}</h2>`}
   <span class="sp"></span>${G?`${N().visSelect(vis,'dgVis',{})}${omHref(id)?`<a class="btn sm" href="${esc(omHref(id))}" target="oremas" rel="noopener" title="이어 둔 웹툴 방의 던전 탭으로 보내요. 웹툴에 같은 던전이 있으면 바뀐 때만 덮어써요">🎲 웹툴로</a>`:`<span class="small dim" title="설정 탭 「세 도구 잇기」에서 웹툴 방을 이어 두면 바로 보낼 수 있어요">웹툴 방 없음</span>`}<button type="button" class="btn sm ghost" data-de="json" title="웹툴 「JSON 가져오기」에 붙여 넣을 글">JSON</button><button type="button" class="btn sm ghost danger" data-de="del" title="던전 지우기">🗑</button>`:''}<button class="btn ghost" data-x>닫기</button></div>
   ${G?`<div class="dgtools"><button type="button" class="btn xs" data-de="add">＋ 방</button><span class="seg"><button type="button" data-de="m:move" class="on">✋ 옮기기</button><button type="button" data-de="m:link">🔗 잇기</button></span><label class="btn xs ghost">🖼 판 그림<input type="file" accept="image/*" data-dimg="bg" hidden style="display:none"></label>${E.d.bg?'<button type="button" class="btn xs ghost" data-de="bgdel">판 그림 빼기</button>':''}<span class="small dim dghelp">방을 끌어 옮겨요 · 방 오른쪽 점을 끌어 다른 방에 놓으면 통로 · 선을 누르면 통로 지우기</span></div>`:''}
   <div class="dgwrap"><div class="dgcs"><div class="dgc" id="dgC"></div></div><aside class="dgp" id="dgP"></aside></div></div>`,'wide dgm');
  draw();bind()}
 function nodeHTML(id,r){const t=ty(r.t);const hid=(E.d.hide||[]).includes(id);
  return `<div class="dgn ${id===E.sel?'on':''} ${hid?'hid':''} ${id===E.d.st?'st':''}" data-n="${esc(id)}" style="left:${r.x/W*100}%;top:${r.y/H*100}%;--c:${t[2]}">${r.b?`<span class="dgth" style="background-image:url('${N().cssu(r.b)}')"></span>`:''}<i>${t[1]}</i><b>${esc(r.n||'')}</b>${canEd()?'<em class="dgport" title="끌어서 다른 방과 잇기"></em>':''}</div>`}
 function linesSVG(){const r=R();const G=canEd();const hide=new Set(E.d.hide||[]);const ok=id=>G||!hide.has(id);
  return Object.keys(E.d.l).map(k=>{const [a,b]=k.split('~');if(!r[a]||!r[b]||!ok(a)||!ok(b))return '';return `<g class="${E.sel==='l:'+k?'on':''}"><line x1="${r[a].x}" y1="${r[a].y}" x2="${r[b].x}" y2="${r[b].y}"/>${G?`<line class="hit" data-l="${esc(k)}" x1="${r[a].x}" y1="${r[a].y}" x2="${r[b].x}" y2="${r[b].y}"/>`:''}</g>`}).join('')+'<line id="dgTmp" class="tmp" x1="0" y1="0" x2="0" y2="0" style="display:none"/>'}
 function draw(){const c=E.m&&E.m.querySelector('#dgC');if(!c)return;const G=canEd();const hide=new Set(E.d.hide||[]);
  c.style.backgroundImage=E.d.bg?`url('${N().cssu(E.d.bg)}')`:'';c.classList.toggle('hasbg',!!E.d.bg);c.classList.toggle('linking',E.mode==='link');
  c.innerHTML=`<svg class="dgl" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${linesSVG()}</svg>${Object.entries(R()).filter(([id])=>G||!hide.has(id)).map(([id,r])=>nodeHTML(id,r)).join('')}`;panel()}
 function lines(){const s=E.m&&E.m.querySelector('#dgC .dgl');if(s)s.innerHTML=linesSVG()}
 function skLine(sk){if(!sk)return '';return `🎲 ${esc(sk.label||sk.name||'체크')} · ${esc(sk.stat||'')} · 목표 ${esc(sk.target||'')}${sk.fit&&sk.fit.types&&sk.fit.types.length?' · 적합 '+esc(sk.fit.types.join('/')):''}`}
 function panel(){const p=E.m&&E.m.querySelector('#dgP');if(!p)return;const G=canEd();const r=R()[E.sel];
  if(E.sel.startsWith('l:')){const [a,b]=E.sel.slice(2).split('~');p.innerHTML=`<h3>통로</h3><p>${esc((R()[a]||{}).n||'?')} ↔ ${esc((R()[b]||{}).n||'?')}</p><button type="button" class="btn sm danger" data-de="ldel">이 통로 지우기</button> <button type="button" class="btn sm ghost" data-de="desel">닫기</button>`;return}
  if(r&&G){const t=ty(r.t);const hid=(E.d.hide||[]).includes(E.sel);
   p.innerHTML=`<div class="row" style="gap:6px"><b style="color:${t[2]}">${t[1]} ${esc(t[0])}</b><span class="sp"></span><button type="button" class="btn xs ghost" data-de="desel">← 던전</button></div>
    <label>이름<input data-rf="n" value="${esc(r.n||'')}" maxlength="40"></label>
    <label>종류<select data-rf="t">${Object.entries(TY).map(([k,v])=>`<option value="${k}" ${k===r.t?'selected':''}>${v[1]} ${v[0]}</option>`).join('')}</select></label>
    <div class="dgimg" id="dgImg">${r.b?`<img src="${esc(r.b)}" alt="">`:'<span>🖼 방 그림을 끌어 놓거나 눌러서 올려요<br><small>웹툴에서 이 방에 들어가면 배경으로 떠요</small></span>'}<input type="file" accept="image/*" hidden></div>
    <div class="row" style="gap:6px;margin-top:4px">${r.b?'<button type="button" class="btn xs ghost" data-de="imgdel">그림 빼기</button>':''}<input data-rf="b" value="${esc(r.b||'')}" placeholder="또는 그림 주소 https://…" style="flex:1;min-width:0"></div>
    <label>GM 메모<textarea data-rf="m" rows="6">${esc(r.m||'')}</textarea></label>
    ${r.sk?`<div class="dgsk small">${skLine(r.sk)}<br><span class="dim">체크 칸은 웹툴 던전 탭에서 고쳐요</span></div>`:''}
    <label>단서 제목<input data-rf="cl.t" value="${esc((r.cl||{}).t||'')}" placeholder="보물 · 단서 방에서 보여 줄 것"></label><label>단서 내용<textarea data-rf="cl.d" rows="3">${esc((r.cl||{}).d||'')}</textarea></label>
    <label>휴식<select data-rf="rk"><option value="">없음</option>${Object.entries(RK).map(([k,v])=>`<option value="${k}" ${k===r.rk?'selected':''}>${v}</option>`).join('')}</select></label>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn xs" data-de="start" ${E.d.st===E.sel?'disabled':''}>${E.d.st===E.sel?'★ 시작 방':'시작 방으로'}</button><button type="button" class="btn xs ${hid?'pri':'ghost'}" data-de="hide" title="공개한 던전이라도 PL 미리 보기에서 이 방을 숨겨요">${hid?'🙈 PL 에게 숨김':'PL 에게 숨기기'}</button><span class="sp"></span><button type="button" class="btn xs ghost danger" data-de="rdel">방 지우기</button></div>`;
   N().bindDrop(p.querySelector('#dgImg'),fs=>upImg(fs[0],'room'),false,'image/*');return}
  if(r){const t=ty(r.t);p.innerHTML=`<div class="row"><b style="color:${t[2]}">${t[1]} ${esc(t[0])}</b><span class="sp"></span><button type="button" class="btn xs ghost" data-de="desel">←</button></div><h3>${esc(r.n||'')}</h3>${r.b?`<img class="dgpimg" src="${esc(r.b)}" alt="" data-big="${esc(r.b)}">`:''}${r.cl&&(r.cl.t||r.cl.d)?`<div class="dgclue"><b>${esc(r.cl.t||'단서')}</b><div class="pre">${esc(r.cl.d||'')}</div></div>`:''}`;return}
  const n=Object.keys(R()).length,nl=Object.keys(E.d.l).length,sp=E.d.spot;const src=E.d.src||{};
  p.innerHTML=G?`<h3>던전</h3><label>장소<select data-df="spot"><option value="">(장소 없음)</option>${N().list('spots').sort((a,b)=>String(a.num||'').localeCompare(String(b.num||''),'ko',{numeric:true})).map(s=>`<option value="${esc(s.id)}" ${s.id===sp?'selected':''}>${esc((s.num?s.num+'. ':'')+(s.name||''))}</option>`).join('')}</select></label>
    <label>주인<input data-df="o" value="${esc(E.d.o||'')}" placeholder="던전의 주인 (보스)"></label><label>분위기<input data-df="a" value="${esc(E.d.a||'')}" placeholder="어둠 · 동굴"></label>
    <div class="small dim" style="margin-top:8px">방 ${n} · 통로 ${nl}${src.from==='sim'?` · 시뮬레이터 ${esc(TIER[src.tier]||src.tier||'')}${src.seed?' 씨앗 '+esc(src.seed):''}`:src.from==='om'?' · 웹툴에서 받음':''}</div>${src.note?`<div class="small dim pre" style="margin-top:4px">${esc(src.note)}</div>`:''}
    <div class="small dim" style="margin-top:10px">방을 누르면 이름 · 종류 · 그림 · 메모를 고쳐요. 체크 · 야생 배치처럼 전투 쪽은 웹툴 던전 탭에서 고치고 「📓 던전을 노트로」로 돌려보내요.</div>`
   :`<h3>${esc(E.d.n||'')}</h3>${E.d.a?`<div class="small dim">${esc(E.d.a)}</div>`:''}<div class="small dim" style="margin-top:8px">방을 누르면 이름 · 그림을 봐요.</div>`}
 async function upImg(f,k){if(!f)return;try{const u=await N().upload(f,k==='bg'?'map':'photo','dg');if(!u)return;if(k==='bg')E.d.bg=u;else if(R()[E.sel])R()[E.sel].b=u;save(true);if(k==='bg'){openEd(E.id)}else draw()}catch(e){N().toast('그림을 올리지 못했어요: '+e.message)}}
 function setPath(o,path,v){const ks=path.split('.');let x=o;for(let i=0;i<ks.length-1;i++){x[ks[i]]=x[ks[i]]&&typeof x[ks[i]]==='object'?x[ks[i]]:{};x=x[ks[i]]}const k=ks[ks.length-1];if(v===''||v==null)delete x[k];else x[k]=v}
 function bind(){const m=E.m;const c=m.querySelector('#dgC');
  m.addEventListener('input',e=>{const i=e.target;if(i.dataset.rf){const r=R()[E.sel];if(!r)return;setPath(r,i.dataset.rf,i.value);if(r.cl&&!r.cl.t&&!r.cl.d)delete r.cl;
    if(i.dataset.rf==='n'){const b=c.querySelector(`.dgn[data-n="${CSS.escape(E.sel)}"] b`);if(b)b.textContent=i.value}save()}
   else if(i.dataset.df&&i.tagName!=='SELECT'){E.d[i.dataset.df]=i.value;save()}});
  m.addEventListener('change',async e=>{const i=e.target;if(i.dataset.rf==='t'||i.dataset.rf==='rk'){const r=R()[E.sel];setPath(r,i.dataset.rf,i.value);save();draw()}
   else if(i.dataset.rf==='b'){draw()}
   else if(i.dataset.df==='spot'){E.d.spot=i.value;save(true)}
   else if(i.id==='dgVis'){clearTimeout(E.t);await N().put('dgs',E.id,JSON.parse(JSON.stringify(E.d)),i.value);N().toast('공개 범위: '+N().visLabel(i.value))}
   else if(i.dataset.dimg){upImg(i.files[0],i.dataset.dimg);i.value=''}});
  m.addEventListener('click',async e=>{const b=e.target.closest('[data-de]');if(!b)return;const k=b.dataset.de;
   if(k.startsWith('m:')){E.mode=k.slice(2);m.querySelectorAll('[data-de^="m:"]').forEach(x=>x.classList.toggle('on',x===b));E.from='';draw();return}
   if(k==='add'){const id=rid();const n=Object.keys(R()).length+1;R()[id]={n:'방 '+n,t:'room',x:clamp(500+((n*53)%300)-150,30,970),y:clamp(320+((n*97)%220)-110,30,600)};E.sel=id;save();draw();return}
   if(k==='desel'){E.sel='';draw();return}
   if(k==='ldel'){delete E.d.l[E.sel.slice(2)];E.sel='';save();draw();return}
   if(k==='rdel'){const id=E.sel;if(!await N().confirmBox(`방 「${(R()[id]||{}).n||''}」 를 지울까요? 이어진 통로도 같이 지워요.`,'지우기'))return;delete R()[id];for(const x of Object.keys(E.d.l))if(x.split('~').includes(id))delete E.d.l[x];if(E.d.st===id)E.d.st=Object.keys(R())[0]||'';E.d.hide=(E.d.hide||[]).filter(x=>x!==id);E.sel='';save();draw();return}
   if(k==='start'){E.d.st=E.sel;save();draw();return}
   if(k==='hide'){const h=new Set(E.d.hide||[]);h.has(E.sel)?h.delete(E.sel):h.add(E.sel);E.d.hide=[...h];if(!E.d.hide.length)delete E.d.hide;save();draw();return}
   if(k==='imgdel'){const r=R()[E.sel];if(r){delete r.b;save();draw()}return}
   if(k==='bgdel'){delete E.d.bg;save(true);openEd(E.id);return}
   if(k==='json'){const t=JSON.stringify(toOm(E.d),null,1);try{await navigator.clipboard.writeText(t);N().toast('웹툴 「JSON 가져오기」에 붙여 넣을 글을 복사했어요')}catch(err){N().openModal(`<div class="mhead"><h2>JSON</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><textarea rows="14" style="width:100%" data-nodirty>${esc(t)}</textarea>`,'wide',{stack:true})}return}
   if(k==='del'){if(!await N().confirmBox(`던전 「${E.d.n||''}」 를 지울까요? (웹툴에 보낸 던전은 웹툴에 그대로 남아요)`,'지우기'))return;clearTimeout(E.t);await N().del('dgs',E.id);N().closeModal();N().toast('던전을 지웠어요')}});
  /* 끌기: 방 옮기기 · 점에서 끌어 잇기 · 잇기 모드에서 두 방 차례로 누르기 */
  let P=null;const pt=e=>{const b=c.getBoundingClientRect();return [clamp(Math.round((e.clientX-b.left)/b.width*W),30,970),clamp(Math.round((e.clientY-b.top)/b.height*H),30,600)]};
  c.addEventListener('pointerdown',e=>{const hit=e.target.closest('line.hit');if(hit&&canEd()){E.sel='l:'+hit.dataset.l;draw();return}
   const n=e.target.closest('.dgn');if(!n){if(E.sel){E.sel='';draw()}return}const id=n.dataset.n;
   if(!canEd()){E.sel=id;draw();return}
   if(e.target.closest('.dgport')||E.mode==='link'){if(E.mode==='link'&&E.from&&E.from!==id){toggleLink(E.from,id);E.from='';draw();return}P={link:id,x0:e.clientX,y0:e.clientY};E.from=id;c.setPointerCapture(e.pointerId);e.preventDefault();return}
   P={id,n,x0:e.clientX,y0:e.clientY,moved:false};c.setPointerCapture(e.pointerId);e.preventDefault()});
  c.addEventListener('pointermove',e=>{if(!P)return;const [x,y]=pt(e);
   if(P.link){const t=c.querySelector('#dgTmp');const a=R()[P.link];if(t&&a){t.style.display='';t.setAttribute('x1',a.x);t.setAttribute('y1',a.y);t.setAttribute('x2',x);t.setAttribute('y2',y)}return}
   if(!P.moved&&Math.hypot(e.clientX-P.x0,e.clientY-P.y0)<4)return;P.moved=true;const r=R()[P.id];r.x=x;r.y=y;P.n.style.left=x/W*100+'%';P.n.style.top=y/H*100+'%';lines()});
  const end=e=>{if(!P)return;const p=P;P=null;
   if(p.link){const el=document.elementFromPoint(e.clientX,e.clientY);const n=el&&el.closest&&el.closest('.dgn');const t=c.querySelector('#dgTmp');if(t)t.style.display='none';
    if(n&&n.dataset.n!==p.link){toggleLink(p.link,n.dataset.n);E.from='';draw()}else if(E.mode==='link'){E.sel=p.link;draw();const s=c.querySelector(`.dgn[data-n="${CSS.escape(p.link)}"]`);if(s)s.classList.add('from')}return}
   if(p.moved){save();return}E.sel=p.id;draw()};
  c.addEventListener('pointerup',end);c.addEventListener('pointercancel',()=>{P=null})}
 function toggleLink(a,b){const k=lk(a,b);if(E.d.l[k]){delete E.d.l[k];N().toast('통로를 지웠어요')}else{E.d.l[k]=1;N().toast('통로를 이었어요')}save()}
 /* 웹툴 「JSON 가져오기」 꼴 */
 function toOm(d){const r={};for(const [id,x] of Object.entries(d.r||{})){const o={};for(const f of RF)if(x[f]!=null&&x[f]!=='')o[f]=x[f];r[id]=o}const o={n:d.n||'',st:d.st,r,l:Object.assign({},d.l||{})};for(const f of ['o','a','wn','noal'])if(d[f]!=null&&d[f]!=='')o[f]=d[f];return o}

 document.addEventListener('click',e=>{const a=e.target.closest('[data-dgo]');if(a){e.preventDefault();e.stopPropagation();return openEd(a.dataset.dgo)}const b=e.target.closest('[data-dgnew]');if(b){e.preventDefault();e.stopPropagation();return newFor(b.dataset.dgnew)}},true);
 return {all,at,has,spotSec,pinMark,mini,openEd,newFor,fromSim,fromAny,toOm,simList,TY};
})();
