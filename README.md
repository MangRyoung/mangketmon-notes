# 망켓몬 세션 노트

캠페인마다 **지도 · 관계도 · 항목 · PC 시트 · 시나리오 · 일정**을 적어 두는 GM 노트. 오레마스(웹툴) · 제작기와 같은 Supabase 프로젝트를 쓰고, 정적 페이지(GitHub Pages)로 돌아간다.

- 여러 캠페인(무진, Neo, …)을 한 곳에서. 캠페인마다 GM 비밀구 하나, PL 좌석 비밀구 여럿.
- 문서마다 공개 범위: **모두 / GM만 / PL 한 사람에게만**. 링크만 있으면 「모두」인 것만 보인다.
- PL 은 자기 PC 시트(RP 칸)와 자기 일정(○△×)만 고칠 수 있다.
- PC 시트는 제작기 트레이너를 읽어 와(읽기 전용) RP 칸만 덧붙인다.
- 일정: 세션 날짜 · 달력 · 후보 날짜 투표 · 평소 되는 요일 · Google 캘린더 추가 링크 · .ics 내려받기.
- 오레마스에서 「📓 세션 노트에서 가져오기」로 지도(장소 · 루트)와 관계도(인물 · 조직 · 관계)를 방으로 가져갈 수 있다.
- 휴대폰에서도 쓸 수 있게 짰다 (탭 가로 스크롤 · 지도 꼬집어 확대 · 표는 가로 스크롤).

## 처음 켜기

1. Supabase SQL Editor 에서 `supabase/schema.sql` 을 한 번 돌린다 (nt_camp · nt_auth · nt_docs 표, nt_* 함수, 정책). 다시 돌려도 된다.
2. 저장소 설정 → Pages → Branch `main` / root. 주소: `https://mangryoung.github.io/mangketmon-notes/`
3. 첫 화면에서 캠페인 이름과 GM 비밀구를 적고 「만들기」. 비밀구는 그 브라우저에 저장된다.
4. 다른 기기에서는 설정 탭의 GM 링크(`?gm=…`)를 한 번 연다. PL 에게는 설정 탭 → PL 좌석 → 「초대 링크」(`?pl=…`).

## 무진 자료 옮기기

`migrate/build_mujin.py` 가 옛 아티팩트 자료를 `migrate/mujin.json` 으로 만든다 (그림은 data: URL 로 들어 있어 16MB 쯤). 캠페인을 만든 뒤 **설정 탭 → 자료 → JSON 올리기** 로 그 파일을 고르면, 그림을 Supabase 저장소(`oremas/notes/<캠페인>/…`)에 올리고 문서 208개를 넣는다.

## 파일

- `index.html` · `css/` (app · notes · vtheme = 오레마스와 같은 VELVET 테마)
- `js/config.js` Supabase 주소 · 공개 키 · 저장소 이름 · 제작기 표
- `js/store.js` 저장소 어댑터 (Supabase / 설정 없으면 localStorage)
- `js/app.js` 뼈대 (문서 캐시 · 공개 범위 · 올리기 · 탭 · 로비 · 테마)
- `js/maker.js` 제작기 트레이너 · 포켓몬 읽기
- `js/map_ui.js` `ents_ui.js` `graph_ui.js` `pc_ui.js` `scen_ui.js` `plan_ui.js` `set_ui.js` 탭들
- `supabase/schema.sql` 표 · 함수 · 정책

## Supabase 사용량 (무료 티어 기준)

- DB: 문서는 JSON 한 줄씩, 그림은 저장소에 따로. 무진 전체가 208줄 · 1MB 가 안 된다. 캠페인 10개여도 DB 500MB 에는 턱없이 적다.
- 읽기: 열 때 한 번 전체(`nt_all`), 그 뒤로는 `updated_at` 이후 것만. 공개 문서는 realtime(postgres_changes), 비공개는 broadcast 신호만 → 폴링 없음. 동시 접속 5~6명이면 realtime 메시지는 하루 수백 건 수준(한도 200만/월).
- 저장소 · 전송량: 지도 그림이 가장 크다(무진 지도 3200px JPEG 약 1.5MB). 지도를 열 때마다 내려받지만 브라우저가 캐시한다. 사진은 1600px · 얼굴 512px 로 줄여서 올린다. 한 달 전송 5GB 한도에서, 세션 13회 × 6명이 매번 지도를 새로 받아도 120MB 안쪽.
- 가장 큰 변수는 사진 수. 캠페인 하나에 사진 100장이면 저장소 30~50MB.
