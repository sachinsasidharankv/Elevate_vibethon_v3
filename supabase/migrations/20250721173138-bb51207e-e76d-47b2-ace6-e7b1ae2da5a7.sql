-- Remove all RLS policies from profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view team members" ON profiles;
DROP POLICY IF EXISTS "Public profile viewing" ON profiles;

-- Disable RLS entirely on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Also remove policies from appraisal_sources and disable RLS temporarily
DROP POLICY IF EXISTS "Employees can view their own appraisals" ON appraisal_sources;
DROP POLICY IF EXISTS "Managers can insert appraisals for their team" ON appraisal_sources;
DROP POLICY IF EXISTS "Managers can view their team's appraisals" ON appraisal_sources;

ALTER TABLE appraisal_sources DISABLE ROW LEVEL SECURITY;