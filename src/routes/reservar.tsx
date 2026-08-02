import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Calendar as CalIcon, Check, MessageCircle } from "lucide-react";
import { BUSINESS, SERVICES } from "../lib/config";
import {
  type Booking,
  type Block,
  buildWhatsappUrl,
  createBooking,
  generateSlots,
  isSlotTaken,
  subscribeBlocks,
  subscribeBookingsByDate,
} from "../lib/booking";
import { isFirebaseConfigured } from "../lib/firebase";

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
  const d = new Date();
  return d.toISOString().slice(0, 10);
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
  phone: z.string().trim().min(6, "Teléfono inválido").max(30),
  notes: z.string().trim().max(300).optional(),
});

function BookingPage() {
  const { service: serviceFromUrl } = Route.useSearch();
  const [serviceId, setServiceId] = useState(serviceFromUrl || SERVICES[0].id);
  const [date, setDate] = useState<string>(todayISO());
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<{
    waUrl: string;
    directUrl: string;
    bookingId: string;
  } | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Sincronización en tiempo real
  useEffect(() => subscribeBookingsByDate(date, setBookings), [date]);
  useEffect(() => subscribeBlocks(setBlocks), []);

  const service = SERVICES.find((s) => s.id === serviceId) ?? SERVICES[0];
  const slots = useMemo(() => generateSlots(date), [date]);

  // días para el selector rápido (próximos 14)
  const days = useMemo(() => {
    const base = todayISO();
    return Array.from({ length: 14 }, (_, i) => addDaysISO(base, i));
  }, []);

  const submit = async () => {
    setErrors({});
    if (!time) {
      setErrors({ time: "Selecciona una hora" });
      return;
    }
    const parsed = bookingFormSchema.safeParse({ name, phone, notes });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }
    if (!isFirebaseConfigured) {
      setErrors({ form: "Firebase aún no está configurado. Añade tus credenciales en src/lib/firebase.ts." });
      return;
    }
    setSubmitting(true);
    const waUrl = buildWhatsappUrl({
      name: parsed.data.name,
      phone: parsed.data.phone,
      serviceName: service.name,
      date,
      time,
      notes: parsed.data.notes,
    });
    const directUrl = `${window.location.origin}/reservar?service=${service.id}`;
    try {
      const ref = await createBooking({
        name: parsed.data.name,
        phone: parsed.data.phone,
        notes: parsed.data.notes,
        serviceId: service.id,
        serviceName: service.name,
        date,
        time,
      });
      setConfirmed({ waUrl, directUrl, bookingId: ref.id });
    } catch (err) {
      // Aunque falle el guardado, dejamos confirmar por WhatsApp.
      setErrors({ form: err instanceof Error ? err.message : "Error al reservar" });
      setConfirmed({ waUrl, directUrl, bookingId: "" });
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
              {confirmed.bookingId ? "¡Reserva enviada!" : "Confirma por WhatsApp"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {confirmed.bookingId
                ? `Tu cita quedó registrada. Confírmala con ${BUSINESS.name} por WhatsApp para asegurar el horario.`
                : `No pudimos guardar la cita en la agenda, pero puedes enviarla directo por WhatsApp a ${BUSINESS.name}.`}
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
              <MessageCircle className="h-4 w-4" /> Confirmar por WhatsApp
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
            Disponibilidad actualizada en tiempo real.
          </p>
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-6 rounded-2xl border border-amber-400/60 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Firebase no está configurado.</strong> Añade tus credenciales en{" "}
            <code>src/lib/firebase.ts</code> o define las variables <code>VITE_FIREBASE_*</code>.
          </div>
        )}

        {/* Paso 1: servicio */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            1. Servicio
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                  serviceId === s.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span>
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">{s.duration} min · {s.price}</span>
                </span>
                {serviceId === s.id && <Check className="h-4 w-4 text-primary" />}
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
                <span className="text-lg font-semibold">
                  {new Date(d + "T00:00:00").getDate()}
                </span>
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
                const taken = isSlotTaken(t, serviceId, bookings, blocks, date);
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
              <label className="text-xs text-muted-foreground">Nombre completo</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="María López"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Teléfono / WhatsApp</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="+52 555 000 0000"
              />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
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
            {submitting ? "Enviando…" : "Confirmar reserva"}
          </button>
        </section>
      </div>
    </div>
  );
}
