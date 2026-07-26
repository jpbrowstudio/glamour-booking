import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "cookies-consent-v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {}
  }, []);

  const accept = (value: "all" | "essential") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card/95 p-4 shadow-xl backdrop-blur">
        <p className="text-sm text-foreground">
          Usamos cookies esenciales para el funcionamiento del sitio y, con tu consentimiento,
          cookies para mejorar tu experiencia. Lee nuestra{" "}
          <Link to="/cookies" className="underline underline-offset-2">
            Política de Cookies
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => accept("all")}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Aceptar todas
          </button>
          <button
            onClick={() => accept("essential")}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent/20"
          >
            Solo esenciales
          </button>
        </div>
      </div>
    </div>
  );
}
