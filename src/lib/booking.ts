import { supabase } from "@/integrations/supabase/client";
import { BUSINESS, SLOT_MINUTES, WEEKLY_HOURS, SERVICES } from "./config";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "reprogramada"
  | "realizada";

export interface Booking {
  id: string;
  name: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  email: string;
  areaCode: string;
  status: BookingStatus;
  reminderAt?: string | null;
  createdAt?: string;
}

/** Cita ocupada sin datos personales (disponibilidad pública). */
export interface BusySlot {
  id: string;
  date: string;
  time: string;
  serviceId: string;
  status: BookingStatus;
}

export interface Block {
  id: string;
  date: string;
  time?: string; // vacío = día completo bloqueado
}

type BookingRow = {
  id: string;
  name: string;
  phone: string;
  service_id: string;
  service_name: string;
  date: string;
  time: string;
  notes: string | null;
  status: string;
  created_at: string;
  email: string | null;
  area_code: string | null;
  reminder_at: string | null;
};

function mapBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    serviceId: r.service_id,
    serviceName: r.service_name,
    date: r.date,
    time: r.time,
    notes: r.notes ?? undefined,
    email: r.email ?? "",
    areaCode: r.area_code ?? "+52",
    reminderAt: r.reminder_at,
    status: r.status as BookingStatus,
    createdAt: r.created_at,
  };
}

