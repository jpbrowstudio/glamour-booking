DROP VIEW public.availability;

CREATE OR REPLACE FUNCTION public.get_availability(_from date, _to date)
RETURNS TABLE (id uuid, date date, "time" text, service_id text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.date, b.time, b.service_id, b.status
  FROM public.bookings b
  WHERE b.status <> 'cancelled'
    AND b.date >= _from
    AND b.date <= _to;
$$;

REVOKE ALL ON FUNCTION public.get_availability(date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_availability(date, date) TO anon, authenticated, service_role;