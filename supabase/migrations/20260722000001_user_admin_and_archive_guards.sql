-- W2-6 DB 보안 2건

-- ① 권한 상승 방지: 본인이 자기 role/is_active를 바꿀 수 없게 한다.
--    users_self_all 정책이 본인 레코드 전체 수정을 허용해 member가 스스로 admin이
--    되거나 자기 계정을 활성/비활성 토글할 수 있는 구멍이 있었다.
--    프로필(name/avatar_url) 수정은 계속 허용, role/is_active 변경은 admin만.
create or replace function fn_guard_user_privileged_fields()
returns trigger
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and not is_admin() then
    raise exception 'role/is_active는 admin만 변경할 수 있습니다';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_users_guard_privileged
  before update on users
  for each row
  execute function fn_guard_user_privileged_fields();

-- admin이 role/is_active를 바꿀 수 있도록 write 정책 추가 (기존 users_self_all은 본인 한정)
create policy "users_admin_write" on users
  for update to authenticated
  using (is_admin()) with check (is_admin());

-- ② 아카이브 강제: is_archived 프로젝트에는 이슈를 새로 만들거나 수정할 수 없다 (읽기 전용).
--    UI(useProjects 필터)에 더해 DB 레벨로도 차단 (사용자 결정, PRD 3.10).
create or replace function fn_block_archived_project_issues()
returns trigger
security definer
set search_path = public
as $$
begin
  if exists (select 1 from projects where id = new.project_id and is_archived) then
    raise exception '아카이브된 프로젝트에서는 이슈를 변경할 수 없습니다';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_issues_block_archived
  before insert or update on issues
  for each row
  execute function fn_block_archived_project_issues();
