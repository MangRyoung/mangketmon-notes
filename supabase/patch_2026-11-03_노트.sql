-- 세션 노트 2026-11-03 패치 (감우). Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여 넣고 Run. 여러 번 실행해도 된다.
-- 먼저 들어가 있어야 하는 것: schema.sql · patch_2026-10-29_계정.sql · patch_2026-10-29_PL기본.sql (이미 들어가 있다)
--
-- 내용
--   1) nt_camp_patch   캠페인 설정(nt_camp.data)을 통째로 덮지 않고 칸 단위로 합친다 (깊은 합치기 · null 이면 그 칸을 지움). 설정 · 기록 · 제작기 폴더 · 웹툴 잇기가 서로 덮어쓰지 않게.
--   2) nt_claim2        계정 PL 자리 앉기: 「모두」 공개인 PC 시트만, 캠페인 설정 claimMode 가 'approve' 면 GM 승인 대기(nt_camp.data.claims).
--      nt_claim_decide  GM 이 대기 중인 요청을 승인 · 거절. (예전 nt_claim 은 그대로 두되 공개 시트만 앉게 고친다)
--   3) 그림 저장소(oremas 버킷) 정책: anon 의 목록 읽기(select) 를 없애고, 덮어쓰기(update) 는 로그인한 올린 사람만. 공개 주소로 보는 것은 그대로.
--      ※ 웹툴 · 노트 · 제작기 셋이 같이 쓰는 버킷이라 셋 다 영향 — 세 앱 모두 목록(list)을 쓰지 않고, 올릴 때마다 새 이름이라 덮어쓰기도 쓰지 않는다 (2026-11-03 확인).
--   4) nt_docs 변경 이력 · 휴지통: nt_docs_history (제작기 docs_history 와 같은 꼴) + nt_history(문서 옛 판) · nt_deleted(최근 지운 것). 30일 지나면 저절로 지운다.
--   클라이언트는 이 함수들이 없으면(아직 안 돌렸으면) 예전 방식으로 돌아간다.

-- ---------- 1) 캠페인 설정 칸 단위 합치기 ----------
create or replace function public.nt_jsonb_merge(a jsonb, b jsonb) returns jsonb
language plpgsql immutable as $$
declare k text; v jsonb; r jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' then a := '{}'::jsonb; end if;
  if b is null or jsonb_typeof(b) <> 'object' then return b; end if;
  r := a;
  for k, v in select * from jsonb_each(b) loop
    if jsonb_typeof(v) = 'null' then r := r - k;
    elsif jsonb_typeof(v) = 'object' and jsonb_typeof(r -> k) = 'object' then r := jsonb_set(r, array[k], nt_jsonb_merge(r -> k, v), true);
    else r := jsonb_set(r, array[k], v, true); end if;
  end loop;
  return r;
end $$;

