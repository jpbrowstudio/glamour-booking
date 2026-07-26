import { createFileRoute, Link } from "@tanstack/react-router";
import { BUSINESS } from "../lib/config";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: `Política de Cookies — ${BUSINESS.name}` },
      { name: "description", content: "Cómo usamos cookies en nuestro sitio web." },
      { property: "og:title", content: `Política de Cookies — ${BUSINESS.name}` },
      { property: "og:description", content: "Cómo usamos cookies en nuestro sitio web." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  const reset = () => {
    try {
      localStorage.removeItem("cookies-consent-v1");
      window.location.reload();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="text-sm underline">← Volver</Link>
        <h1 className="mt-4 font-serif text-3xl md:text-4xl">Política de Cookies</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString("es-MX")}
        </p>

        <div className="mt-8 space-y-5 text-sm leading-relaxed text-foreground/90">
          <p>
            Este sitio utiliza cookies y tecnologías similares (como <em>localStorage</em>) para
            recordar tus preferencias y hacer que la experiencia sea más ágil.
          </p>

          <h2 className="font-serif text-xl">1. Cookies esenciales</h2>
          <p>
            Necesarias para el funcionamiento del sitio: guardar tu preferencia de consentimiento y
            mantener tu sesión si accedes al panel privado. No requieren tu autorización.
          </p>

          <h2 className="font-serif text-xl">2. Cookies de terceros</h2>
          <p>
            Utilizamos servicios de <strong>Google Firebase</strong> (Authentication y Firestore) para
            gestionar las reservas. Estos servicios pueden establecer cookies técnicas necesarias
            para su funcionamiento.
          </p>

          <h2 className="font-serif text-xl">3. Tu consentimiento</h2>
          <p>
            Al ingresar al sitio verás un banner donde puedes aceptar todas las cookies o solo las
            esenciales. Puedes cambiar tu preferencia en cualquier momento:
          </p>
          <button
            onClick={reset}
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent/20"
          >
            Restablecer preferencias de cookies
          </button>

          <h2 className="font-serif text-xl">4. Más información</h2>
          <p>
            Consulta también nuestra <Link to="/politica" className="underline">Política de Privacidad</Link>{" "}
            o escríbenos a <a href={`mailto:${BUSINESS.adminEmail}`} className="underline">{BUSINESS.adminEmail}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
