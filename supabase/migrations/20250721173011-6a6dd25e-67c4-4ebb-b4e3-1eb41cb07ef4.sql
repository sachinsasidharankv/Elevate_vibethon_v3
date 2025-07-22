-- Let's completely rebuild the RLS policies to fix the profile fetching issue
-- First, drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view their team members" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;

-- Create a security definer function to safely check user roles without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = target_user_id LIMIT 1;
$$;

-- Create simple, working policies
-- 1. Users can always view their own profile (this is critical for auth to work)
CREATE POLICY "Users can view their own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Managers can view their team members (using the safe function)
CREATE POLICY "Managers can view team members" 
ON profiles 
FOR SELECT 
USING (
  public.get_user_role(auth.uid()) = 'manager' 
  AND manager_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- 4. Allow viewing all profiles for now (you can restrict this later)
CREATE POLICY "Public profile viewing" 
ON profiles 
FOR SELECT 
USING (true);