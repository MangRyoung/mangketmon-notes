/* ---------- 룰북 서가 (10-31 망령 「미사그 대학 자료쪽에 룰북도 첨부 — 2체 룰 · 던전 탐사 · 미사그용 자질 보너스표 · 스킬 체크, 이쁘게 꾸며서」) ----------
   자료 탭 맨 위, 꾸밈 「대학」 캠페인에만 나오는 책 네 권. 누르면 책 읽기 창이 열린다.
   · 책은 조각(parts)을 이어 붙인다: {rb:{ch,h[]}} = 제작기 룰북에서 바로 읽기(사본 없음) · {md} = 이 파일에 적은 글(룰북 표기법 그대로, NT_RB.render 로 그린다)
   · 2체 룰 · 스킬 체크는 룰북에서 바로 읽고, 던전 탐사 · 자질 보너스표는 룰북 여러 장과 웹툴 기본값을 모아 이 파일에 적었다(룰북에 그런 장이 없어서).
     숫자가 바뀌면 이 파일의 md 도 같이 고친다. 모은 곳은 책마다 src 에 적어 둔다. */
"use strict";
window.NT_SHELF=(()=>{
 const N=()=>window.NT;const esc=s=>N().esc(s);
 const LK='nt_shelf_last';
 const on=()=>!!(N().skin&&N().skin()==='univ');

 const TWO_HEAD=`> **한 줄 요약** · 미사그 학생이 **각성체 2체만** 데리고 나서는 장면(던전 · 시뮬레이터 · 2+2 배틀)의 규칙입니다. 각성체는 처음부터 2체 값 안에서 짜 두니, 6체(4+2)에서 2체로 바꿔도 시트를 고칠 일이 없습니다.

::: cards
언제 | 던전 탐사 · 시뮬레이터 · 2+2 배틀. 각성체 2체만 나섭니다. | info
지킬 값 | 「1인 기준 (2체)」 표의 PT 기술점 · 분배 LV · 『전용』 · 소지품 소켓 · 『계제』 | good
지시 | 제작기 「2체 기준」에서 고른 『4식』 1종 · 『6령』 2종만 | warn
없는 것 | 「파트너」 · 통솔점 · 프라이드 검사 | bad
:::`;
 const TWO_MID=`---
> 아래는 룰북 「1인 기준 (2체)」 장의 표입니다. 미사그에서는 **「파트너」에 관한 줄(할인 · 『유대』 대상 · 프라이드 조합)은 쓰지 않고**, 각성체는 통솔점 · 프라이드를 검사하지 않습니다.`;

 const CHECK_HEAD=`::: cards
굴림 | **2d6 + 자질 + 종족값 + 적합** ≥ 목표치 | info
목표치 | 쉬움 8 · 보통 10 · 어려움 12 · 매우 어려움 15 | warn
실패 | 판정한 트레이너 상태 한 단계 (부상 → 중상 → 빈사) | bad
대성공 | 6 · 6, 또는 목표치 + 4 이상 | best
:::`;

 const DUNGEON=`> **한 줄 요약** · 각성체 2체를 데리고 방을 하나씩 열며 심층부로 내려갑니다. 방마다 조우 · 체크 · 휴식이 있고, 들킬수록 「경계도」가 올라 야생이 세집니다. 심층부의 보스를 쓰러뜨리면 클리어입니다.

## 일행과 자원
::: cards
각성체 2체 | 미사그 학생은 각성체 2체만 데리고 들어갑니다. 「2체 룰」 책의 값을 씁니다. | info
필드 포켓몬 | 스킬 체크 · 커버는 트레이너마다 필드에 내보낸 포켓몬 1체만 합니다. | info
던전 단위 자원 | 『4식』『6령』 · 『고유』『전용』 횟수 · 소지품(열매 · 띠) · HP · 상태는 던전 내내 이어집니다. 배틀마다 다시 채우지 않습니다. | warn
:::

- 『4식』『6령』은 일행이 함께 쓰는 몫입니다. 한 사람 몫(『4식』 1종 · 『6령』 2종, 지시 A 이상은 『6령』 3종)을 인원만큼 합칩니다.
- 되찾는 길은 휴식뿐입니다. 아껴 두되, 위험해지면 씁니다.

## 방의 종류
| 방 | 하는 일 |
|---|---|
| ⛩ 입구 | 던전에 들어서는 곳. 보통 첫 체크가 있습니다. |
| ◇ 통로 | 방과 방을 잇는 길 |
| ☠ 조우 구역 | 야생 포켓몬과 배틀 |
| ⚙ 함정 · 기믹 | 스킬 체크로 넘깁니다 |
| ✦ 수수께끼 | 머리를 쓰는 체크 |
| ◆ 보물 | 단서나 보상이 놓인 곁방 |
| ☗ 세이프룸 | 휴식할 수 있는 방. 보통 보스 바로 앞 |
| ♛ 심층부 | 보스방 |

## 진행 순서
::: flow
입구 · 체크 > 조우와 체크 > 갈림길 > 세이프룸 · 짧은 휴식 {good} > 심층부 · 보스 {bad}
:::

::: steps
이동 | GM 이 일행을 다음 방으로 옮기고 방을 공개합니다
제시 | 체크가 있으면 자질 + 종족값 짝 · 목표치 · 적합을 제시합니다
판정 | 굴릴 사람과 필드 포켓몬을 고르고 2d6 + 보정 (「스킬 체크」 책)
결과 | 성공 · 실패 · 대성공에 따라 경계도 · 상태가 움직입니다
클리어 | 방을 클리어하면 다음 길이 열립니다
:::

- **갈림길** · 갈라졌다가 다시 만납니다. 한쪽은 싸우며 뚫는 길(배틀), 다른 쪽은 머리 쓰는 길(체크)입니다. 길이는 같습니다.
- 실패는 언제나 판정한 트레이너의 상태 한 단계 + 함께 판정한 포켓몬의 패널티 묶음 + 경계도입니다.

## 경계도
던전이 일행을 얼마나 눈치챘는지입니다. 0 에서 시작하고, 0 아래로는 내려가지 않습니다.

| 일 | 경계도 |
|---|---|
| 체크 실패 · 발각 | +20 |
| 소란 | +10 |
| 일반 조우가 끝날 때 | +5 |
| 대성공 · 몰래 통과 | −10 |

::: scale
30 · 경계 | 이후 나오는 야생 Lv +5 | warn
70 · 위험 | 이후 나오는 야생 Lv +10 | bad
100 · 퇴출 | 던전 실패. 일행이 쫓겨납니다 | x
:::

- 단계가 오르면 모두에게 컷인이 뜹니다. GM 은 던전 관리에서 「경계도 쓰기」를 끌 수 있습니다.

## 휴식
| 휴식 | HP | 빈사 | 상태 이상 · 변화 | 『4식』『6령』 (일행 합계) | 횟수 회복 | 트레이너 상태 |
|---|---|---|---|---|---|---|
| 긴 휴식 | 전원 전부 | 전부로 일으킴 | 치유 | 전부 | 『전용』『고유』 · 초상 능력 · 은열쇠 전부 | 2단계 |
| 중간 휴식 | 전원 1/2 | HP 1/4 로 | 치유 | 『4식』 2 · 『6령』 3 | 『전용』 1 · 『고유』 1 · 초상 능력 · 은열쇠 1 | 1단계 |
| 짧은 휴식 | 전원 1/4 | HP 1 로 | 치유 | 『4식』 1 · 『6령』 1 | 초상 능력 | 1단계 |
| 숨돌리기 | 가장 다친 1체 1/4 | — | — | 『6령』 1 | — | — |

> 웹툴 휴식 기본값입니다. GM 이 방마다 바꿀 수 있습니다. 긴 휴식은 보통 던전 밖에서, 짧은 휴식은 보스 앞 세이프룸에서 합니다.

## 난이도
| 난이도 | 심층부 | 사전 배틀 | 체크 | 야생 / 보스 등급 | 체크 목표 | 노리는 클리어율 |
|---|---|---|---|---|---|---|
| 쉬움 | 4체 · 레이드 2 | 0~1 | 3~5 | C / B · A | 8 | 8할 |
| 보통 | 4체 · 레이드 3 | 1 | 3~5 | C / A | 10 | 6할 |
| 어려움 | 6체 · 레이드 3 | 0~1 | 3~5 | C / A | 12 | 3할 |

- 야생 · 보스는 Lv **+5** 입니다. 레벨은 던전마다 바꾸지 않습니다.
- **빡센 길**(사전 배틀이 그 난이도 최대보다 적은 길) · **어려운 길**(체크만 3개)은 체크 목표가 한 칸 위입니다 (10 · 12 · 15).
- 클리어율은 시뮬레이터 검증 기준입니다. 일행 조합에 따라 차이가 큽니다.`;

 const STAT=`> **읽는 법** · 미사그 학생 한 명은 자기 자질로 **PL 포켓몬 4체 + 각성체 2체**를 꾸립니다. 각성체는 PL 트레이너의 자질 랭크를 그대로 따릅니다. 「6체」는 트레이너 전체 몫, 「각성체 2체」는 각성체가 지킬 2체 기준 값이고, PL 4체는 그 나머지를 씁니다. 「파트너」는 쓰지 않습니다.

## 한눈에
| 랭크 | 스킬 체크 | 지시 | 육성 | 통솔 | 능력 |
|---|---|---|---|---|---|
| D | +0 | 『4식』 | LV 95 | 『에이스』 | 『고유』 1 |
| C | +1 | 『단순 지령』 · 『십계』 | LV 100 | 『기본 역할』 | 『고유』 1 · 『전용』 2 |
| B | +2 | 『숙달 지령』 | LV 105 | 『파생 역할』 | 『고유』 2 · 『전용』 2~4 |
| A | +3 | 『추가 지령』 · 『전술』 | LV 110 | 『상위 역할』 | 『고유』 2 · 『전용』 6 |
| AA | +4 | 『맞춰라!』 · 『파계』 | 사용 금지 | 사용 금지 | 『고유』 3 · 『전용』 8 |

::: cards
지시 특화 · 묘수 | 판정 뒤 주사위를 다시 굴립니다. A 세션 1회 · AA 2회 | info
육성 특화 · 강인함 | 「부상」의 판정 −1 을 무시합니다 | info
통솔 특화 · 동행 2체 | RP 장면에서 동행 포켓몬을 2체 지정합니다 | info
능력 특화 · 초상 능력 | 혼자 2d6 + 자질 × 2. 휴식 사이 A 1회 · AA 2회 | warn
:::

> 특화는 그 자질이 **A 이상**일 때입니다.

## 지시 · 머리
| 랭크 | 지령 | 소지품 소켓 · 6체 | 각성체 2체 | 더하는 것 |
|---|---|---|---|---|
| D | 『4식』만 | 7 | 2.5 | — |
| C | 『단순 지령』 또는 『십계』(『결계』 2종 + 『영창』 5종) | 9 | 3 | — |
| B | 『숙달 지령』 또는 『십계』 『법계』 3종 추가 | 10 | 3.5 | — |
| A | 『추가 지령』 · 『전술』 부여 · 『십계』 『영창』 2종 추가 | 11 | 4 | 「C」 +1 · 「묘수」 1회 · 『데이터 해석』 +1 |
| AA | 『맞춰라!』 · 『파계』 | 12 | 4.5 | 「C」 +2 · 「묘수」 2회 · 『데이터 해석』 +2 |

- 2체로 나설 때는 제작기 「2체 기준」에서 고른 『4식』 1종 · 『6령』 2종만 씁니다. 지시 A 이상은 『6령』 3종이고, 그중 하나는 회피나 명중입니다.
- 각성체 대가가 「지시」면 B 는 『6령』 2종을, A 는 『4식』 1종을 더 0회로 만듭니다. 『십계』는 『6령』 대신 『영창』이, 지시 D 는 B 부터 『4식』이 빠집니다.

## 육성 · 신체
| 랭크 | LV | PT 기술점 · 6체 | 각성체 2체 | PL 4체 | 분배 LV | 『계제』『속별』 | 알까기 |
|---|---|---|---|---|---|---|---|
| D | 95 | 32 | 11 | 21 | +5 | 전원 2개 (각성체도 2개) | 3회 |
| C | 100 | 34 | 11.5 | 22.5 | +10 | 각성체 2체 3개 · PL 4체 2개 | 5회 |
| B | 105 | 35.5 | 12 | 23.5 | +15 | 각성체 2체 3개 · PL 4체 중 2체 3개 | 10회 |
| A | 110 | 37 | 12.5 | 24.5 | +20 | 전원 3개 (『회피+내성』 포함) | 15회 |
| AA | 사용 금지 | | | | | | |

- **분배 LV** 는 4/6 로 나누지 않고 6체 값 그대로 씁니다. 각성체에게도 나눠 줄 수 있고, 1체에 −10 ~ +10 이 상한입니다. 각성체 2체의 합은 2체 기준 값(D 2 · C 4 · B 5 · A 7) 이하로 둡니다.
- 「파트너」가 없으니 파트너 LV(+10)는 없습니다. LV 는 전원 위 값입니다.
- 「육성 : A」는 「기술 소켓 : 2.5」인 기술을 넣을 수 있고, 「육성 : B」는 「기술할인」으로 2.5 가 되는 기술만 넣을 수 있습니다.
- 각성체 대가가 「육성」이면 B 는 분배 LV −10, A 는 −20 입니다.

## 통솔 · 커뮤니케이션
| 랭크 | 역할 | 통솔점 · PL 4체 | (6체) | 더하는 것 |
|---|---|---|---|---|
| D | 『에이스』 | 4 | 6 | 『올드 타입』 최대 1체 · 『현대종』은 한 단계 아래 종족치 |
| C | 『기본 역할』 | 4 | 6 | 『유대』 1체 |
| B | 『파생 역할』 | 5 | 8 | 『익스펜션』 부여 가능 |
| A | 『상위 역할』 | 6.5 | 10 | 『영혼의 유대』 1체 더 · 「명중」 1.05배 |
| AA | 사용 금지 | | | |

- 통솔점은 PL 4체만 씁니다(6체 값의 4/6, 0.5 단위 버림). **각성체는 통솔점 · 프라이드 검사를 하지 않습니다.**
- 2체로 나설 때 두 각성체는 서로 다른 『역할』이어야 합니다.
- 각성체 대가가 「통솔」이면 B 는 B-1 · B-2 중 하나, A 는 거기에 A-1 · A-2 중 하나가 더해집니다.

## 능력 · 기술과 이능
| 랭크 | 『고유』 | 『전용』 · 6체 (상시 상한) | 각성체 2체 (상시 상한) |
|---|---|---|---|
| D | 1 | 0 | 0 |
| C | 1 | 2 (상시 1) · 템플릿만 | 1 (상시 1) · 템플릿만 |
| B | 2 (상시 2, 또는 상시 1 + 단발 1) | a) 2 (상시 1) · 템플릿만<br>b) 4 (상시 2) · 커스텀 2 | a) 1 (상시 1) · 템플릿만<br>b) 2 (상시 1) · 커스텀 1 |
| A | 2 (상시 2) | 6 (상시 3) | 2 (상시 1) |
| AA | 3 (상시 2 + 단발 1) | 8 (상시 4) | 3 (상시 2) |

- 『고유』 개수는 트레이너의 것이라 2체로 나서도 그대로입니다.
- 각성체 대가가 「능력」이면 B 는 『전용』 −1(트레이너 총 개수), A 는 고유 점수 −0.5 입니다.

## 스킬 체크 보정
| 랭크 | 보정 | 트레이너 자질 | 포켓몬 종족값 |
|---|---|---|---|
| D | +0 | D | 59 이하 |
| C | +1 | C | 60 ~ 89 |
| B | +2 | B | 90 ~ 109 |
| A | +3 | A | 110 ~ 139 |
| AA | +4 | AA | 140 이상 |`;

 /* 처음 책 네 권 (10-31). GM 이 처음 고치면(고치기 · 새 책 · 지우기 · 순서) 이 네 권을 캠페인 문서(kind 'shelf')로 옮겨 적고,
    그 뒤로는 문서만 쓴다. 표시 문서 shelf/_init 이 있으면 「옮겨 적음」. 없으면 모두 이 기본을 본다. */
 const SEED=[
  {id:'two',no:'MR-201',c:'crim',t:'2체 룰',en:'RULE OF TWO',sub:'각성체 2체로 나설 때',src:'제작기 룰북 「미사그 대학 (4+2)」 · 「1인 기준 (2체)」 장에서 바로 읽어요',
   parts:[{md:TWO_HEAD},{rb:{ch:'misag',h:['2체로 합칠 때']}},{md:TWO_MID},{rb:{ch:'solo2',h:['자질별 자원 환산','『전용 포텐셜』 (능력)','파티 제약의 환산','배틀 진행']}}]},
  {id:'check',no:'MR-110',c:'navy',t:'스킬 체크',en:'SKILL CHECK',sub:'2d6 + 자질 + 종족값 + 적합',src:'제작기 룰북 「스킬 체크」 장에서 바로 읽어요',
   parts:[{md:CHECK_HEAD},{rb:{ch:'skillcheck',h:[]}}]},
  {id:'dungeon',no:'MR-330',c:'moss',t:'던전 탐사',en:'DUNGEON',sub:'방 · 경계도 · 휴식 · 난이도',src:'룰북 「스킬 체크」 · 웹툴 던전 · 휴식 기본값 · 시뮬레이터 던전 생성 기준(10-28)을 모았어요',
   parts:[{md:DUNGEON}]},
  {id:'stat',no:'MR-001',c:'ochre',t:'자질 보너스표',en:'ATTRIBUTES',sub:'미사그용 · 랭크별 자원 한 장',src:'룰북 「지시 · 육성 · 통솔 · 능력 · 미사그 대학 · 1인 기준 (2체) · 스킬 체크」 장을 모았어요',
   parts:[{md:STAT}]}];
 const COLORS=[['crim','진홍'],['navy','남색'],['moss','녹색'],['ochre','황토'],['plum','자주'],['teal','청록'],['ink','먹색']];
 const K='shelf',INIT='_init';
 const seeded=()=>!!N().doc(K,INIT);
 function books(){if(!seeded())return SEED.map((b,i)=>Object.assign({order:i,_vis:'pub'},b));
  return N().list(K).filter(b=>b.id!==INIT).sort((a,b)=>(a.order||0)-(b.order||0)||String(a.t||'').localeCompare(String(b.t||''),'ko'))}
 const book=id=>{const L=books();return L.find(b=>b.id===id)||L[0]||null};
 /* 기본 네 권을 문서로 옮겨 적기 (한 번만) */
 async function seed(){if(seeded())return true;const rows=SEED.map((b,i)=>({kind:K,id:b.id,data:Object.assign({},b,{order:i}),vis:'pub'}));rows.push({kind:K,id:INIT,data:{at:new Date().toISOString()},vis:'pub'});
  return (await N().putMany(rows))>0||seeded()}

 /* 교표 (학생증과 같은 모양) */
 const CREST=`<svg viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2 37 8v14c0 11-7.5 18.5-17 22C10.5 40.5 3 33 3 22V8Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 16h18v14H11zM20 16v14" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="20" cy="9.5" r="2.2" fill="currentColor"/></svg>`;
 const cover=b=>`<span class="shb-spine" aria-hidden="true"></span><span class="shb-frame"><span class="shb-no">${esc(b.no||'')}</span><span class="shb-crest">${CREST}</span><b class="shb-t">${esc(b.t||'(제목 없음)')}</b><span class="shb-en">${esc(b.en||'')}</span><small class="shb-sub">${esc(b.sub||'')}</small></span>`;

 /* ----- 서가 (자료 탭 맨 위) ----- */
 function bar(){if(!on())return '';const G=N().gm();const L=books();if(!L.length&&!G)return '';
  return `<section class="shelf" aria-label="룰북 서가"><div class="shelf-h"><span class="shelf-crest">${CREST}</span><b>열람실 · 룰북 서가</b><small>MISAG UNIVERSITY LIBRARY</small><span class="sp"></span>${G?`<button type="button" class="shelf-btn" data-shnew title="새 책을 꽂아요">＋ 책</button>`:''}<a class="shelf-all" href="${esc(window.NT_RB?NT_RB.link(''):'#')}" target="_blank" rel="noopener">룰북 전체 ↗</a></div>
   <div class="shelf-row">${L.map(b=>`<button type="button" class="shb c-${esc(b.c||'crim')}" data-shelf="${esc(b.id)}" data-id="${esc(b.id)}" ${G?'data-drag':''} title="${esc(b.t)} 펴기${G?' · 끌어서 순서 바꾸기':''}">${cover(b)}${G&&b._vis&&b._vis!=='pub'?`<span class="shb-vis">${esc(N().visLabel(b._vis))}</span>`:''}</button>`).join('')||'<div class="shelf-empty">꽂힌 책이 없어요. 「＋ 책」으로 꽂아요.</div>'}</div><div class="shelf-plank" aria-hidden="true"></div></section>`}
 /* 자료 탭이 그린 뒤: 「＋ 책」 · GM 끌어서 순서 바꾸기 */
 function bind(el){const sec=el&&el.querySelector('.shelf');if(!sec)return;
  const nb=sec.querySelector('[data-shnew]');if(nb)nb.onclick=e=>{e.stopPropagation();edit('')};
  if(N().gm())N().sortable(sec.querySelector('.shelf-row'),'.shb',async ids=>{if(!await seed())return;await N().reorder(K,ids)})}

 /* ----- 책 읽기 창 ----- */
 /* 절 고르기: 제목이 같거나 그 제목으로 시작하면 (「2체로 합칠 때 (2026-10-30)」처럼 뒤에 날짜가 붙어도) */
 const pick=rb=>{const RB=window.NT_RB;const c=RB.chapter(rb.ch);if(!c)return null;const H=(rb.h||[]).filter(Boolean);if(!H.length)return {md:c.body||'',missing:[]};const S=RB.sections(c);const hit=h=>s=>s.h===h||s.h.startsWith(h+' ');
  return {md:H.map(h=>{const x=S.find(hit(h));return x?x.md:''}).filter(Boolean).join('\n\n'),missing:H.filter(h=>!S.some(hit(h)))}};
 function bodyOf(parts){const RB=window.NT_RB;let wait=false,miss=[];
  const html=(parts||[]).map(p=>{if(p.rb&&p.rb.ch){if(!RB.R.book){wait=true;return ''}const k=pick(p.rb);if(!k){miss.push(p.rb.ch);return ''}if(k.missing.length)miss.push(...k.missing);return `<div class="shr-live">${RB.render(k.md)}</div>`}
   return p.md?RB.render(p.md):''}).join('');
  return {html,wait,miss}}
 function toc(m){const H=[...m.querySelectorAll('.shr-page h4')];H.forEach((h,i)=>h.id='shr-h'+i);const t=m.querySelector('.shr-toc');if(!t)return;
  t.innerHTML=H.length?`<b>차례</b>${H.map((h,i)=>`<a href="#shr-h${i}" data-shto="${i}"><i>${String(i+1).padStart(2,'0')}</i>${esc(h.textContent.replace(/\s*\(\d{4}-\d\d-\d\d\)\s*$/,''))}</a>`).join('')}`:''}
 function paint(m,id){const L=books();const b=book(id);const G=N().gm();
  if(!b){m.className='modal shelfm c-ink';m.innerHTML=`<div class="shr-top"><div class="shr-tabs"></div><button type="button" class="shr-x" data-x>닫기 ✕</button></div><article class="shr-page"><p>꽂힌 책이 없어요.</p></article>`;return}
  m.dataset.bk=b.id;try{localStorage.setItem(LK,b.id)}catch(e){}
  const r=bodyOf(b.parts);const rbLinks=[...new Set((b.parts||[]).filter(p=>p.rb&&p.rb.ch).map(p=>p.rb.ch))];
  m.className='modal wide shelfm c-'+(b.c||'crim');
  m.innerHTML=`<div class="shr-top"><div class="shr-tabs" role="tablist">${L.map(x=>`<button type="button" role="tab" class="shr-tab c-${esc(x.c||'crim')} ${x.id===b.id?'on':''}" data-shbk="${esc(x.id)}" aria-selected="${x.id===b.id}">${esc(x.t||'(제목 없음)')}</button>`).join('')}</div>${G?`<button type="button" class="shr-x" data-shed title="이 책 고치기">✎ 고치기</button>`:''}<button type="button" class="shr-x" data-x aria-label="닫기">닫기 ✕</button></div>
   <header class="shr-cover"><span class="shr-crest">${CREST}</span><div class="shr-ct"><span class="shr-no">MISAG LIB · ${esc(b.no||'')}</span><h2>${esc(b.t||'(제목 없음)')}</h2><p>${esc(b.sub||'')}</p></div>${G&&b._vis&&b._vis!=='pub'?`<span class="shr-vis">${esc(N().visLabel(b._vis))}</span>`:''}<span class="shr-ribbon" aria-hidden="true"></span></header>
   <div class="shr-body"><nav class="shr-toc" aria-label="차례"></nav><article class="shr-page rbbody">${r.wait?'<p class="shr-wait">룰북을 펴는 중이에요…</p>':''}${r.html||(!r.wait?'<p class="shr-wait">아직 빈 책이에요.</p>':'')}
    ${r.miss.length?`<p class="shr-miss">룰북에서 찾지 못한 곳: ${r.miss.map(esc).join(' · ')}</p>`:''}
    <footer class="shr-src">${b.src?`<span>${esc(b.src)}</span>`:''}${rbLinks.map(ch=>`<a href="${esc(window.NT_RB.link(ch))}" target="_blank" rel="noopener">${esc((window.NT_RB.chapter(ch)||{}).title||ch)} ↗</a>`).join('')}${rbLinks.length&&window.NT_RB.R.book&&window.NT_RB.R.book.updated?`<span class="shr-upd">룰북 ${esc(window.NT_RB.R.book.updated)}</span>`:''}</footer></article></div>`;
  toc(m);m.scrollTop=0;
  if(r.wait)window.NT_RB.load().then(()=>{if(m.isConnected&&m.querySelector('.shr-wait'))paint(m,b.id)})}
 let RD=null;   /* 열린 읽기 창 (저장 뒤 다시 그리기) */
 function open(id){if(!window.NT_RB)return;if(!id){try{id=localStorage.getItem(LK)||''}catch(e){}}
  const m=N().openModal('','wide shelfm');RD=m;paint(m,id);
  m.addEventListener('click',e=>{const t=e.target.closest('[data-shbk]');if(t){paint(m,t.dataset.shbk);return}
   if(e.target.closest('[data-shed]')){edit(m.dataset.bk);return}
   const a=e.target.closest('[data-shto]');if(a){e.preventDefault();const h=m.querySelector('#shr-h'+a.dataset.shto);if(h)h.scrollIntoView({behavior:'smooth',block:'start'})}})}

 /* ----- 책 고치기 (GM) -----
    표지(제목 · 영문 띠 · 한 줄 · 청구기호 · 색 · 출처 줄 · 공개 범위) + 조각 목록(글 / 룰북 장 · 절). 오른쪽은 미리 보기. */
 const HELP=`<details class="she-help"><summary>표기법</summary><div class="small">
  <code>## 제목</code> 큰 제목(차례에 들어가요) · <code>### 작은 제목</code> · <code>**굵게**</code> · <code>&gt; 메모 상자</code> · <code>- 목록</code> · <code>| 표 | 칸 |</code> (둘째 줄 <code>|---|---|</code>, 첫 칸이 D · C · B · A · AA 면 랭크 도장)<br>
  <code>『포텐셜』</code> <code>「용어」</code> <code>【태그】</code> 는 색이 입혀져요.<br>
  <code>::: cards</code> 다음 줄부터 <code>이름 | 설명 | good</code> (good · best · warn · bad · x · info), 끝은 <code>:::</code> — 카드 묶음<br>
  <code>::: steps</code> 단계 · <code>::: scale</code> 결과 띠 · <code>::: flow</code> 에 <code>가 &gt; 나 {bad}</code> 흐름 · <code>::: ladder</code> 에 <code>쉬움 | 8</code> 계단 · <code>::: heat</code> 안의 표는 % 칸에 색</div></details>`;
 function edit(id){if(!N().gm())return;const cur=id?book(id):null;const isNew=!cur;
  const b=cur?JSON.parse(JSON.stringify(cur)):{id:'b'+Math.random().toString(36).slice(2,8),t:'',en:'',sub:'',no:'MR-'+String(Math.floor(100+Math.random()*800)),c:'plum',src:'',parts:[{md:'## 첫 장\n'}],_vis:'pub'};
  let parts=(b.parts||[]).map(p=>p.rb?{rb:{ch:p.rb.ch||'',h:[...(p.rb.h||[])]}}:{md:p.md||''});
  const m=N().openModal(`<div class="mhead"><h2>${isNew?'새 책 꽂기':'책 고치기'}</h2><span class="sp"></span><button type="button" class="btn sm ghost" data-x>닫기</button></div>
   <div class="she">
    <div class="she-l">
     <div class="she-f"><label>제목<input id="sheT" value="${esc(b.t)}" placeholder="던전 탐사"></label><label>영문 띠<input id="sheEn" value="${esc(b.en)}" placeholder="DUNGEON"></label>
      <label class="w2">한 줄<input id="sheSub" value="${esc(b.sub)}" placeholder="방 · 경계도 · 휴식 · 난이도"></label><label>청구기호<input id="sheNo" value="${esc(b.no)}" placeholder="MR-330"></label><label>공개${N().visSelect(b._vis||'pub','sheVis')}</label>
      <label class="w2">표지 색<span class="she-col">${COLORS.map(([c,l])=>`<button type="button" class="c-${c} ${b.c===c?'on':''}" data-shc="${c}" title="${l}" aria-label="${l}"></button>`).join('')}</span></label>
      <label class="w2">맨 아래 출처 줄<input id="sheSrc" value="${esc(b.src||'')}" placeholder="어디서 모은 글인지"></label></div>
     <div class="she-ph"><b>조각</b><small class="dim">위에서부터 이어 붙여요</small><span class="sp"></span><button type="button" class="btn xs" data-sha="md">＋ 글</button><button type="button" class="btn xs" data-sha="rb">＋ 룰북 장</button></div>
     <div class="she-parts" id="shePs"></div>${HELP}
    </div>
    <div class="she-r"><div class="she-rh small dim">미리 보기</div><div class="she-prev shelfm c-${esc(b.c||'crim')}" id="shePv"><div class="shr-cover"><span class="shr-crest">${CREST}</span><div class="shr-ct"><span class="shr-no" id="pvNo"></span><h2 id="pvT"></h2><p id="pvS"></p></div></div><article class="shr-page rbbody" id="pvB"></article></div></div>
   </div>
   <div class="row she-foot">${isNew?'':`<button type="button" class="btn sm ghost danger" id="sheDel">책 빼기</button>`}<span class="sp"></span><button type="button" class="btn ghost" data-x>취소</button><button type="button" class="btn pri" id="sheOk">${isNew?'꽂기':'저장'}</button></div>`,'wide sheditm',{stack:true});
  const $=s=>m.querySelector(s);let col=b.c||'crim';
  const chOpts=sel=>{const C=window.NT_RB?NT_RB.chapters():[];return '<option value="">— 장 고르기 —</option>'+C.map(c=>`<option value="${esc(c.id)}" ${sel===c.id?'selected':''}>${esc(c.title||c.id)}</option>`).join('')+(sel&&!C.some(c=>c.id===sel)?`<option value="${esc(sel)}" selected>${esc(sel)} (룰북에 없음)</option>`:'')};
  const secs=p=>{if(!p.rb.ch||!window.NT_RB)return '';const S=NT_RB.sections(p.rb.ch).filter(x=>x.h);if(!S.length)return '<small class="dim">이 장은 절이 없어요 — 장 전체를 넣어요</small>';
   const has=h=>p.rb.h.some(x=>h===x||h.startsWith(x+' '));return `<div class="she-secs"><small class="dim">절 (안 고르면 장 전체)</small>${S.map(x=>`<label class="${has(x.h)?'on':''}"><input type="checkbox" value="${esc(x.h)}" ${has(x.h)?'checked':''}>${esc(x.h)}</label>`).join('')}</div>`};
  function drawParts(){$('#shePs').innerHTML=parts.map((p,i)=>`<div class="she-p" data-i="${i}"><div class="she-pb"><b>${i+1}</b><span>${p.rb?'📖 룰북 장':'✎ 글'}</span><span class="sp"></span><button type="button" class="btn xs ghost" data-shm="-1" ${i?'':'disabled'} title="위로">▲</button><button type="button" class="btn xs ghost" data-shm="1" ${i<parts.length-1?'':'disabled'} title="아래로">▼</button><button type="button" class="btn xs ghost danger" data-shx title="이 조각 빼기">✕</button></div>
    ${p.rb?`<select data-shch>${chOpts(p.rb.ch)}</select>${secs(p)}`:`<textarea data-shmd rows="${Math.min(18,Math.max(5,String(p.md).split('\n').length+1))}" spellcheck="false">${esc(p.md)}</textarea>`}</div>`).join('')||'<div class="small dim">조각이 없어요. 「＋ 글」이나 「＋ 룰북 장」을 눌러요.</div>'}
  let tm=0;function prev(){clearTimeout(tm);tm=setTimeout(()=>{const pv=$('#shePv');if(!pv)return;pv.className='she-prev shelfm c-'+col;$('#pvNo').textContent='MISAG LIB · '+$('#sheNo').value;$('#pvT').textContent=$('#sheT').value||'(제목 없음)';$('#pvS').textContent=$('#sheSub').value;
   const r=bodyOf(parts);$('#pvB').innerHTML=(r.wait?'<p class="shr-wait">룰북을 펴는 중이에요…</p>':'')+r.html+(r.miss.length?`<p class="shr-miss">룰북에서 찾지 못한 곳: ${r.miss.map(esc).join(' · ')}</p>`:'');if(r.wait)NT_RB.load().then(prev)},120)}
  drawParts();prev();if(window.NT_RB&&!NT_RB.R.book)NT_RB.load().then(()=>{if(m.isConnected){drawParts();prev()}});   /* 룰북을 아직 안 읽었으면 장 목록을 채운 뒤 다시 */
  m.addEventListener('input',e=>{const t=e.target;const pe=t.closest('.she-p');if(pe&&t.matches('[data-shmd]'))parts[+pe.dataset.i].md=t.value;prev()});
  m.addEventListener('change',e=>{const t=e.target;const pe=t.closest('.she-p');if(!pe)return;const p=parts[+pe.dataset.i];
   if(t.matches('[data-shch]')){p.rb={ch:t.value,h:[]};drawParts();prev();return}
   if(t.type==='checkbox'){t.closest('label').classList.toggle('on',t.checked);p.rb.h=[...pe.querySelectorAll('.she-secs input:checked')].map(x=>x.value);prev()}});
  m.addEventListener('click',async e=>{const t=e.target;
   const c=t.closest('[data-shc]');if(c){col=c.dataset.shc;m.querySelectorAll('[data-shc]').forEach(x=>x.classList.toggle('on',x===c));prev();return}
   const a=t.closest('[data-sha]');if(a){parts.push(a.dataset.sha==='rb'?{rb:{ch:'',h:[]}}:{md:''});drawParts();prev();const L=m.querySelectorAll('.she-p');const last=L[L.length-1];if(last){last.scrollIntoView({block:'nearest'});const f=last.querySelector('textarea,select');if(f)f.focus()}return}
   const pe=t.closest('.she-p');if(pe){const i=+pe.dataset.i;
    const mv=t.closest('[data-shm]');if(mv){const j=i+(+mv.dataset.shm);if(j<0||j>=parts.length)return;[parts[i],parts[j]]=[parts[j],parts[i]];drawParts();prev();return}
    if(t.closest('[data-shx]')){const p=parts[i];if((p.md&&p.md.trim().length>40)&&!await N().confirmBox('이 글 조각을 뺄까요? 저장하기 전에는 「취소」로 되돌릴 수 있어요.','빼기'))return;parts.splice(i,1);drawParts();prev();return}}
   if(t.closest('#sheDel')){if(!await N().confirmBox(`「${b.t||'이 책'}」을 서가에서 뺄까요? 되돌릴 수 없어요.`,'빼기'))return;if(!await seed())return;if(await N().del(K,b.id)){N().closeModal(true);N().toast('책을 뺐어요')}return}
   if(t.closest('#sheOk')){const t1=$('#sheT').value.trim();if(!t1){N().toast('제목을 적어 주세요');$('#sheT').focus();return}
    const out={id:b.id,t:t1,en:$('#sheEn').value.trim(),sub:$('#sheSub').value.trim(),no:$('#sheNo').value.trim(),c:col,src:$('#sheSrc').value.trim(),
     parts:parts.filter(p=>p.rb?p.rb.ch:String(p.md||'').trim()).map(p=>p.rb?{rb:{ch:p.rb.ch,h:p.rb.h}}:{md:p.md}),order:isNew?books().length:(b.order||0)};
    const vis=($('#sheVis')||{}).value||'pub';
    if(!await seed())return;if(isNew)out.order=books().length;
    if(await N().put(K,out.id,out,vis)){N().closeModal(true);N().toast(isNew?'새 책을 꽂았어요':'책을 고쳤어요');open(out.id)}}});
 }
 return {bar,bind,open,edit,SEED,books,on};
})();
