-- 망켓몬 세션 노트 — 공용 DB (2026-10-26 감우). 오레마스 · 제작기와 같은 Supabase 프로젝트에 올린다.
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여 넣고 Run. 여러 번 실행해도 된다.
--
-- 구조
--   nt_camp  캠페인 (무진 · Neo …). 누구나 목록을 읽는다.
--   nt_auth  비밀구 해시. GM 하나 + PL 좌석(seat = 제작기 트레이너 id). anon 은 직접 못 읽는다 — 함수만.
--   nt_docs  문서 (camp, kind, id, data, vis). kind = maps · spots · links · routes · ents · rels · plan · pc · sec …
--            vis = 'pub' 모두 | 'gm' GM 만 | 'pl:<seat>' 그 PL 과 GM
--            anon 은 vis = 'pub' 만 select 할 수 있다. 나머지는 nt_all / nt_get (비밀구 확인) 으로만.
--   쓰기는 전부 nt_put / nt_del (비밀구 확인): GM 은 무엇이든, PL 은 kind pc/pcp 이고 id 가 제 좌석인 문서, kind avail 이고 id 가 '_좌석' 으로 끝나는 문서만.
--   실시간: nt_docs 의 변경을 anon 이 postgres_changes 로 받는다 (RLS 때문에 pub 행만). 비공개 행은 쓰는 쪽이 broadcast 로 알린다.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.nt_camp (
  id         text primary key,
  name       text not null default '',
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.nt_auth (
  camp text not null,
  role text not null,            -- 'gm' | 'pl'
  seat text not null default '', -- pl 이면 트레이너 id
  hash text not null,
  name text not null default '',
  primary key (camp, role, seat)
);
create table if not exists public.nt_docs (
  camp       text not null,
  kind       text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  vis        text not null default 'pub',
  updated_at timestamptz not null default now(),
  primary key (camp, kind, id)
);
create index if not exists nt_docs_camp_upd on public.nt_docs (camp, updated_at);

alter table public.nt_camp enable row level security;
alter table public.nt_auth enable row level security;
alter table public.nt_docs enable row level security;
drop policy if exists "nt_camp read" on public.nt_camp;
drop policy if exists "nt_docs read pub" on public.nt_docs;
create policy "nt_camp read"     on public.nt_camp for select to anon, authenticated using (true);
create policy "nt_docs read pub" on public.nt_docs for select to anon, authenticated using (vis = 'pub');
-- nt_auth 에는 정책이 없다 = anon 은 아무것도 못 한다.

-- 실시간 (pub 행만 anon 에게 간다)
alter table public.nt_docs replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='nt_docs') then
    alter publication supabase_realtime add table public.nt_docs; end if;
end $$;

-- ---------- 도우미 ----------
create or replace function public.nt_hash(p text) returns text
language sql immutable as $$ select encode(extensions.digest(coalesce(p,''), 'sha256'), 'hex') $$;

-- 비밀구가 GM 것이면 'gm', PL 것이면 좌석 id, 아니면 null
create or replace function public.nt_who(p_camp text, p_secret text) returns text
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if p_secret is null or p_secret = '' then return null; end if;
  select role, seat into r from nt_auth where camp = p_camp and hash = nt_hash(p_secret) limit 1;
  if not found then return null; end if;
  if r.role = 'gm' then return 'gm'; end if;
  if r.role <> 'pl' or r.seat = '' or lower(r.seat) = 'gm' then return null; end if;
  return r.seat;
end $$;

-- ---------- 캠페인 ----------
create or replace function public.nt_create(p_name text, p_gm_secret text)
returns text language plpgsql security definer set search_path = public as $$
declare cid text;
begin
  if length(coalesce(p_gm_secret,'')) < 6 then raise exception 'GM 비밀구가 너무 짧습니다 (6자 이상)'; end if;
  cid := lower(substr(replace(gen_random_uuid()::text,'-',''), 1, 8));
  insert into nt_camp(id, name) values (cid, coalesce(p_name,''));
  insert into nt_auth(camp, role, seat, hash) values (cid, 'gm', '', nt_hash(p_gm_secret));
  return cid;
end $$;

create or replace function public.nt_whoami(p_camp text, p_secret text)
returns text language sql security definer set search_path = public as $$ select nt_who(p_camp, p_secret) $$;

