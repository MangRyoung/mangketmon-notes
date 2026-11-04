-- 세션 노트 2026-11-04 패치 (감우) — 한 계정이 여러 트레이너 자리에 앉기
-- Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여 넣고 Run. 여러 번 실행해도 된다.
-- 먼저 들어가 있어야 하는 것: schema.sql · patch_2026-10-29_계정.sql · patch_2026-10-29_PL기본.sql · patch_2026-11-03_노트.sql
--
-- 망령 11-04 「한 사람이 여러 트레이너 자리에 앉을 수 있게 해」
--   nt_members.seats = 그 계정이 앉은 자리 전부 (PC 시트 id 목록). nt_members.seat = 지금 쓰는 자리 하나(예전과 같은 뜻).
--   권한 · 공개(pl:<자리>)는 지금 쓰는 자리로 정해진다(nt_who 그대로). 자리를 바꾸면(nt_seat_use) 그 시트를 고치고 그 PL 몫 문서를 본다.
--   한 자리에는 여전히 한 계정만 — 남의 seats 에 든 자리는 「taken」.
--   클라이언트는 seats 가 없으면(이 파일을 아직 안 돌렸으면) 예전처럼 한 자리만 쓴다.

alter table public.nt_members add column if not exists seats text[] not null default '{}';
update public.nt_members set seats = array[seat] where role = 'pl' and seat <> '' and not (seat = any(seats));

-- 그 자리에 다른 계정(또는 예전 비밀구 좌석)이 앉아 있나
create or replace function public.nt_seat_taken(p_camp text, p_seat text, p_uid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from nt_members where camp = p_camp and uid <> p_uid and (seat = p_seat or p_seat = any(seats)))
      or exists (select 1 from nt_auth where camp = p_camp and role = 'pl' and seat = p_seat) $$;

-- 자리 목록: 계정이 앉은 자리 전부(seats)도
drop function if exists public.nt_seats(text);
create function public.nt_seats(p_camp text)
returns table(seat text, name text, sec boolean, acct boolean) language sql security definer set search_path = public as $$
  select x.seat, max(x.name), bool_or(x.k = 's'), bool_or(x.k = 'a') from (
    select a.seat, a.name, 's' as k from nt_auth a where a.camp = p_camp and a.role = 'pl'
    union all
    select s.seat, u.name, 'a' from nt_members m join om_users u on u.uid = m.uid
      cross join lateral (select unnest(case when cardinality(m.seats) > 0 then m.seats else array[m.seat] end) as seat) s
      where m.camp = p_camp and m.role = 'pl' and s.seat <> ''
  ) x group by x.seat order by x.seat $$;
grant execute on function public.nt_seats(text) to anon, authenticated;

-- 나: camps[].seats 를 더한다
create or replace function public.nt_me(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u text; usr record; camps jsonb;
begin
  u := om_uid(p_token);
  if u is null then return null; end if;
  select uid, name, admin into usr from om_users where uid = u;
  if usr.admin then
    select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'role', coalesce(m.role, 'gm'), 'seat', case when m.role = 'pl' then m.seat else '' end,
        'seats', case when m.role = 'pl' then to_jsonb(coalesce(m.seats, '{}')) else '[]'::jsonb end)), '[]'::jsonb)
      into camps from nt_camp c left join nt_members m on m.camp = c.id and m.uid = u;
  else
    select coalesce(jsonb_agg(jsonb_build_object('id', m.camp, 'role', m.role, 'seat', m.seat, 'seats', to_jsonb(coalesce(m.seats, '{}')))), '[]'::jsonb)
      into camps from nt_members m where m.uid = u;
  end if;
  return jsonb_build_object('uid', usr.uid, 'name', usr.name, 'admin', usr.admin, 'camps', camps);
end $$;

