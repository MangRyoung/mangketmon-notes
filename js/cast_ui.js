/* ---------- 시나리오 「조직」 (11-13 망령 「세션 노트 시나리오 쪽에 그룹들을 시각적으로 정리하고 이미지를 넣어서 배치」) ----------
   NPC 를 세 명씩 한 그룹(조직)으로 묶어 사건마다 놓는다 — 사건 1 = 학교 · 사건 2 · 3 = 조직 둘씩 (망령 11-13 07:56 · 07:59).
   그림을 넣고 간단한 설정을 먼저 적어 보는 스케치 판. 학장 · 선생들은 따로(여기 넣지 않아도 된다).
   · kind 'grp' — 그룹 하나 = 문서 하나 (GM만)
     {order, arc(사건 arcs id | ''), name, color, line(한 줄), desc(간단 설정), place(커뮤 장소), note, ent(조직 항목 id), hold:[단서 — 사건 미정일 때 맡아 둠],
      mem:[{id, name, role(face | info | con | ''), img(그림 주소), line(한 줄), note(설정), ent(인물 항목 id), npc(NPC 시트 id)}]}
   · 판: 사건(도안의 큰 사건)마다 한 열 + 「사건 미정」 열. 그룹 카드 = 머리(이름 · 한 줄) + 인물 칸(최소 3) + 설정 + 단서.
   · 그림: 인물 칸에 그림 파일을 끌어 놓거나, 옆 창의 그림 칸을 눌러 올린다(Supabase 저장소 · webp 로 줄임 · 투명 유지).
   · 고치기는 오른쪽 옆 창(도안과 같은 모양) — 칸을 고치면 바로 저장.
   11-13 08:12 망령 「드래그로 옮기거나 인물 추가 · 수정 · 클릭해서 상세 편집도 쉬워야 · 그룹별로 카드나 단서도 만들어서 기존 기능들과 연동」:
   · 서랍: 자료의 「인물」 항목 · NPC 시트를 끌어 인물 칸 · 그룹에 놓는다(그림 · 이름을 그쪽에서 가져온다).
   · 끌기: 인물 → 다른 칸 · 다른 그룹(그 칸 앞에) / 빈 칸 · 그룹 / 그룹 머리 → 다른 그룹 앞 · 다른 사건 열. 휴대폰은 길게 눌러 메뉴.
   · 판에서 바로: 이름을 두 번 누르면 그 자리에서 고치기 · 우클릭(길게 누르기) 메뉴 — 역할 · 카드 · 단서 · 옮기기 · 지우기.
   · 카드 = 자료 탭 항목(GM만): 인물 → 「인물」 항목(얼굴 = 그림 · 소속 = 그룹 이름), 그룹 → 「조직」 항목. 관계도 · 도안 서랍 · 검색 · 웹툴 무대가 그 항목을 쓴다.
     그룹이 사건에 놓여 있으면 만든 항목을 도안의 그 사건 「관련 항목」에도 넣는다.
   · 단서 = 도안 사건 단서에 grp(그룹 id) · who(인물 id) 를 달아 같이 쓴다 → 도안 · 웹툴(🔍 지금 공개 · 📥 보관 목록 · 찾음 맞추기)과 그대로 이어진다.
     그룹을 다른 사건으로 옮기면 단서도 따라간다. 사건 미정으로 빼면 그룹이 맡아 둔다(hold).
   11-13 08:15 망령 「조직별 설정 · 인물 설정도 적어 놓은 뒤에 그걸 공개로 전환하면 세션 노트 항목 칸에 나오게」:
   · 칸을 둘로 나눈다 — 「공개 소개」(pub, PL 에게 보일 글) / 「GM 설정」(desc · note, 공개해도 절대 안 나감). 비밀은 GM 설정에만(71 규칙).
   · 「👁 공개로」 = 카드(항목)를 만들거나 이어서 이름 · 그림 · 소속 · 공개 소개만 적고 vis 'pub' 로. 「🔒 GM만」 = 다시 vis 'gm'.
     항목에 직접 적은 칸이 차 있으면 공개 전에 알린다. 공개 중인 카드는 이름 · 그림 · 공개 소개를 고치면 저절로 맞춘다.
   · 「▶ 웹툴 무대로」: 인물 카드(항목)가 있는 인물 셋까지 웹툴 방 무대에 세운다(NT_PHONE.sendScene — 시나리오 단계와 같은 길). */
