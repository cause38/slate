-- 프로젝트 키 길이 2~5자 → 2~10자 완화
-- 시드 프로젝트 키 DOTOLI(6자)가 기존 제약과 충돌 → 사용자 결정으로 최대 10자 확정 (PRD 3.10 v1.2)
alter table projects drop constraint projects_key_check;
alter table projects add constraint projects_key_check check (key ~ '^[A-Z][A-Z0-9]{1,9}$');
