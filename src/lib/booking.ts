import { BUSINESS, SLOT_MINUTES, WEEKLY_HOURS, SERVICES } from "./config";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
  id: string;
  name: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  status: BookingStatus;
  createdAt?: number;
}

export interface Block {
  id: string;
  date: string;
  time?: string; // si está vacío, día completo bloqueado
}

const BOOKINGS_KEY = "jp-brows:bookings";
const BLOCKS_KEY = "jp-brows:blocks";
const EVENT = "jp-brows:store-change";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, list: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVENT));
}

function subscribe<T>(key: string, map: (list: T[]) => T[], cb: (list: T[]) => void) {
  const emit = () => cb(map(read<T>(key)));
  emit();
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, emit);
  window.addEventListener("storage", emit);
  return () => {
    window.removeEventListener(EVENT, emit);
    window.removeEventListener("storage", emit);
  };
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function subscribeBookingsByDate(date: string, cb: (list: Booking[]) => void) {
  return subscribe<Booking>(BOOKINGS_KEY, (list) => list.filter((b) => b.date === date), cb);
}

export function subscribeAllBookings(cb: (list: Booking[]) => void) {
  return subscribe<Booking>(
    BOOKINGS_KEY,
    (list) => [...list].sort((a, b) => a.date.localeCompare(b.date)),
    cb,
  );
}

export function subscribeBlocks(cb: (list: Block[]) => void) {
  return subscribe<Block>(BLOCKS_KEY, (list) => list, cb);
}

export async function createBooking(
  b: Omit<Booking, "id" | "status" | "createdAt">,
): Promise<{ id: string }> {
  const list = read<Booking>(BOOKINGS_KEY);
  const booking: Booking = { ...b, id: uid(), status: "pending", createdAt: Date.now() };
  write(BOOKINGS_KEY, [...list, booking]);
  return { id: booking.id };
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const list = read<Booking>(BOOKINGS_KEY);
  write(
    BOOKINGS_KEY,
    list.map((b) => (b.id === id ? { ...b, status } : b)),
  );
}

export async function removeBooking(id: string) {
  write(
    BOOKINGS_KEY,
    read<Booking>(BOOKINGS_KEY).filter((b) => b.id !== id),
  );
}

export async function addBlock(date: string, time?: string) {
  write(BLOCKS_KEY, [...read<Block>(BLOCKS_KEY), { id: uid(), date, time: time ?? "" }]);
}

export async function removeBlock(id: string) {
  write(
    BLOCKS_KEY,
    read<Block>(BLOCKS_KEY).filter((b) => b.id !== id),
  );
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

export function isSlotTaken(
  time: string,
  serviceId: string,
  bookings: Booking[],
  blocks: Block[],
  date: string,
): boolean {
  if (blocks.some((b) => b.date === date && !b.time)) return true;
  if (blocks.some((b) => b.date === date && b.time === time)) return true;
  const service = SERVICES.find((s) => s.id === serviceId);
  const duration = service?.duration ?? 60;
  const [h, m] = time.split(":").map(Number);
  const startMins = h * 60 + m;
  const endMins = startMins + duration;
  return bookings.some((b) => {
    if (b.status === "cancelled") return false;
    const svc = SERVICES.find((s) => s.id === b.serviceId);
    const bDur = svc?.duration ?? 60;
    const [bh, bm] = b.time.split(":").map(Number);
    const bStart = bh * 60 + bm;
    const bEnd = bStart + bDur;
    return startMins < bEnd && endMins > bStart;
  });
}

export function buildWhatsappUrl(booking: {
  name: string;
  phone: string;
  serviceName: string;
  date: string;
  time: string;
  notes?: string;
}) {
  const msg =
    `Hola! Quiero confirmar mi reserva en ${BUSINESS.name}:\n\n` +
    `👤 ${booking.name}\n` +
    `📞 ${booking.phone}\n` +
    `💇 Servicio: ${booking.serviceName}\n` +
    `📅 ${booking.date} a las ${booking.time}\n` +
    (booking.notes ? `📝 Notas: ${booking.notes}\n` : "") +
    `\n¡Gracias!`;
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(msg)}`;
}
