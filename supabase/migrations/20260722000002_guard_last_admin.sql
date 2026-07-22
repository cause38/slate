-- W2-6 리뷰 P2: "활성 admin 최소 1명" 불변식을 DB로 강제
-- UI(UserManager)에만 있던 마지막-admin 보호를 트리거로 보강.
-- admin이 직접 REST로 자기 자신(또는 마지막 admin)을 강등·비활성화해
-- 워크스페이스가 admin 0명으로 잠기는(복구 불가) 상황을 차단한다.
create or replace function fn_guard_last_admin()
returns trigger
security definer
set search_path = public
as $$
begin
  -- 활성 admin이 member로 강등되거나 비활성화되는 경우
  if old.role = 'admin' and old.is_active
     and (new.role is distinct from 'admin' or not new.is_active) then
    if (select count(*) from users where role = 'admin' and is_active) <= 1 then
      raise exception '마지막 활성 Admin은 강등·비활성화할 수 없습니다';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_users_guard_last_admin
  before update on users
  for each row
  execute function fn_guard_last_admin();
