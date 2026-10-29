-- 세션 노트 계정 로그인 (2026-10-29 감우, 망령 「세션 노트랑 웹툴이랑 로그인 체계를 같게」)
-- Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여 넣고 Run. 여러 번 실행해도 된다.
-- 먼저 들어가 있어야 하는 것: 오레마스 supabase/patch_2026-10-23_계정.sql (om_users · om_sess · om_uid). 이미 들어가 있다.
--
-- 내용
--   * 세션 노트도 웹툴(오레마스) 계정으로 들어온다. 비밀구 자리에 'u:<로그인 표>' (웹툴과 같은 꼴)
--   * 캠페인마다 GM / PL 권한: nt_members(캠페인, 계정, 역할, 좌석). 좌석 = PC 시트 id (제작기 트레이너 id)
--   * 웹툴 관리자(om_users.admin)는 모든 캠페인에서 GM
--   * 예전 비밀구(GM 비밀구 · 좌석 비밀구 · ?gm= · ?pl= 링크)도 그대로 된다
--   * 관리 창 함수: nt_me · nt_admin_list · nt_admin_member · nt_camp_new
-- 표와 데이터는 지우지 않는다. nt_who · nt_seats 를 다시 만든다 (예전 동작 + 계정).

create table if not exists public.nt_members (
  camp text not null references public.nt_camp(id) on delete cascade,
  uid  text not null references public.om_users(uid) on delete cascade,
  role text not null default 'pl',        -- 'gm' | 'pl'
  seat text not null default '',          -- PL 의 PC 시트 id (비어 있으면 구경)
  primary key (camp, uid)
);
alter table public.nt_members enable row level security;
-- 정책 없음 = anon 은 직접 못 읽는다. 아래 함수만 읽는다.

-- 비밀구가 GM 것이면 'gm', PL 것이면 좌석 id, 아니면 null.
-- 'u:<로그인 표>' 는 계정: 캠페인 멤버 역할(gm / pl+좌석) → 없으면 관리자는 GM
create or replace function public.nt_who(p_camp text, p_secret text) returns text
language plpgsql security definer set search_path = public as $$
declare r record; u text; mem record; adm boolean;
begin
  if p_secret is null or p_secret = '' then return null; end if;
  if left(p_secret, 2) = 'u:' then
    u := om_uid(substr(p_secret, 3));
    if u is null then return null; end if;
    select role, seat into mem from nt_members where camp = p_camp and uid = u;
    if found then
      if mem.role = 'gm' then return 'gm'; end if;
      if mem.seat <> '' and lower(mem.seat) <> 'gm' then return mem.seat; end if;
    end if;
    select admin into adm from om_users where uid = u;
    if coalesce(adm, false) then return 'gm'; end if;
    return null;
  end if;
  select role, seat into r from nt_auth where camp = p_camp and hash = nt_hash(p_secret) limit 1;
  if not found then return null; end if;
  if r.role = 'gm' then return 'gm'; end if;
  if r.role <> 'pl' or r.seat = '' or lower(r.seat) = 'gm' then return null; end if;
  return r.seat;
end $$;

-- 좌석 목록 (이름만 · 해시 없음): 누구나. 비밀구 좌석 + 계정 좌석 (계정 좌석의 이름 = 계정 이름). sec = 비밀구 좌석 있음 · acct = 계정이 앉음
drop function if exists public.nt_seats(text);
create function public.nt_seats(p_camp text)
returns table(seat text, name text, sec boolean, acct boolean) language sql security definer set search_path = public as $$
  select x.seat, max(x.name), bool_or(x.k = 's'), bool_or(x.k = 'a') from (
    select a.seat, a.name, 's' as k from nt_auth a where a.camp = p_camp and a.role = 'pl'
    union all
    select m.seat, u.name, 'a' from nt_members m join om_users u on u.uid = m.uid where m.camp = p_camp and m.role = 'pl' and m.seat <> ''
  ) x group by x.seat order by x.seat $$;
grant execute on function public.nt_seats(text) to anon, authenticated;

-- 나: {uid, name, admin, camps:[{id, role, seat}]} (관리자는 멤버가 아닌 캠페인도 role 'gm')
create or replace function public.nt_me(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u text; usr record; camps jsonb;
begin
  u := om_uid(p_token);
  if u is null then return null; end if;
  select uid, name, admin into usr from om_users where uid = u;
  if usr.admin then
    select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'role', coalesce(m.role, 'gm'), 'seat', case when m.role = 'pl' then m.seat else '' end)), '[]'::jsonb)
      into camps from nt_camp c left join nt_members m on m.camp = c.id and m.uid = u;
  else
    select coalesce(jsonb_agg(jsonb_build_object('id', m.camp, 'role', m.role, 'seat', m.seat)), '[]'::jsonb)
      into camps from nt_members m where m.uid = u;
  end if;
  return jsonb_build_object('uid', usr.uid, 'name', usr.name, 'admin', usr.admin, 'camps', camps);
end $$;

