-- Delete the remaining broken manually-created demo users
DELETE FROM public.subscriptions WHERE user_id IN (
  '3b6cf7d4-762a-4f4c-9294-df2fb2022632',
  '3de9a67f-1193-468b-b17a-e8d21a145d0f',
  'c8cd52af-387a-4924-85e9-7354ba1a9ecd'
);

DELETE FROM public.candidate_profiles WHERE user_id = '3b6cf7d4-762a-4f4c-9294-df2fb2022632';

DELETE FROM public.users WHERE id IN (
  '3b6cf7d4-762a-4f4c-9294-df2fb2022632',
  '3de9a67f-1193-468b-b17a-e8d21a145d0f',
  'c8cd52af-387a-4924-85e9-7354ba1a9ecd'
);

DELETE FROM auth.identities WHERE user_id IN (
  '3b6cf7d4-762a-4f4c-9294-df2fb2022632',
  '3de9a67f-1193-468b-b17a-e8d21a145d0f',
  'c8cd52af-387a-4924-85e9-7354ba1a9ecd'
);

DELETE FROM auth.users WHERE id IN (
  '3b6cf7d4-762a-4f4c-9294-df2fb2022632',
  '3de9a67f-1193-468b-b17a-e8d21a145d0f',
  'c8cd52af-387a-4924-85e9-7354ba1a9ecd'
);
