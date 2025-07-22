-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'employee')),
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Managers can view their team members" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE id = profiles.manager_id
  )
);

-- Create appraisal_sources table
CREATE TABLE public.appraisal_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sheet_url TEXT NOT NULL,
  imported_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appraisal_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for appraisal_sources
CREATE POLICY "Employees can view their own appraisals" 
ON public.appraisal_sources 
FOR SELECT 
USING (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Managers can view their team's appraisals" 
ON public.appraisal_sources 
FOR SELECT 
USING (manager_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Managers can insert appraisals for their team" 
ON public.appraisal_sources 
FOR INSERT 
WITH CHECK (manager_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appraisal_sources_updated_at
BEFORE UPDATE ON public.appraisal_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the existing handle_new_user function to work with our schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'employee')
  );
  RETURN NEW;
END;
$function$;