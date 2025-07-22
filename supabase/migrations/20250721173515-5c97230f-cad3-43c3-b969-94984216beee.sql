-- Set up manager-employee relationships
-- Ananya's team: Sneha (already done), Rahul, Neha
UPDATE profiles 
SET manager_id = 'd94d5d48-f893-4835-9e70-ec89779f27a3'  -- Ananya's ID
WHERE email IN ('rahul.employee2@elevate.com', 'neha.employee3@elevate.com');

-- Rajiv's team: Karthik, Divya, Arjun  
UPDATE profiles 
SET manager_id = 'dd8114ee-c595-4db8-ad52-eb52056a5ad4'  -- Rajiv's ID
WHERE email IN ('karthik.employee4@elevate.com', 'divya.employee5@elevate.com', 'arjun.employee6@elevate.com');