-- p_patch 의 1단계 · 2단계 … 키를 기존 data 에 합친다. 값이 null 이면 그 칸을 지운다. 배열은 통째로 바뀐다.
create or replace function public.nt_camp_patch(p_camp text, p_secret text, p_patch jsonb, p_name text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cur jsonb; nw jsonb;
begin
  if nt_who(p_camp, p_secret) is distinct from 'gm' then raise exception 'GM 만 캠페인을 고칠 수 있습니다'; end if;
  select data into cur from nt_camp where id = p_camp for update;
  if not found then raise exception '없는 캠페인'; end if;
  nw := nt_jsonb_merge(coalesce(cur, '{}'::jsonb), coalesce(p_patch, '{}'::jsonb));
  update nt_camp set data = nw, name = coalesce(p_name, name), updated_at = now() where id = p_camp;
  return nw;
end $$;
grant execute on function public.nt_camp_patch(text, text, jsonb, text) to anon, authenticated;

-- ---------- 2) 자리 앉기: 공개 시트만 · GM 승인 ----------
-- 돌려주는 값: 'ok' 앉았다 · 'taken' 남의 자리 · 'pending' GM 승인 대기 · 'up' 일어났다
create or replace function public.nt_claim2(p_camp text, p_seat text, p_secret text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare u text; mem record; mode text; cl jsonb; pcdoc record; nm text;
begin
  if left(coalesce(p_secret, ''), 2) <> 'u:' then
    -- 예전 비밀구 방식은 nt_claim 그대로
    if nt_claim(p_camp, p_seat, p_secret, p_name) then return 'ok'; else return 'taken'; end if;
  end if;
  u := om_uid(substr(p_secret, 3));
  if u is null then raise exception '로그인이 끝났습니다 — 다시 로그인해 주세요'; end if;
  select role, seat into mem from nt_members where camp = p_camp and uid = u;
  if not found then raise exception '이 캠페인 권한이 없습니다 — 캠페인을 다시 열어 주세요'; end if;
  if mem.role = 'gm' then raise exception 'GM 계정은 자리에 앉지 않습니다'; end if;
  if coalesce(p_seat, '') = '' then
    update nt_members set seat = '' where camp = p_camp and uid = u;
    update nt_camp set data = (coalesce(data,'{}'::jsonb) #- array['claims', u]) where id = p_camp;
    return 'up';
  end if;
  if lower(p_seat) = 'gm' then raise exception '좌석 id 가 잘못되었습니다'; end if;
  select vis, data into pcdoc from nt_docs where camp = p_camp and kind = 'pc' and id = p_seat;
  if not found then raise exception '그런 PC 시트가 없습니다'; end if;
  if pcdoc.vis <> 'pub' then raise exception '아직 공개되지 않은 시트예요 — GM 이 「모두」로 공개하면 앉을 수 있어요'; end if;
  if exists (select 1 from nt_members where camp = p_camp and seat = p_seat and uid <> u) then return 'taken'; end if;
  if exists (select 1 from nt_auth where camp = p_camp and role = 'pl' and seat = p_seat) then return 'taken'; end if;
  select coalesce(data->>'claimMode', 'pub') into mode from nt_camp where id = p_camp;
  if mode = 'approve' then
    select name into nm from om_users where uid = u;
    cl := jsonb_build_object('seat', p_seat, 'name', coalesce(nullif(p_name,''), nm, u), 'at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
    update nt_camp set data = nt_jsonb_merge(coalesce(data,'{}'::jsonb), jsonb_build_object('claims', jsonb_build_object(u, cl))), updated_at = now() where id = p_camp;
    return 'pending';
  end if;
  update nt_members set seat = p_seat where camp = p_camp and uid = u;
  update nt_camp set data = (coalesce(data,'{}'::jsonb) #- array['claims', u]) where id = p_camp;
  return 'ok';
end $$;
grant execute on function public.nt_claim2(text, text, text, text) to anon, authenticated;

-- GM: 대기 중인 요청(p_uid)을 승인(p_ok) · 거절. 승인하면 그 계정이 그 시트에 앉는다(이미 남이 앉았으면 예외).
create or replace function public.nt_claim_decide(p_camp text, p_secret text, p_uid text, p_ok boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare cl jsonb; st text;
begin
  if nt_who(p_camp, p_secret) is distinct from 'gm' then raise exception 'GM 만 승인할 수 있습니다'; end if;
  select data->'claims'->p_uid into cl from nt_camp where id = p_camp;
  if cl is null then raise exception '그런 요청이 없어요 (이미 처리됐을 수 있어요)'; end if;
  st := cl->>'seat';
  if p_ok then
    if exists (select 1 from nt_members where camp = p_camp and seat = st and uid <> p_uid) or exists (select 1 from nt_auth where camp = p_camp and role = 'pl' and seat = st) then
      raise exception '그 시트에는 이미 다른 사람이 앉아 있어요';
    end if;
    insert into nt_members(camp, uid, role, seat) values (p_camp, p_uid, 'pl', st)
      on conflict (camp, uid) do update set seat = st where nt_members.role = 'pl';
  end if;
  update nt_camp set data = (coalesce(data,'{}'::jsonb) #- array['claims', p_uid]), updated_at = now() where id = p_camp;
  return true;
end $$;
grant execute on function public.nt_claim_decide(text, text, text, boolean) to anon, authenticated;

-- 예전 nt_claim(계정 방식)도 공개 시트만 (아직 nt_claim2 가 없는 옛 클라이언트용)
create or replace function public.nt_claim(p_camp text, p_seat text, p_secret text, p_name text)
returns boolean language plpgsql security definer set search_path = public as $$
declare cur nt_auth%rowtype; u text; mem record;
begin
  if left(coalesce(p_secret, ''), 2) = 'u:' then
    u := om_uid(substr(p_secret, 3));
    if u is null then raise exception '로그인이 끝났습니다 — 다시 로그인해 주세요'; end if;
    select role, seat into mem from nt_members where camp = p_camp and uid = u;
    if not found then raise exception '이 캠페인 권한이 없습니다 — 캠페인을 다시 열어 주세요'; end if;
    if mem.role = 'gm' then raise exception 'GM 계정은 자리에 앉지 않습니다'; end if;
    if coalesce(p_seat, '') = '' then update nt_members set seat = '' where camp = p_camp and uid = u; return true; end if;
    if lower(p_seat) = 'gm' then raise exception '좌석 id 가 잘못되었습니다'; end if;
    if not exists (select 1 from nt_docs where camp = p_camp and kind = 'pc' and id = p_seat and vis = 'pub') then raise exception '공개된 PC 시트가 아니에요 — GM 이 「모두」로 공개하면 앉을 수 있어요'; end if;
    if exists (select 1 from nt_members where camp = p_camp and seat = p_seat and uid <> u) then return false; end if;
    if exists (select 1 from nt_auth where camp = p_camp and role = 'pl' and seat = p_seat) then return false; end if;
    if coalesce((select data->>'claimMode' from nt_camp where id = p_camp), 'pub') = 'approve' then raise exception '이 캠페인은 GM 승인 뒤에 앉아요 — 노트를 새로 고쳐 주세요'; end if;
    update nt_members set seat = p_seat where camp = p_camp and uid = u;
    return true;
  end if;
  if p_seat is null or p_seat = '' or lower(p_seat) = 'gm' then raise exception '좌석 id 가 잘못되었습니다'; end if;
  if length(coalesce(p_secret,'')) < 4 then raise exception '비밀구가 너무 짧습니다 (4자 이상)'; end if;
  select * into cur from nt_auth where camp = p_camp and role = 'pl' and seat = p_seat;
  if found then
    if cur.hash = nt_hash(p_secret) then update nt_auth set name = coalesce(p_name, name) where camp = p_camp and role = 'pl' and seat = p_seat; return true; end if;
    return false;
  end if;
  if exists (select 1 from nt_members where camp = p_camp and seat = p_seat) then return false; end if;
  insert into nt_auth(camp, role, seat, hash, name) values (p_camp, 'pl', p_seat, nt_hash(p_secret), coalesce(p_name,''));
  return true;
end $$;

-- ---------- 3) 그림 저장소 정책 (웹툴 · 노트 · 제작기 공통 버킷 oremas) ----------
-- 공개 버킷이라 주소를 아는 사람은 그대로 본다. 없애는 것은 「목록 훑기」(anon select) 와 「아무나 덮어쓰기」(anon update) 뿐.
drop policy if exists "oremas img read"   on storage.objects;
drop policy if exists "oremas img update" on storage.objects;
drop policy if exists "oremas img update own" on storage.objects;
create policy "oremas img update own" on storage.objects for update to authenticated
  using (bucket_id = 'oremas' and owner = auth.uid()) with check (bucket_id = 'oremas' and owner = auth.uid());
-- insert 정책("oremas img insert")은 그대로 — 세 앱 모두 anon 키로 새 이름에 올린다. delete 정책은 원래 없다.

-- ---------- 4) 변경 이력 · 휴지통 ----------
create table if not exists public.nt_docs_history (
  hid  bigserial primary key,
  camp text not null,
  kind text not null,
  id   text not null,
  data jsonb,
  vis  text,
  op   text not null,
  at   timestamptz not null default now()
);
create index if not exists nt_docs_history_doc on public.nt_docs_history (camp, kind, id, at desc);
create index if not exists nt_docs_history_at on public.nt_docs_history (at);
alter table public.nt_docs_history enable row level security;   -- 정책 없음 → 아래 함수로만

create or replace function public.nt_docs_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- 지움은 언제나 남긴다. 고침은 내용이 바뀐 것만, 한 문서에 5분에 한 판 꼴로 (잇달아 고쳐도 이력이 넘치지 않게)
  if tg_op = 'DELETE' then
    insert into public.nt_docs_history(camp, kind, id, data, vis, op) values (old.camp, old.kind, old.id, old.data, old.vis, 'DELETE');
  elsif old.data is distinct from new.data or old.vis is distinct from new.vis then
    if old.updated_at < now() - interval '5 minutes'
       or not exists (select 1 from nt_docs_history h where h.camp = old.camp and h.kind = old.kind and h.id = old.id and h.at > now() - interval '5 minutes') then
      insert into public.nt_docs_history(camp, kind, id, data, vis, op) values (old.camp, old.kind, old.id, old.data, old.vis, 'UPDATE');
    end if;
  end if;
  if random() < 0.01 then delete from public.nt_docs_history where at < now() - interval '30 days'; end if;
  return null;
end $$;
drop trigger if exists nt_docs_audit on public.nt_docs;
create trigger nt_docs_audit after update or delete on public.nt_docs
  for each row execute function public.nt_docs_audit();

-- 문서 하나의 옛 판들 (최신부터). GM 은 무엇이든, PL 은 제 PC 시트(pc · pcp)만
create or replace function public.nt_history(p_camp text, p_secret text, p_kind text, p_id text, p_limit integer default 20)
returns table(hid bigint, op text, at timestamptz, vis text, data jsonb)
language plpgsql security definer set search_path = public as $$
declare w text;
begin
  w := nt_who(p_camp, p_secret);
  if w is null then raise exception '비밀구가 맞지 않습니다'; end if;
  if w <> 'gm' and not (p_kind in ('pc','pcp') and p_id = w) then raise exception 'PL 은 자기 PC 시트의 이력만 볼 수 있습니다'; end if;
  return query select h.hid, h.op, h.at, h.vis, h.data from nt_docs_history h
    where h.camp = p_camp and h.kind = p_kind and h.id = p_id order by h.at desc limit greatest(1, least(coalesce(p_limit, 20), 100));
end $$;
grant execute on function public.nt_history(text, text, text, text, integer) to anon, authenticated;

-- 최근 지운 문서 (지워지기 직전 내용 · 지금 없는 것만). GM 만
create or replace function public.nt_deleted(p_camp text, p_secret text, p_since timestamptz default null)
returns table(hid bigint, kind text, id text, at timestamptz, vis text, data jsonb)
language plpgsql security definer set search_path = public as $$
begin
  if nt_who(p_camp, p_secret) is distinct from 'gm' then raise exception 'GM 만 볼 수 있습니다'; end if;
  return query select distinct on (h.kind, h.id) h.hid, h.kind, h.id, h.at, h.vis, h.data from nt_docs_history h
    where h.camp = p_camp and h.op = 'DELETE' and h.at > coalesce(p_since, now() - interval '30 days')
      and not exists (select 1 from nt_docs d where d.camp = h.camp and d.kind = h.kind and d.id = h.id)
    order by h.kind, h.id, h.at desc;
end $$;
grant execute on function public.nt_deleted(text, text, timestamptz) to anon, authenticated;
-- 되살리기는 클라이언트가 nt_put 으로 옛 data 를 다시 쓴다 (GM).
