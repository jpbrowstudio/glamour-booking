CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  service_id text NOT NULL,
  service_name text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_status_check CHECK (status IN ('pending','confirmed','cancelled'))
);

GRANT INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a booking"
  ON public.bookings FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

CREATE POLICY "Owner can read bookings"
  ON public.bookings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner can update bookings"
  ON public.bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Owner can delete bookings"
  ON public.bookings FOR DELETE TO authenticated USING (true);

CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blocks"
  ON public.blocks FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Owner can manage blocks"
  ON public.blocks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE VIEW public.availability
WITH (security_invoker = off) AS
  SELECT id, date, time, service_id, status
  FROM public.bookings
  WHERE status <> 'cancelled';

GRANT SELECT ON public.availability TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;