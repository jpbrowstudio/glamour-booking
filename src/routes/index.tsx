import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Calendar, Sparkles, Eye, Instagram, MapPin } from "lucide-react";
import hero from "../assets/hero.jpg";
import w1 from "../assets/work-1.jpg";
import w2 from "../assets/work-2.jpg";
import w3 from "../assets/work-3.jpg";
import w4 from "../assets/work-4.jpg";
import logo from "../assets/jp-brows-logo.jpg.asset.json";
import { BUSINESS } from "../lib/config";
import { buildWhatsappUrl } from "../lib/booking";
import {
  type ImagenCarrusel,
  type Servicio,
  type UsuarioAdmin,
  getUsuarioActivo,
  listCarrusel,
  listServicios,
} from "../lib/catalogo";
import { InstagramCarousel } from "../components/instagram-carousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BUSINESS.name} — Cejas y Pestañas` },
      { name: "description", content: BUSINESS.description },
      { property: "og:title", content: `${BUSINESS.name} — ${BUSINESS.tagline}` },
      { property: "og:description", content: BUSINESS.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const IMAGES = [
  { src: w1, alt: "Ceja laminada y perfilada" },
  { src: w3, alt: "Cabina del studio de cuidados" },
  { src: w2, alt: "Pestañas con lifting y volumen" },
  { src: w4, alt: "Herramientas de cejas y pestañas" },
];


function Landing() {
  const [slide, setSlide] = useState(0);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [galeria, setGaleria] = useState<ImagenCarrusel[]>([]);
  const [owner, setOwner] = useState<UsuarioAdmin | null>(null);

  useEffect(() => {
    listServicios(true).then(setServicios).catch(() => undefined);
    listCarrusel(true).then(setGaleria).catch(() => undefined);
    getUsuarioActivo().then(setOwner).catch(() => undefined);
  }, []);

  const refirmar = async (id: number) => {
    const img = galeria.find((g) => g.id_imagen === id);
    if (!img) return;
    const url = await signImagenUrl(img).catch(() => null);
    if (!url || url === img.imagen_url) return;
    setGaleria((prev) =>
      prev.map((g) => (g.id_imagen === id ? { ...g, imagen_url: url } : g)),
    );
  };

  const images =
    galeria.length > 0
      ? galeria.map((g) => ({
          src: g.imagen_url,
          alt: g.titulo || "Trabajo del studio",
          id: g.id_imagen,
        }))
      : IMAGES.map((i, idx) => ({ ...i, id: -1 - idx }));

  useEffect(() => {
    setSlide(0);
  }, [galeria.length]);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);

  const waPhone = (owner?.telefono ?? BUSINESS.whatsapp).replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    owner?.msn_whatsapp ?? `Hola ${BUSINESS.name}! Me gustaría hacer una consulta.`,
  )}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo.url}
              alt={`Logo ${BUSINESS.name}`}
              className="h-10 w-10 rounded-full object-cover"
              width={40}
              height={40}
            />
            <span className="font-serif text-lg tracking-wide">{BUSINESS.name}</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm md:flex">
            <a href="#trabajo" className="hover:text-accent">Trabajo</a>
            <a href="#servicios" className="hover:text-accent">Servicios</a>
            <a href="#instagram" className="hover:text-accent">Instagram</a>
            <a href="#contacto" className="hover:text-accent">Contacto</a>
            <Link to="/reservar" className="rounded-full bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">
              Reservar cita
            </Link>
          </div>
          <Link to="/reservar" className="rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground md:hidden">
            Reservar
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 md:items-center md:py-20">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> Studio de cuidados · Cejas & Pestañas
            </p>
            <h1 className="font-serif text-4xl leading-tight md:text-6xl">
              {BUSINESS.tagline}
            </h1>
            <p className="max-w-md text-muted-foreground">{BUSINESS.description}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/reservar"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground shadow-md hover:opacity-90"
              >
                <Calendar className="h-4 w-4" /> Reservar cita
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 hover:bg-accent/20"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl">
            <img src={hero} alt="Studio de cuidados de cejas y pestañas" className="h-full w-full object-cover" width={1200} height={1500} />
          </div>
        </div>
      </section>

      {/* CARRUSEL DE TRABAJO */}
      <section id="trabajo" className="border-t border-border/40 bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-accent">Portafolio</p>
              <h2 className="font-serif text-3xl md:text-4xl">Nuestro trabajo</h2>
            </div>
            <div className="hidden gap-1 md:flex">
              {images.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Ir a slide ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${slide === i ? "w-8 bg-primary" : "w-3 bg-border"}`}
                />
              ))}
            </div>
          </div>

          {/* carrusel principal */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-card shadow-lg">
            {images.map((img, i) => (
              <img
                key={img.src}
                src={img.src}
                alt={img.alt}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  slide === i ? "opacity-100" : "opacity-0"
                }`}
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))}
          </div>

          {/* grid mini */}
          <div className="mt-4 grid grid-cols-4 gap-2 md:gap-4">
            {images.map((img, i) => (
              <button
                key={img.src}
                onClick={() => setSlide(i)}
                className={`aspect-square overflow-hidden rounded-xl transition-all ${
                  slide === i ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100"
                }`}
              >
                <img src={img.src} alt={img.alt} className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <InstagramCarousel />


      {/* SERVICIOS */}
      <section id="servicios" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-widest text-accent">Servicios</p>
            <h2 className="font-serif text-3xl md:text-4xl">Lo que ofrecemos</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {servicios.map((s) => (
              <div
                key={s.id_servicio}
                className="group rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Eye className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-muted-foreground">{s.duracion_min} min</span>
                </div>
                <h3 className="font-serif text-xl">{s.nombre_s}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.detalle_s}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-serif text-2xl">${s.precio_s}</span>
                  <Link
                    to="/reservar"
                    search={{ service: String(s.id_servicio) }}
                    className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
                  >
                    Reservar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA RESERVA */}
      <section id="reservar" className="border-t border-border/40 bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs uppercase tracking-widest opacity-80">Reserva en línea</p>
          <h2 className="mt-2 font-serif text-3xl md:text-5xl">Agenda tu cita</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">
            Elige día y hora en tiempo real. La confirmación llega directamente al WhatsApp de la dueña.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/reservar"
              className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-foreground hover:opacity-90"
            >
              <Calendar className="h-4 w-4" /> Abrir calendario
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-6 py-3 hover:bg-primary-foreground/10"
            >
              <MessageCircle className="h-4 w-4" /> Preguntar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Contacto</p>
            <h2 className="mt-2 font-serif text-3xl">Estamos para atenderte</h2>
            <p className="mt-4 text-muted-foreground">
              Escríbenos por WhatsApp para consultas rápidas o reserva tu cita en línea cuando quieras.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-accent" /> {owner?.telefono ? `+${owner.telefono}` : BUSINESS.whatsappDisplay}
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-accent" /> {BUSINESS.location}
              </li>
              <li className="flex items-center gap-3">
                <Instagram className="h-4 w-4 text-accent" />{" "}
                <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" className="underline">
                  Síguenos en Instagram
                </a>
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="font-serif text-xl">Horario</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between"><span>Lunes a Miércoles</span><span>10:00 – 19:00</span></li>
              <li className="flex justify-between"><span>Jueves y Viernes</span><span>10:00 – 20:00</span></li>
              <li className="flex justify-between"><span>Sábado</span><span>09:00 – 17:00</span></li>
              <li className="flex justify-between"><span>Domingo</span><span>Cerrado</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/40 bg-muted/50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} {BUSINESS.name}. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link to="/politica" className="hover:text-foreground">Privacidad</Link>
            <Link to="/terminos" className="hover:text-foreground">Términos</Link>
            <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
          </div>
        </div>
      </footer>

      {/* FLOAT WHATSAPP */}
      <a
        href={waUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}

// helper para tipar search param
export const _helper = buildWhatsappUrl;
