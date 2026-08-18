import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, MessageCircle, Trash2, Check, X, Ban } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS } from "../lib/config";
import {
  type Booking,
  type Block,
  addBlock,
  buildWhatsappUrl,
  generateSlots,
  removeBlock,
  removeBooking,
  subscribeAllBookings,
  subscribeBlocks,
  updateBookingStatus,
} from "../lib/booking";

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
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (err) setError(err.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : err.message);
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
          <p className="mt-1 text-xs text-muted-foreground">Acceso privado al calendario del studio.</p>
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
            <p className="text-center text-[11px] text-muted-foreground">
              Acceso reservado a la dueña del studio.
            </p>
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
            Esta cuenta no está autorizada para gestionar la agenda del studio.
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> Sitio público
          </Link>
          <span className="font-serif">{BUSINESS.name} · Admin</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

function AdminDashboard({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());

  useEffect(() => subscribeAllBookings(setBookings), []);
  useEffect(() => subscribeBlocks(setBlocks), []);

  const dayBookings = bookings
    .filter((b) => b.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcoming = bookings
    .filter((b) => b.date >= todayISO() && b.status !== "cancelled")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const dayBlocks = blocks.filter((b) => b.date === selectedDate);
  const slots = generateSlots(selectedDate);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl">Hola, {email}</h1>
          <p className="text-xs text-muted-foreground">
            Reservas y bloqueos sincronizados en tiempo real; confirma por WhatsApp.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximas */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-serif text-lg">Próximas reservas ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay reservas próximas.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.slice(0, 10).map((b) => (
                <li key={b.id} className="rounded-xl border border-border/60 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{b.name} · <span className="text-muted-foreground">{b.serviceName}</span></p>
                      <p className="text-xs text-muted-foreground">
                        {b.date} · {b.time} · {b.phone}
                      </p>
                      {b.notes && <p className="mt-1 text-xs italic">"{b.notes}"</p>}
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <a
                      href={buildWhatsappUrl(b)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1 text-xs text-white"
                    >
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                    {b.status !== "confirmed" && (
                      <button
                        onClick={() => updateBookingStatus(b.id, "confirmed")}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                      >
                        <Check className="h-3 w-3" /> Confirmar
                      </button>
                    )}
                    {b.status !== "cancelled" && (
                      <button
                        onClick={() => updateBookingStatus(b.id, "cancelled")}
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

        {/* Disponibilidad */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-serif text-lg">Disponibilidad</h2>
          <label className="text-xs text-muted-foreground">Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="ml-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          />

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
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
              <p className="text-xs text-muted-foreground">Cerrado (según horario semanal).</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
            <p className="mt-3 text-xs text-muted-foreground">
              Toca una hora para bloquear/desbloquear. Las reservas activas aparecen resaltadas.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const map = {
    pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-800" },
    confirmed: { label: "Confirmada", cls: "bg-emerald-100 text-emerald-800" },
    cancelled: { label: "Cancelada", cls: "bg-red-100 text-red-800" },
  } as const;
  const s = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${s.cls}`}>{s.label}</span>;
}
