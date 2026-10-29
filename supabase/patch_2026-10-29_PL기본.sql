-- 세션 노트 PL 기본 권한 (2026-10-29 감우, 망령 「웹툴처럼 로그인한 PL들은 기본적으로 PL 권한으로 자기가 자리에 앉을 수 있으면」)
-- Supabase SQL Editor 에 이 파일 전체를 붙여 넣고 Run. 여러 번 실행해도 된다. 먼저 patch_2026-10-29_계정.sql 이 들어가 있어야 한다.
--   * nt_join: 계정으로 캠페인을 열면 기본으로 PL 권한(자리 없음)을 준다. 관리자 · 이미 GM/PL 이면 그대로 (웹툴 om_room_join 과 같은 규칙)
--   * nt_claim: 계정('u:'+로그인 표)도 빈 PC 시트에 스스로 앉는다. 다른 계정이 앉았거나 비밀구 좌석이 있는 시트는 못 앉는다.
--     p_seat 가 '' 이면 자리에서 일어난다(PL 권한은 남는다). GM 계정은 자리에 앉지 않는다. 예전 비밀구 방식은 그대로.

create or replace function public.nt_join(p_token text, p_camp text)
returns text language plpgsql security definer set search_path = public as $$
declare u text; r text;
begin
  u := om_uid(p_token);
  if u is null then return null; end if;
  if not exists (select 1 from nt_camp where id = p_camp) then return null; end if;
  if exists (select 1 from om_users where uid = u and admin) and not exists (select 1 from nt_members where camp = p_camp and uid = u) then return 'gm'; end if;
  insert into nt_members(camp, uid, role, seat) values (p_camp, u, 'pl', '') on conflict (camp, uid) do nothing;
  select role into r from nt_members where camp = p_camp and uid = u;
  return r;
end $$;

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
    if not exists (select 1 from nt_docs where camp = p_camp and kind = 'pc' and id = p_seat) then raise exception '그런 PC 시트가 없습니다'; end if;
    if exists (select 1 from nt_members where camp = p_camp and seat = p_seat and uid <> u) then return false; end if;
    if exists (select 1 from nt_auth where camp = p_camp and role = 'pl' and seat = p_seat) then return false; end if;
    update nt_members set seat = p_seat where camp = p_camp and uid = u;
    return true;
  end if;
  -- 예전 비밀구 방식 (그대로) + 계정이 앉은 시트는 막는다
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

grant execute on function public.nt_join(text, text), public.nt_claim(text, text, text, text) to anon, authenticated;
