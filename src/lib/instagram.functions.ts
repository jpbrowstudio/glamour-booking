import { createServerFn } from "@tanstack/react-start";

export type InstagramFeedItem = {
  id: string;
  image: string;
  caption: string;
  url: string;
  timestamp: string;
};

export type InstagramFeedResult = {
  posts: InstagramFeedItem[];
  error: string | null;
};

/**
 * Trae las últimas publicaciones desde la API de Instagram (cuenta profesional).
 * Requiere el secreto INSTAGRAM_ACCESS_TOKEN (token de larga duración).
 */
export const getInstagramFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<InstagramFeedResult> => {
    const token = process.env["INSTAGRAM_ACCESS_TOKEN"];
    if (!token) return { posts: [], error: "missing-token" };

    const fields =
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${encodeURIComponent(token)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        console.error(`Instagram API error [${res.status}]: ${body}`);
        return { posts: [], error: `instagram-${res.status}` };
      }
      const json = (await res.json()) as {
        data?: Array<{
          id: string;
          caption?: string;
          media_type: string;
          media_url?: string;
          thumbnail_url?: string;
          permalink: string;
          timestamp: string;
        }>;
      };

      const posts: InstagramFeedItem[] = (json.data ?? [])
        .map((m) => ({
          id: m.id,
          image: m.media_type === "VIDEO" ? (m.thumbnail_url ?? "") : (m.media_url ?? ""),
          caption: m.caption ?? "JP Brows Studio",
          url: m.permalink,
          timestamp: m.timestamp,
        }))
        .filter((m) => m.image.length > 0);

      return { posts, error: null };
    } catch (err) {
      console.error("Instagram fetch failed", err);
      return { posts: [], error: "network" };
    }
  },
);
