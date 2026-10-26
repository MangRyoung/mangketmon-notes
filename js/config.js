/* 공유 DB 설정 — 오레마스 · 제작기와 같은 Supabase 프로젝트. 공개 키라 올려 둬도 된다(권한은 DB 함수가 정한다).
   비워 두면 이 브라우저(localStorage)에만 저장된다. */
window.NT_CONFIG={
  supabaseUrl:"https://jsnvqcvwspxzfnhdethl.supabase.co",
  supabaseKey:"sb_publishable_HDcgWnb1QS1P6GOiBPqdAA_yBJNhU7R",
  bucket:"oremas",          /* 그림 저장소 (오레마스와 같이 쓴다, 경로 notes/<캠페인>/…) */
  makerTable:"docs",        /* 제작기 문서 표 (트레이너 · 포켓몬 읽기) */
  makerUrl:"https://mangryoung.github.io/mangketmon-maker/",
  oremasUrl:"https://mangryoung.github.io/oremas/"
};
