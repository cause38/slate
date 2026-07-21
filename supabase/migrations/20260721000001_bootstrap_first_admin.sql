-- 첫 워크스페이스 admin 부트스트랩 (일회성, 멱등)
-- PRD 3.9는 "Admin 지정은 기존 Admin이" 이지만 최초엔 admin이 0명이라 닭-달걀.
-- admin이 하나도 없을 때만 가장 먼저 가입한 사용자를 admin으로 승격한다.
-- 이미 admin이 있으면 no-op → 재실행/재배포에 안전. (사용자 결정: 수동 승격, PRD v1.4)
update public.users
set role = 'admin'
where id = (select id from public.users order by created_at limit 1)
  and not exists (select 1 from public.users where role = 'admin');
