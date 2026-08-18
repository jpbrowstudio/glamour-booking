import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Calendar as CalIcon, Check, MessageCircle } from "lucide-react";
import { BUSINESS } from "../lib/config";
import {
  type BusySlot,
  type Block,
  buildWhatsappUrl,
  createBooking,
  generateSlots,
  slotsFromHoras,
  isSlotTaken,
  subscribeAvailability,
  subscribeBlocks,
} from "../lib/booking";
import { notifyBookingCreated } from "../lib/email.functions";
import {
  AREA_CODES,
  type HoraDisponible,
  type Servicio,
  type UsuarioAdmin,
  getUsuarioActivo,
  listHoras,
  listServicios,
} from "../lib/catalogo";

const searchSchema = z.object({
  service: z.string().optional(),
});

export const Route = createFileRoute("/reservar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: `Reservar cita — ${BUSINESS.name}` },
      { name: "description", content: "Reserva tu cita en línea. Ve disponibilidad en tiempo real." },
      { property: "og:title", content: `Reservar cita — ${BUSINESS.name}` },
      { property: "og:description", content: "Reserva tu cita en línea." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookingPage,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(base: string, days: number) {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}

const bookingFormSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  phone: z.string().trim().min(6, "Teléfono inválido").max(20),
  areaCode: z.string().trim().min(2, "Selecciona el código de área"),
  email: z.string().trim().email("Correo electrónico inválido").max(255),
  notes: z.string().trim().max(300).optional(),
});

