-- Slate 시드 데이터 (TDD 3.5)

insert into projects (key, name, color)
  values ('DOTOLI', '도토리 프로젝트 (시드)', '#a16207');

-- 라벨 예시
insert into labels (project_id, name, color) values
  ((select id from projects where key = 'DOTOLI'), 'bug', '#ef4444'),
  ((select id from projects where key = 'DOTOLI'), 'frontend', '#3b82f6'),
  ((select id from projects where key = 'DOTOLI'), 'backend', '#10b981');