-- 캠페인 만들기 (계정): 만든 계정이 그 캠페인의 GM. 예전 GM 비밀구 자리는 아무도 모르는 값으로
create or replace function public.nt_camp_new(p_token text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare u text; cid text;
begin
  u := om_uid(p_token);
  if u is null then raise exception '로그인이 끝났습니다 — 다시 로그인해 주세요'; end if;
  cid := nt_create(p_name, encode(extensions.gen_random_bytes(18), 'hex'));
  insert into nt_members(camp, uid, role, seat) values (cid, u, 'gm', '') on conflict (camp, uid) do update set role = 'gm', seat = '';
  return cid;
end $$;

-- 관리 창 목록. 관리자는 모든 캠페인, 아니면 내가 GM 인 캠페인만.
-- {admin, users:[{uid, name, admin, last_at}], camps:[{id, name, members:[{uid, role, seat}], legacy:[{seat, name}], pcs:[{id, name}]}]}
create or replace function public.nt_admin_list(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u text; adm boolean; cids text[];
begin
  u := om_uid(p_token);
  if u is null then raise exception '로그인이 끝났습니다 — 다시 로그인해 주세요'; end if;
  select coalesce(admin, false) into adm from om_users where uid = u;
  if adm then select coalesce(array_agg(id), '{}') into cids from nt_camp;
  else select coalesce(array_agg(camp), '{}') into cids from nt_members where uid = u and role = 'gm'; end if;
  if not adm and cardinality(cids) = 0 then raise exception '관리자나 캠페인 GM 만 볼 수 있습니다'; end if;
  return jsonb_build_object('admin', adm,
    'users', (select coalesce(jsonb_agg(jsonb_build_object('uid', x.uid, 'name', x.name, 'admin', x.admin, 'last_at', x.last_at) order by x.created_at), '[]'::jsonb) from om_users x),
    'camps', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name,
        'members', (select coalesce(jsonb_agg(jsonb_build_object('uid', m.uid, 'role', m.role, 'seat', m.seat)), '[]'::jsonb) from nt_members m where m.camp = c.id),
        'legacy', (select coalesce(jsonb_agg(jsonb_build_object('seat', a.seat, 'name', a.name)), '[]'::jsonb) from nt_auth a where a.camp = c.id and a.role = 'pl'),
        'pcs', (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', coalesce(d.data->>'name', d.id)) order by d.id), '[]'::jsonb) from nt_docs d where d.camp = c.id and d.kind = 'pc')
      ) order by c.created_at), '[]'::jsonb) from nt_camp c where c.id = any(cids)));
end $$;

-- 캠페인 권한 주기 · 빼기 (관리자 또는 그 캠페인 GM): p_role 'gm' | 'pl' | null(빼기). p_seat = PL 의 PC 시트 id ('' = 구경, null = 그대로)
-- 한 좌석에는 계정 하나만. 자기 GM 권한은 스스로 못 뺀다(관리자는 언제나 GM 이라 괜찮다)
create or replace function public.nt_admin_member(p_token text, p_camp text, p_uid text, p_role text, p_seat text)
returns boolean language plpgsql security definer set search_path = public as $$
declare u text;
begin
  u := om_uid(p_token);
  if u is null then raise exception '로그인이 끝났습니다 — 다시 로그인해 주세요'; end if;
  if nt_who(p_camp, 'u:' || p_token) is distinct from 'gm' then raise exception '관리자나 이 캠페인 GM 만 권한을 바꿀 수 있습니다'; end if;
  if p_uid = u and not coalesce((select admin from om_users where uid = u), false) and coalesce(p_role, '') <> 'gm' then
    raise exception '내 GM 권한은 스스로 뺄 수 없습니다 — 다른 GM 이나 관리자에게 부탁해 주세요';
  end if;
  if not exists (select 1 from om_users where uid = p_uid) then raise exception '없는 계정입니다'; end if;
  if p_role is null then delete from nt_members where camp = p_camp and uid = p_uid; return true; end if;
  if p_role not in ('gm', 'pl') then raise exception '역할은 gm 또는 pl'; end if;
  if p_role = 'pl' and coalesce(p_seat, '') <> '' then
    if lower(p_seat) = 'gm' then raise exception '이 좌석 id 는 쓸 수 없습니다'; end if;
    if exists (select 1 from nt_members where camp = p_camp and seat = p_seat and uid <> p_uid) then raise exception '그 시트에는 이미 다른 계정이 앉아 있습니다'; end if;
  end if;
  insert into nt_members(camp, uid, role, seat) values (p_camp, p_uid, p_role, case when p_role = 'gm' then '' else coalesce(p_seat, '') end)
    on conflict (camp, uid) do update set role = excluded.role, seat = case when excluded.role = 'gm' then '' else coalesce(p_seat, nt_members.seat) end;
  return true;
end $$;

grant execute on function public.nt_me(text), public.nt_camp_new(text, text), public.nt_admin_list(text), public.nt_admin_member(text, text, text, text, text) to anon, authenticated;