"use strict";
(()=>{
 const N=()=>window.NT;const {$$,esc}=window.NT;
 const PAL=['#e11d48','#1e88e5','#00a676','#8e44ad','#f08a00','#26c6da','#8d6e63','#d4a017'];
 const ROLE=[['face','얼굴','말을 걸어오는 쪽 — 그룹의 첫인상'],['info','정보통','단서 · 사정을 쥔 쪽'],['con','갈등','그룹 안에서 마찰을 만드는 쪽'],['','없음','']];
 const RL=Object.fromEntries(ROLE.map(r=>[r[0],r[1]]));
 const MIN=3;
 /* 11-13 19:01 망령 「조직 쪽에 애들 예상 성별 좀 나오게 — 헷갈리네」: 인물 칸에 성별(sex 'f' | 'm' | '').
    비워 두면 이름으로 예상(11-13 12:07 ~ 12:19 성비 결정, 노트 76) — 판에는 점선 「예상」으로, 직접 고르면 실선. */
 const SEXGUESS=[['m',['학생회장','회장','육성','통솔','순경','청년','묘지기','사제','교주','의사']],['f',['학장','지시','능력','서기','풍기','기자','경위','선장','뱃사공','리더','수녀','소녀','관리인']]];
 const sexGuess=n=>{const k=normName(n);if(!k)return '';for(const [x,L] of SEXGUESS)if(L.some(w=>k.includes(w)))return x;return ''};
 const sexOf=m=>m.sex||sexGuess(nameOf(m));
 const SXL={f:'여',m:'남'};
 const sexTag=(m,cls)=>{const x=sexOf(m);if(!x)return '';const g=!m.sex;return `<i class="${cls} sx-${x} ${g?'guess':''}" title="${g?'예상 성별 (이름으로 짐작 — 옆 창에서 직접 고를 수 있어요)':'성별'}">${x==='f'?'♀':'♂'}${SXL[x]}${g?'<small>?</small>':''}</i>`};
 const sexCount=M=>{let f=0,m=0,u=0;M.filter(x=>!blankMem(x)).forEach(x=>{const k=sexOf(x);if(k==='f')f++;else if(k==='m')m++;else u++});return {f,m,u}};
 const sexSum=(M,cls)=>{const c=sexCount(M);if(!c.f&&!c.m&&!c.u)return '';return `<small class="${cls}" title="예상 포함 성비">♀${c.f} · ♂${c.m}${c.u?` · ?${c.u}`:''}</small>`};
 const clone=o=>JSON.parse(JSON.stringify(o==null?null:o));
 const cssu=u=>N().cssu?N().cssu(u):String(u).replace(/'/g,'%27');
 const arcs=()=>window.NT_BLUE?NT_BLUE.arcs():N().list('arcs').sort((a,b)=>(a.order||0)-(b.order||0));
 const arcIdx=id=>arcs().findIndex(a=>a.id===id);
 const grps=()=>N().list('grp').filter(Boolean).sort((a,b)=>(a.order||0)-(b.order||0));
 const arcCol=(a,i)=>(a&&a.color)||PAL[i%PAL.length];
 const grpCol=(g,i)=>g.color||PAL[(i||0)%PAL.length];
 const ent=id=>id?N().data('ents',id):null;
 const npcImg=id=>{if(!id)return '';try{const t=window.NT_MAKER&&NT_MAKER.trainer&&NT_MAKER.trainer(id);return (t&&t.image)||((N().data('npc',id)||{}).image)||''}catch(e){return ''}};
 /* 그림 두 장: face = 포트(얼굴) · img = 스탠딩(전신). 없으면 이은 항목 · NPC 시트에서 빌려 온다 */
 const stOf=m=>m.img||((ent(m.ent)||{}).photo)||'';
 const faceOf=m=>m.face||((ent(m.ent)||{}).face)||npcImg(m.npc)||'';
 const imgOf=m=>stOf(m)||faceOf(m)||'';
 const nameOf=m=>m.name||((ent(m.ent)||{}).title)||((N().data('npc',m.npc)||{}).name)||'';
 /* 이름 맞추기: 「(가칭)」 · 빈칸 · 가운뎃점을 빼고 비교 (「경비원·사감」 = 「경비원 · 사감 (가칭)」) */
 const normName=s=>String(s||'').replace(/\(가칭\)/g,'').replace(/[\s·・]/g,'').trim();
 const charByName=n=>{const k=normName(n);if(!k)return null;return chars().find(x=>normName(x.title)===k)||null};
 const chars=()=>N().list('ents').filter(x=>x&&x.title&&String(x.type||'')==='인물').sort((a,b)=>String(a.title).localeCompare(String(b.title),'ko'));
 const npcs=()=>N().list('npc').filter(x=>x&&x.name).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko'));
 const newMem=o=>Object.assign({id:N().uid('m'),name:'',role:'',sex:'',img:'',face:'',line:'',pub:'',note:'',ent:'',npc:''},o||{});
 const isPub=id=>{if(!id||!ent(id))return false;const d=N().doc('ents',id);return !!d&&d.vis==='pub'};
 const blankMem=m=>!(m.name||m.img||m.face||m.ent||m.npc||m.line||m.note||m.pub);
 const realArc=g=>g&&g.arc&&N().data('arcs',g.arc)?g.arc:'';
 /* 11-13 08:26 망령 「학장이랑 선생 넣을 그룹이 없네」: 사건과 상관없는 「상시」 열(arc '_all') — 교사진 같은 캠페인 내내 나오는 그룹 */
 const ALL='_all';const colOf=g=>g&&g.arc===ALL?ALL:realArc(g);

 /* ---- 저장 ---- */
 const gSave=(gid,fn)=>N().patch('grp',gid,x=>{x.mem=x.mem||[];return fn(x)});
 const mOf=(gid,mid)=>((N().data('grp',gid)||{}).mem||[]).find(m=>m.id===mid)||null;
 const mSave=(gid,mid,fn)=>gSave(gid,x=>{const m=x.mem.find(y=>y.id===mid);if(!m)return false;return fn(m)});
 const arcSave=(aid,fn)=>N().patch('arcs',aid,x=>{x.clues=x.clues||[];x.ents=x.ents||[];return fn(x)});
 async function grpNew(arc,o){const L=grps();const id=N().uid('g');const n=L.length;
  await N().put('grp',id,Object.assign({order:L.length?(L[L.length-1].order||0)+1:0,arc:arc||'',name:'새 그룹',color:PAL[n%PAL.length],line:'',pub:'',desc:'',place:'',note:'',ent:'',hold:[],mem:[]},o||{}),'gm');return id}
 async function grpDel(gid){const g=N().data('grp',gid);if(!g)return;const n=(g.mem||[]).filter(m=>!blankMem(m)).length;const nc=clues(gid).length;
  if(!await N().confirmBox(`그룹 「${g.name||'그룹'}」${n?`과 인물 ${n}명`:''}을 지울까요?${nc?`\n단서 ${nc}개는 도안의 사건 단서로 남아요.`:''}`,'지우기'))return;if(P&&P.gid===gid)panelClose();const ok=await N().del('grp',gid);if(ok!==false){if(N().toastUndo)N().toastUndo('그룹을 지웠어요');else N().toast('그룹을 지웠어요')}}
 async function memAdd(gid,o,before){const mid=N().uid('m');await gSave(gid,x=>{const m=newMem(Object.assign({id:mid},o||{}));const i=before?x.mem.findIndex(y=>y.id===before):-1;if(i>=0)x.mem.splice(i,0,m);else x.mem.push(m)});return mid}
 async function memDel(gid,mid){const g=N().data('grp',gid);const m=mOf(gid,mid);if(!g||!m)return;if(!blankMem(m)&&!await N().confirmBox(`「${nameOf(m)||'이 인물'}」을 그룹에서 지울까요?${m.ent?'\n(자료의 인물 항목은 그대로 남아요)':''}`,'지우기'))return;
  const idx=g.mem.findIndex(x=>x.id===mid);const keep=clone(m);if(P&&P.mid===mid)panelClose();await gSave(gid,x=>{x.mem=x.mem.filter(y=>y.id!==mid)});
  N().toast('인물을 지웠어요',{undo:()=>gSave(gid,x=>{x.mem.splice(Math.min(idx,x.mem.length),0,keep)})})}
 /* 인물 옮기기: to 그룹의 before 인물 앞에 (before 없으면 끝) — 단서의 who 는 인물 id 라 그대로, 그룹이 바뀌면 단서도 옮긴다 */
 async function memMove(gid,mid,to,before){if(before===mid)return;const m=clone(mOf(gid,mid));if(!m||!N().data('grp',to))return;
  const ins=L=>{L=L.filter(x=>x.id!==mid);const i=before?L.findIndex(x=>x.id===before):-1;if(i>=0)L.splice(i,0,m);else L.push(m);return L};
  if(to!==gid){await gSave(gid,x=>{x.mem=x.mem.filter(y=>y.id!==mid)});await clueMoveWho(gid,to,mid)}await gSave(to,x=>{x.mem=ins(x.mem)});if(P&&P.mid===mid){P.gid=to;panelDraw()}}
 async function memStep(gid,mid,d){await gSave(gid,x=>{const i=x.mem.findIndex(y=>y.id===mid),j=i+d;if(i<0||j<0||j>=x.mem.length)return false;const t=x.mem[i];x.mem[i]=x.mem[j];x.mem[j]=t})}
 /* 그룹을 다른 사건 열로 (before 그룹 앞에) — 사건이 바뀌면 단서도 따라간다 */
 async function grpPlace(gid,arc,before){const L=grps();const g=L.find(x=>x.id===gid);if(!g||before===gid)return;const from=realArc(g);
  const col=L.filter(x=>(colOf(x)||'')===arc&&x.id!==gid);const i=before?col.findIndex(x=>x.id===before):-1;if(i>=0)col.splice(i,0,g);else col.push(g);
  const base=Math.max(0,...L.map(x=>x.order||0))+1;const rows=[];col.forEach((x,k)=>{const nx=Object.assign(clone(x),{order:base+k},x.id===gid?{arc}:{});rows.push({kind:'grp',id:x.id,data:nx,vis:'gm'})});
  if(N().putMany)await N().putMany(rows);else for(const r of rows)await N().put('grp',r.id,r.data,'gm');
  const to=arc===ALL?'':arc;if(from!==to)await clueCarry(gid,from,to)}
 async function grpStep(gid,d){const g=N().data('grp',gid);if(!g)return;const a=colOf(g);const col=grps().filter(x=>colOf(x)===a);const i=col.findIndex(x=>x.id===gid),j=i+d;if(j<0||j>=col.length)return;
  return grpPlace(gid,a,d<0?col[j].id:(col[j+1]?col[j+1].id:''))}
 async function setArc(gid,to){const g=N().data('grp',gid);if(!g)return;const from=realArc(g);await gSave(gid,x=>{x.arc=to});const t=to===ALL?'':to;if(from!==t)await clueCarry(gid,from,t)}
 /* 그림 올리기 */
 /* k = face | img | '' (모르면 그림 비율로 — 거의 정사각이면 포트, 세로로 길면 스탠딩) */
 async function guessK(f){try{const b=await createImageBitmap(f);const r=b.width/b.height;if(b.close)b.close();return r>0.82?'face':'img'}catch(e){return 'img'}}
 async function upImg(gid,mid,f,k){if(!f)return;k=k||await guessK(f);let u;try{u=await N().upload(f,k==='face'?'face':'photo','grp_'+k)}catch(e){return N().toast('그림을 올리지 못했어요')}if(!u)return;
  if(mid){await mSave(gid,mid,m=>{m[k]=u});await pubSync(gid,mid)}else mid=await memAdd(gid,{[k]:u});N().toast(k==='face'?'포트에 넣었어요':'스탠딩에 넣었어요');
  if(P&&P.gid===gid)panelDraw();return mid}

 /* ---- 단서 (도안 사건 단서 + grp · who) ---- */
 function clues(gid,mid){const g=N().data('grp',gid);if(!g)return [];const a=realArc(g)?N().data('arcs',g.arc):null;const L=a?(a.clues||[]).filter(c=>c&&c.grp===gid):(g.hold||[]);return mid?L.filter(c=>c.who===mid):L}
 async function clueAdd(gid,mid,t){const g=N().data('grp',gid);if(!g||!t)return;const c={id:N().uid('q'),t,d:'',img:'',ok:false,ep:'',grp:gid,who:mid||''};
  if(realArc(g))await arcSave(g.arc,x=>{x.clues.push(c)});else await gSave(gid,x=>{x.hold=(x.hold||[]).concat([c])});return c.id}
 async function clueEdit(gid,cid,fn){const g=N().data('grp',gid);if(!g)return false;if(realArc(g))return arcSave(g.arc,x=>{const c=x.clues.find(y=>y&&y.id===cid);if(!c)return false;return fn(c)});return gSave(gid,x=>{const c=(x.hold||[]).find(y=>y.id===cid);if(!c)return false;return fn(c)})}
 async function clueDel(gid,cid){const g=N().data('grp',gid);if(!g)return;let keep=null;
  if(realArc(g))await arcSave(g.arc,x=>{const i=x.clues.findIndex(y=>y&&y.id===cid);if(i<0)return false;keep=x.clues.splice(i,1)[0]});else await gSave(gid,x=>{x.hold=(x.hold||[]).filter(y=>{if(y.id===cid){keep=y;return false}return true})});
  if(keep)N().toast('단서를 지웠어요',{undo:()=>realArc(N().data('grp',gid))?arcSave(N().data('grp',gid).arc,x=>{x.clues.push(keep)}):gSave(gid,x=>{x.hold=(x.hold||[]).concat([keep])})})}
 /* 그룹의 사건이 바뀔 때 단서 옮기기 (from/to 가 '' 면 그룹이 맡아 둔다) */
 async function clueCarry(gid,from,to){let L=[];
  if(from)await arcSave(from,x=>{L=x.clues.filter(c=>c&&c.grp===gid);if(!L.length)return false;x.clues=x.clues.filter(c=>!(c&&c.grp===gid))});else{const g=N().data('grp',gid);L=(g&&g.hold)||[];if(L.length)await gSave(gid,x=>{x.hold=[]})}
  if(!L.length)return;L=L.map(c=>Object.assign({},c,{ep:''}));if(to)await arcSave(to,x=>{x.clues=x.clues.concat(L)});else await gSave(gid,x=>{x.hold=(x.hold||[]).concat(L)});N().toast(`단서 ${L.length}개도 ${to?'그 사건으로':'그룹이 맡아 두게'} 옮겼어요`)}
 /* 인물이 다른 그룹으로 갈 때 그 인물의 단서도 */
 async function clueMoveWho(gid,to,mid){const mine=clues(gid,mid);if(!mine.length)return;for(const c of mine)await clueDel0(gid,c.id);const g2=N().data('grp',to);const L=mine.map(c=>Object.assign({},c,{grp:to,ep:''}));
  if(realArc(g2))await arcSave(g2.arc,x=>{x.clues=x.clues.concat(L)});else await gSave(to,x=>{x.hold=(x.hold||[]).concat(L)})}
 async function clueDel0(gid,cid){const g=N().data('grp',gid);if(realArc(g))await arcSave(g.arc,x=>{x.clues=x.clues.filter(y=>!(y&&y.id===cid))});else await gSave(gid,x=>{x.hold=(x.hold||[]).filter(y=>y.id!==cid)})}
 async function clueShow(gid,cid){const c=clues(gid).find(x=>x.id===cid);if(!c)return;if(!realArc(N().data('grp',gid)))return N().toast('그룹을 사건에 놓으면 웹툴로 공개할 수 있어요');if(!window.NT_PHONE||!NT_PHONE.clueShow)return N().toast('웹툴 연결을 불러오지 못했어요');
  if(!await N().confirmBox(`단서 「${c.t||'단서'}」를 웹툴 방의 모두에게 지금 공개할까요?`,'공개'))return;if(await NT_PHONE.clueShow(c)){await clueEdit(gid,cid,x=>{x.ok=true});N().toast('웹툴에 단서를 공개했어요');panelDraw()}}
 async function clueLib(gid){const g=N().data('grp',gid);const L=clues(gid);if(!L.length)return N().toast('보낼 단서가 없어요');if(!window.NT_PHONE||!NT_PHONE.clueLib)return N().toast('웹툴 연결을 불러오지 못했어요');const n=await NT_PHONE.clueLib(L,g.name||'조직');if(n>=0)N().toast(`웹툴 단서 목록에 ${n}개 넣었어요 — 웹툴 GM 창 「연출 → 단서 카드」`)}

 /* ---- 카드 (자료 탭 항목) ---- */
 const T_PERSON=['정체','외모','성격 · 말투','원하는 것','비밀'];
 async function arcLinkEnt(gid,eid){const g=N().data('grp',gid);if(!realArc(g)||!eid)return;await arcSave(g.arc,x=>{if(x.ents.includes(eid))return false;x.ents.push(eid)})}
 async function memCard(gid,mid,quiet){const g=N().data('grp',gid);const m=mOf(gid,mid);if(!g||!m)return;if(m.ent&&ent(m.ent)){if(!quiet)goEnt(m.ent);return m.ent}
  const nm=nameOf(m);if(!nm){if(!quiet)N().toast('이름을 먼저 적어요');return}
  const same=charByName(nm);if(same&&(quiet||await N().confirmBox(`자료에 같은 이름의 인물 「${nm}」이 있어요. 그 항목에 이을까요? (취소하면 새로 만들어요)`,'잇기'))){await mSave(gid,mid,x=>{x.ent=same.id});await arcLinkEnt(gid,same.id);if(!quiet)N().toast('인물 항목에 이었어요');return same.id}
  const id=N().uid('e');const rows=T_PERSON.map(k=>({k,v:''}));   /* 카드에는 공개해도 되는 것만 — GM 설정(note) · 역할 · 한 줄은 넣지 않는다 */
  await N().put('ents',id,{type:'인물',title:nm,sub:g.name||'',body:m.pub||'',rows,tags:[],teams:g.name?[g.name]:[],face:m.face||m.img||'',photo:m.img||'',at:[],created:Date.now(),order:N().list('ents').length},'gm');
  await mSave(gid,mid,x=>{x.ent=id});await arcLinkEnt(gid,id);if(!quiet)N().toast(`인물 카드 「${nm}」를 만들었어요 — 아직 GM만 (「👁 공개로」를 눌러야 PL 에게 보여요)`);return id}
 async function memCardSync(gid,mid){const g=N().data('grp',gid);const m=mOf(gid,mid);if(!m||!m.ent||!ent(m.ent))return;
  await N().patch('ents',m.ent,e=>pubFields(e,g,m));N().toast('인물 카드에 이름 · 그림 · 소속 · 공개 소개를 반영했어요 (GM 설정은 넣지 않아요)')}
 /* 카드에 옮기는 칸 = 공개해도 되는 것만 */
 function pubFields(e,g,m){if(m){const nm=nameOf(m);if(nm)e.title=nm;if(m.face||m.img)e.face=m.face||m.img;if(m.img)e.photo=m.img;e.sub=g.name||'';e.body=m.pub||'';const t=e.teams||[];if(g.name&&!t.includes(g.name))e.teams=t.concat([g.name])}
  else{e.title=g.name||e.title;e.sub='';e.body=g.pub||'';const R=e.rows||[];const r=R.find(x=>x.k==='구성원');const names=(g.mem||[]).filter(x=>isPub(x.ent)).map(nameOf).filter(Boolean).join(', ');if(r)r.v=names;else R.push({k:'구성원',v:names});e.rows=R;const f=(g.mem||[]).map(imgOf).find(Boolean);if(f&&!e.face)e.face=f}}
 /* 공개로 · GM만으로 (mid 없으면 그룹 = 조직 카드) */
 async function pubSet(gid,mid,on){const g=N().data('grp',gid);if(!g)return;const m=mid?mOf(gid,mid):null;if(mid&&!m)return;
  let id=mid?m.ent:g.ent;if(!id||!ent(id)){if(!on)return;id=mid?await memCard(gid,mid,true):await orgCard(gid,true);if(!id)return N().toast('이름을 먼저 적어요')}
  const e=clone(ent(id));const g2=N().data('grp',gid);const m2=mid?mOf(gid,mid):null;
  if(on){const pubTxt=String((mid?m2.pub:g2.pub)||'').trim();const filled=(e.rows||[]).filter(r=>r.k!=='구성원'&&String(r.v||'').trim()).map(r=>r.k);const bodyLost=String(e.body||'').trim()&&String(e.body||'').trim()!==pubTxt;
   const msg=`「${e.title||'항목'}」을 PL 에게 공개할까요? 자료 탭 항목 칸에 나와요.\n카드에는 이름 · 그림 · 소속 · 「공개 소개」만 들어가요 (GM 설정은 안 나가요).`+(pubTxt?'':'\n⚠ 공개 소개가 비어 있어요.')+(bodyLost?'\n⚠ 항목 본문에 직접 적은 글은 공개 소개로 바뀌어요.':'')+(filled.length?`\n⚠ 항목에 직접 적은 칸도 같이 공개돼요: ${filled.join(' · ')} — 비밀이 있으면 먼저 지우세요.`:'');
   if(!await N().confirmBox(msg,'공개'))return;pubFields(e,g2,m2);await N().put('ents',id,e,'pub');N().toast(`「${e.title}」 공개 — 자료 탭에서 PL 도 봐요`)}
  else{await N().put('ents',id,e,'gm');N().toast(`「${e.title}」을 다시 GM만 보게 했어요`)}
  if(mid&&g2.ent&&isPub(g2.ent))await N().patch('ents',g2.ent,x=>pubFields(x,N().data('grp',gid),null));if(P)panelDraw()}
 /* 공개 중인 카드는 이름 · 그림 · 공개 소개를 고치면 저절로 맞춘다 */
 async function pubSync(gid,mid){const g=N().data('grp',gid);if(!g)return;if(mid){const m=mOf(gid,mid);if(m&&isPub(m.ent))await N().patch('ents',m.ent,e=>pubFields(e,g,m))}else{if(isPub(g.ent))await N().patch('ents',g.ent,e=>pubFields(e,g,null));for(const m of g.mem||[])if(isPub(m.ent))await N().patch('ents',m.ent,e=>{e.sub=g.name||'';const t=(e.teams||[]).filter(x=>x);if(g.name&&!t.includes(g.name))t.push(g.name);e.teams=t})}}
 async function grpCards(gid){const g=N().data('grp',gid);if(!g)return;const L=(g.mem||[]).filter(m=>!m.ent&&nameOf(m));if(!L.length)return N().toast('카드를 만들 인물이 없어요 (이름이 있고 아직 카드가 없는 인물)');
  if(!await N().confirmBox(`인물 ${L.length}명(${L.map(nameOf).join(' · ')})의 인물 카드를 자료 탭에 만들까요? (GM만 · 같은 이름이 있으면 그 항목에 이어요)`,'만들기'))return;for(const m of L)await memCard(gid,m.id,true);N().toast(`인물 카드 ${L.length}장을 만들었어요`)}
 async function orgCard(gid,quiet){const g=N().data('grp',gid);if(!g)return;if(g.ent&&ent(g.ent)){if(!quiet)goEnt(g.ent);return g.ent}
  const id=N().uid('e');const face=(g.mem||[]).map(faceOf).find(Boolean)||'';   /* 공개해도 되는 것만 — GM 설정(desc) · 한 줄 · 장소는 넣지 않는다 */
  await N().put('ents',id,{type:'조직',title:g.name||'새 조직',sub:'',body:g.pub||'',rows:[{k:'목적',v:''},{k:'구성원',v:''},{k:'거점',v:''},{k:'가진 것',v:''},{k:'숨긴 것',v:''}],tags:[],teams:[],face,photo:'',at:[],created:Date.now(),order:N().list('ents').length},'gm');
  await gSave(gid,x=>{x.ent=id});await arcLinkEnt(gid,id);if(!quiet)N().toast(`조직 카드 「${g.name||'조직'}」를 만들었어요 (GM만 — 「👁 공개로」를 눌러야 PL 에게 보여요)`);return id}
 /* 같은 이름의 인물 항목을 아직 안 이은 인물에 잇는다 (+ 그룹이 사건에 있으면 도안 관련 항목에도) */
 async function linkByName(){let n=0;const miss=[];for(const g of grps()){for(const m of g.mem||[]){if(m.ent&&ent(m.ent))continue;const e=charByName(nameOf(m));if(!e){if(nameOf(m))miss.push(nameOf(m));continue}await mSave(g.id,m.id,x=>{x.ent=e.id});await arcLinkEnt(g.id,e.id);n++}}N().toast(n?`인물 항목 ${n}명을 이었어요${miss.length?` · 같은 이름이 없는 인물 ${miss.length}명`:''}`:'새로 이을 인물이 없어요');return {n,miss}}
 function goEnt(id){panelClose();if(window.NT_FAV)NT_FAV.go({kind:'ents',id});else N().go('ents')}
 /* 웹툴 무대로 (인물 카드가 있는 셋까지) */
 async function toStage(gid){const g=N().data('grp',gid);if(!g)return;if(!window.NT_PHONE||!NT_PHONE.sendScene)return N().toast('웹툴 연결을 불러오지 못했어요');
  const E=(g.mem||[]).map(m=>ent(m.ent)).filter(Boolean);if(!E.length)return N().toast('인물 카드(항목)가 있는 인물이 없어요 — 먼저 「인물 카드 한꺼번에」');
  if(!await N().confirmBox(`「${g.name||'그룹'}」 인물 ${Math.min(3,E.length)}명을 웹툴 방 무대에 세울까요? (씬 프리셋으로도 남아요)`,'보내기'))return;NT_PHONE.sendScene({id:'grp_'+gid,title:g.name||'그룹',ents:E.slice(0,3)})}

 /* 11-13 망령 확정 구조(사건 1 학교 · 사건 2 · 3 조직 둘씩) + 감우 배치 안 — 이름 · 역할만, 설정은 비워 둔다 */
 const SEED=[[0,'학교','대서고 청소 의뢰부터 교내 생활까지',[['학생회장','face'],['사서','info'],['경비원·사감','con']]],
  [1,'시청·경관','공식 수사 쪽 — 사건 1 도시 폭주 사고의 뒷조사',[['순경','face'],['서기','info'],['경위','con']]],
  [1,'뒷골목','비공식 정보 쪽 — 공장 지대 뒷사정',[['뒷골목 청년','face'],['뒷골목 정보상','info'],['운하 뱃사공','con']]],
  [2,'대성당','마지막 사건의 큰 이야기',[['대성당 수녀','face'],['대성당 사제','info'],['대성당 교주','con']]],
  [2,'병원·구빈원','도시의 울적한 쪽 — 사람 냄새 나는 동기',[['구빈원 소녀','face'],['시립 병원 의사','info'],['구빈원 관리인','con']]]];
 /* 상시 그룹: 학장 + 선생 넷(지시 · 육성 · 통솔 · 능력 — 73). 이름만 — 정체 · 배신 같은 건 GM 설정에 망령 님이 적는다 */
 const SEED_ALL=['교사진','학장과 선생들 — 캠페인 내내 나오는 사람들',['학장','지시 교수','육성 선생','통솔 선생','능력 선생']];
 const seedAllRow=base=>{const [name,line,mm]=SEED_ALL;return {kind:'grp',id:N().uid('g'),vis:'gm',data:{order:base,arc:ALL,name,color:'#d4a017',line,pub:'',desc:'',place:'',note:'',ent:'',hold:[],mem:mm.map(n=>{const e=charByName(n)||chars().find(x=>String(x.title).startsWith(n));return newMem({name:n,ent:e?e.id:''})})}}};
 async function seedAll(){const base=Math.max(-1,...grps().map(x=>x.order||0))+1;const r=seedAllRow(base);await N().put('grp',r.id,r.data,'gm');N().toast('교사진 그룹을 「상시」 열에 넣었어요 — 이름은 자료 항목과 같으면 저절로 이어요');return r.id}
 async function seed(){const A=arcs();if(grps().length&&!await N().confirmBox('지금 그룹은 그대로 두고 뒤에 더할까요?','더하기'))return;
  const base=Math.max(-1,...grps().map(x=>x.order||0))+1;const rows=SEED.map(([ai,name,line,mm],k)=>{const a=A[ai];return {kind:'grp',id:N().uid('g'),vis:'gm',data:{order:base+k,arc:a?a.id:'',name,color:a?arcCol(a,ai):PAL[k%PAL.length],line,pub:'',desc:'',place:'',note:'',ent:'',hold:[],mem:mm.map(([n,r])=>{const e=charByName(n);return newMem({name:n,role:r,ent:e?e.id:''})})}}});
  if(!grps().some(g=>g.arc===ALL))rows.unshift(seedAllRow(base-1));
  if(N().putMany)await N().putMany(rows);else for(const r of rows)await N().put('grp',r.id,r.data,'gm');
  N().toast(A.length>=3?'그룹 5개(+ 상시 교사진)를 넣었어요 — 인물 칸에 그림을 끌어 놓아요':'그룹 5개를 넣었어요 (도안의 사건이 모자라 일부는 「사건 미정」에)')}

 /* ---- 서랍: 자료의 인물 항목 · NPC 시트를 끌어 놓기 ---- */
 const DKEY='nt_cg_drawer';const dGet=()=>{try{return localStorage.getItem(DKEY)||'ents'}catch(e){return 'ents'}};const dSet=v=>{try{localStorage.setItem(DKEY,v)}catch(e){}};
 function used(){const S=new Set();grps().forEach(g=>(g.mem||[]).forEach(m=>{if(m.ent)S.add('ents|'+m.ent);if(m.npc)S.add('npc|'+m.npc)}));return S}
 function drawerHtml(){const k=dGet();const U=used();const L=k==='off'?[]:k==='npc'?npcs().map(x=>['npc',x.id,x.name,npcImg(x.id)]):chars().map(x=>['ents',x.id,x.title,x.face||x.photo||'']);
  return `<div class="bp-drawer cg-drawer ${k==='off'?'off':''}"><div class="bp-dtab">${[['ents','인물 항목'],['npc','NPC 시트'],['off','접기']].map(([v,l])=>`<button type="button" data-cdt="${v}" class="${v===k?'on':''}">${l}</button>`).join('')}<small class="dim">${k==='off'?'':'끌어서 인물 칸 · 그룹에 놓거나, 눌러서 넣을 그룹 고르기 · 흐린 것은 이미 그룹에 있는 인물'}</small></div>
   ${k==='off'?'':`<div class="bp-dl">${L.length?L.map(([kk,id,t,u])=>`<span class="bp-dr ${U.has(kk+'|'+id)?'cg-used':''}" draggable="true" data-dk="${kk}" data-did="${esc(id)}" title="끌어서 놓기 · 누르면 넣을 그룹 고르기">${u?`<i class="bp-av" style="background-image:url('${esc(cssu(u))}')"></i>`:''}${esc(t)}</span>`).join(''):`<span class="dim small">${k==='npc'?'NPC 시트가 없어요':'자료에 「인물」 항목이 없어요 — 인물 칸에서 「인물 카드 만들기」로 만들 수 있어요'}</span>`}</div>`}</div>`}
 async function dropDrawer(k,id,gid,mid){const g=N().data('grp',gid);if(!g)return;const o=k==='npc'?{npc:id,name:(N().data('npc',id)||{}).name||''}:{ent:id,name:(ent(id)||{}).title||''};
  const tm=mid?mOf(gid,mid):null;if(tm&&blankMem(tm))await mSave(gid,mid,m=>{Object.assign(m,o)});else await memAdd(gid,o,mid||'');if(k==='ents')await arcLinkEnt(gid,id);N().toast(`「${o.name||'인물'}」을 「${g.name||'그룹'}」에 넣었어요`)}

 /* ---- 판 ---- */
 function render(el){if(window.NT_BLUE&&NT_BLUE.close)NT_BLUE.close();const G=N().gm();
  if(!G){panelClose();el.innerHTML=`<div class="toolbar"><h2>조직</h2></div><div class="empty">조직 판은 GM만 봐요.</div>`;return}
  const A=arcs(),L=grps();const nm=L.reduce((s,g)=>s+(g.mem||[]).filter(m=>!blankMem(m)).length,0);const ni=L.reduce((s,g)=>s+(g.mem||[]).filter(m=>imgOf(m)).length,0);const nc=L.reduce((s,g)=>s+clues(g.id).length,0);
  const cols=[{id:ALL,a:null,i:-1,all:1},...A.map((a,i)=>({id:a.id,a,i})),{id:'',a:null,i:A.length}];const showNone=!A.length||L.some(g=>colOf(g)==='');const C=showNone?cols:cols.slice(0,-1);
  el.innerHTML=`<div class="toolbar"><h2>조직</h2><span class="note">그룹 ${L.length}개 · 인물 ${nm}명 · 그림 ${ni}장 · 단서 ${nc}개</span>${sexSum(L.flatMap(g=>g.mem||[]),'cg-sxsum')}<span class="sp"></span>${L.length?`<button class="btn sm" data-c="gnew" data-arc="">＋ 그룹</button><button class="btn sm ghost" data-c="link" title="이름이 같은 자료의 「인물」 항목을 아직 안 이은 인물에 잇는다 (「(가칭)」 · 빈칸 · 가운뎃점은 빼고 비교)">📇 같은 이름 항목 잇기</button><button class="btn sm ghost" data-c="copy" title="조직 판 전체를 글(마크다운)로 복사">⧉ 글로 복사</button>`:''}</div>
   <div class="cg-tip small dim"><b>누르면</b> 옆 창에서 자세히 · 이름을 <b>두 번 누르면</b> 그 자리에서 고치기 · <b>우클릭</b>(휴대폰은 길게 누르기) 메뉴 · 그림 파일이나 서랍의 인물을 <b>끌어 놓기</b> · 인물 · 그룹 머리를 끌어 옮기기.</div>
   ${L.length?drawerHtml():''}
   ${L.length?`<div class="cg-wrap"><div class="cg-board" style="--n:${C.length}">${C.map(c=>colHtml(c,L)).join('')}</div></div>`:emptyHtml(A)}`;
  bind(el);panelSync()}
 function emptyHtml(A){return `<div class="empty cg-empty"><b>아직 그룹이 없어요.</b><p class="small">상시 = 학장 · 선생들 · 사건 1 = 학교 · 사건 2 · 3 = 조직 둘씩 (11-13 정한 틀).${A.length?'':'<br>도안에 큰 사건이 아직 없어 「사건 미정」 열에 놓여요.'}</p>
  <div class="row" style="justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn pri" data-c="seed" title="상시 교사진 + 학교 · 시청·경관 · 뒷골목 · 대성당 · 병원·구빈원 — 이름과 역할만 넣고 설정은 비워 둬요">11-13 배치 안으로 넣기 (교사진 + 5개)</button><button class="btn ghost" data-c="gnew" data-arc="">빈 그룹 하나</button></div></div>`}
 function colHtml(c,L){const a=c.a;const col=c.all?'#d4a017':a?arcCol(a,c.i):'#8a8a8a';const G=L.filter(g=>colOf(g)===c.id);
  return `<section class="cg-col" style="--ac:${esc(col)}" data-col="${esc(c.id)}">
   <header class="cg-ch">${c.all?`<span class="cg-no">∞</span><span class="cg-cm"><small>ALWAYS</small><b>상시 · 교사진</b></span>`:a?`<span class="cg-no">${String(c.i+1).padStart(2,'0')}</span><span class="cg-cm"><small>CASE ${c.i+1}</small><b>${esc(a.name||'(이름 없음)')}</b></span>`:`<span class="cg-cm"><small>UNSORTED</small><b>사건 미정</b></span>`}<span class="cg-cn">${G.length}개</span></header>
   ${G.map(g=>grpHtml(g,L.indexOf(g))).join('')}
   ${c.all&&!G.length?`<button type="button" class="cg-add cg-addall" data-c="seedall" title="학장 · 지시 · 육성 · 통솔 · 능력 — 이름만 넣어요">＋ 교사진 그룹 넣기 (학장 · 선생 넷)</button>`:''}<button type="button" class="cg-add" data-c="gnew" data-arc="${esc(c.id)}">＋ 그룹</button></section>`}
 function grpHtml(g,i){const col=grpCol(g,i);const M=g.mem||[];const slots=M.map(m=>memHtml(g,m)).concat(Array.from({length:Math.max(0,MIN-M.length)},(_,k)=>emptySlot(g,k)));
  const sel=P&&P.gid===g.id&&!P.mid?'cg-sel':'';const C=clues(g.id);const ok=C.filter(c=>c.ok).length;const nCard=M.filter(m=>m.ent&&ent(m.ent)).length;const nPub=M.filter(m=>isPub(m.ent)).length;
  return `<article class="cg-grp ${sel}" style="--gc:${esc(col)}" data-g="${esc(g.id)}">
   <div class="cg-gh" draggable="true" data-c="grp" data-id="${esc(g.id)}" title="누르면 그룹 고치기 · 이름 두 번 누르면 바로 고치기 · 끌어서 옮기기 · 우클릭 메뉴"><button type="button" class="cg-mplus" data-c="mnew" data-id="${esc(g.id)}" title="인물 더하기">＋ 인물</button><b class="cg-gn" data-ed="gname" data-id="${esc(g.id)}">${esc(g.name||'(이름 없음)')}</b>${sexSum(M,'cg-sxg')}${g.place?`<em>📍 ${esc(g.place)}</em>`:''}${g.line?`<p>${esc(g.line)}</p>`:''}</div>
   <div class="cg-ms">${slots.join('')}</div>
   ${g.pub?`<div class="cg-desc pub" data-c="grp" data-id="${esc(g.id)}" title="공개 소개${isPub(g.ent)?' — 공개 중':' — 아직 GM만'}"><b>${isPub(g.ent)?'👁':'공개 소개'}</b> ${esc(g.pub)}</div>`:''}
   ${g.desc?`<div class="cg-desc" data-c="grp" data-id="${esc(g.id)}" title="GM 설정 — 공개해도 안 나가요"><b>🔒</b> ${esc(g.desc)}</div>`:`<div class="cg-desc none" data-c="grp" data-id="${esc(g.id)}">${g.pub?'🔒 GM 설정':'공개 소개 · GM 설정'} — 눌러서 적어요</div>`}
   <div class="cg-gf">${C.length?`<span class="cg-cl" data-c="grp" data-id="${esc(g.id)}" title="단서 — 도안 사건 단서와 같은 것 (웹툴로 공개 가능)">🔍 ${C.slice(0,4).map(c=>`<i class="${c.ok?'ok':''}">${esc(c.t||'단서')}</i>`).join('')}${C.length>4?`<i>+${C.length-4}</i>`:''}<small>${ok}/${C.length}</small></span>`:`<button type="button" class="cg-mini" data-c="clue" data-id="${esc(g.id)}" title="이 그룹에서 얻는 단서 더하기">＋ 단서</button>`}<span class="sp"></span>${nCard?`<small class="cg-badge" title="자료 탭에 인물 카드(항목)가 있는 인물 · 그중 공개">📇 ${nCard}/${M.filter(m=>!blankMem(m)).length}${nPub?` · 👁 ${nPub}`:''}</small>`:''}${isPub(g.ent)?'<small class="cg-badge pub" title="조직 카드 공개 중 — PL 도 봐요">👁 조직 공개</small>':g.ent&&ent(g.ent)?'<small class="cg-badge" title="조직 카드 있음 · GM만">조직</small>':''}</div></article>`}
 function memHtml(g,m){const u=imgOf(m);const nm=nameOf(m);const sel=P&&P.mid===m.id?'cg-sel':'';const nc=clues(g.id,m.id).length;
  return `<div role="button" tabindex="0" class="cg-m ${u?'has':''} r-${m.role||'none'} ${sel}" draggable="true" data-c="mem" data-id="${esc(g.id)}" data-m="${esc(m.id)}" title="누르면 고치기 · 이름 두 번 누르면 바로 고치기 · 그림 파일을 끌어 놓으면 그림 · 끌어서 옮기기 · 우클릭 메뉴">
   <div class="cg-pt ${stOf(m)?'':'only-face'}" ${u?`style="--im:url('${esc(cssu(u))}')"`:''}>${u?'':'<span class="cg-ph">그림<br><small>끌어 놓기</small></span>'}${stOf(m)&&faceOf(m)?`<i class="cg-fc" style="background-image:url('${esc(cssu(faceOf(m)))}')" title="포트"></i>`:''}${m.role?`<i class="cg-role">${esc(RL[m.role]||'')}</i>`:''}${sexTag(m,'cg-sx')}<span class="cg-mk">${isPub(m.ent)?'<i class="cg-pubk" title="공개 중 — 자료 탭 항목 칸에서 PL 도 봐요">👁</i>':m.ent&&ent(m.ent)?'<i title="인물 카드(자료 항목) 있음 · GM만">📇</i>':''}${m.npc?'<i title="NPC 시트와 이음">🎭</i>':''}${nc?`<i title="이 인물의 단서 ${nc}개">🔍${nc}</i>`:''}</span></div>
   <b class="cg-mn" data-ed="mname" data-id="${esc(g.id)}" data-m="${esc(m.id)}">${nm?esc(nm):'<span class="dim">(이름)</span>'}</b>${m.line?`<span class="cg-ml">${esc(m.line)}</span>`:''}</div>`}
 const emptySlot=(g,k)=>`<div role="button" tabindex="0" class="cg-m empty" data-c="mnew" data-id="${esc(g.id)}" data-slot="${k}" title="눌러서 인물 더하기 · 그림 파일이나 서랍의 인물을 끌어 놓아도 돼요"><div class="cg-pt"><span class="cg-ph">＋<br><small>인물</small></span></div><b class="cg-mn dim">빈 칸</b></div>`;

 /* 글로 복사 */
 function outline(){const A=arcs(),L=grps();const out=['# 조직 (NPC 그룹)'];const sec=(t,G)=>{if(!G.length)return;out.push('',`## ${t}`);G.forEach(g=>{out.push('',`### ${g.name||'(그룹)'}${g.place?` — 📍 ${g.place}`:''}`);if(g.line)out.push(g.line);if(g.pub)out.push('','공개 소개: '+String(g.pub).replace(/\n/g,'\n  '));if(g.desc)out.push('','GM 설정: '+String(g.desc).replace(/\n/g,'\n  '));
  (g.mem||[]).forEach(m=>{out.push(`- ${nameOf(m)||'(이름)'}${sexOf(m)?` (${SXL[sexOf(m)]}${m.sex?'':' 예상'})`:''}${m.role?` [${RL[m.role]}]`:''}${m.line?' — '+m.line:''}`);if(m.pub)out.push('  공개: '+String(m.pub).replace(/\n/g,'\n  '));if(m.note)out.push('  GM: '+String(m.note).replace(/\n/g,'\n  '))});
  clues(g.id).forEach(c=>{const w=(g.mem||[]).find(m=>m.id===c.who);out.push(`- 단서 [${c.ok?'x':' '}] ${c.t||''}${w?` (${nameOf(w)})`:''}${c.d?' — '+c.d:''}`)});if(g.note)out.push('','메모: '+g.note)})};
  sec('상시 · 교사진',L.filter(g=>colOf(g)===ALL));A.forEach((a,i)=>sec(`사건 ${i+1}. ${a.name||''}`,L.filter(g=>realArc(g)===a.id)));sec('사건 미정',L.filter(g=>colOf(g)===''));return out.join('\n')}
 async function copyOut(){const t=outline();try{await navigator.clipboard.writeText(t);N().toast('조직 판을 글로 복사했어요')}catch(e){N().openModal(`<div class="mhead"><h2>조직 (글)</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><textarea rows="18" style="width:100%" readonly>${esc(t)}</textarea>`)}}

 /* ---- 그 자리에서 이름 고치기 (두 번 누르기) ---- */
 function inlineEdit(b){if(b.querySelector('input'))return;const kind=b.dataset.ed,gid=b.dataset.id,mid=b.dataset.m;const g=N().data('grp',gid);if(!g)return;const cur=kind==='gname'?(g.name||''):nameOf(mOf(gid,mid)||{});
  const w=b.offsetWidth;b.innerHTML=`<input type="text" class="cg-inl" value="${esc(cur)}" style="min-width:${Math.max(80,w)}px">`;const i=b.querySelector('input');i.focus();i.select();let done=false;
  const fin=async ok=>{if(done)return;done=true;const v=i.value.trim();if(ok&&v!==cur){if(kind==='gname')await gSave(gid,x=>{x.name=v});else await mSave(gid,mid,m=>{m.name=v});await pubSync(gid,kind==='gname'?'':mid)}N().render()};
  i.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&!e.isComposing){e.preventDefault();fin(true)}if(e.key==='Escape'){e.preventDefault();fin(false)}});i.addEventListener('blur',()=>fin(true));['click','mousedown','dblclick','dragstart'].forEach(t=>i.addEventListener(t,e=>e.stopPropagation()))}

 /* ---- 우클릭 · 길게 누르기 메뉴 ---- */
 function ctxItems(t){if(t.matches('.cg-m[data-m]')){const gid=t.dataset.id,mid=t.dataset.m;const m=mOf(gid,mid);const g=N().data('grp',gid);if(!m||!g)return [];const i=g.mem.findIndex(x=>x.id===mid);
   return [{t:'고치기 (옆 창)',on:()=>panelOpen({gid,mid})},{t:'이름 바꾸기',on:()=>{const b=document.querySelector(`.cg-mn[data-m="${CSS.escape(mid)}"]`);if(b)inlineEdit(b)}},'-',
    ...ROLE.filter(r=>r[0]).map(([k,l])=>({t:(m.role===k?'● ':'○ ')+'역할: '+l,on:()=>mSave(gid,mid,x=>{x.role=x.role===k?'':k})})),'-',
    ...[['f','여 ♀'],['m','남 ♂']].map(([k,l])=>({t:(m.sex===k?'● ':'○ ')+'성별: '+l+(!m.sex&&sexGuess(nameOf(m))===k?' (지금 예상)':''),on:()=>mSave(gid,mid,x=>{x.sex=x.sex===k?'':k})})),'-',
    m.ent&&ent(m.ent)?{t:'📇 인물 카드 열기',on:()=>goEnt(m.ent)}:{t:'📇 인물 카드 만들기',on:()=>memCard(gid,mid)},
    isPub(m.ent)?{t:'🔒 GM만 보게 (공개 끄기)',on:()=>pubSet(gid,mid,false)}:{t:'👁 공개로 (자료 탭 항목에)',on:()=>pubSet(gid,mid,true)},
    {t:'🔍 이 인물의 단서 더하기',on:()=>panelOpen({gid,mid,focus:'clue'})},'-',
    {t:'◀ 앞으로',on:()=>memStep(gid,mid,-1),dis:i<=0},{t:'▶ 뒤로',on:()=>memStep(gid,mid,1)},
    ...grps().filter(x=>x.id!==gid).slice(0,8).map(x=>({t:'→ '+(x.name||'(그룹)')+'(으)로 옮기기',on:()=>memMove(gid,mid,x.id,'')})),'-',
    {t:'🗑 인물 지우기',danger:1,on:()=>memDel(gid,mid)}].filter(x=>x==='-'||!x.dis)}
  const h=t.closest('.cg-grp');if(!h)return [];const gid=h.dataset.g;const g=N().data('grp',gid);if(!g)return [];const A=arcs();
  return [{t:'고치기 (옆 창)',on:()=>panelOpen({gid})},{t:'이름 바꾸기',on:()=>{const b=h.querySelector('.cg-gn');if(b)inlineEdit(b)}},{t:'＋ 인물 더하기',on:async()=>{const mid=await memAdd(gid);panelOpen({gid,mid,focus:'name'})}},{t:'🔍 단서 더하기',on:()=>panelOpen({gid,focus:'clue'})},'-',
   {t:'📇 인물 카드 한꺼번에 만들기',on:()=>grpCards(gid)},isPub(g.ent)?{t:'🔒 조직 카드 GM만 보게',on:()=>pubSet(gid,'',false)}:{t:'👁 조직 카드 공개로',on:()=>pubSet(gid,'',true)},g.ent&&ent(g.ent)?{t:'📇 조직 카드 열기',on:()=>goEnt(g.ent)}:{t:'📇 조직 카드 만들기',on:()=>orgCard(gid)},{t:'▶ 웹툴 무대로',on:()=>toStage(gid)},'-',
   {t:'▲ 위로',on:()=>grpStep(gid,-1)},{t:'▼ 아래로',on:()=>grpStep(gid,1)},...(colOf(g)!==ALL?[{t:'→ 상시(교사진 열)로',on:()=>grpPlace(gid,ALL,'')}]:[]),...A.filter(a=>a.id!==colOf(g)).map(a=>({t:`→ 사건 ${arcIdx(a.id)+1}(으)로`,on:()=>grpPlace(gid,a.id,'')})),...(colOf(g)?[{t:'→ 사건 미정으로',on:()=>grpPlace(gid,'','')}]:[]),'-',
   {t:'🗑 그룹 지우기',danger:1,on:()=>grpDel(gid)}]}

 /* ---- 판 단추 · 끌기 ---- */
 let DRAG=null;   /* {t:'grp', gid} | {t:'mem', gid, mid} | {t:'dr', k, id} */
 let clickT=null;
 function bind(el){
  el.addEventListener('click',async e=>{const dt=e.target.closest('[data-cdt]');if(dt){dSet(dt.dataset.cdt);return N().render()}
   if(e.target.closest('.cg-inl'))return;
   /* 서랍 칩을 누르면 넣을 그룹 고르기 (휴대폰은 끌기가 안 되니 이쪽으로) */
   const dr=e.target.closest('.bp-dr[data-dk]');if(dr&&N().ctxMenu){const r=dr.getBoundingClientRect();const L=grps();if(!L.length)return;N().ctxMenu(r.left,r.bottom+4,L.map(g=>({t:'→ '+(g.name||'(그룹)')+(realArc(g)?` · 사건 ${arcIdx(g.arc)+1}`:''),on:()=>dropDrawer(dr.dataset.dk,dr.dataset.did,g.id,'')})));return}
   const b=e.target.closest('[data-c]');if(!b||!el.contains(b))return;const k=b.dataset.c,id=b.dataset.id;
   if(k==='seed')return seed();if(k==='copy')return copyOut();if(k==='link')return linkByName();if(k==='seedall'){const gid=await seedAll();return panelOpen({gid})}
   if(k==='gnew'){const gid=await grpNew(b.dataset.arc||'');return panelOpen({gid,focus:'name'})}
   if(k==='mnew'){e.stopPropagation();const mid=await memAdd(id);return panelOpen({gid:id,mid,focus:'name'})}
   if(k==='clue'){e.stopPropagation();return panelOpen({gid:id,focus:'clue'})}
   /* 이름 칸은 두 번 누르기를 기다린다 (한 번 = 옆 창) */
   const ed=e.target.closest('[data-ed]');const go=()=>{if(k==='grp')panelOpen({gid:id});else if(k==='mem')panelOpen({gid:id,mid:b.dataset.m})};
   if(ed){clearTimeout(clickT);clickT=setTimeout(go,230);return}go()});
  el.addEventListener('dblclick',e=>{const ed=e.target.closest('[data-ed]');if(!ed||!el.contains(ed))return;e.preventDefault();clearTimeout(clickT);inlineEdit(ed)});
  el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.cg-m')){e.preventDefault();e.target.click()}if(e.key==='F2'&&e.target.matches&&e.target.matches('.cg-m[data-m]')){e.preventDefault();const b=e.target.querySelector('.cg-mn');if(b)inlineEdit(b)}});
  if(N().bindCtx)N().bindCtx(el,'.cg-m[data-m],.cg-gh,.cg-grp',t=>ctxItems(t));
  el.addEventListener('dragstart',e=>{if(e.target.closest&&e.target.closest('.cg-inl')){e.preventDefault();return}
   const d=e.target.closest&&e.target.closest('.bp-dr[data-dk]');if(d){DRAG={t:'dr',k:d.dataset.dk,id:d.dataset.did};e.dataTransfer.setData('text/plain','dr|'+d.dataset.did);e.dataTransfer.effectAllowed='copy';el.classList.add('cg-mdrag');return}
   const m=e.target.closest&&e.target.closest('.cg-m[data-m]');if(m){DRAG={t:'mem',gid:m.dataset.id,mid:m.dataset.m};e.dataTransfer.setData('text/plain','mem|'+m.dataset.m);e.dataTransfer.effectAllowed='move';el.classList.add('cg-mdrag');return}
   const h=e.target.closest&&e.target.closest('.cg-gh');if(h){DRAG={t:'grp',gid:h.dataset.id};e.dataTransfer.setData('text/plain','grp|'+h.dataset.id);e.dataTransfer.effectAllowed='move';el.classList.add('cg-gdrag')}});
  el.addEventListener('dragend',()=>{DRAG=null;el.classList.remove('cg-mdrag','cg-gdrag');$$('.cg-over',el).forEach(x=>x.classList.remove('cg-over'))});
  const isFile=e=>!DRAG&&e.dataTransfer&&[...(e.dataTransfer.types||[])].includes('Files');
  const tgt=e=>{const c=s=>e.target.closest&&e.target.closest(s);if(isFile(e))return c('.cg-m')||c('.cg-grp');if(!DRAG)return null;if(DRAG.t==='mem'||DRAG.t==='dr')return c('.cg-m')||c('.cg-grp');return c('.cg-grp')||c('.cg-col')};
  el.addEventListener('dragover',e=>{const t=tgt(e);if(!t)return;e.preventDefault();e.dataTransfer.dropEffect=isFile(e)||(DRAG&&DRAG.t==='dr')?'copy':'move';$$('.cg-over',el).forEach(x=>{if(x!==t)x.classList.remove('cg-over')});t.classList.add('cg-over')});
  el.addEventListener('dragleave',e=>{const t=e.target.closest&&e.target.closest('.cg-over');if(t&&!t.contains(e.relatedTarget))t.classList.remove('cg-over')});
  el.addEventListener('drop',async e=>{const t=tgt(e);if(!t)return;e.preventDefault();t.classList.remove('cg-over');const gid=t.dataset.g||t.dataset.id;const mid=t.dataset.m||'';
   if(isFile(e)){const f=[...e.dataTransfer.files].find(x=>/^image\//.test(x.type));if(!f)return N().toast('그림 파일만 넣을 수 있어요');const r=await upImg(gid,mid,f);if(r&&!mid)N().toast('새 인물 칸에 그림을 넣었어요 — 이름을 두 번 눌러 적어요');return}
   const D=DRAG;DRAG=null;if(!D)return;
   if(D.t==='dr')return dropDrawer(D.k,D.id,gid,mid);
   if(D.t==='mem')return memMove(D.gid,D.mid,gid,mid);
   if(t.classList.contains('cg-grp')){const g=N().data('grp',t.dataset.g);if(g)return grpPlace(D.gid,colOf(g),t.dataset.g);return}
   if(t.classList.contains('cg-col'))return grpPlace(D.gid,t.dataset.col,'')})}

 /* ---- 옆 창 (도안과 같은 모양 · .bp-panel 을 같이 쓴다) ---- */
 let P=null;   /* {gid, mid('' = 그룹), focus} */
 const panelEl=()=>document.getElementById('cgPanel');
 function panelClose(){const el=panelEl();if(el){const f=el.querySelector(':focus');if(f&&f.blur)f.blur();el.classList.remove('on');setTimeout(()=>{if(!P&&el.parentNode)el.remove()},180)}const had=!!P;P=null;document.body.classList.remove('cg-panel-on');if(had)$$('.cg-sel').forEach(x=>x.classList.remove('cg-sel'))}
 function panelOpen(t){P=Object.assign({mid:'',focus:''},t);let el=panelEl();if(!el){el=document.createElement('aside');el.id='cgPanel';el.className='bp-panel cg-panel';document.body.appendChild(el);panelBind(el);requestAnimationFrame(()=>el.classList.add('on'))}else el.classList.add('on');
  document.body.classList.add('cg-panel-on');panelDraw();$$('.cg-sel').forEach(x=>x.classList.remove('cg-sel'));const q=P.mid?`.cg-m[data-m="${CSS.escape(P.mid)}"]`:`.cg-grp[data-g="${CSS.escape(P.gid)}"]`;$$(q).forEach(x=>x.classList.add('cg-sel'));if(!P.focus)el.scrollTop=0}
 function panelSync(){if(!P)return;if(!N().data('grp',P.gid)||(P.mid&&!mOf(P.gid,P.mid)))return panelClose();const el=panelEl();if(!el)return;const f=document.activeElement;if(f&&el.contains(f)&&/^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName))return;panelDraw()}
 const fld=(lab,inner,hint)=>`<div class="bp-f"><label>${lab}${hint?`<small>${hint}</small>`:''}</label>${inner}</div>`;
 const inp=(f,v,ph)=>`<input type="text" data-f="${f}" value="${esc(v||'')}" placeholder="${esc(ph||'')}">`;
 const txa=(f,v,rows,ph)=>`<textarea data-f="${f}" rows="${rows||3}" placeholder="${esc(ph||'')}">${esc(v||'')}</textarea>`;
 /* 11-13 08:32 망령 「이미지는 포트랑 스탠딩 따로 · 입력 UI 가시성 개선」: 옆 창을 칸 묶음(카드)으로 — 머리 · 설명 · 내용. 칸 이름은 크고 밝게, 설명은 그 아래 작게 */
 const sec=(title,hint,inner,cls,extra)=>`<section class="cg-sec ${cls||''}"><header><b>${title}</b>${extra||''}</header>${hint?`<p class="cg-hint">${hint}</p>`:''}${inner}</section>`;
 const row=(lab,inner,hint)=>`<div class="cg-row"><label class="cg-lab">${lab}${hint?`<small>${hint}</small>`:''}</label>${inner}</div>`;
 /* 그림 칸 (k = face 포트 | img 스탠딩) */
 function imgSlot(m,k){const own=m[k]||'';const show=k==='face'?faceOf(m):stOf(m);const borrowed=!own&&show;const lab=k==='face'?'포트':'스탠딩';
  return `<div class="cg-slot k-${k} ${show?'has':''}" data-p="img" data-k="${k}" tabindex="0" title="눌러서 ${lab} 고르기 · 그림 파일 끌어 놓기 · 이 칸을 누른 뒤 Ctrl+V">
   <span class="cg-slab">${lab}${borrowed?' <i>(빌려 옴)</i>':''}</span>${show?`<img src="${esc(show)}" alt="">`:`<span class="cg-sph">＋<br><small>${k==='face'?'얼굴 · 정사각':'전신 · 세로'}</small></span>`}
   ${own?`<button type="button" class="cg-sx" data-p="imgx" data-k="${k}" title="${lab} 빼기">✕</button>`:''}<input type="file" accept="image/*" hidden data-nosave data-k="${k}"></div>`}
 /* 단서 칸 (그룹 = 그룹 전체 · 인물 = 그 인물이 쥔 것) */
 function clueSec(g,mid){const L=clues(g.id,mid);const arcOk=!!realArc(g);const ms=g.mem||[];const open=P.copen||{};
  const inner=`${L.map(c=>{const w=ms.find(m=>m.id===c.who);const op=open[c.id];return `<div class="bp-cr ${c.ok?'ok':''}"><div class="bp-cr1"><input type="checkbox" data-cok="${esc(c.id)}" ${c.ok?'checked':''} title="찾음"><input type="text" data-cf="t|${esc(c.id)}" value="${esc(c.t||'')}" placeholder="단서 이름">${!mid&&w?`<small class="cg-cwho" title="이 단서를 쥔 인물">${esc(nameOf(w))}</small>`:''}<button type="button" class="bp-mini ${op?'on':''}" data-cop="${esc(c.id)}" title="설명 · 그림 · 쥔 인물">⋯</button><button type="button" class="bp-mini" data-cshow="${esc(c.id)}" title="웹툴 방에 지금 공개" ${arcOk?'':'disabled'}>🔍</button><button type="button" class="bp-mini" data-cdel="${esc(c.id)}" title="지우기">✕</button></div>
    ${op?`<div class="bp-cr2"><textarea data-cf="d|${esc(c.id)}" rows="2" placeholder="설명 — 웹툴 단서 카드에 나오는 글">${esc(c.d||'')}</textarea><input type="text" data-cf="img|${esc(c.id)}" value="${esc(c.img||'')}" placeholder="그림 주소 (선택)"><select data-cf="who|${esc(c.id)}"><option value="">쥔 인물 없음 (그룹)</option>${ms.map(m=>`<option value="${esc(m.id)}" ${c.who===m.id?'selected':''}>${esc(nameOf(m)||'(이름)')}</option>`).join('')}</select></div>`:''}</div>`}).join('')}
   <input type="text" class="bp-cnew" data-nosave data-cnew placeholder="＋ 단서 적고 Enter">
   ${!mid&&arcOk?`<div class="bp-clb"><button type="button" class="btn xs" data-p="clib" title="이 그룹의 단서를 웹툴 단서 보관 목록에 넣는다 (같은 것은 고쳐 넣음)">📥 웹툴 목록에</button><button type="button" class="btn xs ghost" data-p="blue" title="도안에서 이 사건 보기">도안에서 보기</button></div>`:''}`;
  return sec(`🔍 단서 <small class="cg-cnt">${L.filter(c=>c.ok).length} / ${L.length}</small>`,arcOk?`도안 「사건 ${arcIdx(g.arc)+1}」 단서와 같은 것 — 🔍 누르면 웹툴 방에 공개`:(g.arc===ALL?'상시 그룹':'사건 미정')+' — 그룹이 맡아 둬요 (사건에 놓으면 도안 · 웹툴과 이어져요)',inner,'cl bp-cl')}
 /* 공개 칸: 공개 소개 글 + 지금 상태 + 공개로 / GM만 단추 */
 function pubBox(g,m){const id=m?m.ent:g.ent;const on=isPub(id);const has=id&&ent(id);const v=m?m.pub:g.pub;
  const st=`<span class="cg-pubst ${on?'on':''}">${on?'공개 중':has?'GM만 · 카드 있음':'GM만'}</span>`;
  return sec('👁 공개 소개',on?'PL 도 자료 탭 항목에서 이 글을 봐요 · 고치면 저절로 맞춰요':'「공개로」를 누르면 이름 · 그림 · 소속과 <b>이 글만</b> PL 에게 보여요',
   txa('pub',v,4,m?'PL 이 알아도 되는 것 — 겉모습 · 하는 일 · 평판':'PL 이 알아도 되는 것 — 겉으로 알려진 모습 · 하는 일')
   +`<div class="cg-acts">${on?`<button type="button" class="btn sm ghost" data-p="pubx">🔒 GM만 보게</button><button type="button" class="btn sm ghost" data-p="pubgo">📇 항목 보기</button>`:`<button type="button" class="btn sm pri" data-p="pub">👁 공개로 (${m?'인물':'조직'} 카드)</button>`}</div>`,'pub '+(on?'on':''),st)}
 const gmBox=(f,v,hint,ph)=>sec('🔒 GM 설정','공개해도 <b>절대 안 나가요</b> — '+hint,txa(f,v,6,ph||''),'gm');
 function panelDraw(){const el=panelEl();if(!el||!P)return;const g=N().data('grp',P.gid);if(!g)return panelClose();const L=grps();const gi=L.findIndex(x=>x.id===g.id);const col=grpCol(g,gi);const keep=el.scrollTop;let body='',foot='',kick='';const A=arcs();
  if(!P.mid){kick=`<b>GROUP</b><span>그룹 · 조직${realArc(g)?' · 사건 '+(arcIdx(g.arc)+1):g.arc===ALL?' · 상시':''}</span>`;const oc=g.ent&&ent(g.ent);
   body=`<input type="text" class="bp-title" data-f="name" value="${esc(g.name||'')}" placeholder="그룹 이름 — 예: 대성당">`
    +sec('기본','',
      row('사건',`<select data-f="arc"><option value="">사건 미정</option><option value="${ALL}" ${g.arc===ALL?'selected':''}>상시 (교사진 · 캠페인 내내)</option>${A.map((a,i)=>`<option value="${esc(a.id)}" ${realArc(g)===a.id?'selected':''}>사건 ${i+1} · ${esc(a.name||'')}</option>`).join('')}</select>`,'바꾸면 단서도 따라가요')
      +row('색',`<div class="bp-sw" data-seg="color">${PAL.map(c=>`<button type="button" data-v="${c}" class="${(g.color||'')===c?'on':''}" style="--c:${c}" title="${c}"></button>`).join('')}</div>`)
      +row('한 줄',inp('line',g.line,'이 그룹이 이야기에서 맡는 것'),'판에만 보여요')
      +row('커뮤 장소',inp('place',g.place,'PL 이 이 그룹을 만나러 가는 곳 — 예: 대성당 회랑')))
    +pubBox(g,null)
    +gmBox('desc',g.desc,'분위기 · 목적 · 세 사람의 관계 · 비밀','예: 겉으로는 자선 · 안에서는 교리 싸움. 수녀는 교주를 존경하지만 사제는 …')
    +sec(`인물 <small class="cg-cnt">${(g.mem||[]).length}명</small>`,'이름을 누르면 그 인물로',`<div class="cg-pml">${(g.mem||[]).map((m,j)=>{const u=faceOf(m);return `<div class="cg-pmr"><i class="cg-pav" ${u?`style="background-image:url('${esc(cssu(u))}')"`:''}></i><button type="button" class="linkbtn" data-p="mopen" data-m="${esc(m.id)}">${nameOf(m)?esc(nameOf(m)):'(이름)'}</button>${sexTag(m,'cg-psx')}${m.role?`<small class="cg-prl r-${m.role}">${RL[m.role]}</small>`:''}${isPub(m.ent)?'<small class="cg-prl pub">공개</small>':m.ent&&ent(m.ent)?'<small title="인물 카드 있음">📇</small>':''}<span class="sp"></span><button type="button" class="bp-pclose" data-p="mup" data-m="${esc(m.id)}" ${j?'':'disabled'} title="앞으로">▲</button><button type="button" class="bp-pclose" data-p="mdn" data-m="${esc(m.id)}" ${j<g.mem.length-1?'':'disabled'} title="뒤로">▼</button></div>`}).join('')||'<span class="bp-nil">없음</span>'}</div>`,'',`<button type="button" class="bp-plus" data-p="mnew">＋ 인물</button>`)
    +clueSec(g,'')
    +sec('📇 카드 · 연동','자료 탭 항목 — 관계도 · 도안 · 검색 · 웹툴 무대가 써요',`<div class="cg-acts"><button type="button" class="btn sm" data-p="cards">📇 인물 카드 한꺼번에</button>${oc?'<button type="button" class="btn sm ghost" data-p="org">📇 조직 카드 열기</button>':''}<button type="button" class="btn sm ghost" data-p="stage" title="인물 카드가 있는 셋까지 웹툴 방 무대에">▶ 웹툴 무대로</button></div>`)
    +sec('메모','',txa('note',g.note,3,''));
   foot=`<button type="button" class="btn sm ghost" data-p="gup" title="같은 사건 안에서 위로">▲</button><button type="button" class="btn sm ghost" data-p="gdn" title="같은 사건 안에서 아래로">▼</button><span class="sp"></span><button type="button" class="btn sm ghost danger" data-p="gdel">🗑 그룹 지우기</button>`}
  else{const m=mOf(P.gid,P.mid);if(!m)return panelClose();const j=g.mem.findIndex(x=>x.id===m.id);const ce=m.ent&&ent(m.ent);const cn=m.npc&&N().data('npc',m.npc);
   kick=`<b>${esc(g.name||'그룹')}</b><span>인물 ${j+1} / ${g.mem.length}</span>`;
   body=`<div class="cg-imgs">${imgSlot(m,'face')}${imgSlot(m,'img')}</div>
     <details class="cg-urls" ${P.urls?'open':''}><summary>그림 주소로 넣기</summary>${row('포트 주소',`<input type="text" data-f="face" value="${esc(m.face||'')}" placeholder="https://…">`)}${row('스탠딩 주소',`<input type="text" data-f="img" value="${esc(m.img||'')}" placeholder="https://…">`)}</details>`
    +`<input type="text" class="bp-title" data-f="name" value="${esc(m.name||'')}" placeholder="${esc(nameOf(m)||'이름 — 예: 대성당 수녀')}">`
    +sec('기본','',
      row('역할',`<div class="bp-seg" data-seg="role">${ROLE.map(([k,l,t])=>`<button type="button" data-v="${k}" class="${(m.role||'')===k?'on':''}" title="${esc(t)}">${l}</button>`).join('')}</div>`,(ROLE.find(r=>r[0]===(m.role||''))||[])[2]||'')
      +row('성별',`<div class="bp-seg" data-seg="sex">${[['f','여 ♀'],['m','남 ♂'],['','예상대로']].map(([k,l])=>`<button type="button" data-v="${k}" class="${(m.sex||'')===k?'on':''}">${l}</button>`).join('')}</div>`,m.sex?'직접 고름':sexGuess(nameOf(m))?`이름으로 예상: ${SXL[sexGuess(nameOf(m))]} — 판에 「?」로 보여요`:'예상 못 함 — 골라 주세요')
      +row('한 줄',inp('line',m.line,'첫인상 · 말버릇 — 예: 늘 웃지만 눈은 안 웃는다'),'판에만 보여요'))
    +pubBox(g,m)
    +gmBox('note',m.note,'정체 · 원하는 것 · 비밀 · 그룹 안의 자리')
    +clueSec(g,m.id)
    +sec('📇 연결','',
      row('인물 카드',`<div class="cg-urow"><select data-f="ent"><option value="">잇지 않음</option>${chars().map(x=>`<option value="${esc(x.id)}" ${m.ent===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></div><div class="cg-acts">${ce?`<button type="button" class="btn sm" data-p="entgo">📇 카드 열기</button><button type="button" class="btn sm ghost" data-p="entsync" title="이름 · 그림 · 소속 · 공개 소개를 항목에 덮어쓴다 (GM 설정은 안 넣음)">↻ 카드에 반영</button>`:`<button type="button" class="btn sm" data-p="card">📇 인물 카드 만들기 (GM만)</button>`}</div>`,'자료 탭 「인물」 항목 — 관계도 · 도안 · 웹툴 무대가 써요')
      +row('NPC 시트',`<select data-f="npc"><option value="">잇지 않음</option>${npcs().map(x=>`<option value="${esc(x.id)}" ${m.npc===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`,cn?'그림이 없으면 시트 그림을 빌려 와요':'배틀 시트가 있는 인물이면')
      +row('그룹 옮기기',`<select data-p="mto">${L.map(x=>`<option value="${esc(x.id)}" ${x.id===g.id?'selected':''}>${esc(x.name||'(그룹)')}</option>`).join('')}</select>`,'단서도 같이 가요'));
   foot=`<button type="button" class="btn sm ghost" data-p="mprev" title="앞 인물">‹</button><button type="button" class="btn sm ghost" data-p="mnext" title="다음 인물">›</button><button type="button" class="btn sm ghost" data-p="ggo" title="그룹 고치기">그룹</button><span class="sp"></span><button type="button" class="btn sm ghost danger" data-p="mdel">🗑 인물 지우기</button>`}
  el.style.setProperty('--ac',col);
  el.innerHTML=`<div class="bp-ph"><div class="bp-pk">${kick}</div><span class="sp"></span><small class="bp-saved" id="cgSaved"></small><button type="button" class="bp-pclose" data-p="close" title="닫기 (Esc)">✕</button></div><div class="bp-pb">${body}</div>${foot?`<div class="bp-pf">${foot}</div>`:''}`;
  el.scrollTop=keep;if(P.focus){const f=P.focus;P.focus='';const q=f==='clue'?el.querySelector('[data-cnew]'):el.querySelector(`[data-f="${f}"]`);if(q){q.focus();if(q.scrollIntoView)q.scrollIntoView({block:'center'})}}}
 let savedT=null;const saved=()=>{const s=document.getElementById('cgSaved');if(!s)return;s.textContent='저장됨';s.classList.add('on');clearTimeout(savedT);savedT=setTimeout(()=>s.classList.remove('on'),1200)};
 async function setF(f,v){if(!P)return;if(!P.mid&&f==='arc'){await setArc(P.gid,v);saved();return panelDraw()}const gid=P.gid,mid=P.mid;const r=mid?await mSave(gid,mid,m=>{m[f]=v}):await gSave(gid,g=>{g[f]=v});if(r!==false)saved();if(mid&&f==='ent'&&v)await arcLinkEnt(gid,v);if(['name','img','face','pub'].includes(f))await pubSync(gid,mid)}
 async function pickFile(f,k){if(!P||!f)return;const gid=P.gid,mid=P.mid;await upImg(gid,mid,f,k||'');saved()}
 function panelBind(el){
  el.addEventListener('change',async e=>{const t=e.target;if(!P)return;
   if(t.type==='file'){const f=t.files&&t.files[0];t.value='';return pickFile(f,t.dataset.k)}
   if(t.dataset.p==='mto'){if(t.value!==P.gid)await memMove(P.gid,P.mid,t.value,'');saved();return}
   if(t.dataset.cok){await clueEdit(P.gid,t.dataset.cok,c=>{c.ok=t.checked});saved();return}
   if(t.dataset.cf){const [k,cid]=t.dataset.cf.split('|');const v=k==='d'?t.value:t.value.trim();await clueEdit(P.gid,cid,c=>{c[k]=v});saved();if(k==='who')panelDraw();return}
   if(t.dataset.f){const v=t.tagName==='TEXTAREA'?t.value:t.value.trim();await setF(t.dataset.f,v);if(['ent','img','face','npc'].includes(t.dataset.f)){if(t.dataset.f==='img'||t.dataset.f==='face')P.urls=1;panelDraw()}}});
  el.addEventListener('keydown',async e=>{const t=e.target;if(e.key==='Escape')return panelClose();
   if(e.key==='Enter'&&!e.isComposing&&t.hasAttribute('data-cnew')){e.preventDefault();const v=t.value.trim();if(!v)return;t.value='';await clueAdd(P.gid,P.mid,v);saved();P.focus='clue';panelDraw();return}
   if(e.key==='Enter'&&!e.isComposing&&t.tagName==='INPUT'&&(t.dataset.f||t.dataset.cf))t.blur();
   if((e.key==='Enter'||e.key===' ')&&t.matches&&t.matches('.cg-slot')){e.preventDefault();const fi=t.querySelector('input[type=file]');if(fi)fi.click()}});
  el.addEventListener('paste',e=>{if(!P||!P.mid)return;const fs=[...((e.clipboardData||{}).files||[])].filter(f=>/^image\//.test(f.type));if(!fs.length)return;e.preventDefault();const z=e.target.closest&&e.target.closest('.cg-slot');pickFile(fs[0],z?z.dataset.k:'')});
  el.addEventListener('dragover',e=>{const z=e.target.closest&&e.target.closest('.cg-slot');if(!z)return;e.preventDefault();z.classList.add('over')});
  el.addEventListener('dragleave',e=>{const z=e.target.closest&&e.target.closest('.cg-slot');if(z&&!z.contains(e.relatedTarget))z.classList.remove('over')});
  el.addEventListener('drop',e=>{const z=e.target.closest&&e.target.closest('.cg-slot');if(!z)return;e.preventDefault();z.classList.remove('over');const f=[...(e.dataTransfer.files||[])].find(x=>/^image\//.test(x.type));if(f)pickFile(f,z.dataset.k)});
  el.addEventListener('click',async e=>{if(!P)return;const t=e.target;
   const sw=t.closest('[data-seg] [data-v]');if(sw){await setF(sw.parentElement.dataset.seg,sw.dataset.v);return panelDraw()}
   let c;if((c=t.closest('[data-cop]'))){P.copen=P.copen||{};P.copen[c.dataset.cop]=!P.copen[c.dataset.cop];return panelDraw()}
   if((c=t.closest('[data-cshow]')))return clueShow(P.gid,c.dataset.cshow);
   if((c=t.closest('[data-cdel]'))){await clueDel(P.gid,c.dataset.cdel);return panelDraw()}
   const b=t.closest('[data-p]');if(!b||b.tagName==='SELECT')return;const k=b.dataset.p;
   if(k==='close')return panelClose();
   if(k==='imgx'){e.stopPropagation();await setF(b.dataset.k||'img','');return panelDraw()}
   if(k==='img'){if(t.closest('input'))return;const fi=b.querySelector('input[type=file]');if(fi)fi.click();return}
   if(k==='mnew'){const mid=await memAdd(P.gid);return panelOpen({gid:P.gid,mid,focus:'name'})}
   if(k==='mopen')return panelOpen({gid:P.gid,mid:b.dataset.m});
   if(k==='mup'||k==='mdn'){await memStep(P.gid,b.dataset.m,k==='mup'?-1:1);return panelDraw()}
   if(k==='gup'||k==='gdn')return grpStep(P.gid,k==='gup'?-1:1);
   if(k==='gdel')return grpDel(P.gid);
   if(k==='mdel')return memDel(P.gid,P.mid);
   if(k==='ggo')return panelOpen({gid:P.gid});
   if(k==='card'){await memCard(P.gid,P.mid);return panelDraw()}
   if(k==='entgo'){const m=mOf(P.gid,P.mid);if(m&&m.ent)goEnt(m.ent);return}
   if(k==='entsync')return memCardSync(P.gid,P.mid);
   if(k==='cards'){await grpCards(P.gid);return panelDraw()}
   if(k==='org'){await orgCard(P.gid);return panelDraw()}
   if(k==='stage')return toStage(P.gid);
   if(k==='pub'||k==='pubx'){const f=document.activeElement;if(f&&el.contains(f)&&f.blur)f.blur();await new Promise(r=>setTimeout(r,60));return pubSet(P.gid,P.mid,k==='pub')}
   if(k==='pubgo'){const id=P.mid?(mOf(P.gid,P.mid)||{}).ent:(N().data('grp',P.gid)||{}).ent;if(id)goEnt(id);return}
   if(k==='clib')return clueLib(P.gid);
   if(k==='blue'){const g=N().data('grp',P.gid);const aid=realArc(g);panelClose();N().go('blue');if(aid&&window.NT_BLUE)setTimeout(()=>NT_BLUE.open({kind:'arc',aid}),80);return}
   if(k==='mprev'||k==='mnext'){const g=N().data('grp',P.gid);const i=g.mem.findIndex(x=>x.id===P.mid);const nx=g.mem[i+(k==='mprev'?-1:1)];if(!nx)return N().toast(k==='mprev'?'첫 인물이에요':'마지막 인물이에요');return panelOpen({gid:P.gid,mid:nx.id})}})}

 N().MOD.cast={render};
 window.NT_CAST={grps,clues,outline,open:panelOpen,close:panelClose,faceOf,nameOf,roles:RL,linkByName};
})();