create or replace function public.nt_camp_update(p_camp text, p_secret text, p_name text, p_data jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if nt_who(p_camp, p_secret) is distinct from 'gm' then raise exception 'GM 만 캠페인을 고칠 수 있습니다'; end if;
  update nt_camp set name = coalesce(p_name, name), data = coalesce(p_data, data), updated_at = now() where id = p_camp;
  return true;
end $$;

create or replace function public.nt_camp_del(p_camp text, p_secret text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if nt_who(p_camp, p_secret) is distinct from 'gm' then raise exception 'GM 만 캠페인을 지울 수 있습니다'; end if;
  delete from nt_docs where camp = p_camp;
  delete from nt_auth where camp = p_camp;
  delete from nt_camp where id = p_camp;
  return true;
end $$;

-- GM 비밀구 바꾸기
create or replace function public.nt_gm_secret(p_camp text, p_secret text, p_new text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if nt_who(p_camp, p_secret) is distinct from 'gm' then raise exception 'GM 만 바꿀 수 있습니다'; end if;
  if length(coalesce(p_new,'')) < 6 then raise exception '비밀구가 너무 짧습니다 (6자 이상)'; end if;
  update nt_auth set hash = nt_hash(p_new) where camp = p_camp and role = 'gm';
  return true;
end $$;

-- ---------- PL 좌석 ----------
-- GM 이 좌석에 비밀구를 준다 (p_pl_secret 이 null 이면 좌석을 비운다)
create or replace function public.nt_seat_set(p_camp text, p_secret text, p_seat text, p_pl_secret text, p_name text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if nt_who(p_camp, p_secret) is distinct from 'gm' then raise exception 'GM 만 좌석을 정할 수 있습니다'; end if;
  if p_seat is null or p_seat = '' or lower(p_seat) = 'gm' then raise exception '좌석 id 가 잘못되었습니다'; end if;
  if p_pl_secret is null then
    delete from nt_auth where camp = p_camp and role = 'pl' and seat = p_seat; return true;
  end if;
  if length(p_pl_secret) < 4 then raise exception 'PL 비밀구가 너무 짧습니다 (4자 이상)'; end if;
  insert into nt_auth(camp, role, seat, hash, name) values (p_camp, 'pl', p_seat, nt_hash(p_pl_secret), coalesce(p_name,''))
    on conflict (camp, role, seat) do update set hash = excluded.hash, name = coalesce(excluded.name, nt_auth.name);
  return true;
end $$;

-- 빈 좌석이면 PL 이 스스로 비밀구를 등록해 앉는다 (오레마스와 같은 방식)
create or replace function public.nt_claim(p_camp text, p_seat text, p_secret text, p_name text)
returns boolean language plpgsql security definer set search_path = public as $$
declare cur nt_auth%rowtype;
begin
  if p_seat is null or p_seat = '' or lower(p_seat) = 'gm' then raise exception '좌석 id 가 잘못되었습니다'; end if;
  if length(coalesce(p_secret,'')) < 4 then raise exception '비밀구가 너무 짧습니다 (4자 이상)'; end if;
  select * into cur from nt_auth where camp = p_camp and role = 'pl' and seat = p_seat;
  if found then
    if cur.hash = nt_hash(p_secret) then update nt_auth set name = coalesce(p_name, name) where camp = p_camp and role = 'pl' and seat = p_seat; return true; end if;
    return false;  -- 남의 좌석
  end if;
  insert into nt_auth(camp, role, seat, hash, name) values (p_camp, 'pl', p_seat, nt_hash(p_secret), coalesce(p_name,''));
  return true;
end $$;

-- 좌석 목록 (이름만 · 해시 없음): 누구나
create or replace function public.nt_seats(p_camp text)
returns table(seat text, name text) language sql security definer set search_path = public as $$
  select seat, name from nt_auth where camp = p_camp and role = 'pl' order by seat $$;

-- ---------- 문서 ----------
-- 내가 볼 수 있는 vis 조건
create or replace function public.nt_can_see(p_who text, p_vis text) returns boolean
language sql immutable as $$
  select p_vis = 'pub' or p_who = 'gm' or (p_who is not null and p_vis = 'pl:' || p_who) $$;

create or replace function public.nt_all(p_camp text, p_secret text, p_since timestamptz default null)
returns table(kind text, id text, data jsonb, vis text, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare w text;
begin
  w := nt_who(p_camp, p_secret);
  return query select d.kind, d.id, d.data, d.vis, d.updated_at from nt_docs d
    where d.camp = p_camp and nt_can_see(w, d.vis) and (p_since is null or d.updated_at > p_since)
    order by d.kind, d.id;
end $$;

create or replace function public.nt_get(p_camp text, p_secret text, p_kind text, p_id text)
returns table(kind text, id text, data jsonb, vis text, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare w text;
begin
  w := nt_who(p_camp, p_secret);
  return query select d.kind, d.id, d.data, d.vis, d.updated_at from nt_docs d
    where d.camp = p_camp and d.kind = p_kind and d.id = p_id and nt_can_see(w, d.vis);
end $$;

-- 지워진 것을 알기 위한 id 목록 (내가 볼 수 있는 것만)
create or replace function public.nt_ids(p_camp text, p_secret text)
returns table(kind text, id text) language plpgsql security definer set search_path = public as $$
declare w text;
begin
  w := nt_who(p_camp, p_secret);
  return query select d.kind, d.id from nt_docs d where d.camp = p_camp and nt_can_see(w, d.vis);
end $$;

create or replace function public.nt_put(p_camp text, p_secret text, p_kind text, p_id text, p_data jsonb, p_vis text default null)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare w text; v text; cur nt_docs%rowtype; t timestamptz;
begin
  w := nt_who(p_camp, p_secret);
  if w is null then raise exception '비밀구가 맞지 않습니다'; end if;
  if p_kind is null or p_kind = '' or p_id is null or p_id = '' then raise exception '문서 이름이 비었습니다'; end if;
  if length(p_data::text) > 400000 then raise exception '문서가 너무 큽니다 (그림은 저장소에 올리고 주소만)'; end if;
  select * into cur from nt_docs where camp = p_camp and kind = p_kind and id = p_id;
  if w <> 'gm' then
    -- PL: 제 PC 시트(kind pc, id = 좌석) · 제 PC 비공개 칸(kind pcp, id = 좌석) · 제 일정 표(kind avail, id 가 '_좌석' 으로 끝남)만
    if not ((p_kind in ('pc','pcp') and p_id = w) or (p_kind = 'avail' and p_id like '%\_' || w)) then raise exception 'PL 은 자기 PC 시트와 자기 일정만 고칠 수 있습니다'; end if;
    if found and not nt_can_see(w, cur.vis) then raise exception '이 문서는 고칠 수 없습니다'; end if;
    v := coalesce(p_vis, case when found then cur.vis else 'pub' end);
    if v not in ('pub', 'pl:' || w) then raise exception 'PL 은 공개 또는 본인 전용으로만 둘 수 있습니다'; end if;
  else
    v := coalesce(p_vis, case when found then cur.vis else 'pub' end);
    if v <> 'pub' and v <> 'gm' and v not like 'pl:%' then raise exception '공개 설정 값이 잘못되었습니다'; end if;
  end if;
  t := now();
  insert into nt_docs(camp, kind, id, data, vis, updated_at) values (p_camp, p_kind, p_id, coalesce(p_data,'{}'::jsonb), v, t)
    on conflict (camp, kind, id) do update set data = excluded.data, vis = excluded.vis, updated_at = excluded.updated_at;
  update nt_camp set updated_at = t where id = p_camp;
  return t;
end $$;

create or replace function public.nt_del(p_camp text, p_secret text, p_kind text, p_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare w text;
begin
  w := nt_who(p_camp, p_secret);
  if w is null then raise exception '비밀구가 맞지 않습니다'; end if;
  if w <> 'gm' and not ((p_kind in ('pc','pcp') and p_id = w) or (p_kind = 'avail' and p_id like '%\_' || w)) then raise exception 'PL 은 자기 PC 시트와 자기 일정만 지울 수 있습니다'; end if;
  delete from nt_docs where camp = p_camp and kind = p_kind and id = p_id;
  update nt_camp set updated_at = now() where id = p_camp;
  return true;
end $$;

-- 한꺼번에 여러 문서 (가져오기 · 이전용). GM 만. p_rows = [{kind,id,data,vis}]
create or replace function public.nt_put_many(p_camp text, p_secret text, p_rows jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare r jsonb; n integer := 0; t timestamptz := now();
begin
  if nt_who(p_camp, p_secret) is distinct from 'gm' then raise exception 'GM 만 할 수 있습니다'; end if;
  for r in select * from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb)) loop
    insert into nt_docs(camp, kind, id, data, vis, updated_at)
      values (p_camp, r->>'kind', r->>'id', coalesce(r->'data','{}'::jsonb), coalesce(nullif(r->>'vis',''),'pub'), t)
      on conflict (camp, kind, id) do update set data = excluded.data, vis = excluded.vis, updated_at = excluded.updated_at;
    n := n + 1;
  end loop;
  update nt_camp set updated_at = t where id = p_camp;
  return n;
end $$;

-- 그림 저장소: 오레마스의 'oremas' 버킷을 같이 쓴다 (경로 notes/<캠페인>/…). 오레마스 schema.sql 이 버킷과 정책을 만든다.
