CREATE OR REPLACE FUNCTION public.is_studio_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'alemina0610@gmail.com';
$$;

DROP POLICY IF EXISTS "Owner can read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Owner can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Owner can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Owner can manage blocks" ON public.blocks;

CREATE POLICY "Owner can read bookings" ON public.bookings
  FOR SELECT TO authenticated USING (public.is_studio_owner());
CREATE POLICY "Owner can update bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (public.is_studio_owner()) WITH CHECK (public.is_studio_owner());
CREATE POLICY "Owner can delete bookings" ON public.bookings
  FOR DELETE TO authenticated USING (public.is_studio_owner());
CREATE POLICY "Owner can manage blocks" ON public.blocks
  FOR ALL TO authenticated USING (public.is_studio_owner()) WITH CHECK (public.is_studio_owner());