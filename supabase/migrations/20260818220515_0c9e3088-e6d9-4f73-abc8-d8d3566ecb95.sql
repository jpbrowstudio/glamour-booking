-- SERVICIOS
CREATE TABLE public.servicios (
  id_servicio bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_s text NOT NULL,
  detalle_s text NOT NULL DEFAULT '',
  precio_s numeric(10,2) NOT NULL DEFAULT 0,
  duracion_min integer NOT NULL DEFAULT 60,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.servicios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicios TO authenticated;
GRANT ALL ON public.servicios TO service_role;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Servicios visibles para todos" ON public.servicios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Duena gestiona servicios" ON public.servicios FOR ALL TO authenticated USING (public.is_studio_owner()) WITH CHECK (public.is_studio_owner());

-- CARRUSEL
CREATE TABLE public.carrusel (
  id_imagen bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo text NOT NULL DEFAULT '',
  imagen_url text NOT NULL,
  storage_path text,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.carrusel TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carrusel TO authenticated;
GRANT ALL ON public.carrusel TO service_role;
ALTER TABLE public.carrusel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Carrusel visible para todos" ON public.carrusel FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Duena gestiona carrusel" ON public.carrusel FOR ALL TO authenticated USING (public.is_studio_owner()) WITH CHECK (public.is_studio_owner());

-- USUARIOS ADMINISTRADORES
CREATE TABLE public.usuarios (
  id_usuario bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  telefono text NOT NULL,
  correo text NOT NULL,
  msn_whatsapp text NOT NULL DEFAULT 'Hola! Quiero informacion sobre los servicios del studio.',
  activo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX usuarios_un_solo_activo ON public.usuarios (activo) WHERE activo;
GRANT SELECT ON public.usuarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
-- el sitio publico solo necesita el perfil activo (telefono + mensaje del globo de WhatsApp)
CREATE POLICY "Perfil activo visible" ON public.usuarios FOR SELECT TO anon USING (activo);
CREATE POLICY "Duena lee usuarios" ON public.usuarios FOR SELECT TO authenticated USING (public.is_studio_owner() OR activo);
CREATE POLICY "Duena gestiona usuarios" ON public.usuarios FOR ALL TO authenticated USING (public.is_studio_owner()) WITH CHECK (public.is_studio_owner());

-- HORAS DISPONIBLES
CREATE TABLE public.horas_disponibles (
  id_hora bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hora text NOT NULL,
  dia_semana integer,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.horas_disponibles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.horas_disponibles TO authenticated;
GRANT ALL ON public.horas_disponibles TO service_role;
ALTER TABLE public.horas_disponibles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Horas visibles para todos" ON public.horas_disponibles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Duena gestiona horas" ON public.horas_disponibles FOR ALL TO authenticated USING (public.is_studio_owner()) WITH CHECK (public.is_studio_owner());

-- RESERVAS (amplia bookings)
ALTER TABLE public.bookings
  ADD COLUMN email text NOT NULL DEFAULT '',
  ADD COLUMN area_code text NOT NULL DEFAULT '+52',
  ADD COLUMN reminder_at timestamptz,
  ADD COLUMN anio integer GENERATED ALWAYS AS (EXTRACT(YEAR FROM date)::int) STORED,
  ADD COLUMN mes integer GENERATED ALWAYS AS (EXTRACT(MONTH FROM date)::int) STORED,
  ADD COLUMN dia integer GENERATED ALWAYS AS (EXTRACT(DAY FROM date)::int) STORED;

-- no dos reservas activas a la misma hora del mismo dia
CREATE UNIQUE INDEX bookings_slot_unico ON public.bookings (date, time) WHERE status <> 'cancelled';

-- estados permitidos
CREATE OR REPLACE FUNCTION public.validar_reserva()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending','confirmed','cancelled','reprogramada','realizada') THEN
    RAISE EXCEPTION 'Estado de reserva no valido: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bookings_validar BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validar_reserva();

-- updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER servicios_updated BEFORE UPDATE ON public.servicios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER carrusel_updated BEFORE UPDATE ON public.carrusel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER usuarios_updated BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER horas_updated BEFORE UPDATE ON public.horas_disponibles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DATOS INICIALES
INSERT INTO public.servicios (nombre_s, detalle_s, precio_s, duracion_min, orden) VALUES
 ('Diseño de cejas','Visagismo, depilación con hilo o cera y perfilado a medida.',250,45,1),
 ('Laminado de cejas','Alisado y fijación del vello para una ceja llena y peinada.',650,60,2),
 ('Henna / tinte de cejas','Color natural que define y rellena zonas sin vello.',350,45,3),
 ('Lifting de pestañas','Curvatura y elevación con nutrición y tinte incluido.',700,60,4),
 ('Extensiones de pestañas','Pelo a pelo, híbridas o volumen ruso según tu estilo.',900,120,5),
 ('Ritual de mirada completo','Laminado + henna + lifting: el cuidado integral del studio.',1400,150,6);

INSERT INTO public.usuarios (nombre, telefono, correo, msn_whatsapp, activo) VALUES
 ('Ale Mina','52613128937','alemina0610@gmail.com','Hola! Quiero información sobre los servicios de JP Brows Studio.', true);

INSERT INTO public.horas_disponibles (hora) SELECT h FROM (VALUES ('09:00'),('09:30'),('10:00'),('10:30'),('11:00'),('11:30'),('12:00'),('12:30'),('13:00'),('13:30'),('14:00'),('14:30'),('15:00'),('15:30'),('16:00'),('16:30'),('17:00'),('17:30'),('18:00'),('18:30')) AS t(h);