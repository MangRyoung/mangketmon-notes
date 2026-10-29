/* ---------- 제작기 룰북 읽기 (10-29 망령) ----------
   항목의 rb = {ch:장 id, h:[## 제목 …]} 이면 그 장(또는 그 절들)을 룰북에서 바로 읽어 보여 준다. 사본을 두지 않으니 룰북을 고치면 항목도 따라 바뀐다.
   읽는 순서: 공유 DB 의 제작기 문서 rulebook/main → 없으면 제작기 rulebook.html 의 #rb-data.
   그리는 법은 제작기 rulebook.html 의 render() 를 줄여 옮긴 것(『포텐셜』 줄 · 【태그】 · 표 · ::: cards/steps/flow/scale). */
"use strict";
window.NT_RB=(()=>{
 const N=()=>window.NT;
 const R={book:null,at:0,p:null,src:''};
 const url=()=>String((window.NT_CONFIG||{}).makerUrl||'').replace(/\/?$/,'/')+'rulebook.html';
 const link=(ch)=>url()+(ch?'#ch-'+encodeURIComponent(ch):'');
 async function load(force){if(R.p)return R.p;if(!force&&R.book&&Date.now()-R.at<600000)return R.book;
  R.p=(async()=>{let b=null;
   try{const d=N().DBS().makerGet&&await N().DBS().makerGet('rulebook','main');const v=d&&(d.data&&d.data.data||d.data);if(v&&Array.isArray(v.chapters)&&v.chapters.length){b=v;R.src='db'}}catch(e){}
   if(!b){try{const t=await (await fetch(url(),{cache:'no-cache'})).text();const m=t.match(/<script type="application\/json" id="rb-data">([\s\S]*?)<\/script>/);if(m){b=JSON.parse(m[1]);R.src='html'}}catch(e){console.warn('rulebook',e)}}
   if(b){R.book=b;R.at=Date.now();R.fail=false}else R.fail=true;return R.book})().finally(()=>{R.p=null});return R.p}
 const chapters=()=>(R.book&&R.book.chapters)||[];
 const chapter=id=>chapters().find(c=>c.id===id)||null;
 /* ## 제목 단위로 나눈 절 */
 function sections(ch){const c=typeof ch==='string'?chapter(ch):ch;if(!c)return [];const L=String(c.body||'').replace(/\r/g,'').split('\n');const out=[{h:'',lines:[]}];
  let fence=false;for(const l of L){if(/^:::/.test(l))fence=!fence&&/^:::\s*\w+/.test(l);const m=!fence&&l.match(/^##\s+(.*)$/);if(m)out.push({h:m[1].trim(),lines:[l]});else out[out.length-1].lines.push(l)}
  return out.filter(s=>s.h||s.lines.some(x=>x.trim())).map(s=>({h:s.h,md:s.lines.join('\n')}))}
 function pick(rb){const c=chapter(rb&&rb.ch);if(!c)return null;const H=(rb.h||[]).filter(Boolean);if(!H.length)return {c,md:c.body||''};
  const S=sections(c).filter(s=>H.includes(s.h));return {c,md:S.map(s=>s.md).join('\n\n'),missing:H.filter(h=>!S.some(s=>s.h===h))}}

 const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 function inl(s){let h=esc(s);
  h=h.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  h=h.replace(/【([^】]*)】/g,'<span class="tg">$1</span>').replace(/『([^』]*)』/g,'<span class="pt">『$1』</span>').replace(/「([^」]*)」/g,'<span class="tm">「$1」</span>').replace(/&lt;br\s*\/?&gt;/g,'<br>');
  return h}
 const rank=c=>/^(AA|A|B-|B|C|D)$/.test(String(c).trim())?`<span class="rk">${esc(String(c).trim())}</span>`:null;
 function cont(t){let m=t.match(/^([①-⑳])\s*(.*)$/);if(m)return `<div class="dc"><b>${m[1]}</b> ${inl(m[2])}</div>`;if(/^ㄴ\s*/.test(t))return `<div class="dc sub">↳ ${inl(t.replace(/^ㄴ\s*/,''))}</div>`;return `<div class="dc">${inl(t)}</div>`}
 const TONES={good:1,best:1,warn:1,bad:1,x:1,info:1};
 const vsplit=l=>{const p=l.split('|').map(x=>x.trim());const t=p.length>2&&TONES[p[p.length-1]]?p.pop():'';return {a:p[0]||'',b:p.slice(1).join(' | '),t}};
 function vx(kind,lines){lines=lines.filter(l=>l.trim());
  if(kind==='steps')return `<div class="vx steps">${lines.map((l,i)=>{const x=vsplit(l);return `<div class="vs"><small>STEP ${i+1}</small><b>${inl(x.a)}</b><span>${inl(x.b)}</span></div>`}).join('')}</div>`;
  if(kind==='cards'||kind==='scale')return `<div class="vx cards">${lines.map(l=>{const x=vsplit(l);return `<div class="vc ${x.t?'t-'+x.t:''}"><b>${inl(x.a)}</b><span>${inl(x.b)}</span></div>`}).join('')}</div>`;
  if(kind==='flow'){const ns=lines.join(' > ').split(/\s*>\s*/).filter(Boolean);return `<div class="vx flow">${ns.map((n,i)=>{const m=n.match(/^(.*?)\s*\{(\w+)\}\s*$/);const t=m&&TONES[m[2]]?m[2]:'';return (i?'<i>→</i>':'')+`<span class="${t?'t-'+t:''}">${inl(m?m[1]:n)}</span>`}).join('')}</div>`}
  return render(lines.join('\n'))}
 const BLOCK=/^(#{2,4}\s|\||>|\s*[-*]\s|\d+\.\s|---\s*$|『[^』]+』|:::)/;
 function render(md){const L=String(md||'').replace(/\r/g,'').split('\n');let i=0;const out=[];let defs=[];const flush=()=>{if(defs.length){out.push(`<div class="defs">${defs.join('')}</div>`);defs=[]}};
  while(i<L.length){const line=L[i];if(!line.trim()){i++;continue}let m;
   if(!/^『[^』]+』(과|와|은|는|을|를|이|가|의|에|로|으로|도|만)/.test(line)&&(m=line.match(/^『([^』]+)』\s*:?\s*(.*)$/))){let rest=m[2].trim(),tags='',eff=rest;const cs=[];i++;
    const tm=rest.match(/^((?:【[^】]*】\s*)+)(?:\/\s*([\s\S]*))?$/);if(tm){tags=tm[1];eff=tm[2]||''}
    while(i<L.length&&L[i].trim()&&!BLOCK.test(L[i])){cs.push(L[i].trim());i++}
    defs.push(`<div class="def"><div class="dn">『${inl(m[1])}』</div><div class="dm">${tags?`<div>${(tags.match(/【[^】]*】/g)||[]).map(t=>`<span class="tg">${inl(t.slice(1,-1))}</span>`).join('')}</div>`:''}${eff?`<div class="dc">${inl(eff)}</div>`:''}${cs.map(cont).join('')}</div></div>`);continue}
   flush();
   if((m=line.match(/^:::\s*(\w+)\s*$/))){const k=m[1],inner=[];i++;while(i<L.length&&!/^:::\s*$/.test(L[i])){inner.push(L[i]);i++}i++;out.push(vx(k,inner));continue}
   if((m=line.match(/^(#{2,4})\s+(.*)$/))){const lv=Math.min(6,m[1].length+2);out.push(`<h${lv}>${inl(m[2])}</h${lv}>`);i++;continue}
   if(/^---\s*$/.test(line)){out.push('<hr>');i++;continue}
   if(/^>/.test(line)){const nl=[];while(i<L.length&&/^>/.test(L[i])){nl.push(L[i].replace(/^>\s?/,''));i++}out.push(`<div class="note">${nl.map(inl).join('<br>')}</div>`);continue}
   if(/^\|/.test(line)){const rows=[];while(i<L.length&&/^\|/.test(L[i])){rows.push(L[i]);i++}
    let cells=rows.map(r=>r.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim())).filter(r=>!r.every(c=>/^:?-{2,}:?$/.test(c)));const head=cells.shift()||[];
    out.push(`<div class="tbl"><table><thead><tr>${head.map(c=>`<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${cells.map(r=>`<tr>${r.map((c,ci)=>`<td>${(ci===0&&rank(c))||inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue}
   if(/^\s*[-*]\s/.test(line)){const it=[];while(i<L.length&&/^\s*[-*]\s/.test(L[i])){it.push(L[i].replace(/^\s*[-*]\s+/,''));i++}out.push(`<ul>${it.map(x=>`<li>${inl(x)}</li>`).join('')}</ul>`);continue}
   if(/^\d+\.\s/.test(line)){const it=[];while(i<L.length&&/^\d+\.\s/.test(L[i])){it.push(L[i].replace(/^\d+\.\s+/,''));i++}out.push(`<ol>${it.map(x=>`<li>${inl(x)}</li>`).join('')}</ol>`);continue}
   const pl=[];while(i<L.length&&L[i].trim()&&!BLOCK.test(L[i])){pl.push(L[i]);i++}if(!pl.length){pl.push(line);i++}out.push(`<p>${pl.map(inl).join('<br>')}</p>`)}
  flush();return out.join('')}
 /* 항목 상세 안에 넣는 상자. 아직 안 읽었으면 자리만 두고 읽은 뒤 다시 그린다 */
 function box(rb){if(!rb||!rb.ch)return '';const t=`<a class="btn xs ghost" href="${esc(link(rb.ch))}" target="_blank" rel="noopener">룰북에서 열기 ↗</a>`;
  if(!R.book&&R.fail)return `<div class="rbx"><div class="rbh"><b>📖 룰북</b><span class="sp"></span>${t}</div><div class="small dim">룰북을 읽지 못했어요. 인터넷 연결을 확인하고 새로 고쳐 주세요.</div></div>`;
  if(!R.book){load().then(()=>{if(R.book)N().render()});return `<div class="rbx"><div class="rbh"><b>📖 룰북</b><span class="sp"></span>${t}</div><div class="small dim">룰북을 읽는 중이에요…</div></div>`}
  const p=pick(rb);if(!p)return `<div class="rbx"><div class="rbh"><b>📖 룰북</b><span class="sp"></span>${t}</div><div class="small dim">룰북에 「${esc(rb.ch)}」 장이 없어요. 장 id 가 바뀌었는지 확인해 주세요.</div></div>`;
  return `<div class="rbx"><div class="rbh"><b>📖 룰북 · ${esc(p.c.title||p.c.id)}</b>${(rb.h||[]).length?`<small class="dim">${rb.h.map(esc).join(' · ')}</small>`:''}<span class="sp"></span>${t}</div>${p.missing&&p.missing.length?`<div class="small" style="color:var(--yel)">룰북에서 찾지 못한 절: ${p.missing.map(esc).join(' · ')}</div>`:''}<div class="rbbody">${render(p.md)}</div><div class="small dim rbsrc">제작기 룰북에서 바로 읽어요 · 룰북을 고치면 여기도 바뀌어요${R.book.updated?' · 룰북 '+esc(R.book.updated):''}</div></div>`}
 return {load,chapters,chapter,sections,pick,render,box,link,R};
})();
