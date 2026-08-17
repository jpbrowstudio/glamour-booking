CREATE OR REPLACE FUNCTION public.is_studio_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'alemina0610@gmail.com';
$$;