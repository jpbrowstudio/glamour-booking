import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Bell,
  Check,
  Clock,
  Images,
  LayoutGrid,
  ListChecks,
  LogOut,
  MessageCircle,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import workA from "../assets/work-1.jpg";
import workB from "../assets/work-2.jpg";
import workC from "../assets/work-3.jpg";
import workD from "../assets/work-4.jpg";
import heroImg from "../assets/hero.jpg";
import { BUSINESS } from "../lib/config";
import {
  type Booking,
  type Block,
  addBlock,
  buildClientWhatsappUrl,
  generateSlots,
  removeBlock,
  removeBooking,
  rescheduleBooking,
  setBookingReminder,
  slotsFromHoras,
  subscribeAllBookings,
  subscribeBlocks,
  updateBookingStatus,
} from "../lib/booking";
import { notifyBookingStatus } from "../lib/email.functions";
import {
  type HoraDisponible,
  type ImagenCarrusel,
  type Servicio,
  type UsuarioAdmin,
  MAX_IMAGE_BYTES,
  createHora,
  createServicio,
  createUsuario,
  deleteHora,
  deleteImagenCarrusel,
  deleteServicio,
  deleteUsuario,
  listCarrusel,
  listHoras,
  listServicios,
  listUsuarios,
  refreshImagenUrl,
  updateHora,
  updateImagenCarrusel,
  updateServicio,
  updateUsuario,
  uploadImagenCarrusel,
} from "../lib/catalogo";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: `Panel — ${BUSINESS.name}` },
      { name: "description", content: "Panel de organización de citas del studio." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const OWNER_EMAIL = BUSINESS.adminEmail.toLowerCase();

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type Tab = "agenda" | "reservas" | "servicios" | "carrusel" | "config";

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (email.trim().toLowerCase() !== OWNER_EMAIL) {
      setError("Esta cuenta no tiene acceso al panel del studio.");
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (err)
      setError(err.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : err.message);
  };

  if (loading) {
    return (
      <Wrapper>
        <p className="text-center text-sm text-muted-foreground">Cargando…</p>
      </Wrapper>
    );
  }

  if (!session) {
    return (
      <Wrapper>
        <div className="mx-auto max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h1 className="font-serif text-2xl">Panel dueña</h1>
          <p className="mt-1 text-xs text-muted-foreground">Acceso privado al studio.</p>
          <form onSubmit={login} className="mt-5 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button className="w-full rounded-full bg-primary py-2 text-primary-foreground">Entrar</button>
          </form>
        </div>
      </Wrapper>
    );
  }

  if ((session.user.email ?? "").toLowerCase() !== OWNER_EMAIL) {
    return (
      <Wrapper>
        <div className="mx-auto max-w-sm rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm">
          <h1 className="font-serif text-xl">Sin acceso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta cuenta no está autorizada para gestionar el studio.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-4 rounded-full border border-border px-4 py-2 text-xs"
          >
            Cerrar sesión
          </button>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <AdminDashboard email={session.user.email ?? ""} onLogout={() => supabase.auth.signOut()} />
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> Sitio público
          </Link>
          <span className="font-serif">{BUSINESS.name} · Admin</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

function AdminDashboard({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("agenda");

  const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutGrid }> = [
    { id: "agenda", label: "Agenda", icon: LayoutGrid },
    { id: "reservas", label: "Reservas", icon: ListChecks },
    { id: "servicios", label: "Servicios", icon: Check },
    { id: "carrusel", label: "Carrusel", icon: Images },
    { id: "config", label: "Configuración", icon: Settings },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl">Hola, {email}</h1>
          <p className="text-xs text-muted-foreground">Gestiona agenda, servicios, carrusel y usuarios.</p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border/60 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "agenda" && <AgendaTab />}
      {tab === "reservas" && <ReservasTab />}
      {tab === "servicios" && <ServiciosTab />}
      {tab === "carrusel" && <CarruselTab />}
      {tab === "config" && <ConfigTab />}
    </div>
  );
}

/* ---------------- AGENDA ---------------- */

function AgendaTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [horas, setHoras] = useState<HoraDisponible[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());

  useEffect(() => subscribeAllBookings(setBookings), []);
  useEffect(() => subscribeBlocks(setBlocks), []);
  useEffect(() => {
    listHoras(true).then(setHoras).catch(() => undefined);
  }, []);

  const dayBookings = bookings.filter((b) => b.date === selectedDate);
  const dayBlocks = blocks.filter((b) => b.date === selectedDate);
  const fromDb = slotsFromHoras(horas, selectedDate);
  const slots = fromDb.length > 0 ? fromDb : generateSlots(selectedDate);

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h2 className="mb-3 font-serif text-lg">Disponibilidad</h2>
      <label className="text-xs text-muted-foreground">Fecha</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="ml-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
      />

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-medium">Bloquear día completo</p>
        {dayBlocks.some((b) => !b.time) ? (
          <button
            onClick={() => {
              const id = dayBlocks.find((b) => !b.time)?.id;
              if (id) removeBlock(id);
            }}
            className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
          >
            Desbloquear día
          </button>
        ) : (
          <button
            onClick={() => addBlock(selectedDate)}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
          >
            <Ban className="h-3 w-3" /> Bloquear todo el día
          </button>
        )}
      </div>

      <p className="mt-4 mb-2 text-sm font-medium">Horas del día</p>
      {slots.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin horas configuradas para este día.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {slots.map((t) => {
            const blocked = dayBlocks.find((b) => b.time === t);
            const booked = dayBookings.find((b) => b.time === t && b.status !== "cancelled");
            return (
              <button
                key={t}
                onClick={() => {
                  if (booked) return;
                  if (blocked) removeBlock(blocked.id);
                  else addBlock(selectedDate, t);
                }}
                className={`rounded-lg border px-2 py-2 text-xs transition ${
                  booked
                    ? "cursor-not-allowed border-primary/60 bg-primary/10 text-primary"
                    : blocked
                      ? "border-destructive/60 bg-destructive/10 text-destructive line-through"
                      : "border-border hover:bg-muted"
                }`}
                title={booked ? `Reservado: ${booked.name}` : blocked ? "Bloqueado" : "Disponible"}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------------- RESERVAS ---------------- */

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function ReservasTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [anio, setAnio] = useState<string>(String(new Date().getFullYear()));
  const [mes, setMes] = useState<string>("");
  const [dia, setDia] = useState<string>("");
  const [estado, setEstado] = useState<string>("");

  useEffect(() => subscribeAllBookings(setBookings), []);

  const anios = Array.from(new Set(bookings.map((b) => b.date.slice(0, 4)))).sort();

  const filtered = bookings.filter((b) => {
    const [y, m, d] = b.date.split("-");
    if (anio && y !== anio) return false;
    if (mes && String(Number(m)) !== mes) return false;
    if (dia && String(Number(d)) !== dia) return false;
    if (estado && b.status !== estado) return false;
    return true;
  });

  const avisarPorCorreo = (
    b: Booking,
    kind: "confirmada" | "cancelada" | "reprogramada" | "recordatorio",
  ) => {
    if (!b.email) return;
    notifyBookingStatus({ data: { bookingId: b.id, kind } }).catch((e: unknown) =>
      console.error("No se pudo enviar el correo", e),
    );
  };

  const cambiarEstado = async (
    b: Booking,
    status: "confirmed" | "cancelled" | "realizada",
  ) => {
    await updateBookingStatus(b.id, status);
    if (status === "confirmed") avisarPorCorreo(b, "confirmada");
    if (status === "cancelled") avisarPorCorreo(b, "cancelada");
  };

  const reprogramar = async (b: Booking) => {
    const nuevaFecha = prompt("Nueva fecha (AAAA-MM-DD):", b.date);
    if (!nuevaFecha) return;
    const nuevaHora = prompt("Nueva hora (HH:mm):", b.time);
    if (!nuevaHora) return;
    try {
      await rescheduleBooking(b.id, nuevaFecha, nuevaHora);
      avisarPorCorreo({ ...b, date: nuevaFecha, time: nuevaHora }, "reprogramada");
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo reprogramar");
    }
  };

  const recordatorio = async (b: Booking) => {
    const valor = prompt(
      "Recordatorio (AAAA-MM-DDTHH:mm). Deja vacío para quitarlo:",
      b.reminderAt ? b.reminderAt.slice(0, 16) : `${b.date}T09:00`,
    );
    if (valor === null) return;
    await setBookingReminder(b.id, valor ? new Date(valor).toISOString() : null);
    if (valor) avisarPorCorreo(b, "recordatorio");
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h2 className="mb-4 font-serif text-lg">Reservas ({filtered.length})</h2>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <select value={anio} onChange={(e) => setAnio(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5">
          <option value="">Todos los años</option>
          {anios.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5">
          <option value="">Todos los meses</option>
          {MESES.map((m, i) => (
            <option key={m} value={String(i + 1)}>{m}</option>
          ))}
        </select>
        <select value={dia} onChange={(e) => setDia(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5">
          <option value="">Todos los días</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={String(d)}>{d}</option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5">
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Aceptadas</option>
          <option value="reprogramada">Reprogramadas</option>
          <option value="realizada">Realizadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay reservas con estos filtros.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((b) => (
            <li key={b.id} className="rounded-xl border border-border/60 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {b.name} · <span className="text-muted-foreground">{b.serviceName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.date} · {b.time} · {b.areaCode} {b.phone} · {b.email || "sin correo"}
                  </p>
                  {b.notes && <p className="mt-1 text-xs italic">"{b.notes}"</p>}
                  {b.reminderAt && (
                    <p className="mt-1 text-xs text-accent">
                      Recordatorio: {new Date(b.reminderAt).toLocaleString("es-MX")}
                    </p>
                  )}
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <a
                  href={buildClientWhatsappUrl(b, "aceptada")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1 text-xs text-white"
                >
                  <MessageCircle className="h-3 w-3" /> WhatsApp cliente
                </a>
                {b.status !== "confirmed" && (
                  <button
                    onClick={() => cambiarEstado(b, "confirmed")}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                  >
                    <Check className="h-3 w-3" /> Aceptar
                  </button>
                )}
                <button
                  onClick={() => reprogramar(b)}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                >
                  <Clock className="h-3 w-3" /> Reprogramar
                </button>
                {b.status !== "realizada" && (
                  <button
                    onClick={() => cambiarEstado(b, "realizada")}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                  >
                    <ListChecks className="h-3 w-3" /> Realizada
                  </button>
                )}
                <button
                  onClick={() => recordatorio(b)}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                >
                  <Bell className="h-3 w-3" /> Recordatorio
                </button>
                {b.status !== "cancelled" && (
                  <button
                    onClick={() => cambiarEstado(b, "cancelled")}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                  >
                    <X className="h-3 w-3" /> Cancelar
                  </button>
                )}
                <button
                  onClick={() => confirm("¿Eliminar reserva?") && removeBooking(b.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-destructive hover:bg-muted"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- SERVICIOS ---------------- */

const servicioVacio = {
  nombre_s: "",
  detalle_s: "",
  precio_s: 0,
  duracion_min: 60,
  orden: 0,
  activo: true,
};

function ServiciosTab() {
  const [items, setItems] = useState<Servicio[]>([]);
  const [form, setForm] = useState({ ...servicioVacio });
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () => listServicios().then(setItems).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const guardar = async () => {
    setError("");
    if (form.nombre_s.trim().length < 2) {
      setError("El nombre del servicio es obligatorio.");
      return;
    }
    try {
      if (editId) await updateServicio(editId, form);
      else await createServicio(form);
      setForm({ ...servicioVacio });
      setEditId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-serif text-lg">{editId ? "Editar servicio" : "Nuevo servicio"}</h2>
        <div className="space-y-3 text-sm">
          <Field label="Nombre (nombreS)">
            <input value={form.nombre_s} onChange={(e) => setForm({ ...form, nombre_s: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Detalle (DetalleS)">
            <textarea rows={3} value={form.detalle_s} onChange={(e) => setForm({ ...form, detalle_s: e.target.value })} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio (PrecioS)">
              <input type="number" step="0.01" value={form.precio_s} onChange={(e) => setForm({ ...form, precio_s: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Duración (min)">
              <input type="number" value={form.duracion_min} onChange={(e) => setForm({ ...form, duracion_min: Number(e.target.value) })} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Orden">
              <input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} className={inputCls} />
            </Field>
            <label className="mt-6 inline-flex items-center gap-2">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
              Activo
            </label>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} className="rounded-full bg-primary px-4 py-2 text-xs text-primary-foreground">
              {editId ? "Actualizar" : "Insertar"}
            </button>
            {editId && (
              <button
                onClick={() => {
                  setEditId(null);
                  setForm({ ...servicioVacio });
                }}
                className="rounded-full border border-border px-4 py-2 text-xs"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-serif text-lg">Servicios ({items.length})</h2>
        <ul className="space-y-2 text-sm">
          {items.map((s) => (
            <li key={s.id_servicio} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3">
              <div>
                <p className="font-medium">
                  #{s.id_servicio} · {s.nombre_s} {!s.activo && <span className="text-xs text-muted-foreground">(inactivo)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{s.detalle_s}</p>
                <p className="text-xs">${s.precio_s} · {s.duracion_min} min</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => {
                    setEditId(s.id_servicio);
                    setForm({
                      nombre_s: s.nombre_s,
                      detalle_s: s.detalle_s,
                      precio_s: s.precio_s,
                      duracion_min: s.duracion_min,
                      orden: s.orden,
                      activo: s.activo,
                    });
                  }}
                  className="rounded-full border border-border px-3 py-1 text-xs"
                >
                  Editar
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`¿Eliminar "${s.nombre_s}"?`)) return;
                    await deleteServicio(s.id_servicio);
                    load();
                  }}
                  className="rounded-full border border-border px-3 py-1 text-xs text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- CARRUSEL ---------------- */

const IMAGENES_ACTUALES = [
  { src: workA, titulo: "Ceja laminada y perfilada" },
  { src: workB, titulo: "Pestañas con lifting y volumen" },
  { src: workC, titulo: "Cabina del studio de cuidados" },
  { src: workD, titulo: "Herramientas de cejas y pestañas" },
  { src: heroImg, titulo: "Diseño de cejas a medida" },
];

function CarruselTab() {
  const [items, setItems] = useState<ImagenCarrusel[]>([]);
  const [titulo, setTitulo] = useState("");
  const [orden, setOrden] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<number | null>(null);

  const load = () => {
    setCargando(true);
    return listCarrusel()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  };
  useEffect(() => {
    load();
  }, []);

  const subir = async () => {
    setError("");
    setAviso("");
    if (files.length === 0) {
      setError("Selecciona al menos una imagen.");
      return;
    }
    setSubiendo(true);
    try {
      let i = 0;
      for (const f of files) {
        await uploadImagenCarrusel(f, titulo || f.name.replace(/\.[^.]+$/, ""), orden + i);
        i += 1;
      }
      setTitulo("");
      setOrden(0);
      setFiles([]);
      setAviso(`${i} imagen(es) agregada(s).`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setSubiendo(false);
    }
  };

  const importarActuales = async () => {
    setError("");
    setAviso("");
    setSubiendo(true);
    try {
      let i = items.length;
      for (const img of IMAGENES_ACTUALES) {
        const res = await fetch(img.src);
        const blob = await res.blob();
        const file = new File([blob], `${img.titulo}.jpg`, { type: blob.type || "image/jpeg" });
        await uploadImagenCarrusel(file, img.titulo, i);
        i += 1;
      }
      setAviso("Imágenes actuales de la página cargadas al carrusel.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-serif text-lg">Nueva imagen</h2>
        <div className="space-y-3 text-sm">
          <Field label="Título / descripción">
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Orden">
            <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Imágenes (máx. 5 MB c/u)">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                const grandes = list.filter((f) => f.size > MAX_IMAGE_BYTES);
                if (grandes.length > 0) {
                  setError(`Hay ${grandes.length} imagen(es) de más de 5 MB. Quítalas para continuar.`);
                  setFiles([]);
                  return;
                }
                setError("");
                setFiles(list);
              }}
              className="w-full text-xs"
            />
          </Field>
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f) => (
                <img
                  key={f.name + f.size}
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          {aviso && <p className="text-xs text-accent">{aviso}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={subir}
              disabled={subiendo}
              className="rounded-full bg-primary px-4 py-2 text-xs text-primary-foreground disabled:opacity-50"
            >
              {subiendo ? "Subiendo…" : "Insertar imagen"}
            </button>
            <button
              onClick={importarActuales}
              disabled={subiendo}
              className="rounded-full border border-border px-4 py-2 text-xs disabled:opacity-50"
            >
              Cargar imágenes actuales
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            «Cargar imágenes actuales» sube al carrusel las fotos que hoy se ven en la página para que puedas
            editarlas o eliminarlas.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg">Carrusel del portafolio ({items.length})</h2>
          <button onClick={load} className="rounded-full border border-border px-3 py-1 text-xs">
            Recargar
          </button>
        </div>
        {cargando && <p className="text-xs text-muted-foreground">Cargando imágenes…</p>}
        {!cargando && items.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Aún no hay imágenes en el carrusel. Sube nuevas o usa «Cargar imágenes actuales».
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((img) => (
            <div key={img.id_imagen} className="rounded-xl border border-border/60 p-3">
              <img
                src={img.imagen_url}
                alt={img.titulo}
                className="mb-2 aspect-video w-full rounded-lg bg-muted object-cover"
                onError={() => {
                  refreshImagenUrl(img)
                    .then((url) =>
                      setItems((cur) =>
                        cur.map((i) => (i.id_imagen === img.id_imagen ? { ...i, imagen_url: url } : i)),
                      ),
                    )
                    .catch(() => undefined);
                }}
              />
              <input
                value={img.titulo}
                onChange={(e) =>
                  setItems((cur) =>
                    cur.map((i) => (i.id_imagen === img.id_imagen ? { ...i, titulo: e.target.value } : i)),
                  )
                }
                className={inputCls}
              />
              <div className="mt-2 flex items-center gap-2 text-xs">
                <label className="inline-flex items-center gap-1">
                  Orden
                  <input
                    type="number"
                    value={img.orden}
                    onChange={(e) =>
                      setItems((cur) =>
                        cur.map((i) =>
                          i.id_imagen === img.id_imagen ? { ...i, orden: Number(e.target.value) } : i,
                        ),
                      )
                    }
                    className="w-16 rounded border border-border bg-background px-2 py-1"
                  />
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={img.activo}
                    onChange={(e) =>
                      setItems((cur) =>
                        cur.map((i) =>
                          i.id_imagen === img.id_imagen ? { ...i, activo: e.target.checked } : i,
                        ),
                      )
                    }
                  />
                  Activa
                </label>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={async () => {
                    await updateImagenCarrusel(img.id_imagen, {
                      titulo: img.titulo,
                      orden: img.orden,
                      activo: img.activo,
                    });
                    load();
                  }}
                  className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
                >
                  Actualizar
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("¿Eliminar imagen?")) return;
                    await deleteImagenCarrusel(img);
                    load();
                  }}
                  className="rounded-full border border-border px-3 py-1 text-xs text-destructive"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CONFIGURACIÓN ---------------- */

const usuarioVacio = {
  nombre: "",
  telefono: "",
  correo: "",
  msn_whatsapp: "Hola! Quiero información sobre los servicios del studio.",
  activo: false,
};

function ConfigTab() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [form, setForm] = useState({ ...usuarioVacio });
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [horas, setHoras] = useState<HoraDisponible[]>([]);
  const [nuevaHora, setNuevaHora] = useState("10:00");
  const [diaSemana, setDiaSemana] = useState<string>("");

  const loadU = () => listUsuarios().then(setUsuarios).catch((e) => setError(e.message));
  const loadH = () => listHoras().then(setHoras).catch(() => undefined);
  useEffect(() => {
    loadU();
    loadH();
  }, []);

  const guardar = async () => {
    setError("");
    if (!form.nombre.trim() || !form.telefono.trim() || !form.correo.trim()) {
      setError("Nombre, teléfono y correo son obligatorios.");
      return;
    }
    try {
      if (editId) await updateUsuario(editId, form);
      else await createUsuario(form);
      setForm({ ...usuarioVacio });
      setEditId(null);
      loadU();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-serif text-lg">{editId ? "Editar usuario" : "Nuevo usuario admin"}</h2>
          <div className="space-y-3 text-sm">
            <Field label="Nombre">
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Teléfono (con código, solo números)">
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value.replace(/[^0-9]/g, "") })}
                placeholder="52613128937"
                className={inputCls}
              />
            </Field>
            <Field label="Correo">
              <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Mensaje del globo de WhatsApp (msn_whatsapp)">
              <textarea rows={3} value={form.msn_whatsapp} onChange={(e) => setForm({ ...form, msn_whatsapp: e.target.value })} className={inputCls} />
            </Field>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
              Perfil activo (recibe las solicitudes)
            </label>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button onClick={guardar} className="rounded-full bg-primary px-4 py-2 text-xs text-primary-foreground">
                {editId ? "Actualizar" : "Insertar"}
              </button>
              {editId && (
                <button
                  onClick={() => {
                    setEditId(null);
                    setForm({ ...usuarioVacio });
                  }}
                  className="rounded-full border border-border px-4 py-2 text-xs"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-serif text-lg">Usuarios administradores ({usuarios.length})</h2>
          <ul className="space-y-2 text-sm">
            {usuarios.map((u) => (
              <li key={u.id_usuario} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3">
                <div>
                  <p className="font-medium">
                    #{u.id_usuario} · {u.nombre}{" "}
                    {u.activo && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">Activo</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{u.telefono} · {u.correo}</p>
                  <p className="mt-1 text-xs italic">"{u.msn_whatsapp}"</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    onClick={() => {
                      setEditId(u.id_usuario);
                      setForm({
                        nombre: u.nombre,
                        telefono: u.telefono,
                        correo: u.correo,
                        msn_whatsapp: u.msn_whatsapp,
                        activo: u.activo,
                      });
                    }}
                    className="rounded-full border border-border px-3 py-1 text-xs"
                  >
                    Editar
                  </button>
                  {!u.activo && (
                    <button
                      onClick={async () => {
                        await updateUsuario(u.id_usuario, { activo: true });
                        loadU();
                      }}
                      className="rounded-full border border-border px-3 py-1 text-xs"
                    >
                      Activar
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!confirm("¿Eliminar usuario?")) return;
                      await deleteUsuario(u.id_usuario);
                      loadU();
                    }}
                    className="rounded-full border border-border px-3 py-1 text-xs text-destructive"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-serif text-lg">Horas disponibles ({horas.length})</h2>
        <div className="mb-4 flex flex-wrap items-end gap-2 text-sm">
          <Field label="Hora">
            <input type="time" value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Día de la semana">
            <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} className={inputCls}>
              <option value="">Todos los días</option>
              {["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((d, i) => (
                <option key={d} value={String(i)}>{d}</option>
              ))}
            </select>
          </Field>
          <button
            onClick={async () => {
              await createHora(nuevaHora, diaSemana === "" ? null : Number(diaSemana));
              loadH();
            }}
            className="rounded-full bg-primary px-4 py-2 text-xs text-primary-foreground"
          >
            Insertar hora
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {horas.map((h) => (
            <div key={h.id_hora} className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
              <span className={h.activo ? "" : "line-through opacity-60"}>
                {h.hora}
                {h.dia_semana !== null && ` · d${h.dia_semana}`}
              </span>
              <button
                onClick={async () => {
                  await updateHora(h.id_hora, { activo: !h.activo });
                  loadH();
                }}
                className="underline"
              >
                {h.activo ? "Desactivar" : "Activar"}
              </button>
              <button
                onClick={async () => {
                  await deleteHora(h.id_hora);
                  loadH();
                }}
                className="text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const map: Record<Booking["status"], { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-800" },
    confirmed: { label: "Aceptada", cls: "bg-emerald-100 text-emerald-800" },
    cancelled: { label: "Cancelada", cls: "bg-red-100 text-red-800" },
    reprogramada: { label: "Reprogramada", cls: "bg-sky-100 text-sky-800" },
    realizada: { label: "Realizada", cls: "bg-violet-100 text-violet-800" },
  };
  const s = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${s.cls}`}>{s.label}</span>;
}
