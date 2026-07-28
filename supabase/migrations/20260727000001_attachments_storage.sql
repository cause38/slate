-- W4-3 첨부파일: AWS S3 → Supabase Storage 전환
-- (개인 프로젝트 + 로컬 호스팅 미계획으로 S3 채택 명분 소멸 → 이미 쓰는 Supabase로 통합)

-- 1. 컬럼 의미 정정: s3_key → storage_path (버킷 내 객체 경로 저장)
alter table public.attachments rename column s3_key to storage_path;

-- 2. 비공개 버킷 생성 — 서명 URL로만 접근, 파일당 25MB 제한
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 26214400)
on conflict (id) do nothing;

-- 3. storage.objects 정책 (attachments 버킷 한정)
--    attachments 테이블 정책과 대칭: 읽기·업로드는 인증 사용자 전체, 삭제는 업로더 본인 또는 admin
create policy "attachments_objects_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments');

create policy "attachments_objects_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments');

create policy "attachments_objects_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and (owner = auth.uid() or public.is_admin()));