-- 관리 창 목록: members[].seats
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
        'members', (select coalesce(jsonb_agg(jsonb_build_object('uid', m.uid, 'role', m.role, 'seat', m.seat, 'seats', to_jsonb(coalesce(m.seats, '{}')))), '[]'::jsonb) from nt_members m where m.camp = c.id),
        'legacy', (select coalesce(jsonb_agg(jsonb_build_object('seat', a.seat, 'name', a.name)), '[]'::jsonb) from nt_auth a where a.camp = c.id and a.role = 'pl'),
        'pcs', (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', coalesce(d.data->>'name', d.id)) order by d.id), '[]'::jsonb) from nt_docs d where d.camp = c.id and d.kind = 'pc')
      ) order by c.created_at), '[]'::jsonb) from nt_camp c where c.id = any(cids)));
end $$;

-- 권한 주기: PL 자리를 주면 seats 에 더하고 지금 자리로. p_seat '' = 구경(자리 전부 비움). p_seat '-<id>' = 그 자리만 뺀다
create or replace function public.nt_admin_member(p_token text, p_camp text, p_uid text, p_role text, p_seat text)
returns boolean language plpgsql security definer set search_path = public as $$
declare u text; drop_one text;
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
  if p_role = 'pl' and left(coalesce(p_seat, ''), 1) = '-' then
    drop_one := substr(p_seat, 2);
    update nt_members set seats = array_remove(seats, drop_one),
      seat = case when seat = drop_one then coalesce((array_remove(seats, drop_one))[1], '') else seat end
      where camp = p_camp and uid = p_uid;
    return true;
  end if;
  if p_role = 'pl' and coalesce(p_seat, '') <> '' then
    if lower(p_seat) = 'gm' then raise exception '이 좌석 id 는 쓸 수 없습니다'; end if;
    if nt_seat_taken(p_camp, p_seat, p_uid) then raise exception '그 시트에는 이미 다른 계정이 앉아 있습니다'; end if;
  end if;
  insert into nt_members(camp, uid, role, seat, seats) values (p_camp, p_uid, p_role, case when p_role = 'gm' then '' else coalesce(p_seat, '') end,
      case when p_role = 'pl' and coalesce(p_seat, '') <> '' then array[p_seat] else '{}' end)
    on conflict (camp, uid) do update set role = excluded.role,
      seat = case when excluded.role = 'gm' then '' else coalesce(p_seat, nt_members.seat) end,
      seats = case when excluded.role = 'gm' or p_seat = '' then '{}'
                   when p_seat is null then nt_members.seats
                   when p_seat = any(nt_members.seats) then nt_members.seats
                   else array_append(nt_members.seats, p_seat) end;
  return true;
end $$;
grant execute on function public.nt_me(text), public.nt_admin_list(text), public.nt_admin_member(text, text, text, text, text) to anon, authenticated;

