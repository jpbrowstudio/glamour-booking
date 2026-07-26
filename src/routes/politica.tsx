import { createFileRoute, Link } from "@tanstack/react-router";
import { BUSINESS } from "../lib/config";

export const Route = createFileRoute("/politica")({
  head: () => ({
    meta: [
      { title: `Política de Privacidad — ${BUSINESS.name}` },
      { name: "description", content: "Cómo tratamos tus datos personales." },
      { property: "og:title", content: `Política de Privacidad — ${BUSINESS.name}` },
      { property: "og:description", content: "Cómo tratamos tus datos personales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LegalPage title="Política de Privacidad" />,
});

function LegalPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="text-sm underline">← Volver</Link>
        <h1 className="mt-4 font-serif text-3xl md:text-4xl">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString("es-MX")}
        </p>

        <div className="prose prose-neutral mt-8 max-w-none text-sm leading-relaxed text-foreground/90">
          <p>
            En <strong>{BUSINESS.name}</strong> valoramos tu privacidad. Este documento explica qué
            datos personales recopilamos, con qué finalidad y cuáles son tus derechos.
          </p>

          <h2 className="mt-6 font-serif text-xl">1. Responsable</h2>
          <p>
            {BUSINESS.name} — Contacto: {BUSINESS.adminEmail} · WhatsApp {BUSINESS.whatsappDisplay}.
          </p>

          <h2 className="mt-6 font-serif text-xl">2. Datos que recopilamos</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>Nombre y teléfono al reservar una cita.</li>
            <li>Servicio seleccionado, fecha y hora de la reserva.</li>
            <li>Notas opcionales que decidas compartir.</li>
          </ul>

          <h2 className="mt-6 font-serif text-xl">3. Finalidad</h2>
          <p>
            Los datos se utilizan exclusivamente para gestionar tu cita, confirmarla por WhatsApp y
            contactarte en caso de cambios. No los compartimos con terceros con fines comerciales.
          </p>

          <h2 className="mt-6 font-serif text-xl">4. Conservación</h2>
          <p>
            Conservamos las reservas por un plazo razonable para historial y facturación. Puedes
            solicitar su eliminación en cualquier momento.
          </p>

          <h2 className="mt-6 font-serif text-xl">5. Tus derechos</h2>
          <p>
            Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos escribiendo a{" "}
            <a href={`mailto:${BUSINESS.adminEmail}`} className="underline">{BUSINESS.adminEmail}</a>.
          </p>

          <h2 className="mt-6 font-serif text-xl">6. Seguridad</h2>
          <p>
            Almacenamos tus datos en servicios seguros de Google Firebase, con acceso restringido
            únicamente al personal autorizado.
          </p>

          <p className="mt-8 text-xs text-muted-foreground">
            Al reservar aceptas esta política y nuestros{" "}
            <Link to="/terminos" className="underline">Términos</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
