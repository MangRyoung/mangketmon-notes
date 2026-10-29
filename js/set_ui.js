/* ---------- 설정 탭 (GM · PL) ----------
   GM: 캠페인 이름 · 한 줄 · 표지 그림 · GM 비밀구 바꾸기 · PL 좌석(제작기 트레이너 id 에 비밀구) · 초대 링크 · 자료 내려받기 · 캠페인 지우기
   PL: 내 좌석 · 비밀구 바꾸기(없음 — GM 이 다시 준다) · 내려받기 */
"use strict";
(()=>{
 const N=()=>window.NT;const {$,$$,esc,cssu}=window.NT;
 const base=()=>location.origin+location.pathname;
 /* 10-26 망령: 캠페인 칸 초안 — 실시간 갱신으로 다시 그려도 적던 글이 안 날아가게. 저장하면 비운다 */
 const DR={camp:'',name:null,sub:null,cover:null};
 const drFor=camp=>{if(DR.camp!==camp){DR.camp=camp;DR.name=DR.sub=DR.cover=DR.theme=DR.skin=null}return DR};
 const link=(secret)=>`${base()}?c=${encodeURIComponent(N().ST.camp)}${secret?'&pl='+encodeURIComponent(secret):''}#c=${encodeURIComponent(N().ST.camp)}`;
 function render(el){const S=N().ST;const c=S.campInfo||{};const d=c.data||{};const G=N().gm();
  if(!G){el.innerHTML=`<div class="setgrid"><div class="card"><h3>내 좌석</h3><p>${N().me()?`<b>${esc(N().seatName(N().me())||N().me())}</b> 좌석으로 들어와 있어요. PC 시트 탭에서 내 시트를 고칠 수 있어요.`:'구경 모드예요. 위 「비밀구」로 GM 이 준 좌석 비밀구를 적으면 내 PC 시트를 고칠 수 있어요.'}</p><p class="small dim">비밀구는 이 브라우저에만 저장돼요. 다른 기기에서는 GM 이 준 링크를 한 번 열면 돼요.</p></div>
   <div class="card"><h3>공개 링크</h3><div class="linkbox"><input type="text" readonly value="${esc(link())}" id="lkPub"><button class="btn xs" data-copy="lkPub">복사</button></div></div></div>`;bindCopy(el);return}
  const dr=drFor(S.camp);const vName=dr.name!=null?dr.name:(c.name||''),vSub=dr.sub!=null?dr.sub:(d.sub||''),vCover=dr.cover!=null?dr.cover:(d.cover||'');
  el.innerHTML=`<div class="setgrid">
   <div class="card"><h3>캠페인</h3><label class="lbl">이름<input id="cpName" type="text" value="${esc(vName)}"></label><label class="lbl" style="margin-top:6px">한 줄 (세션 수 · 기간 …)<input id="cpSub" type="text" value="${esc(vSub)}" placeholder="예: 13세션 · 1부 6 · 2부 6 · 최종 1"></label>
    <div class="row" style="margin-top:6px;gap:8px;align-items:flex-end"><label class="lbl" style="flex:1;min-width:150px">기본 테마<select id="cpTheme"><option value="">정하지 않음 (각자 고른 테마)</option>${N().VT.map(([k,l])=>`<option value="${k}" ${(dr.theme!=null?dr.theme:d.theme||'')===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label><label class="lbl" style="flex:1;min-width:150px">꾸밈<select id="cpSkin">${N().SKINS.map(([k,l])=>`<option value="${k}" ${(dr.skin!=null?dr.skin:d.skin||'')===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label></div>
    <p class="small dim" style="margin:4px 0 0">기본 테마 = 이 캠페인을 열면 그 테마로 보여요(위 띠에서 바꾸면 각자 고른 것). 꾸밈 = 캠페인 분위기 장식(대학: 학생증 PC 시트 · 도서 목록 카드 항목 · 도면 지도 틀).</p>
    <div class="sec">표지 그림 (캠페인 목록 카드)</div><div class="updz" id="cpDz"><div class="pv" style="${vCover?`background-image:url('${cssu(vCover)}')`:''}"></div><b>＋ 그림</b></div>
    <div class="acts"><button class="btn xs ghost" id="cpCoverX">표지 빼기</button><span class="sp"></span><button class="btn pri sm" id="cpOk">저장</button></div></div>
   <div class="card"><h3>링크</h3><div class="small dim">공개 링크 — 링크만 있으면 「모두」로 둔 것만 보여요</div><div class="linkbox"><input type="text" readonly value="${esc(link())}" id="lkPub"><button class="btn xs" data-copy="lkPub">복사</button></div>
    <div class="small dim" style="margin-top:8px">GM 링크 — 비밀구가 들어 있어요. 내 다른 기기에서만 열어요</div><div class="linkbox"><input type="text" readonly value="${esc(base()+'?c='+encodeURIComponent(S.camp)+'&gm='+encodeURIComponent(S.secret)+'#c='+encodeURIComponent(S.camp))}" id="lkGm"><button class="btn xs" data-copy="lkGm">복사</button></div>
    <div class="acts"><button class="btn xs ghost" id="gmSecBtn">GM 비밀구 바꾸기</button></div></div>
   ${linkCard(d)}
   <div class="card" style="grid-column:1/-1"><h3>PL 좌석 <small>좌석 id = 제작기 트레이너 id · 그 PL 은 자기 PC 시트만 고칠 수 있어요</small></h3>
    <div id="seatList">${(S.seats||[]).map(s=>`<div class="seatrow"><div><b>${esc(N().seatName(s.seat)||s.seat)}</b> <small>${esc(s.name||'')} · <code>${esc(s.seat)}</code></small></div><div class="row" style="gap:4px"><button class="btn xs" data-seat="link" data-id="${esc(s.seat)}">초대 링크</button><button class="btn xs ghost" data-seat="reset" data-id="${esc(s.seat)}">비밀구 다시</button><button class="btn xs ghost danger" data-seat="del" data-id="${esc(s.seat)}">빼기</button></div></div>`).join('')||'<div class="small dim">좌석이 없어요</div>'}</div>
    <div class="acts"><button class="btn sm pri" id="seatAdd">＋ 좌석 (PC 시트의 트레이너에게)</button></div></div>
   <div class="card"><h3>자료</h3><div class="acts"><button class="btn sm" id="dlJson">전체 내려받기 (JSON)</button><button class="btn sm ghost" id="ulJson">JSON 올리기 (덮어쓰기)</button><input type="file" id="ulFile" accept="application/json" hidden></div><p class="small dim">그림은 주소만 들어 있어요 (Supabase 저장소).</p></div>
   <div class="card"><h3>위험</h3><div class="acts"><button class="btn sm ghost danger" id="cpDel">캠페인 지우기</button></div></div></div>`;
  bindCopy(el);bindLink(el,d);
  $('#cpName',el).oninput=e=>{dr.name=e.target.value};$('#cpSub',el).oninput=e=>{dr.sub=e.target.value};$('#cpTheme',el).onchange=e=>{dr.theme=e.target.value};$('#cpSkin',el).onchange=e=>{dr.skin=e.target.value};
  N().bindDrop($('#cpDz',el),async fs=>{try{dr.cover=await N().upload(fs[0],'thumb','cover');$('#cpDz .pv',el).style.backgroundImage=`url('${cssu(dr.cover)}')`}catch(e){N().toast('올리기 실패: '+e.message)}});
  $('#cpCoverX',el).onclick=()=>{dr.cover='';$('#cpDz .pv',el).style.backgroundImage=''};
  $('#cpOk',el).onclick=async()=>{const cover=dr.cover!=null?dr.cover:(d.cover||'');try{await N().DBS().campUpdate(S.camp,S.secret,$('#cpName',el).value.trim()||c.name,Object.assign({},d,{sub:$('#cpSub',el).value.trim(),cover,theme:$('#cpTheme',el).value,skin:$('#cpSkin',el).value}));dr.name=dr.sub=dr.cover=dr.theme=dr.skin=null;N().toast('저장했어요');N().refreshCamp()}catch(e){N().toast('저장 실패: '+e.message)}};
  $('#gmSecBtn',el).onclick=async()=>{const v=await N().promptBox('새 GM 비밀구 (6자 이상)','','');if(v==null)return;try{await N().DBS().gmSecret(S.camp,S.secret,v.trim());S.secret=v.trim();try{localStorage.setItem('nt_sec_'+S.camp,S.secret)}catch(e){}N().toast('바꿨어요');N().render()}catch(e){N().toast('실패: '+e.message)}};
  $('#seatAdd',el).onclick=async()=>{const pcs=N().list('pc').filter(p=>!(S.seats||[]).some(s=>s.seat===p.id));if(!pcs.length)return N().toast('좌석을 줄 PC 가 없어요 — PC 시트 탭에서 먼저 PC 를 넣어요');
   const md=N().openModal(`<div class="mhead"><h2>PL 좌석 만들기</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="mrow"><label class="lbl">PC<select id="stPc">${pcs.map(p=>`<option value="${esc(p.id)}">${esc(p.name||p.id)}</option>`).join('')}</select></label><label class="lbl">플레이어 이름<input id="stName" type="text"></label><label class="lbl">비밀구 (4자 이상)<input id="stSec" type="text" value="${esc(Math.random().toString(36).slice(2,8))}"></label></div><p class="small dim">만든 뒤 「초대 링크」를 그 플레이어에게 보내요. 링크에 비밀구가 들어 있어요.</p><div class="row" style="margin-top:12px"><span class="sp"></span><button class="btn pri" id="stOk">만들기</button></div>`);
   $('#stOk',md).onclick=async()=>{const seat=$('#stPc',md).value,sec=$('#stSec',md).value.trim(),name=$('#stName',md).value.trim();if(sec.length<4)return N().toast('비밀구는 4자 이상');try{await N().DBS().seatSet(S.camp,S.secret,seat,sec,name);N().closeModal();N().toast('좌석을 만들었어요');showLink(seat,sec);N().refreshCamp()}catch(e){N().toast('실패: '+e.message)}}};
  $$('[data-seat]',el).forEach(b=>b.onclick=async()=>{const k=b.dataset.seat,seat=b.dataset.id;
   if(k==='link'){const sec=await N().promptBox('이 좌석의 비밀구 (링크에 넣을 것 — 저장돼 있지 않아 다시 적어요)','','');if(sec==null||!sec.trim())return;showLink(seat,sec.trim());return}
   if(k==='reset'){const sec=await N().promptBox('새 비밀구 (4자 이상)',Math.random().toString(36).slice(2,8),'');if(sec==null)return;try{await N().DBS().seatSet(S.camp,S.secret,seat,sec.trim(),null);N().toast('바꿨어요');showLink(seat,sec.trim());N().refreshCamp()}catch(e){N().toast('실패: '+e.message)}return}
   if(k==='del'){if(!await N().confirmBox('이 좌석을 뺄까요? 그 플레이어는 구경만 할 수 있게 돼요.','빼기'))return;try{await N().DBS().seatSet(S.camp,S.secret,seat,null,null);N().refreshCamp()}catch(e){N().toast('실패: '+e.message)}}});
  $('#dlJson',el).onclick=()=>{const out={camp:c,exported:new Date().toISOString(),docs:[]};for(const k in N().D)for(const id in N().D[k])out.docs.push({kind:k,id,data:N().D[k][id].data,vis:N().D[k][id].vis});const bl=new Blob([JSON.stringify(out,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=`notes_${c.name||S.camp}_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
  $('#ulJson',el).onclick=()=>$('#ulFile',el).click();$('#ulFile',el).onchange=async()=>{const f=$('#ulFile',el).files[0];if(!f)return;try{const j=JSON.parse(await f.text());const rows=(j.docs||[]).filter(r=>r.kind&&r.id);if(!rows.length)return N().toast('문서가 없어요');
    const nImg=JSON.stringify(rows).split('"data:image/').length-1;
    if(!await N().confirmBox(`${rows.length}개 문서를 이 캠페인에 덮어쓸까요? (같은 id 는 바뀌고, 없는 건 더해져요)${nImg?`\n그림 ${nImg}장은 저장소에 올리고 주소로 바꿔요 — 시간이 좀 걸려요.`:''}`,'올리기'))return;
    let done=0;const up=async(u,kind,tag)=>{const bl=await (await fetch(u)).blob();const url=await N().upload(bl,kind,tag);done++;N().toast(`그림 올리는 중 ${done}/${nImg}`);return url};
    const walk=async(o,kind,key)=>{if(typeof o==='string')return o.startsWith('data:image/')?await up(o,kind==='maps'?'map':key==='face'?'face':'photo',kind):o;if(Array.isArray(o)){for(let i=0;i<o.length;i++)o[i]=await walk(o[i],kind,key);return o}if(o&&typeof o==='object'){for(const k in o)o[k]=await walk(o[k],kind,k);return o}return o};
    for(const r of rows)r.data=await walk(r.data,r.kind,'');
    for(let i=0;i<rows.length;i+=40)await N().putMany(rows.slice(i,i+40));
    if(j.camp&&j.camp.data&&j.camp.data.sub&&!d.sub){try{await N().DBS().campUpdate(S.camp,S.secret,null,Object.assign({},d,{sub:j.camp.data.sub}));N().refreshCamp()}catch(e){}}
    N().toast('올렸어요 · '+rows.length+'개')}catch(e){N().toast('실패: '+e.message)}$('#ulFile',el).value=''};
  $('#cpDel',el).onclick=async()=>{const v=await N().promptBox(`정말 지우려면 캠페인 이름 「${c.name}」 을 적어요`,'','');if(v==null)return;if(v.trim()!==c.name)return N().toast('이름이 달라요');try{await N().DBS().campDel(S.camp,S.secret);try{localStorage.removeItem('nt_sec_'+S.camp)}catch(e){}N().toast('지웠어요');N().ST.camps=[];N().leave()}catch(e){N().toast('실패: '+e.message)}}}
 /* 10-29 망령: 세 도구 잇기 — 제작기 폴더 · 웹툴 방 · 룰북. 웹툴 방 목록은 같은 주소(mangryoung.github.io)의 오레마스가 이 브라우저에 남긴 「최근 방」에서 */
 const omRooms=()=>{try{return (JSON.parse(localStorage.getItem('om_rooms')||'[]')||[]).filter(r=>r&&r.id)}catch(e){return []}};
 const roomId=v=>{const m=String(v||'').match(/[#&?]r=([a-z0-9]+)/i);return m?m[1]:/^[a-z0-9]{4,}$/i.test(String(v||'').trim())?String(v).trim():''};
 async function campPatch(fn){const S=N().ST;const c=S.campInfo||{};const d=JSON.parse(JSON.stringify(c.data||{}));fn(d);await N().DBS().campUpdate(S.camp,S.secret,null,d);if(S.campInfo)S.campInfo.data=d;await N().refreshCamp()}
 function linkCard(d){const MK=window.NT_MAKER;const fl=MK?MK.linked():[];const om=(d.om||{}).room||'';const R=omRooms();const rn=(R.find(r=>r.id===om)||{}).name||'';
  const nRb=N().list('ents').filter(e=>e.rb&&e.rb.ch).length,nMk=N().list('ents').filter(e=>e.mk).length;
  return `<div class="card linkcard" style="grid-column:1/-1"><h3>세 도구 잇기 <small>제작기 · 웹툴 · 룰북</small></h3><div class="lkgrid">
   <div class="lkc"><b>📁 제작기 폴더</b><p class="small dim">이 폴더에 만든 트레이너가 시트 탭에 「아직 안 넣은 트레이너」로 떠요.</p><div class="lkv">${fl.length?fl.map(id=>`<span class="chip static">📁 ${esc(MK.fpath(id)||MK.folderName(id))}</span>`).join(' '):'<span class="dim small">이어진 폴더 없음</span>'}</div><div class="acts"><button class="btn xs" id="lkMk">${fl.length?'폴더 바꾸기':'폴더 잇기'}</button></div></div>
   <div class="lkc"><b>🎲 웹툴 방</b><p class="small dim">이으면 위 막대에 「웹툴」 단추가 생기고, 웹툴에서 이 캠페인의 지도 · 관계도를 비밀구 없이 한 번에 가져와요.</p>
    <div class="lkv">${om?`<span class="chip static">🎲 ${esc(rn||'방')} <code>${esc(om)}</code></span> <a class="btn xs ghost" href="${esc(omUrl(om))}" target="oremas" rel="noopener">열기 ↗</a>`:'<span class="dim small">이어진 방 없음</span>'}</div>
    <div class="row" style="gap:4px;flex-wrap:wrap;margin-top:6px">${R.length?`<select id="lkOmSel"><option value="">이 브라우저의 최근 방에서 고르기</option>${R.map(r=>`<option value="${esc(r.id)}" ${r.id===om?'selected':''}>${esc(r.name||r.id)}</option>`).join('')}</select>`:''}<input id="lkOmIn" type="text" placeholder="또는 방 링크 · id 붙여 넣기" style="flex:1;min-width:150px"><button class="btn xs pri" id="lkOmOk">잇기</button>${om?'<button class="btn xs ghost" id="lkOmX">풀기</button>':''}</div></div>
   <div class="lkc"><b>📖 룰북</b><p class="small dim">자료 탭에서 항목을 고칠 때 「제작기 룰북 장」을 고르면, 룰북 원문을 그대로 보여 줘요. 룰북을 고치면 같이 바뀌어요.</p><div class="lkv small">룰북과 이어진 항목 <b>${nRb}</b>개 · 제작기 트레이너와 이어진 항목 <b>${nMk}</b>개</div><div class="acts"><a class="btn xs ghost" href="${esc(window.NT_RB?NT_RB.link(''):'#')}" target="_blank" rel="noopener">룰북 열기 ↗</a></div></div>
  </div></div>`}
 const omUrl=room=>String((window.NT_CONFIG||{}).oremasUrl||'https://mangryoung.github.io/oremas/').replace(/#.*$/,'')+'#r='+encodeURIComponent(room);
 function bindLink(el,d){const b=$('#lkMk',el);if(b)b.onclick=()=>window.NT_MAKER&&NT_MAKER.pickLinked();
  const ok=$('#lkOmOk',el);if(ok)ok.onclick=async()=>{const v=roomId(($('#lkOmIn',el)||{}).value)||(($('#lkOmSel',el)||{}).value||'');if(!v)return N().toast('방 링크나 id 를 적거나 골라 주세요');
   try{await campPatch(x=>{x.om=Object.assign({},x.om||{},{room:v})});N().toast('웹툴 방을 이었어요');N().render()}catch(e){N().toast('저장 실패: '+e.message)}};
  const sel=$('#lkOmSel',el);if(sel)sel.onchange=()=>{const i=$('#lkOmIn',el);if(i)i.value=''};
  const x=$('#lkOmX',el);if(x)x.onclick=async()=>{try{await campPatch(y=>{delete y.om});N().toast('웹툴 방 잇기를 풀었어요');N().render()}catch(e){N().toast('저장 실패: '+e.message)}}}
 function showLink(seat,sec){const u=link(sec);N().openModal(`<div class="mhead"><h2>초대 링크 — ${esc(N().seatName(seat)||seat)}</h2><span class="sp"></span><button class="btn ghost" data-x>닫기</button></div><div class="linkbox"><input type="text" readonly value="${esc(u)}" id="lkSeat"><button class="btn xs" data-copy="lkSeat">복사</button></div><p class="small dim">이 링크를 한 번 열면 그 브라우저에 좌석 비밀구가 저장돼요. 비밀구: <code>${esc(sec)}</code></p>`);bindCopy(document)}
 function bindCopy(root){$$('[data-copy]',root).forEach(b=>b.onclick=()=>{const i=$('#'+b.dataset.copy);if(!i)return;i.select();const done=()=>N().toast('복사했어요');if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(i.value).then(done,()=>{document.execCommand('copy');done()});else{document.execCommand('copy');done()}})}
 N().MOD.set={render};
 window.NT_LINK={omUrl,omRooms};
})();
