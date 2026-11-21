-- 세션 노트 2026-11-22 패치 (감우) — 「GM만」 시트도 그 자리 PL 은 보고 고친다
-- Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여 넣고 Run. 여러 번 실행해도 된다.
-- 먼저 들어가 있어야 하는 것: schema.sql (nt_who · nt_docs · nt_can_see). 다른 패치는 건드리지 않는다.
--
-- 망령 11-22 「GM만으로 돌려도 그 자리에 앉아있는 사람에겐 권한도 있고 보이기도 했으면 좋겠는데? — 시트야 시트」
--   자기 자리 PC 시트(kind pc · pcp, id = 지금 쓰는 자리)는 공개 범위가 「GM만」이어도 그 자리 PL 이 읽고 고친다.
--   GM 메모(sec) · 각성체(awk) 같은 다른 문서는 그대로 공개 범위를 따른다.
--   PL 이 고칠 때 공개 범위는 그대로 둘 수 있다(「GM만」 → 「GM만」). PL 이 새로 「GM만」으로 바꾸는 것은 여전히 안 된다.
--   클라이언트(js/app.js canSee)도 같은 규칙.

create or replace function public.nt_can_see2(p_who text, p_vis text, p_kind text, p_id text) returns boolean
language sql immutable as $$
  select nt_can_see(p_who, p_vis)
      or (p_who is not null and p_who <> 'gm' and p_kind in ('pc','pcp') and p_id = p_who) $$;

create or replace function public.nt_all(p_camp text, p_secret text, p_since timestamptz default null)
returns table(kind text, id text, data jsonb, vis text, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare w text;
begin
  w := nt_who(p_camp, p_secret);
  return query select d.kind, d.id, d.data, d.vis, d.updated_at from nt_docs d
    where d.camp = p_camp and nt_can_see2(w, d.vis, d.kind, d.id) and (p_since is null or d.updated_at > p_since)
    order by d.kind, d.id;
end $$;

create or replace function public.nt_get(p_camp text, p_secret text, p_kind text, p_id text)
returns table(kind text, id text, data jsonb, vis text, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare w text;
begin
  w := nt_who(p_camp, p_secret);
  return query select d.kind, d.id, d.data, d.vis, d.updated_at from nt_docs d
    where d.camp = p_camp and d.kind = p_kind and d.id = p_id and nt_can_see2(w, d.vis, d.kind, d.id);
end $$;

create or replace function public.nt_ids(p_camp text, p_secret text)
returns table(kind text, id text) language plpgsql security definer set search_path = public as $$
declare w text;
begin
  w := nt_who(p_camp, p_secret);
  return query select d.kind, d.id from nt_docs d where d.camp = p_camp and nt_can_see2(w, d.vis, d.kind, d.id);
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
    if found and not nt_can_see2(w, cur.vis, p_kind, p_id) then raise exception '이 문서는 고칠 수 없습니다'; end if;
    v := coalesce(p_vis, case when found then cur.vis else 'pub' end);
    -- 11-22: GM 이 「GM만」으로 둔 자기 시트는 그대로 「GM만」으로 저장할 수 있다 (바꾸는 건 안 됨)
    if v not in ('pub', 'pl:' || w) and not (found and v = cur.vis) then raise exception 'PL 은 공개 또는 본인 전용으로만 둘 수 있습니다'; end if;
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