function BookingPage() {
  const { service: serviceFromUrl } = Route.useSearch();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [horas, setHoras] = useState<HoraDisponible[]>([]);
  const [owner, setOwner] = useState<UsuarioAdmin | null>(null);
  const [serviceId, setServiceId] = useState(serviceFromUrl ?? "");
  const [date, setDate] = useState<string>(todayISO());
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState("");
  const [areaCode, setAreaCode] = useState("+52");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<{
    waUrl: string;
    directUrl: string;
    bookingId: string;
    email: string;
  } | null>(null);

  const [busy, setBusy] = useState<BusySlot[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    listServicios(true)
      .then((s) => {
        setServicios(s);
        setServiceId((cur) => cur || String(s[0]?.id_servicio ?? ""));
      })
      .catch(() => undefined);
    listHoras(true).then(setHoras).catch(() => undefined);
    getUsuarioActivo().then(setOwner).catch(() => undefined);
  }, []);

  useEffect(() => subscribeAvailability(date, date, setBusy), [date]);
  useEffect(() => subscribeBlocks(setBlocks), []);

  const service = servicios.find((s) => String(s.id_servicio) === serviceId) ?? servicios[0];

  const durationById = useMemo(
    () => Object.fromEntries(servicios.map((s) => [String(s.id_servicio), s.duracion_min])),
    [servicios],
  );

  const slots = useMemo(() => {
    const fromDb = slotsFromHoras(horas, date);
    return fromDb.length > 0 ? fromDb : generateSlots(date);
  }, [horas, date]);

  const days = useMemo(() => {
    const base = todayISO();
    return Array.from({ length: 14 }, (_, i) => addDaysISO(base, i));
  }, []);

  const submit = async () => {
    setErrors({});
    if (!service) {
      setErrors({ form: "No hay servicios disponibles." });
      return;
    }
    if (!time) {
      setErrors({ time: "Selecciona una hora" });
      return;
    }
    const parsed = bookingFormSchema.safeParse({ name, phone, areaCode, email, notes });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }
    setSubmitting(true);
    const waUrl = buildWhatsappUrl(
      {
        name: parsed.data.name,
        phone: parsed.data.phone,
        areaCode: parsed.data.areaCode,
        email: parsed.data.email,
        serviceName: service.nombre_s,
        date,
        time,
        notes: parsed.data.notes,
      },
      owner?.telefono,
    );
    const directUrl = `${window.location.origin}/reservar?service=${service.id_servicio}`;
    try {
      const ref = await createBooking({
        name: parsed.data.name,
        phone: parsed.data.phone,
        areaCode: parsed.data.areaCode,
        email: parsed.data.email,
        notes: parsed.data.notes,
        serviceId: String(service.id_servicio),
        serviceName: service.nombre_s,
        date,
        time,
      });
      setConfirmed({ waUrl, directUrl, bookingId: ref.id, email: parsed.data.email });
      notifyBookingCreated({ data: { bookingId: ref.id } }).catch((e) =>
        console.error("No se pudo enviar el correo de confirmación", e),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al reservar";
      setErrors({
        form: msg.includes("duplicate")
          ? "Ese horario acaba de ser reservado. Elige otra hora."
          : msg,
      });
      setConfirmed({ waUrl, directUrl, bookingId: "", email: parsed.data.email });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-4 py-16">
          <div className="rounded-3xl border border-border/60 bg-card p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/30">
              <Check className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-serif text-2xl">
              {confirmed.bookingId ? "¡Solicitud enviada!" : "Confirma por WhatsApp"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {confirmed.bookingId
                ? `Tu solicitud quedó registrada a nombre de ${confirmed.email}. ${BUSINESS.name} la revisará y te confirmará la cita.`
                : `No pudimos guardar la cita, pero puedes enviarla directo por WhatsApp a ${BUSINESS.name}.`}
            </p>
            {!confirmed.bookingId && errors.form && (
              <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{errors.form}</p>
            )}
            <a
              href={confirmed.waUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-white shadow-md hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" /> Avisar por WhatsApp
            </a>
            <div className="mt-6 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">Enlace de reserva directa:</p>
              <p className="break-all">{confirmed.directUrl}</p>
              <button
                onClick={() => navigator.clipboard.writeText(confirmed.directUrl)}
                className="mt-2 rounded-full border border-border px-3 py-1 hover:bg-accent/20"
              >
                Copiar enlace
              </button>
            </div>
            <Link to="/" className="mt-6 inline-block text-sm underline">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <span className="font-serif">{BUSINESS.name}</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent">
            <CalIcon className="h-3 w-3" /> Reservar
          </p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl">Elige tu cita</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Disponibilidad sincronizada en tiempo real.
          </p>
        </div>

        {/* Paso 1: servicio */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            1. Servicio
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {servicios.map((s) => (
              <button
                key={s.id_servicio}
                onClick={() => setServiceId(String(s.id_servicio))}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                  String(s.id_servicio) === serviceId
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span>
                  <span className="block font-medium">{s.nombre_s}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.duracion_min} min · ${s.precio_s}
                  </span>
                </span>
                {String(s.id_servicio) === serviceId && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </section>

        {/* Paso 2: fecha */}
        <section className="mt-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            2. Día
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDate(d);
                  setTime("");
                }}
                className={`flex min-w-[80px] shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-sm transition ${
                  date === d
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span className="text-[10px] uppercase opacity-80">
                  {new Date(d + "T00:00:00").toLocaleDateString("es-MX", { weekday: "short" })}
                </span>
                <span className="text-lg font-semibold">{new Date(d + "T00:00:00").getDate()}</span>
                <span className="text-[10px] opacity-80">
                  {new Date(d + "T00:00:00").toLocaleDateString("es-MX", { month: "short" })}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="text-xs text-muted-foreground">O elige una fecha:</label>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
              }}
              className="ml-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>
        </section>

        {/* Paso 3: hora */}
        <section className="mt-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            3. Hora — {formatDateLabel(date)}
          </h2>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin horario disponible este día.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {slots.map((t) => {
                const taken = isSlotTaken(
                  t,
                  service?.duracion_min ?? 60,
                  busy,
                  blocks,
                  date,
                  durationById,
                );
                const selected = time === t;
                return (
                  <button
                    key={t}
                    disabled={taken}
                    onClick={() => setTime(t)}
                    className={`rounded-lg border px-2 py-2 text-sm transition ${
                      taken
                        ? "cursor-not-allowed border-border/40 bg-muted text-muted-foreground line-through"
                        : selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
          {errors.time && <p className="mt-2 text-xs text-destructive">{errors.time}</p>}
        </section>

        {/* Paso 4: datos */}
        <section className="mt-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            4. Tus datos
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Nombre completo *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="María López"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Teléfono / WhatsApp *</label>
              <div className="mt-1 flex gap-2">
                <select
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  className="w-32 rounded-lg border border-border bg-background px-2 py-2 text-sm"
                >
                  {AREA_CODES.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s]/g, ""))}
                  maxLength={20}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="555 000 0000"
                />
              </div>
              {(errors.phone || errors.areaCode) && (
                <p className="mt-1 text-xs text-destructive">{errors.phone || errors.areaCode}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Correo electrónico *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="maria@correo.com"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={300}
                rows={2}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Alergias, referencias, etc."
              />
            </div>
          </div>
          {errors.form && <p className="mt-3 text-sm text-destructive">{errors.form}</p>}

          <p className="mt-4 text-xs text-muted-foreground">
            Al reservar aceptas nuestros{" "}
            <Link to="/terminos" className="underline">Términos</Link> y{" "}
            <Link to="/politica" className="underline">Política de Privacidad</Link>.
          </p>

          <button
            onClick={submit}
            disabled={submitting}
            className="mt-4 w-full rounded-full bg-primary py-3 font-medium text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Enviando…" : "Solicitar reserva"}
          </button>
        </section>
      </div>
    </div>
  );
}