-- 자리 앉기: 이미 앉은 자리가 있어도 더 앉는다(지금 자리 = 새 자리). p_seat '' = 지금 자리에서만 일어난다(다른 자리가 있으면 그리로)
create or replace function public.nt_claim2(p_camp text, p_seat text, p_secret text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare u text; mem record; mode text; cl jsonb; pcdoc record; nm text; rest text[];
begin
  if left(coalesce(p_secret, ''), 2) <> 'u:' then
    if nt_claim(p_camp, p_seat, p_secret, p_name) then return 'ok'; else return 'taken'; end if;
  end if;
  u := om_uid(substr(p_secret, 3));
  if u is null then raise exception '로그인이 끝났습니다 — 다시 로그인해 주세요'; end if;
  select role, seat, seats into mem from nt_members where camp = p_camp and uid = u;
  if not found then raise exception '이 캠페인 권한이 없습니다 — 캠페인을 다시 열어 주세요'; end if;
  if mem.role = 'gm' then raise exception 'GM 계정은 자리에 앉지 않습니다'; end if;
  if coalesce(p_seat, '') = '' then
    if exists (select 1 from nt_camp where id = p_camp and data->'claims' ? u) then
      update nt_camp set data = (coalesce(data,'{}'::jsonb) #- array['claims', u]) where id = p_camp;
      return 'up';
    end if;
    rest := array_remove(coalesce(mem.seats, '{}'), mem.seat);
    update nt_members set seats = rest, seat = coalesce(rest[1], '') where camp = p_camp and uid = u;
    return 'up';
  end if;
  if lower(p_seat) = 'gm' then raise exception '좌석 id 가 잘못되었습니다'; end if;
  if p_seat = any(coalesce(mem.seats, '{}')) or p_seat = mem.seat then
    update nt_members set seat = p_seat, seats = case when p_seat = any(seats) then seats else array_append(seats, p_seat) end where camp = p_camp and uid = u;
    return 'ok';
  end if;
  select vis, data into pcdoc from nt_docs where camp = p_camp and kind = 'pc' and id = p_seat;
  if not found then raise exception '그런 PC 시트가 없습니다'; end if;
  if pcdoc.vis <> 'pub' then raise exception '아직 공개되지 않은 시트예요 — GM 이 「모두」로 공개하면 앉을 수 있어요'; end if;
  if nt_seat_taken(p_camp, p_seat, u) then return 'taken'; end if;
  select coalesce(data->>'claimMode', 'pub') into mode from nt_camp where id = p_camp;
  if mode = 'approve' then
    select name into nm from om_users where uid = u;
    cl := jsonb_build_object('seat', p_seat, 'name', coalesce(nullif(p_name,''), nm, u), 'at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
    update nt_camp set data = nt_jsonb_merge(coalesce(data,'{}'::jsonb), jsonb_build_object('claims', jsonb_build_object(u, cl))), updated_at = now() where id = p_camp;
    return 'pending';
  end if;
  update nt_members set seat = p_seat, seats = case when mem.seat <> '' and not (mem.seat = any(seats)) then array_append(seats, mem.seat) else seats end || array[p_seat]
    where camp = p_camp and uid = u;
  update nt_camp set data = (coalesce(data,'{}'::jsonb) #- array['claims', u]) where id = p_camp;
  return 'ok';
end $$;
grant execute on function public.nt_claim2(text, text, text, text) to anon, authenticated;

-- GM 승인: 그 계정 자리에 더한다
create or replace function public.nt_claim_decide(p_camp text, p_secret text, p_uid text, p_ok boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare cl jsonb; st text;
begin
  if nt_who(p_camp, p_secret) is distinct from 'gm' then raise exception 'GM 만 승인할 수 있습니다'; end if;
  select data->'claims'->p_uid into cl from nt_camp where id = p_camp;
  if cl is null then raise exception '그런 요청이 없어요 (이미 처리됐을 수 있어요)'; end if;
  st := cl->>'seat';
  if p_ok then
    if nt_seat_taken(p_camp, st, p_uid) then raise exception '그 시트에는 이미 다른 사람이 앉아 있어요'; end if;
    insert into nt_members(camp, uid, role, seat, seats) values (p_camp, p_uid, 'pl', st, array[st])
      on conflict (camp, uid) do update set seat = st,
        seats = case when st = any(nt_members.seats) then nt_members.seats
                     else (case when nt_members.seat <> '' and not (nt_members.seat = any(nt_members.seats)) then array_append(nt_members.seats, nt_members.seat) else nt_members.seats end) || array[st] end
        where nt_members.role = 'pl';
  end if;
  update nt_camp set data = (coalesce(data,'{}'::jsonb) #- array['claims', p_uid]), updated_at = now() where id = p_camp;
  return true;
end $$;
grant execute on function public.nt_claim_decide(text, text, text, boolean) to anon, authenticated;

-- 내 자리 바꾸기: 이미 앉은 자리(seats) 중 하나를 지금 자리로
create or replace function public.nt_seat_use(p_camp text, p_secret text, p_seat text)
returns boolean language plpgsql security definer set search_path = public as $$
declare u text;
begin
  if left(coalesce(p_secret, ''), 2) <> 'u:' then raise exception '계정으로 로그인해야 자리를 바꿀 수 있습니다'; end if;
  u := om_uid(substr(p_secret, 3));
  if u is null then raise exception '로그인이 끝났습니다 — 다시 로그인해 주세요'; end if;
  update nt_members set seat = p_seat where camp = p_camp and uid = u and role = 'pl' and p_seat = any(seats);
  if not found then raise exception '앉아 있지 않은 자리예요'; end if;
  return true;
end $$;
grant execute on function public.nt_seat_use(text, text, text) to anon, authenticated;