/** Disponibilidad pública (sin PII) de un rango de fechas, con realtime. */
export function subscribeAvailability(
  from: string,
  to: string,
  cb: (list: BusySlot[]) => void,
) {
  let active = true;
  const load = async () => {
    const { data } = await supabase.rpc("get_availability", { _from: from, _to: to });
    if (!active) return;
    cb(
      (data ?? []).map((r) => ({
        id: r.id,
        date: r.date,
        time: r.time,
        serviceId: r.service_id,
        status: r.status as BookingStatus,
      })),
    );
  };
  load();
  const channel = supabase
    .channel(`availability-${from}-${to}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

/** Todas las reservas (solo dueña autenticada), con realtime. */
export function subscribeAllBookings(cb: (list: Booking[]) => void) {
  let active = true;
  const load = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (active) cb(((data ?? []) as BookingRow[]).map(mapBooking));
  };
  load();
  const channel = supabase
    .channel("bookings-admin")
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export function subscribeBlocks(cb: (list: Block[]) => void) {
  let active = true;
  const load = async () => {
    const { data } = await supabase.from("blocks").select("*");
    if (active)
      cb((data ?? []).map((b) => ({ id: b.id, date: b.date, time: b.time || undefined })));
  };
  load();
  const channel = supabase
    .channel("blocks-all")
    .on("postgres_changes", { event: "*", schema: "public", table: "blocks" }, () => load())
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function createBooking(
  b: Omit<Booking, "id" | "status" | "createdAt">,
): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("bookings")
    .insert({
      id,
      name: b.name,
      phone: b.phone,
      service_id: b.serviceId,
      service_name: b.serviceName,
      date: b.date,
      time: b.time,
      notes: b.notes ?? null,
      email: b.email,
      area_code: b.areaCode,
      status: "pending",
    });
  if (error) throw new Error(error.message);
  return { id };
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setBookingReminder(id: string, reminderAt: string | null) {
  const { error } = await supabase.from("bookings").update({ reminder_at: reminderAt }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function rescheduleBooking(id: string, date: string, time: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ date, time, status: "reprogramada" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeBooking(id: string) {
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addBlock(date: string, time?: string) {
  const { error } = await supabase.from("blocks").insert({ date, time: time ?? "" });
  if (error) throw new Error(error.message);
}

export async function removeBlock(id: string) {
  const { error } = await supabase.from("blocks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Genera los slots del día basado en horario semanal
export function generateSlots(date: string): string[] {
  const d = new Date(date + "T00:00:00");
  const dayOfWeek = d.getDay();
  const hours = WEEKLY_HOURS[dayOfWeek];
  if (!hours) return [];
  const slots: string[] = [];
  const [sh, sm] = hours.start.split(":").map(Number);
  const [eh, em] = hours.end.split(":").map(Number);
  let mins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  while (mins + SLOT_MINUTES <= endMins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    mins += SLOT_MINUTES;
  }
  return slots;
}

/** Slots a partir de la tabla horas_disponibles (si hay filas para ese día). */
export function slotsFromHoras(
  horas: Array<{ hora: string; dia_semana: number | null; activo: boolean }>,
  date: string,
): string[] {
  const dow = new Date(date + "T00:00:00").getDay();
  const list = horas
    .filter((h) => h.activo && (h.dia_semana === null || h.dia_semana === dow))
    .map((h) => h.hora);
  return Array.from(new Set(list)).sort();
}

export function isSlotTaken(
  time: string,
  durationMin: number,
  busy: Array<{ date: string; time: string; serviceId: string; status: BookingStatus }>,
  blocks: Block[],
  date: string,
  durationById: Record<string, number> = {},
): boolean {
  if (blocks.some((b) => b.date === date && !b.time)) return true;
  if (blocks.some((b) => b.date === date && b.time === time)) return true;
  const [h, m] = time.split(":").map(Number);
  const startMins = h * 60 + m;
  const endMins = startMins + durationMin;
  return busy.some((b) => {
    if (b.date !== date || b.status === "cancelled") return false;
    const bDur =
      durationById[b.serviceId] ?? SERVICES.find((s) => s.id === b.serviceId)?.duration ?? 60;
    const [bh, bm] = b.time.split(":").map(Number);
    const bStart = bh * 60 + bm;
    const bEnd = bStart + bDur;
    return startMins < bEnd && endMins > bStart;
  });
}


export function buildWhatsappUrl(
  booking: {
    name: string;
    phone: string;
    serviceName: string;
    date: string;
    time: string;
    notes?: string;
    email?: string;
    areaCode?: string;
  },
  targetPhone?: string,
) {
  const msg =
    `Hola! Quiero confirmar mi reserva en ${BUSINESS.name}:\n\n` +
    `👤 ${booking.name}\n` +
    `📞 ${booking.areaCode ?? ""} ${booking.phone}\n` +
    (booking.email ? `✉️ ${booking.email}\n` : "") +
    `💇 Servicio: ${booking.serviceName}\n` +
    `📅 ${booking.date} a las ${booking.time}\n` +
    (booking.notes ? `📝 Notas: ${booking.notes}\n` : "") +
    `\n¡Gracias!`;
  const to = (targetPhone ?? BUSINESS.whatsapp).replace(/[^0-9]/g, "");
  return `https://wa.me/${to}?text=${encodeURIComponent(msg)}`;
}

/** Mensaje que la dueña envía al cliente al aceptar / cancelar / reprogramar. */
export function buildClientWhatsappUrl(
  booking: { name: string; phone: string; areaCode: string; serviceName: string; date: string; time: string },
  estado: "aceptada" | "cancelada" | "reprogramada" | "recordatorio",
) {
  const textos: Record<typeof estado, string> = {
    aceptada: `¡Hola ${booking.name}! Tu cita de ${booking.serviceName} quedó CONFIRMADA para el ${booking.date} a las ${booking.time}. ¡Te esperamos en ${BUSINESS.name}!`,
    cancelada: `Hola ${booking.name}, lamentamos informarte que tu cita de ${booking.serviceName} del ${booking.date} a las ${booking.time} fue cancelada. Escríbenos para reagendar.`,
    reprogramada: `Hola ${booking.name}, tu cita de ${booking.serviceName} se reprogramó para el ${booking.date} a las ${booking.time}. ¿Te queda bien?`,
    recordatorio: `Hola ${booking.name}! Te recordamos tu cita de ${booking.serviceName} el ${booking.date} a las ${booking.time}. ¡Te esperamos!`,
  };
  const to = `${booking.areaCode}${booking.phone}`.replace(/[^0-9]/g, "");
  return `https://wa.me/${to}?text=${encodeURIComponent(textos[estado])}`;
}

