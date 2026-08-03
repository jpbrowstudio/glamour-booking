// Configuración del negocio - edítalo aquí
export const BUSINESS = {
  name: "JP Brows Studio",
  tagline: "La mirada es tu mejor detalle",
  description:
    "Studio de cuidados especializado en cejas y pestañas: diseño, laminado, lifting y extensiones con técnica precisa y productos premium.",
  whatsapp: "52613128937", // Sin + ni espacios. Formato E.164 para wa.me
  whatsappDisplay: "+52 613 128 937",
  adminEmail: "alemina0610@gmail.com",
  instagram: "https://instagram.com/",
  location: "México",
};

export const SERVICES = [
  { id: "diseno-cejas", name: "Diseño de cejas", duration: 45, price: "$250", desc: "Visagismo, depilación con hilo o cera y perfilado a medida." },
  { id: "laminado", name: "Laminado de cejas", duration: 60, price: "$650", desc: "Alisado y fijación del vello para una ceja llena y peinada." },
  { id: "henna", name: "Henna / tinte de cejas", duration: 45, price: "$350", desc: "Color natural que define y rellena zonas sin vello." },
  { id: "lifting", name: "Lifting de pestañas", duration: 60, price: "$700", desc: "Curvatura y elevación con nutrición y tinte incluido." },
  { id: "extensiones", name: "Extensiones de pestañas", duration: 120, price: "$900", desc: "Pelo a pelo, híbridas o volumen ruso según tu estilo." },
  { id: "ritual-mirada", name: "Ritual de mirada completo", duration: 150, price: "$1,400", desc: "Laminado + henna + lifting: el cuidado integral del studio." },
];

// Publicaciones de Instagram (edítalas aquí: pega el enlace del post y una imagen)
import ig1 from "../assets/work-1.jpg";
import ig2 from "../assets/work-2.jpg";
import ig3 from "../assets/work-3.jpg";
import ig4 from "../assets/work-4.jpg";
import ig5 from "../assets/hero.jpg";

export const INSTAGRAM_POSTS = [
  { id: "ig-1", image: ig1, caption: "Laminado de cejas: volumen y peinado natural que dura semanas.", url: "https://instagram.com/" },
  { id: "ig-2", image: ig2, caption: "Lifting de pestañas con nutrición y tinte incluido.", url: "https://instagram.com/" },
  { id: "ig-3", image: ig3, caption: "Nuestra cabina: un espacio tranquilo para tu ritual de mirada.", url: "https://instagram.com/" },
  { id: "ig-4", image: ig4, caption: "Producto premium y herramientas esterilizadas en cada servicio.", url: "https://instagram.com/" },
  { id: "ig-5", image: ig5, caption: "Diseño de cejas a medida según tu visagismo.", url: "https://instagram.com/" },
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
