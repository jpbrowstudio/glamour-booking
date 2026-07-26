import { createFileRoute, Link } from "@tanstack/react-router";
import { BUSINESS } from "../lib/config";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: `Términos y Condiciones — ${BUSINESS.name}` },
      { name: "description", content: "Condiciones de uso del sitio y del servicio de reservas." },
      { property: "og:title", content: `Términos y Condiciones — ${BUSINESS.name}` },
      { property: "og:description", content: "Condiciones de uso del sitio y del servicio de reservas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TerminosPage,
});

function TerminosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="text-sm underline">← Volver</Link>
        <h1 className="mt-4 font-serif text-3xl md:text-4xl">Términos y Condiciones</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString("es-MX")}
        </p>

        <div className="mt-8 space-y-5 text-sm leading-relaxed text-foreground/90">
          <p>
            Al utilizar el sitio de <strong>{BUSINESS.name}</strong> y su sistema de reservas, aceptas
            las siguientes condiciones.
          </p>

          <h2 className="font-serif text-xl">1. Reservas</h2>
          <p>
            Las reservas realizadas en el sitio quedan en estado <em>pendiente</em> hasta que
            {" "}{BUSINESS.name} las confirme por WhatsApp. Un horario reservado no garantiza la cita
            hasta la confirmación explícita.
          </p>

          <h2 className="font-serif text-xl">2. Cancelaciones y cambios</h2>
          <p>
            Te pedimos avisar con al menos 24 horas de anticipación para cancelar o reprogramar. Las
            cancelaciones tardías reiteradas pueden restringir el uso del servicio.
          </p>

          <h2 className="font-serif text-xl">3. Puntualidad</h2>
          <p>
            Un retraso mayor a 15 minutos puede requerir reprogramar la cita para respetar el
            horario de las demás clientas.
          </p>

          <h2 className="font-serif text-xl">4. Precios</h2>
          <p>
            Los precios mostrados son de referencia y pueden variar según el largo del cabello,
            productos especiales o servicios adicionales.
          </p>

          <h2 className="font-serif text-xl">5. Salud y alergias</h2>
          <p>
            Es responsabilidad de la clienta informar sobre alergias, tratamientos previos o
            condiciones médicas relevantes antes del servicio.
          </p>

          <h2 className="font-serif text-xl">6. Propiedad intelectual</h2>
          <p>
            Las imágenes y contenidos del sitio son propiedad de {BUSINESS.name}. Está prohibida su
            reproducción sin autorización.
          </p>

          <h2 className="font-serif text-xl">7. Contacto</h2>
          <p>
            Cualquier duda: <a href={`mailto:${BUSINESS.adminEmail}`} className="underline">{BUSINESS.adminEmail}</a>.
          </p>

          <p className="mt-8 text-xs text-muted-foreground">
            Consulta también nuestra <Link to="/politica" className="underline">Política de Privacidad</Link> y{" "}
            <Link to="/cookies" className="underline">Política de Cookies</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
