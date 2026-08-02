import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "./firebase";
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
  createdAt?: Timestamp;
}

export interface Block {
  id: string;
  date: string;
  time?: string; // if empty, whole day blocked
}

const BOOKINGS = "bookings";
const BLOCKS = "blocks";

export function subscribeBookingsByDate(
  date: string,
  cb: (list: Booking[]) => void,
) {
  const db = getDb();
  if (!db) {
    cb([]);
    return () => {};
  }
  const q = query(collection(db, BOOKINGS), where("date", "==", date));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }));
    cb(list);
  });
}

export function subscribeAllBookings(cb: (list: Booking[]) => void) {
  const db = getDb();
  if (!db) {
    cb([]);
    return () => {};
  }
  const q = query(collection(db, BOOKINGS), orderBy("date", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) })));
  });
}

export function subscribeBlocks(cb: (list: Block[]) => void) {
  const db = getDb();
  if (!db) {
    cb([]);
    return () => {};
  }
  return onSnapshot(collection(db, BLOCKS), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Block, "id">) })));
  });
}

export async function createBooking(b: Omit<Booking, "id" | "status" | "createdAt">) {
  const db = getDb();
  if (!db) throw new Error("Firebase no está configurado. Añade tus credenciales en src/lib/firebase.ts.");
  const write = addDoc(collection(db, BOOKINGS), {
    ...b,
    status: "pending" as BookingStatus,
    createdAt: serverTimestamp(),
  });
  // Firestore deja la promesa pendiente para siempre si la base de datos no
  // existe, está offline o las reglas bloquean el write. Cortamos a los 12s.
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            "No se pudo guardar la reserva: revisa que Firestore esté creado en el proyecto salon-946b4 y que las reglas permitan crear en 'bookings'.",
          ),
        ),
      12000,
    ),
  );
  return Promise.race([write, timeout]);
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const db = getDb();
  if (!db) throw new Error("Firebase no configurado");
  return updateDoc(doc(db, BOOKINGS, id), { status });
}

export async function removeBooking(id: string) {
  const db = getDb();
  if (!db) throw new Error("Firebase no configurado");
  return deleteDoc(doc(db, BOOKINGS, id));
}

export async function addBlock(date: string, time?: string) {
  const db = getDb();
  if (!db) throw new Error("Firebase no configurado");
  return addDoc(collection(db, BLOCKS), { date, time: time ?? "" });
}

export async function removeBlock(id: string) {
  const db = getDb();
  if (!db) throw new Error("Firebase no configurado");
  return deleteDoc(doc(db, BLOCKS, id));
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
  // día bloqueado completo
  if (blocks.some((b) => b.date === date && !b.time)) return true;
  // hora bloqueada
  if (blocks.some((b) => b.date === date && b.time === time)) return true;
  const service = SERVICES.find((s) => s.id === serviceId);
  const duration = service?.duration ?? 60;
  const [h, m] = time.split(":").map(Number);
  const startMins = h * 60 + m;
  const endMins = startMins + duration;
  // colisión con reservas existentes (no canceladas)
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
