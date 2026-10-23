-- Delete broken manually-created demo users so they can be recreated via the admin API
-- The 500 "Database error querying schema" is caused by GoTrue's internal schema
-- expectations not matching the manually-inserted rows.

-- Clean up related data first
DELETE FROM public.subscriptions WHERE user_id IN (
  '2a3e5867-ec18-4ebf-ad8e-2f3d61f5ab8d',
  'f9157be5-fd65-4d43-a16e-90ac9c039e0a',
  'b42aeeb5-168d-4710-99e3-9fb36bb2f7dc'
);

DELETE FROM public.candidate_profiles WHERE user_id = '2a3e5867-ec18-4ebf-ad8e-2f3d61f5ab8d';

DELETE FROM public.users WHERE id IN (
  '2a3e5867-ec18-4ebf-ad8e-2f3d61f5ab8d',
  'f9157be5-fd65-4d43-a16e-90ac9c039e0a',
  'b42aeeb5-168d-4710-99e3-9fb36bb2f7dc'
);

-- Delete from auth.identities first (FK constraint)
DELETE FROM auth.identities WHERE user_id IN (
  '2a3e5867-ec18-4ebf-ad8e-2f3d61f5ab8d',
  'f9157be5-fd65-4d43-a16e-90ac9c039e0a',
  'b42aeeb5-168d-4710-99e3-9fb36bb2f7dc'
);

-- Delete the auth users
DELETE FROM auth.users WHERE id IN (
  '2a3e5867-ec18-4ebf-ad8e-2f3d61f5ab8d',
  'f9157be5-fd65-4d43-a16e-90ac9c039e0a',
  'b42aeeb5-168d-4710-99e3-9fb36bb2f7dc'
);
