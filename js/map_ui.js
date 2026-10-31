/* ---------- 지도 탭 ----------
   maps: {name, img, w, h, order, party(spot id), d(설명)}   spots: {map, x, y, name, num, kind, area, summary, items, img, imgs[{p,t}]}
   links: {a, b, route, note}  — 시나리오 루트가 그은 선 (scen_ui 와 공유)
   GM: 빈 곳 클릭 = 장소 추가 · 핀 끌기 = 옮기기 · 핀 클릭 = 오른쪽에 편집. 구경 · PL: 공개된 핀만, 클릭하면 정보. */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const KINDS=[['대화','talk','#1e88e5'],['사건','event','#f08a00'],['조우','enc','#e11d48'],['하이라이트','high','#ffd23f'],['휴식','rest','#00a676'],['기타','etc','#8e8e8e']];
 const kc=k=>(KINDS.find(x=>x[0]===k)||KINDS[KINDS.length-1]);
 /* 10-26 감우: linkFrom = 「🔗 잇기」 중인 출발 장소 · multi = 「연속 찍기」 · hoverAt = 포인터가 지도에 들어온 때(휠 확대 판정) */
 const U={map:'',sel:'',zoom:1,px:0,py:0,drag:null,mode:'sel',filter:'',linkFrom:'',multi:false,hoverAt:0};
 const maps=()=>N().list('maps').sort((a,b)=>(a.order||0)-(b.order||0));
 const spots=m=>N().list('spots').filter(s=>s.map===m);
 const links=()=>N().list('links');
 const curMap=()=>{const L=maps();if(!L.length)return null;let m=L.find(x=>x.id===U.map);if(!m){m=L[0];U.map=m.id}return m};
 const spotNm=id=>{const x=N().data('spots',id);return x?x.name:''};
 const entsAt=sid=>N().list('ents').filter(e=>(e.at||[]).includes(sid));
 /* 10-29 망령 「장소엔 인물 배치」: 인물 = 항목(인물 · 얼굴 있는 것) + PC · NPC 시트. 놓인 곳은 저마다의 at=[장소 id] (항목은 원래 있던 칸, 시트는 새 칸).
    GM: 장소 칸 「＋ 인물 놓기」 · 지도 위 얼굴을 다른 핀으로 끌어 옮기기 · ✕ 로 빼기 */
 const omRoom=()=>(((N().ST.campInfo||{}).data||{}).om||{}).room||'';   /* 10-30 「🗺 웹툴로 · 연동」 — 이어 둔 웹툴 방 */
 const isPerson=e=>e.type==='인물'||!!e.face;
 /* 10-30 망령 「PC · 객원 · NPC 로 거르기」: cls = 시트 분류(js/cls.js) · 항목 인물은 'ent'. 지도 위 얼굴 · 장소 목록 얼굴만 거른다 (장소 칸의 「인물 배치」 목록은 다 보인다) */
 const CL=()=>window.NT_CLS;
 const clsOf=(k,p)=>CL()?CL().of(k,p):(k==='ents'?'ent':k==='npc'?'npc':'pc');
 const clsName=c=>CL()?CL().name(c):({pc:'PC',guest:'객원',npc:'NPC'})[c]||'항목';
 const clsShown=x=>!CL()||CL().shown('map',x.cls);
 function people(){const MK=window.NT_MAKER;const out=[];
  for(const e of N().list('ents'))if(isPerson(e))out.push({k:'ents',cls:'ent',id:e.id,name:e.title||'',img:e.face||'',sub:[e.type,e.sub].filter(Boolean).join(' · '),at:e.at||[],pos:e.atPos||{},vis:e._vis,st:e.st||null});
  for(const k of ['pc','npc'])for(const p of N().list(k).sort((a,b)=>(a.order||0)-(b.order||0))){const t=MK&&MK.trainer(p.id);const c=clsOf(k,p);out.push({k,cls:c,id:p.id,name:(t&&t.name)||p.name||'',img:(t&&t.image)||p.image||'',sub:clsName(c)+(p.player?' · '+p.player:'')+(p.sub?' · '+p.sub:''),at:p.at||[],pos:p.atPos||{},vis:p._vis,st:p.st||null})}
  return out}
 const clsCount=m=>{const ids=new Set(m?spots(m.id).map(s=>s.id):[]);const o={pc:0,guest:0,npc:0,ent:0};for(const x of people())if(x.at.some(a=>ids.has(a))&&(x.img||x.k!=='ents'))o[x.cls]=(o[x.cls]||0)+1;return o};
 const pKey=x=>x.k+':'+x.id;
 const personOf=key=>{const i=String(key||'').indexOf(':');if(i<0)return null;const k=key.slice(0,i),id=key.slice(i+1);return people().find(x=>x.k===k&&x.id===id)||null};
 const peopleAt=sid=>people().filter(x=>x.at.includes(sid));
 /* 10-31 망령 「PL 도 자기 권한 있는 캐릭터를 배치 · 이동 · 빼기」: GM 은 모두, PL 은 자기 PC 시트(고칠 수 있는 시트)만. 저장은 그 시트 문서의 at · atPos 라 PL 쓰기 권한 안이다 */
 const canPlace=x=>!!x&&(N().gm()||(x.k==='pc'&&N().canEdit('pc',x.id)));
 const myPlaceable=()=>people().filter(canPlace);
 /* 옮기기: 이 지도의 다른 장소에서는 빼고 to 에 둔다 (다른 지도에 놓인 곳은 그대로). keepOthers 면 여러 곳에 함께 */
 async function placeMove(key,to,keepOthers){const x=personOf(key);if(!canPlace(x))return;const m=curMap();const here=new Set(m?spots(m.id).map(s=>s.id):[]);
  await N().patch(x.k,x.id,d=>{let a=Array.isArray(d.at)?d.at.slice():[];if(!keepOthers)a=a.filter(s=>!here.has(s));if(to&&!a.includes(to))a.push(to);d.at=a;posKeep(d,a)})}
 async function placeOff(key,sid){const x=personOf(key);if(!canPlace(x))return;await N().patch(x.k,x.id,d=>{d.at=(Array.isArray(d.at)?d.at:[]).filter(s=>s!==sid);posKeep(d,d.at)})}
 /* 10-29 망령 「인물들 일렬로만 서는 거 아쉬운데 배치한 뒤에 드래그해서 위치 조정」: 장소마다 자유 자리 atPos={[장소 id]:{x,y}} (지도 %).
    없으면 예전처럼 핀 오른쪽 줄. 얼굴을 빈 곳에 놓으면 그 자리, 다른 핀에 놓으면 그 장소로 옮기기, 제 핀에 놓으면 줄로 되돌리기 */
 function posKeep(d,at){if(!d.atPos)return;for(const k of Object.keys(d.atPos))if(!at.includes(k))delete d.atPos[k];if(!Object.keys(d.atPos).length)delete d.atPos}
 async function placePos(key,sid,xy){const x=personOf(key);if(!canPlace(x))return;await N().patch(x.k,x.id,d=>{const p=Object.assign({},d.atPos||{});if(xy)p[sid]={x:+Math.max(0,Math.min(100,xy.x)).toFixed(2),y:+Math.max(0,Math.min(100,xy.y)).toFixed(2)};else delete p[sid];if(Object.keys(p).length)d.atPos=p;else delete d.atPos})}
 /* 10-30 망령 「지도 아래 창이 허전 — 웹툴 감정 이모지와 간단한 상태 메시지를 넣으면 아이콘 위 말풍선으로」
    인물 문서(pc · npc · ents)의 st={e:감정 키(웹툴 OM_EMO 와 같은 키), m:상태 메시지, at}. GM 과 그 PC 의 주인이 고친다 */
 const EMO=[['surprise','❗','놀람'],['question','❓','의문'],['angry','💢','화남'],['happy','🎵','기쁨'],['heart','💗','하트'],['sweat','💦','당황'],['sad','💧','슬픔'],['shy','☺️','부끄'],['think','💭','생각'],['idea','💡','번뜩'],['sigh','😮‍💨','한숨'],['sleepy','💤','졸림'],['sparkle','✨','반짝'],['fear','😱','오싹'],['nod','👍','끄덕'],['no','🙅','도리도리']];
 const emoOf=k=>EMO.find(x=>x[0]===k);
 const stBub=x=>{const st=x&&x.st;if(!st||!(st.e||st.m))return '';const e=emoOf(st.e);return `<b class="mnst${st.m?'':' only'}">${e?`<em>${e[1]}</em>`:''}${st.m?`<span>${esc(st.m)}</span>`:''}</b>`};
 const canSt=x=>!!x&&(N().gm()||(x.k==='pc'&&N().me&&N().me()===x.id));
 const faceBtn=(x,cls,tag)=>{tag=tag||'button';return `<${tag} ${tag==='button'?'type="button" ':''}class="${cls} ${x.img?'':'noimg'} ${x.k!=='ents'?'pcf':''}" data-pkey="${esc(pKey(x))}" title="${esc(x.name)}" style="${x.img?`background-image:url('${cssu(x.img)}')`:''}">${x.img?'':esc([...(x.name||'?')][0]||'?')}</${tag}>`};
 const routeOf=id=>N().data('routes',id);
 /* 지도 위 선: 루트의 이웃 단계(장소가 있는 것끼리) + 자유 연결(links). 지도에 선 숨김(visible=false)인 루트는 GM 에게만 점선으로 */
 function segs(mid){const out=[];const S=N().data.bind(N());
  for(const l of links()){const a=S('spots',l.a),b=S('spots',l.b);if(a&&b&&a.map===mid&&b.map===mid)out.push({a,b,color:(routeOf(l.route)||{}).color||'#9aa'})}
  return out}
 /* 루트 한 줄 = 그 지도의 단계 장소를 차례로 이은 폴리라인 (픽셀 좌표). 다른 지도의 단계는 건너뛴다 */
 function routePaths(m){const S=N().data.bind(N());const G=N().gm();const W=+m.w||1000,H=+m.h||700;const out=[];
  for(const r of N().list('routes').sort((a,b)=>(a.order||0)-(b.order||0))){if(r.visible===false&&!G)continue;if(U.hideR&&U.hideR[r.id])continue;
   const pts=(r.steps||[]).map((st,i)=>{const sp=st.spot&&S('spots',st.spot);return sp&&sp.map===m.id?{x:sp.x/100*W,y:sp.y/100*H,st:st.st||'',i}:null}).filter(Boolean);if(pts.length<1)continue;
   out.push({r,pts,hidden:r.visible===false||r._vis!=='pub'})}
  return out}
 function routeSvg(m){const W=+m.w||1000,H=+m.h||700;const k=Math.max(W,H)/1000;/* 지도 크기에 맞춘 굵기 */
  const seg=segs(m.id).map(g=>`<line x1="${g.a.x/100*W}" y1="${g.a.y/100*H}" x2="${g.b.x/100*W}" y2="${g.b.y/100*H}" stroke="${esc(g.color)}" stroke-width="${4*k}" stroke-dasharray="${8*k} ${8*k}" opacity=".7"/>`).join('');
  const rp=routePaths(m).map(({r,pts,hidden})=>{const c=esc(r.color||'#e4002b');const d=pts.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
   const nowI=pts.findIndex(p=>p.st==='now');
   const lab=pts.length>1?{x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2}:{x:pts[0].x,y:pts[0].y-30*k};
   return `<g class="rt ${hidden?'hid':''}" data-rid="${esc(r.id)}">${pts.length>1?`<path d="${d}" stroke="#000" stroke-width="${11*k}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/><path d="${d}" stroke="${c}" stroke-width="${7*k}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${hidden?.5:.9}" ${hidden?`stroke-dasharray="${18*k} ${14*k}"`:''}/>`:''}
    ${pts.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="${(p.st==='now'?15:11)*k}" fill="${['done','skip','fail'].includes(p.st)?'#222':c}" stroke="${p.st==='now'?'#fff':'#fff'}" stroke-width="${3*k}" opacity="${['done','skip','fail'].includes(p.st)?.9:1}"/><text x="${p.x}" y="${p.y+4.5*k}" font-size="${12*k}" text-anchor="middle" fill="#fff" font-weight="bold" paint-order="stroke" stroke="#000" stroke-width="${2*k}">${p.i+1}</text>`).join('')}
    <text x="${lab.x+14*k}" y="${lab.y-10*k}" font-size="${15*k}" fill="${c}" stroke="#000" stroke-width="${4*k}" paint-order="stroke" font-weight="bold">${esc(r.name||'')}${nowI>=0?' ▶':''}</text></g>`}).join('');
  return `<svg class="maplinks" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${seg}${rp}</svg>`}
 /* 장소에 있는 인물(얼굴 있는 항목)을 핀 옆에 둥근 초상으로 */
 /* 10-30 망령 「배치된 인물 아이콘 좀 더 커도 될듯」: 30 → 42px (휴대폰 22 → 30). 간격은 CSS --mnS */
 function npcLayer(m,sp){const P=people().filter(x=>x.at.length&&(x.img||x.k!=='ents')&&clsShown(x));const out=[];
  for(const s of sp){const all=P.filter(x=>x.at.includes(s.id));const fr=all.filter(x=>x.pos[s.id]),es=all.filter(x=>!x.pos[s.id]);const MAX=4;
   fr.forEach(e=>{const q=e.pos[s.id];out.push(`<button type="button" class="mnpc free ${e.vis&&e.vis!=='pub'?'hid':''} ${e.img?'':'noimg'} ${e.k!=='ents'?'pcf':''} cls-${e.cls}" ${e.k==='ents'?`data-ent="${esc(e.id)}"`:''} data-pkey="${esc(pKey(e))}" data-at="${esc(s.id)}" style="left:${+q.x}%;top:${+q.y}%;${e.img?`background-image:url('${cssu(e.img)}')`:''}" title="${esc(e.name)} · ${esc(s.name||'')}">${e.img?'':esc([...(e.name||'?')][0]||'?')}<i>${esc(e.name)}</i>${stBub(e)}</button>`)});
   es.slice(0,MAX).forEach((e,i)=>out.push(`<button type="button" class="mnpc ${e.vis&&e.vis!=='pub'?'hid':''} ${e.img?'':'noimg'} ${e.k!=='ents'?'pcf':''} cls-${e.cls}" ${e.k==='ents'?`data-ent="${esc(e.id)}"`:''} data-pkey="${esc(pKey(e))}" data-at="${esc(s.id)}" style="left:calc(${s.x}% + 16px + ${i} * var(--mnS,46px));top:${s.y}%;${e.img?`background-image:url('${cssu(e.img)}')`:''}" title="${esc(e.name)}">${e.img?'':esc([...(e.name||'?')][0]||'?')}<i>${esc(e.name)}</i>${stBub(e)}</button>`));
   if(es.length>MAX)out.push(`<button type="button" class="mnpc more" data-pmore="${esc(s.id)}" style="left:calc(${s.x}% + 16px + ${MAX} * var(--mnS,46px));top:${s.y}%" title="${es.slice(MAX).map(x=>esc(x.name)).join(' · ')}">+${es.length-MAX}</button>`)}
  return out.join('')}

 function mapSelHtml(m){const G=N().gm();return maps().length>1||G?`<select id="mapSel">${maps().map(x=>`<option value="${esc(x.id)}" ${x.id===m.id?'selected':''}>${esc(x.name||'지도')}${x.kind==='globe'?' (지구본)':''}</option>`).join('')}</select>`:''}
 window.NT.BULKF.spots=()=>{const m=curMap();return (id,d)=>m&&d.data.map===m.id};
 function render(el){const m=curMap(),G=N().gm();
  if(m&&m.kind==='globe'&&window.NT_GLOBE){NT_GLOBE.render(el,m);bind(el);return}
  if(!m){el.innerHTML=`<div class="toolbar"><h2>지도</h2></div><div class="empty">아직 지도가 없어요.${G?'<br><button class="btn sm pri" data-m="newmap" style="margin-top:10px">＋ 지도 만들기 (그림 올리기)</button>':''}</div>`;bind(el);return}
  const sp=spots(m.id).filter(s=>!U.filter||s.kind===U.filter);
  const sel=U.sel&&N().data('spots',U.sel)?Object.assign({id:U.sel,_vis:(N().doc('spots',U.sel)||{}).vis},N().data('spots',U.sel)):null;
  el.innerHTML=`<div class="toolbar"><h2>지도</h2>${maps().length>1||G?`<select id="mapSel">${maps().map(x=>`<option value="${esc(x.id)}" ${x.id===m.id?'selected':''}>${esc(x.name||'지도')}</option>`).join('')}</select>`:''}
   <div class="seg" id="mapKinds"><button data-k="" class="${!U.filter?'on':''}">전체</button>${KINDS.map(([k,,c])=>`<button data-k="${k}" class="${U.filter===k?'on':''}" style="--c:${c}"><i class="kdot"></i>${k}</button>`).join('')}</div>
   ${CL()?CL().chips('map',clsCount(m)):''}
   ${G?`<div class="seg"><button data-mode="sel" class="${U.mode==='sel'?'on':''}">고르기 · 끌기</button><button data-mode="add" class="${U.mode==='add'?'on':''}">＋ 장소 찍기</button>${U.mode==='add'?`<button data-multi class="${U.multi?'on':''}" title="켜 두면 편집 창 없이 계속 찍어요 (Shift+클릭과 같아요)">연속 찍기</button>`:''}</div>`:''}
   <span class="sp"></span>${G&&omRoom()&&window.NT_LINK&&NT_LINK.omUrl?`<a class="btn sm" href="${esc(NT_LINK.omUrl(omRoom())+'&map='+encodeURIComponent(m.id))}" target="oremas" rel="noopener" title="이어 둔 웹툴 방으로 이 지도를 한 번에 보내고 연동을 켜요 — 그 뒤로 장소 핀 · 루트 · 인물 배치 · PC 위치가 서로 따라가요 (웹툴 GM 이 방을 열어 둔 동안)">🗺 웹툴로 · 연동</a>`:''}${N().bulkBtns('spots',null,'이 지도의 장소')}${U.linkFrom&&N().data('spots',U.linkFrom)?`<span class="note linking">🔗 「${esc(spotNm(U.linkFrom))}」 에서 이을 장소를 누르세요 <button type="button" class="btn xs ghost" data-m="linkcancel">취소 (Esc)</button></span>`:`<span class="note">${sp.length}곳${G?' · Ctrl+휠 확대 · 빈 곳 끌어 이동':' · Ctrl+휠 확대'}</span>`}
   ${G?`${maps().length>1?'<button class="btn xs ghost" data-m="maporder" title="지도 순서 바꾸기">지도 순서</button>':''}<button class="btn xs" data-m="mapedit">지도 설정</button><button class="btn xs ghost" data-m="newmap">＋ 지도</button>`:''}</div>
   <div class="split">
    <div class="mapwrap ${U.linkFrom?'linking':''}" id="mapWrap" data-mode="${U.mode}" style="--ar:${m.w&&m.h?(m.h/m.w).toFixed(4):0.66}"><div class="mapinner" id="mapInner" style="transform:translate(${U.px}px,${U.py}px) scale(${U.zoom});${m.w?`aspect-ratio:${m.w}/${m.h}`:''}">
     ${m.img?`<img class="mapimg" src="${esc(m.img)}" alt="${esc(m.name)}" draggable="false">`:'<div class="mapimg blank"></div>'}
     ${routeSvg(m)}
     ${sp.map(s=>{const k=kc(s.kind);const party=m.party===s.id;return `<button type="button" class="pin ${s.id===U.sel?'on':''} ${s._vis!=='pub'?'hid':''} ${party?'party':''}" data-pin="${esc(s.id)}" style="left:${s.x}%;top:${s.y}%;--c:${k[2]}" title="${esc(s.name)}${s._vis!=='pub'?' ('+N().visLabel(s._vis)+')':''}"><i></i><b>${esc(s.num||'')}</b><span>${esc(s.name)}</span>${window.NT_DG?NT_DG.pinMark(s.id):''}${party?'<em>PC</em>':''}</button>`}).join('')}
     ${npcLayer(m,sp)}
    </div></div>
    <aside class="side" id="mapSide">${sel?spotPanel(sel,m):mapPanel(m,sp)}</aside></div>`;
  bind(el);fit(el,m);showPop(el)}
 function legendHtml(){return `<div class="legend">${KINDS.map(([k,,c])=>`<span><i style="background:${c}"></i>${k}</span>`).join('')}<span><i class="pc"></i>PC 위치</span></div>`}
 function routeLegend(mid){const G=N().gm();const S=N().data.bind(N());const rs=N().list('routes').filter(r=>(r.visible!==false||G)&&(r.steps||[]).some(x=>x.spot&&S('spots',x.spot)&&S('spots',x.spot).map===mid)).sort((a,b)=>(a.order||0)-(b.order||0));if(!rs.length)return '';
  return `<div class="sec">루트 <small class="dim">이름을 누르면 지도에서 감추기 · 보이기</small></div><div class="rlegend">${rs.map(r=>`<div class="rl ${U.hideR&&U.hideR[r.id]?'off':''}"><button type="button" class="rlname" data-rt="${esc(r.id)}"><i style="background:${esc(r.color||'#888')}"></i><span>${esc(r.name||'')}</span></button>${r._vis!=='pub'?'<em class="visb gm">🔒 GM</em>':''}${G?`<button type="button" class="btn xs ${r._vis==='pub'?'':'ghost'}" data-rvis="${esc(r.id)}" title="${r._vis==='pub'?'누르면 PL 에게 감춤 (GM만)':'누르면 PL 에게 공개'}">${r._vis==='pub'?'👁 공개':'🔒 비공개'}</button>`:''}</div>`).join('')}</div>`}
 function mapPanel(m,sp){const G=N().gm();return `<div class="card"><h3>${esc(m.name||'지도')} ${N().visBadge(m._vis,'maps',m.id)}</h3>${m.d?`<p class="pre small">${esc(m.d)}</p>`:''}${legendHtml()}${routeLegend(m.id)}
   ${spList(sp,G)}</div>`}
 /* 10-29 망령 「구역별로 장소」: 장소의 구역(area)이 있으면 구역끼리 묶어 보여 준다. 구역 이름을 누르면 접기 · 펴기, 얼굴은 그 장소에 놓인 인물 */
 function spList(sp,G){const byNum=(a,b)=>String(a.num||'').localeCompare(String(b.num||''),'ko',{numeric:true})||String(a.name||'').localeCompare(String(b.name||''),'ko');
  if(!sp.length)return '<div class="splist"><div class="small dim">장소가 없어요. '+(G?'「＋ 장소 찍기」로 지도 위를 눌러요.':'')+'</div></div>';
  const P=people().filter(clsShown);const row=s=>{const ps=P.filter(x=>x.at.includes(s.id));return `<button type="button" class="sprow" data-go="${esc(s.id)}"><i style="background:${kc(s.kind)[2]}"></i><b>${esc(s.num||'')}</b><span>${esc(s.name)}</span>${ps.length?`<span class="spfaces">${ps.slice(0,3).map(x=>`<em class="${x.img?'':'noimg'}" style="${x.img?`background-image:url('${cssu(x.img)}')`:''}" title="${esc(x.name)}">${x.img?'':esc([...(x.name||'?')][0]||'')}</em>`).join('')}${ps.length>3?`<small>+${ps.length-3}</small>`:''}</span>`:''}${N().visBadge(s._vis,'spots',s.id)}</button>`};
  const areas=[...new Set(sp.map(s=>s.area||''))];
  if(areas.length<2&&!areas[0])return `<div class="splist">${sp.sort(byNum).map(row).join('')}</div>`;
  const first=a=>Math.min(...sp.filter(s=>(s.area||'')===a).map(s=>parseFloat(s.num)||999));
  areas.sort((a,b)=>(!a)-(!b)||first(a)-first(b)||a.localeCompare(b,'ko'));U.fold=U.fold||{};
  return `<div class="splist grouped">${areas.map(a=>{const L=sp.filter(s=>(s.area||'')===a).sort(byNum);const n=L.reduce((c,s)=>c+P.filter(x=>x.at.includes(s.id)).length,0);const off=!!U.fold[a];
   return `<div class="sparea ${off?'off':''}"><button type="button" class="sparh" data-fold="${esc(a)}"><span class="caret">▾</span><b>${esc(a||'구역 없음')}</b><small>${L.length}곳${n?` · 인물 ${n}`:''}</small></button>${off?'':L.map(row).join('')}</div>`}).join('')}</div>`}
 function spotPanel(s,m){const G=N().gm(),k=kc(s.kind);const ents=entsAt(s.id);const ls=links().filter(l=>l.a===s.id||l.b===s.id);
  const head=`<div class="card spot" style="--c:${k[2]}"><div class="row" style="gap:6px"><button class="linkbtn" data-go="">← 목록</button>${window.NT_FAV?NT_FAV.btn('spots',s.id,s.name):''}<span class="sp"></span>${G?`<button class="btn xs" data-m="edit">고치기</button><button class="btn xs ${m.party===s.id?'pri':'ghost'}" data-m="party" title="PC 들이 지금 있는 곳">PC 위치</button><button class="btn xs ghost danger" data-m="delspot" title="지우기">🗑</button>`:''}</div>
   <h3><i class="kdot" style="background:${k[2]}"></i>${s.num?`<b class="num">${esc(s.num)}</b>`:''}${esc(s.name||'(이름 없음)')} <small>${esc(s.kind||'')}${s.area?' · '+esc(s.area):''}</small>${N().visBadge(s._vis,'spots',s.id)}</h3>`;
  const imgs=[s.img?{p:s.img,t:''}:null,...(s.imgs||[])].filter(Boolean);
  /* 10-30 망령 「지도도 배경 첨부」: s.bg = 웹툴 무대 배경 (웹툴 「지도 가져오기」 때 핀 배경으로 넘어감) */
  const body=`${s.bg?`<figure class="spbg"><img src="${esc(s.bg)}" alt="${esc(s.name||'')} 배경" loading="lazy" data-big="${esc(s.bg)}"><figcaption>🖼 배경${s.bgName&&s.bgName!==s.name?' · '+esc(s.bgName):''}</figcaption></figure>`:''}${imgs.length?`<div class="spimgs">${imgs.map(x=>`<figure><img src="${esc(x.p)}" alt="${esc(x.t||s.name)}" loading="lazy" data-big="${esc(x.p)}">${x.t?`<figcaption>${esc(x.t)}</figcaption>`:''}</figure>`).join('')}</div>`:''}
   ${s.summary?`<p class="pre">${esc(s.summary)}</p>`:''}${s.items?`<div class="kv"><b>얻을 것</b><span>${esc(s.items)}</span></div>`:''}
   ${window.NT_DG?NT_DG.spotSec(s.id):''}
   ${(()=>{const ps=peopleAt(s.id);const CP=G||myPlaceable().length>0;if(!ps.length&&!CP)return '';return `<div class="sec">인물 배치 <small class="dim">${ps.length}명</small>${CP?` <button type="button" class="btn xs ghost" data-m="place" title="${G?'이 장소에 인물(항목 · PC · NPC)을 놓아요':'내 캐릭터를 이 장소에 놓아요'}">＋ ${G?'인물':'내 캐릭터'} 놓기</button>`:''}</div>${ps.length?`<div class="spppl">${ps.map(x=>`<div class="sppp">${faceBtn(x,'sppf')}<button type="button" class="linkbtn" data-pkey="${esc(pKey(x))}"><b>${esc(x.name||'(이름 없음)')}</b><small>${esc(x.sub||'')}</small></button>${canPlace(x)?`<button type="button" class="lnkx" data-unplace="${esc(pKey(x))}" title="이 장소에서 빼기">✕</button>`:''}</div>`).join('')}</div>${CP?`<div class="small dim">지도 위 ${G?'':'내 캐릭터 '}얼굴을 다른 핀으로 끌면 옮겨져요.</div>`:''}`:'<div class="small dim">아직 아무도 없어요.</div>'}`})()}
   ${(()=>{const L=ents.filter(e=>!isPerson(e));return L.length?`<div class="sec">이 곳의 항목</div><div class="entchips">${L.map(e=>`<button type="button" class="chip" data-ent="${esc(e.id)}">${esc(e.title)}</button>`).join('')}</div>`:''})()}
   ${(()=>{const rs=N().list('routes').filter(r=>(r.steps||[]).some(x=>x.spot===s.id));return rs.length?`<div class="sec">시나리오</div><ul class="lnk">${rs.map(r=>{const i=r.steps.findIndex(x=>x.spot===s.id);const prev=r.steps[i-1],next=r.steps[i+1];const nm=x=>x?(x.title||spotNm(x.spot)):'';return `<li><span style="color:${esc(r.color||'#fff')}">${esc(r.name)}</span> <span class="small dim">${i+1}단계${prev?' · 앞: '+esc(nm(prev)):''}${next?' · 다음: '+esc(nm(next)):''}${r.steps[i].note?' · '+esc(r.steps[i].note):''}</span></li>`}).join('')}</ul>`:''})()}
   ${ls.length||G?`<div class="sec">이어진 곳${G?` <button type="button" class="btn xs ghost" data-m="link" title="다른 장소와 선으로 잇기">🔗 잇기</button>`:''}</div>${ls.length?`<ul class="lnk">${ls.map(l=>{const o=N().data('spots',l.a===s.id?l.b:l.a);const r=routeOf(l.route);return `<li><button class="linkbtn" data-go="${esc(l.a===s.id?l.b:l.a)}">${esc(o?o.name:'?')}</button>${r?` <span class="small" style="color:${esc(r.color||'#fff')}">${esc(r.name||'')}</span>`:''}${l.note?` <span class="small dim">${esc(l.note)}</span>`:''}${G?` <button type="button" class="lnkx" data-dellink="${esc(l.id)}" title="이 연결 지우기">✕</button>`:''}</li>`}).join('')}</ul>`:'<div class="small dim">아직 이어진 곳이 없어요.</div>'}`:''}
   ${G&&N().data('sec','spot:'+s.id)?`<div class="gmnote"><b>GM 메모</b><div class="pre">${esc(N().data('sec','spot:'+s.id).t||'')}</div></div>`:''}</div>`;
  return head+body}

 function fit(el,m){const w=$('#mapWrap',el);if(!w)return;if(!U.fitDone||U.fitMap!==m.id){U.zoom=1;U.px=0;U.py=0;U.fitDone=true;U.fitMap=m.id;const inner=$('#mapInner',el);inner.style.transform=`translate(0px,0px) scale(1)`}}
 function apply(el){const inner=$('#mapInner',el);if(inner)inner.style.transform=`translate(${U.px}px,${U.py}px) scale(${U.zoom})`;const w=$('#mapWrap',el);if(w)w.classList.toggle('lbl',U.zoom>=1.8);placePop(el)}
 function bind(el){
  const sel=$('#mapSel',el);if(sel)sel.onchange=()=>{U.map=sel.value;U.sel='';U.fitDone=false;N().render()};
  $$('#mapKinds button',el).forEach(b=>b.onclick=()=>{U.filter=b.dataset.k;N().render()});if(CL())CL().bindChips(el,'map',()=>N().render());
  $$('[data-mode]',el).forEach(b=>b.onclick=()=>{U.mode=b.dataset.mode;if(U.mode!=='add')U.multi=false;N().render()});
  const mb=$('[data-multi]',el);if(mb)mb.onclick=()=>{U.multi=!U.multi;N().toast(U.multi?'연속 찍기 — 편집 창 없이 계속 찍어요':'연속 찍기 끔');N().render()};
  if(!el._mapClick){el._mapClick=1;el.addEventListener('click',e=>{if(N().ST.view!=='map')return;const t=e.target;
   const pa=t.closest('[data-pop]');if(pa){return popAct(pa.dataset.pop,pa.dataset.id)}
   const dl=t.closest('[data-dellink]');if(dl){return delLink(dl.dataset.dellink)}
   const fo=t.closest('[data-fold]');if(fo){U.fold=U.fold||{};U.fold[fo.dataset.fold]=!U.fold[fo.dataset.fold];N().render();return}
   const un=t.closest('[data-unplace]');if(un){if(!canPlace(personOf(un.dataset.unplace)))return;return placeOff(un.dataset.unplace,U.sel)}
   const pk=t.closest('[data-pkey]');if(pk&&!pk.closest('#mapWrap')){return openPerson(pk.dataset.pkey)}
   const g=t.closest('[data-go]');if(g){U.sel=g.dataset.go;U.pop=g.dataset.go?{k:'spot',id:g.dataset.go}:null;N().render();return}
   const rt=t.closest('[data-rt]');if(rt){U.hideR=U.hideR||{};U.hideR[rt.dataset.rt]=!U.hideR[rt.dataset.rt];N().render();return}
   const rv=t.closest('[data-rvis]');if(rv){const r=N().doc('routes',rv.dataset.rvis);if(r)N().put('routes',rv.dataset.rvis,r.data,r.vis==='pub'?'gm':'pub');return}
   const en=t.closest('[data-ent]');if(en&&!en.closest('#mapWrap')){N().go('ents');setTimeout(()=>window.NT_ENTS&&NT_ENTS.select(en.dataset.ent),0);return}
   const big=t.closest('img[data-big]');if(big){N().openModal(`<img src="${esc(big.dataset.big)}" style="max-width:100%;max-height:80vh;display:block;margin:auto">`,'wide');return}
   const mb=t.closest('[data-m]');if(mb)return act(mb.dataset.m)})}
  const w=$('#mapWrap',el);if(!w)return;
  /* 10-26 감우: 휠은 Ctrl(⌘)+휠이거나, 포인터가 지도에 들어와 400ms 넘게 머문 뒤에만 확대 — 그냥 지나가며 스크롤할 땐 페이지가 넘어가게 둔다 */
  w.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')U.hoverAt=Date.now()});w.addEventListener('pointerleave',()=>{U.hoverAt=0});
  w.addEventListener('wheel',e=>{const rest=U.hoverAt&&Date.now()-U.hoverAt>=400;if(!(e.ctrlKey||e.metaKey||rest)){wheelHint(w);return}
   e.preventDefault();const r=w.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;const z0=U.zoom;const z=Math.max(.4,Math.min(6,z0*(e.deltaY<0?1.15:1/1.15)));U.px=mx-(mx-U.px)*z/z0;U.py=my-(my-U.py)*z/z0;U.zoom=z;apply(el)},{passive:false});
  N().bindCtx(w,'.pin,.mnpc',ctxItems);
  let pd=null;const pts=new Map();let pinch=null;
  w.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:U.zoom,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,px:U.px,py:U.py};pd=null;return}if(e.button!==0)return;if(e.target.closest('.mpop,.mapwheelhint'))return;const pin=e.target.closest('.pin'),face=e.target.closest('.mnpc');pd={x:e.clientX,y:e.clientY,px:U.px,py:U.py,pin:pin&&N().gm()&&U.mode==='sel'?pin:null,downPin:pin,downFace:face,face:face&&face.dataset.pkey&&U.mode==='sel'&&canPlace(personOf(face.dataset.pkey))?face:null,moved:false,id:e.pointerId}});
  w.addEventListener('pointermove',e=>{if(pts.has(e.pointerId))pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pinch&&pts.size>=2){const [a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y)||1;const z=Math.max(.4,Math.min(6,pinch.z*d/pinch.d));const r=w.getBoundingClientRect();const mx=pinch.cx-r.left,my=pinch.cy-r.top;U.px=mx-(mx-pinch.px)*z/pinch.z;U.py=my-(my-pinch.py)*z/pinch.z;U.zoom=z;apply(el);return}
   if(!pd)return;const dx=e.clientX-pd.x,dy=e.clientY-pd.y;if(!pd.moved&&Math.hypot(dx,dy)<5)return;if(!pd.moved){try{w.setPointerCapture(pd.id)}catch(x){}const pp=$('#mapPop',w);if(pp&&!pd.pin)pp.classList.add('fade')}pd.moved=true;
   if(pd.pin){const r=$('#mapInner',el).getBoundingClientRect();pd.pin.style.left=((e.clientX-r.left)/r.width*100)+'%';pd.pin.style.top=((e.clientY-r.top)/r.height*100)+'%';pd.pin.classList.add('dragging')}
   else if(pd.face){const r=$('#mapInner',el).getBoundingClientRect();pd.face.style.left=((e.clientX-r.left)/r.width*100)+'%';pd.face.style.top=((e.clientY-r.top)/r.height*100)+'%';pd.face.classList.add('dragging');w.classList.add('facedrag');
    const hit=document.elementFromPoint(e.clientX,e.clientY);const pn=hit&&hit.closest&&hit.closest('.pin');$$('.pin.droptgt',w).forEach(x=>{if(x!==pn)x.classList.remove('droptgt')});if(pn&&pn.dataset.pin!==pd.face.dataset.at)pn.classList.add('droptgt')}
   else{U.px=pd.px+dx;U.py=pd.py+dy;apply(el)}});
  const up=async e=>{pts.delete(e.pointerId);if(pinch){if(pts.size<2)pinch=null;return}if(!pd)return;const p=pd;pd=null;try{w.releasePointerCapture(p.id)}catch(x){}
   if(p.face&&p.moved){w.classList.remove('facedrag');const hit=document.elementFromPoint(e.clientX,e.clientY);const pn=hit&&hit.closest&&hit.closest('.pin');const to=pn&&pn.dataset.pin;const from=p.face.dataset.at;const x=personOf(p.face.dataset.pkey);
    if(to&&to!==from&&x){await placeMove(p.face.dataset.pkey,to);N().toast(`${x.name||'인물'} → ${spotNm(to)}`)}
    else if(x&&from&&to===from){if(x.pos[from])await placePos(p.face.dataset.pkey,from,null);else N().render()}
    else if(x&&from){const r=$('#mapInner',el).getBoundingClientRect();await placePos(p.face.dataset.pkey,from,{x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100})}
    else N().render();return}
   if(p.pin&&p.moved){const r=$('#mapInner',el).getBoundingClientRect();const x=+((e.clientX-r.left)/r.width*100).toFixed(2),y=+((e.clientY-r.top)/r.height*100).toFixed(2);await N().patch('spots',p.pin.dataset.pin,s=>{s.x=Math.max(0,Math.min(100,x));s.y=Math.max(0,Math.min(100,y))});return}
   if(p.moved){const pp=$('#mapPop',w);if(pp)pp.classList.remove('fade');return}
   if(e.pointerType!=='mouse'&&document.querySelector('.ntctx'))return;/* 길게 눌러 메뉴가 떴으면 손을 떼도 클릭으로 안 친다 */
   /* 10-26 망령: 누른 곳 기준으로 판정 (포인터 캡처 뒤에는 e.target 이 지도 전체가 돼서 핀 · 얼굴 클릭이 먹지 않았다) */
   if(p.downPin&&U.linkFrom){return finishLink(p.downPin.dataset.pin)}
   if(p.downFace&&p.downFace.dataset.pmore){const id=p.downFace.dataset.pmore;U.sel=id;U.pop={k:'spot',id};N().render();return}
   if(p.downFace){const sp0=p.downFace.dataset.at||'';U.pop=p.downFace.dataset.ent?{k:'ent',id:p.downFace.dataset.ent,at:sp0}:{k:'pcx',id:p.downFace.dataset.pkey,at:sp0};showPop(el);return}
   if(p.downPin){const id=p.downPin.dataset.pin;U.sel=id;U.pop={k:'spot',id};N().render();return}
   if(U.linkFrom){cancelLink();return}
   if(U.pop&&!(N().gm()&&U.mode==='add')){U.pop=null;showPop(el);return}
   if(N().gm()&&U.mode==='add'){const r=$('#mapInner',el).getBoundingClientRect();const x=+((e.clientX-r.left)/r.width*100).toFixed(2),y=+((e.clientY-r.top)/r.height*100).toFixed(2);if(x<0||x>100||y<0||y>100)return;addSpot(x,y,!!(e.shiftKey||U.multi))}};
  w.addEventListener('pointerup',up);w.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);pd=null;if(pts.size<2)pinch=null})}

 /* 인물 카드의 감정 · 상태 칸: 고칠 수 있으면 이모지 줄 + 한 줄 입력, 아니면 지금 상태만 */
 function stPane(x,key){const st=x.st||{};if(U.stFor!==key){U.stFor=key;U.stE=st.e||''}const cur=emoOf(st.e);
  if(!canSt(x))return st.e||st.m?`<div class="mpst ro">${cur?`<em>${cur[1]}</em>`:''}<span>${esc(st.m||cur&&cur[2]||'')}</span></div>`:'';
  return `<div class="mpst"><div class="mpemo">${EMO.map(([k,ic,n])=>`<button type="button" class="${U.stE===k?'on':''}" data-pop="stemo" data-id="${k}" title="${n}">${ic}</button>`).join('')}</div>
   <div class="mpstin"><input type="text" id="mpStIn" maxlength="40" placeholder="상태 메시지 (아이콘 위 말풍선)" value="${esc(U.stM!=null&&U.stFor===key?U.stM:(st.m||''))}"><button type="button" class="btn xs pri" data-pop="stsave" data-id="${esc(key)}">올리기</button>${st.e||st.m?`<button type="button" class="btn xs ghost" data-pop="stclear" data-id="${esc(key)}" title="말풍선 내리기">지우기</button>`:''}</div></div>`}
 /* 지도가 다시 그려져도 쓰던 글이 남게 */
 document.addEventListener('input',e=>{if(e.target&&e.target.id==='mpStIn')U.stM=e.target.value});
 document.addEventListener('keydown',e=>{if(e.target&&e.target.id==='mpStIn'&&e.key==='Enter'&&!e.isComposing){e.preventDefault();const b=document.querySelector('#mapPop [data-pop="stsave"]');if(b)b.click()}});
 async function stSave(key,clear){const x=personOf(key);if(!canSt(x))return;const inp=document.getElementById('mpStIn');const m=clear?'':String(inp?inp.value:(U.stM||'')).trim().slice(0,40);const e=clear?'':(U.stE||'');U.stM=null;
  await N().patch(x.k,x.id,d=>{if(!e&&!m)delete d.st;else d.st={e,m,at:Date.now()}});N().toast(clear||(!e&&!m)?'말풍선을 내렸어요':'지도에 올렸어요')}

 /* ---------- 지도 위 말풍선: 핀 = 장소 요약, 얼굴 = 인물 카드 ---------- */
 function popHtml(){const P=U.pop;if(!P)return '';const G=N().gm();const m0=curMap()||{};
  if(P.k==='pcx'){const x=personOf(P.id);if(!x)return '';const t=window.NT_MAKER&&NT_MAKER.trainer(x.id);const rk=(t&&t.ranks)||{};
   return `<div class="mph ent" style="--c:${x.cls==='npc'?'#8e8e8e':x.cls==='guest'?'#d9891c':'#e4002b'}"><span class="mpbig" style="${x.img?`background-image:url('${cssu(x.img)}')`:''}">${x.img?'':esc([...(x.name||'?')][0]||'?')}</span><div style="min-width:0;flex:1"><h4>${esc(x.name||'')}</h4><div class="mpm">${esc(x.sub||'')}</div></div><button type="button" class="mpx" data-pop="close" title="닫기">✕</button></div>
    ${t?`<div class="mpm">${['지시','육성','통솔','능력'].map(k=>`${k} <b>${esc(rk[k]||'-')}</b>`).join(' · ')}</div>`:''}
    ${stPane(x,P.id)}
    <div class="mpa"><span class="sp"></span><button type="button" class="btn xs" data-pop="sheet" data-id="${esc(P.id)}">시트에서 보기</button>${canPlace(x)&&P.at?`<button type="button" class="btn xs ghost" data-pop="unplace" data-id="${esc(P.id)}">이 장소에서 빼기</button>`:''}${P.at&&N().data('spots',P.at)?`<button type="button" class="btn xs ghost" data-pop="spot" data-id="${esc(P.at)}">📍 ${esc(N().data('spots',P.at).name||'')}</button>`:''}</div>`}
  if(P.k==='spot'){const s=N().data('spots',P.id);if(!s)return '';const k=kc(s.kind);const faces=peopleAt(P.id);
   return `<div class="mph" style="--c:${k[2]}"><i class="kdot" style="background:${k[2]}"></i>${s.num?`<b class="num">${esc(s.num)}</b>`:''}<h4>${esc(s.name||'장소')}</h4><button type="button" class="mpx" data-pop="close" title="닫기">✕</button></div>
    <div class="mpm">${esc(s.kind||'')}${s.area?' · '+esc(s.area):''}${N().doc('spots',P.id).vis!=='pub'?' · '+esc(N().visLabel(N().doc('spots',P.id).vis)):''}</div>
    ${s.summary?`<p class="mps">${esc(s.summary)}</p>`:'<p class="mps dim">요약이 아직 없어요.</p>'}
    ${faces.length?`<div class="mpf">${faces.map(e=>`<button type="button" class="mpface" data-pop="${e.k==='ents'?'ent':'pcx'}" data-id="${esc(e.k==='ents'?e.id:pKey(e))}" title="${esc(e.name)}" style="${e.img?`background-image:url('${cssu(e.img)}')`:''}">${e.img?'':esc([...(e.name||'?')][0]||'?')}</button>`).join('')}</div>`:''}
    ${(()=>{const ls=links().filter(l=>l.a===P.id||l.b===P.id).map(l=>N().data('spots',l.a===P.id?l.b:l.a)?{id:l.a===P.id?l.b:l.a,lid:l.id,n:N().data('spots',l.a===P.id?l.b:l.a).name}:null).filter(Boolean);const rs=N().list('routes').filter(r=>(r.steps||[]).some(x=>x.spot===P.id));
     return (ls.length?`<div class="mpl"><small>이어진 곳</small>${ls.map(x=>`<span class="lnkchip"><button type="button" class="chip xs" data-pop="spot" data-id="${esc(x.id)}">→ ${esc(x.n)}</button>${G?`<button type="button" class="lnkx" data-dellink="${esc(x.lid)}" title="이 연결 지우기">✕</button>`:''}</span>`).join('')}</div>`:'')+(rs.length?`<div class="mpl"><small>시나리오</small>${rs.map(r=>`<button type="button" class="chip xs" data-pop="route" data-id="${esc(r.id)}" style="border-color:${esc(r.color||'#888')}">${esc(r.name||'루트')} ${(r.steps||[]).findIndex(x=>x.spot===P.id)+1}단계</button>`).join('')}</div>`:'')})()}
   <div class="mpa">${G?`${N().visBadge(N().doc('spots',P.id).vis,'spots',P.id)}<button type="button" class="btn xs ${m0.party===P.id?'pri':'ghost'}" data-pop="party" data-id="${esc(P.id)}" title="PC 들이 지금 있는 곳으로 표시">${m0.party===P.id?'📍 PC 여기':'PC 위치로'}</button><button type="button" class="btn xs ghost" data-pop="link" data-id="${esc(P.id)}" title="다른 장소와 선으로 잇기">🔗 잇기</button>`:''}${window.NT_FAV?NT_FAV.btn('spots',P.id,s.name):''}<span class="sp"></span>${window.NT_DG?NT_DG.at(P.id).slice(0,2).map(d=>`<button type="button" class="btn xs" data-dgo="${esc(d.id)}" title="던전 열기">⛩ ${esc(d.n||'던전')}</button>`).join(''):''}<button type="button" class="btn xs" data-pop="detail" data-id="${esc(P.id)}">자세히</button>${G?`<button type="button" class="btn xs ghost" data-pop="editspot" data-id="${esc(P.id)}">고치기</button><button type="button" class="btn xs ghost danger" data-pop="delspot" data-id="${esc(P.id)}" title="지우기">🗑</button>`:''}</div>`}
  const e=N().data('ents',P.id);if(!e)return '';const t=window.NT_ENTS?NT_ENTS.tc(e.type):['','','#888'];const rows=(e.rows||[]).filter(r=>r.k&&r.v).slice(0,4);
  return `<div class="mph ent" style="--c:${e.color||t[2]}"><span class="mpbig" style="${e.face?`background-image:url('${cssu(e.face)}')`:''}">${e.face?'':esc((e.title||'?')[0])}</span><div style="min-width:0;flex:1"><h4>${esc(e.title||'인물')}</h4><div class="mpm">${esc(e.type||'')}${e.sub?' · '+esc(e.sub):''}</div></div><button type="button" class="mpx" data-pop="close" title="닫기">✕</button></div>
   ${e.body?`<p class="mps">${esc(e.body)}</p>`:''}
   ${rows.length?`<dl class="mpr">${rows.map(r=>`<dt>${esc(r.k)}</dt><dd>${esc(r.v)}</dd>`).join('')}</dl>`:''}
   <div class="mpa">${G?N().visBadge(N().doc('ents',P.id).vis,'ents',P.id):''}${window.NT_FAV?NT_FAV.btn('ents',P.id,e.title):''}<span class="sp"></span><button type="button" class="btn xs" data-pop="openent" data-id="${esc(P.id)}">항목에서 보기</button>${G?`<button type="button" class="btn xs ghost" data-pop="editent" data-id="${esc(P.id)}">고치기</button>`:''}${P.at&&N().data('spots',P.at)?`<button type="button" class="btn xs ghost" data-pop="spot" data-id="${esc(P.at)}">📍 ${esc(N().data('spots',P.at).name||'')}</button>`:''}</div>`}
 /* 10-26 감우: 좁은 화면(#mapWrap 너비 < 520)에서는 말풍선을 지도 안이 아니라 화면 아래 시트(body 자식, .mpop.sheet)로 띄운다 — 작은 지도를 가리지 않게. 넓은 화면은 핀 옆에 그대로. */
 const isSheet=w=>!!w&&w.getBoundingClientRect().width<520;
 function killPop(){const p=document.getElementById('mapPop');if(p)p.remove();const bg=document.getElementById('mapPopBg');if(bg)bg.remove()}
 function showPop(el){const w=$('#mapWrap',el);if(!w){killPop();return}let p=document.getElementById('mapPop');const h=popHtml();
  if(!h){killPop();return}
  const sheet=isSheet(w);const host=sheet?document.body:w;
  if(p&&p.parentElement!==host){killPop();p=null}
  if(!p){p=document.createElement('div');p.id='mapPop';p.className='mpop'+(sheet?' sheet':'');p.setAttribute('role','dialog');
   if(sheet){const bg=document.createElement('div');bg.id='mapPopBg';bg.className='mpopbg';bg.addEventListener('click',()=>popAct('close'));document.body.appendChild(bg)}
   host.appendChild(p)}
  p.innerHTML=(sheet?'<div class="mpgrip" aria-hidden="true"></div>':'')+h;p.classList.toggle('isent',U.pop.k==='ent');placePop(el)}
 function placePop(el){const p=document.getElementById('mapPop'),w=$('#mapWrap',el);if(!p||!w||!U.pop)return;
  if(p.classList.contains('sheet')){p.style.cssText='';return}
  const a=U.pop.k==='spot'?$(`.pin[data-pin="${CSS.escape(U.pop.id)}"]`,w):($(`.mnpc[data-ent="${CSS.escape(U.pop.id)}"][data-at="${CSS.escape(U.pop.at||'')}"]`,w)||$(`.mnpc[data-ent="${CSS.escape(U.pop.id)}"]`,w));
  const wr=w.getBoundingClientRect();const pw=p.offsetWidth,ph=p.offsetHeight;
  if(!a){p.style.left='8px';p.style.right='8px';p.style.top='auto';p.style.bottom='8px';p.classList.add('dock');return}
  p.classList.remove('dock');p.style.right='auto';p.style.bottom='auto';
  const r=a.getBoundingClientRect();let x=r.left-wr.left+r.width/2-pw/2,y=r.top-wr.top-ph-10;
  if(y<8)y=r.bottom-wr.top+10;x=Math.max(8,Math.min(wr.width-pw-8,x));y=Math.max(8,Math.min(wr.height-ph-8,y));
  p.style.left=x+'px';p.style.top=y+'px'}
 /* 시트(body 자식)는 #ntMain 의 클릭 처리기가 못 보니 문서에서 받는다. 지도 탭을 떠나거나 지도가 사라지면 시트도 치운다. */
 document.addEventListener('click',e=>{const p=e.target.closest('#mapPop');if(!p||p.closest('#ntMain'))return;const pa=e.target.closest('[data-pop]');if(pa){e.stopPropagation();return popAct(pa.dataset.pop,pa.dataset.id)}const dl=e.target.closest('[data-dellink]');if(dl){e.stopPropagation();return delLink(dl.dataset.dellink)}});
 new MutationObserver(()=>{if(document.getElementById('mapPop')&&!document.getElementById('mapWrap'))killPop()}).observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('resize',()=>{const p=document.getElementById('mapPop');if(!p||!U.pop)return;const el=document.getElementById('ntMain');const w=el&&$('#mapWrap',el);if(!w)return;if(isSheet(w)!==p.classList.contains('sheet'))showPop(el);else placePop(el)});
 function wheelHint(w){let seen=false;try{seen=!!sessionStorage.getItem('nt_wheelhint')}catch(e){}if(seen||$('.mapwheelhint',w))return;try{sessionStorage.setItem('nt_wheelhint','1')}catch(e){}
  const d=document.createElement('div');d.className='mapwheelhint';d.textContent='확대: Ctrl+휠 · 핀치';w.appendChild(d);setTimeout(()=>d.classList.add('on'),10);setTimeout(()=>{d.classList.remove('on');setTimeout(()=>d.remove(),300)},1800)}
 /* ---- 이어진 곳(links) 만들기 · 지우기 ---- */
 function startLink(id){if(!N().gm()||!N().data('spots',id))return;U.linkFrom=id;U.pop=null;U.mode='sel';N().toast('이을 장소를 누르세요 (Esc 취소)');N().render()}
 function cancelLink(){if(!U.linkFrom)return;U.linkFrom='';N().toast('잇기를 그만뒀어요');N().render()}
 const linkBetween=(a,b)=>links().find(l=>(l.a===a&&l.b===b)||(l.a===b&&l.b===a));
 async function finishLink(to){const from=U.linkFrom;U.linkFrom='';if(!from||to===from){N().toast('잇기를 그만뒀어요');N().render();return}
  if(linkBetween(from,to)){N().toast('이미 이어져 있어요');N().render();return}
  const ok=await N().put('links',N().uid('l'),{a:from,b:to,note:''},'gm');if(ok)N().toast(`이었어요: ${spotNm(from)} ↔ ${spotNm(to)}`)}
 async function delLink(lid){const l=N().data('links',lid);if(!l)return;if(!await N().confirmBox(`「${spotNm(l.a)||'?'}」 ↔ 「${spotNm(l.b)||'?'}」 연결을 지울까요?`,'지우기'))return;await N().del('links',lid);N().toast('연결을 지웠어요')}
 /* ---- 우클릭 · 길게 누르기 메뉴 (핀 · 얼굴) ---- */
 function visItems(kind,id){const d=N().doc(kind,id);if(!d)return [];const cur=d.vis||'pub';const o=[['pub','👥 모두에게'],['gm','🔒 GM만']].concat(N().ST.seats.map(x=>['pl:'+x.seat,'👤 '+(N().seatName(x.seat)||x.seat)+' 에게만']));
  return o.map(([v,l])=>({t:'공개 범위: '+l+(v===cur?' ✓':''),on:async()=>{if(v===cur)return;await N().put(kind,id,N().clone(d.data),v);N().toast('공개 범위: '+N().visLabel(v))}}))}
 function ctxItems(t){const G=N().gm();const m=curMap();if(!m)return [];
  if(t.classList.contains('pin')){const id=t.dataset.pin;const s=N().data('spots',id);if(!s)return [];const fav=window.NT_FAV;const items=[{t:'자세히',on:()=>popAct('detail',id)}];
   if(fav)items.push({t:(fav.has('spots',id)?'★ 즐겨찾기 빼기':'☆ 즐겨찾기'),on:()=>fav.toggle('spots',id,s.name)});
   if(!G)return items;
   items.push({t:m.party===id?'📍 PC 위치 풀기':'📍 PC 위치로',on:()=>popAct('party',id)},{t:'고치기',on:()=>editSpot(id)},{t:'🔗 잇기',on:()=>startLink(id)},'-');
   items.push(...visItems('spots',id),'-',{t:'🗑 지우기',danger:true,on:()=>delSpot(id,false)});return items}
  if(!t.dataset.ent&&t.dataset.pkey){const key=t.dataset.pkey,at=t.dataset.at;const items=[{t:'시트에서 보기',on:()=>openPerson(key)}];if(at&&canPlace(personOf(key))){const x=personOf(key);if(x&&x.pos[at])items.push({t:'자리 되돌리기 (핀 옆 줄로)',on:()=>placePos(key,at,null)});items.push('-',{t:'이 장소에서 빼기',danger:true,on:()=>placeOff(key,at)})}return items}
  const id=t.dataset.ent;const e=N().data('ents',id);if(!e)return [];const items=[{t:'항목에서 보기',on:()=>popAct('openent',id)}];
  if(window.NT_FAV)items.push({t:(NT_FAV.has('ents',id)?'★ 즐겨찾기 빼기':'☆ 즐겨찾기'),on:()=>NT_FAV.toggle('ents',id,e.title)});
  if(!G)return items;items.push({t:'고치기',on:()=>{if(window.NT_ENTS&&NT_ENTS.edit)NT_ENTS.edit(id)}});if(t.dataset.at){const x=personOf('ents:'+id);if(x&&x.pos[t.dataset.at])items.push({t:'자리 되돌리기 (핀 옆 줄로)',on:()=>placePos('ents:'+id,t.dataset.at,null)})}if(t.dataset.at)items.push({t:'이 장소에서 빼기',on:()=>placeOff('ents:'+id,t.dataset.at)});items.push('-',...visItems('ents',id));return items}
 /* 인물 열기: 항목은 항목 탭, PC · NPC 는 시트 탭 */
 function openPerson(key){const x=personOf(key);if(!x)return;if(x.k==='ents'){N().go('ents');setTimeout(()=>window.NT_ENTS&&NT_ENTS.select(x.id),0);return}if(window.NT_PC&&NT_PC.select)return NT_PC.select(x.k,x.id);N().go('pc')}
 /* 인물 놓기 창 (GM): 항목 · PC · NPC 를 찾아 이 장소에 놓는다. 「옮기기」면 이 지도의 다른 장소에서는 뺀다 */
 function placePick(sid){const s=N().data('spots',sid);const G=N().gm();if(!s||!(G||myPlaceable().length))return;let q='',kf='',move=true;
  const md=N().openModal(`<div class="mhead"><h2>${G?'인물':'내 캐릭터'} 놓기 · ${esc(s.name||'장소')}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="row" style="gap:6px;flex-wrap:wrap"><input id="ppQ" type="search" data-nodirty placeholder="이름으로 찾기" style="flex:1;min-width:160px"><div class="seg" id="ppK" ${G?'':'hidden'}><button data-k="" class="on">전체</button><button data-k="c:pc">PC</button><button data-k="c:guest">객원</button><button data-k="c:npc">NPC</button><button data-k="ents">인물 항목</button></div></div>
   <label class="small" style="display:flex;gap:6px;align-items:center;margin:8px 0 4px"><input type="checkbox" id="ppMv" data-nodirty checked> 옮기기 — 이 지도의 다른 장소에서는 빼요 (끄면 여러 곳에 함께 둬요)</label>
   <div class="pplist" id="ppL"></div>`,'');
  const draw=()=>{const s2=q.trim().toLowerCase();const L=people().filter(canPlace).filter(x=>(!kf||(kf.startsWith('c:')?x.k!=='ents'&&x.cls===kf.slice(2):x.k===kf))&&(!s2||(x.name||'').toLowerCase().includes(s2)));
   $('#ppL',md).innerHTML=L.length?L.map(x=>{const here=x.at.includes(sid);const other=x.at.filter(a=>a!==sid&&N().data('spots',a)).map(spotNm);return `<button type="button" class="pprow ${here?'on':''}" data-pp="${esc(pKey(x))}">${faceBtn(x,'ppf','span')}<span class="ppb"><b>${esc(x.name||'(이름 없음)')}</b><small>${esc(x.sub||'')}${other.length?' · 📍 '+esc(other.slice(0,2).join(', ')):''}</small></span><u>${here?'✓ 여기 있음':'놓기'}</u></button>`}).join(''):'<div class="small dim" style="padding:8px 2px">찾는 인물이 없어요. 인물 항목(자료 탭) · PC · NPC 시트가 여기 떠요.</div>'};
  draw();$('#ppQ',md).addEventListener('input',e=>{q=e.target.value;draw()});$('#ppMv',md).onchange=e=>{move=e.target.checked};
  $('#ppK',md).addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;kf=b.dataset.k;$$('#ppK button',md).forEach(x=>x.classList.toggle('on',x===b));draw()});
  $('#ppL',md).addEventListener('click',async e=>{const b=e.target.closest('[data-pp]');if(!b)return;const key=b.dataset.pp;const x=personOf(key);if(!canPlace(x))return;
   if(x.at.includes(sid))await placeOff(key,sid);else await placeMove(key,sid,!move);setTimeout(draw,60)})}
 async function popAct(k,id){const el=document.getElementById('ntMain')||document;
  if(k==='close'){U.pop=null;killPop();return}
  if(k==='link')return startLink(id);
  if(k==='ent'){U.pop={k:'ent',id,at:U.pop&&U.pop.k==='spot'?U.pop.id:''};showPop(el);return}
  if(k==='pcx'){U.pop={k:'pcx',id,at:U.pop&&U.pop.k==='spot'?U.pop.id:''};showPop(el);return}
  if(k==='sheet'){U.pop=null;killPop();return openPerson(id)}
  if(k==='stemo'){const i=document.getElementById('mpStIn');U.stM=i?i.value:null;U.stE=U.stE===id?'':id;showPop(el);const j=document.getElementById('mpStIn');if(j){j.focus();j.setSelectionRange(j.value.length,j.value.length)}return}
  if(k==='stsave'||k==='stclear'){await stSave(id,k==='stclear');if(k==='stclear')U.stE='';showPop(el);return}
  if(k==='unplace'){const at=U.pop&&U.pop.at;U.pop=at?{k:'spot',id:at}:null;if(at)await placeOff(id,at);showPop(el);return}
  if(k==='spot'||k==='detail'){U.sel=id;U.pop=k==='spot'?{k:'spot',id}:U.pop;N().render();if(k==='detail'){const sd=document.getElementById('mapSide');if(sd){const r=sd.getBoundingClientRect();if(r.top>innerHeight-80||r.bottom<0)sd.scrollIntoView({behavior:'smooth',block:'start'});sd.classList.add('flash');setTimeout(()=>sd.classList.remove('flash'),900)}}return}
  if(k==='party'){const m=curMap();if(!m)return;await N().patch('maps',m.id,x=>{x.party=x.party===id?'':id});return}
  if(k==='route'){U.pop=null;N().go('scen');setTimeout(()=>{const c=document.querySelector(`.fcard[data-route="${CSS.escape(id)}"],.lane[data-route="${CSS.escape(id)}"]`);if(c){c.scrollIntoView({behavior:'smooth',block:'center'});c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),1200)}},60);return}
  if(k==='editspot')return editSpot(id);
  if(k==='delspot')return delSpot(id,false);
  if(k==='openent'){U.pop=null;N().go('ents');setTimeout(()=>window.NT_ENTS&&NT_ENTS.select(id),0);return}
  if(k==='editent'){if(window.NT_ENTS&&NT_ENTS.edit)NT_ENTS.edit(id);return}}
 document.addEventListener('keydown',e=>{if(e.key!=='Escape'||document.querySelector('.modalbg,.ntctx'))return;if(U.linkFrom&&N().ST.view==='map'){cancelLink();return}if(U.pop){U.pop=null;killPop()}});
 /* quick=true(Shift+클릭 · 연속 찍기): 편집 창을 안 열고 「장소 찍기」 모드에 남는다 */
 async function addSpot(x,y,quick){const m=curMap();const n=spots(m.id).length+1;const id=N().uid('s');const ok=await N().put('spots',id,{map:m.id,x,y,name:quick?'장소 '+n:'새 장소',num:String(n),kind:'대화',area:'',summary:'',items:'',img:'',imgs:[]},'gm');if(!ok)return;
  if(quick){N().toast(`장소 ${n} 추가 — ${U.multi?'「연속 찍기」를 끄면 끝':'Shift 떼면 끝'}`);return}
  U.sel=id;U.mode='sel';U.multi=false;N().render();editSpot(id)}
 async function act(k){const m=curMap();
  if(k==='newmap'){const name=await N().promptBox('지도 이름','','예: 무진 전체');if(name==null)return;const id=N().uid('m');await N().put('maps',id,{name:name.trim()||'지도',img:'',w:0,h:0,order:maps().length,d:''});U.map=id;U.fitDone=false;N().render();editMap(id);return}
  if(k==='mapedit')return editMap(m.id);
  if(k==='maporder')return orderMaps();
  if(k==='link')return startLink(U.sel);
  if(k==='linkcancel')return cancelLink();
  if(k==='place')return placePick(U.sel);
  if(k==='edit')return editSpot(U.sel);
  if(k==='delspot')return delSpot(U.sel,false);
  if(k==='party'){await N().patch('maps',m.id,x=>{x.party=x.party===U.sel?'':U.sel});return}}
 function editMap(id){const m=N().data('maps',id);if(!m)return;const md=N().openModal(`<div class="mhead"><h2>지도 설정</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="mrow"><label class="lbl">이름<input id="mpName" type="text" value="${esc(m.name||'')}"></label><label class="lbl">순서<input id="mpOrd" type="number" class="n" value="${m.order||0}"></label><label class="lbl">공개${N().visSelect(N().doc('maps',id).vis,'mpVis',{noPl:true})}</label></div>
   <label class="lbl">설명<textarea id="mpD" rows="2">${esc(m.d||'')}</textarea></label>
   <div class="mrow"><label class="lbl">종류<select id="mpKind"><option value="" ${m.kind!=='globe'?'selected':''}>그림 지도 (핀 · 루트)</option><option value="globe" ${m.kind==='globe'?'selected':''}>지구본 · 관측실 (위도 · 경도 특이점)</option></select></label><label class="lbl" style="grid-column:span 2">특이점 번호 목록 <small class="dim">(지구본용 · 쉼표로 · 빈 번호는 「미관측」 가림막)</small><input id="mpSlots" type="text" value="${esc((m.slots||[]).join(', '))}" placeholder="예: 序, I, II, III, IV, V, VI, VII, EX"></label></div>
   <div class="sec">지도 그림 <small class="dim">(지구본이면 안 써요)</small></div><div class="updz" id="mpDz"><div class="pv" style="${m.img?`background-image:url('${cssu(m.img)}')`:''}"></div><b>＋ 그림 올리기</b><span>끌어 놓기 · 클릭 · Ctrl+V — 올릴 때 3200px 안으로 줄여요</span></div>
   <div class="row" style="margin-top:8px"><input type="text" id="mpImg" placeholder="또는 그림 주소 https://…" value="${esc(m.img||'')}" style="flex:1">${spots(id).length?'<button type="button" class="btn sm" id="mpAlign" title="그림을 옮기고 키워 지금 핀 자리에 맞춰요 (새 그림이면 그 그림으로)">📐 핀에 맞추기</button>':''}</div>
   ${spots(id).length?`<p class="small dim" style="margin:4px 0 0">그림을 바꾸면 저장할 때 「핀에 맞추기」 창이 떠요 — 새 그림을 끌고 키워 지금 장소 ${spots(id).length}곳 자리에 맞춰요.</p>`:''}
   ${spots(id).length&&m.kind!=='globe'?`<div class="sec">장소 배경 <small class="dim" id="mpBgN"></small></div><div class="updz" id="mpBgDz"><b>＋ 배경 여러 장 한꺼번에</b><span>파일 이름 앞 번호(01_정문…)나 장소 이름으로 알아서 맞춰 넣어요 · 칸을 누르면 그 장소만</span></div><div class="mpbgs" id="mpBgs"></div>`:''}
   <div class="row" style="margin-top:14px"><button class="btn danger ghost sm" id="mpDel">지도 지우기</button><span class="sp"></span><button class="btn pri" id="mpOk">저장</button></div>`);
  N().bindDrop($('#mpDz',md),async fs=>{try{const u=await N().upload(fs[0],'map','map');$('#mpImg',md).value=u;$('#mpDz .pv',md).style.backgroundImage=`url('${cssu(u)}')`}catch(e){N().toast('올리기 실패: '+e.message)}});
  /* 10-29 망령 「지도에 배경 넣기 기능이랑 뽑아둔 배경 알맞게 넣어두기」: 장소마다 s.bg (웹툴 무대 배경) — 여러 장을 한 번에 받아 번호 · 이름으로 맞춘다 */
  const bgBox=$('#mpBgs',md);if(bgBox){const nk=x=>String(x||'').replace(/\.[a-z0-9]+$/i,'').replace(/^\d+[_\s.-]*/,'').replace(/[\s_·・()（）\-]/g,'').toLowerCase();
   const draw=()=>{const L=spots(id).slice().sort((a,b)=>(parseFloat(a.num)||999)-(parseFloat(b.num)||999));$('#mpBgN',md).textContent=`(장소 ${L.length}곳 중 ${L.filter(s=>s.bg).length}곳 · 웹툴 「지도 가져오기」 때 핀 배경이 돼요)`;
    bgBox.innerHTML=L.map(s=>`<button type="button" class="mpbg${s.bg?' on':''}" data-sid="${esc(s.id)}" title="${esc(s.name||'')} — 눌러서 이 장소 배경 고르기"><i style="${s.bg?`background-image:url('${cssu(s.bg)}')`:''}"></i><span>${s.num?`<b>${esc(s.num)}</b> `:''}${esc(s.name||'')}</span>${s.bg?'<em data-bgx title="배경 빼기">✕</em>':''}</button>`).join('')};
   const setBg=async(sid,u)=>{await N().patch('spots',sid,d=>{if(u){d.bg=u;d.bgName=d.name||''}else{delete d.bg;delete d.bgName}})};
   const match=f=>{const L=spots(id);const mm=/^(\d+)[_\s.-]/.exec(f.name||'');if(mm){const s=L.find(s=>parseFloat(s.num)===+mm[1]);if(s)return s}const k=nk(f.name);if(!k)return null;return L.find(s=>nk(s.name)===k)||L.find(s=>{const n=nk(s.name);return n&&(n.includes(k)||k.includes(n))})||null};
   N().bindDrop($('#mpBgDz',md),async fs=>{let ok=0;const miss=[];for(const f of fs){const s=match(f);if(!s){miss.push(f.name);continue}try{await setBg(s.id,await N().upload(f,'photo','spotbg'));ok++}catch(e){miss.push(f.name)}}draw();N().toast(`배경 ${ok}곳 넣었어요${miss.length?` · 못 맞춘 것 ${miss.length}장: ${miss.slice(0,3).join(', ')}${miss.length>3?' …':''}`:''}`)},true);
   bgBox.addEventListener('click',async e=>{const b=e.target.closest('.mpbg');if(!b)return;const sid=b.dataset.sid;if(e.target.closest('[data-bgx]')){await setBg(sid,'');return draw()}
    const fi=document.createElement('input');fi.type='file';fi.accept='image/*';fi.onchange=async()=>{const f=fi.files&&fi.files[0];if(!f)return;try{await setBg(sid,await N().upload(f,'photo','spotbg'));draw()}catch(er){N().toast('올리기 실패: '+er.message)}};fi.click()});
   draw()}
  const al=$('#mpAlign',md);if(al)al.onclick=()=>{const img=$('#mpImg',md).value.trim()||m.img;if(!img)return N().toast('그림을 먼저 넣어요');alignMap(id,img)};
  $('#mpOk',md).onclick=async()=>{const img=$('#mpImg',md).value.trim();if(img&&m.img&&img!==m.img&&spots(id).length&&$('#mpKind',md).value!=='globe'){const nm=$('#mpName',md).value.trim()||'지도';await N().patch('maps',id,d=>{d.name=nm;d.order=+$('#mpOrd',md).value||0;d.d=$('#mpD',md).value.trim()});return alignMap(id,img)}let w=m.w||0,h=m.h||0;if(img&&img!==m.img){try{const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=img});w=im.naturalWidth;h=im.naturalHeight}catch(e){}}
   await N().put('maps',id,Object.assign({},m,{name:$('#mpName',md).value.trim()||'지도',order:+$('#mpOrd',md).value||0,d:$('#mpD',md).value.trim(),img,w,h,kind:$('#mpKind',md).value,slots:$('#mpSlots',md).value.split(/[,，]/).map(x=>x.trim()).filter(Boolean)}),$('#mpVis',md).value);N().closeModal();U.fitDone=false;N().render()};
  $('#mpDel',md).onclick=async()=>{if(!await N().confirmBox(`「${m.name}」 지도를 지울까요? 이 지도의 장소 ${spots(id).length}곳도 같이 지워져요.`,'지우기'))return;for(const s of spots(id))await N().del('spots',s.id);await N().del('maps',id);N().closeModal();U.map='';U.sel='';N().render()}}
 /* ---------- 핀에 맞추기 (10-29 망령 「미사그 대학 지도에 배경 이미지 넣는 기능이랑 위치에 맞게 넣게」) ----------
    지금 지도 틀(옛 그림 비율) 위에 핀을 그대로 두고, 새 그림을 끌어 옮기고(드래그) 키워(휠 · 막대) 핀 자리에 맞춘다.
    저장하면 그림을 바꾸고, 장소 x · y 와 인물 자유 자리(atPos)를 새 그림 기준 % 로 다시 셈한다. 옛 그림을 흐리게 깔아 비교할 수 있다 */
 async function alignMap(mid,img){const m=N().data('maps',mid);if(!m)return;const sp=spots(mid);
  let nw=0,nh=0;try{const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=img});nw=im.naturalWidth;nh=im.naturalHeight}catch(e){return N().toast('그림을 읽지 못했어요')}
  const W=+m.w||nw,H=+m.h||nh;const ar=nh/nw;
  /* A = 새 그림 자리 (틀 기준 비율): left · top · width(틀 너비 대비) */
  const A={l:0,t:0,s:1,op:.75,old:true};if(img===m.img){A.op=1;A.old=false}else{const fit=Math.min(1,(H/W)/ar);A.s=fit;A.l=(1-fit)/2;A.t=(H/W-fit*ar)/2/(H/W)}
  const md=N().openModal(`<div class="mhead"><h2>📐 핀에 맞추기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <p class="small dim" style="margin:0 0 8px">그림을 끌어 옮기고, 휠이나 아래 막대로 크기를 바꿔 핀(장소 ${sp.length}곳)이 제자리에 오게 맞춰요. 저장하면 핀 자리를 새 그림 기준으로 다시 적어요.</p>
   <div class="malw"><div class="malst" id="alSt" style="aspect-ratio:${W}/${H};width:min(100%,calc(66dvh * ${(W/H).toFixed(4)}))">${m.img&&img!==m.img?`<img class="malold" src="${esc(m.img)}" alt="" draggable="false">`:''}<img class="malnew" id="alImg" src="${esc(img)}" alt="" draggable="false">
    ${sp.map(x=>`<i class="malpin" style="left:${x.x}%;top:${x.y}%" title="${esc(x.name||'')}"><b>${esc(x.num||'')}</b><span>${esc(x.name||'')}</span></i>`).join('')}</div></div>
   <div class="malc"><label>크기 <input type="range" id="alS" min="20" max="400" step="1" value="${Math.round(A.s*100)}"><b id="alSv"></b></label>${img!==m.img?`<label>새 그림 진하기 <input type="range" id="alOp" min="20" max="100" value="${Math.round(A.op*100)}"></label><label class="row small"><input type="checkbox" id="alOld" checked> 옛 그림 깔기</label>`:''}<label class="row small"><input type="checkbox" id="alNm" checked> 장소 이름</label>
    <span class="sp"></span><button type="button" class="btn sm ghost" id="alFit">틀에 맞추기</button><button type="button" class="btn sm ghost" id="alWide">너비 맞추기</button><button type="button" class="btn pri" id="alOk">저장</button></div>`,'wide malm');
  const st=$('#alSt',md),im=$('#alImg',md);
  const draw=()=>{const k=H/W;im.style.left=A.l*100+'%';im.style.width=A.s*100+'%';im.style.top=(A.t*100)+'%';im.style.opacity=A.op;const o=$('.malold',md);if(o)o.style.display=A.old?'':'none';$('#alSv',md).textContent=Math.round(A.s*100)+'%';$('#alS',md).value=Math.round(A.s*100);void k};
  /* top 은 틀 높이 기준 % 라서, 그림 높이(틀 높이 대비) = s*ar*W/H */
  const hRel=()=>A.s*ar*W/H;
  const zoomAt=(ns,cx,cy)=>{ns=Math.max(.2,Math.min(4,ns));A.l=cx-(cx-A.l)*ns/A.s;A.t=cy-(cy-A.t)*ns/A.s;A.s=ns;draw()};
  draw();
  $('#alS',md).oninput=e=>zoomAt(+e.target.value/100,A.l+A.s/2,A.t+hRel()/2);
  const op=$('#alOp',md);if(op)op.oninput=e=>{A.op=+e.target.value/100;draw()};const ol=$('#alOld',md);if(ol)ol.onchange=e=>{A.old=e.target.checked;draw()};
  $('#alNm',md).onchange=e=>st.classList.toggle('nonm',!e.target.checked);
  $('#alFit',md).onclick=()=>{const fit=Math.min(1,(H/W)/ar);A.s=fit;A.l=(1-fit)/2;A.t=(1-hRel())/2;draw()};
  $('#alWide',md).onclick=()=>{A.s=1;A.l=0;A.t=(1-hRel())/2;draw()};
  st.addEventListener('wheel',e=>{e.preventDefault();const r=st.getBoundingClientRect();zoomAt(A.s*(e.deltaY<0?1.06:1/1.06),(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)},{passive:false});
  let dg=null;st.addEventListener('pointerdown',e=>{if(e.button!==0)return;dg={x:e.clientX,y:e.clientY,l:A.l,t:A.t,id:e.pointerId};try{st.setPointerCapture(e.pointerId)}catch(x){}st.classList.add('grab')});
  st.addEventListener('pointermove',e=>{if(!dg)return;const r=st.getBoundingClientRect();A.l=dg.l+(e.clientX-dg.x)/r.width;A.t=dg.t+(e.clientY-dg.y)/r.height;draw()});
  const end=()=>{dg=null;st.classList.remove('grab')};st.addEventListener('pointerup',end);st.addEventListener('pointercancel',end);
  /* 틀 % → 새 그림 % */
  const conv=(x,y)=>({x:+((x/100-A.l)/A.s*100).toFixed(2),y:+((y/100-A.t)/hRel()*100).toFixed(2)});
  $('#alOk',md).onclick=async()=>{const out=sp.map(x=>({x,p:conv(x.x,x.y)}));const bad=out.filter(o=>o.p.x<0||o.p.x>100||o.p.y<0||o.p.y>100);
   if(bad.length&&!await N().confirmBox(`장소 ${bad.length}곳이 새 그림 밖에 있어요 (${bad.slice(0,4).map(o=>o.x.name).join(', ')}${bad.length>4?' …':''}). 가장자리에 붙여 저장할까요?`,'저장'))return;
   const b=$('#alOk',md);b.disabled=true;b.textContent='저장 중…';const cl=v=>Math.max(0,Math.min(100,v));const ids=new Set(sp.map(x=>x.id));
   try{await N().patch('maps',mid,d=>{d.img=img;d.w=nw;d.h=nh});
    for(const o of out)await N().patch('spots',o.x.id,d=>{d.x=cl(o.p.x);d.y=cl(o.p.y)});
    for(const x of people())if(Object.keys(x.pos||{}).some(k=>ids.has(k)))await N().patch(x.k,x.id,d=>{const P=Object.assign({},d.atPos||{});for(const k of Object.keys(P))if(ids.has(k)){const q=conv(P[k].x,P[k].y);P[k]={x:cl(q.x),y:cl(q.y)}}d.atPos=P});
    N().closeModal(true);U.fitDone=false;N().render();N().toast(`그림을 바꾸고 장소 ${out.length}곳을 맞췄어요`)}catch(e){b.disabled=false;b.textContent='저장';N().toast('저장 실패: '+e.message)}}}
 /* 지도 순서: 줄을 끌어서(모바일도) 바꾸고, ▲▼ 로도 */
 function orderMaps(){const L=maps();if(L.length<2)return N().toast('지도가 하나뿐이에요');
  const row=x=>`<div class="morow" data-id="${esc(x.id)}"><span class="grip" data-drag title="끌어서 옮기기">⋮⋮</span><b>${esc(x.name||'지도')}</b><small class="dim">${x.kind==='globe'?'지구본':spots(x.id).length+'곳'}</small><span class="sp"></span><button type="button" class="btn xs ghost" data-mv="-1" title="위로">▲</button><button type="button" class="btn xs ghost" data-mv="1" title="아래로">▼</button></div>`;
  const md=N().openModal(`<div class="mhead"><h2>지도 순서</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><p class="small dim" style="margin:0 0 8px">줄을 끌거나 ▲▼ 를 눌러 순서를 바꿔요. 바꾸는 대로 저장돼요.</p><div class="molist" id="moList" data-nodirty>${L.map(row).join('')}</div>`);
  const box=$('#moList',md);const save=()=>N().reorder('maps',$$('.morow',box).map(r=>r.dataset.id));
  N().sortable(box,'.morow',save);
  box.addEventListener('click',e=>{const b=e.target.closest('[data-mv]');if(!b)return;const r=b.closest('.morow');const d=+b.dataset.mv;const o=d<0?r.previousElementSibling:r.nextElementSibling;if(!o)return;if(d<0)box.insertBefore(r,o);else box.insertBefore(o,r);save()})}
 function editSpot(id){const s=N().data('spots',id);if(!s)return;const sec=N().data('sec','spot:'+id)||{};const GL=(N().data('maps',s.map)||{}).kind==='globe';const LF=(N().MOD.logs&&N().MOD.logs.folders())||[];
  const md=N().openModal(`<div class="mhead"><h2>${GL?'특이점 고치기':'장소 고치기'}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div>
   <div class="mrow"><label class="lbl">${GL?'특이점 번호':'번호'}<input id="spNum" type="text" value="${esc(s.num||'')}" style="width:70px"></label><label class="lbl" style="grid-column:span 2">이름<input id="spName" type="text" value="${esc(s.name||'')}"></label>
    ${GL?`<label class="lbl">상태<select id="spStatus">${[['active','진행 중'],['cleared','수복 완료'],['unobserved','미관측']].map(([v,l])=>`<option value="${v}" ${(s.status||'active')===v?'selected':''}>${l}</option>`).join('')}</select></label><label class="lbl">상태 글자 <small class="dim">(비우면 기본)</small><input id="spLabel" type="text" value="${esc(s.label||'')}" placeholder="예: 월륜공전"></label><label class="lbl">장소<input id="spArea" type="text" value="${esc(s.area||'')}" placeholder="예: 해양유전기지 세라픽스"></label><label class="lbl">연대<input id="spYear" type="text" value="${esc(s.year||'')}" placeholder="예: 2015"></label><label class="lbl">위도<input id="spLat" type="number" step="0.1" min="-90" max="90" value="${esc(s.y)}"></label><label class="lbl">경도<input id="spLon" type="number" step="0.1" min="-180" max="180" value="${esc(s.x)}"></label><label class="lbl">기록 폴더 <small class="dim">(정리기 보관소)</small><select id="spLogf"><option value="">— 없음 —</option>${LF.map(f=>`<option value="${esc(f.id)}" ${f.id===s.logf?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label>`:`<label class="lbl">종류<select id="spKind">${KINDS.map(([k])=>`<option ${k===s.kind?'selected':''}>${k}</option>`).join('')}</select></label><label class="lbl">구역<input id="spArea" type="text" value="${esc(s.area||'')}" placeholder="예: 마을 북서쪽"></label>`}<label class="lbl">공개${N().visSelect(N().doc('spots',id).vis,'spVis',{noPl:true})}</label></div>
   <label class="lbl">${GL?'공개 기록 <small class="dim">(줄마다 한 항목으로 보여요)</small>':'요약'}<textarea id="spSum" rows="4">${esc(s.summary||'')}</textarea></label>
   <label class="lbl" style="margin-top:6px">얻을 것 · 아이템<input id="spItems" type="text" value="${esc(s.items||'')}"></label>
   ${GL?'':(()=>{const others=spots(s.map).filter(x=>x.id!==id).sort((a,b)=>String(a.num||'').localeCompare(String(b.num||''),'ko',{numeric:true}));return `<div class="sec">이어진 곳 <small class="dim">(체크한 장소와 선으로 이어요)</small></div><div class="lnkchk" id="spLinks">${others.length?others.map(o=>`<label><input type="checkbox" value="${esc(o.id)}" ${linkBetween(id,o.id)?'checked':''}><i class="kdot" style="background:${kc(o.kind)[2]}"></i>${o.num?`<b>${esc(o.num)}</b> `:''}${esc(o.name||'')}</label>`).join(''):'<span class="small dim">이 지도에 다른 장소가 없어요.</span>'}</div>`})()}
   <div class="sec">그림</div><div class="row" style="align-items:stretch"><div class="updz" id="spDz" style="width:150px"><div class="pv" style="${s.img?`background-image:url('${cssu(s.img)}')`:''}"></div><b>대표 그림</b></div>
    <div style="flex:1;min-width:200px"><div id="spImgs">${(s.imgs||[]).map((x,i)=>`<div class="row spimgrow" data-i="${i}"><img src="${esc(x.p)}" alt=""><input type="text" data-t value="${esc(x.t||'')}" placeholder="설명" style="flex:1"><button class="btn xs ghost danger" data-del>×</button></div>`).join('')}</div><div class="updz" id="spDz2" style="min-height:44px"><b>＋ 그림 더하기</b><span>여러 장 가능</span></div></div></div>
   ${GL?'':`<div class="sec">배경 <small class="dim">(웹툴 「지도 가져오기」 때 이 장소 핀의 배경이 돼요 · 파티가 오면 무대 배경이 바뀌어요)</small></div><div class="row" style="align-items:stretch"><div class="updz spbgdz" id="spBgDz"><div class="pv" style="${s.bg?`background-image:url('${cssu(s.bg)}')`:''}"></div><b>배경 그림</b><span>끌어 놓거나 눌러서</span></div><div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:6px"><input type="text" id="spBg" placeholder="또는 그림 주소 https://…" value="${esc(s.bg||'')}"><div class="row" style="gap:6px"><button type="button" class="btn xs ghost" id="spBgX">배경 빼기</button></div></div></div>`}
   <div class="sec">GM 메모 <span class="dim">(GM 에게만)</span></div><textarea id="spSec" rows="3">${esc(sec.t||'')}</textarea>
   <div class="row" style="margin-top:14px"><button class="btn danger ghost sm" id="spDel">장소 지우기</button><span class="sp"></span><button class="btn pri" id="spOk">저장</button></div>`);
  const imgs=N().clone(s.imgs||[]);let img=s.img||'';
  const drawImgs=()=>{$('#spImgs',md).innerHTML=imgs.map((x,i)=>`<div class="row spimgrow" data-i="${i}"><img src="${esc(x.p)}" alt=""><input type="text" data-t value="${esc(x.t||'')}" placeholder="설명" style="flex:1"><button class="btn xs ghost danger" data-del>×</button></div>`).join('');
   $$('.spimgrow',md).forEach(r=>{r.querySelector('[data-t]').oninput=e=>imgs[+r.dataset.i].t=e.target.value;r.querySelector('[data-del]').onclick=()=>{imgs.splice(+r.dataset.i,1);drawImgs()}})};
  drawImgs();
  N().bindDrop($('#spDz',md),async fs=>{try{img=await N().upload(fs[0],'thumb','spot');$('#spDz .pv',md).style.backgroundImage=`url('${cssu(img)}')`}catch(e){N().toast('올리기 실패: '+e.message)}});
  N().bindDrop($('#spDz2',md),async fs=>{for(const f of fs){try{imgs.push({p:await N().upload(f,'photo','spot'),t:''})}catch(e){N().toast('올리기 실패: '+e.message)}}drawImgs()},true);
  if($('#spBgDz',md)){const pvBg=u=>{$('#spBgDz .pv',md).style.backgroundImage=u?`url('${cssu(u)}')`:''};
   N().bindDrop($('#spBgDz',md),async fs=>{try{const u=await N().upload(fs[0],'photo','spotbg');$('#spBg',md).value=u;pvBg(u)}catch(e){N().toast('올리기 실패: '+e.message)}});
   $('#spBg',md).oninput=e=>pvBg(e.target.value.trim());$('#spBgX',md).onclick=()=>{$('#spBg',md).value='';pvBg('')}}
  $('#spOk',md).onclick=async()=>{const n=Object.assign({},s,{num:$('#spNum',md).value.trim(),name:$('#spName',md).value.trim()||'장소',kind:GL?(s.kind||'사건'):$('#spKind',md).value,area:$('#spArea',md).value.trim(),summary:$('#spSum',md).value.trim(),items:$('#spItems',md).value.trim(),img,imgs});if(!GL){const bg=($('#spBg',md)?$('#spBg',md).value:'').trim();if(bg){n.bg=bg;if(bg!==s.bg)delete n.bgName}else{delete n.bg;delete n.bgName}}if(GL){n.status=$('#spStatus',md).value;n.label=$('#spLabel',md).value.trim();n.year=$('#spYear',md).value.trim();n.y=+$('#spLat',md).value||0;n.x=+$('#spLon',md).value||0;n.logf=$('#spLogf',md).value}
   await N().put('spots',id,n,$('#spVis',md).value);const t=$('#spSec',md).value.trim();if(t)await N().put('sec','spot:'+id,{t},'gm');else if(N().doc('sec','spot:'+id))await N().del('sec','spot:'+id);
   /* 이어진 곳 체크 상태에 맞춰 links 를 만들고 지운다 */
   for(const cb of $$('#spLinks input[type=checkbox]',md)){const o=cb.value;const had=linkBetween(id,o);if(cb.checked&&!had)await N().put('links',N().uid('l'),{a:id,b:o,note:''},'gm');else if(!cb.checked&&had)for(const l of links().filter(l=>(l.a===id&&l.b===o)||(l.a===o&&l.b===id)))await N().del('links',l.id)}
   N().closeModal()};
  $('#spDel',md).onclick=()=>delSpot(id,true)}
 async function delSpot(id,inModal){const s=N().data('spots',id);if(!s)return;if(!await N().confirmBox(`「${s.name}」 를 지울까요? 이어진 선도 같이 지워져요.`,'지우기'))return;for(const l of links().filter(l=>l.a===id||l.b===id))await N().del('links',l.id);await N().del('spots',id);if(N().doc('sec','spot:'+id))await N().del('sec','spot:'+id);U.sel='';U.pop=null;if(inModal)N().closeModal();N().toast('지웠어요')}

 N().MOD.map={render};
 window.NT_MAP={KINDS,selectMap:id=>{U.map=id;U.sel='';U.fitDone=false},select:id=>{const s=N().data('spots',id);if(s){U.map=s.map;U.sel=id;U.fitDone=false;const mm=N().data('maps',s.map);if(mm&&mm.kind==='globe'&&window.NT_GLOBE&&NT_GLOBE.pick)NT_GLOBE.pick(id)}},curMap,spots};
 N().MOD.map=Object.assign(N().MOD.map||{},{editSpot,editMap,curMap,mapSelHtml});
})();
