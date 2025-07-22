-- Create IDP table without RLS policies
CREATE TABLE public.idps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appraisal_source UUID NOT NULL REFERENCES public.appraisal_sources(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'initial',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_idps_updated_at
BEFORE UPDATE ON public.idps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();