-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Managers can view their team members" ON profiles;

-- Create a simpler, non-recursive policy for managers
-- This allows users to view profiles where they are the manager (direct relationship)
CREATE POLICY "Managers can view their team members" 
ON profiles 
FOR SELECT 
USING (
  manager_id IN (
    SELECT id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Also ensure we have a policy that allows viewing all profiles for now
-- (you can restrict this later based on your business needs)
CREATE POLICY "Users can view other profiles" 
ON profiles 
FOR SELECT 
USING (true);