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
   return out}
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
  async makerDocs(){return []}
 };
 const api=configured()?S:L;
 api.configured=configured;
 return api;
})();
