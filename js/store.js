/* ---------- 저장소 어댑터 (Supabase nt_* 표 · 없으면 localStorage) ----------
   앱(app.js)은 이 인터페이스만 쓴다:
     camps() · create(name,secret) · whoami(camp,secret) · campUpdate · campDel · gmSecret
     seats(camp) · seatSet(camp,secret,seat,plSecret,name) · claim(camp,seat,secret,name)
     all(camp,secret,since) → [{kind,id,data,vis,updated_at}] · ids(camp,secret) · get(camp,secret,kind,id)
     put(camp,secret,kind,id,data,vis) → updated_at · del · putMany(camp,secret,rows)
     uploadImage(path,blob) → 공개 주소 · subscribe(camp,{onDoc,onDel,onPing}) → 해제 함수 · ping(camp,msg)
     makerDocs(kind) → 제작기 문서 [{id,data}] */
"use strict";
window.NT_STORE=(()=>{
 const cfg=()=>window.NT_CONFIG||{};
 const configured=()=>!!(cfg().supabaseUrl&&cfg().supabaseKey&&window.supabase);
 let client=null;
 const sb=()=>{if(!client)client=window.supabase.createClient(cfg().supabaseUrl,cfg().supabaseKey,{realtime:{params:{eventsPerSecond:5}}});return client};
 const err=e=>{const m=(e&&(e.message||e.details))||String(e);const x=new Error(m.replace(/^.*?:\s*/,''));x.raw=e;return x};
 async function rpc(fn,args){const r=await sb().rpc(fn,args);if(r.error)throw err(r.error);return r.data}

 /* ===== Supabase ===== */
 const S={
  mode:'supabase',
  async camps(){const r=await sb().from('nt_camp').select('id,name,data,created_at,updated_at').order('created_at');if(r.error)throw err(r.error);return r.data||[]},
  create:(name,secret)=>rpc('nt_create',{p_name:name,p_gm_secret:secret}),
  whoami:(camp,secret)=>secret?rpc('nt_whoami',{p_camp:camp,p_secret:secret}):Promise.resolve(null),
  campUpdate:(camp,secret,name,data)=>rpc('nt_camp_update',{p_camp:camp,p_secret:secret,p_name:name==null?null:name,p_data:data==null?null:data}),
  campDel:(camp,secret)=>rpc('nt_camp_del',{p_camp:camp,p_secret:secret}),
  gmSecret:(camp,secret,nw)=>rpc('nt_gm_secret',{p_camp:camp,p_secret:secret,p_new:nw}),
  seats:camp=>rpc('nt_seats',{p_camp:camp}),
  seatSet:(camp,secret,seat,pl,name)=>rpc('nt_seat_set',{p_camp:camp,p_secret:secret,p_seat:seat,p_pl_secret:pl,p_name:name||''}),
  claim:(camp,seat,secret,name)=>rpc('nt_claim',{p_camp:camp,p_seat:seat,p_secret:secret,p_name:name||''}),
  all:(camp,secret,since)=>rpc('nt_all',{p_camp:camp,p_secret:secret||'',p_since:since||null}),
  ids:(camp,secret)=>rpc('nt_ids',{p_camp:camp,p_secret:secret||''}),
  async get(camp,secret,kind,id){const r=await rpc('nt_get',{p_camp:camp,p_secret:secret||'',p_kind:kind,p_id:id});return (r||[])[0]||null},
  put:(camp,secret,kind,id,data,vis)=>rpc('nt_put',{p_camp:camp,p_secret:secret,p_kind:kind,p_id:id,p_data:data,p_vis:vis||null}),
  del:(camp,secret,kind,id)=>rpc('nt_del',{p_camp:camp,p_secret:secret,p_kind:kind,p_id:id}),
  putMany:(camp,secret,rows)=>rpc('nt_put_many',{p_camp:camp,p_secret:secret,p_rows:rows}),
  async uploadImage(path,blob){const ext=(blob.type||'').includes('png')?'png':(blob.type||'').includes('webp')?'webp':(blob.type||'').includes('gif')?'gif':'jpg';const key=`${path}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,5)}.${ext}`;
   const r=await sb().storage.from(cfg().bucket||'oremas').upload(key,blob,{contentType:blob.type||'image/jpeg',cacheControl:'31536000',upsert:false});if(r.error)throw err(r.error);
   return sb().storage.from(cfg().bucket||'oremas').getPublicUrl(key).data.publicUrl},
  subscribe(camp,h){const ch=sb().channel('nt:'+camp,{config:{broadcast:{self:false}}});
   ch.on('postgres_changes',{event:'*',schema:'public',table:'nt_docs',filter:'camp=eq.'+camp},p=>{try{if(p.eventType==='DELETE'){const o=p.old||{};if(o.kind&&o.id)h.onDel&&h.onDel(o.kind,o.id)}else{const n=p.new||{};if(n.kind&&n.id)h.onDoc&&h.onDoc(n.kind,n.id,n.data,n.vis,n.updated_at)}}catch(e){console.warn('rt',e)}});
   ch.on('broadcast',{event:'nt'},({payload})=>{try{h.onPing&&h.onPing(payload||{})}catch(e){}});
   ch.subscribe(st=>{h.onStatus&&h.onStatus(st)});S._ch=ch;
   return ()=>{try{sb().removeChannel(ch)}catch(e){}}},
  ping(camp,msg){try{if(S._ch)S._ch.send({type:'broadcast',event:'nt',payload:msg})}catch(e){}},
  async makerDocs(kind){const out=[];let from=0;const PAGE=1000;
   for(;;){const r=await sb().from(cfg().makerTable||'docs').select('id,data').eq('kind',kind).order('id').range(from,from+PAGE-1);if(r.error)throw err(r.error);const rows=r.data||[];out.push(...rows);if(rows.length<PAGE)break;from+=PAGE}
   return out},
  /* 10-26 망령: 노트 → 제작기 보내기. 제작기 문서 한 장 읽기 · 쓰기 (트레이너 doc = {ord, data:{…, pids}}) */
  /* 10-29 변동 사항만: since 뒤에 바뀐 제작기 문서(updated_at) · 지금 있는 id 목록(내용 없이) */
  async makerSince(kind,since){const out=[];let from=0;for(;;){let q=sb().from(cfg().makerTable||'docs').select('id,data,updated_at').eq('kind',kind);if(since)q=q.gt('updated_at',since);const r=await q.order('updated_at').order('id').range(from,from+999);if(r.error)throw err(r.error);const rows=r.data||[];out.push(...rows);if(rows.length<1000)break;from+=rows.length}return out},
  async makerIds(kind){const out=[];let from=0;for(;;){const r=await sb().from(cfg().makerTable||'docs').select('id').eq('kind',kind).order('id').range(from,from+999);if(r.error)throw err(r.error);const rows=r.data||[];out.push(...rows.map(x=>x.id));if(rows.length<1000)break;from+=rows.length}return out},
  async makerGet(kind,id){const r=await sb().from(cfg().makerTable||'docs').select('id,data').eq('kind',kind).eq('id',id).maybeSingle();if(r.error)throw err(r.error);return r.data||null},
  async makerPut(kind,id,data){const r=await sb().from(cfg().makerTable||'docs').upsert({kind,id,data},{onConflict:'kind,id'});if(r.error)throw err(r.error);return true},
  /* 10-29 망령: PC 시트 휴대폰 — 이어 둔 웹툴 방(om_*)의 방 코드(파티) · 문자를 웹툴과 같은 표 · 같은 함수로 읽고 쓴다.
     신분은 같은 주소의 웹툴이 이 브라우저에 남긴 계정 · GM 비밀값 · 좌석 비밀값으로 om_whoami 에 묻는다 */
  omWho:(room,secret)=>rpc('om_whoami',{p_room:room,p_secret:secret||''}),
  async omPhoneState(room){const r=await sb().from('om_state').select('tr:data->roster->trainers,pub:data->pub,nodes:data->graph->nodes,sms:data->rp->sms,seats:data->seats').eq('room',room).maybeSingle();if(r.error)throw err(r.error);return r.data||null},
  async omSms(room,after){let q=sb().from('om_log').select('id,at,who,kind,data').eq('room',room).eq('kind','chat').not('data->>sms','is',null).order('id',{ascending:false}).limit(400);if(after)q=q.gt('id',after);const r=await q;if(r.error)throw err(r.error);return (r.data||[]).reverse()},
  omLogAdd:(room,secret,kind,who,data)=>rpc('om_log_add',{p_room:room,p_secret:secret,p_kind:kind,p_who:who,p_data:data||{}}),
  async omPut(room,secret,path,value){const args={p_room:room,p_secret:secret,p_path:path,p_value:value===undefined?null:value};const r=await sb().rpc('om_put',args);if(!r.error)return r.data;if(/PGRST202|Could not find the function|does not exist/i.test(String(r.error.message||r.error.code||'')))return rpc('om_set_state',args);throw err(r.error)},
  omSub(room,onLog){const ch=sb().channel('ntom:'+room).on('postgres_changes',{event:'INSERT',schema:'public',table:'om_log',filter:'room=eq.'+room},p=>{try{if(p.new)onLog(p.new)}catch(e){}}).subscribe();return ()=>{try{sb().removeChannel(ch)}catch(e){}}},
  /* 로그 정리기 보관소 (kind mtlog): 목록은 제목 · 폴더 · 줄 수 · 날짜 · 세션 정보만 (본문은 안 받는다) */
  async mtlogIndex(){const r=await sb().from(cfg().makerTable||'docs').select('id,title:data->>title,folder:data->>folder,count:data->>count,created:data->>created,updated:data->>updated,meta:data->meta').eq('kind','mtlog').order('id');if(r.error)throw err(r.error);return r.data||[]},
  async mtlogMeta(){const r=await sb().from(cfg().makerTable||'docs').select('id,data').eq('kind','mtlogmeta');if(r.error)throw err(r.error);return r.data||[]}
 };

 /* ===== localStorage (시험 · 설정 없을 때) ===== */
 const LK='nt_local_v1';
 const L={
  mode:'local',_d:null,
  _load(){if(!this._d){try{this._d=JSON.parse(localStorage.getItem(LK)||'null')}catch(e){}this._d=this._d||{camps:{},auth:{},docs:{}}}return this._d},
  _save(){try{localStorage.setItem(LK,JSON.stringify(this._d))}catch(e){}},
  _who(camp,secret){const a=this._load().auth[camp]||{};if(!secret)return null;if(a.gm===secret)return 'gm';for(const s in a.pl||{})if(a.pl[s].secret===secret)return s;return null},
  _see(w,vis){return vis==='pub'||w==='gm'||(w&&vis==='pl:'+w)},
  async camps(){return Object.values(this._load().camps).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||''))},
  async create(name,secret){const d=this._load();const id=Math.random().toString(36).slice(2,10);const t=new Date().toISOString();d.camps[id]={id,name,data:{},created_at:t,updated_at:t};d.auth[id]={gm:secret,pl:{}};d.docs[id]={};this._save();return id},
  async whoami(camp,secret){return this._who(camp,secret)},
  async campUpdate(camp,secret,name,data){const c=this._load().camps[camp];if(!c)throw new Error('없는 캠페인');if(name!=null)c.name=name;if(data!=null)c.data=data;c.updated_at=new Date().toISOString();this._save();return true},
  async campDel(camp){const d=this._load();delete d.camps[camp];delete d.auth[camp];delete d.docs[camp];this._save();return true},
  async gmSecret(camp,secret,nw){this._load().auth[camp].gm=nw;this._save();return true},
  async seats(camp){const a=this._load().auth[camp]||{};return Object.entries(a.pl||{}).map(([seat,v])=>({seat,name:v.name||''}))},
  async seatSet(camp,secret,seat,pl,name){const a=this._load().auth[camp];a.pl=a.pl||{};if(pl==null)delete a.pl[seat];else a.pl[seat]={secret:pl,name:name||''};this._save();return true},
  async claim(camp,seat,secret,name){const a=this._load().auth[camp];a.pl=a.pl||{};const cur=a.pl[seat];if(cur&&cur.secret!==secret)return false;a.pl[seat]={secret,name:name||(cur||{}).name||''};this._save();return true},
  async all(camp,secret,since){const w=this._who(camp,secret);return Object.values(this._load().docs[camp]||{}).filter(x=>this._see(w,x.vis)&&(!since||x.updated_at>since))},
  async ids(camp,secret){return (await this.all(camp,secret)).map(x=>({kind:x.kind,id:x.id}))},
  async get(camp,secret,kind,id){const w=this._who(camp,secret);const x=(this._load().docs[camp]||{})[kind+'/'+id];return x&&this._see(w,x.vis)?x:null},
  async put(camp,secret,kind,id,data,vis){const w=this._who(camp,secret);if(!w)throw new Error('비밀구가 맞지 않습니다');const D=this._load().docs[camp]=this._load().docs[camp]||{};const cur=D[kind+'/'+id];const v=vis||(cur?cur.vis:'pub');const t=new Date().toISOString();D[kind+'/'+id]={kind,id,data:JSON.parse(JSON.stringify(data)),vis:v,updated_at:t};this._save();setTimeout(()=>L._h&&L._h.onDoc&&L._h.onDoc(kind,id,data,v,t),0);return t},
  async del(camp,secret,kind,id){const D=this._load().docs[camp]||{};delete D[kind+'/'+id];this._save();setTimeout(()=>L._h&&L._h.onDel&&L._h.onDel(kind,id),0);return true},
  async putMany(camp,secret,rows){for(const r of rows)await this.put(camp,secret,r.kind,r.id,r.data,r.vis);return rows.length},
  async uploadImage(path,blob){return await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(blob)})},
  subscribe(camp,h){this._h=h;setTimeout(()=>h.onStatus&&h.onStatus('SUBSCRIBED'),10);return ()=>{this._h=null}},
  ping(){},
  async makerDocs(kind){return Object.entries(this._mk||{}).filter(([k])=>k.startsWith(kind+'/')).map(([k,v])=>({id:k.slice(kind.length+1),data:v}))},
  async makerGet(kind,id){const v=(this._mk||{})[kind+'/'+id];return v?{id,data:v}:null},
  async makerPut(kind,id,data){this._mk=this._mk||{};this._mk[kind+'/'+id]=JSON.parse(JSON.stringify(data));return true},
  async mtlogIndex(){return [{id:'lg1',title:'1세션 · 무진 도착 (예시)',folder:'f1',count:420,created:Date.now()-86400000*7,updated:Date.now(),meta:{ep:'①',date:'2026.10.19',players:'명운 · 소라',tags:['무진','도입'],summary:'밀수입로로 들어와 눈먼 갈매기 술집에서 네 사람을 만났다.'}},{id:'lg2',title:'2세션 · 번역소 공통 배틀 (예시)',folder:'f1',count:610,created:Date.now()-86400000,updated:Date.now(),meta:{ep:'②',date:'2026.10.26',players:'명운 · 소라',tags:['배틀'],summary:''}}]},
  /* 시험용 웹툴 방 (휴대폰) */
  async omWho(){return this._omWho===undefined?'gm':this._omWho},
  async omPhoneState(){return this._om||null},
  async omSms(room,after){return (this._omLog||[]).filter(r=>r.kind==='chat'&&r.data&&r.data.sms&&(!after||r.id>after))},
  async omLogAdd(room,secret,kind,who,data){this._omLog=this._omLog||[];const r={id:(this._omLog.length?this._omLog[this._omLog.length-1].id:0)+1,at:new Date().toISOString(),who,kind,data};this._omLog.push(r);setTimeout(()=>(this._omSubs||[]).forEach(f=>f(r)),20);return r.id},
  async omPut(room,secret,path,value){this._om=this._om||{};let o=this._om;const P=path[0]==='pub'?['pub',...path.slice(1)]:path;for(let i=0;i<P.length-1;i++){o[P[i]]=o[P[i]]||{};o=o[P[i]]}o[P[P.length-1]]=value;return true},
  omSub(room,f){this._omSubs=(this._omSubs||[]).concat(f);return ()=>{this._omSubs=(this._omSubs||[]).filter(x=>x!==f)}},
  async mtlogMeta(){return [{id:'tree',data:{folders:[{id:'f1',name:'무진'}],order:[['lg1','f1'],['lg2','f1']]}}]}
 };
 const api=configured()?S:L;
 api.configured=configured;
 return api;
})();
