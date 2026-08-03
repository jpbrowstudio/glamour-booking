import { useRef } from "react";
import { Instagram, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { BUSINESS, INSTAGRAM_POSTS } from "../lib/config";

export function InstagramCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section id="instagram" className="border-t border-border/40 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Instagram</p>
            <h2 className="font-serif text-3xl md:text-4xl">Últimas publicaciones</h2>
            <a
              href={BUSINESS.instagram}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
            >
              <Instagram className="h-4 w-4" /> Síguenos en Instagram
            </a>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => scrollBy(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-accent/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => scrollBy(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-accent/20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {INSTAGRAM_POSTS.map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noreferrer"
              className="group w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md sm:w-72"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={post.image}
                  alt={post.caption}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur">
                  <Instagram className="h-4 w-4" />
                </span>
              </div>
              <div className="space-y-2 p-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">{post.caption}</p>
                <span className="inline-flex items-center gap-1 text-xs text-accent">
                  <Heart className="h-3 w-3" /> Ver en Instagram
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
