// Configuración del negocio - edítalo aquí
export const BUSINESS = {
  name: "Ale Mina",
  tagline: "Realza tu belleza natural",
  description:
    "Estudio de peinados, cejas y maquillaje. Estilo, cuidado y elegancia en cada cita.",
  whatsapp: "52613128937", // Sin + ni espacios. Formato E.164 para wa.me
  whatsappDisplay: "+52 613 128 937",
  adminEmail: "alemina0610@gmail.com",
  instagram: "https://instagram.com/",
  location: "México",
};

export const SERVICES = [
  { id: "peinado", name: "Peinado", duration: 60, price: "$450", desc: "Ondas, planchado, recogidos casuales y de evento." },
  { id: "peinado-novia", name: "Peinado de novia", duration: 90, price: "$1,200", desc: "Prueba + diseño personalizado para tu día especial." },
  { id: "cejas", name: "Diseño de cejas", duration: 30, price: "$200", desc: "Depilación, tinte y perfilado según tu rostro." },
  { id: "maquillaje", name: "Maquillaje", duration: 60, price: "$650", desc: "Social, glam o natural. Larga duración." },
  { id: "paquete-novia", name: "Paquete novia completo", duration: 150, price: "$2,200", desc: "Peinado + maquillaje + cejas para el gran día." },
];

// Horario disponible por día (formato 24h). La dueña puede bloquear días/horas desde el panel.
export const WEEKLY_HOURS: Record<number, { start: string; end: string } | null> = {
  0: null, // domingo cerrado
  1: { start: "10:00", end: "19:00" },
  2: { start: "10:00", end: "19:00" },
  3: { start: "10:00", end: "19:00" },
  4: { start: "10:00", end: "20:00" },
  5: { start: "10:00", end: "20:00" },
  6: { start: "09:00", end: "17:00" },
};

export const SLOT_MINUTES = 30;
